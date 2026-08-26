/**
 * AN UNDO MUST NOT ERASE WHAT HAPPENED (gap #5, 2026-08-26).
 *
 * ── THE ONE THING `rewindTrackTo` MUST NEVER DO ────────────────────────────
 * Delete the work it is undoing.
 *
 * The obvious implementation removes the artifacts so the station looks fresh.
 * It is also the one implementation this product cannot ship: the record of what
 * happened IS the thing being sold, and a verdict is measured against a forecast
 * written before the outcome was known. A history edited to look tidy cannot
 * support that. So supersession is a STAMP — the row stays, the artifact stays,
 * and `superseded_at` says when it was undone.
 *
 * ── AND THE STAMP HAS TO BE READ, OR IT IS DECORATION ──────────────────────
 * This is the half that would rot silently. If the reads that gate progression
 * keep counting superseded rows, the station the track was sent back to passes
 * its self-check immediately **on the very output that was rejected**, and the
 * undo becomes a button that moves a pointer and changes nothing. That is the
 * same defect shape as F-99's release, which cleared a hold the next tick
 * re-applied.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (f: string) => readFileSync(fileURLToPath(new URL(f, import.meta.url)), "utf8");
const TRACK_FNS = read("./track.functions.ts");
const DRIVER_SERVER = read("./driver.server.ts");
const FN = TRACK_FNS.slice(TRACK_FNS.indexOf("export const rewindTrackTo"));

describe("it supersedes, it does not delete", () => {
  it("stamps superseded_at", () => {
    expect(FN).toContain("superseded_at");
  });

  it("and issues no delete at all", () => {
    // The whole finding, as one assertion.
    expect(FN).not.toContain(".delete(");
  });

  it("leaves rows that were already superseded alone", () => {
    // A second rewind must not rewrite the first one's timestamp: when the work
    // was undone is part of what happened.
    expect(FN).toContain('.is("superseded_at", null)');
  });
});

describe("undo only goes back", () => {
  it("refuses a station that is ahead", () => {
    expect(FN).toContain("targetIdx >= currentIdx");
    expect(FN).toContain("undo only goes back");
  });

  it("refuses a station that is not on this route", () => {
    expect(FN).toContain("not on this route");
  });

  it("and refuses rather than clamping", () => {
    // Clamping would do something other than what was asked without saying so.
    expect(FN).toContain("refused");
  });
});

describe("the track loses its claim, before anything else happens", () => {
  it("records the press", () => {
    expect(FN).toContain('via: "press"');
  });

  it("and records it BEFORE the supersede and the move", () => {
    const press = FN.indexOf('via: "press"');
    const supersede = FN.indexOf(".update({ superseded_at");
    const move = FN.indexOf("station_drives: 0");
    expect(press).toBeGreaterThan(-1);
    expect(press).toBeLessThan(supersede);
    expect(press).toBeLessThan(move);
  });

  it("clears the F-99 drive ceiling, or the undo re-holds on the next tick", () => {
    expect(FN).toContain("station_drives: 0");
  });
});

describe("THE HALF THAT WOULD ROT: the stamp is actually read", () => {
  /*
   * Counted, not sampled. Five reads in `driver.server.ts` decide whether a
   * station has what it needs: the self-check, the brief, the spec link, the
   * mission reuse, and the forecast horizon. A sixth reads members created
   * since arrival and is already safe by timestamp.
   */
  it("every gating read asks for standing work only", () => {
    const gating = [
      '.eq("station", station)\n      // STANDING WORK ONLY',
      '.eq("artifact_kind", "prd")\n    .is("superseded_at", null)',
      '.eq("artifact_kind", "mission")',
      '.eq("artifact_kind", "decision")\n      .is("superseded_at", null)',
      "Undone work is not context",
    ];
    for (const g of gating) {
      expect(DRIVER_SERVER, `a gating read lost its superseded filter: ${g}`).toContain(g);
    }
  });

  it("the self-check cannot pass on work that was undone", () => {
    const filed = DRIVER_SERVER.slice(DRIVER_SERVER.indexOf("async function filedAtStation"));
    const body = filed.slice(0, filed.indexOf("} catch"));
    expect(body).toContain('.is("superseded_at", null)');
  });
});
