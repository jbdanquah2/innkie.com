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
  private apiUrl = `${environment.apiUrl}/v1/workspaces`;

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
      console.log('Fetching workspaces from:', this.apiUrl);
      const workspaces = await firstValueFrom(this.http.get<Workspace[]>(this.apiUrl));
      console.log('Workspaces received:', workspaces.length, workspaces);
      this.workspacesSubject.next(workspaces);
      
      const user = this.authService.currentUser;
      const defaultId = user?.defaultWorkspaceId;
      console.log('Current user default ID:', defaultId);
      
      let active: Workspace | null = null;
      const personalWs = workspaces.find(w => w.id.startsWith('personal_')) || null;
      console.log('Found personal workspace:', personalWs?.id);

      if (defaultId) {
        active = workspaces.find(w => w.id === defaultId) || personalWs;
      } else {
        active = personalWs;
      }
      
      console.log('Setting active workspace to:', active?.id);
      this.setActiveWorkspace(active);
    } catch (error: any) {
      console.error('Error loading workspaces:', error.message || error);
    }
  }

  async setDefaultWorkspace(workspaceId: string | null) {
    await this.authService.patchUser({ defaultWorkspaceId: workspaceId || undefined });
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

  async updateMemberRole(workspaceId: string, memberUid: string, role: WorkspaceRole) {
    await firstValueFrom(this.http.put(`${this.apiUrl}/${workspaceId}/members/${memberUid}/role`, { role }));
    await this.loadWorkspaces();
  }

  async removeMember(workspaceId: string, memberUid: string) {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${workspaceId}/members/${memberUid}`));
    await this.loadWorkspaces();
  }

  async rotateApiKey(workspaceId: string) {
    const result = await firstValueFrom(this.http.post<{ apiKey: string }>(`${this.apiUrl}/${workspaceId}/api-key`, {}));
    await this.loadWorkspaces();
    return result.apiKey;
  }

  async getWorkspaceClicksOverTime(days: number = 7) {
    if (!this.activeWorkspace) return [];
    const wsId = this.activeWorkspace.id;
    
    return await firstValueFrom(
      this.http.get<any[]>(`${environment.apiUrl}/analytics/workspace/${wsId}?days=${days}`)
    );
  }

  async getCampaignClicksOverTime(tag: string, days: number = 7) {
    if (!this.activeWorkspace) return [];
    const wsId = this.activeWorkspace.id;
    return await firstValueFrom(
      this.http.get<any[]>(`${environment.apiUrl}/analytics/workspace/${wsId}/campaign/${tag}?days=${days}`)
    );
  }

  async getWorkspaceVisitorStats(days: number = 7) {
    if (!this.activeWorkspace) return null;
    const wsId = this.activeWorkspace.id;
    return await firstValueFrom(
      this.http.get<any>(`${environment.apiUrl}/analytics/workspace/${wsId}/stats?days=${days}`)
    );
  }
}
