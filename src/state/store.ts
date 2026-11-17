import type { Quiz } from '../engine/model';
import { banishedCount, initialScore, reduce, type ScoreAction, type ScoreState } from '../game/scoreEngine';
import { nextStage, type StageEvent, type StageId } from '../game/stageMachine';

export interface GameState {
  stage: StageId;
  quiz: Quiz;
  score: ScoreState;
}

export type GameAction = ScoreAction | StageEvent;

const isScoreAction = (a: GameAction): a is ScoreAction =>
  a.type === 'ANSWER_CORRECT' || a.type === 'ANSWER_WRONG' || a.type === 'RESET';

/**
 * One-way store: dispatch(action) -> reducer / nextStage -> state -> listeners.
 * Score and stage live in one state object so HUD and footer read the same score.
 */
export class GameStore {
  private state: GameState;
  private readonly listeners = new Set<(s: GameState) => void>();

  constructor(quiz: Quiz, stage: StageId = 'boot') {
    this.state = { stage, quiz, score: initialScore(quiz.questions.length) };
  }

  getState(): GameState {
    return this.state;
  }

  dispatch(action: GameAction): void {
    const prev = this.state;
    let { stage, score } = prev;

    if (isScoreAction(action)) {
      score = reduce(score, action, prev.quiz);
      stage = nextStage(stage, {
        type: 'SCORE_UPDATED',
        solved: banishedCount(score),
        total: score.total,
      });
    } else {
      stage = nextStage(stage, action);
      if (action.type === 'PLAY_AGAIN' && stage !== prev.stage) {
        score = reduce(score, { type: 'RESET' }, prev.quiz);
      }
    }

    if (stage === prev.stage && score === prev.score) return;
    this.state = { ...prev, stage, score };
    for (const fn of [...this.listeners]) fn(this.state);
  }

  subscribe(fn: (s: GameState) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}
