# The Great Turkey Escape

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/muhamadfajar160299-ctrl/makefun-entry-turkey-escape-20261127/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/muhamadfajar160299-ctrl/makefun-entry-turkey-escape-20261127/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A 2D canvas turkey escape game for the make.fun competition
[turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01) — "Make the
best turkey escape game".

Thanksgiving is coming. The farmer is coming faster. Run, jump, duck — and
do NOT become dinner.

## How to play

Serve `game/` with any static HTTP server and open `game/index.html` in a
desktop browser. No network, no build step.

- **Jump:** SPACE / W / ↑ / click
- **Duck & hide:** ↓ / S — duck inside a haystack to lose the farmer
- **Pause:** P — **Mute:** M — **Restart:** R

Grab corn for points, dodge fences, hay bales, pumpkins, rolling pins and
pots, duck under the big carving knife, jump the oven's heat waves, and
reach the forest gate at 1200 m to escape. The farmyard gives way to the
kitchen at 700 m, where the farmer closes in faster and the dangers come
thicker.

## What's in here

- `game/` — the game itself: `index.html` plus one clear job per file
  under `js/` (tuning, audio, input, the turkey, the farmer, the world,
  rendering, the game loop, bootstrap).
- `screenshots/` — four real renders of the game in a browser.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/`
  into the output directory and writes `dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

Built as a revision of "The Great Turkey Getaway": the playfield is full
of farm and kitchen detail, the turkey and the farmer never merge into
one blob, the knife is big and arcing, the oven glows with flames, and
the haystack hide is shown in play.

## License

MIT — see [LICENSE](LICENSE).
