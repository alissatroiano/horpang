import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { arbQuiz } from '../generators';
import { arbScoreActions } from './generators';
import { banishedCount, initialScore, reduce } from '../../src/game/scoreEngine';

describe('Property 15: Correct answers score by the prior multiplier', () => {
  /**
   * **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.8**
   */
  it('ANSWER_CORRECT scores 100 * min(streak + 1, 5) and is a no-op when already solved', () => {
    fc.assert(
      fc.property(
        arbQuiz.chain((quiz) =>
          fc.record({
            quiz: fc.constant(quiz),
            actions: arbScoreActions(quiz),
            pick: fc.nat({ max: quiz.questions.length - 1 }),
          }),
        ),
        ({ quiz, actions, pick }) => {
          let s = initialScore(quiz.questions.length);
          for (const a of actions) s = reduce(s, a, quiz);

          const id = quiz.questions[pick]!.id;
          const before = JSON.stringify(s);
          const next = reduce(s, { type: 'ANSWER_CORRECT', questionId: id }, quiz);
          expect(JSON.stringify(s)).toBe(before); // input not mutated

          if (s.solved[id]) {
            expect(next).toBe(s);
            return;
          }
          expect(next.score).toBe(s.score + 100 * Math.min(s.streak + 1, 5));
          expect(next.streak).toBe(s.streak + 1);
          expect(next.battery).toBe(Math.min(100, s.battery + 20));
          expect(next.solved[id]).toBe(true);
          expect(banishedCount(next)).toBe(banishedCount(s) + 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('ANSWER_CORRECT for an unknown id leaves state unchanged', () => {
    fc.assert(
      fc.property(
        arbQuiz.chain((quiz) => fc.record({ quiz: fc.constant(quiz), actions: arbScoreActions(quiz) })),
        ({ quiz, actions }) => {
          let s = initialScore(quiz.questions.length);
          for (const a of actions) s = reduce(s, a, quiz);
          expect(reduce(s, { type: 'ANSWER_CORRECT', questionId: 'unknown-id' }, quiz)).toBe(s);
        },
      ),
      { numRuns: 50 },
    );
  });
});
