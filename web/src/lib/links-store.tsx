'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ShortUrl } from '@innkie/shared-models';
import { useAuth } from './auth';
import { useWorkspace } from './workspace';
import { linksApi } from './api/links';
import { createShortUrl, type CreateLinkOptions } from './links';
import { logToolUsage } from './metrics';

interface LinksState {
  links: ShortUrl[];
  loading: boolean;
  /** true once the active workspace's links have been fetched (successfully or not) */
  loaded: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** Creates a link in the active workspace and prepends it to the list. */
  create: (url: string, opts?: CreateLinkOptions) => Promise<ShortUrl>;
  update: (shortCode: string, updates: Record<string, unknown>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const none = async () => { throw new Error('LinksProvider missing'); };
const Ctx = createContext<LinksState>({ links: [], loading: false, loaded: false, error: null, reload: none as any, create: none as any, update: none, remove: none });

/** Links of the active workspace, shared by every app page (replaces ShortUrlService.allShortUrls). */
export function LinksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { active } = useWorkspace();
  const [links, setLinks] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0); // ignore responses from a workspace we've already switched away from

  const wsId = active?.id;
  const reload = useCallback(async () => {
    if (!wsId) return;
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const list = await linksApi.listForWorkspace(wsId);
      if (seq.current === mine) setLinks(list);
    } catch (e: any) {
      if (seq.current === mine) setError(e?.message || 'Failed to load links');
    } finally {
      if (seq.current === mine) { setLoading(false); setLoaded(true); }
    }
  }, [wsId]);

  useEffect(() => { setLinks([]); setLoaded(false); if (user && wsId) void reload(); }, [user, wsId, reload]);

  const create = useCallback(async (url: string, opts: CreateLinkOptions = {}) => {
    const created = (await createShortUrl(url, { workspaceId: wsId ?? null, ...opts })) as unknown as ShortUrl;
    setLinks((cur) => [created, ...cur.filter((l) => l.id !== created.id)]);
    void logToolUsage('link_shortener', 'shorten');
    return created;
  }, [wsId]);

  const update = useCallback(async (shortCode: string, updates: Record<string, unknown>) => {
    await linksApi.update(shortCode, updates);
    const { password: _pw, ...local } = updates; // never keep a plain password in client state
    setLinks((cur) => cur.map((l) => (l.shortCode === shortCode ? ({ ...l, ...local } as ShortUrl) : l)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await linksApi.remove(id);
    setLinks((cur) => cur.filter((l) => l.id !== id));
  }, []);

  const value = useMemo(() => ({ links, loading, loaded, error, reload, create, update, remove }), [links, loading, loaded, error, reload, create, update, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLinks = () => useContext(Ctx);
