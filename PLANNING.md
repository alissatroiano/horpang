# HORPANG — Architecture & Design Planning Document

## 1. Vision & Hackathon Category Fit ("Costume Contest")
**Horpang** is a gamified, horror-themed educational study application designed for middle school and high school students (grades 6–12). Rather than using spooky visuals as superficial decoration, every horror mechanic directly reinforces active recall and focus:
* **Blurred-to-Sharp Monochrome Polaroids** prevent visual clutter and isolate one curriculum concept at a time.
* **Battery Drain & Jump-Scare Stingers** create real stakes for wrong answers, motivating careful reading and learning from hints.
* **Flashlight Escape Corridor** rewards completing a study set with an interactive dark-hallway search for the glowing exit.
* **Lantern Mode (Accessibility)** removes darkness, blur, and jump scares so students with sensory sensitivities or teachers reviewing questions can read comfortably.

---

## 2. Updated User Flow & Stage Architecture

### Stage 1: Theatrical Intro Video (`TitleStage`)
* **Visuals:** Full-viewport bundled video (`src/assets/intro.mp4`, ~1.39 MB) depicting shadowy hands behind frosted glass, a scrambled-text reveal (*"DON'T PLAY ALONE..."* → *"CLICK TO START"*), and the glowing spiderwebbed **HORPANG** logo.
* **Playback & Controls:** Plays automatically (`muted playsInline`) and holds cleanly on the final *"HORPANG / CLICK TO START"* frame so the call-to-action stays readable. Clicking anywhere on the stage (or pressing `Enter`) unlocks the Web Audio API context and enters Stage 2.
* **Lantern Mode Behavior:** Pauses on the crisp title frame with a static *"Click or press Enter to begin"* prompt.

### Stage 2: Haunted Polaroid Gallery (`GalleryStage`)
* **Layout:** Structured 4-row responsive Tailwind CSS container layout (`max-w-6xl`):
  1. **Row 1 (Sticky HUD):** 3-column bar showing *Score & Streak* (left), *Banished Progress & Flashlight Battery %* (center), and *Lantern Mode / Mute / Grimoire* toggles (right).
  2. **Row 2 (Diegetic Guidance Banner):** Centered `max-w-3xl` live-region banner guiding the student (*"Inspect a cursed photograph to uncover its question..."*).
  3. **Row 3 (Polaroid Grid):** Responsive 1-to-4 column grid (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`) displaying tilted (`+5°, -5°, -3°, +3°`), blurred monochrome specimen/curriculum Polaroids. Hovering or keyboard-focusing snaps a card into sharp focus.
  4. **Row 4 (Pinned Footer):** Fixed bottom bar displaying the active curriculum quiz title and live score.
* **Quiz Modal & Jump-Scare Feedback:**
  * Clicking a Polaroid opens a high-contrast multiple-choice modal (`#e8e4d8` bone text on `#000`).
  * **Correct Answer:** Awards `100 × streak` points (up to 5x), restores `+20%` flashlight battery, displays a curriculum explanation, and stamps the Polaroid with a glowing green **Banished** seal.
  * **Wrong Answer:** Resets streak, drains `-15%` battery, records the missed concept for end-of-game review, triggers one of 4 self-contained CSS/SVG jump scares (`Endoskeleton`, `The Horpang`, `CRT Static`, `Shattered Glass`) with a procedural Web Audio sting (~1.5s), and reopens the modal with a study hint.

### Stage 3: Flashlight Escape Corridor (`CorridorStage`)
* **Unlock Condition:** Unlocks automatically once every Polaroid memory in Stage 2 is banished.
* **Mechanic:** A dark stairwell/corridor covered by a cursor-tracked (`pointermove` / touch) `200vw × 200vh` radial flashlight mask. Students sweep their beam to locate the glowing green `#39ff14` **EXIT** door and click/activate it to escape.
* **Guidance:** Fading initial prompt (*"Move your flashlight to search the corridor and find the EXIT door..."*) plus an 8-second directional nudge if the door hasn't been found yet.

### Stage 4: Escape Summary & Arcade Scoreboard (`SummaryStage`)
* **Study Review:** Displays final score vs. maximum possible score, first-try accuracy percentage, escape time, and an ordered list of **Missed Concepts to Review**.
* **Student Engagement:** Local top-5 arcade leaderboard (`localStorage`) with 3-letter initials and a **"Copy Escape Report"** button for sharing results in group chats or Google Classroom.

### Always-Accessible Educator Studio: "The Grimoire" (`Grimoire`)
* **Global Access:** Accessible via a persistent **"Grimoire"** button in the top navigation/HUD across all stages (not just the Title screen) so instructors can inspect, edit, or switch study decks at any point during class or a demo.
* **Features:** Add/edit/delete questions (1–30), live field validation, CSV & JSON import/export, curriculum subject presets (e.g., *High School Biology & Anatomy*), and shareable link generation.

---

## 3. Data Persistence & Classroom Sharing Trade-Offs

To let educators customize quizzes and allow students to play from home, here are the four storage/sync architectures weighed for Horpang:

| Approach | How It Works | Pros | Cons / Trade-Offs | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **1. `lz-string` URL Hash + `localStorage` (Current MVP)** | Compresses the entire quiz JSON into the URL fragment (`#N4Ig...`) and caches drafts locally. | **Zero backend, zero accounts, instant offline/online sharing**, works out-of-the-box for hackathon judges. | Static snapshot per link (if a teacher fixes a typo, they must share a new URL); no teacher dashboard for student scores. | **Core Foundation (Keep)** |
| **2. Published Google Sheets CSV (`?sheet=<url>`)** | Teacher edits a Google Sheet (*File → Share → Publish to web → CSV*); Horpang fetches the URL and parses it via `csvCodec.ts`. | **Live-editable per class** using a tool teachers already know; students at home always get updated questions from the same link; zero DB maintenance. | Read-only (students don't write scores back to the Sheet); ~5-minute Google publish cache delay unless using Apps Script. | **Best Phase-2 Classroom Upgrade** |
| **3. Google Apps Script Web App** | A lightweight script attached to a Google Sheet exposes `doGet()` (live quiz CSV/JSON) and `doPost()` (logs student escape scores). | **Two-way sync** (live quiz edits + student scoreboard logged directly into the teacher's Sheet) with zero external server costs. | Requires each teacher to authorize/deploy a script on their Google account; slightly higher setup friction. | **Great Optional Educator Template** |
| **4. Firebase / Supabase Backend** | Cloud database + Auth storing quizzes under short room codes (e.g., `horpang.app/room/BIO101`) and real-time class leaderboards. | Short clean room codes, instant live edits, real-time teacher analytics across all students at home. | Introduces API keys, security rules, rate limits, and potential auth friction during hackathon judging. | **Post-Hackathon / Scale Option** |

### Recommended Path
1. **MVP (Current Build):** Keep `lz-string` URL hashes + CSV/JSON import/export + global **Grimoire** access so the app is 100% self-contained and reliable.
2. **Immediate Post-MVP Enhancement:** Add **`?sheet=<encodedCsvUrl>`** support to `loadQuiz.ts` and **The Grimoire** so teachers can paste a published Google Sheet CSV link and give each class a permanent, live-editable study URL.

---

## 4. Future Expansion: "Flashlight Clue Hunt" (Escape Room Mode)
* **Concept:** An optional second game mode selectable on the Title screen alongside *Polaroid Gallery*.
* **Gameplay:** Students explore a pitch-black room with their flashlight beam to uncover 5–8 hidden curriculum clues (e.g., an anatomical chart, a lab notebook, a microscope slide) that reveal the digits/letters needed to unlock the exit door keypad.
* **Why It Fits:** Uses the exact same `Quiz` data model (`concept`, `hint`, `prompt`) while appealing to students who prefer spatial exploration and logical deduction over card-based quizzes.
