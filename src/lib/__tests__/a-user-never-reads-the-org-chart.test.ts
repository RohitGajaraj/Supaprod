import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * NO SIGNED-IN SCREEN WEARS THE ORG CHART (P-13, A-QUEUE.md, 2026-09-02).
 *
 * The words below are internal vocabulary — what the seven-station loop calls
 * itself, what a lane calls its own coordination — and none of them are a
 * word a person would say back to us. R-13 already ruled the loop's own
 * stages are never a coordinate a reader is shown; this extends the same
 * rule to the words that describe the loop, not just its count.
 *
 * WHY THIS SCANS SOURCE TEXT WITH COMMENTS STRIPPED, RATHER THAN RENDERING.
 * The corpus of comments in this repo is enormous and DELIBERATELY quotes
 * every one of these words while explaining why they were removed — this
 * file itself is one more instance. A render-based check would need a
 * signed-in session against a seeded workspace for every surface in scope,
 * which is what `bun test` cannot do without a browser. A text scan can run
 * everywhere, every time, for free — the trade is that it must tell a
 * rendered string apart from a comment or an identifier, which is what the
 * two passes below do.
 *
 * ONE RULE FOR EVERY WORD: crew, bet, agentic, autonomous, orchestrat* and
 * station are ALL pervasive as CODE — variable names, types (`Bet`,
 * `AgentStation`), imports (`crewPulse`, `listCrew`), route paths (`/crew`)
 * — so a blanket ban on the bare word fails on code that renders nothing.
 * The manual sweep this file encodes found exactly that on its first pass:
 * 49 raw `crew|bet|agentic|autonomous` hits, all but two of them code or
 * comments. So every single-word check here is scoped to the handful of
 * prop names a signed-in person actually reads from — `title=`,
 * `aria-label=`, `label=`, `placeholder=`, `alt=`, `hint=`, `sub=`,
 * `thenWhat=` — which is the same rule applied by hand to find the two real
 * violations plus the "station" ones in TrackRun.tsx, WhatWereSolving.tsx,
 * OpenQuestions.tsx and the rest. "seven stations" and "Station N of M" are
 * left as blanket phrase matches: multi-word phrases like these do not occur
 * as code identifiers, so the scoping that single words need would only
 * hide a real one.
 */

const ROOT = join(import.meta.dir, "..", "..", "..");

const SCAN_DIRS = ["components/track", "components/spine", "components/today", "components/shell"];

const SCAN_FILES = ["routes/_authenticated.start.tsx", "routes/_authenticated.track.$trackId.tsx"];

/** Every non-test .ts/.tsx file under a directory, recursively. */
function filesUnder(dir: string, out: string[] = []): string[] {
  const abs = join(ROOT, "src", dir);
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      filesUnder(rel, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.test\.|__tests__/.test(rel)) continue;
    out.push(rel);
  }
  return out;
}

function allScannedFiles(): string[] {
  const fromDirs = SCAN_DIRS.flatMap((d) => filesUnder(d));
  const explicit = SCAN_FILES.filter((f) => {
    try {
      return statSync(join(ROOT, "src", f)).isFile();
    } catch {
      return false;
    }
  });
  return [...fromDirs, ...explicit];
}

/** Strip /* ... *\/ and // ... comments, keeping line numbers stable. */
function stripComments(src: string): string {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  return noBlock
    .split("\n")
    .map((line) => (line.trim().startsWith("//") ? "" : line))
    .join("\n");
}

const REGISTER_WORDS = /\b(crew|bet|agentic|autonomous)\b|orchestrat\w*/i;
const STATION_WORD = /\bstation\b/i;
const SEVEN_STATIONS = /seven stations/i;
const STATION_OF = /Station \d+ of \d+/i;
const LEDGER_ID = /\bF-\d+\b|\bS0\b|\bRUN-\d+\b|\bU-\d+\b/;

/** The props and patterns a signed-in person actually reads text from. */
const USER_FACING_PROP =
  /\b(title|aria-label|label|placeholder|alt|hint|sub|thenWhat)\s*=\s*[{"'`]/;

describe("no signed-in surface reads the org chart", () => {
  const files = allScannedFiles();

  it("scans a non-trivial set of files, so a broken path cannot pass silently", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  for (const file of files) {
    it(`${file} carries no register word, org-chart phrase or ledger id in a rendered string`, () => {
      const raw = readFileSync(join(ROOT, "src", file), "utf8");
      const stripped = stripComments(raw);
      const lines = stripped.split("\n");
      const offenders: string[] = [];

      lines.forEach((line, i) => {
        if (!line.trim()) return;
        const n = i + 1;
        const userFacing = USER_FACING_PROP.test(line);

        // Phrases only: no code identifier is spelled "seven stations" or
        // "Station 3 of 7", so these stay unscoped.
        if (SEVEN_STATIONS.test(line)) offenders.push(`${n}: "seven stations" — ${line.trim()}`);
        if (STATION_OF.test(line)) offenders.push(`${n}: "Station N of M" — ${line.trim()}`);

        // Everything else is a single word that is also common as an
        // identifier, so it only counts inside a prop a person reads from.
        if (!userFacing) return;
        if (REGISTER_WORDS.test(line)) offenders.push(`${n}: register word — ${line.trim()}`);
        if (LEDGER_ID.test(line)) offenders.push(`${n}: ledger id — ${line.trim()}`);
        if (STATION_WORD.test(line)) offenders.push(`${n}: "station" — ${line.trim()}`);
      });

      expect(offenders).toEqual([]);
    });
  }
});

/**
 * `driver.ts`'S SCOPE IS `HOLD_LINE` ONLY, not the whole file — the rest of
 * it is agent-facing briefs and internal machinery, out of this packet's
 * files. Scanned separately from the block above because the surrounding
 * ~1,600 lines of driver code use "station" constantly as a real identifier
 * and would drown a directory-wide scan in noise the file-list already
 * excludes.
 */
describe("HOLD_LINE, the one part of driver.ts a signed-in person reads", () => {
  it("carries no register word, org-chart phrase, ledger id or the word 'station'", async () => {
    const { HOLD_LINE } = await import("@/lib/spine/driver");
    const offenders: string[] = [];
    for (const [reason, line] of Object.entries(HOLD_LINE)) {
      if (REGISTER_WORDS.test(line)) offenders.push(`${reason}: register word — ${line}`);
      if (SEVEN_STATIONS.test(line)) offenders.push(`${reason}: "seven stations" — ${line}`);
      if (STATION_OF.test(line)) offenders.push(`${reason}: "Station N of M" — ${line}`);
      if (LEDGER_ID.test(line)) offenders.push(`${reason}: ledger id — ${line}`);
      // The full word, not the substituted one: `holdLine()` (driver.ts)
      // replaces a LEADING "This station"/"This work" with the station's
      // display name for reasons in STATION_SPECIFIC, so the raw template
      // is allowed to open that way. Anywhere else in the sentence, or in
      // any reason outside that set, "station" reaches a person verbatim.
      const withoutLeadingTemplate = line.replace(/^This (station|work)\b/, "");
      if (STATION_WORD.test(withoutLeadingTemplate)) {
        offenders.push(`${reason}: "station" outside the leading template — ${line}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
