import { Injectable } from '@nestjs/common';
import * as log from 'loglevel';

import { Firestore } from '@google-cloud/firestore';

import * as admin from 'firebase-admin';
import {ConfigService} from '@nestjs/config';

const serviceAccountPath = `./service-account/linkifyUrl-service-account.json`;

console.log('Service Account Path: ', serviceAccountPath);

log.debug('Using Service account: ' + serviceAccountPath);
log.debug('Google Cloud Project: ' + process.env?.GOOGLE_CLOUD_PROJECT);
log.debug('Firebase Database: ' + process.env.FIRESTORE_DATABASE_URL);
log.debug('REST API Url: ' + process.env.REST_API_URL);

export const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: serviceAccountPath
});


admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
  databaseURL: process.env.FIRESTORE_DATABASE_URL,
});


export const auth = admin.auth();


@Injectable()
export class FirebaseService {

  constructor(private configService: ConfigService) {
  }

  get db() {
    return db;
  }

  get auth() {
    return auth;
  }

  async getDocData(docPath) {

    try {
      const snap = await this.db.doc(docPath).get();

      return snap.data();
    } catch (e) {

      log.debug(`Error getting document ${docPath}`, e);
      return null;

    }
  }

  async getCollectionData(path) {

    const snaps = await this.db.collection(path).get();

    const data = snaps.docs.map(snap => {
      return {
        id: snap.id,
        ...snap.data(),
      };
    });

    return data;
  }

  async runQuery(query) {

    const snaps = await query;

    const data = snaps.docs.map(snap => {
      return {
        id: snap.id,
        ...snap.data(),
      };
    });

    return data;
  }

  async runQueryWithSingleResult(query) {

    const snaps = await query;

    const data = snaps.docs.map(snap => {
      return {
        id: snap.id,
        ...snap.data(),
      };
    });

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
