import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { WebhookEvent, WebhookPayload } from '@innkie/shared-models';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(private readonly firebase: FirebaseService) {}

  async dispatch(workspaceId: string | null, event: WebhookEvent, data: any) {
    if (!workspaceId) return;

    try {
      // 1. Find all active webhooks for this workspace that listen for this event
      const snapshot = await this.firebase.db.collection('webhooks')
        .where('workspaceId', '==', workspaceId)
        .where('isActive', '==', true)
        .where('events', 'array-contains', event)
        .get();

      if (snapshot.empty) return;

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        workspaceId,
        data
      };

      // 2. Dispatch to each URL asynchronously
      const promises = snapshot.docs.map(doc => {
        const webhook = doc.data();
        return this.sendRequest(webhook.url, webhook.secret, payload, doc.id);
      });

      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error(`Failed to dispatch webhook event ${event}`, error);
    }
  }

  private async sendRequest(url: string, secret: string, payload: WebhookPayload, webhookId: string) {
    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    try {
      await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Innkie-Signature': signature,
          'User-Agent': 'iNNkie-Webhooks/1.0'
        },
        timeout: 5000 // 5 second timeout
      });

      // Update last triggered at
      await this.firebase.db.collection('webhooks').doc(webhookId).update({
        lastTriggeredAt: new Date()
      });
    } catch (error) {
      this.logger.warn(`Webhook delivery failed for ${url}: ${error.message}`);
    }
  }
}
