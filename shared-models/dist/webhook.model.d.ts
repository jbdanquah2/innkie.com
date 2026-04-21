import { Timestamp } from './firebase-types';
export interface Webhook {
    id: string;
    workspaceId: string;
    url: string;
    name: string;
    events: WebhookEvent[];
    isActive: boolean;
    secret: string;
    createdAt: Timestamp | Date;
    lastTriggeredAt?: Timestamp | Date;
}
export type WebhookEvent = 'link.created' | 'link.clicked' | 'link.deleted';
export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    workspaceId: string;
    data: any;
}
