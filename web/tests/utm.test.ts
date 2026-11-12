import { describe, expect, it } from 'vitest';
import { buildUtmUrl, missingFields, normalizeBaseUrl, readUtm, tidyValue, utmTips } from '@/lib/utm';

const v = (o: Partial<Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>> = {}) => ({ source: 'newsletter', medium: 'email', campaign: 'spring-sale', term: '', content: '', ...o });

describe('normalizeBaseUrl', () => {
  it('accepts full addresses and adds https:// to bare hosts', () => {
    expect(normalizeBaseUrl('https://example.com/a')).toEqual({ url: 'https://example.com/a', addedScheme: false, existingUtm: [] });
    expect(normalizeBaseUrl('example.com/page?x=1')).toMatchObject({ url: 'https://example.com/page?x=1', addedScheme: true });
    expect(normalizeBaseUrl('www.example.co.uk')).toMatchObject({ url: 'https://www.example.co.uk', addedScheme: true });
    expect(normalizeBaseUrl('localhost:3000/x')).toMatchObject({ url: 'https://localhost:3000/x', addedScheme: true });
  });
  it('does not mistake a host that starts with "http" for a scheme (the old tool rejected these)', () => {
    expect(normalizeBaseUrl('httpbin.org/get')).toMatchObject({ url: 'https://httpbin.org/get', addedScheme: true });
    expect(normalizeBaseUrl('httpstatus.io')).toMatchObject({ url: 'https://httpstatus.io', addedScheme: true });
    expect(normalizeBaseUrl('http://plain.example.com')).toMatchObject({ url: 'http://plain.example.com', addedScheme: false });
  });
  it('explains what is wrong', () => {
    expect(normalizeBaseUrl('')).toEqual({ error: '' });
    expect((normalizeBaseUrl('mailto:a@b.co') as { error: string }).error).toMatch(/Only http/);
    expect((normalizeBaseUrl('ftp://x.y') as { error: string }).error).toMatch(/Only http/);
    expect((normalizeBaseUrl('just some words') as { error: string }).error).toMatch(/full web address/);
    expect((normalizeBaseUrl('https://') as { error: string }).error).toBeTruthy();
  });
  it('reports utm parameters that are already in the address', () => {
    expect(normalizeBaseUrl('https://x.co/?utm_source=a&utm_medium=b&q=1')).toMatchObject({ existingUtm: ['utm_source', 'utm_medium'] });
  });
});

describe('buildUtmUrl keeps the original address untouched', () => {
  it('adds a query to an address without one', () => {
    expect(buildUtmUrl('https://example.com/page', v())).toBe('https://example.com/page?utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale');
  });
  it('appends after the existing query exactly as it was written', () => {
    const base = 'https://example.com/p?ref=%7Etest&q=a%2Fb&sp=a+b';
    const out = buildUtmUrl(base, v());
    expect(out.startsWith(base + '&')).toBe(true); // the old tool re-encoded these into ref=~test and sp=a+b differently
    expect(out).toBe(`${base}&utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale`);
  });
  it('puts the parameters before a #fragment, which stays as written', () => {
    expect(buildUtmUrl('https://example.com/p#Section%201', v())).toBe('https://example.com/p?utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale#Section%201');
    expect(buildUtmUrl('https://example.com/p?a=1#frag', v({ term: 'shoes' }))).toBe('https://example.com/p?a=1&utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale&utm_term=shoes#frag');
  });
  it('replaces utm parameters that are already there and keeps everything else', () => {
    const out = buildUtmUrl('https://x.co/?a=1&utm_source=old&b=2&utm_medium=old', v());
    expect(out).toBe('https://x.co/?a=1&b=2&utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale');
  });
  it('leaves an existing utm parameter alone when its new value is empty', () => {
    expect(buildUtmUrl('https://x.co/?utm_term=keep', v())).toBe('https://x.co/?utm_term=keep&utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale');
  });
  it('encodes values: spaces as %20, and characters that would break the query', () => {
    const out = buildUtmUrl('https://x.co', v({ campaign: 'a b&c=d', content: 'é/ü' }));
    expect(out).toContain('utm_campaign=a%20b%26c%3Dd');
    expect(out).toContain('utm_content=%C3%A9%2F%C3%BC');
    expect(readUtm(out).find((p) => p.key === 'utm_campaign')?.value).toBe('a b&c=d');
  });
  it('handles an address that already ends with ? or &', () => {
    expect(buildUtmUrl('https://x.co/?', v())).toBe('https://x.co/?utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale');
    expect(buildUtmUrl('https://x.co/?a=1&', v())).toBe('https://x.co/?a=1&utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale');
  });
});

describe('tidyValue and tips', () => {
  it('lowercases and replaces spaces with hyphens when asked', () => {
    expect(tidyValue('  Spring  Sale ', true)).toBe('spring-sale');
    expect(tidyValue('  Spring  Sale ', false)).toBe('Spring  Sale');
  });
  it('warns about the usual mistakes', () => {
    expect(utmTips(v({ medium: 'Email' })).map((t) => t.id)).toEqual(['case']);
    expect(utmTips(v({ campaign: 'spring sale' })).map((t) => t.id)).toEqual(['space']);
    expect(utmTips(v({ content: 'jo@example.com' })).map((t) => t.id)).toEqual(['pii']);
    expect(utmTips(v())).toEqual([]);
  });
  it('lists what is missing', () => {
    expect(missingFields(v({ source: '', campaign: '' }))).toEqual(['source', 'campaign name']);
    expect(missingFields(v())).toEqual([]);
  });
});

describe('readUtm', () => {
  it('lists only the utm parameters, decoded', () => {
    expect(readUtm('https://x.co/?a=1&utm_source=news%20letter&utm_medium=email')).toEqual([{ key: 'utm_source', value: 'news letter' }, { key: 'utm_medium', value: 'email' }]);
  });
});
