// The Great Turkey Escape — entrypoint.
//
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with the kit's buildDossier,
// exactly as the competition's scorer rebuilds it. Runs on Node 22 with
// no install and no network. Both grader runs must write the same bytes,
// so every step below is deterministic: fixed copy order, no timestamps.
//
// The output directory is only ever created, never deleted: the grader
// mounts it and runs this program as an unprivileged user, so removing
// it fails with permission denied and fails the whole grade.
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

function copyTree(src: string, dest: string): void {
  // mkdir first: the destination may already exist from a previous
  // run in the same output directory, and that is fine.
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, "game"), join(outDir, "game"));
copyTree(join(repoRoot, "screenshots"), join(outDir, "screenshots"));

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
