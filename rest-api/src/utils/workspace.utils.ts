export function isPersonalWorkspace(workspaceId: string | null | undefined): boolean {
  if (!workspaceId) return true;
  return workspaceId === 'personal' || workspaceId.startsWith('personal_');
}

export function isTeamWorkspace(workspaceId: string | null | undefined): boolean {
  if (!workspaceId) return false;
  return !workspaceId.startsWith('personal_') && workspaceId !== 'personal';
}
