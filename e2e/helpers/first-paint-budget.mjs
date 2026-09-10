/**
 * ── WHAT A SIGNED-IN PAGE MUST DOWNLOAD BEFORE IT CAN RUN ────────────────────
 *
 * THE INSTRUMENT, stated so the number can be re-checked rather than believed.
 *
 * It reads `.output/public/assets` after `bun run build` and walks the STATIC
 * import graph from the client entry (`index-*.js`), following only real
 * `import`/`from` edges between emitted chunks. That closure is what the
 * browser must have before the entry module can execute: every chunk in it is
 * `modulepreload`ed by the document and every one is fetched before first
 * paint. A dynamic `import()` is NOT an edge here, which is the point -- a
 * lazily mounted panel is not on this path and must not be counted as if it
 * were.
 *
 * WHY NOT TOTAL BUNDLE SIZE. The build emits about 4.5 MB across 300-odd
 * chunks, most of it route code that a given arrival never asks for. Quoting
 * that number as "what a page downloads" is the mistake this file exists to
 * stop: `DocsPanel` alone is 628 KB and is correctly lazy.
 *
 * WHY NOT THE SERVED PAGE ALONE. The served document's modulepreload list is
 * the truth for one URL and needs a browser and a session to read. This is the
 * same measurement without either, so it can run in CI and on any branch, and
 * the two agree: 64 chunks / 976 KB here against 111 preloads / 1,063 KB on
 * `/start`, the difference being that route's own chunk and its dependencies.
 *
 * Run: `bun run build && node e2e/helpers/first-paint-budget.mjs`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = ".output/public/assets";

function chunkGraph() {
  const files = new Set(readdirSync(DIR).filter((f) => f.endsWith(".js")));
  const edges = new Map();
  for (const f of files) {
    const src = readFileSync(join(DIR, f), "utf8");
    const deps = new Set();
    for (const re of [/from"\.\/([A-Za-z0-9_.\-]+\.js)"/g, /import"\.\/([A-Za-z0-9_.\-]+\.js)"/g]) {
      for (const m of src.matchAll(re)) if (files.has(m[1])) deps.add(m[1]);
    }
    edges.set(f, deps);
  }
  return { files, edges };
}

function closure(entry, edges) {
  const seen = new Set();
  const stack = [...entry];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const d of edges.get(f) ?? []) stack.push(d);
  }
  return seen;
}

const { files, edges } = chunkGraph();
const entry = [...files].filter((f) => f.startsWith("index-"));
if (entry.length !== 1) {
  console.error(`Expected exactly one index-*.js entry, found ${entry.length}. Did the build run?`);
  process.exit(1);
}
const reached = closure(entry, edges);
const sized = [...reached]
  .map((f) => ({ f, bytes: statSync(join(DIR, f)).size }))
  .sort((a, b) => b.bytes - a.bytes);
const total = sized.reduce((n, r) => n + r.bytes, 0);

console.log(`FIRST-PAINT BUDGET (static closure of ${entry[0]})`);
console.log(`  ${reached.size} chunks, ${Math.round(total / 1024)} KB`);
console.log(`  ${sized.filter((r) => r.bytes < 5120).length} of them under 5 KB`);
console.log(`  build total: ${files.size} chunks`);
console.log("\n  the ten heaviest on the path:");
for (const { f, bytes } of sized.slice(0, 10)) {
  console.log(`   ${String(Math.round(bytes / 1024)).padStart(5)} KB  ${f}`);
}
