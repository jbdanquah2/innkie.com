import type { QrConfig, QrGradient } from '@innkie/shared-models';
import type { Options, DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';

export type Direction = 'diagonal' | 'horizontal' | 'vertical' | 'radial';
export type ColorMode = 'single' | 'gradient';
export interface Logo { name: string; src: string | null }

/** Everything the studio's controls edit. Phase 4 (template library / stamper) will load and save this shape. */
export interface QrDesign {
  dotsType: DotType;
  cornersSquareType: CornerSquareType;
  cornersDotType: CornerDotType;
  colorMode: ColorMode;
  selectedColor: string;
  startColor: string;
  endColor: string;
  gradientDirection: Direction;
  backgroundColor: string;
  logo: Logo;
  logoSize: number;
  logoMargin: number;
  hideBackgroundDots: boolean;
}

export const DEFAULT_DESIGN: QrDesign = {
  dotsType: 'rounded',
  cornersSquareType: 'extra-rounded',
  cornersDotType: 'dot',
  colorMode: 'single',
  selectedColor: '#4F46E5',
  startColor: '#4F46E5',
  endColor: '#EC4899',
  gradientDirection: 'diagonal',
  backgroundColor: '#ffffff',
  logo: { name: 'None', src: null },
  logoSize: 0.4,
  logoMargin: 5,
  hideBackgroundDots: true,
};

/** Same shape the Angular studio saved on templates and links (QrConfig in shared-models). */
export function toQrConfig(d: QrDesign): QrConfig {
  const gradient: QrGradient | undefined =
    d.colorMode === 'gradient'
      ? {
          type: 'linear',
          rotation: d.gradientDirection === 'vertical' ? 1.57 : d.gradientDirection === 'horizontal' ? 0 : 0.78,
          colorStops: [{ offset: 0, color: d.startColor }, { offset: 1, color: d.endColor }],
        }
      : undefined;
  const color = d.colorMode === 'single' ? d.selectedColor : undefined;
  return {
    dotsOptions: { type: d.dotsType, color, gradient },
    cornersSquareOptions: { type: d.cornersSquareType, color, gradient },
    cornersDotOptions: { type: d.cornersDotType, color, gradient },
    backgroundOptions: { color: d.backgroundColor },
    imageOptions: { hideBackgroundDots: d.hideBackgroundDots, imageSize: d.logoSize, margin: d.logoMargin, crossOrigin: 'anonymous' },
    logoName: d.logo.name,
    logoSrc: d.logo.src,
    colorMode: d.colorMode,
    selectedColor: d.selectedColor,
    startColor: d.startColor,
    endColor: d.endColor,
    gradientDirection: d.gradientDirection,
  } as QrConfig;
}

export function toQrOptions(d: QrDesign, data: string): Options {
  const c = toQrConfig(d);
  return {
    width: 300,
    height: 300,
    type: 'svg',
    data,
    image: c.logoSrc || undefined,
    dotsOptions: c.dotsOptions as Options['dotsOptions'],
    cornersSquareOptions: c.cornersSquareOptions as Options['cornersSquareOptions'],
    cornersDotOptions: c.cornersDotOptions as Options['cornersDotOptions'],
    backgroundOptions: c.backgroundOptions as Options['backgroundOptions'],
    imageOptions: c.imageOptions as Options['imageOptions'],
    margin: 10,
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' },
  };
}

/** Old templates stored logo paths like 'assets/logos/x.png' (relative); make them absolute so they resolve from any route. */
const normalizeSrc = (src?: string | null) => (!src ? null : /^(data:|https?:|\/)/.test(src) ? src : `/${src}`);

/** Loads a saved template / link config (QrConfig) back into editor state. */
export function fromQrConfig(c: QrConfig): QrDesign {
  const colorMode: ColorMode = c.colorMode || (c.dotsOptions?.gradient ? 'gradient' : 'single');
  const stops = c.dotsOptions?.gradient?.colorStops;
  return {
    dotsType: (c.dotsOptions?.type as QrDesign['dotsType']) || DEFAULT_DESIGN.dotsType,
    cornersSquareType: (c.cornersSquareOptions?.type as QrDesign['cornersSquareType']) || DEFAULT_DESIGN.cornersSquareType,
    cornersDotType: (c.cornersDotOptions?.type as QrDesign['cornersDotType']) || DEFAULT_DESIGN.cornersDotType,
    colorMode,
    selectedColor: c.selectedColor || c.dotsOptions?.color || DEFAULT_DESIGN.selectedColor,
    startColor: c.startColor || stops?.[0]?.color || DEFAULT_DESIGN.startColor,
    endColor: c.endColor || stops?.[1]?.color || DEFAULT_DESIGN.endColor,
    gradientDirection: (c.gradientDirection as Direction) || DEFAULT_DESIGN.gradientDirection,
    backgroundColor: c.backgroundOptions?.color || DEFAULT_DESIGN.backgroundColor,
    logo: { name: c.logoName || 'None', src: normalizeSrc(c.logoSrc) },
    logoSize: c.imageOptions?.imageSize || DEFAULT_DESIGN.logoSize,
    logoMargin: c.imageOptions?.margin ?? DEFAULT_DESIGN.logoMargin,
    hideBackgroundDots: c.imageOptions?.hideBackgroundDots ?? true,
  };
}
