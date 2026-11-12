'use client';
import type { CornerDotType, CornerSquareType, DotType } from 'qr-code-styling';
import type { Direction, QrDesign } from '@/lib/qr-config';
import { useToast } from '@/lib/toast';

export type DesignTab = 'Shapes' | 'Colors' | 'Logo' | 'Background';

const DOT_TYPES: { id: DotType; label: string }[] = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'dots', label: 'Dots' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Classy rounded' },
  { id: 'square', label: 'Square' },
  { id: 'extra-rounded', label: 'Extra rounded' },
];
const CORNER_SQUARE: { id: CornerSquareType; label: string }[] = [
  { id: 'dot', label: 'Circle' },
  { id: 'square', label: 'Square' },
  { id: 'extra-rounded', label: 'Rounded' },
];
const CORNER_DOT: { id: CornerDotType; label: string }[] = [
  { id: 'dot', label: 'Circle' },
  { id: 'square', label: 'Square' },
];
const DIRECTIONS: { id: Direction; label: string }[] = [
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'radial', label: 'Radial' },
];
const COLOR_PRESETS = ['#000000', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];
const BG_PRESETS = ['#ffffff', '#F8FAFC', '#FEF3C7', '#E0E7FF'];
const LOGOS = [
  { name: 'None', src: null },
  { name: 'X', src: '/assets/logos/x.png' },
  { name: 'YouTube', src: '/assets/logos/youtube.png' },
  { name: 'Instagram', src: '/assets/logos/instagram.png' },
  { name: 'Facebook', src: '/assets/logos/facebook.png' },
  { name: 'GitHub', src: '/assets/logos/github.png' },
];
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_LOGO = 512 * 1024;

const heading = 'block text-sm font-medium text-slate-700 mb-2';
const chip = (on: boolean) =>
  `px-3 py-2 rounded-lg border text-sm transition-colors ${on ? 'border-primary-600 bg-primary-50 text-primary-800 font-medium' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'}`;
const swatch = (on: boolean) => `w-8 h-8 rounded-full border border-slate-300 transition-shadow ${on ? 'ring-2 ring-offset-2 ring-primary-600' : ''}`;
const colorInput = 'h-10 w-14 rounded-md border border-slate-300 bg-white p-1 cursor-pointer';

function ColorField({ id, label, value, onChange, presets }: { id: string; label: string; value: string; onChange: (v: string) => void; presets?: string[] }) {
  return (
    <div>
      <label htmlFor={id} className={heading}>{label}</label>
      <div className="flex flex-wrap items-center gap-3">
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className={colorInput} />
        <span className="font-mono text-sm text-slate-600 uppercase w-16">{value}</span>
        {presets && (
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => <button key={p} type="button" aria-label={`Use ${p}`} onClick={() => onChange(p)} style={{ background: p }} className={swatch(value.toLowerCase() === p.toLowerCase())} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/** The Shapes / Colors / Logo / Background panels shared by the QR studio, the per-link QR dialog and the app studio. */
export function QrDesignControls({ tab, d, set }: { tab: string; d: QrDesign; set: <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => void }) {
  const toast = useToast();
  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) { toast.error('Use a PNG, JPEG, WebP or SVG logo.'); return; }
    if (file.size > MAX_LOGO) { toast.error('Logo must be smaller than 500 KB.'); return; }
    const reader = new FileReader();
    reader.onload = () => set('logo', { name: 'Custom upload', src: reader.result as string });
    reader.onerror = () => toast.error('Could not read that file.');
    reader.readAsDataURL(file);
  };

  return (
    <>
      {tab === 'Shapes' && (
        <div className="space-y-6">
          <div>
            <p className={heading}>Dot style</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{DOT_TYPES.map((t) => <button key={t.id} type="button" aria-pressed={d.dotsType === t.id} onClick={() => set('dotsType', t.id)} className={chip(d.dotsType === t.id)}>{t.label}</button>)}</div>
          </div>
          <div>
            <p className={heading}>Corner frame</p>
            <div className="grid grid-cols-3 gap-2">{CORNER_SQUARE.map((t) => <button key={t.id} type="button" aria-pressed={d.cornersSquareType === t.id} onClick={() => set('cornersSquareType', t.id)} className={chip(d.cornersSquareType === t.id)}>{t.label}</button>)}</div>
          </div>
          <div>
            <p className={heading}>Corner centre</p>
            <div className="grid grid-cols-2 gap-2 max-w-xs">{CORNER_DOT.map((t) => <button key={t.id} type="button" aria-pressed={d.cornersDotType === t.id} onClick={() => set('cornersDotType', t.id)} className={chip(d.cornersDotType === t.id)}>{t.label}</button>)}</div>
          </div>
        </div>
      )}

      {tab === 'Colors' && (
        <div className="space-y-6">
          <div>
            <p className={heading}>Colour mode</p>
            <div className="inline-flex p-1 rounded-lg bg-slate-100" role="group" aria-label="Colour mode">
              {(['single', 'gradient'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={d.colorMode === m} onClick={() => set('colorMode', m)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${d.colorMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{m === 'single' ? 'Single colour' : 'Gradient'}</button>
              ))}
            </div>
          </div>
          {d.colorMode === 'single' ? (
            <ColorField id="qr-color" label="Code colour" value={d.selectedColor} onChange={(v) => set('selectedColor', v)} presets={COLOR_PRESETS} />
          ) : (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <ColorField id="qr-start" label="Start colour" value={d.startColor} onChange={(v) => set('startColor', v)} />
                <ColorField id="qr-end" label="End colour" value={d.endColor} onChange={(v) => set('endColor', v)} />
              </div>
              <div>
                <p className={heading}>Direction</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIRECTIONS.map((dir) => <button key={dir.id} type="button" aria-pressed={d.gradientDirection === dir.id} onClick={() => set('gradientDirection', dir.id)} className={chip(d.gradientDirection === dir.id)}>{dir.label}</button>)}
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-slate-500">Scanners read dark codes on a light background best. Keep plenty of contrast, especially at the lighter end of a gradient.</p>
        </div>
      )}

      {tab === 'Logo' && (
        <div className="space-y-6">
          <div>
            <p className={heading}>Your logo</p>
            <label className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:border-primary-500 px-4 py-6 text-center cursor-pointer transition-colors">
              <input type="file" aria-label="Upload logo" accept={LOGO_TYPES.join(',')} onChange={onLogo} className="sr-only" />
              <span className="text-sm font-medium text-slate-800">{d.logo.name === 'Custom upload' ? 'Replace your logo' : 'Choose an image'}</span>
              <span className="text-xs text-slate-500">PNG, JPEG, WebP or SVG, up to 500 KB. A square logo with a transparent background works best.</span>
            </label>
          </div>
          <div>
            <p className={heading}>Or pick an icon</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {LOGOS.map((l) => (
                <button key={l.name} type="button" aria-pressed={d.logo.name === l.name} aria-label={l.src ? l.name : 'No logo'} onClick={() => set('logo', l)} className={`aspect-square rounded-lg border flex items-center justify-center transition-colors ${d.logo.name === l.name ? 'border-primary-600 bg-primary-50' : 'border-slate-300 bg-white hover:border-slate-500'}`}>
                  {l.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.src} alt="" className="w-7 h-7 object-contain" />
                  ) : (
                    <span className="text-xs text-slate-600">None</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {d.logo.src && (
            <div className="grid sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label htmlFor="qr-lsize" className={heading}>Logo size: {Math.round(d.logoSize * 100)}%</label>
                <input id="qr-lsize" type="range" min="0.1" max="0.5" step="0.05" value={d.logoSize} onChange={(e) => set('logoSize', Number(e.target.value))} className="w-full accent-primary-600" />
              </div>
              <div>
                <label htmlFor="qr-lmargin" className={heading}>Space around logo: {d.logoMargin}px</label>
                <input id="qr-lmargin" type="range" min="0" max="20" step="1" value={d.logoMargin} onChange={(e) => set('logoMargin', Number(e.target.value))} className="w-full accent-primary-600" />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Background' && (
        <div className="space-y-6">
          <ColorField id="qr-bg" label="Background colour" value={d.backgroundColor} onChange={(v) => set('backgroundColor', v)} presets={BG_PRESETS} />
          <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={d.hideBackgroundDots} onChange={(e) => set('hideBackgroundDots', e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary-600" />
            <span>
              <span className="font-medium text-slate-900">Clear the dots behind the logo</span>
              <span className="block text-slate-500">Keeps the logo readable. Turn it off and the code shows through a transparent logo.</span>
            </span>
          </label>
        </div>
      )}
    </>
  );
}
