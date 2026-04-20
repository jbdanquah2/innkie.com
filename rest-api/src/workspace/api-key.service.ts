import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';
import { Workspace } from '@innkie/shared-models';
import { randomBytes } from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private readonly firebase: FirebaseService) {}

  async generateApiKey(workspaceId: string): Promise<string> {
    const apiKey = `ik_${randomBytes(24).toString('hex')}`;
    await this.firebase.db.doc(`workspaces/${workspaceId}`).update({
      apiKey: apiKey,
    });
    return apiKey;
  }

  async validateApiKey(apiKey: string): Promise<Workspace> {
    const snapshot = await this.firebase.db
      .collection('workspaces')
      .where('apiKey', '==', apiKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new UnauthorizedException('Invalid API key');
    }

    return snapshot.docs[0].data() as Workspace;
  }
}
