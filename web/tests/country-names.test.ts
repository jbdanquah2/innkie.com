import { describe, expect, it } from 'vitest';
import { countsByMapName, toMapName } from '@/lib/country-names';
import geo from '../public/assets/world.geo.json';

const shapes = new Set((geo as any).features.map((f: any) => String(f.properties.name).toUpperCase()));

describe('toMapName', () => {
  it('translates names the map spells differently', () => {
    expect(toMapName('United States')).toBe('USA');
    expect(toMapName('United Kingdom')).toBe('ENGLAND');
    expect(toMapName('Czechia')).toBe('CZECH REPUBLIC');
    expect(toMapName("Côte d'Ivoire")).toBe('IVORY COAST');
  });
  it('leaves matching names alone and tolerates odd input', () => {
    expect(toMapName('Ghana')).toBe('GHANA');
    expect(toMapName('  nigeria ')).toBe('NIGERIA');
    expect(toMapName('')).toBe('');
  });
  it('every alias points at a real shape on the map', () => {
    for (const name of ['United States', 'United Kingdom', 'Czechia', "Côte d'Ivoire", 'North Macedonia', 'Eswatini', 'Serbia', 'Tanzania', 'Bahamas', 'Timor-Leste', 'Türkiye', 'Congo', 'The Gambia', 'Guinea-Bissau', 'Russian Federation', 'Viet Nam']) {
      expect(shapes.has(toMapName(name)), name).toBe(true);
    }
  });
  it('the most common countries are all on the map', () => {
    for (const name of ['United States', 'United Kingdom', 'Ghana', 'Nigeria', 'India', 'Germany', 'France', 'Canada', 'Brazil', 'Kenya', 'South Africa']) {
      expect(shapes.has(toMapName(name)), name).toBe(true);
    }
  });
});

describe('countsByMapName', () => {
  it('re-keys and merges', () => {
    const m = countsByMapName({ 'United States': 5, USA: 2, Ghana: 3 });
    expect(m.get('USA')).toBe(7);
    expect(m.get('GHANA')).toBe(3);
  });
});
