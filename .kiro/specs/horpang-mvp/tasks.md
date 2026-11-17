# Implementation Plan: Horpang MVP

## Overview

The implementation language is TypeScript (strict), as used in the design. Work proceeds in this order:

1. Area A (Quiz Data and URL-Sharing Engine) as pure, DOM-free modules in `src/engine/`, with a minimal toolchain (TypeScript, Vitest, fast-check, lz-string) so it can be tested from the start.
2. Vite and Tailwind scaffolding for the browser app.
3. Area B pure modules in `src/game/` and `src/state/` (Score_Engine, Guidance_Controller, Scare_Shuffler, stage state machine, summary formulas, flashlight geometry, Lantern_Store).
4. Area B rendering in `src/ui/` and `src/audio/` (Title, Audio_Engine, Scare_Renderer, Gallery, Corridor, Summary, Grimoire).
5. Integration wiring in `main.ts`, error handling, and accessibility and asset checks.

Stage order is Title -> Gallery -> Corridor -> Summary. Every rendering module is wired to the pure modules it depends on within its own task, so no code is left orphaned.

## Tasks

- [x] 1. Minimal toolchain for Area A
  - [x] 1.1 Create the TypeScript and Vitest baseline
    - Create `package.json` with dependencies `lz-string`, and dev dependencies `typescript`, `vitest`, `fast-check`, `@types/lz-string` (if needed)
    - Create `tsconfig.json` with `"strict": true` and `"noUncheckedIndexedAccess": true`
    - Create `vitest.config.ts` (environment `node`) and add `test` script using `vitest --run`
    - Create the folders `src/engine`, `tests/engine`
    - _Requirements: 1.8, 5.1_

- [x] 2. Question model, Validator and Default_Quiz
  - [x] 2.1 Create the question model and limits
    - Create `src/engine/model.ts` with `Question`, `Quiz`, `Result<T, E>`, `ValidationError`
    - Create `src/engine/limits.ts` with the `LIMITS` constants (prompt, options, explanation, hint, concept, question count, title, file size 1,048,576, hash 8000)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Implement the Validator
    - Create `src/engine/validator.ts` with `validateQuestion`, `validateQuiz`, `isValidQuiz`, accepting `unknown`
    - Type-check each field first, then apply length, whitespace-only, option count and `correctIndex` integer-range rules
    - Return one error per failing field with 1-based position (or `null` for Quiz-level) and field name; flag each later duplicate id
    - Never mutate input and never throw
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 2.3 Create shared fast-check generators
    - Create `tests/generators.ts` with `arbQuestion`, `arbQuiz` (within `LIMITS`, unique ids, strings containing commas, quotes, `\n`, `\r\n`, emoji and non-ASCII), `arbCorrupt(quiz)` and `arbJsonValue`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.4 Write property test for Validator acceptance
    - **Property 1: Validator accepts every well-formed quiz**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

  - [x] 2.5 Write property test for one error per failing field
    - **Property 2: Validator reports one error per failing field and does not mutate**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

  - [x] 2.6 Write property test for duplicate ids
    - **Property 3: Duplicate ids produce one error per later duplicate**
    - **Validates: Requirements 1.7**

  - [x] 2.7 Write property test for Validator totality
    - **Property 4: Validator is total**
    - **Validates: Requirements 1.8**

  - [x] 2.8 Implement the Default_Quiz
    - Create `src/engine/defaultQuiz.ts` exporting `DEFAULT_QUIZ` (8 questions) and `loadDefaultQuiz()` that validates before returning
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 2.9 Write unit tests for the Default_Quiz
    - Assert 5 to 20 questions, zero validation errors, and that an injected invalid default yields an error result
    - _Requirements: 2.1, 2.2, 2.5_

- [ ] 3. Codecs and hash loading
  - [x] 3.1 Implement the JSON_Codec
    - Create `src/engine/jsonCodec.ts` with `CodecError`, `parseQuizJson`, `printQuizJson`
    - Check UTF-8 byte size first, then empty text, then `JSON.parse` with line and column location, then the Validator
    - Print with fixed key order and 2-space indentation; copy only known keys when parsing
    - Provide a compact print option for the Share_Codec
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

  - [x] 3.2 Write property test for the JSON round trip
    - **Property 5: JSON round trip**
    - **Validates: Requirements 3.4, 3.5**

  - [x] 3.3 Write unit tests for the JSON_Codec
    - Cover syntax error line and column, empty and whitespace-only text, over 1 MB rejection before parsing, validation error list passthrough
    - _Requirements: 3.2, 3.3, 3.6, 3.7_

  - [x] 3.4 Implement the CSV_Codec
    - Create `src/engine/csvCodec.ts` with `CSV_HEADER`, `parseQuizCsv(text, title?)`, `printQuizCsv`
    - Use a state-machine parser (field start, unquoted, quoted, quote-in-quoted), accept `\r\n` and `\n`, store `options` as a JSON array string
    - Return per-column missing errors (row 1), unterminated-quote row, and Validator errors mapped to row `position + 1`; check size before parsing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.9_

  - [ ] 3.5 Write property test for the CSV round trip
    - **Property 6: CSV round trip**
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.8**

  - [ ] 3.6 Write unit tests for the CSV_Codec
    - Cover missing columns, unterminated quote row, row mapping of validation errors, quoting of commas, quotes and line breaks, over 1 MB rejection
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.9_

  - [x] 3.7 Implement the Share_Codec
    - Create `src/engine/shareCodec.ts` with `ShareError`, `encodeQuiz`, `decodeShareHash` using `compressToEncodedURIComponent` and `decompressFromEncodedURIComponent`
    - Treat `null` and `""` from decompression as failure; return `length-exceeded` with the actual length and no hash when over 8000
    - Wrap in `try/catch` so it never throws; skip the Validator for `empty` and `malformed`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 6.3_

  - [ ] 3.8 Write property test for share round trip, URL safety and size
    - **Property 7: Share hash round trip, URL safety and size**
    - **Validates: Requirements 5.1, 5.2, 5.5**

  - [ ] 3.9 Write property test for share determinism
    - **Property 8: Share encoding is deterministic**
    - **Validates: Requirements 5.6, 5.7**

  - [ ] 3.10 Write property test for share decode totality
    - **Property 9: Share decoding never throws and classifies failures**
    - **Validates: Requirements 5.3, 5.4, 6.3**

  - [ ] 3.11 Implement hash loading and the engine barrel
    - Create `src/engine/loadQuiz.ts` with `resolveInitialQuiz(fragment)`: strip leading `#`, empty -> Default_Quiz, over 8000 -> Default_Quiz plus `too-long` notice, decode failure -> Default_Quiz plus `bad-link` notice, invalid default -> error result
    - Create `src/engine/index.ts` exporting the public API (types, `validateQuiz`, codecs, `resolveInitialQuiz`, `LIMITS`)
    - _Requirements: 2.3, 2.4, 2.5, 5.8, 5.9, 6.1, 6.2_

  - [ ] 3.12 Write property test for initial quiz resolution
    - **Property 10: Initial quiz resolution always yields a playable quiz**
    - **Validates: Requirements 2.4, 5.8, 5.9, 6.1, 6.2**

- [ ] 4. Checkpoint - Area A complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Browser app scaffolding
  - [x] 5.1 Add Vite, Tailwind and the app shell
    - Add `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `jsdom` and scripts (`dev`, `build`, `test`) to `package.json`
    - Create `vite.config.ts` (with Vitest config; `node` environment by default, `jsdom` per-file for UI tests) and remove `vitest.config.ts`
    - Create `tailwind.config.ts` with palette tokens (black, bone `#e8e4d8`, crimson, exit-green `#39ff14`, grays), `src/styles/index.css` with Tailwind layers and base keyframes (drip, pulse, shake)
    - Create `index.html` with the Google Fonts `<link>` (the only external resource), `#app` root, and live regions; create a placeholder `src/main.ts`
    - Add `prefers-reduced-motion` safeguard CSS and the focus ring style (`3px solid #e8e4d8`, 3px offset)
    - _Requirements: 20.2, 20.3, 20.4, 19.7, 19.10_

- [x] 6. Area B pure modules
  - [x] 6.1 Implement Rng and Scare_Shuffler
    - Create `src/game/rng.ts` with `Rng` and `mulberry32`
    - Create `src/game/scareShuffler.ts` with `SCARES`, `ScareId`, `nextScare(previous, rng)` (uniform over four when `previous` is null, otherwise uniform over the other three, rng clamped to `[0, 1)`)
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 6.2 Write property test for the Scare_Shuffler
    - **Property 18: Shuffler never repeats back to back and covers all scares**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4**

  - [x] 6.3 Implement the Score_Engine reducer
    - Create `src/game/scoreEngine.ts` with `ScoreState`, `ScoreAction`, `initialScore`, `multiplier`, `banishedCount`, `reduce`
    - Correct: `+100 * multiplier(streak before)`, streak +1, battery `min(100, +20)`, mark solved, record first-try; no change if solved or unknown
    - Wrong: streak 0, battery `max(0, -15)`, record attempt, disabled option, concept once ordered by first referencing question position; no change if solved or option already disabled
    - `RESET` returns `initialScore(total)`; never mutate input
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.7, 13.8, 14.2, 14.3, 14.9, 16.7_

  - [x] 6.4 Write property test for correct-answer scoring
    - Create `tests/game/generators.ts` with `arbScoreActions(quiz)`
    - **Property 15: Correct answers score by the prior multiplier**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.8**

  - [x] 6.5 Write property test for wrong-answer handling
    - **Property 16: Wrong answers penalize and record concepts once**
    - **Validates: Requirements 14.2, 14.3, 14.9**

  - [x] 6.6 Write property test for score invariants
    - **Property 17: Score state invariants hold after every action**
    - **Validates: Requirements 13.7**

  - [x] 6.7 Write property test for missed concept ordering
    - **Property 20: Missed concepts are unique and ordered by first reference**
    - **Validates: Requirements 14.3, 16.5**

  - [x] 6.8 Write property test for reset
    - **Property 21: Reset returns to the initial state**
    - **Validates: Requirements 16.7**

  - [x] 6.9 Implement summary formulas
    - Create `src/game/summary.ts` with `maxPossibleScore`, `accuracyPercent` (round half up, `total = 0` -> 0), `buildSummary` returning `Result<SummaryData, 'unavailable'>`
    - _Requirements: 16.3, 16.4, 16.5, 16.6, 16.9_

  - [x] 6.10 Write property test for summary values
    - **Property 19: Summary values follow the formulas**
    - **Validates: Requirements 16.3, 16.4**

  - [x] 6.11 Implement the Guidance_Controller
    - Create `src/game/guidance.ts` with `GuideState`, `GUIDE_TABLE` (7 non-empty messages, first one "Inspect a cursed photograph to uncover its question...", all-solved mentions corridor and EXIT door), `deriveGuideState` with the specified priority, and `guideText` that keeps the current text for unknown states
    - _Requirements: 11.1, 11.2, 11.3, 11.7_

  - [x] 6.12 Write property test for guidance
    - **Property 14: Guidance is total, deterministic and non-empty**
    - **Validates: Requirements 11.2, 11.3, 11.7**

  - [x] 6.13 Implement the stage state machine
    - Create `src/game/stageMachine.ts` with `StageId`, `StageEvent`, `nextStage`
    - `ENTER_GALLERY` ignored while `grimoireOpen`; `gallery -> corridor` only when `total > 0 && solved === total`; `EXIT_ACTIVATED` valid only in `corridor`; `PLAY_AGAIN` returns to `gallery`; other pairs return the current stage
    - _Requirements: 7.11, 7.14, 8.1, 8.10, 16.1, 16.2, 16.7_

  - [x] 6.14 Write property test for stage transitions
    - **Property 11: Corridor is entered only when every question is solved**
    - **Validates: Requirements 7.14, 8.1, 16.1, 16.2**

  - [x] 6.15 Implement flashlight geometry
    - Create `src/game/flashlight.ts` with `maskSize` (200vw by 200vh), `maskTranslate` (`pointer - mask/2`), `lanternRadius` (base x 1.5)
    - _Requirements: 8.3, 8.4, 8.5, 8.12_

  - [x] 6.16 Write property test for flashlight centering
    - **Property 12: Flashlight is centered on the pointer**
    - **Validates: Requirements 8.3, 8.4, 8.5**

  - [x] 6.17 Implement the Lantern_Store
    - Create `src/state/lanternStore.ts` with `parseLantern`, `LanternStore` (key `horpang.lantern`, values `on` and `off`, in-memory fallback on storage errors, reduced-motion default, `subscribe`)
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.9_

  - [x] 6.18 Write property test for Lantern setting
    - **Property 23: Lantern setting parsing and persistence**
    - **Validates: Requirements 19.1, 19.3, 19.4, 19.9**

  - [x] 6.19 Implement the contrast helper
    - Create `src/game/contrast.ts` with `contrastRatio(fg, bg)` using WCAG relative luminance
    - _Requirements: 12.2, 17.15, 19.10_

  - [x] 6.20 Write unit tests for contrast
    - Assert `#e8e4d8` on `#000000` is at least 4.5 and the focus ring color is at least 3
    - _Requirements: 12.2, 17.15, 19.10_

- [ ] 7. Checkpoint - Area B pure modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. App state and stage host
  - [x] 8.1 Implement the store, stage host and UI helpers
    - Create `src/state/store.ts` (`GameStore` with `GameState`, `dispatch`, `subscribe`, uses `reduce` and `nextStage`)
    - Create `src/ui/stageHost.ts` (`Stage` interface with `mount` and `destroy`, `StageHost.go`, catches `mount` errors and shows an in-theme message with a reload button), `src/ui/dom.ts`, `src/ui/focusTrap.ts`, `src/ui/liveRegion.ts`
    - _Requirements: 7.9, 9.2, 9.6, 12.3_

  - [-] 8.2 Write unit tests for the focus trap and StageHost
    - Cover Tab and Shift+Tab wrap, `destroy()` called on stage change, mount failure fallback
    - _Requirements: 12.3, 7.9_

- [ ] 9. Title stage
  - [ ] 9.1 Implement the Blood_Canvas effect
    - Create `src/ui/title/BloodDrip.ts` (vertices with random radius multiplier 0.7 to 1.3, growth delay and speed, splatter droplets revealed by distance band) and `src/ui/title/BloodPoolEffect.ts` (offscreen canvas, `#8b0000` to `#320000` gradient with `source-atop`, at least 6 ring pools one per 50 to 200 ms, center pool at 1000 +/- 200 ms, resize redraw within 200 ms, `start`, `stop`, `destroy`, `setLantern`, `isTitleRevealed`)
    - Lantern mode: half the pools (minimum 3), speed x0.5, no droplets
    - Store `setTimeout` handles and the rAF id so `stop()` cancels them within 100 ms; use `AbortController` for the resize listener
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8, 7.9, 7.15_

  - [ ] 9.2 Implement the TitleStage
    - Create `src/ui/title/TitleStage.ts`: `#000` container, canvas, HORPANG `h1` in Road Rage with fallback stack, reveal within 4 s, JS-driven prompt pulse (0.4 to 1.0 over 2 s; 0.7 to 1.0 over 4 s in Lantern mode), corner "Grimoire" button, mute control
    - Click anywhere outside the corner button, or Enter, dispatches `ENTER_GALLERY` unless the Grimoire is open; the corner button opens the Grimoire without leaving the Title; the first gesture calls `audio.unlockOnGesture()`
    - _Requirements: 7.1, 7.6, 7.7, 7.10, 7.11, 7.12, 7.13, 7.14, 7.16, 18.2, 18.7_

  - [ ] 9.3 Write unit tests for the Blood_Canvas and TitleStage
    - Use fake rAF and timers and a seeded RNG: ring count, spawn interval, center pool timing, `stop()` cancels handles, `destroy()` removes the resize listener; in jsdom check click and Enter handling with the Grimoire open and closed
    - _Requirements: 7.2, 7.4, 7.9, 7.11, 7.13, 7.14, 7.15_

- [ ] 10. Audio_Engine
  - [ ] 10.1 Implement the Audio_Engine
    - Create `src/audio/stings.ts` with `clampMaster` (max 0.5) and `stingPlan(lantern)` as pure data (sub-bass sine 110 to 30 Hz, screech oscillators at 1480 and 2093 Hz, noise burst, total 1.0 to 2.0 s; Lantern tone 220 Hz, 0.4 s, peak 0.12)
    - Create `src/audio/audioEngine.ts` with `AudioLike`, `AudioEngine` (`unlockOnGesture`, `setStageAmbience`, `playSting`, `playSoftTone`, `setMuted`, `isSupported`), master gain cap, continuous drone for Gallery and Corridor, silence on Title and Summary, inert engine when unsupported
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9_

  - [ ] 10.2 Write property test for master gain cap
    - **Property 22: Master gain never exceeds the cap**
    - **Validates: Requirements 18.4**

  - [ ] 10.3 Write unit tests for the Audio_Engine
    - With a fake `AudioLike`: no context before the first gesture, first gesture creates it, sting plan shape and duration, Lantern tone limits, mute drives gain to 0, unsupported factory gives an inert engine
    - _Requirements: 18.2, 18.3, 18.7, 18.8, 18.9_

- [ ] 11. Jump scares
  - [ ] 11.1 Build the four scare illustrations
    - Create `src/ui/scares/endoskeleton.ts` (faceplate split along the vertical center line by 450 ms, glowing eyes, metallic teeth), `horpang.ts` (silhouette with crimson eyes, scale 10% to at least 100% by 550 ms, red and cyan aberration offset 2 to 6 px), `crt.ts` (feTurbulence static, scanlines, ghost face for 100 to 400 ms), `glass.ts` (SVG crack overlay and at least two hands in by 700 ms)
    - Use only inline SVG and CSS with no `<image>` and no external `href`; add keyframes to `src/styles/index.css`
    - _Requirements: 15.5, 15.6, 15.7, 15.8, 15.9, 20.1_

  - [ ] 11.2 Implement the Scare_Renderer
    - Create `src/ui/scares/ScareRenderer.ts` with `play(id)` returning `{ done, cancel }`: fixed full-screen overlay that blocks input, 1500 ms total, shake class on `<body>` removed within 100 ms of the end, 1 s watchdog, `try/catch` around builders that ends the scare and keeps progress unchanged
    - _Requirements: 14.1, 14.6, 14.8, 15.9, 15.10_

  - [ ] 11.3 Write unit tests for the Scare_Renderer
    - With fake timers: duration 1500 ms, shake removed after the end, watchdog forces end, builder failure leaves progress unchanged, no external `href` or `<image>` in output
    - _Requirements: 14.1, 14.6, 15.9, 15.10_

- [ ] 12. Gallery stage
  - [ ] 12.1 Create the Cursed_Photograph generator
    - Create `src/ui/photos/cursedPhotos.ts` with `cursedPhoto(seed)` returning inline SVG (`viewBox="0 0 240 180"`, grayscale shapes, `aria-hidden="true"`, no external references)
    - _Requirements: 10.6, 20.1_

  - [ ] 12.2 Implement the Polaroid
    - Create `src/ui/gallery/Polaroid.ts` with `TILTS`, `tiltFor(index)`, `createPolaroid(...)` as a `<button>` with `aria-label` "Memory N of M" plus ", Banished" when solved, the `--tilt` CSS variable, Banished_Seal (`#39ff14`, text and check icon, fade at most 300 ms), grayscale and blur(8px) and scale 0.8 by default, 0.35 s transition to unblurred on hover and focus, focus ring on an unblurred wrapper
    - Add Polaroid CSS to `src/styles/index.css` (only the card itself: frame, `--tilt`, blur-to-sharp transition; grid layout is Tailwind utilities in the GalleryStage); solved cards do not open the modal
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.8, 10.9, 10.10, 19.8_

  - [ ] 12.3 Write property test for gallery layout
    - **Property 13: Gallery layout matches the quiz**
    - **Validates: Requirements 10.1, 10.3**

  - [ ] 12.4 Implement the HUD, Score_Footer and Guide banner
    - Create `src/ui/gallery/Hud.ts` as a `max-w-6xl` sticky 3-column bar (left: score and streak; center: progress text and battery; right: Lantern toggle and mute) with (score clamped to 0..999,999, multiplier, battery text percentage and bar, "N / M Memories Banished" with N at most M, Lantern toggle with `aria-pressed`, mute button, fallback to 0, 0%, 0 / M when state is missing)
    - Create `src/ui/gallery/ScoreFooter.ts` (fixed at bottom with an inner `max-w-6xl` bar showing the active `Quiz.title` and the score summary, same score field as the HUD) and `src/ui/gallery/GuideBanner.ts` (centered `max-w-3xl` with a subtle border, `aria-live="polite"`, hidden while the modal is open, text from `guideText`)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 11.4, 11.5, 11.6, 19.10_

  - [ ] 12.5 Implement the Quiz_Modal
    - Create `src/ui/gallery/QuizModal.ts` with `role="dialog"`, `aria-modal`, name and description, "Question N of M", `radiogroup` of `role="radio"` options, bone `#e8e4d8` on `#000`, focus to the first option within 100 ms, focus trap, Escape close (ignored while pending or scare playing) returning focus to the opener, zero-option error with focus on the close control
    - Correct mode: green "Correct" with check icon, explanation, Continue; wrong mode: hint, disabled wrong option marked with X icon and "Wrong" text
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 13.5, 13.6, 14.4, 14.9, 19.8_

  - [ ] 12.6 Implement the GalleryStage and wire the answer flow
    - Create `src/ui/gallery/GalleryStage.ts` composing four rows in order on a plain dark background with no Blood_Canvas (the blood pool effect stays on the TitleStage only): HUD, banner, Polaroid grid (`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6` inside `max-w-6xl`, or "No questions are available."), pinned footer with bottom padding on the grid, and the modal
    - Dispatch `ANSWER_CORRECT` and `ANSWER_WRONG` to the Score_Engine; on wrong in default mode use `nextScare`, `ScareRenderer.play`, `audio.playSting`, an `answerLocked` flag that ignores selections during a scare, and reopen the modal with hint within 300 ms after the scare; on wrong in Lantern mode skip the scare and play the soft tone with a calm shake of at most 400 ms
    - Dispatch `SCORE_UPDATED` after each answer so the stage machine moves to the Corridor when all questions are solved
    - _Requirements: 10.1, 10.7, 10.11, 11.1, 11.2, 13.1, 13.2, 13.3, 13.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.7, 14.10, 15.2, 16.1, 19.5, 19.6_

  - [ ] 12.7 Write unit tests for the Gallery UI
    - In jsdom: Polaroid is a button with the right `aria-label` and no `<img>`; Enter and Space open the modal; solved cards do not open it; modal text, roles and focus; HUD score equals footer score; banner hidden while the modal is open; zero-question message
    - _Requirements: 9.6, 10.5, 10.7, 10.9, 10.11, 11.6, 12.1, 12.7_

- [ ] 13. Corridor stage
  - [ ] 13.1 Implement the CorridorStage
    - Create `src/ui/corridor/stairwellSvg.ts` (original inline SVG stairwell with `preserveAspectRatio="xMidYMid slice"`)
    - Create `src/ui/corridor/FlashlightMask.ts` (fixed 200vw by 200vh mask with radial gradient transparent to `#000` at 20%, softer wider gradient in Lantern mode, `translate3d` from `maskTranslate` applied once per frame in a rAF loop, `touch-action: none`)
    - Create `src/ui/corridor/CorridorStage.ts` with the EXIT door button (`aria-label="EXIT door"`, label "EXIT", `#39ff14` glow, transparent hit area), instruction and directions text shown for 5 s and faded over 1 s, nudge at 8 s in an `aria-live="polite"` region, clicks outside the door ignored, door activation dispatches `EXIT_ACTIVATED`; clear all timers and rAF in `destroy()`
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13_

  - [ ] 13.2 Write unit tests for the Corridor
    - With fake timers in jsdom: instruction fade at 5 s, nudge at 8 s, click outside the door has no effect, Enter and Space on the door dispatch `EXIT_ACTIVATED`, mask transform follows pointer events
    - _Requirements: 8.6, 8.7, 8.9, 8.11, 8.13_

- [ ] 14. Summary stage
  - [ ] 14.1 Implement the SummaryStage
    - Create `src/ui/summary/SummaryStage.ts` using `buildSummary`: final score and max score, accuracy percentage, missed concepts or "No concepts need review.", focusable "Play Again" button with a visible focus ring that dispatches `RESET` and `PLAY_AGAIN`
    - When `buildSummary` returns `unavailable`, show "Results are unavailable." and keep an enabled Play Again
    - _Requirements: 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9_

  - [ ] 14.2 Write unit tests for the Summary
    - Cover the empty missed-concept message, ordered concept list, Play Again keyboard activation, and the unavailable-results fallback
    - _Requirements: 16.5, 16.6, 16.7, 16.9_

- [ ] 15. Grimoire
  - [ ] 15.1 Implement the Grimoire
    - Create `src/ui/grimoire/QuestionForm.ts` and `src/ui/grimoire/Grimoire.ts`: modal with focus trap and Escape, title and question list or empty indicator, add control (disabled with a message at 30 questions), per-field Validator errors via `aria-describedby` within 300 ms, delete confirmation, JSON and CSV export through `Blob` download, import with a 1 MB pre-check and error display that leaves the draft unchanged, "Generate Share Link" with copy control and confirmation or failure message, size error showing actual length and 8000, disabled share and export when invalid, "Play This Quiz" replacing the store quiz and resetting score while staying on the Title
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11, 17.12, 17.13, 17.14, 17.15_

  - [ ] 15.2 Write unit tests for the Grimoire
    - In jsdom: add and limit, delete confirm and cancel, validation messages next to fields, disabled controls when invalid, share size error display, clipboard failure message
    - _Requirements: 17.2, 17.3, 17.5, 17.7, 17.12, 17.13, 17.11_

- [ ] 16. Checkpoint - All stages implemented
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Integration and accessibility
  - [ ] 17.1 Wire the application in `main.ts`
    - Construct `LanternStore` and set `data-lantern` on `<html>` before mounting any stage; call `resolveInitialQuiz(location.hash)`; create `GameStore`, `AudioEngine` (null factory when unsupported), `ScareRenderer` and `StageHost`; route `nextStage` results to `StageHost.go` and update the audio ambience per stage
    - Connect the Title corner button to the Grimoire so the `grimoireOpen` flag blocks the stage advance
    - _Requirements: 2.3, 5.8, 7.11, 7.13, 7.14, 8.1, 8.10, 16.1, 16.2, 16.7, 18.5, 18.6, 19.2_

  - [ ] 17.2 Add the decoding notice and boot error screen
    - Render `notice` in a `role="status"` `aria-live="polite"` element with a dismiss button, removed on dismiss or when the student starts the quiz
    - Show "The sample quiz is unavailable." and start no stage when the Default_Quiz is invalid; confirm the Default_Quiz can be played to completion after a notice
    - _Requirements: 2.5, 6.1, 6.2, 6.4, 6.5, 6.6_

  - [ ] 17.3 Write the asset audit smoke test
    - Scan `index.html` and `src/` for `http(s)://` URLs and assert the only external reference is the Google Fonts stylesheet and font host, with no `<img>`, `<video>`, `<audio>` or media file imports
    - _Requirements: 20.1, 20.2, 20.3_

  - [ ] 17.4 Write accessibility checks
    - Assert Lantern toggle `aria-pressed` and Enter or Space operation, live regions present for the banner, notice and nudge, green and crimson cues always accompanied by text or an icon, Lantern mode produces no scare overlay
    - _Requirements: 6.4, 11.4, 19.5, 19.8, 19.10_

  - [ ] 17.5 Write an end-to-end flow integration test
    - In jsdom with fake timers: Title -> Gallery -> answer every question -> Corridor -> activate the EXIT door -> Summary -> Play Again returns to the Gallery with a reset score
    - _Requirements: 7.11, 8.1, 8.10, 16.1, 16.2, 16.7_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Task 1 adds only the toolchain needed to test Area A; task 5 adds Vite, Tailwind and the browser shell.
- Checkpoints ensure incremental validation.
- Property tests validate the universal correctness properties from the design; unit tests cover rendering, timing and focus behavior.
- Canvas visuals, scare appearance, audio loudness and screen reader behavior are also covered by the manual checks in the design's Testing Strategy.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "6.1", "6.3", "6.11", "6.13", "6.15", "6.17", "6.19"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.6", "2.7", "2.8", "3.1", "6.2", "6.4", "6.9", "6.12", "6.14", "6.16", "6.18", "6.20", "8.1"] },
    { "id": 4, "tasks": ["2.9", "3.2", "3.3", "3.4", "3.7", "6.5", "6.6", "6.7", "6.8", "6.10", "8.2", "9.1", "10.1", "11.1", "12.1", "12.2"] },
    { "id": 5, "tasks": ["3.5", "3.6", "3.8", "3.9", "3.10", "3.11", "9.2", "10.2", "10.3", "11.2", "12.3", "12.4", "12.5", "13.1", "14.1"] },
    { "id": 6, "tasks": ["3.12", "9.3", "11.3", "12.6", "13.2", "14.2", "15.1"] },
    { "id": 7, "tasks": ["12.7", "15.2", "17.1"] },
    { "id": 8, "tasks": ["17.2", "17.3", "17.4", "17.5"] }
  ]
}
```
