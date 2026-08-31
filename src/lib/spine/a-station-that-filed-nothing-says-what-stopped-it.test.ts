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

const DRIVER = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");
const BODY = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));

describe("the produced-nothing line names the last thing that failed", () => {
  it("reads the last failing tool before writing the hold", () => {
    const at = BODY.indexOf('last_hold: "produced-nothing"');
    expect(at).toBeGreaterThan(-1);
    // Before the write, not after: the line is built from it.
    const before = BODY.slice(Math.max(0, at - 600), at);
    expect(before).toContain("lastFailingTool(supabase, traceIds)");
  });

  /**
   * THE WHOLE BRANCH, normalised, rather than a fixed byte window after the
   * `return`.
   *
   * ── WHY THIS WIDENED, 2026-08-31 (F-175) ──────────────────────────────────
   * The old window was `slice(at, at + 900)` anchored on the return's `hold:`.
   * F-175 hoisted the sentence into a `because` const ABOVE the write so the
   * ROW could carry it too — behaviour identical, both assertions red, because
   * what they were really pinned to was **where the ternary was written**.
   *
   * That is the FOURTH source-text assertion to break on a behaviour-preserving
   * edit in a single day. Each was fixed by asking the question the test meant
   * to ask instead of the one its anchor happened to catch. Here that question
   * is *"does this branch name the failing tool, and only when there was one"* —
   * which is true wherever in the branch the conditional is spelled.
   */
  function branch(): string {
    const from = BODY.indexOf("lastFailingTool(supabase, traceIds)");
    expect(from).toBeGreaterThan(-1);
    const to = BODY.indexOf("\n  }", BODY.indexOf('\n      hold: "produced-nothing"'));
    // Guards the guard. A missed anchor returns -1, and `slice(from, -1)` is
    // almost the whole file — every assertion below would then pass on text
    // from some other branch. That is the vacuous-green failure this file has
    // already been bitten by once, at a different anchor.
    expect(to).toBeGreaterThan(from);
    return BODY.slice(from, to).replace(/\s+/g, " ");
  }

  it("puts the tool and its words into the line", () => {
    expect(branch()).toContain("The last thing it tried was");
    expect(branch()).toContain("lastFailure");
  });

  it("still says the generic sentence when nothing failed", () => {
    // A station can file nothing without any tool erroring — an empty honest
    // visit. The specific half is conditional so that case reads as it always
    // did, and the conditional is on `lastFailure` rather than on anything the
    // station said, because absence of a failure is the whole trigger.
    expect(branch()).toContain('HOLD_LINE["produced-nothing"]');
    expect(branch()).toMatch(/lastFailure ?\?/);
  });

  it("carries that same sentence onto the row, not only onto the screen", () => {
    // F-175. The reason the const exists at all: before this, `last_hold_because`
    // was null on 96 of 97 held tracks and the line died with the tick.
    expect(branch()).toContain("last_hold_because");
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
