/**
 * SERVER FUNCTIONS NOTHING IMPORTS.
 *
 * S3 traced four Settings toggles end to end and found the preference saves, the
 * feed computes, and NO SURFACE RENDERS IT. Their words for the class, after
 * hitting it six times in one night: "a reader built for a consumer nobody
 * wrote". They suggested checking it by IMPORTER rather than by mention, because
 * their first pass returned zero orphans — it counted any occurrence of the name,
 * including inside the file's own comments.
 *
 * That is the check. For every `export const X = createServerFn`, count the files
 * that IMPORT X by name. Zero means the function exists, runs, has tests
 * sometimes, and cannot be reached by anything a person opens.
 *
 * ── WHY THIS IS A PRODUCT QUESTION AND NOT TIDINESS ────────────────────────
 * The operating model's defect is "three surfaces, not 119 routes". This is the
 * same defect measured from the server side: work that was built, works, and
 * reaches nobody. It is also the cheapest possible answer to "did we build a
 * thing or a demo of a thing".
 *
 * ── WHAT IT DELIBERATELY DOES NOT COUNT ────────────────────────────────────
 * A module that is DYNAMICALLY imported makes every one of its exports
 * potentially reachable, so functions inside those modules are excluded and the
 * exclusions are printed. Namespace imports would do the same; there are
 * currently none in this repo and the check says so rather than assuming it.
 *
 * ── VERIFIED TO DISCRIMINATE ───────────────────────────────────────────────
 * listMissions, listTracks, listLearnings, getCompounding, listStudioSessions and
 * decideDesignGate are all known to have callers and are all correctly excluded.
 * A check that flags everything is not a finding.
 *
 * Usage:  bun run e2e/helpers/unreachable-server-functions.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk("src").filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.|__tests__/.test(f));

/** Every name each file imports, from anywhere. */
const importedBy = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'][^"']+["']/g)) {
    for (const raw of m[1].split(",")) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)[0]
        .trim();
      if (!name) continue;
      if (!importedBy.has(name)) importedBy.set(name, new Set());
      importedBy.get(name).add(f);
    }
  }
}

/** Modules pulled in wholesale, whose every export is therefore reachable. */
const dynamic = new Set();
for (const f of files) {
  for (const m of readFileSync(f, "utf8").matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
    dynamic.add(m[1].replace(/^[.@]\//, "").replace(/^lib\//, ""));
  }
}
const namespaced = files.filter((f) =>
  /import\s+\*\s+as\s+\w+\s+from\s+["'][^"']*functions["']/.test(readFileSync(f, "utf8")),
);

let total = 0;
const orphans = [];
const excused = [];
for (const f of files.filter((f) => /\.functions\.ts$/.test(f))) {
  const src = readFileSync(f, "utf8");
  const isDynamic = [...dynamic].some((d) => f.endsWith(d) || f.includes(d.replace(/\.\w+$/, "")));
  for (const m of src.matchAll(/export\s+const\s+([A-Za-z0-9_]+)\s*=\s*createServerFn/g)) {
    total += 1;
    const name = m[1];
    const users = [...(importedBy.get(name) ?? [])].filter((u) => u !== f);
    if (users.length > 0) continue;
    (isDynamic ? excused : orphans).push({ name, file: f });
  }
}

const byFile = new Map();
for (const o of orphans) byFile.set(o.file, (byFile.get(o.file) ?? 0) + 1);

console.log(`${orphans.length} of ${total} server functions have NO importer in src/.`);
console.log(`${excused.length} more are inside dynamically imported modules and are NOT counted.`);
console.log(`${namespaced.length} files use a namespace import of a functions module.\n`);
console.log("Worst files:");
for (const [file, n] of [...byFile].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${String(n).padStart(2)}  ${file}`);
}
console.log("\nEvery orphan:");
for (const o of orphans) console.log(`  ${o.name}  (${o.file})`);
