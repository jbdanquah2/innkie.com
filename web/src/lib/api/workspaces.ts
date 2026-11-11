import type { Workspace, WorkspaceRole } from '@innkie/shared-models';
import { apiJson } from '../api';
import { env } from '../env';

const base = `${env.apiUrl}/v1/workspaces`;

export const workspacesApi = {
  list: () => apiJson<Workspace[]>(base),
  create: (name: string) => apiJson<Workspace>(base, { method: 'POST', json: { name } }),
  update: (id: string, data: Partial<Workspace>) => apiJson(`${base}/${id}`, { method: 'PUT', json: data }),
  remove: (id: string) => apiJson(`${base}/${id}`, { method: 'DELETE' }),
  addMember: (id: string, email: string, role: WorkspaceRole) => apiJson(`${base}/${id}/members`, { method: 'POST', json: { email, role } }),
  updateMemberRole: (id: string, uid: string, role: WorkspaceRole) => apiJson(`${base}/${id}/members/${uid}/role`, { method: 'PUT', json: { role } }),
  removeMember: (id: string, uid: string) => apiJson(`${base}/${id}/members/${uid}`, { method: 'DELETE' }),
  rotateApiKey: async (id: string) => (await apiJson<{ apiKey: string }>(`${base}/${id}/api-key`, { method: 'POST', json: {} })).apiKey,
};
