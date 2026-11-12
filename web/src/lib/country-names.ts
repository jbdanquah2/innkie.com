/**
 * The backend stores English country names from MaxMind ("United States"), while the bundled world map
 * (public/assets/world.geo.json) uses its own names ("USA"). Without translating, the most common countries
 * never get shaded. Keys and values are upper case; names that already match need no entry.
 */
const ALIASES: Record<string, string> = {
  'UNITED STATES': 'USA',
  'UNITED STATES OF AMERICA': 'USA',
  'UNITED KINGDOM': 'ENGLAND',
  'CZECHIA': 'CZECH REPUBLIC',
  "CÔTE D'IVOIRE": 'IVORY COAST',
  "COTE D'IVOIRE": 'IVORY COAST',
  'NORTH MACEDONIA': 'MACEDONIA',
  'ESWATINI': 'SWAZILAND',
  'SERBIA': 'REPUBLIC OF SERBIA',
  'TANZANIA': 'UNITED REPUBLIC OF TANZANIA',
  'BAHAMAS': 'THE BAHAMAS',
  'TIMOR-LESTE': 'EAST TIMOR',
  'TÜRKIYE': 'TURKEY',
  'TURKIYE': 'TURKEY',
  'CONGO': 'REPUBLIC OF THE CONGO',
  'THE GAMBIA': 'GAMBIA',
  'GUINEA-BISSAU': 'GUINEA BISSAU',
  'RUSSIAN FEDERATION': 'RUSSIA',
  'KOREA, SOUTH': 'SOUTH KOREA',
  'REPUBLIC OF KOREA': 'SOUTH KOREA',
  'VIET NAM': 'VIETNAM',
};

/** The name the world map uses for a stored country name (upper case), so counts line up with map shapes. */
export function toMapName(country: string): string {
  const k = String(country ?? '').trim().toUpperCase();
  return ALIASES[k] ?? k;
}

/** Counts keyed by stored names, re-keyed by map names; countries that translate to the same shape are added together. */
export function countsByMapName(counts: Record<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  for (const [name, n] of Object.entries(counts)) {
    const key = toMapName(name);
    out.set(key, (out.get(key) ?? 0) + (Number(n) || 0));
  }
  return out;
}
