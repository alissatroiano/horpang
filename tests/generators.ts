import fc from 'fast-check';
import { LIMITS } from '../src/engine/limits';
import type { Question, Quiz } from '../src/engine/model';

/** Fragments that stress CSV/JSON/URL codecs: commas, quotes, line breaks, emoji, non-ASCII. */
const SPECIAL_FRAGMENTS = [
  ',',
  '"',
  '""',
  '\n',
  '\r\n',
  ' ',
  '👻',
  '🕯️',
  'é',
  'ñ',
  'ß',
  'Ж',
  '日本語',
  'สวัสดี',
  '{"a":1}',
  '#',
  '&',
  '%',
];

const fragmentArb = fc.oneof(
  { weight: 6, arbitrary: fc.stringMatching(/^[A-Za-z0-9 .?!'-]{1,8}$/) },
  { weight: 3, arbitrary: fc.constantFrom(...SPECIAL_FRAGMENTS) },
);

/** Truncate to at most `max` UTF-16 units without splitting a surrogate pair. */
function truncate(s: string, max: number): string {
  let out = '';
  for (const cp of s) {
    if (out.length + cp.length > max) break;
    out += cp;
  }
  return out;
}

/** Text of 1..max characters that is never whitespace-only. */
export function arbText(max: number): fc.Arbitrary<string> {
  return fc.array(fragmentArb, { minLength: 1, maxLength: 12 }).map((parts) => {
    let t = truncate(parts.join(''), max);
    if (t.trim() === '') t = 'x';
    return t;
  });
}

const optionArb = arbText(LIMITS.optionLenMax);

export const arbQuestion: fc.Arbitrary<Question> = fc
  .record({
    id: fc.stringMatching(/^[a-z0-9_-]{1,20}$/),
    prompt: arbText(LIMITS.promptMax),
    options: fc.array(optionArb, { minLength: LIMITS.optionMin, maxLength: LIMITS.optionMax }),
    explanation: arbText(LIMITS.explanationMax),
    hint: arbText(LIMITS.hintMax),
    concept: arbText(LIMITS.conceptMax),
    pick: fc.nat(),
  })
  .map(({ pick, ...q }) => ({ ...q, correctIndex: pick % q.options.length }));

/** Quiz within LIMITS with unique question ids. */
export const arbQuiz: fc.Arbitrary<Quiz> = fc
  .record({
    title: arbText(LIMITS.titleMax),
    questions: fc.array(arbQuestion, {
      minLength: LIMITS.questionsMin,
      maxLength: LIMITS.questionsMax,
    }),
  })
  .map(({ title, questions }) => ({
    title,
    // Prefix with the position so ids are always unique.
    questions: questions.map((q, i) => ({ ...q, id: `q${i + 1}-${q.id}`.slice(0, 40) })),
  }));

export interface ExpectedError {
  /** 1-based Question position, null = Quiz-level. */
  position: number | null;
  field: string;
}

export interface CorruptQuiz {
  /** Deliberately invalid quiz (untyped, may have missing or wrongly typed fields). */
  value: unknown;
  /** One entry per (position, field) that the Validator must report. */
  expected: ExpectedError[];
}

type Json = Record<string, unknown>;
type Mutation = (q: Json, pos: number, earlierId: string | undefined) => ExpectedError | null;

const nullId: Mutation = (q, pos) => ((q.id = null), { position: pos, field: 'id' });

const questionMutations: Mutation[] = [
  (q, pos) => ((q.prompt = '   \t'), { position: pos, field: 'prompt' }),
  (q, pos) => ((q.prompt = 'p'.repeat(LIMITS.promptMax + 1)), { position: pos, field: 'prompt' }),
  (q, pos) => {
    const opts = [...(q.options as string[])];
    opts[0] = ' ';
    q.options = opts;
    return { position: pos, field: 'options[0]' };
  },
  (q, pos) => {
    const opts = [...(q.options as string[])];
    opts[0] = 'o'.repeat(LIMITS.optionLenMax + 1);
    q.options = opts;
    return { position: pos, field: 'options[0]' };
  },
  (q, pos) => ((q.correctIndex = (q.options as string[]).length), { position: pos, field: 'correctIndex' }),
  (q, pos) => ((q.correctIndex = -1), { position: pos, field: 'correctIndex' }),
  (q, pos) => ((q.correctIndex = 0.5), { position: pos, field: 'correctIndex' }),
  (q, pos) => (delete q.explanation, { position: pos, field: 'explanation' }),
  (q, pos) => ((q.explanation = 'e'.repeat(LIMITS.explanationMax + 1)), { position: pos, field: 'explanation' }),
  (q, pos) => ((q.hint = ''), { position: pos, field: 'hint' }),
  (q, pos) => ((q.hint = 'h'.repeat(LIMITS.hintMax + 1)), { position: pos, field: 'hint' }),
  (q, pos) => ((q.concept = 42), { position: pos, field: 'concept' }),
  (q, pos) => ((q.concept = 'c'.repeat(LIMITS.conceptMax + 1)), { position: pos, field: 'concept' }),
  nullId,
];

const duplicateId: Mutation = (q, pos, earlierId) =>
  earlierId === undefined ? null : ((q.id = earlierId), { position: pos, field: 'id' });

/**
 * Picks a subset of questions and a mutation for each, plus optionally a bad title.
 * At most one mutation per question, so the expected errors are exact.
 */
export function arbCorrupt(quiz: Quiz): fc.Arbitrary<CorruptQuiz> {
  const n = quiz.questions.length;
  return fc
    .record({
      titleBad: fc.option(fc.constantFrom<unknown>('', '   ', 't'.repeat(LIMITS.titleMax + 1), 7, null), {
        nil: undefined,
      }),
      picks: fc.array(
        fc.record({ index: fc.nat({ max: n - 1 }), mutation: fc.nat({ max: questionMutations.length }) }),
        { minLength: 0, maxLength: n },
      ),
    })
    .filter(({ titleBad, picks }) => titleBad !== undefined || picks.length > 0)
    .map(({ titleBad, picks }) => {
      const value: Json = JSON.parse(JSON.stringify(quiz));
      const questions = value.questions as Json[];
      const expected: ExpectedError[] = [];
      const touched = new Set<number>();
      if (titleBad !== undefined) {
        value.title = titleBad;
        expected.push({ position: null, field: 'title' });
      }
      for (const { index, mutation } of picks) {
        if (touched.has(index)) continue;
        touched.add(index);
        const m = mutation >= questionMutations.length ? duplicateId : questionMutations[mutation] ?? duplicateId;
        const target = questions[index];
        if (!target) continue;
        const earlierId = index > 0 ? quiz.questions[0]?.id : undefined;
        // Question 1's id is the duplicate target, so it must stay intact.
        if (index === 0 && m === nullId) continue;
        const err = m(target, index + 1, earlierId);
        if (err) expected.push(err);
      }
      return { value, expected };
    })
    .filter(({ expected }) => expected.length > 0);
}

/** Arbitrary JSON-like value of any shape, for malformed-input tests. */
export const arbJsonValue: fc.Arbitrary<unknown> = fc.jsonValue({ maxDepth: 4 });
