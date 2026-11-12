'use client';
import { useEffect, useState } from 'react';
import type { QrTemplate, ShortUrl } from '@innkie/shared-models';
import { QrDesignControls } from './QrDesignControls';
import { qrApi } from '@/lib/api/qr';
import { env } from '@/lib/env';
import { DEFAULT_DESIGN, fromQrConfig, toQrConfig, type QrDesign } from '@/lib/qr-config';
import { escapeVcard as vEsc, escapeWifi as wEsc } from '@/lib/qr-payload';
import { useQrCode } from '@/lib/qr-preview';
import { useToast } from '@/lib/toast';
import { useWorkspace } from '@/lib/workspace';

type Content = 'URL' | 'vCard' | 'WiFi' | 'SMS';
const TABS = ['Content', 'Shapes', 'Colors', 'Logo', 'Background', 'Templates'] as const;
type Tab = (typeof TABS)[number];

// Escaping per the vCard 3.0 and Wi-Fi QR formats, so names/passwords containing ; , : \ " still scan.

const inputCls = 'block w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200';

export function LinkQrDialog({ link, onClose }: { link: ShortUrl; onClose: () => void }) {
  const toast = useToast();
  const { active } = useWorkspace();
  const [tab, setTab] = useState<Tab>('Content');
  const [d, setD] = useState<QrDesign>(() => (link.qrConfig ? fromQrConfig(link.qrConfig) : DEFAULT_DESIGN));
  const set = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => { setD((s) => ({ ...s, [k]: v })); setSelectedTemplate(null); };
  const [content, setContent] = useState<Content>('URL');
  const [vcard, setVcard] = useState({ name: '', phone: '', email: '', org: '', note: '' });
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [sms, setSms] = useState({ phone: '', message: '' });
  const [templates, setTemplates] = useState<QrTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState('');

  const shortUrl = `${env.appUrl}/${link.shortCode}`;
  const data = content === 'vCard' ? `BEGIN:VCARD\nVERSION:3.0\nFN:${vEsc(vcard.name)}\nTEL:${vEsc(vcard.phone)}\nEMAIL:${vEsc(vcard.email)}\nORG:${vEsc(vcard.org)}\nNOTE:${vEsc(vcard.note)}\nEND:VCARD`
    : content === 'WiFi' ? `WIFI:S:${wEsc(wifi.ssid)};T:${wifi.encryption};P:${wEsc(wifi.password)};;`
    : content === 'SMS' ? `SMSTO:${sms.phone}:${sms.message}`
    : shortUrl;
  const { host, download } = useQrCode(d, data, { size: 280, margin: 5 });

  useEffect(() => { if (active) qrApi.list(active.id).then(setTemplates).catch(() => console.error('Failed to load workspace templates')); }, [active]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const saveTemplate = async () => {
    if (!name.trim()) return toast.warn('Please enter a template name');
    if (!active) return toast.error('Failed to save template. Ensure you are in an active workspace.');
    try {
      const t = await qrApi.create(active.id, name.trim(), toQrConfig(d));
      setTemplates((c) => [...c, t]);
      setName('');
      toast.success('Brand style saved to workspace');
    } catch { toast.error('Failed to save template. Ensure you are in an active workspace.'); }
  };

  const wifiOk = content !== 'WiFi' || !!wifi.ssid;

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="lqr-heading" onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div><h2 id="lqr-heading" className="text-lg font-semibold text-slate-900">QR code</h2><p className="text-sm text-slate-500 mt-0.5">For /{link.shortCode}</p></div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-8 h-8 -mr-2 flex items-center justify-center text-slate-500 hover:text-slate-900"><i className="fas fa-times" aria-hidden="true" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6">
          <div className="md:col-span-5 space-y-5">
            <div className="flex flex-col items-center gap-3 p-6 rounded-lg border border-slate-200 bg-slate-50">
              <div ref={host} className="rounded-md bg-white border border-slate-200 overflow-hidden flex items-center justify-center" style={{ width: 280, height: 280, maxWidth: '100%' }} role="img" aria-label="QR code preview" />
              <p className="text-sm text-slate-500">{wifiOk ? 'Updates as you change the design.' : 'Enter the network name to see the code.'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <label htmlFor="lqr-name" className="block text-sm font-medium text-slate-700 mb-1.5">Save this design</label>
              <div className="flex gap-2">
                <input id="lqr-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer promo" className={inputCls} />
                <button type="button" onClick={saveTemplate} className="shrink-0 px-3 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors">Save</button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Saved designs are shared with your workspace and can be applied to other links.</p>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="inline-flex flex-wrap p-1 rounded-lg bg-slate-100 mb-5" role="tablist" aria-label="QR options">
              {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${tab === t ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>{t === 'Templates' ? 'Saved designs' : t}</button>)}
            </div>

            {tab === 'Content' && (
              <div className="space-y-4">
                <div className="inline-flex p-1 rounded-lg bg-slate-100" role="group" aria-label="What the code holds">
                  {(['URL', 'vCard', 'WiFi', 'SMS'] as const).map((c) => <button key={c} type="button" aria-pressed={content === c} onClick={() => setContent(c)} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${content === c ? 'bg-white shadow-sm font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>{c === 'URL' ? 'Short link' : c === 'vCard' ? 'Contact' : c === 'WiFi' ? 'Wi-Fi' : 'SMS'}</button>)}
                </div>
                {content === 'URL' && <div className="p-3 rounded-md bg-slate-50 border border-slate-200"><p className="text-xs text-slate-500">The code opens</p><p className="text-sm font-medium text-slate-900 break-all mt-0.5">{shortUrl}</p></div>}
                {content === 'vCard' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([['name', 'Full name'], ['phone', 'Phone'], ['email', 'Email'], ['org', 'Organization']] as const).map(([k, ph]) => <input key={k} aria-label={ph} placeholder={ph} value={vcard[k]} onChange={(e) => setVcard({ ...vcard, [k]: e.target.value })} className={inputCls} />)}
                    <input aria-label="Note" placeholder="Note" value={vcard.note} onChange={(e) => setVcard({ ...vcard, note: e.target.value })} className={`${inputCls} sm:col-span-2`} />
                  </div>
                )}
                {content === 'WiFi' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input aria-label="Network name" placeholder="Network name (SSID)" value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} className={inputCls} />
                    <input aria-label="Wi-Fi password" type="password" autoComplete="off" placeholder="Password" value={wifi.password} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} className={inputCls} />
                    <select aria-label="Encryption" value={wifi.encryption} onChange={(e) => setWifi({ ...wifi, encryption: e.target.value })} className={`${inputCls} sm:col-span-2`}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select>
                  </div>
                )}
                {content === 'SMS' && (
                  <div className="grid grid-cols-1 gap-3">
                    <input aria-label="Phone number" placeholder="Phone number" value={sms.phone} onChange={(e) => setSms({ ...sms, phone: e.target.value })} className={inputCls} />
                    <textarea aria-label="Message" placeholder="Message" rows={3} value={sms.message} onChange={(e) => setSms({ ...sms, message: e.target.value })} className={`${inputCls} resize-y`} />
                  </div>
                )}
              </div>
            )}

            {(tab === 'Shapes' || tab === 'Colors' || tab === 'Logo' || tab === 'Background') && <QrDesignControls tab={tab} d={d} set={set} />}

            {tab === 'Templates' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Designs saved in this workspace</p>
                {templates.length === 0 ? <p className="py-8 text-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500">No saved designs yet.</p> : (
                  <ul className="grid grid-cols-2 gap-3">
                    {templates.map((t) => <li key={t.id}><button type="button" aria-pressed={selectedTemplate === t.id} onClick={() => { setD(fromQrConfig(t.config)); setSelectedTemplate(t.id); }} className={`w-full p-3 rounded-md border text-left text-sm font-medium truncate transition-colors ${selectedTemplate === t.id ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-slate-300 bg-white text-slate-800 hover:border-slate-500'}`}>{t.name}</button></li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setD(DEFAULT_DESIGN)} className="text-sm font-medium text-slate-600 hover:text-slate-900">Reset design</button>
          <div className="flex gap-2">
            <button type="button" onClick={() => download(`qr-code-${link.shortCode}`, 'svg')} disabled={!wifiOk} className="px-4 py-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:border-slate-500 transition-colors disabled:opacity-50">Download SVG</button>
            <button type="button" onClick={() => download(`qr-code-${link.shortCode}`, 'png')} disabled={!wifiOk} className="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-on-primary text-sm font-semibold transition-colors disabled:opacity-50">Download PNG</button>
          </div>
        </div>
      </div>
    </div>
  );
}
