// Neon Coast Cover Studio — entry program for make.fun gta6-cover-art-01.
// Node 22, standard library only. It hands the app in: it copies the app's
// static files and the screenshots from beside this file into the output
// directory, then writes the dossier the judge reads, built by the kit's
// vendored make.fun library. Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

// The repository root is the folder this file lives in.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));
// The grader writes to /output; anywhere else MAKEFUN_OUTPUT_DIR stands in.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The scorer's own caps for this bounty: only text_max_bytes shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

// Copy one tree from the repo into the output, replacing any earlier copy,
// so two runs of this program write the same bytes.
function handIn(name) {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) return false;
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
  return true;
}

mkdirSync(outputDir, { recursive: true });
const appIn = handIn("app");
const shotsIn = handIn("screenshots");
if (!appIn) throw new Error("app/ is missing from the repository");

// The dossier is byte for byte what the vendored library writes from the
// handed-in app/ and screenshots/; the gate rebuilds it the same way.
writeFileSync(join(outputDir, "dossier.json"), buildDossier(outputDir, DOSSIER_LIMITS));

console.log(
  `Neon Coast handed in: app/ ${appIn ? "copied" : "MISSING"}, ` +
  `screenshots/ ${shotsIn ? "copied" : "missing"}, dossier.json written to ${outputDir}`,
);
