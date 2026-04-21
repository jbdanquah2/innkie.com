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
    const template: QrTemplate = {
      id,
      name,
      workspaceId: workspaceId || undefined,
      config,
      createdAt: Timestamp.now() as any
    };

    const docData = {
      ...template,
      workspaceId: workspaceId || null, // Ensure Firestore gets null, not undefined
      ownerId: userId
    };

    await this.firebase.db.collection('qr-templates').doc(id).set(docData);

    return template;
  }

  async getWorkspaceTemplates(workspaceId: string): Promise<QrTemplate[]> {
    const snapshot = await this.firebase.db.collection('qr-templates')
      .where('workspaceId', '==', workspaceId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as QrTemplate);
  }

  async getPersonalTemplates(userId: string): Promise<QrTemplate[]> {
    const snapshot = await this.firebase.db.collection('qr-templates')
      .where('ownerId', '==', userId)
      .where('workspaceId', '==', null)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as QrTemplate);
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
