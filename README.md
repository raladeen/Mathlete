# Mental Math

A quiet mental math drill — pick a category, answer problems until you stop. No
timer, no score, no accounts. Difficulty adapts to you silently and resets when
you reload the page.

Six categories: addition, subtraction, multiplication, division, percentages,
and fractions. Every problem is built so the answer is a whole number, so a
single numeric keypad covers all of them.

## How it plays

- **Endless.** A session runs until you go back to the category list.
- **Adaptive.** Each category has 5 levels. Three correct in a row moves you up
  (max 5); one wrong answer moves you down (min 1). The five dots on the play
  screen show where you are. Nothing is stored — reloading starts over at
  level 1.
- **Keypad or keyboard.** Tap the on-screen keys, or use `0`–`9`,
  `Backspace` to delete, `Enter` / `=` to submit, and `Escape` to go back.

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
| `src/generators.ts` | Pure problem generation — level ranges and the six categories |
| `src/adaptive.ts` | Level-up / level-down rules |
| `src/App.tsx` | Screen and session state, keyboard handling |
| `src/components/` | Category grid, play view, keypad |

`generators.ts` and `adaptive.ts` are pure and hold no UI, so the rules are
covered directly by `npm test`.

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
