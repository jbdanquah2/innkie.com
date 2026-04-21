import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Workspace, WorkspaceRole } from '@innkie/shared-models';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/workspaces`;

  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  workspaces$ = this.workspacesSubject.asObservable();

  private activeWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);
  activeWorkspace$ = this.activeWorkspaceSubject.asObservable();

  constructor() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadWorkspaces();
      } else {
        this.workspacesSubject.next([]);
        this.activeWorkspaceSubject.next(null);
        localStorage.removeItem('activeWorkspaceId');
      }
    });
  }

  get activeWorkspace() {
    return this.activeWorkspaceSubject.value;
  }

  async loadWorkspaces() {
    try {
      const workspaces = await firstValueFrom(this.http.get<Workspace[]>(this.apiUrl));
      this.workspacesSubject.next(workspaces);
      
      const savedId = localStorage.getItem('activeWorkspaceId');
      let active = workspaces.find(w => w.id === savedId);
      
      if (!active && workspaces.length > 0) {
        active = workspaces[0];
      }
      
      this.setActiveWorkspace(active || null);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  }

  setActiveWorkspace(workspace: Workspace | null) {
    this.activeWorkspaceSubject.next(workspace);
    if (workspace) {
      localStorage.setItem('activeWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('activeWorkspaceId');
    }
  }

  async createWorkspace(name: string) {
    const newWorkspace = await firstValueFrom(this.http.post<Workspace>(this.apiUrl, { name }));
    await this.loadWorkspaces();
    return newWorkspace;
  }

  async updateWorkspace(id: string, data: Partial<Workspace>) {
    await firstValueFrom(this.http.put(`${this.apiUrl}/${id}`, data));
    await this.loadWorkspaces();
  }

  async deleteWorkspace(id: string) {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    await this.loadWorkspaces();
  }

  async addMember(workspaceId: string, email: string, role: WorkspaceRole) {
    await firstValueFrom(this.http.post(`${this.apiUrl}/${workspaceId}/members`, { email, role }));
    await this.loadWorkspaces();
  }

  async rotateApiKey(workspaceId: string) {
    const result = await firstValueFrom(this.http.post<{ apiKey: string }>(`${this.apiUrl}/${workspaceId}/api-key`, {}));
    await this.loadWorkspaces();
    return result.apiKey;
  }

  async getWorkspaceClicksOverTime(days: number = 7) {
    const wsId = this.activeWorkspace?.id || 'personal';
    
    return await firstValueFrom(
      this.http.get<any[]>(`${environment.apiUrl}/analytics/workspace/${wsId}?days=${days}`)
    );
  }

  async getCampaignClicksOverTime(tag: string, days: number = 7) {
    const wsId = this.activeWorkspace?.id || 'personal';
    return await firstValueFrom(
      this.http.get<any[]>(`${environment.apiUrl}/analytics/workspace/${wsId}/campaign/${tag}?days=${days}`)
    );
  }

  async getWorkspaceVisitorStats(days: number = 7) {
    const wsId = this.activeWorkspace?.id || 'personal';
    return await firstValueFrom(
      this.http.get<any>(`${environment.apiUrl}/analytics/workspace/${wsId}/stats?days=${days}`)
    );
  }
}
