import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import * as Models from '@innkie/shared-models';
import { Timestamp } from '@google-cloud/firestore';
import * as log from 'loglevel';

@Injectable()
export class PlatformMetricsService {
  constructor(private readonly firebase: FirebaseService) {}

  async logEvent(event: Models.PlatformUsageEvent) {
    try {
      const eventData = {
        ...event,
        timestamp: Timestamp.now(),
      };
      
      await this.firebase.db
        .collection('platformEvents')
        .add(eventData);
        
      log.debug(`Logged platform event: ${event.toolType}/${event.action}`);
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
