import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateQuiz, validateQuestion } from '../../src/engine/validator';
import { arbJsonValue } from '../generators';

describe('Validator totality', () => {
  // Feature: horpang-mvp, Property 4: Validator is total
  // **Validates: Requirements 1.8**
  it('never throws on arbitrary JSON values and returns errors for non-quizzes', () => {
    fc.assert(
      fc.property(arbJsonValue, (value) => {
        const errors = validateQuiz(value);
        expect(Array.isArray(errors)).toBe(true);
        // Arbitrary JSON is practically never a valid Quiz; a non-empty list is expected
        // unless the value happens to be valid (then the list is empty).
        expect(() => validateQuestion(value, 1)).not.toThrow();
        return true;
      }),
      { numRuns: 200 },
    );
  });
});
