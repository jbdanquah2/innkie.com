import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const possibleNames = [
  process.env['SERVICE_ACCOUNT_FILE_NAME'],
  'linkifyUrl-service-account.json',
  'linkify-url-service-account.json'
];

let serviceAccountPath = '';
for (const name of possibleNames) {
  if (!name) continue;
  const p = path.join(__dirname, '..', 'service-account', name);
  if (fs.existsSync(p)) {
    serviceAccountPath = p;
    break;
  }
}

if (!serviceAccountPath) {
  console.error(`❌ Service account file not found. Checked: ${possibleNames.join(', ')}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function migrate() {
  console.log('🚀 Starting Workspace Migration...');

  // 1. Fetch all shortUrls
  console.log('--- Fetching all links...');
  const linksSnapshot = await db.collection('shortUrls').get();
  console.log(`Found ${linksSnapshot.size} total links.`);

  const userStats: Record<string, { totalUrls: number, totalClicks: number, email?: string }> = {};
  let updatedLinks = 0;

  const batch = db.batch();
  let batchCount = 0;

  for (const doc of linksSnapshot.docs) {
    const data = doc.data();
    const userId = data['userId'];
    const workspaceId = data['workspaceId'];
    const clicks = data['clickCount'] || 0;

    if (!userId) {
      console.warn(`⚠️ Link ${doc.id} has no userId, skipping...`);
      continue;
    }

    // Determine if it's a legacy link
    const isLegacy = !workspaceId || workspaceId === 'personal';
    const newWorkspaceId = `personal_${userId}`;

    if (isLegacy) {
      batch.update(doc.ref, { 
        workspaceId: newWorkspaceId,
        updatedAt: admin.firestore.Timestamp.now()
      });
      updatedLinks++;
      batchCount++;
    }

    // Aggregate stats
    if (!userStats[userId]) {
      userStats[userId] = { totalUrls: 0, totalClicks: 0 };
    }
    userStats[userId].totalUrls += 1;
    userStats[userId].totalClicks += Number(clicks);

    // Commit batch if it reaches limit
    if (batchCount >= 400) {
      await batch.commit();
      console.log(`✅ Committed batch of ${batchCount} link updates.`);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`✅ Committed final batch of ${batchCount} link updates.`);
  }

  console.log(`📊 Updated ${updatedLinks} links to new workspace IDs.`);

  // 1.5 Migrate QR Templates
  console.log('--- Migrating QR Templates...');
  const templatesSnapshot = await db.collection('qr-templates').get();
  let updatedTemplates = 0;
  const templateBatch = db.batch();

  for (const doc of templatesSnapshot.docs) {
    const data = doc.data();
    const ownerId = data['ownerId'];
    const workspaceId = data['workspaceId'];

    if (!ownerId) continue;

    const isLegacy = !workspaceId || workspaceId === 'personal';
    if (isLegacy) {
      templateBatch.update(doc.ref, {
        workspaceId: `personal_${ownerId}`,
        updatedAt: admin.firestore.Timestamp.now()
      });
      updatedTemplates++;
    }
  }
  if (updatedTemplates > 0) {
    await templateBatch.commit();
  }
  console.log(`📊 Updated ${updatedTemplates} QR templates to new workspace IDs.`);

  // 2. Update Workspace documents
  console.log('--- Updating Personal Workspace documents...');
  for (const userId in userStats) {
    const personalId = `personal_${userId}`;
    const wsRef = db.doc(`workspaces/${personalId}`);
    const wsSnap = await wsRef.get();

    const stats = userStats[userId];

    if (!wsSnap.exists) {
      console.log(`🆕 Creating Personal Workspace for user ${userId}...`);
      
      // Try to get user email for the workspace document
      const userSnap = await db.doc(`users/${userId}`).get();
      const userData = userSnap.data();
      const email = userData?.['email'] || 'unknown@user.com';
      const branding = userData?.['personalBranding'] || null;

      await wsRef.set({
        id: personalId,
        name: 'Personal Workspace',
        ownerId: userId,
        memberUids: [userId],
        members: [{
          uid: userId,
          email: email,
          role: 'owner',
          joinedAt: admin.firestore.Timestamp.now()
        }],
        branding: branding,
        totalUrls: stats.totalUrls,
        totalClicks: stats.totalClicks,
        plan: 'free',
        createdAt: admin.firestore.Timestamp.now()
      });
    } else {
      console.log(`Updating stats for Personal Workspace ${personalId}...`);
      await wsRef.update({
        totalUrls: stats.totalUrls,
        totalClicks: stats.totalClicks,
        updatedAt: admin.firestore.Timestamp.now()
      });
    }
  }

  console.log('🎉 Migration completed successfully!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
