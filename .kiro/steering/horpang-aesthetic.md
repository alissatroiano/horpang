---
inclusion: always
---

# Horpang Aesthetic and Interaction Rules

These rules lock the visual and interaction language for Horpang. Follow them in all UI, audio, and copy work.

## Canvas and palette
- Base canvas is pitch black `#000000`. Never use a lighter page background.
- Blood crimson: `#990000` and `#b30000` for the drip, title, seals of danger, and Horpang's eyes.
- Exit and success cue: glowing green `#39ff14` (EXIT door, "Banished" seal, correct-answer glow).
- Text: off-white bone (`#e8e4d8`) on black. Modal text must meet WCAG AA contrast (4.5:1 minimum).
- Everything else is monochrome (grayscale). Color is reserved for crimson (danger) and green (safety/progress).

## Stage order
- Title -> Gallery (answer every question) -> Corridor (find the EXIT door to escape) -> Summary.

## Assets
- All photographs, the stairwell, and scare art are original inline SVG/CSS. License-free images and audio are allowed, but should be carefully checked.
- Only external resource: Google Fonts (Road Rage for display text and Oswald for body text) with system fallbacks. The game must work offline.

## Stage 1: Crimson blood-pool title
- Canvas blood pools (deep crimson gradient #8b0000 to #320000) spawn in a ring around the center with organic edges and splatter droplets, then a final center pool. They frame and reveal the distressed HORPANG title (Road Rage font, dark stroke).
- Pulsing prompt is JS-animated: "Click anywhere or press Enter to enter the dark..."
- A subtle corner button opens the Educator Studio (The Grimoire).

## Stage 3: Flashlight corridor (escape)
- Dark stairwell scene (inline SVG) covered by a ~200vw x 200vh radial-gradient shadow mask (transparent center, #000 at ~20%) translated to follow `mousemove` and touch.
- Fading instruction overlay: "Move your flashlight to search the corridor and find the EXIT door..."
- If the EXIT door is not found within 8 seconds, show a gentle nudge.
- The EXIT door glows `#39ff14`; clicking or tapping it advances to the gallery.

## Stage 2: Polaroid gallery
- Always-visible top HUD: Score, Streak Multiplier, Flashlight Battery %, Progress (for example "2 / 5 Memories Banished"), and a Lantern Mode toggle.
- Polaroids are #666 framed cards with alternating tilts (+5, -5, -3, +3 deg), scale 0.8, grayscale, blur(8px); hover/focus straightens, scales to 1, un-blurs (0.35s). Photos are original inline SVG. Keyboard focus must unblur like hover.
- A JS-driven guide banner tells the student what to do next ("Inspect a cursed photograph to uncover its question...").
- Solved cards carry a green "Banished" seal so remaining cards are obvious.
- Quiz modal is high-contrast and shows "Question N of M", the prompt, and multiple-choice options. It traps focus and closes with Escape only when no answer is pending.
- Correct answers: award points, raise streak, restore battery, show a short study explanation, mark the card solved.
- Wrong answers: jump scare, then return to the modal with a study hint.

## Jump-scare rules
- All scares are original, self-contained CSS/SVG. No external images, video, or audio files. No copyrighted assets.
- Four scares: Split-Face Mechanical Endoskeleton, Lunging Shadow Entity ("The Horpang"), Analog CRT Static and Phantom Face, Shattered Glass and Reaching Shadow Hands.
- A shuffler picks the next scare at random and never repeats the previous one back to back.
- Each scare lasts about 1.5 seconds, includes screen shake, and pairs with a procedural Web Audio sting (sub-bass drop plus dissonant metallic screech).
- Audio starts only after a user gesture (autoplay policy). Keep master gain capped to avoid painful volume.
- Scares only fire on wrong answers, never on correct answers or navigation.

## Lantern Mode (accessibility)
- Toggle lives in the HUD and persists in `localStorage`.
- When on: no jump scares and no flashing. Replace with a calm, short visual shake plus the study hint.
- Also disables strobing effects, reduces motion on drips and pulses, and keeps the flashlight mask soft and widened.
- Respect `prefers-reduced-motion` by defaulting Lantern Mode on.
- Never rely on color alone: pair green and crimson cues with text or icons.
- All interactive elements are keyboard reachable with visible focus rings.

## Audio
- Web Audio API only, synthesized procedurally (oscillators, noise, filters, gain envelopes).
- Ambient drones and stingers are generated at runtime. Provide a mute control.

## Code conventions
- TypeScript (strict), Vite, Tailwind CSS. Game logic is separate from rendering so the score, guidance, scare shuffler, and quiz data/URL engine are unit-testable without a DOM.
- Quiz data lives in a pure module and shares via `lz-string` URL hash. No backend.

