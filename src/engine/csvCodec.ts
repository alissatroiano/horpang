import type { CodecError } from './jsonCodec';
import { LIMITS } from './limits';
import type { Quiz, Result } from './model';
import { validateQuiz } from './validator';

export const CSV_HEADER = [
  'id',
  'prompt',
  'options',
  'correctIndex',
  'explanation',
  'hint',
  'concept',
] as const;

const DEFAULT_TITLE = 'Imported Quiz';

interface CsvRecord {
  fields: string[];
  /** True for a blank line (a single empty unquoted field). */
  blank: boolean;
}

type ScanResult =
  | { ok: true; records: CsvRecord[] }
  | { ok: false; row: number };

type State = 'start' | 'unquoted' | 'quoted' | 'quoteInQuoted';

/**
 * State-machine scanner. Accepts \r\n and \n line endings. A trailing newline does not
 * create an extra record. Rows are numbered by record (1-based), not by physical line.
 */
function scan(text: string): ScanResult {
  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let field = '';
  let state: State = 'start';
  let sawQuote = false;
  let quoteRow = 1;
  let hasContent = false;

  const endField = (): void => {
    fields.push(field);
    field = '';
  };
  const endRecord = (): void => {
    endField();
    records.push({ fields, blank: fields.length === 1 && fields[0] === '' && !sawQuote });
    fields = [];
    state = 'start';
    sawQuote = false;
    hasContent = false;
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    switch (state) {
      case 'start':
        hasContent = true;
        if (c === '"') {
          state = 'quoted';
          sawQuote = true;
          quoteRow = records.length + 1;
        } else if (c === ',') {
          endField();
        } else if (c === '\n') {
          hasContent = false;
          endRecord();
        } else if (c === '\r' && text[i + 1] === '\n') {
          // consumed with the following \n
        } else {
          field += c;
          state = 'unquoted';
        }
        break;
      case 'unquoted':
        if (c === ',') {
          endField();
          state = 'start';
        } else if (c === '\n') {
          endRecord();
        } else if (c === '\r' && text[i + 1] === '\n') {
          // consumed with the following \n
        } else {
          field += c;
        }
        break;
      case 'quoted':
        if (c === '"') state = 'quoteInQuoted';
        else field += c;
        break;
      case 'quoteInQuoted':
        if (c === '"') {
          field += '"';
          state = 'quoted';
        } else if (c === ',') {
          endField();
          state = 'start';
        } else if (c === '\n') {
          endRecord();
        } else if (c === '\r' && text[i + 1] === '\n') {
          state = 'unquoted';
        } else {
          // Lenient: stray text after a closing quote is kept as part of the field.
          field += c;
          state = 'unquoted';
        }
        break;
    }
  }

  if (state === 'quoted') return { ok: false, row: quoteRow };
  if (hasContent || state !== 'start') endRecord();
  return { ok: true, records };
}

function cellToValue(column: string, raw: string | undefined): unknown {
  if (raw === undefined) return undefined;
  if (column === 'options') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (column === 'correctIndex') {
    const t = raw.trim();
    return /^-?\d+$/.test(t) ? Number(t) : raw;
  }
  return raw;
}

export function parseQuizCsv(text: string, title: string = DEFAULT_TITLE): Result<Quiz, CodecError[]> {
  try {
    const bytes = new TextEncoder().encode(text).length;
    if (bytes > LIMITS.fileMaxBytes) {
      return { ok: false, error: [{ kind: 'too-large', bytes, limit: LIMITS.fileMaxBytes }] };
    }
    if (text.trim().length === 0) return { ok: false, error: [{ kind: 'empty' }] };

    const scanned = scan(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
    if (!scanned.ok) {
      return { ok: false, error: [{ kind: 'csv-unterminated-quote', row: scanned.row }] };
    }

    const records = scanned.records.filter((r, i) => i === 0 || !r.blank);
    const header = (records[0]?.fields ?? []).map((h) => h.trim());
    const missing = CSV_HEADER.filter((name) => !header.includes(name));
    if (missing.length > 0) {
      return {
        ok: false,
        error: missing.map((column) => ({ kind: 'csv-missing-column' as const, column, row: 1 })),
      };
    }

    const questions = records.slice(1).map((rec) => {
      const q: Record<string, unknown> = {};
      for (const column of CSV_HEADER) {
        q[column] = cellToValue(column, rec.fields[header.indexOf(column)]);
      }
      return q;
    });

    const candidate = { title, questions };
    const errors = validateQuiz(candidate);
    if (errors.length > 0) {
      // Question position p sits on row p + 1 because the header is row 1.
      const mapped = errors.map((e) => ({
        ...e,
        position: e.position === null ? null : e.position + 1,
      }));
      return { ok: false, error: [{ kind: 'validation', errors: mapped }] };
    }
    return { ok: true, value: candidate as unknown as Quiz };
  } catch {
    return {
      ok: false,
      error: [{ kind: 'syntax', message: 'could not be parsed', line: 1, column: 1 }],
    };
  }
}

function printField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Prints the header and one row per Question. The title is not part of the CSV format. */
export function printQuizCsv(quiz: Quiz): string {
  const lines: string[] = [CSV_HEADER.join(',')];
  for (const q of quiz.questions) {
    lines.push(
      [
        q.id,
        q.prompt,
        JSON.stringify(q.options),
        String(q.correctIndex),
        q.explanation,
        q.hint,
        q.concept,
      ]
        .map(printField)
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}
