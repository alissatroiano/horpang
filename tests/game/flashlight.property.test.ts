import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { maskSize, maskTranslate } from '../../src/game/flashlight';

describe('flashlight geometry', () => {
  /**
   * Property 12: Flashlight is centered on the pointer
   * **Validates: Requirements 8.3, 8.4, 8.5**
   */
  it('Property 12: mask is 200% of viewport and centered on the pointer', () => {
    const dim = fc.integer({ min: 1, max: 10000 });
    const coord = fc.integer({ min: -5000, max: 15000 });
    fc.assert(
      fc.property(dim, dim, coord, coord, (width, height, px, py) => {
        const vp = { width, height };
        const mask = maskSize(vp);
        expect(mask.width).toBe(width * 2);
        expect(mask.height).toBe(height * 2);
        const t = maskTranslate({ x: px, y: py }, mask);
        expect(t.x + mask.width / 2).toBe(px);
        expect(t.y + mask.height / 2).toBe(py);
      }),
    );
  });
});
