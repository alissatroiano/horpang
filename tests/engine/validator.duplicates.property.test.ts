import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateQuiz } from '../../src/engine/validator';
import { arbQuiz } from '../generators';

/**
 * Feature: horpang-mvp, Property 3: Duplicate ids produce one error per later duplicate
 * **Validates: Requirements 1.7**
 */
describe('Property 3: duplicate ids', () => {
  it('flags exactly each later question whose id was already seen', () => {
    fc.assert(
      fc.property(
        arbQuiz,
        fc.array(fc.option(fc.nat(), { nil: undefined }), { minLength: 0, maxLength: 50 }),
        (quiz, picks) => {
          // Optionally overwrite a question's id with the id of an earlier question.
          const questions = quiz.questions.map((q) => ({ ...q }));
          for (let i = 1; i < questions.length; i++) {
            const pick = picks[i];
            if (pick !== undefined) questions[i]!.id = questions[pick % i]!.id;
          }

          const seen = new Set<string>();
          const expected: number[] = [];
          questions.forEach((q, i) => {
            if (seen.has(q.id)) expected.push(i + 1);
            else seen.add(q.id);
          });

          const errors = validateQuiz({ ...quiz, questions });
          const idErrors = errors.filter((e) => e.field === 'id');

          expect(idErrors.map((e) => e.position)).toEqual(expected);
          expect(errors.length).toBe(expected.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
