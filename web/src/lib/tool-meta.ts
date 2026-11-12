import type { PlatformToolType } from '@innkie/shared-models';

/** Display metadata for usage events (labels, icons, colours, launch routes) shared by the overview and analytics pages. */
export const TOOL_META: Record<PlatformToolType, { label: string; icon: string; tone: string; route?: string }> = {
  link_shortener: { label: 'URL Shortener', icon: 'fa-link', tone: 'bg-primary-50 text-primary-600', route: '/tools/link-shortener/' },
  utm_builder: { label: 'UTM builder', icon: 'fa-bullhorn', tone: 'bg-purple-50 text-purple-600', route: '/tools/utm-builder/' },
  qr_studio: { label: 'QR Studio', icon: 'fa-qrcode', tone: 'bg-emerald-50 text-emerald-600', route: '/qr-studio/' },
  image_optimizer: { label: 'Image compressor', icon: 'fa-file-image', tone: 'bg-blue-50 text-blue-600', route: '/tools/image-compressor/' },
  png_to_jpeg: { label: 'PNG to JPEG', icon: 'fa-file-export', tone: 'bg-rose-50 text-rose-600', route: '/tools/png-to-jpeg/' },
  svg_to_png: { label: 'SVG to PNG', icon: 'fa-image', tone: 'bg-indigo-50 text-indigo-600', route: '/tools/svg-to-png/' },
  json_formatter: { label: 'JSON formatter', icon: 'fa-code', tone: 'bg-amber-50 text-amber-600', route: '/tools/json-formatter/' },
  jwt_decoder: { label: 'JWT Decoder', icon: 'fa-shield-alt', tone: 'bg-slate-100 text-slate-600', route: '/tools/jwt-decoder/' },
  image_resizer: { label: 'Image Resizer', icon: 'fa-expand', tone: 'bg-blue-50 text-blue-600', route: '/tools/image-resizer/' },
  data_converter: { label: 'CSV / JSON converter', icon: 'fa-table', tone: 'bg-primary-50 text-primary-600', route: '/tools/csv-json-converter/' },
  base64_encoder: { label: 'Base64 encoder', icon: 'fa-code-branch', tone: 'bg-primary-50 text-primary-600', route: '/tools/base64-encoder/' },
  pdf_to_image: { label: 'PDF to Image', icon: 'fa-file-pdf', tone: 'bg-rose-50 text-rose-600', route: '/tools/pdf-to-image/' },
  url_encoder: { label: 'URL Encoder', icon: 'fa-percent', tone: 'bg-blue-50 text-blue-600', route: '/tools/url-encoder/' },
  uuid_generator: { label: 'UUID Generator', icon: 'fa-fingerprint', tone: 'bg-indigo-50 text-indigo-600', route: '/tools/uuid-generator/' },
  image_to_pdf: { label: 'Image to PDF', icon: 'fa-images', tone: 'bg-rose-50 text-rose-600', route: '/tools/image-to-pdf/' },
};
