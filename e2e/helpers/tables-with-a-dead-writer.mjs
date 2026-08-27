/**
 * A TABLE WITH A LIVE WRITER AND AN ORPHANED ONE.
 *
 * The raw orphan list (unreachable-server-functions.mjs) is 141 rows and S2, S3
 * and I established that a row on it is one of three things: a gap, something
 * staged ahead of a surface, or dead weight. This narrows it to the subset where
 * the answer is most often "gap or dead weight" and almost never "staged": a
 * table that ALREADY has a working writer, plus a second writer nothing calls.
 *
 * ── WHY MULTI-WRITER ALONE IS NOT THE SIGNAL ───────────────────────────────
 * 36 of 117 written tables are written from more than one module, and that is
 * mostly correct. `artifact_lineage` has TWELVE writers because every station
 * legitimately records lineage. Reporting that as a defect would be the
 * over-claiming this harness exists to catch.
 *
 * The signal is a LIVE writer and a DEAD one for the same table. That is a
 * duplicate path where one copy won and the other was left behind, and the
 * shape S4 found by hand on product bindings before writing this:
 *
 *   connection_bindings
 *     live:  upsertBinding, removeBinding, addProductBinding
 *     dead:  upsertProductBinding, removeProductBinding, listProducts
 *
 * ── WHAT THE PAIRING DOES AND DOES NOT MEAN ───────────────────────────────
 * "Live writer plus dead writer" does NOT mean the dead one duplicates the live
 * one. It means the TABLE is in use and this OPERATION has no caller. Both
 * happen and they need opposite fixes:
 *
 *   connection_bindings   a genuine duplicate. upsertProductBinding does what
 *                         addProductBinding already does. One copy won.
 *   missions              NOT a duplicate. renameMission appears exactly once in
 *                         the repo, its own definition, and nothing else renames
 *                         a mission. The operation is simply unreachable.
 *
 * A duplicate gets deleted. An unwired operation gets a surface, or gets deleted
 * deliberately. Reading the row is what tells you which.
 *
 * ── WHAT TO LOOK FOR IN THE OUTPUT ─────────────────────────────────────────
 * An EDIT operation on the dead side is the most interesting row, because it
 * usually means a person cannot do that thing at all: `updateTask`,
 * `renameMission` and `updateProject` all appear with no caller. Either the
 * surface was never built, or it was built against the other writer.
 *
 * Usage:  bun run e2e/helpers/tables-with-a-dead-writer.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const all = walk("src").filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.|__tests__/.test(f));

const importedBy = new Map();
for (const f of all) {
  for (const m of readFileSync(f, "utf8").matchAll(
    /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'][^"']+["']/g,
  )) {
    for (const raw of m[1].split(",")) {
      const n = raw
        .trim()
        .split(/\s+as\s+/)[0]
        .trim();
      if (n) (importedBy.get(n) ?? importedBy.set(n, new Set()).get(n)).add(f);
    }
  }
}

// For each server function, the tables it writes.
const fnWrites = [];
for (const f of all.filter((f) => /\.functions\.ts$/.test(f))) {
  const src = readFileSync(f, "utf8");
  const marks = [...src.matchAll(/export\s+const\s+([A-Za-z0-9_]+)\s*=\s*createServerFn/g)];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : src.length;
    const body = src.slice(start, end);
    const tables = new Set();
    for (const m of body.matchAll(/\.from\(\s*["'`]([a-z_]+)["'`][^)]*\)([\s\S]{0,200})/g)) {
      if (/\.(insert|update|upsert|delete)\s*\(/.test(m[2])) tables.add(m[1]);
    }
    const users = [...(importedBy.get(marks[i][1]) ?? [])].filter((u) => u !== f);
    if (tables.size) fnWrites.push({ name: marks[i][1], file: f, tables, live: users.length > 0 });
  }
}

const byTable = new Map();
for (const w of fnWrites)
  for (const t of w.tables) (byTable.get(t) ?? byTable.set(t, []).get(t)).push(w);

const suspect = [];
for (const [table, ws] of byTable) {
  const live = ws.filter((w) => w.live);
  const dead = ws.filter((w) => !w.live);
  if (live.length && dead.length) suspect.push({ table, live, dead });
}
suspect.sort((a, b) => b.dead.length - a.dead.length);

console.log(`${suspect.length} tables have BOTH a live writer and an orphaned writer.\n`);
for (const s of suspect.slice(0, 10)) {
  console.log(`  ${s.table}`);
  console.log(
    `      live:   ${s.live
      .map((w) => w.name)
      .slice(0, 4)
      .join(", ")}`,
  );
  console.log(
    `      dead:   ${s.dead
      .map((w) => w.name)
      .slice(0, 4)
      .join(", ")}`,
  );
}
