/**
 * A FINISHED BUILD WAS RE-DISPATCHED EVERY TEN MINUTES.
 *
 * ── MEASURED ON THE LIVE RUN, 2026-09-02 ───────────────────────────────────
 * Track `6817e386` reached Build at 20:50 UTC, staged, committed, and opened
 * pull request #4 on the bound customer repository. The sweep came round at
 * 21:00 and ran Build AGAIN: six stage-commit-checks cycles in the first visit
 * and a further set in the second, all onto the same branch.
 *
 * `studio.pr.open` correctly returned the existing pull request rather than
 * opening a second, so the damage is not a duplicate PR. It is that THE BRANCH
 * GROWS A COMMIT EVERY TICK, and the diff a reviewer judged is not the diff that
 * is there ten minutes later -- which makes the verdict this product sells
 * unfalsifiable, on the one station where it is hardest to notice.
 *
 * ── WHY EVERY EXISTING GATE PASSED IT ──────────────────────────────────────
 * They all ask questions about the ARTIFACT: `producedThisVisit` asks whether
 * anything was filed, `STATION_NEEDS.ship` asks whether a changeset exists, and
 * F-72 asks whether it is still merely `staged`. Not one asks whether Build's
 * work is OVER, and a changeset at `pr_open` answers yes to every question they
 * do ask. So the station looked incomplete forever.
 *
 * ── WHAT THE FIX IS AND IS NOT ─────────────────────────────────────────────
 * It skips the CREW, not the station. The self-check still runs, the acceptance
 * gate still reads the reviewer's verdict, and the advance still goes through
 * the ordinary path -- so a change that opened a pull request and does not meet
 * the spec is still sent back. What is removed is only the re-dispatch of seats
 * whose work is already on the record.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/lib/spine/driver.server.ts", "utf8");
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const flat = code.replace(/\s+/g, " ");

describe("the done rule", () => {
  it("asks the changeset whether Build's work has left the station", () => {
    expect(flat).toContain('if (station === "build") { const { data: doneRows, error: doneErr }');
    expect(flat).toContain('.from("studio_changesets") .select("status") .eq("track_id", row.id)');
  });

  it("counts pr_open and merged, and refuses on those rather than allow-listing the rest", () => {
    /*
     * Both mean a branch and a pull request exist, which is exactly what Ship
     * needs to point at. Naming the two that END the station keeps a future
     * status working by default -- the same shape F-72's gate uses below, for
     * the same reason.
     */
    expect(flat).toContain('if (st === "pr_open" || st === "merged") buildAlreadyHandedOn = true;');
  });

  it("skips the whole crew rather than seat by seat", () => {
    // Running half a crew over work already on a pull request is the same defect
    // at half the cost.
    expect(flat).toContain("!buildAlreadyHandedOn && seatIndex < crew.length;");
  });

  it("is asked BEFORE the crew runs, which is the entire point", () => {
    // The F-72 gate reads the same column and reads it after the crew has
    // already committed again. A check in that position cannot prevent anything.
    expect(code.indexOf("buildAlreadyHandedOn = true")).toBeLessThan(
      code.indexOf("const result = await runAgentLoop("),
    );
  });

  it("fails towards RUNNING the crew, which is today's behaviour", () => {
    /*
     * A read we could not make is not evidence that Build is finished, and
     * skipping a station on a failed read would strand work that genuinely needs
     * it. The opposite direction from the self-check gates, and deliberately so:
     * there, failing open loses one gate; here, it would lose the work.
     */
    expect(flat).toContain("[driver] build done-check could not read the changeset:");
    const guard = code.slice(
      code.indexOf("const { data: doneRows, error: doneErr }"),
      code.indexOf("startSeat = resumeSeatFrom"),
    );
    // The flag is only ever set inside the `else`, so no error path can set it.
    expect(guard.indexOf("if (doneErr)")).toBeLessThan(
      guard.indexOf("buildAlreadyHandedOn = true"),
    );
  });
});

describe("what the skip must not break", () => {
  it("a skipped Build still counts as having produced", () => {
    /*
     * THE ONE THAT WOULD HAVE BITTEN. Without this the skip falls into
     * `produced-nothing`, counts an attempt, and hands a finished Build to the
     * correction loop -- a worse failure than the re-dispatch it replaces.
     *
     * Stated rather than faked with an attachment, because the two facts are
     * different and only one is true: nothing was filed on this visit, and the
     * station's work is nonetheless done.
     */
    expect(flat).toContain("buildAlreadyHandedOn || didStationProduce({");
  });

  it("the self-check and the acceptance gate still run over it", () => {
    // The skip removes the crew, not the judgment. A change that opened a pull
    // request and does not meet the spec is still sent back.
    expect(code.indexOf("buildAlreadyHandedOn || didStationProduce({")).toBeLessThan(
      code.indexOf("const verification = await verifyStationOutput("),
    );
  });

  it("F-72's staged gate is untouched, because staged is the opposite case", () => {
    // `staged` means nothing left the platform; `pr_open` means everything did.
    // The two gates read one column for opposite reasons and both are needed.
    expect(flat).toContain('if (csStatus === "staged")');
    expect(flat).toContain("The change is staged but not committed");
  });
});
