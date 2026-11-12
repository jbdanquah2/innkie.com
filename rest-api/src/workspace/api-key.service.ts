import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { randomBytes } from 'crypto';
import { Workspace } from '@innkie/shared-models';
import { FirebaseService } from '../services/firebase.service';
import { API_KEY_FORMAT } from '../utils/public-api.util';
import { apiKeyPrefix, hashApiKey } from '../utils/secrets.util';

export interface IssuedApiKey {
  /** The full key. Returned exactly once; only its hash is stored. */
  apiKey: string;
  prefix: string;
  createdAt: string;
}

/**
 * API keys live in `apiKeys/{sha256(key)}`, a collection no client can read (see firestore.rules). The workspace
 * document keeps only the non-secret prefix and creation time, so members can see that a key exists but never its value.
 */
@Injectable()
export class ApiKeyService {
  constructor(private readonly firebase: FirebaseService) {}

  /** Issues a new key for the workspace and revokes every previous one. */
  async generateApiKey(workspaceId: string, actorUid: string): Promise<IssuedApiKey> {
    const apiKey = `ik_${randomBytes(24).toString('hex')}`;
    const now = Timestamp.now();
    const db = this.firebase.db;

    const existing = await db.collection('apiKeys').where('workspaceId', '==', workspaceId).get();

    const batch = db.batch();
    existing.docs.forEach((d: any) => batch.delete(db.doc(`apiKeys/${d.id}`)));
    batch.set(db.doc(`apiKeys/${hashApiKey(apiKey)}`), {
      workspaceId,
      prefix: apiKeyPrefix(apiKey),
      createdAt: now,
      createdBy: actorUid,
    });
    batch.update(db.doc(`workspaces/${workspaceId}`), {
      apiKeyPrefix: apiKeyPrefix(apiKey),
      apiKeyCreatedAt: now,
      apiKey: FieldValue.delete(), // remove any legacy plain-text value
    });
    await batch.commit();

    return { apiKey, prefix: apiKeyPrefix(apiKey), createdAt: now.toDate().toISOString() };
  }

  async validateApiKey(apiKey: string): Promise<Workspace> {
    // Reject anything that cannot be one of our keys before touching the database.
    if (!API_KEY_FORMAT.test(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }
    const keyDoc = await this.firebase.db.doc(`apiKeys/${hashApiKey(apiKey)}`).get();
    if (!keyDoc.exists) {
      throw new UnauthorizedException('Invalid API key');
    }
    const workspaceId = keyDoc.data()?.workspaceId;
    const wsDoc = workspaceId ? await this.firebase.db.doc(`workspaces/${workspaceId}`).get() : null;
    if (!wsDoc || !wsDoc.exists) {
      throw new UnauthorizedException('Invalid API key');
    }
    return { ...(wsDoc.data() as Workspace), id: wsDoc.id };
  }
}
