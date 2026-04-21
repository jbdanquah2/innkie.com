import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { Webhook, WebhookEvent } from '@innkie/shared-models';
import { Timestamp } from '@google-cloud/firestore';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  constructor(private readonly firebase: FirebaseService) {}

  async createWebhook(workspaceId: string, name: string, url: string, events: WebhookEvent[]): Promise<Webhook> {
    const id = uuidv4();
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    
    const webhook: Webhook = {
      id,
      workspaceId,
      name,
      url,
      events,
      isActive: true,
      secret,
      createdAt: Timestamp.now() as any
    };

    await this.firebase.db.collection('webhooks').doc(id).set(webhook);
    return webhook;
  }

  async getWorkspaceWebhooks(workspaceId: string): Promise<Webhook[]> {
    const snapshot = await this.firebase.db.collection('webhooks')
      .where('workspaceId', '==', workspaceId)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as Webhook);
  }

  async deleteWebhook(id: string, workspaceId: string): Promise<void> {
    const docRef = this.firebase.db.collection('webhooks').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists && doc.data()?.workspaceId === workspaceId) {
      await docRef.delete();
    }
  }

  async toggleWebhook(id: string, workspaceId: string, isActive: boolean): Promise<void> {
    const docRef = this.firebase.db.collection('webhooks').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists && doc.data()?.workspaceId === workspaceId) {
      await docRef.update({ isActive });
    }
  }
}
