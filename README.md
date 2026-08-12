# Mental Math

A quiet mental math drill — pick a difficulty and a category, then answer
problems until you stop. No timer, no score, no accounts.

Six categories: addition, subtraction, multiplication, division, percentages,
and fractions. Every problem is built so the answer is a whole number, so a
single numeric keypad covers all of them.

## How it plays

- **Endless.** A session runs until you go back to the category list.
- **Three modes.** Easy, Medium, and Hard. Pick one above the category grid, or
  switch from the play screen — switching mid-session swaps in a fresh problem
  right away. Difficulty never shifts on its own. The mode is remembered while
  the tab is open and resets to Medium on reload.
- **Keypad or keyboard.** Tap the on-screen keys, or use `0`–`9`,
  `Backspace` to delete, `Enter` / `=` to submit, and `Escape` to go back.

## What the modes mean

Easy, Medium, and Hard are one-, two-, and three-digit operands respectively.
Four categories can't take that literally, so they scale on their own axis:

| Category | Easy | Medium | Hard |
| --- | --- | --- | --- |
| Addition | `7 + 4` | `47 + 68` | `418 + 267` |
| Subtraction | `9 − 5` | `82 − 39` | `731 − 458` |
| Multiplication | `7 × 6` | `48 × 7` | `312 × 8` |
| Division | `56 ÷ 8` | `144 ÷ 12` | `608 ÷ 16` |
| Percentages | `50% of 40` | `15% of 60` | `35% of 240` |
| Fractions | `3⁄4 of 12` | `2⁄5 of 45` | `7⁄12 of 180` |

- **Multiplication** grows only its leading operand — three digits by three
  digits isn't a mental-math problem.
- **Division** derives the dividend from divisor × quotient, with a floor per
  mode so a small draw of both can't put `12 ÷ 3` in a Hard session.
- **Percentages** scale by how awkward the percentage is (`50%` → `15%` → `35%`)
  as well as by the size of the whole.
- **Fractions** scale by denominator size rather than digit count.

Subtraction never goes negative, and division is always exact.

## Development

```sh
npm install
npm run dev      # dev server on http://localhost:5173
npm test         # unit tests for the generators and leveling
npm run lint
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
```

## Project layout

| Path | What it holds |
| --- | --- |
| `src/generators.ts` | Pure problem generation — per-mode ranges and the six categories |
| `src/App.tsx` | Screen, mode, and session state, plus keyboard handling |
| `src/components/` | Category grid, play view, keypad, mode toggle |

`generators.ts` is pure and holds no UI, so every difficulty rule is covered
directly by `npm test` — including that each mode's answers are whole numbers
and its operands sit in the advertised range.

## Deploying to Netlify

`netlify.toml` already sets the build command (`npm run build`), the publish
directory (`dist`), Node 20, and an SPA redirect.

**From the dashboard (recommended):** push this repo to GitHub, then in Netlify
choose *Add new site → Import an existing project*, pick the repo, and accept
the settings from `netlify.toml`. Every push then deploys automatically.

**From the CLI:**

```sh
npm i -g netlify-cli
netlify login
netlify deploy --build          # draft/preview URL
netlify deploy --build --prod   # publish to production
```
