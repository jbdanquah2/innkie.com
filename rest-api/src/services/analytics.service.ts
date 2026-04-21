import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { ClickEvent } from '@innkie/shared-models';
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

  async getWorkspaceClicksOverTime(workspaceId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    // 1. Get all shortCode IDs for this workspace
    const linksSnap = await this.firebase.db.collection('shortUrls')
      .where('workspaceId', '==', workspaceId)
      .select() // only need IDs
      .get();
    
    const shortCodes = linksSnap.docs.map(doc => doc.id);
    if (shortCodes.length === 0) return [];

    // 2. Use collectionGroup to query all 'clicks' subcollections
    // This is much faster than querying each link individually
    // Note: Requires a composite index on (timestamp) for the collectionGroup 'clicks'
    const clicksSnapshot = await this.firebase.db.collectionGroup('clicks')
      .where('workspaceId', '==', workspaceId) // Assuming we add workspaceId to ClickEvent
      .where('timestamp', '>=', startTimestamp)
      .get();

    const data: Record<string, number> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = 0;
    }

    clicksSnapshot.forEach(doc => {
      const click = doc.data();
      const date = click.timestamp.toDate().toISOString().split('T')[0];
      if (data[date] !== undefined) {
        data[date]++;
      }
    });

    return Object.keys(data)
      .sort()
      .map(date => ({
        date,
        clicks: data[date]
      }));
  }

  async getPersonalClicksOverTime(userId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    // Query for clicks where userId matches and workspaceId is NOT set (personal)
    // Note: This requires a composite index on (userId, timestamp) for the collectionGroup 'clicks'
    // AND a filter to exclude links that have a workspaceId.
    // However, since we can't easily query "NOT EXISTS" in Firestore efficiently for workspaceId
    // across a collectionGroup without an index, we will fetch and filter in-memory if the volume is low,
    // or rely on the links query.
    
    // Better way: 
    // 1. Get all personal shortCode IDs for this user
    const linksSnap = await this.firebase.db.collection('shortUrls')
      .where('userId', '==', userId)
      .where('workspaceId', '==', null)
      .select()
      .get();
    
    const shortCodes = linksSnap.docs.map(doc => doc.id);
    if (shortCodes.length === 0) return [];

    // 2. Query clicks for these specific shortCodes
    // We'll use collectionGroup for speed but filter by shortUrlId or id
    const clicksSnapshot = await this.firebase.db.collectionGroup('clicks')
      .where('userId', '==', userId)
      .where('workspaceId', '==', null)
      .where('timestamp', '>=', startTimestamp)
      .get();

    const data: Record<string, number> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = 0;
    }

    clicksSnapshot.forEach(doc => {
      const click = doc.data();
      const date = click.timestamp.toDate().toISOString().split('T')[0];
      if (data[date] !== undefined) {
        data[date]++;
      }
    });

    return Object.keys(data)
      .sort()
      .map(date => ({
        date,
        clicks: data[date]
      }));
  }

  async getCampaignClicksOverTime(workspaceId: string, tag: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    // Filter by workspaceId and specific tag in ClickEvent
    // Note: This requires a composite index on (workspaceId, tags, timestamp) for the collectionGroup 'clicks'
    let query = this.firebase.db.collectionGroup('clicks')
      .where('tags', 'array-contains', tag)
      .where('timestamp', '>=', startTimestamp);

    if (workspaceId !== 'personal') {
      query = query.where('workspaceId', '==', workspaceId);
    } else {
       query = query.where('workspaceId', '==', null);
    }

    const clicksSnapshot = await query.get();

    const data: Record<string, number> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = 0;
    }

    clicksSnapshot.forEach(doc => {
      const click = doc.data();
      const date = click.timestamp.toDate().toISOString().split('T')[0];
      if (data[date] !== undefined) {
        data[date]++;
      }
    });

    return Object.keys(data)
      .sort()
      .map(date => ({
        date,
        clicks: data[date]
      }));
  }

  async getWorkspaceVisitorStats(workspaceId: string, days: number = 7, userId?: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    let query = this.firebase.db.collectionGroup('clicks')
      .where('timestamp', '>=', startTimestamp);

    if (workspaceId !== 'personal') {
      query = query.where('workspaceId', '==', workspaceId);
    } else if (userId) {
       query = query.where('userId', '==', userId).where('workspaceId', '==', null);
    } else {
      return null;
    }

    const snapshot = await query.get();
    
    const stats = {
      devices: {} as Record<string, number>,
      browsers: {} as Record<string, number>,
      countries: {} as Record<string, number>,
      referrers: {} as Record<string, number>
    };

    snapshot.forEach(doc => {
      const click = doc.data();
      
      // Device Type
      const device = click.deviceType || 'unknown';
      stats.devices[device] = (stats.devices[device] || 0) + 1;

      // Country
      const country = click.country || 'Unknown';
      stats.countries[country] = (stats.countries[country] || 0) + 1;

      // Referrer
      let ref = click.referrer || 'Direct';
      if (ref.includes('google')) ref = 'Google';
      if (ref.includes('facebook') || ref.includes('fb.com')) ref = 'Facebook';
      if (ref.includes('t.co') || ref.includes('twitter')) ref = 'X / Twitter';
      if (ref.includes('linkedin')) ref = 'LinkedIn';
      
      stats.referrers[ref] = (stats.referrers[ref] || 0) + 1;
    });

    return stats;
  }
}
