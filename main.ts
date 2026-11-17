// TIDEWARDEN — best-game-01 round 5 entry (Node 22, standard library only).
// Copies this directory's game/ and screenshots/ into /output and writes
// /output/dossier.json, the summary the judge reads, via the vendored make.fun library.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Never deletes /output itself: only the game/ and screenshots/ contents inside it
// are emptied before the fresh copy, so two runs write identical bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function emptyDirContents(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) rmSync(join(dir, entry), { recursive: true, force: true });
}

mkdirSync(out, { recursive: true });
const gameOut = join(out, 'game');
const shotsOut = join(out, 'screenshots');
mkdirSync(gameOut, { recursive: true });
mkdirSync(shotsOut, { recursive: true });
emptyDirContents(gameOut);
emptyDirContents(shotsOut);
cpSync(join(here, 'game'), gameOut, { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), shotsOut, { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
