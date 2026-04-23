import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';
import { Workspace, WorkspaceMember, WorkspaceRole } from '@innkie/shared-models';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import * as log from 'loglevel';

@Injectable()
export class WorkspaceService {
  constructor(private readonly firebase: FirebaseService) {}

  async createWorkspace(name: string, ownerId: string, email: string, customId?: string, branding?: any): Promise<Workspace> {
    const workspaceId = customId || this.firebase.createId();
    const workspace = {
      id: workspaceId,
      name,
      ownerId,
      memberUids: [ownerId],
      members: [
        {
          uid: ownerId,
          email,
          role: 'owner' as WorkspaceRole,
          joinedAt: Timestamp.now(),
        },
      ],
      branding: branding || null,
      createdAt: Timestamp.now(),
      plan: 'free',
    };

    await this.firebase.db.doc(`workspaces/${workspaceId}`).set(workspace);
    console.log(`Workspace created: ${workspaceId} by user ${ownerId}`);
    return workspace as unknown as Workspace;
  }

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const data = await this.firebase.getDocData(`workspaces/${workspaceId}`);
    if (!data) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }
    return data as Workspace;
  }

  async getUserWorkspaces(userId: string, email?: string): Promise<Workspace[]> {
    console.log(`[WorkspaceService] Fetching workspaces for user: ${userId} (${email || 'no email'})`);
    
    // 1. Primary lookup by memberUids
    const memberSnapshot = await this.firebase.db.collection('workspaces')
      .where('memberUids', 'array-contains', userId)
      .get();
    
    let workspaces = memberSnapshot.docs.map(doc => {
        const data = doc.data() as Workspace;
        return { ...data, id: doc.id };
    });
    console.log(`[WorkspaceService] Found ${workspaces.length} workspaces by memberUids`);
    
    // 2. Fallback: find by ownerId (for legacy support)
    const ownerSnapshot = await this.firebase.db.collection('workspaces')
      .where('ownerId', '==', userId)
      .get();
    
    ownerSnapshot.docs.forEach(doc => {
      const data = doc.data() as Workspace;
      if (!workspaces.find(w => w.id === doc.id)) {
        workspaces.push({ ...data, id: doc.id });
      }
    });
    console.log(`[WorkspaceService] Total workspaces after owner fallback: ${workspaces.length}`);

    // 3. Lazy Initialization: Ensure Personal Workspace exists
    const personalId = `personal_${userId}`;
    const hasPersonal = workspaces.some(w => w.id === personalId);
    console.log(`[WorkspaceService] Personal workspace exists: ${hasPersonal}`);
    
    if (!hasPersonal) {
      console.log(`[WorkspaceService] Initializing Personal Workspace for user ${userId}`);
      try {
        // Fetch user data for branding and email
        const userDoc = await this.firebase.getDocData(`users/${userId}`);
        const userEmail = email || userDoc?.email || `${userId}@innkie.com`; // Absolute fallback email
        const personalBranding = userDoc?.personalBranding;
        
        const personalWs = await this.createWorkspace(
          'Personal Workspace', 
          userId, 
          userEmail, 
          personalId, 
          personalBranding
        );
        
        workspaces.unshift(personalWs);
        console.log(`[WorkspaceService] Created and added personal workspace: ${personalId}`);
      } catch (err: any) {
        console.error(`[WorkspaceService] Failed to initialize personal workspace: ${err.message}`);
      }
    }

    console.log(`[WorkspaceService] Total workspaces returning: ${workspaces.length}`);
    workspaces.forEach(w => console.log(` - Workspace: ${w.id} (${w.name})`));
    return workspaces;
  }

  async updateWorkspace(workspaceId: string, data: Partial<Workspace>): Promise<void> {
    await this.firebase.db.doc(`workspaces/${workspaceId}`).update({
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    if (workspace.id.startsWith('personal_')) {
      throw new BadRequestException('Cannot delete your Personal Workspace.');
    }
    await this.firebase.db.doc(`workspaces/${workspaceId}`).delete();
  }

  async addMember(workspaceId: string, email: string, role: WorkspaceRole): Promise<void> {
    const userSnap = await this.firebase.auth.getUserByEmail(email).catch(() => null);
    if (!userSnap) {
      throw new NotFoundException(`User with email ${email} not found. They must have an account first.`);
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

    const memberUids = (workspace as any).memberUids || workspace.members.map(m => m.uid);
    
    await this.firebase.db.doc(`workspaces/${workspaceId}`).update({
      members: [...workspace.members, newMember],
      memberUids: [...new Set([...memberUids, userSnap.uid])],
      updatedAt: Timestamp.now(),
    });
    console.log(`Added member ${userSnap.uid} to workspace ${workspaceId} as ${role}`);
  }

  async updateMemberRole(workspaceId: string, memberUid: string, newRole: WorkspaceRole): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    const memberIndex = workspace.members.findIndex(m => m.uid === memberUid);
    
    if (memberIndex === -1) {
      throw new NotFoundException(`Member ${memberUid} not found in workspace ${workspaceId}`);
    }

    const currentMember = workspace.members[memberIndex];

    // Safety: prevent changing role of the only owner
    if (currentMember.role === 'owner' && newRole !== 'owner') {
      const otherOwners = workspace.members.filter(m => m.role === 'owner' && m.uid !== memberUid);
      if (otherOwners.length === 0) {
        throw new BadRequestException('Cannot change the role of the sole owner.');
      }
    }

    workspace.members[memberIndex].role = newRole;

    await this.firebase.db.doc(`workspaces/${workspaceId}`).update({
      members: workspace.members,
      updatedAt: Timestamp.now(),
    });
    console.log(`Updated role for member ${memberUid} in workspace ${workspaceId} to ${newRole}`);
  }

  async removeMember(workspaceId: string, memberUid: string): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    const member = workspace.members.find(m => m.uid === memberUid);

    if (!member) {
      return; // Already not a member
    }

    // Safety: prevent removing the sole owner
    if (member.role === 'owner') {
      const otherOwners = workspace.members.filter(m => m.role === 'owner' && m.uid !== memberUid);
      if (otherOwners.length === 0) {
        throw new BadRequestException('Cannot remove the sole owner of the workspace.');
      }
    }

    const updatedMembers = workspace.members.filter(m => m.uid !== memberUid);
    const updatedMemberUids = ((workspace as any).memberUids || []).filter((id: string) => id !== memberUid);

    await this.firebase.db.doc(`workspaces/${workspaceId}`).update({
      members: updatedMembers,
      memberUids: updatedMemberUids,
      updatedAt: Timestamp.now(),
    });
    console.log(`Removed member ${memberUid} from workspace ${workspaceId}`);
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
