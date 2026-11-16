export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  concept: string;
}

export interface Quiz {
  title: string;
  questions: Question[];
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface ValidationError {
  /** 1-based Question position, null = Quiz-level. */
  position: number | null;
  /** 'title', 'questions', 'id', 'prompt', 'options', 'options[2]', 'correctIndex', ... */
  field: string;
  message: string;
}
