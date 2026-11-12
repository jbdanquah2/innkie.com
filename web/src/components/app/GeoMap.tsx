'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { countsByMapName } from '@/lib/country-names';
import { themeHex } from '@/lib/theme';

/** Light-to-dark ramp built from the workspace accent, so the map matches the rest of the interface. */
const SHADES = [50, 100, 200, 300, 400, 500, 600, 800];
const FALLBACK = ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#3730a3'];
const palette = () => SHADES.map((n, i) => themeHex(n, FALLBACK[i]));

export const colorForCount = (count: number, max: number, single = 6, pal: string[] = palette()): string => {
  if (!count || count <= 0) return pal[0];
  if (max <= 1) return pal[single];
  const idx = Math.min(pal.length - 1, Math.floor((Math.log(count + 1) / Math.log(max + 1)) * (pal.length - 1)));
  return pal[Math.max(0, idx)];
};

/** Choropleth world map: countries shaded by click count (names matched upper-case against world.geo.json). */
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

interface Props {
  counts: Record<string, number>;
  max: number;
  className?: string;
  /** 'details' = single-link map (OSM tiles, zoom control); 'hub' = workspace heatmap (Carto light tiles, canvas, richer tooltip). */
  variant?: 'details' | 'hub';
}

export default function GeoMap({ counts, max, className = '', variant = 'details' }: Props) {
  const hub = variant === 'hub';
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import('leaflet').Map | undefined;
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      if (cancelled || !host.current) return;
      map = L.map(host.current, { center: [20, 0], zoom: 2, minZoom: 1, maxZoom: 6, scrollWheelZoom: false, attributionControl: false, ...(hub ? { zoomControl: false, preferCanvas: true } : {}) });
      // No tile layer: the country shapes come from our own world.geo.json, so nothing is requested from a map provider
      // (Carto's free tiles now return an "API KEY REQUIRED" watermark, and tile servers would see every viewer's IP).

      try {
        const geo = await (await fetch('/assets/world.geo.json')).json();
        if (cancelled || !map) return;
        const byName = countsByMapName(counts);
        const countOf = (f: any) => byName.get(String(f.properties?.name || f.properties?.NAME || f.properties?.ADMIN || '').toUpperCase()) ?? 0;

        const pal = palette();
        const layer = L.geoJSON(geo, {
          style: (f) => { const c = countOf(f); return { weight: 0.6, color: '#ffffff', fillColor: c > 0 ? colorForCount(c, max, hub ? 4 : 6, pal) : '#e2e8f0', fillOpacity: 1 }; },
          onEachFeature: (f, l) => {
            const name = String(f.properties?.name || f.properties?.NAME || f.properties?.ADMIN || 'Unknown');
            if (hub) l.bindTooltip(`<div style="font-weight:600">${esc(name)}</div><div>${countOf(f).toLocaleString('en-US')} clicks</div>`, { sticky: true });
            else {
              l.bindTooltip(`${esc(name)}: ${countOf(f).toLocaleString('en-US')} clicks`, { sticky: true });
              l.on({ mouseover: (e: any) => e.target.setStyle?.({ weight: 1.5, color: '#475569' }), mouseout: (e: any) => layer.resetStyle(e.target) });
            }
          },
        }).addTo(map);
        const bounds = layer.getBounds();
        if (!hub && bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
      } catch (e) {
        console.warn('Could not load world.geo.json — map disabled', e);
      }
    })();

    return () => { cancelled = true; map?.remove(); };
  }, [counts, max, hub]);

  return <div ref={host} className={className} style={{ background: '#f8fafc' }} role="img" aria-label="Map of clicks by country" />;
}
