import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { nextStage, type StageEvent, type StageId } from '../../src/game/stageMachine';

const arbStage = fc.constantFrom<StageId>('boot', 'bootError', 'title', 'gallery', 'corridor', 'summary');
const arbCount = fc.integer({ min: 0, max: 40 });

const arbEvent: fc.Arbitrary<StageEvent> = fc.oneof(
  fc.constant<StageEvent>({ type: 'QUIZ_READY' }),
  fc.constant<StageEvent>({ type: 'QUIZ_UNAVAILABLE' }),
  fc.boolean().map((grimoireOpen): StageEvent => ({ type: 'ENTER_GALLERY', grimoireOpen })),
  fc
    .tuple(arbCount, arbCount)
    .map(([solved, total]): StageEvent => ({ type: 'SCORE_UPDATED', solved, total })),
  fc.constant<StageEvent>({ type: 'EXIT_ACTIVATED' }),
  fc.constant<StageEvent>({ type: 'PLAY_AGAIN' }),
);

describe('Property 11: Corridor is entered only when every question is solved', () => {
  /** **Validates: Requirements 7.14, 8.1, 16.1, 16.2** */
  it('reaches corridor from gallery iff SCORE_UPDATED with total > 0 and solved === total', () => {
    fc.assert(
      fc.property(arbStage, arbEvent, (stage, ev) => {
        const next = nextStage(stage, ev);
        const expected =
          stage === 'gallery' && ev.type === 'SCORE_UPDATED' && ev.total > 0 && ev.solved === ev.total;
        // Corridor reached by a transition (not already there) only in the expected case.
        expect(stage !== 'corridor' && next === 'corridor').toBe(expected);
      }),
    );
  });

  it('ENTER_GALLERY with grimoireOpen never changes the stage', () => {
    fc.assert(
      fc.property(arbStage, (stage) => {
        expect(nextStage(stage, { type: 'ENTER_GALLERY', grimoireOpen: true })).toBe(stage);
      }),
    );
  });

  it('summary is entered only from corridor via EXIT_ACTIVATED', () => {
    fc.assert(
      fc.property(arbStage, arbEvent, (stage, ev) => {
        const next = nextStage(stage, ev);
        const entered = stage !== 'summary' && next === 'summary';
        expect(entered).toBe(stage === 'corridor' && ev.type === 'EXIT_ACTIVATED');
      }),
    );
  });
});
