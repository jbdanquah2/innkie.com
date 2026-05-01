import { ShortUrl } from './short-url.model';
import { Workspace } from './workspace.model';
/**
 * Checks if a workspace ID belongs to a personal workspace.
 */
export declare function isPersonalWorkspace(workspaceId: string | null | undefined): boolean;
/**
 * Checks if a workspace ID belongs to a team workspace.
 */
export declare function isTeamWorkspace(workspaceId: string | null | undefined): boolean;
/**
 * Determines if a link belongs to the given workspace, accounting for legacy personal links.
 */
export declare function isLinkInWorkspace(link: ShortUrl, workspace: Workspace | null): boolean;
