import { scanWarning } from './qr-payload';
import type { QrDesign } from './qr-config';

/** The most a QR code at error-correction level H can hold in byte mode (version 40). */
export const QR_MAX_BYTES = 1273;

export type DesignIssue = 'too-long' | 'inverted' | 'low-contrast' | 'big-logo' | 'dense-logo';

export const byteLength = (s: string) => new TextEncoder().encode(s).length;

/** Things that stop a styled QR code from scanning, worst first. Pure, so it can be unit tested. */
export function designIssues(d: QrDesign, data: string): DesignIssue[] {
  const out: DesignIssue[] = [];
  const bytes = byteLength(data);
  if (bytes > QR_MAX_BYTES) out.push('too-long');

  // A gradient has to scan at both of its ends.
  const colours = d.colorMode === 'gradient' ? [d.startColor, d.endColor] : [d.selectedColor];
  const found = colours.map((c) => scanWarning(c, d.backgroundColor));
  if (found.includes('inverted')) out.push('inverted');
  else if (found.includes('low-contrast')) out.push('low-contrast');

  if (d.logo.src) {
    // The logo covers its size squared of the code; level H can rebuild about 30%, and a margin eats into that too.
    if (d.logoSize > 0.4) out.push('big-logo');
    // Long content means a dense code, and a logo over a dense code takes out proportionally more of the modules.
    else if (bytes > 400) out.push('dense-logo');
  }
  return out;
}

export const ISSUE_TEXT: Record<DesignIssue, string> = {
  'too-long': 'This is too long for a QR code. Shorten it, or use a short link instead.',
  inverted: 'A light code on a darker background fails on some scanners. Make the code darker than its background.',
  'low-contrast': 'The code and background colours are too close together and may not scan. Use a darker code or a lighter background.',
  'big-logo': 'The logo is large enough to hide part of the code. Make it smaller, or test the code with your phone before using it.',
  'dense-logo': 'Long content makes a dense code, and a logo covers more of it. Shorten the content or make the logo smaller, then test it with your phone.',
};

/** What to call a downloaded file: the site name for a link, otherwise a plain default. */
export function qrFileName(data: string): string {
  try {
    const host = new URL(data).hostname.replace(/^www\./, '');
    if (host) return `qr-${host.replace(/[^a-z0-9.-]/gi, '')}`;
  } catch { /* not a URL */ }
  return 'qr-code';
}
