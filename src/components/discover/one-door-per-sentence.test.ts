/**
 * ── THE EMPTY FINDINGS PAGE OFFERED THE SAME DOOR TWICE ───────────────────
 *
 * WALKED AS A STRANGER ON THE SERVED /evidence, 2026-09-10, on a workspace
 * with no sources. Two identical **"Connect a source"** buttons, 135px apart
 * (y 339 and y 474), both navigating to `/settings?section=connections`.
 *
 * NEITHER WAS CARELESS, WHICH IS THE WHOLE POINT. `Quiet`'s action carried its
 * own written reasoning about being the door that leaves the page; the
 * `Actions` row carried its own about `Action` over `Approve` and why orchid is
 * not spent on a navigation. **Each pass was right about the control it was
 * looking at and neither could see the other.** That is law 20: a review checks
 * a change against its own reason, and what no diff shows is what the change
 * landed next to.
 *
 * ── WHY THE `Actions` ONE WENT AND NOT `Quiet`'S ──────────────────────────
 * The order a person reads in. Cutting `Quiet`'s would put the primary door
 * BELOW four sentences of caveat about the sample workspace, so somebody who
 * wants the obvious thing has to read an argument about a thing they did not
 * ask for first. Each door now sits under the sentence that argues for it.
 *
 * ── WHAT IS PINNED ────────────────────────────────────────────────────────
 * The count, not the copy. A second control to the same destination in one
 * state is the defect, whatever either of them is called.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "DiscoverSurface.tsx"), "utf8");

/**
 * The `signalsEmpty` branch alone, and the bound matters.
 *
 * MY FIRST VERSION COUNTED THE WHOLE FILE and reported six doors to the
 * connections settings. Five of them are in OTHER states -- a failed source
 * row, a connector card, a picking pane -- where a door to the same place is
 * correct and expected. **The defect is two doors in ONE state**, so counting
 * the file measures something this test does not claim, and would have failed
 * on code that is right.
 */
function emptyBranch(): string {
  const start = SRC.indexOf("      ) : signalsEmpty ? (");
  expect(start, "the signalsEmpty branch moved; re-point this test").toBeGreaterThan(-1);
  const next = SRC.indexOf("\n      ) : ", start + 30);
  const body = SRC.slice(start, next === -1 ? SRC.length : next);
  /* The mirror on the slice: a bound that collapsed would report a clean count
     of an empty string, and every assertion below passes on a small number. */
  expect(body.length).toBeGreaterThan(1000);
  expect(body).toContain("Nothing is connected yet");
  /* Comments only. This branch's own headers quote both labels while arguing
     about them, and counting those would report the defect it documents. */
  return body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const CODE = emptyBranch();

describe("the empty Findings page offers each door once", () => {
  it("has exactly one control that goes to the connections settings", () => {
    const doors = [...CODE.matchAll(/section:\s*"connections"/g)].length;
    expect(
      { doors },
      "a second control to the same destination in one state. Check what the new one landed NEXT TO before adding it (law 20).",
    ).toEqual({ doors: 1 });
  });

  it("names that door once, in words", () => {
    expect([...CODE.matchAll(/Connect a source/g)].length).toBe(1);
  });

  it("still offers it at all", () => {
    /*
     * THE MIRROR. Both assertions above are satisfied by a SMALLER number as
     * well as the right one, so a refactor that deleted the door entirely --
     * leaving an empty workspace with no way to connect anything -- would read
     * as an improvement here.
     */
    expect(CODE).toContain("Connect a source");
    expect(CODE).toContain('section: "connections"');
  });

  it("keeps the sample door, and only where a sample is offered", () => {
    // The two are not interchangeable: one leaves the page to connect real
    // sources, the other MOVES the person into a seeded workspace and the move
    // sticks. A state with no sample must not draw an empty control row.
    expect(CODE).toContain("Switch to the sample");
    const row = CODE.slice(CODE.indexOf("Switch to the sample") - 400);
    expect(row.slice(0, 400)).toContain("sampleOffered");
  });
});
