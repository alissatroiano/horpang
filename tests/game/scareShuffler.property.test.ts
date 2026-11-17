import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mulberry32 } from '../../src/game/rng';
import { nextScare, SCARES, type ScareId } from '../../src/game/scareShuffler';

// Feature: horpang-mvp, Property 18: Shuffler never repeats back to back and covers all scares
describe('Scare_Shuffler properties', () => {
  it('1000 seeded selections: no consecutive repeats, every scare appears', () => {
    // **Validates: Requirements 15.1, 15.2, 15.3, 15.4**
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rng = mulberry32(seed);
        let prev: ScareId | null = null;
        const seen = new Set<ScareId>();
        for (let i = 0; i < 1000; i++) {
          const s = nextScare(prev, rng);
          expect(SCARES).toContain(s);
          if (prev !== null) expect(s).not.toBe(prev);
          seen.add(s);
          prev = s;
        }
        expect(seen.size).toBe(SCARES.length);
      }),
      { numRuns: 100 },
    );
  });
});
