import type { QrTemplate } from '@innkie/shared-models';
import { apiJson } from '../api';
import { env } from '../env';

const base = `${env.apiUrl}/qr/templates`;

export const qrApi = {
  list: (workspaceId: string) => apiJson<QrTemplate[]>(`${base}?workspaceId=${workspaceId}`),
  create: (workspaceId: string, name: string, config: unknown) => apiJson<QrTemplate>(base, { method: 'POST', json: { workspaceId, name, config } }),
  update: (id: string, name: string, config: unknown) => apiJson(`${base}/${id}`, { method: 'PUT', json: { name, config } }),
  remove: (id: string, workspaceId?: string) => apiJson(`${base}/${id}${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, { method: 'DELETE' }),
};
