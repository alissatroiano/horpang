import type { Quiz } from '../engine/model';

export interface ScoreState {
  score: number;
  streak: number;
  /** Integer 0..100. */
  battery: number;
  total: number;
  solved: Record<string, true>;
  firstTryCorrect: Record<string, true>;
  attempted: Record<string, true>;
  /** Unique, ordered by first referencing question position. */
  missedConcepts: string[];
  /** Disabled options per question. */
  wrongOptions: Record<string, number[]>;
}

export type ScoreAction =
  | { type: 'ANSWER_CORRECT'; questionId: string }
  | { type: 'ANSWER_WRONG'; questionId: string; optionIndex: number }
  | { type: 'RESET' };

export const BATTERY_MAX = 100;
const BATTERY_GAIN = 20;
const BATTERY_LOSS = 15;

export const initialScore = (total: number): ScoreState => ({
  score: 0,
  streak: 0,
  battery: BATTERY_MAX,
  total,
  solved: {},
  firstTryCorrect: {},
  attempted: {},
  missedConcepts: [],
  wrongOptions: {},
});

export const multiplier = (streak: number): number => Math.min(streak + 1, 5);

export const banishedCount = (s: ScoreState): number => Object.keys(s.solved).length;

export function reduce(s: ScoreState, a: ScoreAction, quiz: Quiz): ScoreState {
  switch (a.type) {
    case 'RESET':
      return initialScore(s.total);

    case 'ANSWER_CORRECT': {
      const q = quiz.questions.find((x) => x.id === a.questionId);
      if (!q || s.solved[a.questionId]) return s;
      return {
        ...s,
        score: s.score + 100 * multiplier(s.streak),
        streak: s.streak + 1,
        battery: Math.min(BATTERY_MAX, s.battery + BATTERY_GAIN),
        solved: { ...s.solved, [a.questionId]: true },
        firstTryCorrect: s.attempted[a.questionId]
          ? s.firstTryCorrect
          : { ...s.firstTryCorrect, [a.questionId]: true },
      };
    }

    case 'ANSWER_WRONG': {
      const q = quiz.questions.find((x) => x.id === a.questionId);
      if (!q || s.solved[a.questionId]) return s;
      const disabled = s.wrongOptions[a.questionId] ?? [];
      if (disabled.includes(a.optionIndex)) return s;

      let missedConcepts = s.missedConcepts;
      if (!missedConcepts.includes(q.concept)) {
        const position = (concept: string): number =>
          quiz.questions.findIndex((x) => x.concept === concept);
        missedConcepts = [...missedConcepts, q.concept].sort(
          (x, y) => position(x) - position(y),
        );
      }

      return {
        ...s,
        streak: 0,
        battery: Math.max(0, s.battery - BATTERY_LOSS),
        attempted: { ...s.attempted, [a.questionId]: true },
        wrongOptions: {
          ...s.wrongOptions,
          [a.questionId]: [...disabled, a.optionIndex],
        },
        missedConcepts,
      };
    }
  }
}
