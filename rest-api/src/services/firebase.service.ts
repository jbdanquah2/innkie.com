import { Injectable } from '@nestjs/common';
import * as log from 'loglevel';
import { Firestore } from '@google-cloud/firestore';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';

// Local file path for dev
const serviceAccountPath = join(__dirname, '..', '..', 'service-account', 'linkifyUrl-service-account.json');

// Logging for clarity
console.log('🔍 Checking Firebase credentials...');
log.debug('Service Account Path:', serviceAccountPath);
log.debug('Google Cloud Project:', process.env.GOOGLE_CLOUD_PROJECT);
log.debug('Firebase Database:', process.env.FIRESTORE_DATABASE_URL);

// Initialize Firebase Admin
if (existsSync(serviceAccountPath)) {
  // Local Development
  log.info('✅ Initializing Firebase with local service account file');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    // databaseURL: process.env.FIRESTORE_DATABASE_URL,
  });
} else {
  // Cloud Run / Workload Identity
  log.info('✅ Initializing Firebase with Application Default Credentials (Workload Identity)');
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // databaseURL: process.env.FIRESTORE_DATABASE_URL,
  });
}

// Firestore Initialization
let db: Firestore;
if (existsSync(serviceAccountPath)) {
  db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: serviceAccountPath,
  });
} else {
  // Workload Identity — credentials auto-provided
  db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

export const auth = admin.auth();

@Injectable()
export class FirebaseService {
  constructor(private configService: ConfigService) {}

  get db() {
    return db;
  }

  get auth() {
    return auth;
  }

  async getDocData(docPath: string) {
    try {
      const snap = await this.db.doc(docPath).get();
      return snap.data();
    } catch (e) {
      log.debug(`Error getting document ${docPath}`, e);
      return null;
    }
  }

  async getCollectionData(path: string) {
    const snaps = await this.db.collection(path).get();
    return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
  }

  async runQuery(query: any) {
    const snaps = await query;
    return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
  }

  async runQueryWithSingleResult(query: any) {
    const snaps = await query;
    const data = snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
    if (data.length > 1) {
      console.log(`Could not find unique query results, results length: ${data?.length}`);
      return null;
    }
    return data.length === 1 ? data[0] : null;
  }

  createId() {
    return this.db.collection('_').doc().id;
  }

  async updateDoc(docPath: string, data: any): Promise<void> {
    try {
      await this.db.doc(docPath).set(data);
    } catch (error) {
      log.error(`Error setting document at ${docPath}:`, error);
      throw error;
    }
  }

  async deleteDocument(docPath: string): Promise<void> {
    try {
      await this.db.doc(docPath).delete();
      log.debug(`Successfully deleted document at ${docPath}`);
    } catch (error) {
      log.error(`Error deleting document at ${docPath}:`, error);
      throw error;
    }
  }
}
