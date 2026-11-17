import fc from 'fast-check';
import type { Quiz } from '../../src/engine/model';
import type { ScoreAction } from '../../src/game/scoreEngine';

/**
 * Sequences of score actions for a quiz. Mixes ANSWER_CORRECT, ANSWER_WRONG and RESET,
 * uses known and unknown question ids, and repeats answers freely
 * (including out-of-range and negative option indexes).
 */
export function arbScoreActions(quiz: Quiz, maxLength = 60): fc.Arbitrary<ScoreAction[]> {
  const ids = quiz.questions.map((q) => q.id);
  const questionId = fc.oneof(
    { weight: 9, arbitrary: fc.constantFrom(...ids) },
    { weight: 1, arbitrary: fc.constant('unknown-id') },
  );
  const action: fc.Arbitrary<ScoreAction> = fc.oneof(
    { weight: 5, arbitrary: questionId.map((id): ScoreAction => ({ type: 'ANSWER_CORRECT', questionId: id })) },
    {
      weight: 5,
      arbitrary: fc
        .record({ id: questionId, optionIndex: fc.integer({ min: -1, max: 6 }) })
        .map(({ id, optionIndex }): ScoreAction => ({ type: 'ANSWER_WRONG', questionId: id, optionIndex })),
    },
    { weight: 1, arbitrary: fc.constant<ScoreAction>({ type: 'RESET' }) },
  );
  return fc.array(action, { minLength: 0, maxLength });
}
