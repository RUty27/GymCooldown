# GymCooldown

A local-first web app for logging gym sessions, seeing which muscles are still
recovering, and getting a recommended rest time before you train them again.

Install it to your phone's home screen and it works offline in the gym.

## What it does

**Log** — pick a lift from a ~65-exercise library and add sets with reps and
weight. Each exercise shows a recommended rest *between sets* (based on whether
it's compound and your rep range) and what you did last time, so progression is
visible while you're logging.

**Body** — front and back muscle maps, tappable per muscle group, in two modes:

- *Recovery* — each muscle is shaded by whether it's still resting or ready to
  train, with a plain-language list of what needs how much more rest.
- *Weekly volume* — each muscle shaded by volume load over the last 7 days, so
  neglected areas are obvious.

Tap any muscle for its detail: hours since it was trained, recommended rest,
sets and volume this week, what last hit it, and what else trains it.

**History** — every session, expandable to the set level, with per-session
tonnage.

**Settings** — kg/lb toggle, JSON export/import, clear all data.

## Data and privacy

Everything is stored in `localStorage` on your device. Nothing is uploaded and
there is no account. Clearing your browser data erases it, so use
**Settings → Export backup** now and then.

Weights are always stored in kilograms and converted for display, so switching
units never rewrites your history.

## How the recommendations work

Two different numbers, from two different places:

- **Rest between sets** (`src/lib/restTimer.ts`) — 2–3 min for heavy compounds,
  45–90s for isolation work.
- **Recovery between sessions** (`src/lib/recovery.ts`) — each muscle group has
  a base recovery time (large groups like quads and hamstrings ~72h, small ones
  like calves and forearms ~24h), scaled by how hard that session actually hit
  it. Two sessions on the same day stack into one harder session rather than
  resetting the clock.

These are general training heuristics, not medical advice. Sleep, nutrition,
stress and training experience all move these numbers — treat the output as a
starting point and adjust to how you actually feel.

The muscle map reflects **what you have logged**: training volume and recovery
state. It does not predict or depict actual physique change.

## Running it

```bash
npm install
npm run dev       # dev server
npm run test      # unit tests for the volume + recovery math
npm run build     # production build into dist/
npm run preview   # serve the production build
```

`dist/` is a static bundle — deploy it to any static host (Netlify, Vercel,
GitHub Pages, a plain nginx root). Serve it over HTTPS so the service worker
registers and the app becomes installable.

## Project layout

```
src/types.ts              muscle groups, exercise + session shapes
src/data/exercises.ts     the exercise library (plain data — easy to extend)
src/lib/volume.ts         per-muscle volume load from logged sets
src/lib/recovery.ts       recovery-time model and per-muscle status
src/lib/restTimer.ts      between-set rest recommendations
src/lib/palette.ts        heatmap colours (validated for contrast + CVD)
src/lib/storage.ts        versioned localStorage persistence
src/components/BodySvg.tsx  the front/back figures
```

### Adding an exercise

Append an entry to `EXERCISES` in `src/data/exercises.ts`. `primary` muscles
take the full volume and recovery cost, `secondary` muscles take half, and
`compound` lengthens both the between-set rest and the recovery estimate.
