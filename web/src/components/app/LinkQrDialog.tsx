'use client';
import { useEffect, useState } from 'react';
import type { QrTemplate, ShortUrl } from '@innkie/shared-models';
import { QrDesignControls } from './QrDesignControls';
import { qrApi } from '@/lib/api/qr';
import { env } from '@/lib/env';
import { DEFAULT_DESIGN, fromQrConfig, toQrConfig, type QrDesign } from '@/lib/qr-config';
import { useQrCode } from '@/lib/qr-preview';
import { useToast } from '@/lib/toast';
import { useWorkspace } from '@/lib/workspace';

type Content = 'URL' | 'vCard' | 'WiFi' | 'SMS';
const TABS = ['Content', 'Shapes', 'Colors', 'Logo', 'Background', 'Templates'] as const;
type Tab = (typeof TABS)[number];

// Escaping per the vCard 3.0 and Wi-Fi QR formats, so names/passwords containing ; , : \ " still scan.
const vEsc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\;').replace(/,/g, '\\,');
const wEsc = (s: string) => s.replace(/([\;,:"])/g, '\\$1');

const inputCls = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm font-medium';

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
      <div role="dialog" aria-modal="true" aria-label="QR code editor" onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-xl border border-slate-100">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div><h2 className="text-xl font-black text-slate-900 tracking-tight">QR Code Studio</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">for /{link.shortCode}</p></div>
          <button type="button" aria-label="Close" onClick={onClose} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"><i className="fas fa-times" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-8">
          <div className="md:col-span-5 space-y-6">
            <div className="flex flex-col items-center gap-4 p-8 bg-slate-50 rounded-3xl border border-slate-100">
              <div ref={host} className="rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center" style={{ width: 280, height: 280 }} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{wifiOk ? 'Live Preview' : 'Enter the network name'}</p>
            </div>
            <div className="p-5 border border-slate-100 rounded-2xl space-y-3">
              <label htmlFor="lqr-name" className="block text-xs font-bold text-slate-500 uppercase tracking-tight">Save Style Template</label>
              <div className="flex gap-2">
                <input id="lqr-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Promo" className={inputCls} />
                <button type="button" onClick={saveTemplate} className="shrink-0 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all active:scale-95"><i className="fas fa-save mr-1" /> Save Style</button>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="flex flex-wrap border-b border-slate-50 pb-2 gap-1 mb-6" role="tablist">
              {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 ${tab === t ? 'bg-primary-50 text-primary-600' : 'text-slate-500'}`}>{t}</button>)}
            </div>

            {tab === 'Content' && (
              <div className="space-y-5">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  {(['URL', 'vCard', 'WiFi', 'SMS'] as const).map((c) => <button key={c} type="button" aria-pressed={content === c} onClick={() => setContent(c)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${content === c ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{c === 'URL' ? 'Short URL' : c}</button>)}
                </div>
                {content === 'URL' && <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100"><p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Encodes</p><p className="text-sm font-bold text-slate-800 break-all">{shortUrl}</p></div>}
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
                    <textarea aria-label="Message" placeholder="Message" rows={3} value={sms.message} onChange={(e) => setSms({ ...sms, message: e.target.value })} className={`${inputCls} resize-none`} />
                  </div>
                )}
              </div>
            )}

            {(tab === 'Shapes' || tab === 'Colors' || tab === 'Logo' || tab === 'Background') && <QrDesignControls tab={tab} d={d} set={set} />}

            {tab === 'Templates' && (
              <div className="space-y-4">
                <span className="text-sm font-bold text-slate-700">Your Saved Styles</span>
                {templates.length === 0 ? <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-sm">No saved styles yet.</div> : (
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((t) => <button key={t.id} type="button" onClick={() => { setD(fromQrConfig(t.config)); setSelectedTemplate(t.id); }} className={`p-4 rounded-2xl border text-left transition-all ${selectedTemplate === t.id ? 'border-primary-500 bg-primary-50' : 'border-slate-100 bg-slate-50 hover:bg-primary-50'}`}><i className="fas fa-qrcode text-slate-300 mb-2" /><p className="text-sm font-black text-slate-800 truncate">{t.name}</p></button>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-3xl">
          <button type="button" onClick={() => setD(DEFAULT_DESIGN)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"><i className="fas fa-sync-alt" /> Reset</button>
          <div className="flex gap-2">
            <button type="button" onClick={() => download(`qr-code-${link.shortCode}`, 'svg')} disabled={!wifiOk} className="px-5 py-3 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">SVG</button>
            <button type="button" onClick={() => download(`qr-code-${link.shortCode}`, 'png')} disabled={!wifiOk} className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"><i className="fas fa-download" /> Download PNG</button>
          </div>
        </div>
      </div>
    </div>
  );
}
