import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { ClickEvent } from '@innkie/shared-models';
import { Timestamp, FieldValue } from '@google-cloud/firestore';
import * as log from 'loglevel';
import { isPersonalWorkspace } from '../utils/workspace.utils';

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

  private generateDateMap(startDate: Date, days: number): { data: Record<string, number>, isMonthly: boolean } {
    const data: Record<string, number> = {};
    const isMonthly = days > 90;

    if (isMonthly) {
      // Group by month
      const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 12, 0, 0);
      const endMonth = new Date();
      endMonth.setDate(1);
      endMonth.setHours(12, 0, 0);
      
      const current = new Date(startMonth);
      while (current <= endMonth) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`; // YYYY-MM
        data[key] = 0;
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      // Group by day
      for (let i = 0; i <= days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        data[dateStr] = 0;
      }
    }

    return { data, isMonthly };
  }

  private processSnapshots(snapshots: any[], data: Record<string, number>, isMonthly: boolean) {
    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        const click = doc.data();
        if (click.timestamp) {
          const date = click.timestamp.toDate();
          let key: string;
          
          if (isMonthly) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            key = `${year}-${month}`;
          } else {
            key = date.toISOString().split('T')[0];
          }

          if (data[key] !== undefined) {
            data[key]++;
          }
        }
      });
    });
  }

  async getClicksOverTime(shortCode: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    const snapshot = await this.firebase.db
      .collection('shortUrls')
      .doc(shortCode)
      .collection('clicks')
      .where('timestamp', '>=', startTimestamp)
      .get();

    const { data, isMonthly } = this.generateDateMap(startDate, days);
    this.processSnapshots([snapshot], data, isMonthly);

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
    let query = this.firebase.db.collection('shortUrls') as any;
    
    if (isPersonalWorkspace(workspaceId)) {
      query = query.where('workspaceId', 'in', [workspaceId, 'personal', null]);
    } else {
      query = query.where('workspaceId', '==', workspaceId);
    }

    const linksSnap = await query.select().get();
    
    const shortCodes = linksSnap.docs.map(doc => doc.id);
    if (shortCodes.length === 0) return [];

    // 2. Query clicks for these specific shortCodes individually
    const clicksPromises = shortCodes.map(code => 
      this.firebase.db.collection('shortUrls').doc(code).collection('clicks')
        .where('timestamp', '>=', startTimestamp)
        .get()
    );
    const clicksSnapshots = await Promise.all(clicksPromises);

    const { data, isMonthly } = this.generateDateMap(startDate, days);
    this.processSnapshots(clicksSnapshots, data, isMonthly);

    return Object.keys(data)
      .sort()
      .map(date => ({
        date,
        clicks: data[date]
      }));
  }

  async getPersonalClicksOverTime(userId: string, days: number = 7) {
    const personalId = `personal_${userId}`;
    return this.getWorkspaceClicksOverTime(personalId, days);
  }

  async getCampaignClicksOverTime(workspaceId: string, tag: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    let query = this.firebase.db.collection('shortUrls') as any;
    if (!isPersonalWorkspace(workspaceId)) {
      query = query.where('workspaceId', '==', workspaceId);
    } else {
      query = query.where('workspaceId', 'in', [workspaceId, 'personal', null]);
    }
    
    const linksSnap = await query.get();
    const shortCodes = linksSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(link => link.tags && link.tags.includes(tag))
      .map(link => link.id);

    if (shortCodes.length === 0) return [];

    const clicksPromises = shortCodes.map(code => 
      this.firebase.db.collection('shortUrls').doc(code).collection('clicks')
        .where('timestamp', '>=', startTimestamp)
        .get()
    );
    const clicksSnapshots = await Promise.all(clicksPromises);

    const { data, isMonthly } = this.generateDateMap(startDate, days);
    this.processSnapshots(clicksSnapshots, data, isMonthly);

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

    let query = this.firebase.db.collection('shortUrls') as any;
    if (!isPersonalWorkspace(workspaceId)) {
      query = query.where('workspaceId', '==', workspaceId);
    } else {
      query = query.where('workspaceId', 'in', [workspaceId, 'personal', null]);
      if (userId) {
        query = query.where('userId', '==', userId);
      }
    }

    const linksSnap = await query.get();
    const shortCodes = linksSnap.docs.map(doc => doc.id);

    if (shortCodes.length === 0) return null;

    const clicksPromises = shortCodes.map(code => 
      this.firebase.db.collection('shortUrls').doc(code).collection('clicks')
        .where('timestamp', '>=', startTimestamp)
        .get()
    );
    const clicksSnapshots = await Promise.all(clicksPromises);
    
    const stats = {
      devices: {} as Record<string, number>,
      browsers: {} as Record<string, number>,
      countries: {} as Record<string, number>,
      referrers: {} as Record<string, number>
    };

    clicksSnapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        const click = doc.data();
        const device = click.deviceType || 'unknown';
        stats.devices[device] = (stats.devices[device] || 0) + 1;

        // Browser
        const browser = click.browser || 'Unknown';
        stats.browsers[browser] = (stats.browsers[browser] || 0) + 1;

        const country = click.country || 'Unknown';
        stats.countries[country] = (stats.countries[country] || 0) + 1;
        let ref = click.referrer || 'Direct';
        if (ref.includes('google')) ref = 'Google';
        if (ref.includes('facebook') || ref.includes('fb.com')) ref = 'Facebook';
        if (ref.includes('t.co') || ref.includes('twitter')) ref = 'X / Twitter';
        if (ref.includes('linkedin')) ref = 'LinkedIn';
        stats.referrers[ref] = (stats.referrers[ref] || 0) + 1;
      });
    });

    return stats;
  }
}
