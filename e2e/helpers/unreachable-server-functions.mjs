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
console.log(
  "\nAN ORPHAN IS NOT WASTE, AND THIS LIST IS NOT A DELETE ORDER.\n" +
    "  S3 found `getWorkspacePauseState` on a list like this one. Its own comment NAMED its\n" +
    '  intended consumer, "used by AppShell", and AppShell never imported it. A workspace pause\n' +
    "  holds every agent mid-step, so with the banner missing every empty queue in the product read\n" +
    "  as QUIET rather than HELD. They shipped the banner rather than deleting the function.\n" +
    "  So a row here is one of three things and only reading it tells you which: a gap worth\n" +
    "  closing, something staged ahead of a surface, or genuine dead weight.",
);

/*
 * THE HIGHEST-SIGNAL SUBSET: an orphan whose OWN COMMENT names a consumer.
 *
 * S3's `getWorkspacePauseState` is the case. Its comment said "used by AppShell"
 * and AppShell never imported it. That is different in kind from something staged
 * ahead of a surface: the author knew who was meant to call it, wrote it down,
 * and the wiring never happened. Nobody staged that deliberately.
 *
 * So these are ranked first. A row here is a promise the codebase made to itself
 * and did not keep, and it is the shortest path from this list to a real gap.
 */
const NAMES_A_CONSUMER =
  /\b(used by|rendered by|consumed by|called by|read by|powers|drives|feeds)\b/i;

function commentAbove(src, index) {
  const before = src.slice(0, index);
  const start = before.lastIndexOf("/**");
  if (start === -1) return "";
  const end = before.indexOf("*/", start);
  return end === -1 ? before.slice(start) : before.slice(start, end);
}

const claimed = [];
for (const o of orphans) {
  const src = readFileSync(o.file, "utf8");
  const at = src.indexOf(`export const ${o.name}`);
  const doc = at === -1 ? "" : commentAbove(src, at);
  const m = doc.match(NAMES_A_CONSUMER);
  if (m) {
    const line = doc
      .split("\n")
      .find((l) => NAMES_A_CONSUMER.test(l))
      ?.replace(/^\s*\*?\s*/, "")
      .trim();
    claimed.push({ ...o, why: line?.slice(0, 90) ?? m[0] });
  }
}

if (claimed.length) {
  console.log(
    `\n${claimed.length} of those name a consumer IN THEIR OWN COMMENT and still have no importer.\n` +
      "  These are the shortest path to a real gap: the author knew who should call it,\n" +
      "  wrote it down, and the wiring never happened. Read these first.",
  );
  for (const c of claimed) console.log(`  ${c.name}  (${c.file})\n      "${c.why}"`);
}

console.log("\nEvery orphan:");
for (const o of orphans) console.log(`  ${o.name}  (${o.file})`);

/*
 * THE SAME QUESTION ON THE CLIENT SIDE.
 *
 * S3 found AskInPlace at 176 lines with zero mounts, and RoomDetail, both by
 * hand. A component nobody imports is the same defect as a server function
 * nobody imports, and it is closer to the person: it is a screen, or a piece of
 * one, that was designed and built and can never be looked at.
 *
 * A route file is excluded because the ROUTER mounts it by convention rather
 * than by import, so "nothing imports it" is the normal and correct state there.
 * S4-068 already answered the route question a different way: nothing in the
 * router is dead.
 */
const componentOrphans = [];
let componentTotal = 0;
for (const f of files.filter((f) => /^src\/components\/.*\.tsx$/.test(f))) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9_]*)/g)) {
    componentTotal += 1;
    const name = m[1];
    const users = [...(importedBy.get(name) ?? [])].filter((u) => u !== f);
    if (users.length === 0) componentOrphans.push({ name, file: f });
  }
}

const compByFile = new Map();
for (const o of componentOrphans) compByFile.set(o.file, (compByFile.get(o.file) ?? 0) + 1);

console.log(
  `\n${componentOrphans.length} of ${componentTotal} exported components in src/components ` +
    `have NO importer.`,
);
console.log(
  "  THIS HALF IS NOISIER THAN THE SERVER HALF. A helper component that is exported but used only\n" +
    "  inside its own file counts here, which is a hygiene question rather than a screen nobody can\n" +
    "  reach. A file with several orphans is more likely a component library with unused exports\n" +
    "  than a lost feature. Read the file before believing the row.",
);
console.log("Worst files:");
for (const [file, n] of [...compByFile].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${String(n).padStart(2)}  ${file}`);
}
/*
 * PRINT THE WHOLE LIST, not just the worst files.
 *
 * The first version printed only the top ten files by count, and AskInPlace —
 * the component S3 found BY HAND at 176 lines with zero mounts — never appeared,
 * because its file has exactly one orphan. I spent four steps hunting a false
 * negative in the detection that did not exist: the check had found it and the
 * REPORT had hidden it.
 *
 * A summary that cannot show you the one row you are looking for is a summary
 * that will be trusted and should not be.
 */
console.log("\nEvery component orphan:");
for (const o of componentOrphans) console.log(`  ${o.name}  (${o.file})`);

/*
 * ── THE RATCHET ────────────────────────────────────────────────────────────
 *
 * This check found every one of the orphans another lane discovered by hand --
 * MessageMetaFooter, AskInPlace, LiveTicker, OutcomeHistory, AutoChip -- and
 * they called that class "the most common defect I have found, and completely
 * invisible to every gate we have."
 *
 * It was invisible because this script REPORTED and exited 0, and no gate ran
 * it. The detector existed, found everything, and told nobody. That is the
 * same shape as a baseline comparison computed and never printed.
 *
 * So it now fails on an INCREASE and never on the number itself: 141 and 80
 * are debt nobody in flight wrote, and a check that fails everywhere on the
 * day it is switched on is one somebody reverts.
 *
 * ANTI-VACUITY: if either population is zero the scan did not run, and a
 * scan of nothing must never report clean. That guard is here because a
 * sizing run earlier tonight reported "0 errors" from a compiler that had
 * died, and the zero looked exactly like a pass.
 */
import { readFileSync as readBaseline } from "node:fs";
import { join as joinBaseline, dirname as dirnameBaseline } from "node:path";
import { fileURLToPath as fileURLToPathBaseline } from "node:url";

const BASE_DIR = dirnameBaseline(fileURLToPathBaseline(import.meta.url));
let frozen;
try {
  frozen = JSON.parse(
    readBaseline(joinBaseline(BASE_DIR, "..", "unreachable-baseline.json"), "utf8"),
  );
} catch {
  frozen = null;
}

if (frozen) {
  const fnTotal = typeof total === "number" ? total : 0;
  const compTotal = typeof componentTotal === "number" ? componentTotal : 0;
  if (fnTotal === 0 || compTotal === 0) {
    console.error(
      "\nREFUSING: one of the populations is empty, so this scan did not run.\n" +
        "A scan of nothing reports clean, which is the one answer it must never give.",
    );
    process.exit(1);
  }
  const over = [];
  if (orphans.length > frozen.serverFunctions) {
    over.push(
      `server functions ${frozen.serverFunctions} -> ${orphans.length}`,
    );
  }
  if (componentOrphans.length > frozen.components) {
    over.push(`components ${frozen.components} -> ${componentOrphans.length}`);
  }
  if (over.length) {
    console.error(
      `\nUNREACHABLE COUNT ROSE: ${over.join(", ")}.\n` +
        "Something exported is imported by nothing. That is finished work that never\n" +
        "reached a screen, which is the most common defect found on these surfaces and\n" +
        "is invisible to tsc, eslint, the build and the tests.\n" +
        "If the rise is deliberate, lower nothing and say why; otherwise wire it up.",
    );
    process.exit(1);
  }
  const under = [];
  if (orphans.length < frozen.serverFunctions) {
    under.push(`server functions ${frozen.serverFunctions} -> ${orphans.length}`);
  }
  if (componentOrphans.length < frozen.components) {
    under.push(`components ${frozen.components} -> ${componentOrphans.length}`);
  }
  if (under.length) {
    console.log(
      `\nIMPROVED: ${under.join(", ")}. Lower the numbers in e2e/unreachable-baseline.json.`,
    );
  } else {
    console.log(
      `\nHolding at ${orphans.length} server functions and ${componentOrphans.length} components with no importer.`,
    );
  }
}
