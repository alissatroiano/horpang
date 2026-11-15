# prompt

I am building Horpang, a gamified haunted quiz web application for the Costume Contest category of Kiroween 2026 Hackathon. The target market is teenagers who will play through a spooky 3-stage interactive horror experience to study for a test, while educators can customize the quiz content.

Tech Stack: TypeScript, Vite, Tailwind CSS, and the Web Audio API for procedural, copyright-free spooky sound effects and jump-scare stingers.

Exact User Flow, Guidance & Game Mechanics:

1. Stage 1 — Dripping Crimson Title Screen: Pitch-black background (#000000) with a viscous deep-crimson (#990000 / #b30000) liquid drip animation cascading from the top edge to reveal the distressed HORPANG title. Include a pulsing JS-animated prompt ('Click anywhere or press Enter to enter the dark...') and a subtle corner button for Educator Studio.

2. Stage 2 — Dark Corridor Flashlight Exploration: A dark stairwell/hallway scene with a cursor-tracked circular flashlight overlay (mousemove / touch translate shadow mask). Include a fading eerie instruction overlay ('Move your flashlight to search the corridor and find the EXIT door...') and a gentle nudge if the user hasn't found the glowing green EXIT door (#39ff14) within 8 seconds. Clicking the exit door advances to the gallery.

3. Stage 3 — Haunted Polaroid Gallery, HUD & Guided Quiz Modals:
    1. Top Spooky HUD Bar: Always visible in Stage 3, tracking Score / Points, Streak Multiplier, Flashlight Battery %, and Progress (e.g., 2 / 5 Memories Banished), plus a 'Lantern Mode' accessibility toggle.
    2. Guided Polaroid Selection: Display tilted, monochrome Polaroid cards that stay blurred until hovered/focused. Use a JS-driven guide banner ('Inspect a cursed photograph to uncover its question...') and visually mark solved cards with a green 'Banished' seal so students always know which cards remain.
    3. Interactive Quiz Modal: Clicking a Polaroid opens a high-contrast modal showing the question number (Question 1 of 5), the question prompt, and multiple-choice options.
    4. Correct Answer Feedback: Awards points, increments streak, restores flashlight battery, shows a brief study explanation, and marks the Polaroid as solved.
    5. Wrong Answer Jump Scare System (Custom CSS/SVG Shuffler): • Triggers a full-screen overlay that shuffles through 4 original, self-contained CSS/SVG horror animations (preventing back-to-back repeats) paired with a procedural Web Audio API horror sting (sub-bass drop + dissonant metallic screech) and screen shake for ~1.5 seconds:
        1. Split-Face Mechanical Endoskeleton: A shadowed doll/animatronic face whose faceplate splits open to reveal glowing eyes and metallic teeth.
        2. Lunging Shadow Entity ('The Horpang'): Pitch-black silhouette with glowing crimson eyes rapidly scaling toward the screen with chromatic aberration.
        3. Analog CRT Static & Phantom Face: High-contrast TV noise glitch flashing a distorted monochrome ghostly face.
        4. Shattered Glass & Reaching Shadow Hands: Sudden screen-crack SVG overlay with dark hands clawing inward from the edges. After the 1.5-second scare, return to the quiz modal with a helpful study hint so the student can learn from the mistake. (When Lantern Mode is enabled, replace the jump scare with a calm visual shake and hint).

4. Stage 4 — Escape / Summary Screen: Once all Polaroid questions are answered, show the final score, accuracy percentage, missed concepts to review, and a 'Play Again' button.

5. Educator Studio ('The Grimoire'): A clean editor where teachers can add, edit, or import/export custom quiz questions (JSON/CSV) and generate a shareable URL hash (lz-string) so students or hackathon judges can play custom quizzes with zero backend setup.
First

First, set up our Kiro workflow before writing app code:

1. Steering Doc: Create .kiro/steering/horpang-aesthetic.md locking in our visual language (pitch-black #000 canvas, crimson liquid drip intro, cursor-tracked circular flashlight mask, glowing green exit cues, monochrome blurred-to-sharp Polaroids, procedural CSS/SVG jump-scare rules, and Lantern Mode accessibility).

2. Spec-Driven Development: Generate .kiro/specs/horpang-mvp/ with requirements.md, design.md, and tasks.md separating the Quiz Data & URL-Sharing Engine from the 3-Stage Interactive Horror UI, Jump Scare Shuffler, Guidance Controller, & Score State Engine."


## GIF Array

https://www.pinterest.com/pin/hereditary-movie-gif--18647785948688615/, https://images.squarespace-cdn.com/content/v1/58e45a52ebbd1a24417fdf93/1528924803636-R3NTNOLFL1RFR914R0P7/hereditary.gif, https://64.media.tumblr.com/e8eff83249f76e2b21815f02f934ce6b/3699a2c5b7c136ed-01/s540x810/981d2e66248ea7353337cd5aac8768958e7c220f.gif, https://crustula.com/wp-content/uploads/2018/06/hereditary7.gif?w=720, https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e27fde95-0417-4cbb-b536-4d405138007f/d5mnuvz-6be93b93-3c96-4524-b3d6-ed177545d6c1.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9lMjdmZGU5NS0wNDE3LTRjYmItYjUzNi00ZDQwNTEzODAwN2YvZDVtbnV2ei02YmU5M2I5My0zYzk2LTQ1MjQtYjNkNi1lZDE3NzU0NWQ2YzEuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.9ZWuer3N_rjjQvidYKZTcCPjqaCTkTQgYvx1-Wg_ocM, https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3879d51a-63d4-4d0c-ab8e-021766aba32b/d9178sk-76cc5653-8e6f-4d0c-8277-23a64020c8a5.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi8zODc5ZDUxYS02M2Q0LTRkMGMtYWI4ZS0wMjE3NjZhYmEzMmIvZDkxNzhzay03NmNjNTY1My04ZTZmLTRkMGMtODI3Ny0yM2E2NDAyMGM4YTUuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.ZSMz83vSiGgxeZ9RadSnez1Ctt7xsCHsKLwTVNYZoG8, https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/2fe86a64-a39c-4db3-b26b-bbb8733db350/dbmva6x-9cf5c14b-b6f7-4a1f-9274-5ebd989f4257.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi8yZmU4NmE2NC1hMzljLTRkYjMtYjI2Yi1iYmI4NzMzZGIzNTAvZGJtdmE2eC05Y2Y1YzE0Yi1iNmY3LTRhMWYtOTI3NC01ZWJkOTg5ZjQyNTcuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.E9WO7SFTYlSXe1VbVgm4ee8DlCbYjtBC0OfLKLXReII
