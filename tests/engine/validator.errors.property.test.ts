import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateQuiz } from '../../src/engine/validator';
import { arbQuiz, arbCorrupt } from '../generators';

const key = (position: number | null, field: string): string => `${position ?? 'quiz'}|${field}`;

describe('Validator error reporting', () => {
  /**
   * Feature: horpang-mvp, Property 2: Validator reports one error per failing field and does not mutate
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
   */
  it('reports exactly one error per corrupted field and does not mutate the input', () => {
    fc.assert(
      fc.property(
        arbQuiz.chain((quiz) => arbCorrupt(quiz)),
        ({ value, expected }) => {
          const before = structuredClone(value);
          const errors = validateQuiz(value);

          expect(value).toEqual(before);

          const actual = errors.map((e) => key(e.position, e.field)).sort();
          const want = expected.map((e) => key(e.position, e.field)).sort();
          expect(actual).toEqual(want);
          expect(new Set(actual).size).toBe(actual.length);
          for (const e of errors) expect(e.message.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
