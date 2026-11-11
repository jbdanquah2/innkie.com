// Navigation data shared by the header (desktop mega-menu + mobile drawer).
export type Tone = 'primary' | 'emerald' | 'blue' | 'rose' | 'amber' | 'indigo';

export interface NavTool {
  href: string;
  label: string;
  hint: string;
  icon: string;
  tone: Tone;
}

export interface NavColumn {
  title: string;
  tools: NavTool[];
}

export const TOOL_MENU: NavColumn[] = [
  {
    title: 'Links & QR',
    tools: [
      { href: '/tools/link-shortener', label: 'Shortener', hint: 'Advanced tracking & analytics', icon: 'fa-link', tone: 'primary' },
      { href: '/tools/utm-builder', label: 'UTM Builder', hint: 'Campaign attribution tool', icon: 'fa-bullhorn', tone: 'primary' },
      { href: '/tools/qr-generator', label: 'QR Generator', hint: 'Instant high-res QR codes', icon: 'fa-qrcode', tone: 'emerald' },
      { href: '/tools/qr-studio', label: 'QR Studio', hint: 'Branded custom QR designs', icon: 'fa-palette', tone: 'emerald' },
    ],
  },
  {
    title: 'Media Hub',
    tools: [
      { href: '/tools/image-compressor', label: 'Optimizer', hint: 'Fast image compression', icon: 'fa-compress-arrows-alt', tone: 'blue' },
      { href: '/tools/image-resizer', label: 'Resizer', hint: 'Custom scaling & cropping', icon: 'fa-expand', tone: 'blue' },
      { href: '/tools/png-to-jpeg', label: 'PNG to JPEG', hint: 'Instant format conversion', icon: 'fa-file-export', tone: 'rose' },
      { href: '/tools/svg-to-png', label: 'SVG to PNG', hint: 'Vector rasterization', icon: 'fa-image', tone: 'indigo' },
    ],
  },
  {
    title: 'Data & Docs',
    tools: [
      { href: '/tools/pdf-to-image', label: 'PDF to Image', hint: 'Secure document extraction', icon: 'fa-file-pdf', tone: 'rose' },
      { href: '/tools/image-to-pdf', label: 'Image to PDF', hint: 'Combine photos into documents', icon: 'fa-images', tone: 'rose' },
      { href: '/tools/csv-json-converter', label: 'CSV <> JSON Converter', hint: 'Data transformation suite', icon: 'fa-table', tone: 'primary' },
      { href: '/tools/json-formatter', label: 'JSON Format', hint: 'Clean & validate JSON', icon: 'fa-code', tone: 'amber' },
      { href: '/tools/jwt-decoder', label: 'JWT Decoder', hint: 'Local token inspection', icon: 'fa-shield-alt', tone: 'indigo' },
      { href: '/tools/base64-encoder', label: 'Base64 Tool', hint: 'Secure text encoding', icon: 'fa-code-branch', tone: 'primary' },
    ],
  },
];

// Full class names so Tailwind's scanner can see them.
export const TONE_CLASSES: Record<Tone, { box: string; hover: string; item: string }> = {
  primary: { box: 'bg-primary-50 text-primary-600 group-hover/item:bg-primary-600', hover: 'hover:bg-primary-50', item: 'bg-primary-50 text-primary-600' },
  emerald: { box: 'bg-emerald-50 text-emerald-600 group-hover/item:bg-emerald-600', hover: 'hover:bg-emerald-50', item: 'bg-emerald-50 text-emerald-600' },
  blue: { box: 'bg-blue-50 text-blue-600 group-hover/item:bg-blue-600', hover: 'hover:bg-blue-50', item: 'bg-blue-50 text-blue-600' },
  rose: { box: 'bg-rose-50 text-rose-600 group-hover/item:bg-rose-600', hover: 'hover:bg-rose-50', item: 'bg-rose-50 text-rose-600' },
  amber: { box: 'bg-amber-50 text-amber-600 group-hover/item:bg-amber-600', hover: 'hover:bg-amber-50', item: 'bg-amber-50 text-amber-600' },
  indigo: { box: 'bg-indigo-50 text-indigo-600 group-hover/item:bg-indigo-600', hover: 'hover:bg-indigo-50', item: 'bg-indigo-50 text-indigo-600' },
};
