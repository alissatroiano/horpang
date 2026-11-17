import { describe, it, expect } from 'vitest';
import { contrastRatio } from '../../src/game/contrast';

// Values mirror src/styles/index.css (body color/background, :focus-visible outline).
const TEXT = '#e8e4d8';
const BACKGROUND = '#000000';
const FOCUS_RING = '#e8e4d8';

describe('contrast', () => {
  it('body text on black is at least 4.5:1', () => {
    expect(contrastRatio(TEXT, BACKGROUND)).toBeGreaterThanOrEqual(4.5);
  });

  it('focus ring on black is at least 3:1', () => {
    expect(contrastRatio(FOCUS_RING, BACKGROUND)).toBeGreaterThanOrEqual(3);
  });

  it('is symmetric', () => {
    expect(contrastRatio(BACKGROUND, TEXT)).toBeCloseTo(contrastRatio(TEXT, BACKGROUND));
  });
});
