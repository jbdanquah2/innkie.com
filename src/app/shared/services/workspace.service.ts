import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Workspace, WorkspaceRole } from '@innkie/shared-models';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/v1/workspaces`;

  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  workspaces$ = this.workspacesSubject.asObservable();

  private activeWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);
  activeWorkspace$ = this.activeWorkspaceSubject.asObservable();

  private readySubject = new BehaviorSubject<boolean>(false);
  ready$ = this.readySubject.asObservable();

  constructor() {
    // Only load workspaces once the user profile is fully fetched from Firestore
    this.authService.userReady$.subscribe(ready => {
      const user = this.authService.currentUser;
      if (ready && user) {
        this.loadWorkspaces();
      } else if (ready && !user) {
        this.workspacesSubject.next([]);
        this.activeWorkspaceSubject.next(null);
        this.readySubject.next(false);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('activeWorkspaceId');
        }
      }
    });
  }

  waitForInitialWorkspaces(): Promise<void> {
    return firstValueFrom(this.ready$.pipe(
      filter((ready: boolean) => ready),
      take(1),
      map(() => undefined)
    ));
  }

  get activeWorkspace() {
    return this.activeWorkspaceSubject.value;
  }

  async loadWorkspaces() {
    try {
      const workspaces = await firstValueFrom(this.http.get<Workspace[]>(this.apiUrl));
      this.workspacesSubject.next(workspaces);
      
      const user = this.authService.currentUser;
      const defaultId = user?.defaultWorkspaceId;
      const lastActiveId = isPlatformBrowser(this.platformId) ? localStorage.getItem('activeWorkspaceId') : null;
      
      let active: Workspace | null = null;
      
      // Identify workspaces relative to the current user
      const myPersonalId = `personal_${user?.uid}`;
      const myPersonalWs = workspaces.find(w => w.id === myPersonalId) || workspaces.find(w => w.id.startsWith('personal_') && w.id === myPersonalId) || null;
      const sharedWs = workspaces.find(w => w.id !== myPersonalId) || null;

      // Selection Priority (Strict & Instant):
      // 1. Explicitly set defaultWorkspaceId (User preference)
      if (defaultId && workspaces.find(w => w.id === defaultId)) {
        active = workspaces.find(w => w.id === defaultId)!;
      } 
      // 2. Last active workspace from localStorage (Session memory)
      else if (lastActiveId && workspaces.find(w => w.id === lastActiveId)) {
        active = workspaces.find(w => w.id === lastActiveId)!;
      } 
      // 3. Any shared workspace (Team or shared personal)
      else {
        active = sharedWs || myPersonalWs;
      }
      
      this.setActiveWorkspace(active);
      this.readySubject.next(true);
    } catch (error: any) {
      console.error('Error loading workspaces:', error.message || error);
    }
  }

  async setDefaultWorkspace(workspaceId: string | null) {
    await this.authService.patchUser({ defaultWorkspaceId: workspaceId || undefined });
  }

  setActiveWorkspace(workspace: Workspace | null) {
    this.activeWorkspaceSubject.next(workspace);
    if (isPlatformBrowser(this.platformId)) {
      if (workspace) {
        localStorage.setItem('activeWorkspaceId', workspace.id);
      } else {
        localStorage.removeItem('activeWorkspaceId');
      }
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

  async getWorkspaceClicksOverTime(days: number = 30) {
    if (!this.activeWorkspace) return [];
    const wsId = this.activeWorkspace.id;
    return await firstValueFrom(
      this.http.get<any[]>(`${environment.apiUrl}/analytics/workspace/${wsId}?days=${days}`, {
        headers: { 'X-Skip-Loading': 'true' }
      })
    );
  }

  async getWorkspaceVisitorStats(days: number = 7) {
    if (!this.activeWorkspace) return null;
    const wsId = this.activeWorkspace.id;
    return await firstValueFrom(
      this.http.get<any>(`${environment.apiUrl}/analytics/workspace/${wsId}/stats?days=${days}`, {
        headers: { 'X-Skip-Loading': 'true' }
      })
    );
  }
}
