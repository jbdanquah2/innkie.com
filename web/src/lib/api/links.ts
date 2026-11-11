import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import type { ShortUrl } from '@innkie/shared-models';
import { apiJson } from '../api';
import { env } from '../env';
import { getDb } from '../firebase';

const base = `${env.apiUrl}/v1/links`;
const quiet = { headers: { 'X-Skip-Loading': 'true' } };

export const linksApi = {
  /** All links in a workspace (personal workspaces use their `personal_<uid>` id). */
  listForWorkspace: (workspaceId: string) => apiJson<ShortUrl[]>(`${base}/workspace/${workspaceId || 'personal'}`, quiet),
  update: (shortCode: string, updates: Record<string, unknown>) => apiJson(`${base}/${shortCode}`, { method: 'PUT', json: updates }),
  remove: (id: string) => apiJson(`${base}/${id}`, { method: 'DELETE' }),

  /** Single link straight from Firestore (owners and workspace members may read it under the rules). */
  async getByCode(shortCode: string): Promise<ShortUrl | null> {
    const snap = await getDoc(doc(getDb(), `shortUrls/${shortCode}`));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as ShortUrl) : null;
  },

  /**
   * Is this alias already used by some link? Returns null when it can't be determined
   * (Firestore rules deny listing other users' protected links), so callers must not treat that as "free".
   */
  async aliasExists(alias: string): Promise<boolean | null> {
    try {
      const snap = await getDocs(query(collection(getDb(), 'shortUrls'), where('customAlias', '==', alias), limit(1)));
      return !snap.empty;
    } catch {
      return null;
    }
  },
};
