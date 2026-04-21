import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QrTemplate } from '@innkie/shared-models';
import { environment } from '../../../environments/environment';
import { WorkspaceService } from './workspace.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QrStudioService {
  private http = inject(HttpClient);
  private workspaceService = inject(WorkspaceService);
  private apiUrl = `${environment.apiUrl}/qr`;

  async saveTemplate(name: string, config: any): Promise<QrTemplate> {
    const workspaceId = this.workspaceService.activeWorkspace?.id || null;
    return await firstValueFrom(
      this.http.post<QrTemplate>(`${this.apiUrl}/templates`, {
        workspaceId,
        name,
        config
      })
    );
  }

  async getTemplates(): Promise<QrTemplate[]> {
    const workspaceId = this.workspaceService.activeWorkspace?.id || 'personal';
    return await firstValueFrom(
      this.http.get<QrTemplate[]>(`${this.apiUrl}/templates?workspaceId=${workspaceId}`)
    );
  }

  async deleteTemplate(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/templates/${id}`)
    );
  }
}
