'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Workspace, WorkspaceRole } from '@innkie/shared-models';
import { useAuth } from './auth';
import { workspacesApi } from './api/workspaces';

const ACTIVE_KEY = 'activeWorkspaceId';

interface WorkspaceState {
  workspaces: Workspace[];
  active: Workspace | null;
  /** true once the workspace list has been fetched for the signed-in user */
  ready: boolean;
  setActive: (ws: Workspace | null) => void;
  reload: () => Promise<void>;
  create: (name: string) => Promise<Workspace>;
  update: (id: string, data: Partial<Workspace>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addMember: (id: string, email: string, role: WorkspaceRole) => Promise<void>;
  updateMemberRole: (id: string, uid: string, role: WorkspaceRole) => Promise<void>;
  removeMember: (id: string, uid: string) => Promise<void>;
  rotateApiKey: (id: string) => Promise<{ apiKey: string; prefix: string; createdAt: string }>;
  setDefault: (id: string | null) => Promise<void>;
}

const fail = async () => { throw new Error('WorkspaceProvider missing'); };
const Ctx = createContext<WorkspaceState>({
  workspaces: [], active: null, ready: false, setActive: () => {}, reload: fail as any, create: fail as any, update: fail, remove: fail,
  addMember: fail, updateMemberRole: fail, removeMember: fail, rotateApiKey: fail as any, setDefault: fail,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, profile, ready: authReady, profileReady, patchProfile } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [active, setActiveState] = useState<Workspace | null>(null);
  const [ready, setReady] = useState(false);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const activeRef = useRef<Workspace | null>(null);
  activeRef.current = active;

  const setActive = useCallback((ws: Workspace | null) => {
    setActiveState(ws);
    try { ws ? localStorage.setItem(ACTIVE_KEY, ws.id) : localStorage.removeItem(ACTIVE_KEY); } catch {}
  }, []);

  const uid = user?.uid;
  const reload = useCallback(async () => {
    if (!uid) return;
    try {
      const list = await workspacesApi.list();
      setWorkspaces(list);
      const defaultId = profileRef.current?.defaultWorkspaceId;
      let lastId: string | null = null;
      try { lastId = localStorage.getItem(ACTIVE_KEY); } catch {}
      const myPersonal = list.find((w) => w.id === `personal_${uid}`) ?? null;
      const shared = list.find((w) => w.id !== `personal_${uid}`) ?? null;
      // Priority on a page load: last active (this device) -> your default workspace -> any shared workspace -> personal.
      // The default therefore applies on a fresh sign-in or another device; within a session you stay where you were.
      // A reload after a write (rename, branding, members...) must not move you: keep the current workspace if it still exists.
      const current = activeRef.current && list.find((w) => w.id === activeRef.current!.id);
      const pick = current || (lastId && list.find((w) => w.id === lastId)) || (defaultId && list.find((w) => w.id === defaultId)) || shared || myPersonal;
      setActive(pick || null);
      setReady(true);
    } catch (e: any) {
      console.error('Error loading workspaces:', e?.message || e);
    }
  }, [uid, setActive]);

  // Load once the profile is known; clear everything on sign-out.
  useEffect(() => {
    if (!authReady || !profileReady) return; // wait for users/{uid}: it holds defaultWorkspaceId
    if (uid) { void reload(); return; }
    setWorkspaces([]); setActiveState(null); activeRef.current = null; setReady(false);
    try { localStorage.removeItem(ACTIVE_KEY); } catch {}
  }, [authReady, profileReady, uid, reload]);

  const wrap = <A extends unknown[], R>(fn: (...a: A) => Promise<R>) => async (...a: A) => { const r = await fn(...a); await reload(); return r; };

  const value = useMemo<WorkspaceState>(() => ({
    workspaces, active, ready, setActive, reload,
    create: wrap(workspacesApi.create),
    update: wrap(workspacesApi.update) as any,
    remove: wrap(workspacesApi.remove) as any,
    addMember: wrap(workspacesApi.addMember) as any,
    updateMemberRole: wrap(workspacesApi.updateMemberRole) as any,
    removeMember: wrap(workspacesApi.removeMember) as any,
    rotateApiKey: wrap(workspacesApi.rotateApiKey),
    setDefault: (id) => patchProfile({ defaultWorkspaceId: id || undefined }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [workspaces, active, ready, setActive, reload, patchProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWorkspace = () => useContext(Ctx);
