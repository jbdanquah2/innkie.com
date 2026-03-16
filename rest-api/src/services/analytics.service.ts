import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { ClickEvent } from '../models/click-event.model';
import { Timestamp, FieldValue } from '@google-cloud/firestore';
import * as log from 'loglevel';

@Injectable()
export class AnalyticsService {
  constructor(private readonly firebase: FirebaseService) {}

  async logClick(click: ClickEvent) {
    try {
      const clickData = {
        ...click,
        timestamp: Timestamp.now(), // Use server timestamp
      };
      
      // Store in subcollection: shortUrls/{shortCode}/clicks/{clickId}
      await this.firebase.db
        .collection('shortUrls')
        .doc(click.id) // here id is the shortCode
        .collection('clicks')
        .add(clickData);
        
      log.debug(`Logged click for ${click.id}`);
    } catch (error) {
      log.error(`Failed to log click for ${click.id}:`, error);
    }
  }

  async getClicksOverTime(shortCode: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    const clicksRef = this.firebase.db
      .collection('shortUrls')
      .doc(shortCode)
      .collection('clicks');

    const snapshot = await clicksRef
      .where('timestamp', '>=', startTimestamp)
      .orderBy('timestamp', 'asc')
      .get();

    const data: Record<string, number> = {};
    
    // Initialize empty days
    for (let i = 0; i <= days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = 0;
    }

    snapshot.forEach(doc => {
      const click = doc.data();
      const date = click.timestamp.toDate().toISOString().split('T')[0];
      if (data[date] !== undefined) {
        data[date]++;
      }
    });

    // Convert to sorted array for the chart
    return Object.keys(data)
      .sort()
      .map(date => ({
        date,
        clicks: data[date]
      }));
  }
}
