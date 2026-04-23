import { Workspace, ShortUrl } from '@innkie/shared-models';

/**
 * Checks if a workspace ID belongs to a personal workspace.
 */
export function isPersonalWorkspaceId(workspaceId: string | null | undefined): boolean {
  if (!workspaceId) return true;
  return workspaceId === 'personal' || workspaceId.startsWith('personal_');
}

/**
 * Determines if a link belongs to the given workspace, accounting for legacy personal links.
 */
export function isLinkInWorkspace(link: ShortUrl, workspace: Workspace | null): boolean {
  if (!workspace) {
    // Legacy behavior: if no workspace is active, show only personal links
    return !link.workspaceId || link.workspaceId === 'personal';
  }

  // Exact match
  if (link.workspaceId === workspace.id) return true;

  // Personal workspace fallback for legacy links
  if (workspace.id.startsWith('personal_')) {
    return !link.workspaceId || link.workspaceId === 'personal';
  }

  return false;
}
