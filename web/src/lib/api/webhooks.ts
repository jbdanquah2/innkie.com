import type { Webhook, WebhookEvent } from '@innkie/shared-models';
import { apiJson } from '../api';
import { env } from '../env';

const base = `${env.apiUrl}/webhooks`;

export const webhooksApi = {
  list: (workspaceId: string) => apiJson<Webhook[]>(`${base}?workspaceId=${workspaceId}`),
  create: (workspaceId: string, name: string, url: string, events: WebhookEvent[]) => apiJson<Webhook>(base, { method: 'POST', json: { workspaceId, name, url, events } }),
  toggle: (id: string, workspaceId: string, isActive: boolean) => apiJson(`${base}/${id}/toggle`, { method: 'PUT', json: { workspaceId, isActive } }),
  remove: (id: string, workspaceId: string) => apiJson(`${base}/${id}?workspaceId=${workspaceId}`, { method: 'DELETE' }),
};
