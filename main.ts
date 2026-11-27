// Entry point for The Great Turkey Getaway (make.fun turkey-run-game-01).
// One job: hand the game in. It copies game/ and screenshots/ from this
// repository into the output directory and writes dossier.json there,
// built from those same files with the kit's dossier library.
// Node 22 standard library only; nothing is installed or fetched.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const DOSSIER_TEXT_MAX_BYTES = 163840;
const SCREENSHOTS_MAX = 4;
const SCREENSHOT_MAX_BYTES = 262144;

async function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
  const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

  const gameDir = join(repoRoot, "game");
  const shotsDir = join(repoRoot, "screenshots");
  if (!existsSync(gameDir)) throw new Error("game/ is missing from the repository");
  if (!existsSync(shotsDir)) throw new Error("screenshots/ is missing from the repository");

  mkdirSync(outputDir, { recursive: true });
  cpSync(gameDir, join(outputDir, "game"), { recursive: true });
  cpSync(shotsDir, join(outputDir, "screenshots"), { recursive: true });

  const dossier = await buildDossier(repoRoot, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOTS_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
  });
  writeFileSync(join(outputDir, "dossier.json"), Buffer.from(dossier));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
