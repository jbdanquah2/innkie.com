'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Webhook, WebhookEvent } from '@innkie/shared-models';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { webhooksApi } from '@/lib/api/webhooks';
import { useToast } from '@/lib/toast';
import { toDateSafe } from '@/lib/utils/urls';
import { useWorkspace } from '@/lib/workspace';

const EVENTS: WebhookEvent[] = ['link.created', 'link.clicked', 'link.deleted'];
const URL_RE = /^https?:\/\/.+/i;
const code = 'font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded';

type Confirm = { title: string; message: string; type: 'danger' | 'warning'; text: string; run: () => Promise<void> };

export function DeveloperStudio() {
  const toast = useToast();
  const { active, rotateApiKey } = useWorkspace();
  const [tab, setTab] = useState<'keys' | 'docs'>('keys');
  const [freshKey, setFreshKey] = useState<{ apiKey: string; prefix: string } | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [rotating, setRotating] = useState(false);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [nw, setNw] = useState<{ name: string; url: string; events: WebhookEvent[] }>({ name: '', url: '', events: ['link.clicked'] });
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const wsId = active?.id;
  const canManageKey = active?.role === 'owner' || active?.role === 'admin';
  // A freshly issued key is held in memory only: it is shown once and never stored or fetched again.
  useEffect(() => { setFreshKey(null); setRevealed({}); }, [wsId]);

  const load = useCallback(async () => {
    if (!wsId) return;
    try { setWebhooks(await webhooksApi.list(wsId)); } catch (e) { console.error(e); setWebhooks([]); }
  }, [wsId]);
  useEffect(() => { void load(); }, [load]);

  const urlOk = URL_RE.test(nw.url.trim());
  const canCreate = !!nw.name.trim() && urlOk && nw.events.length > 0;
  const toggleEvent = (ev: WebhookEvent) => setNw((s) => ({ ...s, events: s.events.includes(ev) ? s.events.filter((e) => e !== ev) : [...s.events, ev] }));

  const create = async () => {
    if (!wsId || !canCreate) return;
    try {
      await webhooksApi.create(wsId, nw.name.trim(), nw.url.trim(), nw.events);
      toast.success('Webhook added');
      setShowNew(false);
      setNw({ name: '', url: '', events: ['link.clicked'] });
      await load();
    } catch (e: any) { toast.error(e?.message && e.message.length < 120 ? e.message : 'Failed to add webhook integration.'); }
  };

  const toggle = async (wh: Webhook) => {
    if (!wsId) return;
    try {
      await webhooksApi.toggle(wh.id, wsId, !wh.isActive);
      setWebhooks((c) => c.map((w) => (w.id === wh.id ? { ...w, isActive: !wh.isActive } : w)));
      toast.info(`Integration ${!wh.isActive ? 'enabled' : 'disabled'}.`);
    } catch { toast.error('Failed to toggle integration.'); }
  };

  const askDelete = (id: string) => setConfirm({
    title: 'Delete this webhook?', message: 'The endpoint will stop receiving notifications.', type: 'danger', text: 'Delete webhook',
    run: async () => { try { await webhooksApi.remove(id, wsId!); toast.success('Integration removed.'); await load(); } catch { toast.error('Failed to delete integration.'); } },
  });

  const askRotate = () => active && setConfirm(active.hasApiKey ? {
    title: 'Rotate the API key?', message: 'The current key stops working straight away, so update anything that uses it with the new key.', type: 'warning', text: 'Rotate key',
    run: issueKey,
  } : {
    title: 'Create an API key?', message: 'It is shown once, so copy it somewhere safe.', type: 'warning', text: 'Create key',
    run: issueKey,
  });

  const issueKey = async () => {
    if (!active) return;
    setRotating(true);
    try {
      const issued = await rotateApiKey(active.id);
      setFreshKey({ apiKey: issued.apiKey, prefix: issued.prefix });
      toast.success('API key created. Copy it now, it will not be shown again.');
    } catch { toast.error('Failed to create the API key.'); } finally { setRotating(false); }
  };

  const copyKey = async () => {
    if (!freshKey) return;
    try { await navigator.clipboard.writeText(freshKey.apiKey); toast.success('API key copied'); } catch { toast.error('Failed to copy.'); }
  };

  const canEditHooks = active?.role !== 'viewer';
  const panel = 'rounded-lg border border-slate-200 bg-white shadow-xs';
  const input = 'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';
  const btn = 'px-3 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors disabled:opacity-50';
  const pre = 'p-4 bg-slate-900 text-slate-100 rounded-md font-mono text-xs overflow-x-auto';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Developers</h1>
        <p className="text-slate-600 mt-1">API keys, webhooks and a short quickstart for {active ? active.name : 'your workspace'}.</p>
      </div>

      {!active ? (
        <div className="p-4 rounded-md border border-amber-200 bg-amber-50 text-sm text-amber-900" role="status">
          <p className="font-medium">No workspace selected</p>
          <p className="mt-0.5">Choose a workspace in the sidebar to manage its API key and webhooks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex p-1 rounded-lg bg-slate-200/70" role="tablist" aria-label="Developer sections">
              {([['keys', 'Keys and webhooks'], ['docs', 'Quickstart']] as const).map(([t, l]) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === t ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>{l}</button>
              ))}
            </div>

            {tab === 'keys' ? (
              <>
                <section className={panel} aria-label="API key">
                  <div className="px-5 pt-5 pb-3"><h2 className="font-semibold text-slate-900">API key</h2></div>
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-600 leading-relaxed">Use this key to call the API from your server. The full key is shown once, when it is created, and cannot be retrieved later.</p>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">{freshKey ? 'New key' : 'Current key'}</p>
                        <p className="mt-0.5 font-mono text-sm text-slate-900 break-all select-all" data-testid="api-key-display">
                          {freshKey ? freshKey.apiKey : active.hasApiKey ? `${active.apiKeyPrefix ?? 'ik_'}${'•'.repeat(24)}` : 'No key yet'}
                        </p>
                        {!freshKey && active.hasApiKey && active.apiKeyCreatedAt && <p className="mt-1 text-xs text-slate-500">Created {toDateSafe(active.apiKeyCreatedAt)?.toLocaleDateString() ?? ''}</p>}
                      </div>
                      {freshKey && <button type="button" onClick={copyKey} className={`${btn} shrink-0`}>Copy</button>}
                    </div>
                    {freshKey && (
                      <div role="status" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-amber-900 bg-amber-50 px-4 py-3 rounded-md border border-amber-200">
                        <span>Copy this key now. You won&apos;t be able to see it again.</span>
                        <button type="button" onClick={() => setFreshKey(null)} className={`${btn} shrink-0`}>I have saved it</button>
                      </div>
                    )}
                    {canManageKey ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">{active.hasApiKey ? 'Rotating a key stops the current one working straight away.' : 'Create a key to use the API with this workspace.'}</p>
                        <button type="button" onClick={askRotate} disabled={rotating} className={`${btn} shrink-0`}>{rotating ? 'Working…' : active.hasApiKey ? 'Rotate key' : 'Create key'}</button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Only the workspace owner and admins can create or rotate the key.</p>
                    )}
                  </div>
                </section>

                <section className={panel} aria-label="Webhooks">
                  <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">Webhooks</h2>
                    {canEditHooks && <button type="button" onClick={() => setShowNew(true)} className={btn}>Add endpoint</button>}
                  </div>
                  <div className="px-5 pb-5 border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">We send an HTTP POST to your endpoint when something happens in this workspace.</p>

                    {showNew && (
                      <div className="mb-5 p-4 rounded-md border border-slate-200 bg-slate-50 space-y-4">
                        <div className="flex items-center justify-between"><h3 className="font-medium text-slate-900">New endpoint</h3><button type="button" aria-label="Close" onClick={() => setShowNew(false)} className="text-slate-500 hover:text-slate-900"><i className="fas fa-times" aria-hidden="true" /></button></div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div><label htmlFor="wh-name" className="block text-sm font-medium text-slate-700 mb-1.5">Name</label><input id="wh-name" type="text" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} placeholder="Slack bot" className={input} /></div>
                          <div>
                            <label htmlFor="wh-url" className="block text-sm font-medium text-slate-700 mb-1.5">Endpoint URL</label>
                            <input id="wh-url" type="url" value={nw.url} onChange={(e) => setNw({ ...nw, url: e.target.value })} placeholder="https://example.com/webhooks" className={input} />
                            {nw.url && !urlOk && <p className="mt-1.5 text-sm text-rose-700" role="alert">Enter a full address starting with https://</p>}
                          </div>
                        </div>
                        <fieldset>
                          <legend className="block text-sm font-medium text-slate-700 mb-2">Send me</legend>
                          <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {EVENTS.map((ev) => (
                              <label key={ev} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" checked={nw.events.includes(ev)} onChange={() => toggleEvent(ev)} className="h-4 w-4 rounded border-slate-300 accent-primary-600" /><span className="font-mono text-xs">{ev}</span></label>
                            ))}
                          </div>
                        </fieldset>
                        <div className="flex justify-end"><button type="button" onClick={create} disabled={!canCreate} className="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-on-primary text-sm font-semibold transition-colors">Add endpoint</button></div>
                      </div>
                    )}

                    {webhooks.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-500 rounded-md border border-dashed border-slate-300">No webhooks yet.</p>
                    ) : (
                      <ul className="divide-y divide-slate-200 border-y border-slate-200">
                        {webhooks.map((wh) => (
                          <li key={wh.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-2"><span className="font-medium text-slate-900">{wh.name}</span><span className={`text-xs px-1.5 py-0.5 rounded border ${wh.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>{wh.isActive ? 'On' : 'Off'}</span></p>
                              <p className="text-xs font-mono text-slate-500 truncate">{wh.url}</p>
                              {wh.secret && (
                                <p className="mt-1 text-xs text-slate-500 flex items-center gap-2 min-w-0">
                                  <span className="shrink-0">Signing secret</span>
                                  <span className="font-mono truncate select-all">{revealed[wh.id] ? wh.secret : '••••••••••••••••'}</span>
                                  <button type="button" onClick={() => setRevealed((r) => ({ ...r, [wh.id]: !r[wh.id] }))} className="text-primary-700 hover:underline shrink-0">{revealed[wh.id] ? 'Hide' : 'Show'}</button>
                                </p>
                              )}
                              <p className="mt-1 text-xs text-slate-500">{wh.events.join(', ')} · Last sent {toDateSafe((wh as any).lastTriggeredAt)?.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) ?? 'never'}</p>
                            </div>
                            {canEditHooks && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button type="button" onClick={() => toggle(wh)} aria-pressed={wh.isActive} className={btn}>{wh.isActive ? 'Turn off' : 'Turn on'}</button>
                                <button type="button" onClick={() => askDelete(wh.id)} className={`${btn} text-rose-700 hover:border-rose-400`}>Delete</button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <section className={panel} aria-label="Quickstart">
                <div className="px-5 pt-5 pb-3"><h2 className="font-semibold text-slate-900">Quickstart</h2></div>
                <div className="px-5 pb-5 border-t border-slate-200 pt-4 space-y-6">
                  <div><h3 className="text-sm font-medium text-slate-900 mb-2">Base URL</h3><pre className={pre}>https://api.innkie.com/api/v1</pre></div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 mb-2">Authentication</h3>
                    <p className="text-sm text-slate-600 mb-2 leading-relaxed">Send your workspace API key in the <code className={code}>x-api-key</code> header.</p>
                    <pre className={pre}>x-api-key: YOUR_API_KEY</pre>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 mb-1">Create a short link</h3>
                    <p className="text-sm text-slate-600 mb-2"><code className={code}>POST /links</code> shortens an address in this workspace.</p>
                    <pre className={pre}>{`curl -X POST https://api.innkie.com/api/v1/links \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "url": "https://example.com" }'`}</pre>
                    <dl className="mt-3 divide-y divide-slate-200 border-y border-slate-200 text-sm">
                      {[['url', 'string, required'], ['customAlias', 'string, optional'], ['tags', 'string[], optional']].map(([n, t]) => <div key={n} className="py-2 flex items-center justify-between"><dt className="font-mono text-xs text-slate-900">{n}</dt><dd className="text-slate-500">{t}</dd></div>)}
                    </dl>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-4">
            <div className={`${panel} p-5`}>
              <h2 className="font-semibold text-slate-900">Full documentation</h2>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Every endpoint, with examples and error codes.</p>
              <Link href="/docs/" className="inline-block mt-3 text-sm font-medium text-primary-700 hover:underline">Open the API docs</Link>
            </div>
            <div className={`${panel} p-5`}>
              <h2 className="font-semibold text-slate-900">Verifying webhooks</h2>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">Each payload is signed with HMAC-SHA256. Check the <code className={code}>X-Innkie-Signature</code> header against your signing secret before trusting a request.</p>
            </div>
          </aside>
        </div>
      )}

      {confirm && <ConfirmDialog type={confirm.type} title={confirm.title} message={confirm.message} confirmText={confirm.text} onConfirm={() => { const c = confirm; setConfirm(null); void c.run(); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
