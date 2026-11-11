'use client';
import type { CornerDotType, CornerSquareType, DotType } from 'qr-code-styling';
import type { Direction, QrDesign } from '@/lib/qr-config';
import { useToast } from '@/lib/toast';

export type DesignTab = 'Shapes' | 'Colors' | 'Logo' | 'Background';

const DOT_TYPES: DotType[] = ['rounded', 'dots', 'classy', 'classy-rounded', 'square', 'extra-rounded'];
const CORNER_SQUARE: CornerSquareType[] = ['dot', 'square', 'extra-rounded'];
const CORNER_DOT: CornerDotType[] = ['dot', 'square'];
const DIRECTIONS: Direction[] = ['diagonal', 'horizontal', 'vertical', 'radial'];
const COLOR_PRESETS = ['#000000', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];
const LOGOS = [
  { name: 'None', src: null },
  { name: 'X', src: '/assets/logos/x.png' },
  { name: 'YT', src: '/assets/logos/youtube.png' },
  { name: 'IG', src: '/assets/logos/instagram.png' },
  { name: 'FB', src: '/assets/logos/facebook.png' },
  { name: 'GH', src: '/assets/logos/github.png' },
];

const label = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4';
const chip = (on: boolean) => `py-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${on ? 'bg-primary-600 text-white border-primary-600' : ''}`;


/** The Shapes / Colors / Logo / Background panels shared by the QR studio, the per-link QR dialog and the app studio. */
export function QrDesignControls({ tab, d, set }: { tab: string; d: QrDesign; set: <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => void }) {
  const toast = useToast();
  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) { toast.error('Logo must be less than 500KB'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => set('logo', { name: 'Custom Upload', src: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <>
  {tab === 'Shapes' && (
    <div className="space-y-8 animate-fade-in">
      <div>
        <span className={label}>Dot Style</span>
        <div className="grid grid-cols-3 gap-3">{DOT_TYPES.map((t) => <button key={t} type="button" onClick={() => set('dotsType', t)} className={chip(d.dotsType === t)}>{t}</button>)}</div>
      </div>
      <div>
        <span className={label}>Corner Shape</span>
        <div className="grid grid-cols-3 gap-3">{CORNER_SQUARE.map((t) => <button key={t} type="button" onClick={() => set('cornersSquareType', t)} className={chip(d.cornersSquareType === t)}>{t}</button>)}</div>
      </div>
      <div>
        <span className={label}>Corner Eye</span>
        <div className="grid grid-cols-2 gap-3">{CORNER_DOT.map((t) => <button key={t} type="button" onClick={() => set('cornersDotType', t)} className={chip(d.cornersDotType === t)}>{t}</button>)}</div>
      </div>
    </div>
  )}

  {tab === 'Colors' && (
    <div className="space-y-8 animate-fade-in">
      <div>
        <span className={label}>Color Mode</span>
        <div className="flex p-1 bg-slate-50 rounded-2xl gap-1">
          {(['single', 'gradient'] as const).map((m) => (
            <button key={m} type="button" onClick={() => set('colorMode', m)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${d.colorMode === m ? 'bg-white shadow-sm' : ''}`}>{m === 'single' ? 'Single' : 'Gradient'}</button>
          ))}
        </div>
      </div>
      {d.colorMode === 'single' ? (
        <div className="space-y-4">
          <label htmlFor="qr-color" className="block text-sm font-bold text-slate-700">Brand Color</label>
          <div className="flex items-center gap-4">
            <input id="qr-color" type="color" value={d.selectedColor} onChange={(e) => set('selectedColor', e.target.value)} className="w-16 h-16 rounded-2xl border-none cursor-pointer bg-transparent" />
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => <button key={p} type="button" aria-label={`Select color ${p}`} onClick={() => set('selectedColor', p)} style={{ background: p }} className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 active:scale-90 transition-transform" />)}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2"><label htmlFor="qr-start" className="block text-xs font-bold text-slate-500">Start</label><input id="qr-start" type="color" value={d.startColor} onChange={(e) => set('startColor', e.target.value)} className="w-full h-12 rounded-xl border-none cursor-pointer" /></div>
            <div className="space-y-2"><label htmlFor="qr-end" className="block text-xs font-bold text-slate-500">End</label><input id="qr-end" type="color" value={d.endColor} onChange={(e) => set('endColor', e.target.value)} className="w-full h-12 rounded-xl border-none cursor-pointer" /></div>
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-500 mb-3">Direction</span>
            <div className="grid grid-cols-4 gap-2">
              {DIRECTIONS.map((dir) => <button key={dir} type="button" aria-pressed={d.gradientDirection === dir} onClick={() => set('gradientDirection', dir)} className={`py-2 border rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${d.gradientDirection === dir ? 'bg-primary-50 text-primary-600 border-primary-200' : 'border-slate-100'}`}>{dir}</button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )}

  {tab === 'Logo' && (
    <div className="space-y-8 animate-fade-in">
      <div>
        <span className={label}>Custom Logo</span>
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl group hover:border-primary-300 transition-colors relative overflow-hidden">
          <input type="file" aria-label="Upload logo" accept="image/*" onChange={onLogo} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-primary-500 transition-colors"><i className="fas fa-cloud-upload-alt text-xl" /></div>
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Upload Image</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">PNG, JPG up to 500KB</p>
          </div>
        </div>
      </div>
      <div>
        <span className={label}>Presets</span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {LOGOS.map((l) => (
            <button key={l.name} type="button" onClick={() => set('logo', l)} className={`aspect-square rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-2 border border-slate-100 group ${d.logo.name === l.name ? 'ring-2 ring-primary-500' : ''}`}>
              {l.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.src} alt={l.name} className="w-6 h-6 object-contain grayscale group-hover:grayscale-0 transition-all" />
              ) : (
                <span className="font-black text-[8px] uppercase text-slate-400">{l.name}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-6">
        <div className="space-y-3"><label htmlFor="qr-lsize" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Size</label><input id="qr-lsize" type="range" min="0.1" max="0.5" step="0.05" value={d.logoSize} onChange={(e) => set('logoSize', Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" /></div>
        <div className="space-y-3"><label htmlFor="qr-lmargin" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Margin</label><input id="qr-lmargin" type="range" min="0" max="20" step="1" value={d.logoMargin} onChange={(e) => set('logoMargin', Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600" /></div>
      </div>
    </div>
  )}

  {tab === 'Background' && (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <label htmlFor="qr-bg" className="block text-sm font-bold text-slate-700">Background Color</label>
        <div className="flex items-center gap-4">
          <input id="qr-bg" type="color" value={d.backgroundColor} onChange={(e) => set('backgroundColor', e.target.value)} className="w-16 h-16 rounded-2xl border-none cursor-pointer bg-transparent" />
          <div className="flex flex-wrap gap-2">
            {[['#ffffff', 'bg-white'], ['#000000', 'bg-black'], ['#F8FAFC', 'bg-slate-50']].map(([c, cls]) => (
              <button key={c} type="button" aria-label={`Background ${c}`} onClick={() => set('backgroundColor', c)} className={`w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 ${cls}`} />
            ))}
          </div>
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={d.hideBackgroundDots} onChange={(e) => set('hideBackgroundDots', e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
        </div>
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hide dots behind logo</span>
      </label>
    </div>
  )}

    </>
  );
}
