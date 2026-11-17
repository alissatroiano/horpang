import { LIMITS } from './limits';
import type { Quiz, ValidationError } from './model';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Returns an error message for a text field, or null when it is valid. */
function checkText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return 'must be a string';
  if (value.trim().length === 0) return 'must not be empty or whitespace only';
  if (value.length > max) return `must be at most ${max} characters`;
  return null;
}

function validateQuestionUnsafe(q: unknown, position: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const add = (field: string, message: string): void => {
    errors.push({ position, field, message });
  };

  if (!isRecord(q)) {
    add('question', 'must be an object');
    return errors;
  }

  if (typeof q.id !== 'string') add('id', 'must be a string');

  const textFields: Array<[string, number]> = [
    ['explanation', LIMITS.explanationMax],
    ['hint', LIMITS.hintMax],
    ['concept', LIMITS.conceptMax],
  ];

  const prompt = checkText(q.prompt, LIMITS.promptMax);
  if (prompt) add('prompt', prompt);

  let optionCountOk = false;
  let optionCount = 0;
  if (!Array.isArray(q.options)) {
    add('options', 'must be an array');
  } else {
    optionCount = q.options.length;
    if (optionCount < LIMITS.optionMin || optionCount > LIMITS.optionMax) {
      add('options', `must have ${LIMITS.optionMin} to ${LIMITS.optionMax} options`);
    } else {
      optionCountOk = true;
    }
    for (let i = 0; i < optionCount; i++) {
      const msg = checkText(q.options[i], LIMITS.optionLenMax);
      if (msg) add(`options[${i}]`, msg);
    }
  }

  const ci = q.correctIndex;
  if (typeof ci !== 'number' || !Number.isInteger(ci)) {
    add('correctIndex', 'must be an integer');
  } else if (optionCountOk && (ci < 0 || ci >= optionCount)) {
    add('correctIndex', `must be between 0 and ${optionCount - 1}`);
  } else if (!optionCountOk && ci < 0) {
    add('correctIndex', 'must not be negative');
  }

  for (const [field, max] of textFields) {
    const msg = checkText(q[field], max);
    if (msg) add(field, msg);
  }

  return errors;
}

export function validateQuestion(q: unknown, position: number): ValidationError[] {
  try {
    return validateQuestionUnsafe(q, position);
  } catch {
    return [{ position, field: 'question', message: 'could not be validated' }];
  }
}

export function validateQuiz(quiz: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  try {
    if (!isRecord(quiz)) {
      return [{ position: null, field: 'quiz', message: 'must be an object' }];
    }

    const title = checkText(quiz.title, LIMITS.titleMax);
    if (title) errors.push({ position: null, field: 'title', message: title });

    const questions = quiz.questions;
    if (!Array.isArray(questions)) {
      errors.push({ position: null, field: 'questions', message: 'must be an array' });
      return errors;
    }
    if (questions.length < LIMITS.questionsMin || questions.length > LIMITS.questionsMax) {
      errors.push({
        position: null,
        field: 'questions',
        message: `must have ${LIMITS.questionsMin} to ${LIMITS.questionsMax} questions`,
      });
    }

    const seen = new Set<string>();
    for (let i = 0; i < questions.length; i++) {
      const q: unknown = questions[i];
      errors.push(...validateQuestion(q, i + 1));
      if (isRecord(q) && typeof q.id === 'string') {
        if (seen.has(q.id)) {
          errors.push({ position: i + 1, field: 'id', message: `duplicate id "${q.id}"` });
        } else {
          seen.add(q.id);
        }
      }
    }
  } catch {
    errors.push({ position: null, field: 'quiz', message: 'could not be validated' });
  }
  return errors;
}

export function isValidQuiz(quiz: unknown): quiz is Quiz {
  return validateQuiz(quiz).length === 0;
}
