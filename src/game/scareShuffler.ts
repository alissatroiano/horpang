import type { Rng } from './rng';

export const SCARES = ['endoskeleton', 'horpang', 'crt', 'glass'] as const;
export type ScareId = (typeof SCARES)[number];

/** Clamp a random value into [0, 1); non-finite values map to 0. */
function clampUnit(x: number): number {
  if (!Number.isFinite(x) || x < 0) return 0;
  return x >= 1 ? 1 - Number.EPSILON : x;
}

/**
 * Pick the next scare. With no previous scare, uniform over all four.
 * Otherwise uniform over the three that differ from `previous`.
 */
export function nextScare(previous: ScareId | null, rng: Rng): ScareId {
  const pool = previous === null ? SCARES : SCARES.filter((s) => s !== previous);
  const index = Math.min(pool.length - 1, Math.floor(clampUnit(rng()) * pool.length));
  return pool[index] as ScareId;
}
