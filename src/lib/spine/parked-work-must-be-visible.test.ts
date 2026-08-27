/**
 * WORK THAT CANNOT MOVE MUST SAY SO (S4-041, 2026-08-27).
 *
 * Eight of the nine real open tracks are held on a reason the sweep will never
 * revisit. `track-tick` excludes `TERMINAL_HOLDS` from selection and
 * `decideDrive` refuses them again, so those eight had not been driven since
 * 2026-08-25 while live tracks were driven seconds before the measurement.
 *
 * They sit at `status = 'open'`, so **every open-work count in the product
 * includes eight pieces of work that cannot move**. A person reading "nine
 * open" is told nine things are in flight when one is.
 *
 * ── THE DECISION, RECORDED BECAUSE IT WAS MINE TO MAKE ─────────────────────
 * Not a bulk release: that spends a full crew on eight tracks that have each
 * already failed three or more attempts, one across 316 drives, with no new
 * information since. That is spending to learn nothing.
 *
 * Not an abandon: that closes real filed work to make a count tidy, which fixes
 * the number by deleting the thing it measures.
 *
 * The defect is the silence, so the fix is to say the true thing and leave the
 * choice with the person, one track at a time.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const FN = SRC.slice(SRC.indexOf("export const getParkedWork"));
/*
 * COMMENTS STRIPPED BEFORE ASSERTING ON CODE. The first version of the test
 * below tripped on this file's own explanation of the defect it fixed, which is
 * the fourth time in one night this repo has had a guard match its own prose.
 */
const CODE = FN.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
/*
 * The helpers `withRefusal` and `refusalsFor` are declared ABOVE the export, so
 * they fall outside `FN`'s slice. Asserting on the whole file, comments stripped
 * for the same reason `CODE` strips them.
 */
const FILE_CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("it reports parked work without moving it", () => {
  it("selects on the same TERMINAL_HOLDS the sweep excludes", () => {
    // One source for "cannot move", or the surface and the sweep disagree.
    expect(FN).toContain("TERMINAL_HOLDS");
  });

  it("is a reader and writes nothing", () => {
    // A surface that reports parked work must not also unpark it unasked.
    expect(FN).not.toContain(".update(");
    expect(FN).not.toContain(".insert(");
    expect(FN).not.toContain(".delete(");
  });

  it("uses the product's own hold sentence rather than inventing one", () => {
    expect(FN).toContain("holdLine(");
    expect(FN).toContain("HOLD_LINE[");
  });
});

describe("THE F-76 SHAPE, refused: a failed read is not an empty board", () => {
  it("does not return an empty list when the read fails", () => {
    // `parked: []` with `openTotal: 0` would tell a person nothing is stuck at
    // the exact moment the product cannot see, and the silence would look like
    // good news.
    // A DISCRIMINATED RESULT, not a sentinel: `-1` is a number that reaches a
    // screen and reads as "-1 open", and a caller can forget what it means.
    // A caller cannot forget to check `ok`.
    expect(FN).toContain("ok: false");
    expect(FN).toContain("not a count of nothing");
    expect(CODE).not.toContain("openTotal: -1");
  });
});

describe("the longest-parked is the one a person needs first", () => {
  it("sorts oldest-first, not newest-first", () => {
    // The same defect S2 found on the waiting lane: a newest-first list buries
    // the item that has been waiting since Monday.
    expect(FN).toContain('(x.stoppedAt ?? "").localeCompare(y.stoppedAt ?? "")');
  });
});

describe("parked work says WHY, not only that it stopped", () => {
  /*
   * `HOLD_LINE["tools-refused"]` says "this station could not use a tool it
   * needs". True, and useless: it names neither the tool nor the reason, so the
   * one sentence a person can act on is missing from the place they go to read
   * it.
   *
   * The driver composes that sentence at drive time and then DISCARDS it — the
   * hold is stored, the reason is not — so it is re-derived from the record
   * here, which is the same choice `selfCheckBack` makes and for the same
   * reasons: no model call, and it cannot go stale.
   *
   * Measured 2026-08-27: the only `tools-refused` track in the product is held
   * on a GitHub 401, and the board told its reader a tool had failed without
   * telling them it was a credential they could rotate in one step (F-106).
   */
  it("appends the specific tool and error when the record has one", () => {
    expect(FILE_CODE).toContain("withRefusal(");
    expect(FILE_CODE).toContain("It was ${refusal.tool}, which said: ${refusal.error}");
  });

  it("asks only for the tracks that need it", () => {
    // Every other hold already explains itself; a refusal is the one that does
    // not, so this does not query on behalf of holds that gain nothing.
    expect(CODE).toContain('t.last_hold === "tools-refused"');
  });

  it("one query for the page, not one per row", () => {
    // A board with twelve parked items must not make twelve round trips to
    // explain them.
    expect(FILE_CODE).toContain('.in("track_id", trackIds)');
    expect(FILE_CODE).toContain('.in("trace_id", [...traceToTrack.keys()])');
  });

  it("takes the newest failure per track", () => {
    expect(FILE_CODE).toContain('.order("created_at", { ascending: false })');
    expect(FILE_CODE).toContain("!out.has(track)");
  });

  it("and a failed read falls back to the generic line rather than inventing one", () => {
    // Losing the detail is a worse board. Inventing it would be a lie.
    const at = FILE_CODE.indexOf("async function refusalsFor");
    const body = FILE_CODE.slice(at, at + 1800);
    expect(body).toContain("catch");
    expect(body).toContain("return out");
  });
});
