import { ShortUrl } from './short-url.model';
import { Workspace } from './workspace.model';

/**
 * Checks if a workspace ID belongs to a personal workspace.
 */
export function isPersonalWorkspace(workspaceId: string | null | undefined): boolean {
  if (!workspaceId) return true;
  return workspaceId === 'personal' || workspaceId.startsWith('personal_');
}

/**
 * Checks if a workspace ID belongs to a team workspace.
 */
export function isTeamWorkspace(workspaceId: string | null | undefined): boolean {
  if (!workspaceId) return false;
  return !workspaceId.startsWith('personal_') && workspaceId !== 'personal';
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
