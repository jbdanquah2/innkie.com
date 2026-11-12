import type { ShortUrl } from '@innkie/shared-models';

type Searchable = Pick<ShortUrl, 'title' | 'shortCode' | 'customAlias' | 'originalUrl' | 'tags' | 'description'>;

/** Lower is better; Infinity means no match. Title/code matches that start the word beat matches in the middle, which beat matches in the destination. */
export function matchRank(l: Searchable, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const title = (l.title || '').toLowerCase();
  const code = (l.shortCode || '').toLowerCase();
  const alias = (l.customAlias || '').toLowerCase();
  if (code === q || alias === q) return 0;
  if (title.startsWith(q) || code.startsWith(q) || alias.startsWith(q)) return 1;
  if (title.includes(q) || code.includes(q) || alias.includes(q)) return 2;
  if (l.tags?.some((t) => t.toLowerCase().includes(q))) return 3;
  if ((l.originalUrl || '').toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q)) return 4;
  return Infinity;
}

/** The best `limit` links for a query, ties kept in their original (newest-first) order. */
export function searchLinks<T extends Searchable>(links: T[], query: string, limit = 8): T[] {
  return links
    .map((l, i) => ({ l, r: matchRank(l, query), i }))
    .filter((x) => x.r !== Infinity)
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.l);
}
