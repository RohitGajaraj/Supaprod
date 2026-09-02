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
  /*
   * ── THE FIRST VERSION ASKED A COLUMN THAT DOES NOT EXIST ─────────────────
   *
   * It read `studio_changesets` with `.eq("track_id", row.id)`. That table has
   * twenty-two columns and this is not one of them; the link to a track is
   * `mission_id`. PostgREST answers 42703 with no rows, so the rule evaluated to
   * "no changeset" and never fired -- which A1 caught on the live run when
   * `6817e386` rebuilt at `pr_open` anyway, and read at first as a deploy that
   * had not carried the fix.
   *
   * It was the THIRD gate in the driver to make that exact mistake. F-72's
   * staged gate and P-02's acceptance gate had it too, so F-72's has never fired
   * since it was written. All three go through one reader now, because three
   * copies of a join is how one gets fixed and the others do not.
   */
  it("asks the changeset whether Build's work has left the station", () => {
    expect(flat).toContain(
      'if (station === "build") { const done = await newestChangesetForTrack(',
    );
  });

  it("goes through the track's missions, because there is no track_id to join on", () => {
    const reader = code.slice(
      code.indexOf("async function newestChangesetForTrack("),
      code.indexOf("async function openBranchForTrack("),
    );
    expect(reader).toContain('.from("spine_track_members")');
    expect(reader).toContain('.eq("artifact_kind", "mission")');
    expect(reader).toContain('.in("mission_id", missionIds)');
  });

  it("no gate in the driver reads a track_id off studio_changesets any more", () => {
    /*
     * THE ASSERTION THAT KEEPS THIS FIXED. The defect was not one wrong query,
     * it was the same wrong query copied three times, and the third copy was
     * written a month after the first without anyone noticing the first had
     * never worked.
     */
    const reads = [...code.matchAll(/from\("studio_changesets"\)[\s\S]{0,200}?track_id/g)];
    expect(reads).toHaveLength(0);
  });

  it("counts pr_open and merged, and refuses on those rather than allow-listing the rest", () => {
    /*
     * Both mean a branch and a pull request exist, which is exactly what Ship
     * needs to point at. Naming the two that END the station keeps a future
     * status working by default -- the same shape F-72's gate uses below, for
     * the same reason.
     */
    expect(flat).toContain('if (st === "pr_open" || st === "merged") {');
  });

  /**
   * ── AND THE STATUS IS ONLY HALF THE QUESTION, 2026-09-02 ────────────────
   *
   * The first version of this rule asked the changeset and nothing else, and it
   * parked the honest run. `2fdf93b6` went from 0 attempts to 2 across two ticks
   * with NO `agent_runs` row and no tool call: its changeset was `pr_open` with
   * red CI, so the rule skipped the crew, the self-check afterwards re-read the
   * same red CI, counted an attempt, and parked. At 3 it gives up.
   *
   * The send-back had nobody to send to. The crew that would stage the fix is
   * exactly the crew the rule was skipping, so the loop refused to run the only
   * thing that could clear the refusal -- forever, and burning an attempt each
   * time.
   */
  it("only skips the crew when the station's own check also holds", () => {
    expect(flat).toContain("const alreadyRight = await verifyStationOutput(");
    expect(flat).toContain("buildAlreadyHandedOn = alreadyRight.passed;");
  });

  it("runs the crew in fix mode when it does not, and tells it what refused", () => {
    /*
     * `studio.fix.commit` is what this case was written for: append the fix to
     * the same branch and the same pull request. Without the note the seat
     * re-stages blind against a branch that is already wrong, which is the loop
     * it cannot see from inside.
     */
    expect(flat).toContain("fixNote = selfCheckNote(station, alreadyRight.reason ?? null);");
    expect(flat).toContain("fixNote ?? backNote,");
  });

  it("asks before the crew, not after, which is the whole shape of it", () => {
    // The enforcing check runs after seats have spent money. This one is a read,
    // and its only job is deciding whether there is anything for them to do.
    expect(code.indexOf("const alreadyRight = await verifyStationOutput(")).toBeLessThan(
      code.indexOf("const result = await runAgentLoop("),
    );
  });

  it("a drive that ran no crew counts no attempt", () => {
    // An attempt is a try. Three drives that dispatched nobody must not add up
    // to a piece of work given up.
    expect(flat).toContain(
      "attempts: buildAlreadyHandedOn ? (row.attempts ?? 0) : (row.attempts ?? 0) + 1",
    );
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
    /* `newestChangesetForTrack` returns null on every failure -- a missing
       mission, a failed read, no changeset -- and the flag is only ever set from
       a status it actually read, so no error path can reach it. */
    expect(flat).toContain("[driver] could not read the changeset for track");
    expect(flat).toContain('const st = typeof done?.status === "string" ? done.status : null;');
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
