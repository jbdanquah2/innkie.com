import { Injectable, OnModuleInit } from '@nestjs/common';
import * as log from 'loglevel';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private _db: admin.firestore.Firestore;
  private _auth: admin.auth.Auth;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeFirebase();
  }

  private async initializeFirebase() {
    console.log('🚀 [FirebaseService] Starting initialization...');

    const serviceAccountFileName = this.configService.get<string>('SERVICE_ACCOUNT_FILE_NAME') || 'linkifyUrl-service-account.json';

    const possiblePaths = [
      join(process.cwd(), 'service-account', serviceAccountFileName),
      join(process.cwd(), 'service-account', 'linkifyUrl-service-account.json'),
      join(process.cwd(), 'rest-api', 'service-account', 'linkifyUrl-service-account.json'),
      join(__dirname, '..', '..', 'service-account', 'linkifyUrl-service-account.json')
    ];

    let foundPath: string | null = null;
    for (const p of possiblePaths) {
      if (existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (foundPath) {
      console.log(`✅ [FirebaseService] Using service account: ${foundPath}`);
      try {
        if (admin.apps.length > 0) {
          await admin.app().delete();
        }

        admin.initializeApp({
          credential: admin.credential.cert(foundPath)
        });

        this._db = admin.firestore();
        this._auth = admin.auth();

        // Test Auth
        // this._auth.listUsers(1)
        //   .then(() => console.log('✅ [FirebaseService] Auth test successful'))
        //   .catch(err => console.error('❌ [FirebaseService] Auth test failed:', err.message));

        console.log('🎉 [FirebaseService] Initialization complete. Project:', (this._db as any).projectId);
      } catch (err) {
        console.error('❌ [FirebaseService] Error during initialization:', err);
      }
    } else {
      console.log('⚠️ [FirebaseService] Falling back to Application Default Credentials');
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.GOOGLE_CLOUD_PROJECT || 'linkifyurl'
        });
      }
      this._db = admin.firestore();
      this._auth = admin.auth();
      console.log('🎉 [FirebaseService] Initialization complete (ADC).');
    }
  }

  get db() {
    return this._db;
  }

  get auth() {
    return this._auth;
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
