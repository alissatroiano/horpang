import type { Quiz, Result, ValidationError } from './model';
import { validateQuiz } from './validator';

export const DEFAULT_QUIZ: Quiz = {
  title: 'Horpang Sample Quiz: Web Basics',
  questions: [
    {
      id: 'q1',
      prompt: 'Which HTML element holds the main heading of a page?',
      options: ['<h1>', '<head>', '<header>', '<title>'],
      correctIndex: 0,
      explanation: '<h1> marks the top-level heading. <title> sets the browser tab text and <head> holds metadata.',
      hint: 'It is the largest heading level.',
      concept: 'HTML headings',
    },
    {
      id: 'q2',
      prompt: 'Which CSS property changes the text color of an element?',
      options: ['font-color', 'color', 'text-style', 'foreground'],
      correctIndex: 1,
      explanation: 'The `color` property sets the foreground text color. `font-color` does not exist.',
      hint: 'The property name is a single, short word.',
      concept: 'CSS basics',
    },
    {
      id: 'q3',
      prompt: 'What does `typeof null` return in JavaScript?',
      options: ['"null"', '"undefined"', '"object"', '"number"'],
      correctIndex: 2,
      explanation: 'It returns "object". This is a long-standing quirk of the language.',
      hint: 'It is a historical bug that was never fixed.',
      concept: 'JavaScript types',
    },
    {
      id: 'q4',
      prompt: 'Which HTTP status code means "Not Found"?',
      options: ['200', '301', '403', '404'],
      correctIndex: 3,
      explanation: '404 means the server cannot find the requested resource. 403 means access is forbidden.',
      hint: 'You see it when a link is broken.',
      concept: 'HTTP status codes',
    },
    {
      id: 'q5',
      prompt: 'Which keyword declares a block-scoped variable that cannot be reassigned?',
      options: ['const', 'var', 'let', 'static'],
      correctIndex: 0,
      explanation: '`const` is block-scoped and cannot be reassigned. `let` is block-scoped but can be reassigned.',
      hint: 'The name suggests the value stays constant.',
      concept: 'JavaScript variables',
    },
    {
      id: 'q6',
      prompt: 'What does CSS stand for?',
      options: [
        'Computer Style Sheets',
        'Cascading Style Sheets',
        'Creative Style Syntax',
        'Colorful Style Sheets',
      ],
      correctIndex: 1,
      explanation: 'CSS stands for Cascading Style Sheets. Styles cascade by specificity and source order.',
      hint: 'The first word describes how rules flow downward.',
      concept: 'CSS basics',
    },
    {
      id: 'q7',
      prompt: 'Which array method returns a new array of the items that pass a test?',
      options: ['map', 'forEach', 'filter', 'reduce'],
      correctIndex: 2,
      explanation: '`filter` keeps only the items for which the callback returns true. `map` transforms every item.',
      hint: 'Think of a sieve that keeps only some items.',
      concept: 'JavaScript arrays',
    },
    {
      id: 'q8',
      prompt: 'Which attribute gives an image a text description for screen readers?',
      options: ['title', 'src', 'alt', 'name'],
      correctIndex: 2,
      explanation: 'The `alt` attribute supplies alternative text that screen readers announce and browsers show if the image fails.',
      hint: 'It is short for "alternative".',
      concept: 'Accessibility',
    },
  ],
};

/** Validates the built-in quiz before handing it out. */
export function loadDefaultQuiz(): Result<Quiz, ValidationError[]> {
  const errors = validateQuiz(DEFAULT_QUIZ);
  if (errors.length > 0) return { ok: false, error: errors };
  return { ok: true, value: DEFAULT_QUIZ };
}
