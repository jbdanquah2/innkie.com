/**
 * One-off: removes the legacy plain-text `apiKey` field from every workspace document.
 *
 *   npx ts-node scripts/purge-legacy-api-keys.ts           # dry run: counts only
 *   npx ts-node scripts/purge-legacy-api-keys.ts --apply   # actually delete the field
 *
 * Keys are never printed. After the backend with hashed keys is deployed, the old plain-text keys no longer work
 * anyway; this script removes the readable copies that would otherwise stay in the database.
 */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const names = [process.env['SERVICE_ACCOUNT_FILE_NAME'], 'linkifyUrl-service-account.json', 'linkify-url-service-account.json'];
const file = names.filter(Boolean).map((n) => path.join(__dirname, '..', 'service-account', n as string)).find((p) => fs.existsSync(p));
if (!file) {
  console.error(`Service account file not found. Checked: ${names.filter(Boolean).join(', ')}`);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(file, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const apply = process.argv.includes('--apply');

async function main() {
  console.log(`Project: ${serviceAccount.project_id}  Mode: ${apply ? 'APPLY' : 'dry run'}`);
  const all = await db.collection('workspaces').get();
  const withKey = all.docs.filter((d) => d.data()['apiKey'] !== undefined);
  console.log(`${all.size} workspaces, ${withKey.length} with a plain-text apiKey field`);
  if (!apply) {
    console.log('Dry run only. Re-run with --apply to remove the field.');
    return;
  }
  let done = 0;
  for (let i = 0; i < withKey.length; i += 400) {
    const batch = db.batch();
    withKey.slice(i, i + 400).forEach((d) => batch.update(d.ref, { apiKey: admin.firestore.FieldValue.delete() }));
    await batch.commit();
    done += Math.min(400, withKey.length - i);
    console.log(`Removed ${done}/${withKey.length}`);
  }
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
