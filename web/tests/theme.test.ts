import { describe, expect, it } from 'vitest';
import { onPrimaryFor } from '@/lib/theme';

describe('onPrimaryFor', () => {
  it('keeps white text on the default and other dark accents', () => {
    expect(onPrimaryFor('#4f46e5')).toBe('255 255 255');
    expect(onPrimaryFor('#0f766e')).toBe('255 255 255');
    expect(onPrimaryFor(undefined)).toBe('255 255 255');
  });
  it('switches to dark text when the accent is too light for white', () => {
    expect(onPrimaryFor('#facc15')).toBe('15 23 42'); // yellow
    expect(onPrimaryFor('#a7f3d0')).toBe('15 23 42'); // pale mint
  });
});
