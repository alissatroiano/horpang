import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { arbQuiz } from '../generators';
import { arbScoreActions } from './generators';
import { initialScore, reduce } from '../../src/game/scoreEngine';

describe('Property 16: Wrong answers penalize and record concepts once', () => {
  /**
   * **Validates: Requirements 14.2, 14.3, 14.9**
   */
  it('ANSWER_WRONG resets streak, drains battery, records concept once, disables option', () => {
    fc.assert(
      fc.property(
        arbQuiz.chain((quiz) =>
          fc.record({
            quiz: fc.constant(quiz),
            actions: arbScoreActions(quiz),
            pick: fc.nat({ max: quiz.questions.length - 1 }),
            optPick: fc.nat({ max: 1000 }),
          }),
        ),
        ({ quiz, actions, pick, optPick }) => {
          let s = initialScore(quiz.questions.length);
          for (const a of actions) s = reduce(s, a, quiz);

          const q = quiz.questions[pick]!;
          const wrongIdx = q.options
            .map((_, i) => i)
            .filter((i) => i !== q.correctIndex && !(s.wrongOptions[q.id] ?? []).includes(i));
          if (s.solved[q.id] || wrongIdx.length === 0) return;
          const optionIndex = wrongIdx[optPick % wrongIdx.length]!;

          const before = JSON.stringify(s);
          const next = reduce(s, { type: 'ANSWER_WRONG', questionId: q.id, optionIndex }, quiz);
          expect(JSON.stringify(s)).toBe(before); // input not mutated

          expect(next.streak).toBe(0);
          expect(next.battery).toBe(Math.max(0, s.battery - 15));
          expect(next.score).toBe(s.score);
          expect(next.solved[q.id]).toBeUndefined();
          expect(next.wrongOptions[q.id]).toContain(optionIndex);
          expect(next.missedConcepts.filter((c) => c === q.concept)).toHaveLength(1);
          expect(new Set(next.missedConcepts).size).toBe(next.missedConcepts.length);
          if (s.missedConcepts.includes(q.concept)) {
            expect(next.missedConcepts).toEqual(s.missedConcepts);
          } else {
            expect(next.missedConcepts.length).toBe(s.missedConcepts.length + 1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
