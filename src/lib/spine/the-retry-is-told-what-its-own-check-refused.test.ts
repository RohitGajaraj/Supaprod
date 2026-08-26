/**
 * THE RETRY IS TOLD WHAT ITS OWN CHECK REFUSED (F-77 + F-78, 2026-08-26).
 *
 * ── WHAT THIS EXISTS BECAUSE OF ────────────────────────────────────────────
 * S0-001 shipped the self-check with a comment promising Devin's loop — "read
 * the error output, reason about the cause, apply a fix, rerun". Two things
 * stopped it being that:
 *
 * **F-78, the retry could not learn.** `verification.reason` went into the
 * human-readable line and nowhere else; only the coarse `self-check-failed` hold
 * was persisted, and `priorHold` is read by correction.ts rather than by the
 * station brief. So the crew was re-dispatched with identical inputs, filed the
 * same thing, and failed the same check. That is why F-76 had to BOUND the retry
 * with an attempt rather than leave it free — an unbounded retry that cannot
 * learn is strictly worse than a bounded one.
 *
 * **F-77, the check judged one visit.** It was handed `attached`, the artifacts
 * harvested on THIS visit, so a crew whose seats span the tick deadline — the
 * exact case `a-crew-split-by-the-clock-still-filed-its-work` exists for — would
 * be refused for filing nothing when its earlier seat had filed.
 *
 * ── THE SHAPE ──────────────────────────────────────────────────────────────
 * Both are answered by judging the RECORD rather than the visit. The reason is
 * recomputed at brief time from what is on the record, exactly as
 * `correctionNote` is: no model call, and it cannot go stale. If a later seat
 * already fixed the fault, the recomputed check passes and the station is told
 * nothing rather than being sent after a problem it no longer has.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { selfCheckNote } from "@/lib/spine/correction";
import { verifyStationOutput } from "@/lib/spine/driver.server";
import type { Attachment } from "@/lib/spine/attach";
import type { AgentStation } from "@/lib/agent-vocabulary";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const DRIVER = read("./driver.server.ts");
const BODY = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));

const filed = (kind: string, station: AgentStation): Attachment =>
  ({ artifactKind: kind, artifactId: `id-${kind}`, station }) as unknown as Attachment;

const noRows = {
  from: () => ({ select: () => ({ in: async () => ({ data: [], error: null }) }) }),
} as never;

describe("F-78 · the sentence the station reads", () => {
  it("names the reason its own check gave", () => {
    const note = selfCheckNote("decide", "Decision was recorded but has no forecast");
    expect(note).toContain("has no forecast");
    expect(note).toContain("its OWN check");
  });

  it("says nobody sent it back, because that is a different situation", () => {
    // A station told "this came back from Ship" when nothing downstream has seen
    // it would go looking for a failure that has not happened.
    const note = selfCheckNote("build", "No changes were staged for commit");
    expect(note).toContain("did not come back from another station");
  });

  it("still gives usable instruction when the reason cannot be recomputed", () => {
    const note = selfCheckNote("design", null);
    expect(note).toContain("did not say why");
    expect(note.length).toBeGreaterThan(40);
  });

  it("tells it not to file the same thing again, which is the whole point", () => {
    expect(selfCheckNote("sense", "No signals were filed")).toContain("same thing");
  });
});

describe("F-77 · the check judges the record, not the visit", () => {
  it("a station whose earlier seat filed the artifact passes, even with an empty visit", async () => {
    // The crew-split case. `attached` for this visit is empty; the record holds
    // the prd seat 1 filed before the tick deadline cut the crew short.
    const thisVisit: Attachment[] = [];
    const onRecord = [filed("prd", "define")];
    const out = await verifyStationOutput(
      {
        from: () => ({
          select: () => ({
            in: async () => ({ data: [{ id: "id-prd", title: "The spec", body_md: null }], error: null }),
          }),
        }),
      } as never,
      "define",
      [...thisVisit, ...onRecord],
    );
    expect(out.passed).toBe(true);
  });

  it("and judging the visit alone would have refused it — the bug this fixes", async () => {
    const out = await verifyStationOutput(noRows, "define", []);
    // Nothing grouped means nothing to judge, so it passes rather than stranding
    // work — but it never reaches the content check, which is what "refused for
    // filing nothing" looked like before the union.
    expect(out.passed).toBe(true);
    const refused = await verifyStationOutput(noRows, "define", [filed("signal", "define")]);
    expect(refused.passed).toBe(false);
    expect(refused.reason).toContain("No spec");
  });
});

describe("the driver wires both, and only where it should", () => {
  it("the hold-branch verification unions the record with the live harvest", () => {
    /*
     * ANCHORED ON THE HOLD, not on the first `verifyStationOutput(` in the file.
     * There are two calls and they are deliberately different: the brief-time one
     * (F-78) passes `filedAtStation` alone, because the crew has not run yet and
     * there is no harvest to union; this one runs after the crew and must see
     * both. An `indexOf` for the function name finds the wrong one — it did, and
     * this test failed until it was pointed at the right call.
     */
    const hold = BODY.indexOf('last_hold: "self-check-failed"');
    expect(hold).toBeGreaterThan(-1);
    const call = BODY.slice(BODY.lastIndexOf("verifyStationOutput(", hold), hold);
    expect(call).toContain("unionFiled(");
    expect(call).toContain("filedAtStation(");
  });

  it("the brief-time verification reads the record alone, because there is no harvest yet", () => {
    const at = BODY.indexOf("selfCheckBack");
    const block = BODY.slice(at, at + 500);
    expect(block).toContain("filedAtStation(");
    expect(block).not.toContain("unionFiled(");
  });

  it("the self-check note is written only for a self-check hold", () => {
    const at = BODY.indexOf("selfCheckBack");
    expect(at).toBeGreaterThan(-1);
    const block = BODY.slice(at, at + 400);
    expect(block).toContain('row.last_hold === "self-check-failed"');
  });

  it("a correction from a later station outranks it", () => {
    // Both can be true at once; the downstream failure is the more informative
    // one and must be what the station hears.
    const at = BODY.indexOf("selfCheckBack");
    const block = BODY.slice(at, at + 400);
    expect(block).toContain("!correctionBack");
    expect(BODY).toContain("const backNote = correctionBack ?? selfCheckBack;");
  });

  it("filedAtStation asks for this track AND this station, not one of the two", () => {
    // Scoped to the track alone it would judge a station on another track's work;
    // scoped to the station alone, on every track's.
    const at = DRIVER.indexOf("async function filedAtStation(");
    expect(at).toBeGreaterThan(-1);
    const fn = DRIVER.slice(at, at + 900);
    expect(fn).toContain('.eq("track_id", trackId)');
    expect(fn).toContain('.eq("station", station)');
    expect(fn).toContain("spine_track_members");
  });
});
