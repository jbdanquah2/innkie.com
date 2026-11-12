import { describe, expect, it } from 'vitest';
import { generateV7Batch, inspectUuid, joinUuids, styleUuid, uuidV4, uuidV7 } from '@/lib/uuid';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('v4', () => {
  it('has the right shape and is unique across a large batch', () => {
    const set = new Set(Array.from({ length: 5000 }, uuidV4));
    expect(set.size).toBe(5000);
    for (const u of [...set].slice(0, 200)) expect(u).toMatch(V4);
  });
});

describe('v7', () => {
  it('encodes the timestamp, version and variant', () => {
    const ts = 1_700_000_123_456;
    const u = uuidV7(ts, 0, new Uint8Array(8));
    expect(u).toMatch(V7);
    expect(parseInt(u.replace(/-/g, '').slice(0, 12), 16)).toBe(ts);
    expect(inspectUuid(u)).toMatchObject({ valid: true, version: 7, variant: 'RFC 9562 (standard)' });
    expect(inspectUuid(u).time?.getTime()).toBe(ts);
  });
  it('handles timestamps beyond 32 bits correctly', () => {
    const ts = 2 ** 40 + 12345;
    expect(parseInt(uuidV7(ts, 0, new Uint8Array(8)).replace(/-/g, '').slice(0, 12), 16)).toBe(ts);
  });
  it('comes out in increasing order within one millisecond, and across milliseconds', () => {
    const same = generateV7Batch(1000, () => 1_700_000_000_000);
    expect(same).toEqual([...same].sort());
    expect(new Set(same).size).toBe(1000);
    let t = 1_700_000_000_000;
    const moving = generateV7Batch(300, () => (t += Math.random() < 0.5 ? 0 : 1));
    expect(moving).toEqual([...moving].sort());
    for (const u of moving) expect(u).toMatch(V7);
  });
  it('survives more than 4096 values in one millisecond by moving to the next one', () => {
    const many = generateV7Batch(5000, () => 1_700_000_000_000);
    expect(many).toEqual([...many].sort());
    expect(new Set(many).size).toBe(5000);
  });
});

describe('inspectUuid', () => {
  it('reads version and variant, with or without hyphens and braces', () => {
    const u = '550e8400-e29b-41d4-a716-446655440000';
    expect(inspectUuid(u)).toMatchObject({ valid: true, version: 4, variant: 'RFC 9562 (standard)' });
    expect(inspectUuid(u.replace(/-/g, '').toUpperCase())).toMatchObject({ valid: true, version: 4 });
    expect(inspectUuid(`{${u}}`)).toMatchObject({ valid: true, version: 4 });
  });
  it('recognises nil and max, and rejects non-UUIDs', () => {
    expect(inspectUuid('00000000-0000-0000-0000-000000000000')).toMatchObject({ valid: true, nil: true });
    expect(inspectUuid('ffffffff-ffff-ffff-ffff-ffffffffffff')).toMatchObject({ valid: true, max: true });
    for (const bad of ['', 'nope', '550e8400-e29b-41d4-a716-44665544000', '550e8400-e29b-41d4-a716-44665544000g', '550e8400e29b41d4a716446655440000x']) expect(inspectUuid(bad).valid).toBe(false);
  });
  it('reads the creation time of a v1 UUID', () => {
    // Known example: v1 UUID generated on 2000-01-01T00:00:00Z-ish is hard to hand-build, so use the RFC 9562 test vector.
    const rfcV1 = 'c232ab00-9414-11ec-b3c8-9f6bdeced846'; // RFC 9562 appendix example, time 2022-02-22T19:22:22Z
    const info = inspectUuid(rfcV1);
    expect(info.version).toBe(1);
    expect(info.time?.toISOString()).toBe('2022-02-22T19:22:22.000Z');
  });
});

describe('formatting', () => {
  const u = '550e8400-e29b-41d4-a716-446655440000';
  it('styles one UUID', () => {
    expect(styleUuid(u, { upper: false, hyphens: true, braces: false })).toBe(u);
    expect(styleUuid(u, { upper: true, hyphens: false, braces: true })).toBe('{550E8400E29B41D4A716446655440000}');
  });
  it('joins a list as lines, commas or JSON', () => {
    expect(joinUuids(['a', 'b'], 'lines')).toBe('a\nb');
    expect(joinUuids(['a', 'b'], 'commas')).toBe('a, b');
    expect(JSON.parse(joinUuids(['a', 'b'], 'json'))).toEqual(['a', 'b']);
  });
});
