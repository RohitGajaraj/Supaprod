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
/*
 * ── THE INSTRUMENT HAS A VERSION, AND A DELTA ACROSS VERSIONS IS NOT A DELTA ─
 *
 * This number changed meaning twice in two days. `React.lazy` visibility took
 * components 80 -> 44; S1's correction (a component reached through its parent
 * is not unreachable) took 44 -> 27 AT THE SAME COMMIT. Neither was a deletion.
 *
 * The baseline recorded both shifts by name, in prose, and a lane compared 80 to
 * 69 anyway and reported an improvement it had not earned. S2, who did it, put
 * the fix better than the note did: **a note explains a number; not printing a
 * misleading one is better than explaining it afterwards.**
 *
 * So the instrument is versioned. The version is stamped into the baseline when
 * it is frozen, printed beside every count so a number quoted elsewhere carries
 * its instrument with it, and CHECKED before any delta is printed. If the
 * baseline was measured by a different version, this refuses to print
 * IMPROVED/Holding at all and says why, because "components 44 -> 27" across a
 * rule change is not a fall in debt and must not be readable as one.
 *
 * BUMP THIS whenever detection changes what counts, and re-freeze in the same
 * commit. Do not bump it for output or comment changes: a version that moves
 * when the meaning did not is a version nobody trusts.
 */
const INSTRUMENT = 3; // 1: original · 2: React.lazy visible · 3: internally-rendered exports separated

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

/*
 * A DYNAMIC IMPORT THAT NAMES ITS EXPORT IS AN IMPORT, AND THIS GATE COULD NOT SEE ONE.
 *
 * Every lazily mounted panel in this product is written the same way:
 *
 *   const AgentRosterPanel = React.lazy(() =>
 *     import("@/components/governance/AgentRosterPanel").then((m) => ({
 *       default: m.AgentRosterPanel,
 *     })),
 *   );
 *
 * `importedBy` was built from `import { X } from "..."` alone, so the name was
 * never registered and the component read as an orphan. Six files mount panels
 * this way, and the warning has been carried by hand from session to session
 * ever since -- "ten of the eighty it lists are mounted, do NOT hand that list
 * to anyone as a backlog." A list that has to travel with a verbal caveat is a
 * list nobody can act on, which is the whole point of the gate.
 *
 * The `.then` form NAMES the export, so this is exact rather than heuristic: it
 * registers precisely the identifier the mount uses, and a lazy import that
 * pulls a module without naming an export is still handled by `dynamic` below.
 */
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(
    /import\(\s*["'][^"']+["']\s*\)\s*\.then\s*\(\s*\(?\s*(\w+)\s*\)?\s*=>[\s\S]{0,80}?\bdefault\s*:\s*\1\.([A-Za-z0-9_]+)/g,
  )) {
    const name = m[2];
    if (!importedBy.has(name)) importedBy.set(name, new Set());
    importedBy.get(name).add(f);
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

/*
 * A NOTE ON A ROW IS NOT AN EXCUSE FOR IT.
 *
 * `notes` in the baseline attaches a determined reason to an orphan BY NAME. It
 * is printed here and changes NOTHING about the count, because the count going
 * down is the only thing that means the debt went down.
 *
 * It exists because S2 asked for `getLineageCounts` to be marked "staged ahead
 * of a surface", so a later lane scanning this list would not read it as dead
 * weight and delete it. That risk is real -- this file already warns that an
 * orphan is not a delete order -- and the answer is to say WHICH of the three
 * things a row is, for the ones somebody has actually determined, while leaving
 * it in the number that gets it wired.
 *
 * The imports it uses are declared further down beside the ratchet. ES module
 * imports are hoisted, so that is fine; the path is recomputed rather than
 * reusing BASE_DIR, which is a `const` declared below this line and therefore
 * still in its temporal dead zone here.
 */
let notes = {};
try {
  notes =
    JSON.parse(
      readBaseline(
        joinBaseline(
          dirnameBaseline(fileURLToPathBaseline(import.meta.url)),
          "..",
          "unreachable-baseline.json",
        ),
        "utf8",
      ),
    ).notes ?? {};
} catch {
  notes = {};
}
const noteFor = (o) => {
  const n = notes[`${o.file}::${o.name}`];
  return n ? `\n      ${n}` : "";
};

console.log("\nEvery orphan:");
for (const o of orphans) console.log(`  ${o.name}  (${o.file})${noteFor(o)}`);

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
const componentExcused = [];
/*
 * ── EXPORTED FOR A TEST, RENDERED BY ITS OWN FILE ──────────────────────────
 *
 * S1 traced two of this half's rows and found both reachable by a person
 * opening a route: `/ship` imports `WhatShipped`, which renders
 * `AssembledRelease`, which renders `ReleaseDocument`. The only thing importing
 * either ACROSS a file boundary is `WhatShipped.test.tsx`. So they are exported
 * for their test and rendered internally by a reachable parent, and this half
 * asked "does another FILE import this" -- right for a server function, wrong
 * for a component.
 *
 * MEASURED BEFORE CHANGING ANYTHING: 17 of the 45 rows are in this class. 38%.
 * S1 verified two and said explicitly they would not guess at the size; the
 * size is why this is worth a change rather than a note.
 *
 * AND THE TOOL ALREADY SAID SO IN PROSE. The printout below has carried "a
 * helper component that is exported but used only inside its own file counts
 * here, which is a hygiene question rather than a screen nobody can reach"
 * since this half was written. It warned, and then counted them anyway. That is
 * this file's OWN lesson from the React.lazy fix, unlearned one section later:
 * "a list that has to travel with a verbal caveat is a list nobody can act on."
 *
 * So they are separated rather than excused: still printed, because an
 * unnecessary export IS a smell, and no longer counted, because the number is
 * supposed to mean "cannot be reached by anything a person opens" and for these
 * it does not.
 *
 * THIS CHANGES THE INSTRUMENT, exactly as the React.lazy fix did. The count
 * falls because the gate got better, not because anything was deleted, and
 * `_components_dropped_from_80` in the baseline exists to stop somebody
 * comparing across such a change. A second such note now sits beside it.
 */
const componentSelfUsed = [];
let componentTotal = 0;
for (const f of files.filter((f) => /^src\/components\/.*\.tsx$/.test(f))) {
  const src = readFileSync(f, "utf8");
  /*
   * The same exclusion the server half already applies, which this half never
   * did: a module pulled in wholesale by a dynamic import has every export
   * reachable, whether or not the mount happens to name it.
   */
  const isDynamic = [...dynamic].some(
    (d) => f === `src/${d}.tsx` || f === `src/${d}` || f.endsWith(`/${d}.tsx`),
  );
  for (const m of src.matchAll(/export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9_]*)/g)) {
    componentTotal += 1;
    const name = m[1];
    const users = [...(importedBy.get(name) ?? [])].filter((u) => u !== f);
    if (users.length > 0) continue;
    if (isDynamic) {
      componentExcused.push({ name, file: f });
      continue;
    }
    /*
     * Is it referenced AGAIN in its own file, past the declaration?
     *
     * The declaration is removed first, or every component matches itself. What
     * counts as a reference is a JSX mount `<Name`, a call `Name(`, or a bare
     * mention in a map/record -- the three ways a parent in the same file
     * actually reaches it.
     */
    const withoutDecl = src
      .replace(new RegExp(`export\\s+(?:default\\s+)?function\\s+${name}\\b`, "g"), "")
      .replace(new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`, "g"), "");
    const selfUsed = new RegExp(
      `<${name}[\\s/>]|\\b${name}\\s*\\(|\\{\\s*${name}\\s*\\}|:\\s*${name}\\b`,
    ).test(withoutDecl);
    (selfUsed ? componentSelfUsed : componentOrphans).push({ name, file: f });
  }
}

const compByFile = new Map();
for (const o of componentOrphans) compByFile.set(o.file, (compByFile.get(o.file) ?? 0) + 1);

console.log(
  `\n${componentOrphans.length} of ${componentTotal} exported components in src/components ` +
    `have NO importer.  [instrument v${INSTRUMENT}]`,
);
console.log(
  `${componentExcused.length} more are mounted through a dynamic import and are NOT counted.`,
);
console.log(
  `${componentSelfUsed.length} more are exported but rendered INSIDE THEIR OWN FILE, so they are\n` +
    "  reachable whenever that file is, and are NOT counted. The export is usually there for a test.\n" +
    "  That is a hygiene question, not a screen nobody can reach, and the two are different debts.",
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
for (const o of componentOrphans) console.log(`  ${o.name}  (${o.file})${noteFor(o)}`);

/*
 * PRINTED, NOT COUNTED. Not failing the gate is not the same as being fine:
 * an export nothing outside the file uses can usually go, and the test can
 * render through the parent instead. It is simply not the defect this number
 * is about, and mixing the two dilutes the one that matters.
 */
if (componentSelfUsed.length) {
  console.log("\nExported but only used inside their own file (hygiene, not reach):");
  for (const o of componentSelfUsed) console.log(`  ${o.name}  (${o.file})`);
}

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
  /*
   * ── AND IT MUST NAME THE NEWCOMER ──────────────────────────────────────
   *
   * The ratchet above fired for real on 2026-09-01 -- server functions
   * 140 -> 142, components 44 -> 45 -- and said only that. Three things had
   * become unreachable and the gate named none of them, so the lane that
   * caused it could not find out what it did without re-deriving a
   * 142-entry list by hand and diffing it against a number.
   *
   * That is the SAME defect this file's own comment above is about, one
   * level up: a comparison computed and never printed. The counts were
   * compared; the names were in memory at that instant and thrown away.
   *
   * So the baseline now freezes SORTED NAMES as well, keyed `file::name`
   * because `getMeeting` is not unique across files, and a rise prints
   * exactly what is new. `_namesFrozenAt` records when, so a stale name
   * list is visible rather than silently trusted.
   *
   * BACKWARD COMPATIBLE ON PURPOSE: a baseline with no name arrays still
   * gates on counts and says the names are absent. A gate that starts
   * refusing because its own baseline is a version behind is a gate
   * somebody reverts, which is the lesson the counts ratchet already
   * learned.
   */
  const keyOf = (o) => `${o.file}::${o.name}`;
  const fnKeys = orphans.map(keyOf).sort();
  const compKeys = componentOrphans.map(keyOf).sort();

  const newcomers = (current, frozenNames) => {
    if (!Array.isArray(frozenNames)) return null;
    const was = new Set(frozenNames);
    return current.filter((k) => !was.has(k));
  };

  const over = [];
  const added = [];
  if (orphans.length > frozen.serverFunctions) {
    over.push(
      `server functions ${frozen.serverFunctions} -> ${orphans.length}`,
    );
    const n = newcomers(fnKeys, frozen.serverFunctionNames);
    if (n === null) added.push(["server functions", null]);
    else for (const k of n) added.push(["server function", k]);
  }
  if (componentOrphans.length > frozen.components) {
    over.push(`components ${frozen.components} -> ${componentOrphans.length}`);
    const n = newcomers(compKeys, frozen.componentNames);
    if (n === null) added.push(["components", null]);
    else for (const k of n) added.push(["component", k]);
  }
  if (over.length) {
    const named = added.filter(([, k]) => k !== null);
    const unnamed = added.filter(([, k]) => k === null);
    console.error(
      `\nUNREACHABLE COUNT ROSE: ${over.join(", ")}.\n` +
        "Something exported is imported by nothing. That is finished work that never\n" +
        "reached a screen, which is the most common defect found on these surfaces and\n" +
        "is invisible to tsc, eslint, the build and the tests.\n" +
        "If the rise is deliberate, lower nothing and say why; otherwise wire it up.",
    );
    if (named.length) {
      console.error("\nNEW SINCE THE BASELINE -- these are the ones to read:");
      for (const [kind, k] of named) {
        const [file, name] = k.split("::");
        console.error(`  ${name}  (${file})   [${kind}]`);
      }
    }
    for (const [kind] of unnamed) {
      console.error(
        `\nCannot name the new ${kind}: the baseline has no name list for them.\n` +
          "Add one by re-freezing (see e2e/unreachable-baseline.json).",
      );
    }
    process.exit(1);
  }
  /*
   * A DELTA IS ONLY A DELTA WITHIN ONE INSTRUMENT.
   *
   * `over` above still fires on a version mismatch, deliberately: a rise might
   * be real and failing loudly is the safe direction. `under` and `Holding` do
   * not, because both READ AS GOOD NEWS and neither can be true across a rule
   * change. A baseline from another version has to be re-measured, not compared.
   */
  const frozenInstrument = typeof frozen._instrument === "number" ? frozen._instrument : null;
  if (frozenInstrument !== INSTRUMENT) {
    console.error(
      `\nREFUSING TO REPORT A CHANGE: the baseline was measured by instrument ` +
        `v${frozenInstrument ?? "unknown"} and this is v${INSTRUMENT}.\n` +
        "What counts as unreachable is not the same on both sides, so the difference\n" +
        "between the two numbers is not a rise or a fall in debt and must not read as\n" +
        "one. Re-measure: run THIS detector against the tree of the commit the\n" +
        "baseline names, and freeze counts and names together.",
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
    /*
     * Re-freezing by hand is how a name list goes stale, so print it ready
     * to paste. Nothing here writes the file: the drop should be read by a
     * person before it is frozen, or the gate ratchets down over a deletion
     * as happily as over a fix.
     */
    console.log(
      "\nRe-freeze with these, once you have read WHY the count dropped:\n" +
        JSON.stringify(
          {
            serverFunctions: orphans.length,
            components: componentOrphans.length,
            serverFunctionNames: fnKeys,
            componentNames: compKeys,
          },
          null,
          2,
        ),
    );
  } else {
    console.log(
      `\nHolding at ${orphans.length} server functions and ${componentOrphans.length} components with no importer.`,
    );
  }
}
