import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { arbQuiz } from '../generators';
import { arbScoreActions } from './generators';
import { banishedCount, initialScore, reduce } from '../../src/game/scoreEngine';

describe('Property 17: Score state invariants hold after every action', () => {
  /**
   * **Validates: Requirements 13.7**
   */
  it('keeps battery, banished count, streak and score in range and never mutates input', () => {
    fc.assert(
      fc.property(
        arbQuiz.chain((quiz) => fc.record({ quiz: fc.constant(quiz), actions: arbScoreActions(quiz) })),
        ({ quiz, actions }) => {
          let s = initialScore(quiz.questions.length);
          for (const a of actions) {
            const before = JSON.stringify(s);
            const next = reduce(s, a, quiz);
            expect(JSON.stringify(s)).toBe(before);
            expect(next.battery).toBeGreaterThanOrEqual(0);
            expect(next.battery).toBeLessThanOrEqual(100);
            expect(Number.isInteger(next.battery)).toBe(true);
            expect(banishedCount(next)).toBeGreaterThanOrEqual(0);
            expect(banishedCount(next)).toBeLessThanOrEqual(next.total);
            expect(next.streak).toBeGreaterThanOrEqual(0);
            expect(next.score).toBeGreaterThanOrEqual(0);
            s = next;
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
