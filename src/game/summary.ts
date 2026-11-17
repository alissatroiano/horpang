import type { Quiz, Result } from '../engine/model';
import type { ScoreState } from './scoreEngine';

export interface SummaryData {
  score: number;
  maxScore: number;
  accuracyPercent: number;
  missedConcepts: string[];
}

/** Score of a perfect run: sum_{i=0}^{total-1} 100 * min(i + 1, 5). */
export function maxPossibleScore(total: number): number {
  let sum = 0;
  for (let i = 0; i < total; i++) sum += 100 * Math.min(i + 1, 5);
  return sum;
}

/** Percentage of first-try-correct answers, rounded half up. total = 0 gives 0. */
export function accuracyPercent(firstTry: number, total: number): number {
  if (!(total > 0)) return 0;
  const pct = Math.floor((100 * firstTry) / total + 0.5);
  return Math.max(0, Math.min(100, pct));
}

export function buildSummary(s: ScoreState, quiz: Quiz): Result<SummaryData, 'unavailable'> {
  try {
    const total = quiz.questions.length;
    const firstTry = Object.keys(s.firstTryCorrect).length;
    const data: SummaryData = {
      score: s.score,
      maxScore: maxPossibleScore(total),
      accuracyPercent: accuracyPercent(firstTry, total),
      missedConcepts: [...s.missedConcepts],
    };
    if (!Number.isFinite(data.score)) return { ok: false, error: 'unavailable' };
    return { ok: true, value: data };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}
