'use client';
import { useEffect, useRef } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { toQrOptions, type QrDesign } from './qr-config';

/**
 * Mounts a qr-code-styling instance (browser-only, loaded on demand) into the returned ref and keeps it in sync
 * with the design/data. `download` saves the current QR.
 */
export function useQrCode(design: QrDesign, data: string, opts: { size?: number; margin?: number } = {}) {
  const host = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);
  const build = () => ({ ...toQrOptions(design, data), ...(opts.size ? { width: opts.size, height: opts.size } : {}), ...(opts.margin !== undefined ? { margin: opts.margin } : {}) });
  const latest = useRef(build);
  latest.current = build;

  useEffect(() => {
    let cancelled = false;
    void import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      if (cancelled || !host.current) return;
      const inst = new QRCodeStyling(latest.current());
      host.current.innerHTML = '';
      inst.append(host.current);
      qr.current = inst;
    });
    return () => { cancelled = true; qr.current = null; if (host.current) host.current.innerHTML = ''; };
  }, []);

  useEffect(() => { qr.current?.update(build()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [design, data, opts.size, opts.margin]);

  const download = (name: string, extension: 'png' | 'svg' = 'png') => qr.current?.download({ name, extension });
  return { host, download };
}
