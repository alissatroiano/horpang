import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { arbQuiz } from '../generators';
import { arbScoreActions } from './generators';
import { initialScore, reduce } from '../../src/game/scoreEngine';

describe('Property 21: Reset returns to the initial state', () => {
  /**
   * **Validates: Requirements 16.7**
   */
  it('RESET after any action sequence equals initialScore(total)', () => {
    fc.assert(
      fc.property(
        arbQuiz.chain((quiz) => fc.record({ quiz: fc.constant(quiz), actions: arbScoreActions(quiz) })),
        ({ quiz, actions }) => {
          const total = quiz.questions.length;
          let s = initialScore(total);
          for (const a of actions) s = reduce(s, a, quiz);
          expect(reduce(s, { type: 'RESET' }, quiz)).toEqual(initialScore(total));
        },
      ),
      { numRuns: 100 },
    );
  });
});
