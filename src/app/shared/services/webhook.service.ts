import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Webhook, WebhookEvent } from '@innkie/shared-models';
import { environment } from '../../../environments/environment';
import { WorkspaceService } from './workspace.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private http = inject(HttpClient);
  private workspaceService = inject(WorkspaceService);
  private apiUrl = `${environment.apiUrl}/webhooks`;

  async getWebhooks(): Promise<Webhook[]> {
    const wsId = this.workspaceService.activeWorkspace?.id;
    if (!wsId) return [];
    return await firstValueFrom(
      this.http.get<Webhook[]>(`${this.apiUrl}?workspaceId=${wsId}`)
    );
  }

  async createWebhook(name: string, url: string, events: WebhookEvent[]): Promise<Webhook> {
    const workspaceId = this.workspaceService.activeWorkspace?.id;
    if (!workspaceId) throw new Error('No active workspace');
    
    return await firstValueFrom(
      this.http.post<Webhook>(this.apiUrl, {
        workspaceId,
        name,
        url,
        events
      })
    );
  }

  async toggleWebhook(id: string, isActive: boolean): Promise<void> {
    const workspaceId = this.workspaceService.activeWorkspace?.id;
    if (!workspaceId) return;

    await firstValueFrom(
      this.http.put<void>(`${this.apiUrl}/${id}/toggle`, {
        workspaceId,
        isActive
      })
    );
  }

  async deleteWebhook(id: string): Promise<void> {
    const workspaceId = this.workspaceService.activeWorkspace?.id;
    if (!workspaceId) return;

    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}?workspaceId=${workspaceId}`)
    );
  }
}
