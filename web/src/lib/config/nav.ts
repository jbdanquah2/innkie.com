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
    title: 'Links and QR codes',
    tools: [
      { href: '/tools/link-shortener', label: 'URL Shortener', hint: 'Short links with analytics', icon: 'fa-link', tone: 'primary' },
      { href: '/tools/qr-generator', label: 'QR Code Generator', hint: 'High-resolution QR codes', icon: 'fa-qrcode', tone: 'emerald' },
      { href: '/tools/qr-studio', label: 'QR Studio', hint: 'Branded QR designs', icon: 'fa-palette', tone: 'emerald' },
      { href: '/tools/utm-builder', label: 'UTM Builder', hint: 'Campaign tracking links', icon: 'fa-bullhorn', tone: 'primary' },
    ],
  },
  {
    title: 'Images',
    tools: [
      { href: '/tools/image-compressor', label: 'Image Compressor', hint: 'Smaller JPG, PNG and WebP', icon: 'fa-compress-arrows-alt', tone: 'blue' },
      { href: '/tools/image-resizer', label: 'Image Resizer', hint: 'Scale and crop', icon: 'fa-expand', tone: 'blue' },
      { href: '/tools/png-to-jpeg', label: 'PNG to JPEG', hint: 'Format conversion', icon: 'fa-file-export', tone: 'rose' },
      { href: '/tools/svg-to-png', label: 'SVG to PNG', hint: 'Vector to raster', icon: 'fa-image', tone: 'indigo' },
    ],
  },
  {
    title: 'Documents and text',
    tools: [
      { href: '/tools/pdf-to-image', label: 'PDF to Image', hint: 'Pages as PNG or JPEG', icon: 'fa-file-pdf', tone: 'rose' },
      { href: '/tools/image-to-pdf', label: 'Image to PDF', hint: 'Combine photos into a PDF', icon: 'fa-images', tone: 'rose' },
      { href: '/tools/word-counter', label: 'Word Counter', hint: 'Words, characters, reading time', icon: 'fa-align-left', tone: 'emerald' },
    ],
  },
  {
    title: 'Developer utilities',
    tools: [
      { href: '/tools/json-formatter', label: 'JSON Formatter', hint: 'Format and validate', icon: 'fa-code', tone: 'amber' },
      { href: '/tools/jwt-decoder', label: 'JWT Decoder', hint: 'Inspect tokens locally', icon: 'fa-shield-alt', tone: 'indigo' },
      { href: '/tools/csv-json-converter', label: 'CSV <> JSON', hint: 'Convert both ways', icon: 'fa-table', tone: 'primary' },
      { href: '/tools/base64-encoder', label: 'Base64', hint: 'Encode and decode', icon: 'fa-code-branch', tone: 'primary' },
      { href: '/tools/url-encoder', label: 'URL Encoder', hint: 'Percent-encode and decode', icon: 'fa-percent', tone: 'blue' },
      { href: '/tools/uuid-generator', label: 'UUID Generator', hint: 'Random v4 identifiers', icon: 'fa-fingerprint', tone: 'indigo' },
      { href: '/tools/timestamp-converter', label: 'Timestamp Converter', hint: 'Epoch to readable dates', icon: 'fa-clock-rotate-left', tone: 'amber' },
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
