/**
 * A STATION THAT FILED NOTHING SAYS WHAT STOPPED IT (F-87, 2026-08-26).
 *
 * ── FOUND BY WATCHING A REAL TRACK, NOT BY READING CODE ────────────────────
 * Track `7977dc06` at 13:20 UTC: entry `sense`, `waived = '[]'`, sitting at
 * `ship` on attempt 2 of 3 — **two stations from the first acceptance this
 * product has ever recorded**, and one tick from terminal.
 *
 * Its ship crew worked correctly. `ship.list_releases`, `ship.in_production`,
 * `build.changeset_history` and `build.list_sessions` all came back `ok: true`.
 * Then:
 *
 *   github.ci.read   ok:false  "GitHub get-pr 404: Not Found"
 *   release.publish  ok:false  "Only a merged changeset can promote. Merge the PR first."
 *
 * The changeset was `pr_open`, never merged, and its `pr_url` pointed at
 * `RohitGajaraj/relay-homeowner-app/pull/5` while the workspace had been rebound
 * to `Supaprod/...` — so the CI read 404'd on a PR that exists in another org.
 *
 * ── THE DEFECT, WHICH IS A SENTENCE RATHER THAN A STATE ────────────────────
 * Neither error carries a credential signature, so neither is a `tools-refused`
 * refusal — correctly, since `REFUSAL_SIGNS` decides a terminal hold and must
 * stay narrow. Both fell to `produced-nothing`, whose line reads:
 *
 *   "This station ran but filed nothing… It will try again."
 *
 * **False in the way that matters.** Ship did not fail to produce; it declined to
 * publish an unmerged changeset, which is it working. No retry can merge a PR, so
 * "it will try again" points a person at patience when the fix is a merge. That is
 * a dead end wearing a progress bar, and R-20 §5 forbids it.
 *
 * The hold is unchanged — nothing WAS filed, and `produced-nothing` is the honest
 * classification. Only the line changes, to name the obstacle.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DRIVER = readFileSync(
  fileURLToPath(new URL("./driver.server.ts", import.meta.url)),
  "utf8",
);
const BODY = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));

describe("the produced-nothing line names the last thing that failed", () => {
  it("reads the last failing tool before writing the hold", () => {
    const at = BODY.indexOf('last_hold: "produced-nothing"');
    expect(at).toBeGreaterThan(-1);
    // Before the write, not after: the line is built from it.
    const before = BODY.slice(Math.max(0, at - 600), at);
    expect(before).toContain("lastFailingTool(supabase, traceIds)");
  });

  it("puts the tool and its words into the line", () => {
    // ANCHORED ON THE RETURN'S `hold:`, NOT ON `last_hold:` — the longer key
    // CONTAINS the shorter one, so a bare indexOf lands on the database write
    // above and the window ends mid-sentence. That is the same blunt-anchor
    // mistake that failed the F-76 and F-77 guards; the newline pins it.
    const at = BODY.indexOf('\n      hold: "produced-nothing"');
    expect(at).toBeGreaterThan(-1);
    const block = BODY.slice(at, at + 900);
    expect(block).toContain("lastFailure");
    expect(block).toContain("The last thing it tried was");
  });

  it("still says the generic sentence when nothing failed", () => {
    // A station can file nothing without any tool erroring — an empty honest
    // visit. The suffix is conditional so that case reads exactly as before.
    const at = BODY.indexOf('\n      hold: "produced-nothing"');
    const block = BODY.slice(at, at + 900);
    expect(block).toContain('HOLD_LINE["produced-nothing"]');
    expect(block).toMatch(/lastFailure\s*\?/);
  });
});

describe("the refusal set stays narrow, because it decides a terminal hold", () => {
  it("lastFailingTool is separate from refusedToolInTraces", () => {
    // Two questions, deliberately not merged. One decides `tools-refused`, which
    // is terminal and must stay credential-shaped. The other decides nothing and
    // only supplies a sentence. Collapsing them would make any failing tool
    // terminal, which is far worse than a vague line.
    expect(DRIVER).toContain("async function refusedToolInTraces(");
    expect(DRIVER).toContain("async function lastFailingTool(");
  });

  it("lastFailingTool takes the NEWEST failure, not the oldest", () => {
    // refusedToolInTraces scans ascending to find the first refusal in the visit.
    // For a sentence, the last thing tried is the useful one — it is where the
    // crew actually stopped.
    const fn = DRIVER.slice(DRIVER.indexOf("async function lastFailingTool("));
    const head = fn.slice(0, 700);
    expect(head).toContain("ascending: false");
    expect(head).toContain("limit(1)");
  });

  it("a failed read claims nothing rather than inventing a reason", () => {
    const fn = DRIVER.slice(DRIVER.indexOf("async function lastFailingTool("));
    const head = fn.slice(0, 700);
    expect(head).toContain("if (error || !data?.length) return null;");
  });
});
