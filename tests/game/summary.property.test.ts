import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { arbQuiz } from '../generators';
import { arbScoreActions } from './generators';
import { initialScore, reduce } from '../../src/game/scoreEngine';
import { accuracyPercent, buildSummary, maxPossibleScore } from '../../src/game/summary';

describe('Property 19: Summary values follow the formulas', () => {
  /**
   * **Validates: Requirements 16.3, 16.4**
   */
  it('maxPossibleScore equals the sum of 100 * min(i + 1, 5)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), (total) => {
        let expected = 0;
        for (let i = 1; i <= total; i++) expected += 100 * Math.min(i, 5);
        expect(maxPossibleScore(total)).toBe(expected);
      }),
    );
  });

  it('accuracyPercent rounds half up, stays within 0..100, and is 0 when total is 0', () => {
    expect(accuracyPercent(0, 0)).toBe(0);
    expect(accuracyPercent(1, 8)).toBe(13); // 12.5 rounds up
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }).chain((total) =>
          fc.record({ total: fc.constant(total), firstTry: fc.integer({ min: 0, max: total }) }),
        ),
        ({ total, firstTry }) => {
          const r = accuracyPercent(firstTry, total);
          expect(r).toBe(Math.floor((100 * firstTry) / total + 0.5));
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(100);
        },
      ),
    );
  });

  it('buildSummary reports score, maxScore, accuracy and missed concepts from the state', () => {
    fc.assert(
      fc.property(
        arbQuiz.chain((quiz) => fc.record({ quiz: fc.constant(quiz), actions: arbScoreActions(quiz) })),
        ({ quiz, actions }) => {
          let s = initialScore(quiz.questions.length);
          for (const a of actions) s = reduce(s, a, quiz);
          const res = buildSummary(s, quiz);
          expect(res.ok).toBe(true);
          if (!res.ok) return;
          const total = quiz.questions.length;
          expect(res.value.score).toBe(s.score);
          expect(res.value.maxScore).toBe(maxPossibleScore(total));
          expect(res.value.accuracyPercent).toBe(
            accuracyPercent(Object.keys(s.firstTryCorrect).length, total),
          );
          expect(res.value.missedConcepts).toEqual(s.missedConcepts);
        },
      ),
    );
  });
});
