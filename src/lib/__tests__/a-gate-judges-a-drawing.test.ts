import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { designGateBlocksDispatch } from "../build/design-gate";

/**
 * THE DESIGN STATION, AND THE FOUR THINGS IT SAID THAT WERE NOT TRUE.
 *
 * All four came from the same place: the station treating its own stage as
 * mandatory. The seven stations are the FULL path, not the ONLY path. A
 * code-level change needs no design station at all, design often lives outside
 * the product as prototypes and wireframes, and plan straight to build is a
 * real and legitimate route. `prds.design_gate_status` is NOT NULL DEFAULT
 * 'pending' and `workspaces.design_stage_enabled` is NOT NULL DEFAULT true, so
 * a surface that reads either default as a decision somebody made is reading
 * two column defaults meeting.
 *
 *   1. The focus panel told the reader "This spec cannot reach Build" about a
 *      spec with nothing drawn, because `blocksDispatch` was re-derived as
 *      `stageEnabled && gateStatus !== "approved"` and dropped the middle
 *      clause of the rule it claimed, in a comment, to be restating.
 *   2. "Approve the design" and "Send it back" rendered for a spec with nothing
 *      drawn, and both wrote a taste learning about a mockup that never existed.
 *   3. The station could DISPLAY "Design skipped on purpose" and had no way to
 *      write it: `chooseDesignRoute` had one caller in the repo and it was the
 *      spec page.
 *   4. Two reads discarded every error, and supabase-js RESOLVES a refused
 *      read, so a refusal came back shaped exactly like an empty answer and was
 *      printed as "Nothing needs you." and "Drawn without your design language".
 *
 * WHY SOURCE TEXT. Three of the four are wiring: which function a value comes
 * from, which condition a control is drawn under, whether a destructure binds
 * `error`. None of that is reachable from a pure call, and the repo has the
 * precedent (an-empty-read-is-not-an-empty-workspace.test.ts). Comments are
 * stripped first, so no rule here can be satisfied by the prose describing it.
 */

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Source with comments removed, so a rule can never be satisfied by prose
 *  ABOUT the rule. Same treatment the empty-read guard uses. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** The body of one server function, by the export that opens it and the next
 *  top-level `export` that closes it. */
function handler(src: string, name: string): string {
  const start = src.indexOf(`export const ${name} = createServerFn`);
  if (start < 0) throw new Error(`${name} is not in this file any more`);
  const rest = src.slice(start + 10);
  const end = rest.indexOf("\nexport ");
  return end < 0 ? rest : rest.slice(0, end);
}

const SCAFFOLD = "lib/design-scaffold.functions.ts";

// P-14 (A-QUEUE.md, R-34's ruling: "there are no lanes, priority is Put
// first") deleted /design and, with it, `components/design/drawing.tsx`
// (zero real importers once /design's own route stopped being one -- the
// same reachability shape `retry-station.test.ts` lost for /plan). The two
// constants below, `SURFACE` and `DRAWING`, and the describe blocks and
// individual assertions that read them, are gone; `designGateBlocksDispatch`
// and `design-scaffold.functions.ts`'s own handlers -- the rule this whole
// file is actually about -- are untouched and still fully tested below.

describe("the rule itself decides what a drawing holds up", () => {
  it("does not block a spec with nothing drawn", () => {
    // The property the panel got wrong, stated once here so the rest of this
    // file is about whether the panel asks it rather than what the answer is.
    expect(
      designGateBlocksDispatch({ stageEnabled: true, status: "pending", hasDrawing: false }),
    ).toBe(false);
    expect(
      designGateBlocksDispatch({ stageEnabled: true, status: "pending", hasDrawing: true }),
    ).toBe(true);
  });

  it("getDesignWorkItem CALLS the rule instead of writing it again", () => {
    const body = code(handler(read(SCAFFOLD), "getDesignWorkItem"));
    expect(body).toMatch(/blocksDispatch:\s*designGateBlocksDispatch\(\{/);
    expect(body).toMatch(/hasDrawing:\s*scaffoldErr \? undefined : !!drawing/);
  });

  it("an unreadable drawing row is not answered as no drawing", () => {
    // The sentence below is only true of a spec with nothing drawn, and the
    // `prd_scaffolds` read bound no error, so a refusal produced `drawing: null`
    // and printed it as fact. `undefined` is the word for not knowing, and
    // designGateBlocksDispatch reads it as "assume there is one" so the gate
    // stays shut rather than opening on an error. Same reading as
    // getSpecDesignRoute and loadDesignGateState.
    const body = code(handler(read(SCAFFOLD), "getDesignWorkItem"));
    expect(body).toMatch(/\{ data: scaffoldRow, error: scaffoldErr \}/);
    expect(
      designGateBlocksDispatch({ stageEnabled: true, status: "pending", hasDrawing: undefined }),
    ).toBe(true);
  });

  it("getDesignWorkItem does not re-derive it from the stage and the word", () => {
    // The exact line that shipped. A second derivation anywhere in the handler
    // would put the panel back to claiming a block that dispatch does not make.
    const body = code(handler(read(SCAFFOLD), "getDesignWorkItem"));
    expect(body).not.toMatch(/blocksDispatch:\s*stageEnabled\s*&&/);
  });
});

describe("a read whose error is discarded is never evidence of absence", () => {
  /** Every `{ data: ... }` destructure in a handler must bind `error` too. */
  const destructures = (body: string) => body.match(/\{\s*data:[^}]*\}/g) ?? [];

  it("listDesignWork binds error on every read it makes", () => {
    const body = code(handler(read(SCAFFOLD), "listDesignWork"));
    const found = destructures(body);
    expect(found.length).toBeGreaterThan(3);
    expect(found.filter((d) => !/error/.test(d))).toEqual([]);
  });

  it("listDesignWork throws rather than returning its empty shape on a failure", () => {
    // `empty` is not silence: it is "Nothing needs you.", "Nothing to look at."
    // and, from stageEnabled false, a statement of workspace policy. Throwing
    // hands the failure to the surface's own Failed branch and its Try again.
    const body = code(handler(read(SCAFFOLD), "listDesignWork"));
    expect((body.match(/if \(\w*[Ee]rr\) throw new Error\(/g) ?? []).length).toBeGreaterThan(3);
  });

  it("getScaffoldProvenance binds error on every read the ANSWER rests on", () => {
    const body = code(handler(read(SCAFFOLD), "getScaffoldProvenance"));
    // ONE EXEMPTION, and it is the only read here whose failure cannot produce a
    // false absence. The active-set lookup decides which rules are RETIRED; a
    // failure leaves every rule reported as current, which under-warns rather
    // than claiming the drawing was made from nothing, and the code says so at
    // the catch. The three reads that decide `ungrounded` have no such escape.
    const found = destructures(body).filter((d) => !/data: workspaceId/.test(d));
    expect(found.length).toBeGreaterThan(2);
    expect(found.filter((d) => !/error/.test(d))).toEqual([]);
  });

  it("provenance can say it did not find out", () => {
    // `ungrounded` is the strongest claim this panel makes -- every choice in
    // the drawing is the model's own -- and it was what a refused read printed.
    // The surface half of this assertion (that the panel HONOURS the flag)
    // read /design's own source and left with it (P-14, A-QUEUE.md, R-34);
    // this half, that the data itself can say it did not find out, has no
    // surface dependency.
    expect(code(read(SCAFFOLD))).toMatch(/read:\s*false/);
  });
});

describe("a drawing outside the window is still a drawing", () => {
  it("listDesignWork unions the specs its scaffolds found with the newest forty", () => {
    // A redraw writes prd_scaffolds and never prds.updated_at, so a drawing
    // against a spec nobody has edited since sinks out of the window. The
    // scaffold read had already fetched it; only the spec row was missing.
    const body = code(handler(read(SCAFFOLD), "listDesignWork"));
    expect(body).toMatch(/drawnOutside/);
    expect(body).toMatch(/\.in\("id", drawnOutside\)/);
  });
});

describe("a shared link is a snapshot and is labelled as one", () => {
  it("staleness is read from the markup, never from a timestamp", () => {
    // Both prototypes.updated_at and prd_scaffolds.updated_at move for reasons
    // that have nothing to do with what a visitor is served.
    const body = code(handler(read(SCAFFOLD), "getDesignWorkItem"));
    expect(body).toMatch(/drawingStamp\(\(f\.content as string\) \?\? ""\)/);
    expect(body).toMatch(/matchesDrawing:/);
  });
});
