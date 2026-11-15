# Requirements Document

## Introduction

Horpang is a gamified haunted quiz web application for teenagers studying for a test through a four-stage horror experience (Title, Corridor, Gallery, Summary). Educators customize quiz content in an editor called The Grimoire and share quizzes through a URL hash, with no backend. The application is built with TypeScript (strict), Vite, Tailwind CSS and the Web Audio API, and all visuals and sounds are original and generated at runtime. The visual and interaction rules in `.kiro/steering/horpang-aesthetic.md` apply to every requirement.

The requirements are split into two areas:

- **Area A: Quiz Data and URL-Sharing Engine** (Requirements 1 to 6). Pure logic with no DOM dependency.
- **Area B: Interactive Horror UI** (Requirements 7 to 19). Stages, Jump Scare Shuffler, Guidance Controller, Score State Engine, Grimoire, Audio Engine and Lantern Mode.

## Glossary

- **Horpang_App**: The complete web application.
- **Quiz_Engine**: The pure module that owns the question model, validation, import, export, and URL encoding and decoding.
- **Question**: A record with a unique id, a prompt, two to six answer options, one correct option index, a study explanation, a study hint, and a concept label.
- **Quiz**: An ordered list of one or more Questions with a quiz title.
- **Validator**: The Quiz_Engine component that checks a Quiz or Question against the question model.
- **JSON_Codec**: The Quiz_Engine component that parses and prints Quizzes as JSON.
- **CSV_Codec**: The Quiz_Engine component that parses and prints Quizzes as CSV.
- **Share_Codec**: The Quiz_Engine component that encodes a Quiz into a lz-string compressed URL hash and decodes it back.
- **Share_Hash**: The lz-string compressed, URL-safe string stored in the URL fragment.
- **Default_Quiz**: The built-in sample Quiz with at least five Questions.
- **Stage_Controller**: The UI component that moves the player among the Title, Corridor, Gallery and Summary stages.
- **Title_Stage**: Stage 1, showing the dripping crimson HORPANG title.
- **Corridor_Stage**: Stage 2, the dark hallway with the flashlight mask and EXIT door.
- **Gallery_Stage**: Stage 3, the HUD, Polaroid cards and quiz modal.
- **Summary_Stage**: Stage 4, showing final results.
- **Flashlight_Mask**: The shadow overlay with a circular transparent hole that follows the pointer or touch position.
- **EXIT_Door**: The glowing green (`#39ff14`) door in the Corridor_Stage.
- **HUD**: The always-visible top bar in the Gallery_Stage.
- **Polaroid**: A tilted, monochrome card in the Gallery_Stage representing one Question.
- **Quiz_Modal**: The high-contrast dialog that shows one Question and its options.
- **Banished_Seal**: The green seal with the text "Banished" shown on a solved Polaroid.
- **Score_Engine**: The pure state module that tracks score, streak, multiplier, battery, progress, and per-question results.
- **Streak**: The count of consecutive correct answers.
- **Streak_Multiplier**: The integer multiplier applied to points, equal to the lesser of (Streak + 1) and 5.
- **Battery**: The flashlight battery percentage, an integer from 0 to 100.
- **Guidance_Controller**: The module that selects the guide banner text from the current game state.
- **Scare_Shuffler**: The pure module that selects the next jump scare.
- **Jump_Scare**: One of four full-screen CSS/SVG animations: Split-Face Mechanical Endoskeleton, Lunging Shadow Entity, Analog CRT Static and Phantom Face, Shattered Glass and Reaching Shadow Hands.
- **Scare_Renderer**: The UI component that displays a Jump_Scare overlay.
- **Audio_Engine**: The module that synthesizes all sound with the Web Audio API.
- **Lantern_Mode**: The accessibility mode that replaces jump scares and flashing with calm feedback.
- **Lantern_Store**: The component that persists the Lantern_Mode setting in `localStorage`.
- **Grimoire**: The Educator Studio, the in-app editor for Quizzes.
- **Missed_Concept**: The concept label of a Question that the player answered incorrectly at least once.

## Requirements

## Area A: Quiz Data and URL-Sharing Engine

### Requirement 1: Question Model and Validation

**User Story:** As an educator, I want a well-defined question model with validation, so that every quiz the game plays is complete and consistent.

#### Acceptance Criteria

1. THE Validator SHALL accept a Question only when the Question has a non-empty prompt of at most 300 characters.
2. THE Validator SHALL accept a Question only when the Question has between 2 and 6 answer options, each non-empty and at most 120 characters.
3. THE Validator SHALL accept a Question only when the correct option index is an integer within the range of the answer options.
4. THE Validator SHALL accept a Question only when the Question has a non-empty study explanation, a non-empty study hint, and a non-empty concept label.
5. THE Validator SHALL accept a Quiz only when the Quiz has between 1 and 30 Questions and a non-empty title of at most 80 characters.
6. IF a Quiz or Question fails validation, THEN THE Validator SHALL return a list of errors that each identify the Question position and the failing field.
7. THE Validator SHALL require Question ids within a Quiz to be unique.

### Requirement 2: Default Sample Quiz

**User Story:** As a student, I want a ready-to-play sample quiz, so that I can play immediately without any setup.

#### Acceptance Criteria

1. THE Quiz_Engine SHALL provide a Default_Quiz that contains at least 5 Questions.
2. THE Default_Quiz SHALL pass the Validator.
3. WHEN the Horpang_App starts with no Share_Hash in the URL, THE Horpang_App SHALL load the Default_Quiz.

### Requirement 3: JSON Import and Export

**User Story:** As an educator, I want to import and export quizzes as JSON, so that I can back up and reuse my content.

#### Acceptance Criteria

1. WHEN a JSON document is provided, THE JSON_Codec SHALL parse the document into a Quiz and pass the Quiz to the Validator.
2. IF the JSON document is not syntactically valid or fails validation, THEN THE JSON_Codec SHALL return the error list and leave the current Quiz unchanged.
3. WHEN a Quiz is provided, THE JSON_Codec SHALL print the Quiz as a JSON document.
4. FOR ALL valid Quizzes, parsing the printed JSON of the Quiz SHALL produce a Quiz equal to the original (round-trip property).
5. IF an imported file exceeds 1 MB, THEN THE JSON_Codec SHALL reject the file with a size error.

### Requirement 4: CSV Import and Export

**User Story:** As an educator, I want to import and export quizzes as CSV, so that I can author questions in a spreadsheet.

#### Acceptance Criteria

1. THE CSV_Codec SHALL use one header row and one row per Question, with columns for id, prompt, options, correct option index, explanation, hint and concept.
2. WHEN a CSV document is provided, THE CSV_Codec SHALL parse the document into a Quiz and pass the Quiz to the Validator.
3. WHEN a field contains a comma, a double quote or a line break, THE CSV_Codec SHALL print the field enclosed in double quotes with each inner double quote doubled.
4. WHEN a quoted CSV field is parsed, THE CSV_Codec SHALL restore commas, double quotes and line breaks contained in the field.
5. IF the CSV document has a missing column, an unterminated quoted field or fails validation, THEN THE CSV_Codec SHALL return an error list that names the row and leave the current Quiz unchanged.
6. FOR ALL valid Quizzes, parsing the printed CSV of the Quiz SHALL produce a Quiz equal to the original (round-trip property).
7. IF an imported file exceeds 1 MB, THEN THE CSV_Codec SHALL reject the file with a size error.

### Requirement 5: URL Sharing

**User Story:** As an educator, I want to share a quiz as a link, so that students and judges can play it without any backend.

#### Acceptance Criteria

1. WHEN a valid Quiz is provided, THE Share_Codec SHALL encode the Quiz into a Share_Hash using lz-string URL-safe compression.
2. WHEN a Share_Hash is provided, THE Share_Codec SHALL decode the Share_Hash into a Quiz and pass the Quiz to the Validator.
3. FOR ALL valid Quizzes, decoding the encoded Share_Hash of the Quiz SHALL produce a Quiz equal to the original (round-trip property).
4. FOR ALL Quizzes, encoding the Quiz twice SHALL produce identical Share_Hash values (determinism).
5. IF the encoded Share_Hash exceeds 8000 characters, THEN THE Share_Codec SHALL return a size error that states the actual length and the 8000-character limit.
6. WHEN the Horpang_App starts with a Share_Hash in the URL fragment, THE Horpang_App SHALL decode the Share_Hash and load the resulting Quiz.

### Requirement 6: Invalid and Oversized Hash Handling

**User Story:** As a student, I want a broken or oversized link to fail safely, so that the game still works.

#### Acceptance Criteria

1. IF the URL fragment contains a Share_Hash that cannot be decompressed, is not valid JSON, or fails validation, THEN THE Horpang_App SHALL load the Default_Quiz and show a visible message that the shared quiz could not be loaded.
2. IF the URL fragment is longer than 8000 characters, THEN THE Horpang_App SHALL skip decoding, load the Default_Quiz and show a visible message that the link is too long.
3. WHEN decoding fails, THE Share_Codec SHALL return an error value and not throw an exception to the caller.
4. THE Horpang_App SHALL keep the decoding failure message in the page text so that screen readers announce the message.

## Area B: Interactive Horror UI

### Requirement 7: Title Stage

**User Story:** As a student, I want a dramatic title screen, so that the game sets a spooky mood before I begin.

#### Acceptance Criteria

1. THE Title_Stage SHALL render a `#000000` background.
2. THE Title_Stage SHALL render a viscous crimson liquid in colors `#990000` and `#b30000` that drips from the top edge of the viewport and reveals a distressed HORPANG title.
3. THE Title_Stage SHALL display the pulsing prompt "Click anywhere or press Enter to enter the dark..." animated by JavaScript.
4. WHEN the player clicks anywhere on the Title_Stage or presses Enter, THE Stage_Controller SHALL advance to the Corridor_Stage.
5. THE Title_Stage SHALL display a corner button labeled "Grimoire" that opens the Grimoire.
6. WHEN the player activates the corner button, THE Title_Stage SHALL open the Grimoire without advancing to the Corridor_Stage.
7. WHILE Lantern_Mode is on, THE Title_Stage SHALL display the drip and the pulsing prompt with reduced motion.

### Requirement 8: Corridor Stage

**User Story:** As a student, I want to search a dark corridor with a flashlight, so that finding the way out feels tense and interactive.

#### Acceptance Criteria

1. THE Corridor_Stage SHALL render a dark stairwell scene covered by the Flashlight_Mask.
2. WHILE the pointer moves over the Corridor_Stage, THE Flashlight_Mask SHALL center its circular hole on the pointer position.
3. WHILE the player touches and drags on the Corridor_Stage, THE Flashlight_Mask SHALL center its circular hole on the touch position.
4. WHEN the Corridor_Stage opens, THE Corridor_Stage SHALL show the instruction "Move your flashlight to search the corridor and find the EXIT door..." and fade the instruction out after 5 seconds.
5. THE EXIT_Door SHALL glow with `#39ff14` and carry the visible text label "EXIT".
6. IF 8 seconds pass after the Corridor_Stage opens and the player has not clicked the EXIT_Door, THEN THE Corridor_Stage SHALL display a nudge message that points toward the EXIT_Door side of the screen.
7. WHEN the player clicks or taps the EXIT_Door, THE Stage_Controller SHALL advance to the Gallery_Stage.
8. WHILE Lantern_Mode is on, THE Flashlight_Mask SHALL use a soft edge and a hole radius at least 1.5 times the default radius.
9. WHEN the EXIT_Door has keyboard focus and the player presses Enter or Space, THE Stage_Controller SHALL advance to the Gallery_Stage.

### Requirement 9: Gallery HUD

**User Story:** As a student, I want an always-visible status bar, so that I can track my score and progress.

#### Acceptance Criteria

1. WHILE the Gallery_Stage is shown, THE HUD SHALL display the score, the Streak_Multiplier, the Battery percentage, the progress text in the form "N / M Memories Banished", and the Lantern_Mode toggle.
2. WHEN the Score_Engine state changes, THE HUD SHALL update the displayed values within 100 ms.
3. WHILE the Quiz_Modal is open, THE HUD SHALL remain visible.
4. THE HUD SHALL show the Battery value with a text percentage in addition to any graphical indicator.

### Requirement 10: Polaroid Cards

**User Story:** As a student, I want spooky Polaroid photos that hide their questions until I inspect them, so that the gallery feels haunted.

#### Acceptance Criteria

1. THE Gallery_Stage SHALL render one Polaroid for each Question in the Quiz.
2. THE Polaroid SHALL render in grayscale with a tilt rotation between -8 and +8 degrees.
3. WHILE a Polaroid is neither hovered nor focused, THE Polaroid SHALL be blurred.
4. WHEN a Polaroid is hovered or receives keyboard focus, THE Polaroid SHALL remove the blur.
5. WHEN a Polaroid for an unsolved Question is clicked, or has focus and receives Enter or Space, THE Gallery_Stage SHALL open the Quiz_Modal for that Question.
6. WHEN a Question is solved, THE Polaroid SHALL display the Banished_Seal in `#39ff14` with the text "Banished".
7. WHEN a Polaroid for a solved Question is activated, THE Gallery_Stage SHALL keep the Quiz_Modal closed.
8. THE Polaroid SHALL be reachable with the Tab key and SHALL display a visible focus ring.

### Requirement 11: Guidance Controller

**User Story:** As a student, I want clear instructions on what to do next, so that I never feel lost.

#### Acceptance Criteria

1. WHEN the Gallery_Stage opens, THE Guidance_Controller SHALL select the banner text "Inspect a cursed photograph to uncover its question...".
2. WHEN the game state changes, THE Guidance_Controller SHALL select banner text from a fixed table of messages keyed by state, where the states are no questions solved, some questions solved, last unsolved question remaining, quiz modal open, after wrong answer, after correct answer, and all questions solved.
3. THE Guidance_Controller SHALL return the same banner text for the same game state (determinism).
4. THE Gallery_Stage SHALL display the selected banner text in a region that screen readers announce politely.
5. WHILE the Quiz_Modal is closed and at least one Question is unsolved, THE Gallery_Stage SHALL display the guide banner.

### Requirement 12: Quiz Modal

**User Story:** As a student, I want a focused question dialog, so that I can read and answer each question clearly.

#### Acceptance Criteria

1. WHEN the Quiz_Modal opens, THE Quiz_Modal SHALL display the text "Question N of M", the Question prompt and the answer options as selectable choices.
2. THE Quiz_Modal SHALL render bone text `#e8e4d8` on a black background with a contrast ratio of at least 4.5:1.
3. WHILE the Quiz_Modal is open, THE Quiz_Modal SHALL keep keyboard focus within the dialog.
4. WHEN the player presses Escape and no answer is pending, THE Quiz_Modal SHALL close and return focus to the originating Polaroid.
5. WHILE an answer is pending evaluation or a Jump_Scare is playing, THE Quiz_Modal SHALL ignore the Escape key.
6. WHEN the Quiz_Modal opens, THE Quiz_Modal SHALL move keyboard focus to the first answer option.
7. THE Quiz_Modal SHALL expose the roles and labels needed for screen readers to identify the dialog, the prompt and the options.

### Requirement 13: Correct Answer Rewards

**User Story:** As a student, I want rewards for right answers, so that I feel progress and stay motivated.

#### Acceptance Criteria

1. WHEN the player selects the correct option, THE Score_Engine SHALL add 100 multiplied by the current Streak_Multiplier to the score.
2. WHEN the player selects the correct option, THE Score_Engine SHALL increment the Streak by 1.
3. WHEN the player selects the correct option, THE Score_Engine SHALL increase the Battery by 20, capped at 100.
4. WHEN the player selects the correct option, THE Score_Engine SHALL mark the Question solved and increment the banished count by 1.
5. WHEN the player selects the correct option, THE Quiz_Modal SHALL display the Question study explanation with a green cue and the text "Correct".
6. WHEN the player closes the study explanation, THE Quiz_Modal SHALL close and THE Polaroid SHALL display the Banished_Seal.
7. THE Score_Engine SHALL keep the banished count less than or equal to the number of Questions and the Battery between 0 and 100 after every action.

### Requirement 14: Wrong Answer and Jump Scare

**User Story:** As a student, I want wrong answers to be scary but instructive, so that the horror helps me remember the lesson.

#### Acceptance Criteria

1. WHEN the player selects an incorrect option and Lantern_Mode is off, THE Scare_Renderer SHALL display one full-screen Jump_Scare for 1500 ms with a tolerance of 200 ms.
2. WHEN the player selects an incorrect option, THE Score_Engine SHALL reset the Streak to 0 and decrease the Battery by 15, with a minimum of 0.
3. WHEN the player selects an incorrect option, THE Score_Engine SHALL record the Question concept as a Missed_Concept and leave the Question unsolved.
4. WHEN the Jump_Scare ends, THE Quiz_Modal SHALL reappear with the Question study hint and the incorrect option marked with text and an icon.
5. WHILE the Jump_Scare is playing, THE Horpang_App SHALL apply a screen shake to the viewport.
6. WHEN the Jump_Scare starts, THE Audio_Engine SHALL play the scare sting.
7. THE Horpang_App SHALL fire a Jump_Scare only after an incorrect answer and SHALL leave correct answers and stage navigation without any Jump_Scare.
8. WHEN the player has already selected an incorrect option, THE Quiz_Modal SHALL disable that option for the remaining attempts on that Question.

### Requirement 15: Jump Scare Shuffler

**User Story:** As a student, I want varied scares, so that wrong answers stay surprising.

#### Acceptance Criteria

1. THE Scare_Shuffler SHALL select from exactly four Jump_Scares: Split-Face Mechanical Endoskeleton, Lunging Shadow Entity named "The Horpang", Analog CRT Static and Phantom Face, and Shattered Glass and Reaching Shadow Hands.
2. WHEN the Scare_Shuffler selects a Jump_Scare, THE Scare_Shuffler SHALL select one that differs from the previously selected Jump_Scare.
3. FOR ALL sequences of 1000 selections with a seeded random source, THE Scare_Shuffler SHALL produce no two identical consecutive selections and SHALL select every Jump_Scare at least once.
4. THE Split-Face Mechanical Endoskeleton SHALL show a faceplate that splits open to reveal glowing eyes and metallic teeth.
5. THE Lunging Shadow Entity SHALL show a black silhouette with glowing crimson eyes that scales toward the screen with chromatic aberration.
6. THE Analog CRT Static and Phantom Face SHALL show a high-contrast noise glitch that flashes a distorted monochrome ghostly face.
7. THE Shattered Glass and Reaching Shadow Hands SHALL show an SVG screen-crack overlay with dark hands clawing in from the screen edges.
8. THE Horpang_App SHALL build every Jump_Scare from original CSS and SVG, with no external image, video or audio files.

### Requirement 16: Summary Stage

**User Story:** As a student, I want a results screen at the end, so that I know how I did and what to study.

#### Acceptance Criteria

1. WHEN all Questions are solved, THE Stage_Controller SHALL advance to the Summary_Stage.
2. THE Summary_Stage SHALL display the final score.
3. THE Summary_Stage SHALL display the accuracy percentage, calculated as correct first-attempt answers divided by the number of Questions, rounded to the nearest whole percent.
4. THE Summary_Stage SHALL list each Missed_Concept once, ordered by the Question order in the Quiz.
5. WHERE no Missed_Concept exists, THE Summary_Stage SHALL display a message that no concepts need review.
6. WHEN the player activates the "Play Again" button, THE Stage_Controller SHALL reset the Score_Engine and return to the Corridor_Stage with the same Quiz.
7. THE Summary_Stage SHALL display the "Play Again" button reachable by keyboard.

### Requirement 17: Educator Studio (The Grimoire)

**User Story:** As an educator, I want an in-app editor called The Grimoire, so that I can create and share my own quizzes.

#### Acceptance Criteria

1. WHEN the player opens the Grimoire, THE Grimoire SHALL display the current Quiz title and the list of Questions.
2. WHEN the educator activates the add control, THE Grimoire SHALL add a blank Question editor form to the Quiz.
3. WHEN the educator edits a Question field, THE Grimoire SHALL show the Validator errors for that field next to the field.
4. WHEN the educator activates the delete control for a Question, THE Grimoire SHALL remove the Question after the educator confirms.
5. WHEN the educator activates the JSON or CSV export control, THE Grimoire SHALL download the current Quiz through the matching codec.
6. WHEN the educator selects a JSON or CSV file, THE Grimoire SHALL import the file through the matching codec and display any errors.
7. WHEN the educator activates "Generate Share Link", THE Grimoire SHALL display a URL containing the Share_Hash and provide a copy control.
8. IF the Quiz is invalid, THEN THE Grimoire SHALL disable the share and export controls and display the Validator errors.
9. IF the Share_Codec returns a size error, THEN THE Grimoire SHALL display the actual length and the 8000-character limit.
10. WHEN the educator activates "Play This Quiz", THE Grimoire SHALL close and start the Title_Stage with the edited Quiz.
11. THE Grimoire SHALL render with readable high-contrast text, visible focus rings and full keyboard operation, using the black, bone and monochrome palette.

### Requirement 18: Audio Engine

**User Story:** As a student, I want procedurally generated sound, so that the game is atmospheric without any copyrighted media.

#### Acceptance Criteria

1. THE Audio_Engine SHALL synthesize all sounds at runtime using oscillators, noise sources, filters and gain envelopes.
2. THE Audio_Engine SHALL start its AudioContext only after the first user gesture.
3. WHEN a Jump_Scare starts, THE Audio_Engine SHALL play a sting made of a sub-bass drop followed by a dissonant metallic screech.
4. THE Audio_Engine SHALL cap the master gain at 0.5.
5. WHILE the Corridor_Stage or the Gallery_Stage is shown and audio is not muted, THE Audio_Engine SHALL play a generated ambient drone.
6. THE HUD and the Title_Stage SHALL provide a mute control that stops all audio when activated.
7. IF the browser does not support the Web Audio API, THEN THE Horpang_App SHALL continue without sound and without showing an error dialog.
8. WHILE Lantern_Mode is on, THE Audio_Engine SHALL play a short soft tone in place of the scare sting.

### Requirement 19: Lantern Mode

**User Story:** As a player who is sensitive to scares or motion, I want Lantern Mode, so that I can study without frightening or flashing effects.

#### Acceptance Criteria

1. WHEN the player activates the Lantern_Mode toggle, THE Lantern_Store SHALL save the new setting to `localStorage`.
2. WHEN the Horpang_App starts and a saved Lantern_Mode setting exists, THE Horpang_App SHALL apply the saved setting.
3. WHEN the Horpang_App starts, no saved setting exists and the browser reports `prefers-reduced-motion: reduce`, THE Horpang_App SHALL turn Lantern_Mode on.
4. WHILE Lantern_Mode is on, THE Horpang_App SHALL replace each Jump_Scare with a calm visual shake of at most 400 ms and the study hint.
5. WHILE Lantern_Mode is on, THE Horpang_App SHALL emit no more than 3 luminance flashes in any one second period and disable strobing effects.
6. WHILE Lantern_Mode is on, THE Horpang_App SHALL reduce the motion of drips and pulses.
7. THE Horpang_App SHALL convey every green or crimson cue with text or an icon in addition to color.
8. IF `localStorage` is unavailable, THEN THE Lantern_Store SHALL keep the setting in memory for the session and THE Horpang_App SHALL continue without an error.
9. THE Lantern_Mode toggle SHALL be keyboard operable, expose its on or off state to screen readers, and display a visible focus ring.
