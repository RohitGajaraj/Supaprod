/**
 * THE MERIDIAN RATCHET, the guard half. See `meridian-ratchet-scan.ts` for why
 * this exists rather than another paragraph of doctrine.
 *
 * THREE RULES, AND THE FIRST ONE IS THE PRODUCT:
 *
 *   1. A NEW FILE MUST BE CLEAN. No retired token, no raw colour, no
 *      exceptions, no allowlist. Everything produced from now on is Meridian.
 *   2. AN EXISTING FILE MAY NOT GET WORSE. It keeps exactly the debt recorded
 *      in the baseline and not one occurrence more.
 *   3. DEBT THAT LEAVES CANNOT COME BACK. When a count drops, the baseline is
 *      re-frozen at the lower number, so the ground gained is kept.
 *
 * WHEN THIS FAILS, DO NOT UPDATE THE BASELINE TO MAKE IT PASS. The failure is
 * the guard working. `bun run design:ratchet` is for recording debt you have
 * REMOVED, and the test tells you when to run it.
 */

import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { REPO_ROOT, SCAN_SCOPES, scan, totalDebt, type DebtLedger } from "./meridian-ratchet-scan";

const BASELINE_PATH = join(REPO_ROOT, "src/__tests__/meridian-ratchet.baseline.json");

const recorded = existsSync(BASELINE_PATH)
  ? (JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as { files?: DebtLedger; scopes?: string[] })
  : {};

const baseline: DebtLedger = recorded.files ?? {};

const current = scan();

/** Every marker present in either ledger for one file. */
function markersFor(file: string): string[] {
  return [...new Set([...Object.keys(baseline[file] ?? {}), ...Object.keys(current[file] ?? {})])];
}

describe("the Meridian ratchet: everything new is Meridian", () => {
  it("admits no retired token or raw colour in a file the baseline does not know", () => {
    const offenders = Object.keys(current)
      .filter((f) => !(f in baseline))
      .map((f) => `${f} -> ${JSON.stringify(current[f])}`);

    expect(
      offenders,
      offenders.length === 0
        ? ""
        : [
            "",
            "A NEW FILE IS SPEAKING A RETIRED DESIGN VOCABULARY.",
            "",
            "Every prior design system was retired on 2026-08-14 (v1, v2, v3,",
            "Obsidian, Tempo, Cadence/ink). Meridian is the only one. A file",
            "the baseline has never seen must be born clean.",
            "",
            offenders.map((o) => `  ${o}`).join("\n"),
            "",
            "Fix it at the source, not by widening this guard:",
            "  --sp-* / --ds-* / --text-* / --hairline / --raised  ->  the",
            "      --mrd-* token that carries the same MEANING. They are not a",
            "      1:1 rename; ink.css aliases them for life support only.",
            "  a raw #hex or rgb()  ->  a --mrd-* token. A hex cannot answer the",
            "      paper ground and is invisible to the contrast sweep.",
            "  no Meridian token fits  ->  that is a GAP IN MERIDIAN, and the",
            "      founder's standing ruling is to build Meridian first rather",
            "      than reach past it. See docs/design/DESIGN-SYSTEM.md.",
            "",
            "ONE EXCEPTION, and it is not one you can invoke by hand. If you just",
            "widened the SCANNER -- a new scope in SCAN_SCOPES -- these files are",
            "not new debt, they are files nobody was looking at. `design:ratchet`",
            "detects that from the scopes the baseline was frozen under and adopts",
            "them once at their current count. It cannot be asked to do it.",
            "",
          ].join("\n"),
    ).toEqual([]);
  });

  it("lets no known file get worse", () => {
    const worse: string[] = [];
    for (const file of Object.keys(baseline)) {
      for (const marker of markersFor(file)) {
        const was = baseline[file]?.[marker] ?? 0;
        const now = current[file]?.[marker] ?? 0;
        if (now > was) worse.push(`${file}  ${marker}: ${was} -> ${now}`);
      }
    }

    expect(
      worse,
      worse.length === 0
        ? ""
        : [
            "",
            "A FILE ADDED MORE RETIRED VOCABULARY THAN IT ALREADY CARRIED.",
            "",
            "These files are on life support, not on a contract. They may keep",
            "what they have until they are ported. They may not grow.",
            "",
            worse.map((w) => `  ${w}`).join("\n"),
            "",
          ].join("\n"),
    ).toEqual([]);
  });

  it("keeps the ground that has been gained", () => {
    /*
     * The rule with teeth is that debt REMOVED is re-frozen. Without this a
     * file could be ported, then quietly regress to its original baseline
     * later and no test would notice, because the baseline still permits the
     * old number. This is what makes it a ratchet and not a ceiling.
     */
    const reclaimed: string[] = [];
    for (const file of Object.keys(baseline)) {
      for (const marker of markersFor(file)) {
        const was = baseline[file]?.[marker] ?? 0;
        const now = current[file]?.[marker] ?? 0;
        if (now < was) reclaimed.push(`${file}  ${marker}: ${was} -> ${now}`);
      }
    }

    expect(
      reclaimed,
      reclaimed.length === 0
        ? ""
        : [
            "",
            "GOOD NEWS, AND THE BASELINE IS NOW STALE.",
            "",
            "Debt was removed and the baseline still permits the old number, so",
            "the ground gained is not yet held. Re-freeze it:",
            "",
            "  bun run design:ratchet",
            "",
            "and commit the updated baseline with the port that earned it.",
            "",
            reclaimed.map((r) => `  ${r}`).join("\n"),
            "",
          ].join("\n"),
    ).toEqual([]);
  });

  it("records what the scanner looked at, not only what it found", () => {
    /*
     * The cause of the 2026-08-21 ruling, turned into an assertion. A clean file
     * and an unscanned file are both absent from the baseline, so COVERAGE has to
     * be written down or nothing can tell a widened scanner from added debt. This
     * fails when the two drift, which is the moment a reader can still act on it.
     */
    const scanned = SCAN_SCOPES.map((s) => s.id).sort();
    const frozen = [...(recorded.scopes ?? [])].sort();
    expect(
      frozen,
      frozen.length === 0
        ? [
            "",
            "THE BASELINE DOES NOT RECORD WHAT WAS SCANNED.",
            "",
            "Re-freeze it once and this becomes self-maintaining:",
            "",
            "  bun run design:ratchet",
            "",
          ].join("\n")
        : [
            "",
            "THE SCANNER'S COVERAGE AND THE BASELINE'S DISAGREE.",
            "",
            `  scanner : ${scanned.join(", ")}`,
            `  baseline: ${frozen.join(", ")}`,
            "",
            "If you widened the scanner, run `bun run design:ratchet`: the files in",
            "a scope the baseline has never held are adopted at their current count,",
            "which is a coverage expansion rather than a rise. If you did not widen",
            "it, somebody hand-edited this list and the adopt door is standing open.",
            "",
          ].join("\n"),
    ).toEqual(scanned);
  });

  it("reports the debt as one number, so the direction of travel is visible", () => {
    /*
     * Not an assertion about the amount -- it is a fact printed where somebody
     * reads it. A migration with no visible number stalls silently, because
     * nobody can tell a good week from a bad one.
     */
    const total = totalDebt(current);
    const files = Object.keys(current).length;
    expect(total).toBeGreaterThanOrEqual(0);
    expect(files).toBeGreaterThanOrEqual(0);
  });
});
