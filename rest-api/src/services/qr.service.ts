import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { QrTemplate } from '@innkie/shared-models';
import { Timestamp } from '@google-cloud/firestore';
import { v4 as uuidv4 } from 'uuid';
import { WorkspaceService } from '../workspace/workspace.service';
import { isPersonalWorkspace } from '../utils/workspace.utils';

@Injectable()
export class QrService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async createTemplate(workspaceId: string | null, userId: string, name: string, config: any): Promise<QrTemplate> {
    const id = uuidv4();
    const effectiveWorkspaceId = workspaceId || `personal_${userId}`;
    
    const template: QrTemplate = {
      id,
      name,
      workspaceId: effectiveWorkspaceId,
      config,
      createdAt: Timestamp.now() as any
    };

    const docData = {
      ...template,
      ownerId: userId
    };

    await this.firebase.db.collection('qr-templates').doc(id).set(docData);

    return template;
  }

  async updateTemplate(id: string, userId: string, name: string, config: any): Promise<void> {
    const docRef = this.firebase.db.collection('qr-templates').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new NotFoundException('Template not found');
    }
    
    const data = doc.data() as QrTemplate & { ownerId: string };
    
    // Ownership check
    if (data.ownerId !== userId) {
      // If not owner, we check if they have 'editor' access to the workspace this template belongs to.
      // (This covers both Team and shared Personal workspaces).
      const hasAccess = await this.workspaceService.verifyAccess(data.workspaceId!, userId, ['editor']);
      if (!hasAccess) {
        throw new ForbiddenException('Unauthorized to update this template');
      }
    }

    await docRef.update({
      name,
      config,
      updatedAt: Timestamp.now()
    });
  }

  async getWorkspaceTemplates(workspaceId: string): Promise<QrTemplate[]> {
    console.log(`[QrService] getWorkspaceTemplates for workspaceId: ${workspaceId}`);
    const isPersonal = isPersonalWorkspace(workspaceId);
    let snapshot;

    if (isPersonal) {
      const ownerId = workspaceId.replace('personal_', '');
      // For personal workspaces, we want templates tagged with this specific workspaceId,
      // OR legacy templates (null/personal) belonging to the owner.
      snapshot = await this.firebase.db.collection('qr-templates')
        .where('workspaceId', 'in', [workspaceId, 'personal', null])
        .get();
        
      // Filter out legacy templates that don't belong to the workspace owner
      // (but keep any template that is explicitly tagged with the workspaceId)
      const docs = snapshot.docs.map(doc => doc.data() as QrTemplate & { ownerId: string });
      return docs
        .filter(t => t.workspaceId === workspaceId || t.ownerId === ownerId)
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } else {
      snapshot = await this.firebase.db.collection('qr-templates')
        .where('workspaceId', '==', workspaceId)
        .get();
        
      return snapshot.docs
        .map(doc => doc.data() as QrTemplate)
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
  }

  async getPersonalTemplates(userId: string, workspaceId?: string): Promise<QrTemplate[]> {
    // Return templates that belong to the current user's personal space
    const personalIds = [`personal_${userId}`, 'personal', null];
    
    const snapshot = await this.firebase.db.collection('qr-templates')
      .where('ownerId', '==', userId)
      .where('workspaceId', 'in', personalIds)
      .get();
    
    return snapshot.docs
      .map(doc => doc.data() as QrTemplate)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }

  async deleteTemplate(id: string, userId: string): Promise<void> {
    const docRef = this.firebase.db.collection('qr-templates').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return;
    
    const data = doc.data() as QrTemplate & { ownerId: string };
    
    // Security: Only owner or team editor can delete
    if (data.ownerId !== userId) {
      const hasAccess = await this.workspaceService.verifyAccess(data.workspaceId!, userId, ['editor']);
      if (!hasAccess) {
        throw new ForbiddenException('Unauthorized to delete this template');
      }
    }

    await docRef.delete();
  }
}
