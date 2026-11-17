import { describe, expect, it } from 'vitest';
import { parseQuizJson } from '../../src/engine/jsonCodec';
import { LIMITS } from '../../src/engine/limits';

describe('JSON_Codec parseQuizJson', () => {
  it('reports a syntax error with 1-based line and column (Req 3.2)', () => {
    const result = parseQuizJson('{\n  "title": "x",\n  oops\n}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = result.error[0]!;
      expect(err.kind).toBe('syntax');
      if (err.kind === 'syntax') {
        expect(err.line).toBe(3);
        expect(err.column).toBeGreaterThanOrEqual(1);
        expect(err.message.length).toBeGreaterThan(0);
      }
    }
  });

  it('rejects empty and whitespace-only text (Req 3.3)', () => {
    for (const text of ['', '   ', '\n\t \r\n']) {
      const result = parseQuizJson(text);
      expect(result).toEqual({ ok: false, error: [{ kind: 'empty' }] });
    }
  });

  it('rejects text over the size limit before parsing (Req 3.6)', () => {
    // Not valid JSON: a too-large result proves parsing was never attempted.
    const text = 'x'.repeat(LIMITS.fileMaxBytes + 1);
    const result = parseQuizJson(text);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toHaveLength(1);
      const err = result.error[0]!;
      expect(err.kind).toBe('too-large');
      if (err.kind === 'too-large') {
        expect(err.bytes).toBe(LIMITS.fileMaxBytes + 1);
        expect(err.limit).toBe(LIMITS.fileMaxBytes);
      }
    }
  });

  it('passes the validator error list through unchanged (Req 3.7)', () => {
    const result = parseQuizJson('{"title":"","questions":[]}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toHaveLength(1);
      const err = result.error[0]!;
      expect(err.kind).toBe('validation');
      if (err.kind === 'validation') expect(err.errors.length).toBeGreaterThan(0);
    }
  });
});
