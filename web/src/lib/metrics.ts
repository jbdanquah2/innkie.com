'use client';
import type { PlatformToolType } from '@innkie/shared-models';
import { apiFetch } from './api';
import { env } from './env';
import { getFirebaseAuth } from './firebase';

/** Fire-and-forget tool usage event (ported from PlatformMetricsService.logToolUsage). */
export async function logToolUsage(toolType: PlatformToolType, action: string, metadata?: unknown): Promise<void> {
  try {
    let workspaceId = 'guest';
    try {
      workspaceId = localStorage.getItem('activeWorkspaceId') || 'guest';
    } catch {}
    const userId = getFirebaseAuth().currentUser?.uid || 'guest';
    await apiFetch(`${env.apiUrl}/metrics/event`, {
      method: 'POST',
      body: JSON.stringify({ workspaceId, userId, toolType, action, metadata, timestamp: new Date() }),
    });
  } catch (e) {
    console.error('Failed to log platform event', e);
  }
}
