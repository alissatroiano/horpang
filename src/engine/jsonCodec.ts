import { LIMITS } from './limits';
import type { Quiz, Result, ValidationError } from './model';
import { validateQuiz } from './validator';

export type CodecError =
  | { kind: 'too-large'; bytes: number; limit: number }
  | { kind: 'empty' }
  | { kind: 'syntax'; message: string; line: number; column: number }
  | { kind: 'validation'; errors: ValidationError[] }
  | { kind: 'csv-missing-column'; column: string; row: number }
  | { kind: 'csv-unterminated-quote'; row: number };

const QUIZ_KEYS = ['title', 'questions'] as const;
const QUESTION_KEYS = [
  'id',
  'prompt',
  'options',
  'correctIndex',
  'explanation',
  'hint',
  'concept',
] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Converts a 0-based character offset into a 1-based line and column. */
function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  const end = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lastBreak = -1;
  for (let i = 0; i < end; i++) {
    if (text[i] === '\n') {
      line++;
      lastBreak = i;
    }
  }
  return { line, column: end - lastBreak };
}

/** Derives line and column from a JSON.parse error message; falls back to 1:1. */
function locate(text: string, message: string): { line: number; column: number } {
  const lc = /line (\d+) column (\d+)/i.exec(message);
  if (lc?.[1] && lc[2]) return { line: Number(lc[1]), column: Number(lc[2]) };
  const pos = /position (\d+)/i.exec(message);
  if (pos?.[1]) return offsetToLineColumn(text, Number(pos[1]));
  if (/end of (json )?(input|data)/i.test(message)) return offsetToLineColumn(text, text.length);
  return { line: 1, column: 1 };
}

/** Copies only the known keys, so extra keys never reach the Quiz. */
function copyKnown(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const out: Record<string, unknown> = {};
  for (const key of QUIZ_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    const value = raw[key];
    if (key === 'questions' && Array.isArray(value)) {
      out[key] = value.map((q: unknown) => {
        if (!isRecord(q)) return q;
        const copy: Record<string, unknown> = {};
        for (const k of QUESTION_KEYS) {
          if (!Object.prototype.hasOwnProperty.call(q, k)) continue;
          const v = q[k];
          copy[k] = k === 'options' && Array.isArray(v) ? [...v] : v;
        }
        return copy;
      });
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function parseQuizJson(text: string): Result<Quiz, CodecError[]> {
  try {
    const bytes = new TextEncoder().encode(text).length;
    if (bytes > LIMITS.fileMaxBytes) {
      return { ok: false, error: [{ kind: 'too-large', bytes, limit: LIMITS.fileMaxBytes }] };
    }
    if (text.trim().length === 0) return { ok: false, error: [{ kind: 'empty' }] };

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, error: [{ kind: 'syntax', message, ...locate(text, message) }] };
    }

    const candidate = copyKnown(raw);
    const errors = validateQuiz(candidate);
    if (errors.length > 0) return { ok: false, error: [{ kind: 'validation', errors }] };
    return { ok: true, value: candidate as Quiz };
  } catch {
    return {
      ok: false,
      error: [{ kind: 'syntax', message: 'could not be parsed', line: 1, column: 1 }],
    };
  }
}

/** Prints with fixed key order. Default is 2-space indentation; `compact` omits whitespace. */
export function printQuizJson(quiz: Quiz, options: { compact?: boolean } = {}): string {
  const ordered = {
    title: quiz.title,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      hint: q.hint,
      concept: q.concept,
    })),
  };
  return options.compact ? JSON.stringify(ordered) : JSON.stringify(ordered, null, 2);
}
