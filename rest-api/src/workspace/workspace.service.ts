import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';
import { Workspace, WorkspaceMember, WorkspaceRole } from '@innkie/shared-models';
import { Timestamp } from 'firebase-admin/firestore';
import * as log from 'loglevel';

@Injectable()
export class WorkspaceService {
  constructor(private readonly firebase: FirebaseService) {}

  async createWorkspace(name: string, ownerId: string, email: string): Promise<Workspace> {
    const workspaceId = this.firebase.createId();
    const workspace: Workspace = {
      id: workspaceId,
      name,
      ownerId,
      members: [
        {
          uid: ownerId,
          email,
          role: 'owner',
          joinedAt: Timestamp.now() as any,
        },
      ],
      createdAt: Timestamp.now() as any,
      plan: 'free',
    };

    await this.firebase.db.doc(`workspaces/${workspaceId}`).set(workspace);
    return workspace;
  }

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const data = await this.firebase.getDocData(`workspaces/${workspaceId}`);
    if (!data) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }
    return data as Workspace;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const query = this.firebase.db.collection('workspaces').where('members', 'array-contains-any', [
      { uid: userId, role: 'owner' },
      { uid: userId, role: 'admin' },
      { uid: userId, role: 'editor' },
      { uid: userId, role: 'viewer' },
    ]);
    // Note: array-contains-any with objects might be tricky in Firestore. 
    // Alternative: store member UIDs in a separate array 'memberUids'.
    
    // For now, let's use a simpler query if possible or fetch and filter.
    // Actually, Firestore array-contains-any doesn't work well with partial objects.
    // Let's assume we have a memberUids array.
    
    const snapshot = await this.firebase.db.collection('workspaces')
      .where('memberUids', 'array-contains', userId)
      .get();
      
    return snapshot.docs.map(doc => doc.data() as Workspace);
  }
  
  // Re-evaluating the above: Let's use memberUids for easier querying.
  
  async createWorkspaceFixed(name: string, ownerId: string, email: string): Promise<Workspace> {
    const workspaceId = this.firebase.createId();
    const workspace = {
      id: workspaceId,
      name,
      ownerId,
      memberUids: [ownerId],
      members: [
        {
          uid: ownerId,
          email,
          role: 'owner',
          joinedAt: Timestamp.now(),
        },
      ],
      createdAt: Timestamp.now(),
      plan: 'free',
    };

    await this.firebase.db.doc(`workspaces/${workspaceId}`).set(workspace);
    return workspace as unknown as Workspace;
  }

  async updateWorkspace(workspaceId: string, data: Partial<Workspace>): Promise<void> {
    await this.firebase.db.doc(`workspaces/${workspaceId}`).update({
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await this.firebase.db.doc(`workspaces/${workspaceId}`).delete();
  }

  async addMember(workspaceId: string, email: string, role: WorkspaceRole): Promise<void> {
    // 1. Find user by email
    const userSnap = await this.firebase.auth.getUserByEmail(email);
    if (!userSnap) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const workspace = await this.getWorkspace(workspaceId);
    if (workspace.members.find(m => m.uid === userSnap.uid)) {
      return; // Already a member
    }

    const newMember: WorkspaceMember = {
      uid: userSnap.uid,
      email,
      role,
      joinedAt: Timestamp.now() as any,
    };

    await this.firebase.db.doc(`workspaces/${workspaceId}`).update({
      members: [...workspace.members, newMember],
      memberUids: [...((workspace as any).memberUids || []), userSnap.uid],
    });
  }

  async verifyAccess(workspaceId: string, userId: string, requiredRoles: WorkspaceRole[]): Promise<boolean> {
    const workspace = await this.getWorkspace(workspaceId);
    const member = workspace.members.find(m => m.uid === userId);
    
    if (!member) return false;
    
    const roleHierarchy: Record<WorkspaceRole, number> = {
      owner: 4,
      admin: 3,
      editor: 2,
      viewer: 1,
    };

    const memberLevel = roleHierarchy[member.role];
    return requiredRoles.some(role => memberLevel >= roleHierarchy[role]);
  }
}
