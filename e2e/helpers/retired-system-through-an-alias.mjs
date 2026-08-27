/**
 * DRAWING IN THE RETIRED SYSTEM, THROUGH AN ALIAS, PAST EVERY GUARD.
 *
 * S3 found this class and handed me the one-line probe for it. CLAUDE.md says the
 * Meridian ratchet is enforced rather than requested: `bun test` fails if a NEW
 * file carries a retired token, and fails if an EXISTING file grows its count.
 *
 * `meridian-ratchet-scan.ts:200` lists what it matches, and every entry is a
 * LITERAL: `--sp-`, `--ds-`, `--text-`, `--hairline`, `--madder`, `--glacier`,
 * `--font-pixel`, `--raised`, `data-obsidian`.
 *
 * `src/styles.css` then defines 59 OTHER names as `var(--ds-...)`: `--canvas`,
 * `--rose`, `--amber`, `--agent`, `--card`, `--ink`, `--emerald` and the rest. A
 * component writing `var(--canvas)` is drawing from the retired v3 palette, and
 * the ratchet counts ZERO, because one level of indirection is all it takes.
 *
 * ── WHY THIS IS WORSE THAN AN UNGUARDED FILE ───────────────────────────────
 * The ratchet's whole design is that debt cannot grow. Through an alias, debt is
 * invisible to it: a brand new file can be written entirely in the retired system
 * today and pass green. The guard is not weakened, it is BYPASSED, and nothing in
 * the output says so.
 *
 * Aliases that ARE one of the ratchet's own markers are excluded here, because
 * counting them would overstate the blind spot. `--glacier` is one of those.
 *
 * Usage:  bun run e2e/helpers/retired-system-through-an-alias.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const aliases = new Set();
// The ratchet's own literal markers. An alias matching one of these is ALREADY
// caught, so counting it here would overstate the blind spot.
const CAUGHT = [
  /^--sp-/,
  /^--ds-/,
  /^--text-/,
  /^--hairline$/,
  /^--madder/,
  /^--glacier/,
  /^--font-pixel$/,
  /^--raised$/,
];
for (const m of readFileSync("src/styles.css", "utf8").matchAll(
  /^\s*(--[a-z0-9-]+)\s*:\s*var\(\s*--ds-/gm,
)) {
  if (CAUGHT.some((re) => re.test(m[1]))) continue;
  aliases.add(m[1]);
}

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk("src").filter(
  (f) => /\.(tsx|css)$/.test(f) && !/\.test\./.test(f) && f !== "src/styles.css",
);

const hits = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const a of aliases) {
    // var(--alias) used as a value, not a definition of it
    const re = new RegExp(`var\\(\\s*${a}\\b`, "g");
    const n = [...src.matchAll(re)].length;
    if (!n) continue;
    if (!hits.has(f)) hits.set(f, []);
    hits.get(f).push(`${a}x${n}`);
  }
}

console.log(`${aliases.size} aliases in src/styles.css resolve to the retired --ds-* system.`);
console.log(`${hits.size} files use at least one of them, and every one passes the ratchet.\n`);
for (const [f, list] of [...hits].sort((a, b) => b[1].length - a[1].length).slice(0, 15)) {
  console.log(`  ${f}`);
  console.log(`      ${list.slice(0, 6).join("  ")}`);
}
