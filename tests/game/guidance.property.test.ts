import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { deriveGuideState, guideText, GUIDE_TABLE, type GuideState } from '../../src/game/guidance';

const STATES = Object.keys(GUIDE_TABLE) as GuideState[];

const ctxArb = fc.record({
  solved: fc.integer({ min: 0, max: 20 }),
  total: fc.integer({ min: 0, max: 20 }),
  modalOpen: fc.boolean(),
  lastResult: fc.constantFrom('wrong' as const, 'correct' as const, null),
});

// Feature: horpang-mvp, Property 14: Guidance is total, deterministic and non-empty
describe('Guidance properties', () => {
  it('deriveGuideState is total and guideText is deterministic and non-empty', () => {
    // **Validates: Requirements 11.2, 11.3, 11.7**
    fc.assert(
      fc.property(ctxArb, fc.string(), (ctx, current) => {
        const state = deriveGuideState(ctx);
        expect(STATES).toContain(state);
        const t = guideText(state, current);
        expect(t).not.toBe('');
        expect(guideText(state, current)).toBe(t);
        expect(t).toBe(GUIDE_TABLE[state]);
      }),
      { numRuns: 200 },
    );
  });

  it('unknown states return current text unchanged (none-solved text if current is empty)', () => {
    // **Validates: Requirements 11.2, 11.3, 11.7**
    const unknown = fc
      .oneof(fc.string(), fc.constant(undefined), fc.constant(null), fc.integer())
      .filter((v) => !(typeof v === 'string' && STATES.includes(v as GuideState)));
    fc.assert(
      fc.property(unknown, fc.string(), (state, current) => {
        const t = guideText(state, current);
        expect(t).toBe(current === '' ? GUIDE_TABLE['none-solved'] : current);
        expect(t).not.toBe('');
      }),
      { numRuns: 200 },
    );
  });

  it('all solved with modal closed and no wrong result mentions corridor and EXIT door', () => {
    // **Validates: Requirements 11.2, 11.3, 11.7**
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.constantFrom('correct' as const, null),
        (total, lastResult) => {
          const state = deriveGuideState({ solved: total, total, modalOpen: false, lastResult });
          const t = guideText(state, '');
          expect(state).toBe('all-solved');
          expect(t).toMatch(/corridor/i);
          expect(t).toMatch(/EXIT door/);
        },
      ),
    );
  });
});
