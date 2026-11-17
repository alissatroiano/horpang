import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { arbQuiz } from '../generators';
import { arbScoreActions } from './generators';
import { initialScore, reduce } from '../../src/game/scoreEngine';
import { buildSummary } from '../../src/game/summary';

describe('Property 20: Missed concepts are unique and ordered by first reference', () => {
  /**
   * **Validates: Requirements 14.3, 16.5**
   */
  it('missed concepts are unique, ordered by first referencing question position', () => {
    fc.assert(
      fc.property(
        arbQuiz.chain((quiz) => fc.record({ quiz: fc.constant(quiz), actions: arbScoreActions(quiz) })),
        ({ quiz, actions }) => {
          let s = initialScore(quiz.questions.length);
          for (const a of actions) s = reduce(s, a, quiz);

          const missed = s.missedConcepts;
          expect(new Set(missed).size).toBe(missed.length);

          // Expected: concepts of questions with a recorded wrong attempt, by first position.
          const expected: string[] = [];
          for (const q of quiz.questions) {
            if (s.attempted[q.id] && !expected.includes(q.concept)) expected.push(q.concept);
          }
          expect(missed).toEqual(expected);

          const summary = buildSummary(s, quiz);
          expect(summary.ok).toBe(true);
          if (summary.ok) expect(summary.value.missedConcepts).toEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });
});
