/**
 * Re-freeze the Meridian ratchet baseline. `bun run design:ratchet`
 *
 * RUN THIS TO RECORD DEBT YOU HAVE REMOVED, never to silence a failure. The
 * ratchet failing on a NEW file or a GROWN count is the guard doing its job;
 * widening the baseline to make that pass is the one move that breaks it, and
 * it breaks it permanently and silently.
 *
 * The script prints what it is about to do and refuses to raise any count, so
 * the wrong use is not merely discouraged, it is unavailable.
 */

import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  REPO_ROOT,
  SCAN_SCOPES,
  scan,
  scopeIdFor,
  totalDebt,
  type DebtLedger,
} from "../src/__tests__/meridian-ratchet-scan";

const BASELINE_PATH = join(REPO_ROOT, "src/__tests__/meridian-ratchet.baseline.json");

const recorded = existsSync(BASELINE_PATH)
  ? (JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as {
      files?: DebtLedger;
      scopes?: unknown;
    })
  : {};
const previous: DebtLedger = recorded.files ?? {};
const current = scan();

const first = Object.keys(previous).length === 0;
const grew: string[] = [];
const shrank: string[] = [];
const newlyMeasured: string[] = [];
const adopted: string[] = [];

/*
 * WIDENING THE GUARD IS NOT RAISING THE DEBT, and telling the two apart is the
 * whole subtlety of this script.
 *
 * When a marker is ADDED to the scanner -- as `import:shell/primitives` was on
 * 2026-08-15, after the first version was found to report a file as clean while
 * it composed entirely from retired components -- every file's count for that
 * marker goes from an implicit zero to its real value. That looks identical to
 * debt being added, and the refusal below would block it forever, which would
 * mean THE GUARD COULD NEVER BE MADE HONEST once shipped.
 *
 * So a marker the baseline has never recorded ANYWHERE is treated as newly
 * measured rather than newly incurred. It was always there; nothing was
 * counting it. A marker the baseline already knows about may still only go
 * down, which is the rule that does the work.
 */
const knownMarkers = new Set(Object.values(previous).flatMap((f) => Object.keys(f)));

/*
 * THE SAME ARGUMENT, ONE LEVEL UP: A WHOLE FILE TYPE COMING INTO SCOPE.
 *
 * On 2026-08-18 the scanner began reading stylesheets, having said in its own
 * header for three days that `src/styles.css` was a thing it "does not read".
 * That is the same class of event as adding a marker: 2,339 occurrences went
 * from an implicit zero to their real value without one line of CSS changing.
 *
 * But it cannot be waved through the way a new marker is, because RULE 1 says a
 * file the baseline has never seen must be BORN CLEAN. If every unseen file
 * were treated as newly measured, that rule would evaporate: anyone could add a
 * new component full of `--sp-*` and have it adopted on the next run.
 *
 * So the door is cut as narrowly as it can be and still open: a file is newly
 * measured only when its EXTENSION is one the baseline has never held. A `.css`
 * file qualifies exactly once -- the first run after the scanner learned to read
 * them -- and from the next run onward `.css` is a known extension and every
 * stylesheet is held to rule 1 like everything else. The door shuts behind
 * itself, with no flag for anyone to reach for later.
 */
const knownExtensions = new Set(Object.keys(previous).map((f) => f.slice(f.lastIndexOf("."))));
const inNewScope = (file: string) => !knownExtensions.has(file.slice(file.lastIndexOf(".")));

/*
 * ── AND THE SAME ARGUMENT AGAIN, FOR A WHOLE AREA OF THE TREE ───────────
 *
 * Ruled 2026-08-21, after this script refused to widen `SCAN_ROOTS` to cover the
 * files sitting directly in `src/` and the refusal was allowed to stand.
 *
 * THE GAP. This script could not tell "the code got worse" from "the scanner got
 * better", and that gap recurs every single time the guard's eyes widen. It has
 * now been hit three times: a new marker, a new file extension, and a new area of
 * the tree. **A one-time adopt that records a newly-scanned file at its current
 * count is a different operation from raising a count on a file already scanned,
 * and only the second is the forbidden move.**
 *
 * WHY IT COULD NOT BE READ OFF THE BASELINE. The baseline records files that
 * carry debt. A clean file and a file nobody looked at are both simply absent, so
 * "has no key" cannot mean "never scanned" -- if it did, rule 1 would evaporate
 * and a brand-new component full of `--sp-*` would be adopted on the next run.
 * That is exactly why the extension trick above is cut so narrowly.
 *
 * WHAT MAKES IT STRUCTURAL. The scanner now NAMES its coverage (`SCAN_SCOPES`)
 * and the baseline records the scope ids it was frozen under. A file is newly
 * scanned when its scope is one the baseline has never held. There is no flag to
 * pass and no path to exempt -- both were rejected when this was ruled, because
 * the precedent is created by the override, not by the mechanism -- and the door
 * shuts behind itself: the scope is written into the baseline by this same run,
 * so from the next run every file in it is held to rule 1 like everything else.
 *
 * THE ONE ASSUMPTION, AND IT IS SPENT AFTER THIS RUN. A baseline written before
 * scopes existed records none, so the known set is INFERRED as the scopes that
 * already own at least one recorded file. On the 2026-08-21 baseline that yields
 * exactly the four legacy scopes (`src/components/**` 176 files, `src/routes/**`
 * 46, `src/styles/**` 5, `src/styles.css` 1) and correctly leaves `src/*` unknown.
 * It would be wrong only for a scope that was genuinely covered and had zero debt
 * anywhere in it, which is not true of any scope today, and cannot arise again
 * because from here on the list is explicit.
 */
const recordedScopes: string[] | undefined = Array.isArray(recorded.scopes)
  ? recorded.scopes.filter((s): s is string => typeof s === "string")
  : undefined;

const knownScopes = new Set(
  recordedScopes ??
    SCAN_SCOPES.filter((s) => Object.keys(previous).some((f) => scopeIdFor(f) === s.id)).map(
      (s) => s.id,
    ),
);

const newScopes = SCAN_SCOPES.filter((s) => !knownScopes.has(s.id)).map((s) => s.id);

/*
 * Both conditions, and the second is not redundant defensiveness: a file with a
 * baseline key was demonstrably scanned before, whatever its scope id says today,
 * so it can only ever go down. That keeps a renamed scope id from adopting files
 * the baseline already holds.
 */
const newlyScanned = (file: string) => {
  const id = scopeIdFor(file);
  return id !== undefined && !knownScopes.has(id) && !(file in previous);
};

for (const file of new Set([...Object.keys(previous), ...Object.keys(current)])) {
  const markers = new Set([
    ...Object.keys(previous[file] ?? {}),
    ...Object.keys(current[file] ?? {}),
  ]);
  for (const m of markers) {
    const was = previous[file]?.[m] ?? 0;
    const now = current[file]?.[m] ?? 0;
    if (now > was) {
      if (!first && newlyScanned(file)) adopted.push(`  ${file}  ${m}: ${now}`);
      else if (!first && (!knownMarkers.has(m) || inNewScope(file)))
        newlyMeasured.push(`  ${file}  ${m}: ${now}`);
      else grew.push(`  ${file}  ${m}: ${was} -> ${now}`);
    }
    if (now < was) shrank.push(`  ${file}  ${m}: ${was} -> ${now}`);
  }
}

if (adopted.length > 0) {
  console.log(
    [
      "",
      `FILES ARE BEING SCANNED FOR THE FIRST TIME (${adopted.length} ${
        adopted.length === 1 ? "entry" : "entries"
      }).`,
      "This is a COVERAGE EXPANSION, not a rise. These files were never looked",
      "at, so they are adopted at the count they already carry. Nothing was",
      "added; the guard's eyes widened.",
      "",
      `  scopes newly covered : ${newScopes.join(", ")}`,
      "",
      ...adopted.slice(0, 12),
      adopted.length > 12 ? `  ... and ${adopted.length - 12} more` : "",
      "",
      "From the next run these scopes are known, so every file in them is held",
      "to rule 1 like everything else: born clean, and it may only go down.",
      "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

if (newlyMeasured.length > 0) {
  console.log(
    [
      "",
      `A NEW MARKER IS BEING MEASURED FOR THE FIRST TIME (${newlyMeasured.length} entries).`,
      "This RAISES the recorded total without any debt having been added: the",
      "scanner simply started counting something that was always there. The",
      "baseline is being made more honest, not more permissive.",
      "",
      ...newlyMeasured.slice(0, 8),
      newlyMeasured.length > 8 ? `  ... and ${newlyMeasured.length - 8} more` : "",
      "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

if (!first && grew.length > 0) {
  console.error(
    [
      "",
      "REFUSING TO WRITE. This would RAISE the permitted debt:",
      "",
      ...grew,
      "",
      "The baseline only ever moves down. If a file genuinely needs more",
      "retired vocabulary, the honest answer is almost always that Meridian is",
      "missing something -- build it there instead. See",
      "docs/design/DESIGN-SYSTEM.md.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

writeFileSync(
  BASELINE_PATH,
  `${JSON.stringify(
    {
      _comment: [
        "THE MERIDIAN RATCHET BASELINE. Generated by `bun run design:ratchet`.",
        "This is the retired-design-system debt each file is permitted to carry.",
        "It only ever moves DOWN. A file absent from this list must be clean.",
        "Do not hand-edit; do not regenerate to silence a failure.",
        "`scopes` is what the scanner LOOKED AT when this was frozen. A file in a",
        "scope listed here may only go down. A file in a scope that is not listed",
        "has never been scanned, so it is adopted once at its current count.",
      ],
      scopes: SCAN_SCOPES.map((s) => s.id).sort((a, b) => a.localeCompare(b)),
      totalOccurrences: totalDebt(current),
      fileCount: Object.keys(current).length,
      files: Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b))),
    },
    null,
    2,
  )}\n`,
);

console.log(
  [
    "",
    first ? "Meridian ratchet baseline created." : "Meridian ratchet baseline re-frozen.",
    `  files carrying debt : ${Object.keys(current).length}`,
    `  total occurrences   : ${totalDebt(current)}`,
    shrank.length > 0 ? `  reclaimed this pass : ${shrank.length} counts` : "",
    "",
    ...shrank.slice(0, 20),
    shrank.length > 20 ? `  ... and ${shrank.length - 20} more` : "",
    "",
  ]
    .filter(Boolean)
    .join("\n"),
);
