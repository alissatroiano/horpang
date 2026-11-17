import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseQuizJson, printQuizJson } from '../../src/engine/jsonCodec';
import { arbQuiz } from '../generators';

describe('JSON_Codec round trip', () => {
  // Feature: horpang-mvp, Property 5: JSON round trip
  it('Property 5: parse(print(quiz)) equals quiz, and print is deterministic and stable', () => {
    // **Validates: Requirements 3.4, 3.5**
    fc.assert(
      fc.property(arbQuiz, fc.boolean(), (quiz, compact) => {
        const text = printQuizJson(quiz, { compact });
        const parsed = parseQuizJson(text);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        expect(parsed.value).toEqual(quiz);

        // Deterministic: same input prints the same text.
        expect(printQuizJson(quiz, { compact })).toBe(text);
        // Stable: printing the parsed result reproduces the same text.
        expect(printQuizJson(parsed.value, { compact })).toBe(text);
      }),
      { numRuns: 100 },
    );
  });
});
