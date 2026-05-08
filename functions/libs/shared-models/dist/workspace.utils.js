"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPersonalWorkspace = isPersonalWorkspace;
exports.isTeamWorkspace = isTeamWorkspace;
exports.isLinkInWorkspace = isLinkInWorkspace;
/**
 * Checks if a workspace ID belongs to a personal workspace.
 */
function isPersonalWorkspace(workspaceId) {
    if (!workspaceId)
        return true;
    return workspaceId === 'personal' || workspaceId.startsWith('personal_');
}
/**
 * Checks if a workspace ID belongs to a team workspace.
 */
function isTeamWorkspace(workspaceId) {
    if (!workspaceId)
        return false;
    return !workspaceId.startsWith('personal_') && workspaceId !== 'personal';
}
/**
 * Determines if a link belongs to the given workspace, accounting for legacy personal links.
 */
function isLinkInWorkspace(link, workspace) {
    if (!workspace) {
        // Legacy behavior: if no workspace is active, show only personal links
        return !link.workspaceId || link.workspaceId === 'personal';
    }
    // Exact match
    if (link.workspaceId === workspace.id)
        return true;
    // Personal workspace fallback for legacy links
    if (workspace.id.startsWith('personal_')) {
        return !link.workspaceId || link.workspaceId === 'personal';
    }
    return false;
}
