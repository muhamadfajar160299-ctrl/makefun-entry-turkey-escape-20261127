# The Great Turkey Getaway

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/muhamadfajar160299-ctrl/makefun-entry-turkey-escape-20261127/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/muhamadfajar160299-ctrl/makefun-entry-turkey-escape-20261127/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A complete, original turkey escape game for make.fun's
[turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01) bounty.
Thanksgiving is coming and the farmer is coming faster: run Tom the turkey
from the farmyard, through the barn, across the kitchen — jump the fences,
duck the flying carving knives, mind the hot oven — and reach the forest
gate at 1400 m to escape becoming dinner.

## How to play

- **Jump:** `Space`, `W`, `↑`, or click / tap
- **Duck & hide:** hold `↓` or `S` — duck inside a haystack and the farmer loses your trail
- **Pause:** `P` — **Mute:** `M` — **Restart:** `R` or click on the end screen
- Grab corn for points. Each stumble lets the farmer close in; three hits
  (or the farmer catching up) ends the run. Clear all three stages to escape.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No network requests, no build step, no assets to download — all art
is drawn on canvas and all sound is synthesized with WebAudio.

```sh
python3 -m http.server 8080 --directory game
# open http://localhost:8080/
```

## Layout

- `main.ts` — the entry program (Node 22, stdlib only): copies `game/` and
  `screenshots/` to the output directory and writes `dossier.json`.
- `game/index.html` — the page that loads the game.
- `game/src/config.js` — tuning numbers and stage definitions.
- `game/src/audio.js` — synthesized sound effects (WebAudio, no files).
- `game/src/input.js` — keyboard and mouse input.
- `game/src/world.js` — obstacles, corn, haystacks, spawning, collisions.
- `game/src/farmer.js` — the chasing farmer and his search behaviour.
- `game/src/turkey.js` — the player: jumps, ducks, hurt state.
- `game/src/render.js` — every screen, drawn on canvas.
- `game/src/main.js` — state machine, loop, scoring, screenshot scenes.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `screenshots/` — real renders of the game's own code.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
