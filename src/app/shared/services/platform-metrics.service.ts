import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { PlatformUsageEvent, PlatformToolType, WorkspaceDailySummary } from '@innkie/shared-models';
import { AuthService } from './auth.service';
import { WorkspaceService } from './workspace.service';
import { firstValueFrom, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlatformMetricsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  private platformId = inject(PLATFORM_ID);

  private readonly API_URL = `${environment.apiUrl}/metrics`;

  /**
   * Logs a tool usage event.
   */
  async logToolUsage(toolType: PlatformToolType, action: string, metadata?: any) {
    if (!isPlatformBrowser(this.platformId)) return;

    const user = this.auth.currentUser;
    const workspaceId = this.workspaceService.activeWorkspace?.id || 'guest';
    const userId = user?.uid || 'guest';

    const event: PlatformUsageEvent = {
      workspaceId,
      userId,
      toolType,
      action,
      metadata,
      timestamp: new Date()
    };

    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/event`, event));
    } catch (error) {
      console.error('Failed to log platform event', error);
    }
  }

  /**
   * Fetches the daily summary for the active workspace.
   */
  async getWorkspaceSummary(days: number = 30): Promise<WorkspaceDailySummary[]> {
    const workspaceId = this.workspaceService.activeWorkspace?.id;
    if (!workspaceId) return [];

    try {
      return await firstValueFrom(
        this.http.get<WorkspaceDailySummary[]>(`${this.API_URL}/summary`, {
          params: { workspaceId, days: days.toString() }
        })
      );
    } catch (error) {
      console.error('Failed to fetch workspace summary', error);
      return [];
    }
  }

  /**
   * Fetches the most recent platform events for the active workspace.
   */
  async getRecentEvents(limit: number = 10): Promise<PlatformUsageEvent[]> {
    const workspaceId = this.workspaceService.activeWorkspace?.id;
    if (!workspaceId) return [];

    try {
      return await firstValueFrom(
        this.http.get<PlatformUsageEvent[]>(`${this.API_URL}/recent`, {
          params: { workspaceId, limit: limit.toString() }
        })
      );
    } catch (error) {
      console.error('Failed to fetch recent events', error);
      return [];
    }
  }
}
