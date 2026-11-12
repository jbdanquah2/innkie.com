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
const inputCls = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary-500 outline-none text-sm font-medium transition-all';

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
      toast.success('Webhook integration added successfully!');
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
    title: 'Delete Webhook', message: 'Are you sure you want to delete this integration? This endpoint will no longer receive any notifications.', type: 'danger', text: 'Delete Integration',
    run: async () => { try { await webhooksApi.remove(id, wsId!); toast.success('Integration removed.'); await load(); } catch { toast.error('Failed to delete integration.'); } },
  });

  const askRotate = () => active && setConfirm(active.hasApiKey ? {
    title: 'Rotate API Key', message: 'Are you sure you want to rotate the API key? The current key stops working immediately, so update your integrations with the new one.', type: 'warning', text: 'Rotate Key',
    run: issueKey,
  } : {
    title: 'Generate API Key', message: 'A new key will be created for this workspace. It is shown once, so copy it somewhere safe.', type: 'warning', text: 'Generate Key',
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
    try { await navigator.clipboard.writeText(freshKey.apiKey); toast.success('API key copied to clipboard!'); } catch { toast.error('Failed to copy.'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center sm:text-left">Developer Studio</h1>
        <p className="text-slate-500 font-medium mt-1 text-center sm:text-left">Build and scale with the iNNkie infrastructure.</p>
      </div>

      {!active ? (
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-4 text-amber-800 shadow-sm">
          <i className="fas fa-exclamation-triangle text-2xl" />
          <div><p className="font-bold tracking-tight">No active workspace selected</p><p className="text-sm font-medium opacity-80">Please select a workspace from the sidebar to manage API keys and webhooks.</p></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-10">
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit" role="tablist">
              {([['keys', 'API Keys & Webhooks'], ['docs', 'Documentation']] as const).map(([t, l]) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white shadow-sm text-primary-600' : ''}`}>{l}</button>
              ))}
            </div>

            {tab === 'keys' ? (
              <>
                <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-lg"><i className="fas fa-key" /></div><h2 className="text-xl font-bold tracking-tight">Authentication</h2></div>
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100">{active.name}</span>
                  </div>
                  <div className="p-8 space-y-6">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Use this secret key to authenticate your server-side requests. For your security the full key is shown only once, when it is created.</p>
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden shadow-inner">
                      <div className="flex items-center justify-between gap-4 relative z-10">
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-primary-300/50">{freshKey ? 'New API key' : 'Production API Token'}</span>
                          <div className="font-mono text-sm text-primary-400 break-all select-all leading-snug" data-testid="api-key-display">
                            {freshKey ? freshKey.apiKey : active.hasApiKey ? `${active.apiKeyPrefix ?? 'ik_'}${'•'.repeat(32)}` : 'No API key yet'}
                          </div>
                          {!freshKey && active.hasApiKey && active.apiKeyCreatedAt && <p className="mt-2 text-[11px] text-slate-500">Created {toDateSafe(active.apiKeyCreatedAt)?.toLocaleDateString() ?? ''}</p>}
                        </div>
                        {freshKey && (
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={copyKey} aria-label="Copy key" title="Copy to clipboard" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"><i className="fas fa-copy" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                    {freshKey && (
                      <div role="status" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-amber-700 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100">
                        <span><i className="fas fa-exclamation-triangle mr-2 opacity-60" />Copy this key now. You will not be able to see it again.</span>
                        <button type="button" onClick={() => setFreshKey(null)} className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">I have saved it</button>
                      </div>
                    )}
                    {canManageKey ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-3 text-xs font-bold text-amber-600 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100"><i className="fas fa-sync-alt opacity-50" /><span>{active.hasApiKey ? 'Rotating will immediately invalidate the current key.' : 'Generate a key to use the API for this workspace.'}</span></div>
                        <button type="button" onClick={askRotate} disabled={rotating} className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-60">{rotating ? 'Working...' : active.hasApiKey ? 'Rotate Key' : 'Generate Key'}</button>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-slate-500 pt-2">Only the workspace owner and admins can create or rotate the API key.</p>
                    )}
                  </div>
                </section>

                <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg"><i className="fas fa-bolt" /></div><h2 className="text-xl font-bold tracking-tight">Webhooks</h2></div>
                    <button type="button" onClick={() => setShowNew(true)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-100 active:scale-95">Add Endpoint</button>
                  </div>
                  <div className="p-8">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">Receive real-time HTTP POST notifications whenever events happen in your workspace.</p>

                    {showNew && (
                      <div className="mb-10 p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between mb-2"><h3 className="font-black text-sm text-slate-800 uppercase tracking-widest">New Integration</h3><button type="button" aria-label="Close" onClick={() => setShowNew(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times" /></button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div><label htmlFor="wh-name" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Name</label><input id="wh-name" type="text" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} placeholder="My Slack Bot" className={inputCls} /></div>
                          <div>
                            <label htmlFor="wh-url" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Endpoint URL</label>
                            <input id="wh-url" type="url" value={nw.url} onChange={(e) => setNw({ ...nw, url: e.target.value })} placeholder="https://api.myapp.com/webhooks" className={inputCls} />
                            {nw.url && !urlOk && <p className="mt-1 text-xs font-bold text-rose-500" role="alert">Enter a full http(s):// URL</p>}
                          </div>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Events to Send</span>
                          <div className="flex flex-wrap gap-2">{EVENTS.map((ev) => <button key={ev} type="button" aria-pressed={nw.events.includes(ev)} onClick={() => toggleEvent(ev)} className={`px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold transition-all ${nw.events.includes(ev) ? 'bg-primary-600 text-white' : 'bg-white text-slate-600'}`}>{ev}</button>)}</div>
                        </div>
                        <div className="pt-4 flex justify-end"><button type="button" onClick={create} disabled={!canCreate} className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-primary-100 transition-all disabled:opacity-30 active:scale-95">Enable Integration</button></div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {webhooks.length === 0 && <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl"><i className="fas fa-plug text-slate-100 text-5xl mb-4" /><p className="text-slate-400 text-sm font-bold italic">No active webhooks.</p></div>}
                      {webhooks.map((wh) => (
                        <div key={wh.id} className="group p-6 bg-white border border-slate-100 hover:border-primary-100 rounded-3xl transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center gap-3"><h4 className="font-black text-slate-900 tracking-tight">{wh.name}</h4>{wh.isActive && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}</div>
                            <p className="text-xs font-mono text-slate-400 truncate">{wh.url}</p>
                            {wh.secret && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-2 min-w-0">
                                <span className="font-semibold shrink-0">Signing secret</span>
                                <span className="font-mono truncate select-all">{revealed[wh.id] ? wh.secret : '••••••••••••••••'}</span>
                                <button type="button" onClick={() => setRevealed((r) => ({ ...r, [wh.id]: !r[wh.id] }))} className="text-primary-700 hover:underline shrink-0">{revealed[wh.id] ? 'Hide' : 'Show'}</button>
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5 pt-1">{wh.events.map((ev) => <span key={ev} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-100">{ev}</span>)}</div>
                          </div>
                          <div className="flex items-center gap-3 self-end md:self-center">
                            <div className="text-right mr-4 hidden sm:block"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Last Triggered</p><p className="text-[10px] font-bold text-slate-600">{toDateSafe((wh as any).lastTriggeredAt)?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) ?? 'Never'}</p></div>
                            <button type="button" onClick={() => toggle(wh)} aria-label={wh.isActive ? 'Disable webhook' : 'Enable webhook'} aria-pressed={wh.isActive} className={`p-3 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-inner ${wh.isActive ? 'text-emerald-500' : 'text-slate-300'}`}><i className={`fas ${wh.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} /></button>
                            <button type="button" onClick={() => askDelete(wh.id)} aria-label="Delete webhook" className="p-3 bg-rose-50 text-rose-300 hover:text-rose-600 rounded-2xl transition-all"><i className="fas fa-trash-alt" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg"><i className="fas fa-book" /></div><h2 className="text-xl font-bold tracking-tight">API Quickstart</h2></div>
                <div className="p-8 space-y-8">
                  <div><h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Base URL</h3><div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-primary-400 font-mono text-sm shadow-inner">https://api.innkie.com/api/v1</div></div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Authentication</h3>
                    <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">All requests must include your workspace API key in the <code className={code}>x-api-key</code> header.</p>
                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 font-mono text-sm shadow-inner">x-api-key: YOUR_API_KEY</div>
                  </div>
                  <div className="pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Create Short Link</h3><span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-md border border-emerald-100 tracking-widest">POST /links</span></div>
                    <p className="text-sm text-slate-500 font-medium mb-6">Programmatically shorten URLs within your active workspace.</p>
                    <div className="space-y-4">
                      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">cURL Sample</span></div>
                        <pre className="p-6 text-xs text-primary-300 font-mono overflow-x-auto">{`curl -X POST https://api.innkie.com/api/v1/links \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "url": "https://google.com" }'`}</pre>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">JSON Body Parameters</h4>
                        <div className="space-y-3">{[['url', 'string / required'], ['customAlias', 'string / optional'], ['tags', 'string[] / optional']].map(([n, t], i, a) => <div key={n} className={`flex items-center justify-between py-2 ${i < a.length - 1 ? 'border-b border-slate-200/50' : ''}`}><span className="font-mono text-xs font-bold text-primary-600">{n}</span><span className="text-xs font-medium text-slate-400 italic">{t}</span></div>)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
              <h3 className="text-lg font-black mb-4 tracking-tight">Need Help?</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Learn how to verify signatures and secure your webhook endpoints in our guide.</p>
              <div className="space-y-3">
                <Link href="/docs/" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"><span className="text-xs font-black uppercase tracking-widest">Full API Docs</span><i className="fas fa-chevron-right text-[10px] opacity-40 group-hover:opacity-100" /></Link>
              </div>
            </div>
            <div className="card p-8 bg-primary-50 border border-primary-100 rounded-[2.5rem]">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl mb-6 shadow-lg shadow-primary-200"><i className="fas fa-shield-alt" /></div>
              <h3 className="font-black text-slate-800 mb-2">Secure by Design</h3>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">All webhook payloads are signed using <strong>HMAC-SHA256</strong>. Check the <code className={code}>X-Innkie-Signature</code> header to verify requests.</p>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmDialog type={confirm.type} title={confirm.title} message={confirm.message} confirmText={confirm.text} onConfirm={() => { const c = confirm; setConfirm(null); void c.run(); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
