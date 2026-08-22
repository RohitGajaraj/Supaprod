/**
 * THE DEFAULT IS THE WHOLE ANSWER, SO IT IS PINNED PER TOOL, NOT PER WORDING.
 *
 * These assert the OUTCOME for named production tools rather than the shape of
 * the predicate, because the predicate is three lines and the thing that can
 * actually go wrong is a tool landing in the wrong lane. Every tool below was
 * chosen from what the live queue and the live history contain, and each pins a
 * different reason for its lane — so if `tool-consequences.ts` moves an entry,
 * the failure names the tool and the axis rather than "expected cancel, got
 * proceed" somewhere.
 */
import { describe, expect, test } from "bun:test";
import {
  CANCEL_TTL_HOURS,
  PROCEED_TTL_HOURS,
  expiryDefaultFor,
  expiryNote,
  expiryReason,
  planApprovalExpiry,
} from "./approval-expiry";

describe("expiryDefaultFor", () => {
  test("a reversible internal call proceeds on silence", () => {
    // The three tools holding 24 of the 38 stuck rows on 2026-08-22. All three
    // are catalogued reversible and none crosses the boundary, so none of them
    // ever needed a person in the first place.
    expect(expiryDefaultFor("cluster.trigger")).toBe("proceed");
    expect(expiryDefaultFor("memory.promote")).toBe("proceed");
    expect(expiryDefaultFor("backlog.prioritize")).toBe("proceed");
  });

  test("an irreversible call is cancelled on silence", () => {
    // 73 raised, 21 already dead of expiry. Merging is not undoable, so nobody
    // answering means it must not happen.
    expect(expiryDefaultFor("studio.pr.merge")).toBe("cancel");
    expect(expiryDefaultFor("delegate.openhands")).toBe("cancel");
  });

  test("a REVERSIBLE call that leaves the workspace is still cancelled", () => {
    /* The axis that would be silently lost if reversibility alone decided this.
     * `calendar.create` is catalogued reversible — you delete the event — but it
     * puts something in front of another person, and going ahead unasked would
     * be a stranger's calendar moving because nobody read an email. Its record
     * agrees: 7 raised, 7 rejected, 100%. */
    expect(expiryDefaultFor("calendar.create")).toBe("cancel");
    expect(expiryReason("calendar.create")).toBe("its effect leaves the workspace");
  });

  test("a partly-reversible call is cancelled, because proceeding is the narrow lane", () => {
    expect(expiryDefaultFor("mission.dispatch")).toBe("cancel");
    expect(expiryReason("mission.dispatch")).toBe("it can only partly be undone");
  });

  test("an uncatalogued tool is cancelled, and is not mistaken for a partial one", () => {
    /* `toolConsequence` answers `partial` for a tool it has never heard of AND
     * for one catalogued as partly reversible, so reading reversibility alone
     * cannot tell them apart. Both cancel, but the row must say which.
     *
     * Two names, because the live queue holds one of each shape: seven
     * `changelog.publish` rows for a tool that was removed from the product
     * after they were raised, and the general case of a name nobody has
     * catalogued yet. Both must fail closed, and neither may be reported as
     * merely partial. */
    expect(expiryDefaultFor("changelog.publish")).toBe("cancel");
    expect(expiryDefaultFor("some.tool.nobody.catalogued")).toBe("cancel");
    expect(expiryReason("changelog.publish")).toBe("it is not in the consequence catalogue");
    expect(expiryReason("mission.dispatch")).not.toBe(expiryReason("changelog.publish"));
  });

  test("no tool name at all is not a reversible internal tool", () => {
    expect(expiryDefaultFor(null)).toBe("cancel");
    expect(expiryDefaultFor(undefined)).toBe("cancel");
    expect(expiryDefaultFor("")).toBe("cancel");
  });
});

describe("planApprovalExpiry", () => {
  const NOW = Date.parse("2026-08-22T12:00:00.000Z");

  test("the proceeding lane gets the shorter clock", () => {
    const plan = planApprovalExpiry("cluster.trigger", NOW);
    expect(plan.onExpiry).toBe("proceed");
    expect(plan.ttlHours).toBe(PROCEED_TTL_HOURS);
    expect(plan.expiresAt).toBe("2026-08-23T12:00:00.000Z");
  });

  test("the cancelling lane gets the longer one", () => {
    // Cancelling early throws away work nobody agreed to throw away, so it waits
    // longer than the slowest decision on record (58.99h).
    const plan = planApprovalExpiry("studio.pr.merge", NOW);
    expect(plan.onExpiry).toBe("cancel");
    expect(plan.ttlHours).toBe(CANCEL_TTL_HOURS);
    expect(plan.expiresAt).toBe("2026-08-25T12:00:00.000Z");
  });

  test("both clocks are shorter than the seven days every gate used to get", () => {
    // The number this replaces. A week is longer than anyone waits and nothing
    // happened at the end of it, which is how the queue reached 696 hours.
    expect(PROCEED_TTL_HOURS).toBeLessThan(7 * 24);
    expect(CANCEL_TTL_HOURS).toBeLessThan(7 * 24);
    // And the proceeding one clears the 95th percentile of every human decision
    // on record (12.9h) with room, so silence is genuinely silence.
    expect(PROCEED_TTL_HOURS).toBeGreaterThan(13);
  });
});

describe("expiryNote", () => {
  test("the proceeding note says it was unasked and how to undo it", () => {
    const note = expiryNote("cluster.trigger", "proceed", "2026-08-23T12:00:00.000Z");
    expect(note).toContain("Proceeded unasked");
    expect(note).toContain("nobody answered by 2026-08-23T12:00:00.000Z");
    // The undo is the entire argument for going ahead, so it travels with the row.
    expect(note).toContain("Run it again");
  });

  test("the cancelling note says nothing ran, and which property decided it", () => {
    const note = expiryNote("studio.pr.merge", "cancel", "2026-08-25T12:00:00.000Z");
    expect(note).toContain("Cancelled unrun");
    expect(note).toContain("it cannot be undone");
    expect(note).toContain("Nothing ran.");
  });

  test("the note never restates the TTL, because that number is wrong for legacy rows", () => {
    /* Every row raised before 2026-08-22 carries a flat seven-day clock, and
     * those are the first rows this sweep will ever touch. A note reading
     * "nobody answered within 24h" on a row that waited a week is a fabricated
     * fact in a record whose whole claim is that it holds. The deadline is true
     * of any row whatever policy raised it. */
    const note = expiryNote("cluster.trigger", "proceed", "2026-08-23T12:00:00.000Z");
    expect(note).not.toContain("24h");
    expect(note).not.toContain("within");
  });

  test("an override says what happened AND what the call had declared", () => {
    /* The first draft built this sentence from the OUTCOME, which produced
     * "declared default is to cancel because it can be undone" — the outcome's
     * verb wearing the declaration's reason, a sentence arguing against itself.
     * Both facts are true at once and the row has to carry both. */
    const note = expiryNote("cluster.trigger", "proceed", "2026-08-23T12:00:00.000Z", {
      actual: "cancel",
      because: "this is a sample workspace, and proceeding would spend on a demo fixture",
    });
    expect(note).toContain("Cancelled unrun");
    expect(note).toContain("declared default is to proceed");
    expect(note).toContain("sample workspace");
    expect(note).toContain("Nothing ran.");
    // The undo line belongs to a call that ran. This one did not.
    expect(note).not.toContain("To undo");
  });

  test("a missing deadline does not put the word undefined in the record", () => {
    expect(expiryNote("studio.pr.merge", "cancel", null)).not.toContain("undefined");
  });
});
