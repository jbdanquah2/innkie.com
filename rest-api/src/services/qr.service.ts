import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { QrTemplate } from '@innkie/shared-models';
import { Timestamp } from '@google-cloud/firestore';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QrService {
  constructor(private readonly firebase: FirebaseService) {}

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
      throw new Error('Template not found');
    }
    
    const data = doc.data();
    if (data?.ownerId !== userId) {
      throw new Error('Unauthorized to update this template');
    }

    await docRef.update({
      name,
      config,
      updatedAt: Timestamp.now()
    });
  }

  async getWorkspaceTemplates(workspaceId: string): Promise<QrTemplate[]> {
    const snapshot = await this.firebase.db.collection('qr-templates')
      .where('workspaceId', '==', workspaceId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as QrTemplate);
  }

  async getPersonalTemplates(userId: string, workspaceId?: string): Promise<QrTemplate[]> {
    // Return templates that belong to the new personal workspace ID OR legacy null/'personal' IDs
    const personalIds = [workspaceId, `personal_${userId}`, 'personal', null].filter(Boolean);
    
    const snapshot = await this.firebase.db.collection('qr-templates')
      .where('ownerId', '==', userId)
      .where('workspaceId', 'in', personalIds)
      .get();
    
    // Sort manually as Firestore 'in' queries can complicate orderBy on createdAt
    return snapshot.docs
      .map(doc => doc.data() as QrTemplate)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }

  async deleteTemplate(id: string, userId: string): Promise<void> {
    const docRef = this.firebase.db.collection('qr-templates').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return;
    
    const data = doc.data();
    // Security: Only owner can delete for now, or we implement RBAC later
    if (data?.ownerId !== userId) {
      throw new Error('Unauthorized to delete this template');
    }

    await docRef.delete();
  }
}
