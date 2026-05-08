import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import * as Models from '@innkie/shared-models';
import { Timestamp } from '@google-cloud/firestore';
import * as log from 'loglevel';
import * as crypto from 'crypto';

@Injectable()
export class PlatformMetricsService {
  constructor(private readonly firebase: FirebaseService) {}

  async logEvent(event: Models.PlatformUsageEvent) {
    try {
      // Idempotency Strategy: 
      // Create a deterministic ID based on user, tool, action, and the current minute.
      // This prevents rapid double-clicks or network retries from double-counting.
      const timestamp = new Date();
      const roundedTime = new Date(timestamp.getTime());
      roundedTime.setSeconds(0, 0); // Round to the nearest minute

      const idString = `${event.userId}_${event.toolType}_${event.action}_${roundedTime.getTime()}`;
      const eventId = crypto.createHash('sha256').update(idString).digest('hex').substring(0, 20);

      const eventData = {
        ...event,
        id: eventId,
        timestamp: Timestamp.fromDate(timestamp),
      };
      
      await this.firebase.db
        .collection('platformEvents')
        .doc(eventId)
        .set(eventData, { merge: true });
        
      log.debug(`Logged platform event: ${event.toolType}/${event.action} (ID: ${eventId})`);
    } catch (error) {
      log.error(`Failed to log platform event:`, error);
    }
  }

  async getWorkspaceSummary(workspaceId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dateLimit = startDate.toISOString().split('T')[0];

    const snapshot = await this.firebase.db
      .collection('workspaceSummaries')
      .where('workspaceId', '==', workspaceId)
      .where('date', '>=', dateLimit)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  async getRecentEvents(workspaceId: string, limit: number = 10) {
    const snapshot = await this.firebase.db
      .collection('platformEvents')
      .where('workspaceId', '==', workspaceId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}
