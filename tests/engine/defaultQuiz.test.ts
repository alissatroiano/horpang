import { describe, expect, it } from 'vitest';
import { DEFAULT_QUIZ, loadDefaultQuiz } from '../../src/engine/defaultQuiz';
import { validateQuiz } from '../../src/engine/validator';

describe('Default_Quiz', () => {
  it('has between 5 and 20 questions (Req 2.1)', () => {
    expect(DEFAULT_QUIZ.questions.length).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_QUIZ.questions.length).toBeLessThanOrEqual(20);
  });

  it('passes validation with zero errors (Req 2.2)', () => {
    expect(validateQuiz(DEFAULT_QUIZ)).toHaveLength(0);
  });

  it('loadDefaultQuiz returns ok with the default quiz (Req 2.2)', () => {
    const result = loadDefaultQuiz();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(DEFAULT_QUIZ);
  });

  it('loadDefaultQuiz returns an error result when the default is invalid (Req 2.5)', () => {
    const original = DEFAULT_QUIZ.questions;
    try {
      // Too few questions makes the quiz invalid.
      DEFAULT_QUIZ.questions = original.slice(0, 1);
      const result = loadDefaultQuiz();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
    } finally {
      DEFAULT_QUIZ.questions = original;
    }
    expect(loadDefaultQuiz().ok).toBe(true);
  });
});
