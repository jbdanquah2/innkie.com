import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  private readonly API_URL = `${environment.apiUrl}/metrics`;

  /**
   * Logs a tool usage event if the user is logged in.
   */
  async logToolUsage(toolType: PlatformToolType, action: string, metadata?: any) {
    const user = this.auth.currentUser;
    const workspaceId = this.workspaceService.activeWorkspace?.id;

    if (!user || !workspaceId) return;

    const event: PlatformUsageEvent = {
      workspaceId,
      userId: user.uid,
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
}
