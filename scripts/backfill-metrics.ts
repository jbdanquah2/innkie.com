import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

/**
 * BACKFILL SCRIPT: Platform Metrics Aggregation
 * This script iterates through all platformEvents, shortUrls, and clicks
 * and aggregates them into the workspaceSummaries collection for the dashboard.
 */

async function runBackfill() {
  console.log('🚀 Starting backfill process...');

  // 1. Initialize Firebase
  const serviceAccountPath = path.join(process.cwd(), 'service-account', 'linkifyUrl-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    console.log(`✅ Found service account at: ${serviceAccountPath}`);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
  } else {
    console.log('⚠️ Service account not found, using ADC...');
    admin.initializeApp();
  }

  const db = admin.firestore();
  
  // Helper to normalize date to YYYY-MM-DD
  const normalizeDate = (timestamp: any): string => {
    if (!timestamp) return new Date().toISOString().split('T')[0];
    if (timestamp instanceof admin.firestore.Timestamp) {
      return timestamp.toDate().toISOString().split('T')[0];
    }
    if (timestamp._seconds !== undefined) {
      return new Date(timestamp._seconds * 1000).toISOString().split('T')[0];
    }
    try {
        const d = new Date(timestamp);
        return d.toISOString().split('T')[0];
    } catch (e) {
        return new Date().toISOString().split('T')[0];
    }
  };

  /**
   * TASK 1: Backfill Platform Events (Tools usage)
   */
  console.log('📥 Fetching platformEvents...');
  const eventsSnap = await db.collection('platformEvents').get();
  console.log(`✅ Found ${eventsSnap.size} events. Aggregating...`);

  for (const doc of eventsSnap.docs) {
    const data = doc.data();
    const { workspaceId, toolType, action, timestamp } = data;
    if (!workspaceId || !timestamp) continue;

    const dateStr = normalizeDate(timestamp);
    const summaryRef = db.collection('workspaceSummaries').doc(`${workspaceId}_${dateStr}`);

    const incrementMap: any = {};
    if (toolType === 'link_shortener' && action === 'shorten') {
      incrementMap['metrics.linksShortened'] = admin.firestore.FieldValue.increment(1);
    } else if (toolType === 'image_optimizer' && action === 'compress') {
      incrementMap['metrics.imagesCompressed'] = admin.firestore.FieldValue.increment(1);
      const metadata = data['metadata'] || {};
      const bytesSaved = metadata['bytesSaved'] || 0;
      incrementMap['metrics.bytesSaved'] = admin.firestore.FieldValue.increment(bytesSaved);
    } else if (toolType === 'qr_studio' && action === 'generate') {
      incrementMap['metrics.qrsGenerated'] = admin.firestore.FieldValue.increment(1);
    } else {
      incrementMap['metrics.otherToolsUsage'] = admin.firestore.FieldValue.increment(1);
    }

    // Initialize metrics if they don't exist
    await summaryRef.set({
      workspaceId,
      date: dateStr,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metrics: {
        linksShortened: admin.firestore.FieldValue.increment(0),
        clicksTotal: admin.firestore.FieldValue.increment(0),
        imagesCompressed: admin.firestore.FieldValue.increment(0),
        bytesSaved: admin.firestore.FieldValue.increment(0),
        qrsGenerated: admin.firestore.FieldValue.increment(0),
        otherToolsUsage: admin.firestore.FieldValue.increment(0),
      }
    }, { merge: true });

    await summaryRef.update(incrementMap).catch(err => {
        console.warn(`⚠️ Failed to update metrics for doc ${doc.id}:`, err.message);
    });
  }

  /**
   * TASK 2: Backfill Click Events
   */
  console.log('📥 Fetching all clicks (collectionGroup)...');
  const clicksSnap = await db.collectionGroup('clicks').get();
  console.log(`✅ Found ${clicksSnap.size} clicks. Aggregating...`);

  for (const doc of clicksSnap.docs) {
    const data = doc.data();
    const { workspaceId, timestamp } = data;
    if (!workspaceId || !timestamp) continue;

    const dateStr = normalizeDate(timestamp);
    const summaryRef = db.collection('workspaceSummaries').doc(`${workspaceId}_${dateStr}`);

    await summaryRef.set({
      workspaceId,
      date: dateStr,
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await summaryRef.update({
      'metrics.clicksTotal': admin.firestore.FieldValue.increment(1)
    });
  }

  console.log('🎉 Backfill process completed successfully!');
}

runBackfill().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
