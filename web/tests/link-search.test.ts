import { describe, expect, it } from 'vitest';
import { matchRank, searchLinks } from '@/lib/link-search';

const L = (o: Record<string, unknown>) => ({ title: '', shortCode: 'abc123', originalUrl: 'https://example.com/', tags: [], ...o }) as any;

describe('searchLinks', () => {
  const links = [
    L({ title: 'Spring sale', shortCode: 's1' }),
    L({ title: 'Annual report', shortCode: 'rep', originalUrl: 'https://example.com/spring' }),
    L({ title: 'Press kit', shortCode: 'pk', tags: ['spring'] }),
    L({ title: 'Respring', shortCode: 'x9' }),
  ];
  it('ranks word-start matches above mid-word, tags, then destination', () => {
    expect(searchLinks(links, 'spring').map((l) => l.title)).toEqual(['Spring sale', 'Respring', 'Press kit', 'Annual report']);
  });
  it('matches an exact short code first', () => expect(searchLinks(links, 'pk')[0].title).toBe('Press kit'));
  it('returns nothing for no match and everything (capped) for an empty query', () => {
    expect(searchLinks(links, 'zzz')).toEqual([]);
    expect(searchLinks(links, '', 2)).toHaveLength(2);
  });
  it('is case-insensitive', () => expect(matchRank(links[0], 'SPRING')).toBe(1));
});
