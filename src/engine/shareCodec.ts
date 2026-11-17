import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { printQuizJson } from './jsonCodec';
import { LIMITS } from './limits';
import type { Quiz, Result, ValidationError } from './model';
import { validateQuiz } from './validator';

export type ShareError =
  | { kind: 'empty' }
  | { kind: 'length-exceeded'; length: number; limit: 8000 }
  | { kind: 'decompression' }
  | { kind: 'invalid-json' }
  | { kind: 'malformed' }
  | { kind: 'validation'; errors: ValidationError[] };

export function encodeQuiz(quiz: Quiz): Result<string, ShareError> {
  try {
    const hash = compressToEncodedURIComponent(printQuizJson(quiz, { compact: true }));
    if (hash.length > LIMITS.hashMax) {
      return { ok: false, error: { kind: 'length-exceeded', length: hash.length, limit: 8000 } };
    }
    return { ok: true, value: hash };
  } catch {
    return { ok: false, error: { kind: 'malformed' } };
  }
}

export function decodeShareHash(hash: string): Result<Quiz, ShareError> {
  let stage: 'decompression' | 'invalid-json' | 'validation' = 'decompression';
  try {
    if (hash.length === 0) return { ok: false, error: { kind: 'empty' } };
    if (hash.length > LIMITS.hashMax) {
      return { ok: false, error: { kind: 'length-exceeded', length: hash.length, limit: 8000 } };
    }

    const text = decompressFromEncodedURIComponent(hash);
    if (text === null || text === undefined || text === '') {
      return { ok: false, error: { kind: 'decompression' } };
    }

    stage = 'invalid-json';
    const raw: unknown = JSON.parse(text);

    if (
      typeof raw !== 'object' ||
      raw === null ||
      Array.isArray(raw) ||
      typeof (raw as Record<string, unknown>).title !== 'string' ||
      !Array.isArray((raw as Record<string, unknown>).questions)
    ) {
      return { ok: false, error: { kind: 'malformed' } };
    }

    stage = 'validation';
    const errors = validateQuiz(raw);
    if (errors.length > 0) return { ok: false, error: { kind: 'validation', errors } };
    return { ok: true, value: raw as Quiz };
  } catch {
    return { ok: false, error: { kind: stage === 'validation' ? 'malformed' : stage } };
  }
}
