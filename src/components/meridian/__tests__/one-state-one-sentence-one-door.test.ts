/**
 * ── EVERYTHING IS TRUE AND NOTHING IS DESIGNED ────────────────────────────
 *
 * The founder, on the tablet track's run. P-37 is that pass, and these three
 * components are its vocabulary: a card asks, a seat speaks, a row folds.
 *
 * The rule they exist to make STRUCTURAL rather than remembered is: **a screen
 * in one state asks for one thing.** Six of the seven shapes A1 catalogued are
 * that rule broken in six places, so the fix is not six patches; it is
 * components that cannot express the broken shape.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const ASK = strip(readFileSync("src/components/meridian/Ask.tsx", "utf8"));
const SEAT = strip(readFileSync("src/components/meridian/SeatSays.tsx", "utf8"));
const ROW = strip(readFileSync("src/components/meridian/FoldingRow.tsx", "utf8"));
const CSS = readFileSync("src/styles/meridian.css", "utf8");

describe("an irreversible gate cannot merge by silence", () => {
  /**
   * The sharpest thing in this packet, and it was a defect in the MOCKUP before
   * it was a component: the first draft read "If nobody answers, this merges at
   * 18:00". That is not a gate, it is a delay, on the one path customers see.
   * Caught as copy by A1; fixed as a type here, because a slot that renders
   * whatever default it is handed will eventually be handed that one.
   */
  it("takes no sentence at all for an irreversible ask", () => {
    // The irreversible arm has `since` and nothing else to fill.
    expect(ASK.replace(/\s+/g, " ")).toContain('{ kind: "irreversible"; since: string }');
    expect(ASK.replace(/\s+/g, " ")).not.toContain(
      '{ kind: "irreversible"; since: string; whatHappens: string }',
    );
  });

  it("writes that sentence itself, once, with no argument that changes it", () => {
    expect(ASK).toContain("Nothing runs until you answer.");
    expect(ASK.replace(/\s+/g, " ")).toContain('d.kind === "irreversible"');
  });
});

describe("the order is the design, so it is not a prop", () => {
  it("takes named slots and never children or a section array", () => {
    // `children` or `sections` would let the next surface reorder it.
    expect(ASK).not.toContain("children");
    expect(ASK).not.toContain("sections");
  });

  it("renders question, risk, reason, default, answers in that order", () => {
    const q = ASK.indexOf("{question}");
    const r = ASK.indexOf("{risk}");
    const why = ASK.indexOf("{reason}");
    const d = ASK.indexOf("defaultLine(fallback)");
    const a = ASK.indexOf("{answer.label}");
    expect(q).toBeGreaterThan(-1);
    expect(r).toBeGreaterThan(q);
    expect(why).toBeGreaterThan(r);
    expect(d).toBeGreaterThan(why);
    expect(a).toBeGreaterThan(d);
  });

  it("has no slot for what does not help a person answer", () => {
    // Every one is true; none of them changes the answer. A slot that exists
    // gets filled, so there is no slot.
    for (const absent of ["tokens", "elapsed", "traceId", "stationChip"]) {
      expect(ASK).not.toContain(absent);
    }
  });
});

describe("a seat cannot narrate the run, which closes shape 3 structurally", () => {
  it("has no action slot, so a message can never carry the door", () => {
    expect(SEAT).not.toContain("onPress");
    expect(SEAT).not.toContain("children");
    expect(SEAT).not.toContain("Action");
  });

  it("takes one sentence, not a list of them", () => {
    // "One message per moment" is a shape, not a discipline.
    expect(SEAT.replace(/\s+/g, " ")).toContain("said: string;");
    expect(SEAT).not.toContain("said: string[]");
  });
});

describe("the row grew, it did not toggle", () => {
  it("draws no chevron, because the height is already the state", () => {
    // Two indicators of one state is shape 2 in miniature.
    expect(ROW).not.toContain("Chevron");
    expect(ROW).not.toContain("rotate-");
  });

  it("keeps the lead outside the animated region", () => {
    // If the thing you clicked jumps, you clicked the wrong thing.
    const animated = ROW.indexOf("gridTemplateRows");
    expect(ROW.indexOf("{lead}")).toBeLessThan(animated);
  });

  it("animates grid rows rather than a measured height", () => {
    // `1fr` to `0fr` reaches the content's own height with no measurement, so a
    // resize cannot leave a stale pixel value behind.
    expect(ROW.replace(/\s+/g, " ")).toContain('gridTemplateRows: open ? "1fr" : "0fr"');
  });

  it("uses Meridian's own motion tokens, and they exist", () => {
    /*
     * THIS ASSERTION EXISTS BECAUSE I SHIPPED THE BUG IT CATCHES. The first
     * draft wrote `duration-mrd-move ease-mrd`, which are not utilities in this
     * codebase and never have been, so the motion would have been silently
     * absent while the file claimed it. That is the same "asserted but not
     * implemented" class P-37 is cleaning up, committed inside the cleanup.
     *
     * So the class is asserted AND the token is checked to exist in the system.
     */
    expect(ROW).toContain("duration-(--mrd-d-move)");
    expect(ROW).toContain("ease-(--mrd-ease)");
    expect(CSS).toContain("--mrd-d-move:");
    expect(CSS).toContain("--mrd-ease:");
    expect(ROW).not.toContain("duration-mrd-move");
  });

  it("keeps the height under reduced motion and drops the decoration", () => {
    // The height is layout; the rise and the fade are decoration.
    expect(ROW).toContain("motion-reduce:translate-y-0");
    expect(ROW).toContain("motion-reduce:opacity-100");
  });

  it("has exactly three marks", () => {
    expect(ROW.replace(/\s+/g, " ")).toContain(
      'const MARK: Record<RowMark, string> = { filed: "✓", "filed-nothing": "◦", stopped: "⊘", }',
    );
  });
});
