import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isValidQuiz, validateQuiz } from '../../src/engine/validator';
import { arbQuiz } from '../generators';

describe('Validator acceptance', () => {
  // Feature: horpang-mvp, Property 1: Validator accepts every well-formed quiz
  it('Property 1: Validator accepts every well-formed quiz', () => {
    // **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
    fc.assert(
      fc.property(arbQuiz, (quiz) => {
        expect(validateQuiz(quiz)).toEqual([]);
        expect(isValidQuiz(quiz)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
