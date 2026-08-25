/**
 * EVERY ARTIFACT THE SPINE CAN FILE HAS A MARK, AND NO MARK WAS INVENTED.
 *
 * ── THE GAP THIS CLOSES ─────────────────────────────────────────────────────
 * Two lanes filed the same finding on 2026-08-25 within an hour of each other.
 * LANE 1's design audit (unit 072): ArtifactPane's member rows state their kind
 * as a plain right-aligned word -- "prototype", "signal", "spec" -- where
 * `WorkGlyph` was built so a row carries SHAPE beside the word. LANE 0's routing
 * (`coordination/requests/mrd-workglyph-artifact-kinds.md`) confirmed the honest
 * half: none of the original five kinds maps to a filed artifact, so there was
 * nothing to adopt without inventing meanings.
 *
 * ── WHY THIS IS A TEST AND NOT A COMMENT ────────────────────────────────────
 * The failure mode is not a missing drawing. It is a drawing set that agrees
 * with the database TODAY and quietly stops agreeing the next time a station
 * gets a tool. `attach.ts` is the one vocabulary -- `TOOL_PRODUCTS` (which tool
 * makes which kind), `STATION_ARTIFACT` (what each station exists to produce)
 * and `KIND_WORD` (what a person is shown) -- and this file walks all three, so
 * an eleventh kind fails the build HERE until somebody draws it, rather than
 * shipping a row with a word and an empty gutter.
 *
 * That is the same argument `station-glyphs.tsx` makes for `Record<AgentStation,
 * ...>` over a partial, and the same one `agent-marks-are-distinct.test.ts`
 * makes for the crew: when identity is carried by shape and nothing else, a
 * missing shape is a row nobody can identify, and two rows sharing a shape are
 * the same row to a reader.
 *
 * ── THE REVERSE DIRECTION MATTERS JUST AS MUCH ──────────────────────────────
 * Both requests SUGGESTED a kind list in prose. Prose lists drift from the
 * database -- one of them offered `spec` and `release`, which are the WORDS
 * (`KIND_WORD`) rather than the kinds (`prd`, `deployment`). So this file also
 * asserts that nothing in the glyph map is absent from the spine: a kind we drew
 * but the product never files is a promise the record cannot keep.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { KIND_WORD, STATION_ARTIFACT, TOOL_PRODUCTS } from "@/lib/spine/attach";
import { STATION_GLYPHS, StationGlyph, type StationGlyphKind } from "../station-glyphs";
import {
  GLYPH_FOR_ARTIFACT_KIND,
  WORK_GLYPHS,
  WorkGlyph,
  glyphForArtifactKind,
  type WorkGlyphKind,
} from "../work-glyphs";

const KINDS = Object.keys(WORK_GLYPHS) as WorkGlyphKind[];

/** The drawing itself, as the browser would see it: no wrapper, no size. */
function drawingOf(kind: WorkGlyphKind): string {
  const { container } = render(<WorkGlyph kind={kind} />);
  return container.querySelector("svg")?.innerHTML ?? "";
}

describe("the spine's artifact kinds all have a mark", () => {
  it("has kinds to check, so an empty read cannot pass this file vacuously", () => {
    // Without this every assertion below would hold against a broken import.
    expect(Object.keys(KIND_WORD).length).toBeGreaterThan(8);
    expect(KINDS.length).toBeGreaterThan(12);
  });

  it("draws every kind `KIND_WORD` can put on a row", () => {
    const undrawn = Object.keys(KIND_WORD).filter((kind) => glyphForArtifactKind(kind) === null);
    expect(undrawn, "these artifact kinds reach a member row with a word and no shape").toEqual([]);
  });

  it("draws whatever every registered tool produces", () => {
    // TOOL_PRODUCTS is the attribution table: if a tool can return an id, the
    // row it creates can be filed, so it can be rendered.
    const undrawn = [
      ...new Set(Object.values(TOOL_PRODUCTS).map((product) => product.kind)),
    ].filter((kind) => glyphForArtifactKind(kind) === null);
    expect(undrawn, "a registered tool files a kind nothing can draw").toEqual([]);
  });

  it("draws what each of the seven stations exists to produce", () => {
    // The acceptance is one piece of work crossing all seven stations on one
    // screen. A station whose artifact has no mark is a hole in that screen.
    const undrawn = Object.entries(STATION_ARTIFACT)
      .filter(([, artifact]) => glyphForArtifactKind(artifact.kind) === null)
      .map(([station, artifact]) => `${station} -> ${artifact.kind}`);
    expect(undrawn, "these stations produce something with no mark").toEqual([]);
  });

  it("invents nothing: every mapped kind is one the spine actually files", () => {
    const unfiled = Object.keys(GLYPH_FOR_ARTIFACT_KIND).filter((kind) => !(kind in KIND_WORD));
    expect(unfiled, "these kinds are drawn but the product never files them").toEqual([]);
  });

  it("keys on the KIND and never on the word a person reads", () => {
    /*
     * The three that differ are the whole reason this assertion exists: keying
     * on the word would make a copy change a glyph change, and `KIND_WORD` is
     * copy. `spec`, `release` and `cluster` are what a person sees; `prd`,
     * `deployment` and `theme` are what the column holds.
     */
    expect(KIND_WORD.prd.one).toBe("spec");
    expect(KIND_WORD.deployment.one).toBe("release");
    expect(KIND_WORD.theme.one).toBe("cluster");
    for (const word of ["spec", "release", "cluster"]) {
      expect(glyphForArtifactKind(word), `${word} is the word, not the kind`).toBeNull();
    }
  });

  it("maps mission onto the run mark, deliberately, and aliases nothing else", () => {
    // A mission IS a run -- `KIND_WORD` spells it that way -- so it borrows the
    // mark rather than taking a fourteenth silhouette. Any OTHER alias would be
    // two artifact kinds a reader cannot tell apart, which is the defect.
    expect(glyphForArtifactKind("mission")).toBe("run");

    const seen = new Map<WorkGlyphKind, string[]>();
    for (const [artifact, glyph] of Object.entries(GLYPH_FOR_ARTIFACT_KIND)) {
      seen.set(glyph, [...(seen.get(glyph) ?? []), artifact]);
    }
    const shared = [...seen.entries()]
      .filter(([, kinds]) => kinds.length > 1)
      .map(([glyph, kinds]) => `${glyph}: ${kinds.join(" + ")}`);
    expect(shared, "these artifact kinds share one mark").toEqual([]);
  });

  it("says nothing rather than guessing, for a kind it has never heard of", () => {
    // The designed sad path: a row renders its word alone. A nearby shape would
    // tell a reader an unknown kind is a prototype.
    expect(glyphForArtifactKind("a-kind-that-does-not-exist")).toBeNull();
    expect(glyphForArtifactKind("")).toBeNull();
  });
});

describe("the marks are a set, and no two of them are the same mark", () => {
  it("gives every kind in the union a drawing with real geometry", () => {
    const empty = KINDS.filter((kind) => drawingOf(kind).trim().length === 0);
    expect(empty, "these kinds render an empty svg").toEqual([]);
  });

  it("keeps the original five, unchanged in name", () => {
    // Named rather than left to the general rule: the second half must not have
    // been bought by renaming the first, which every existing caller imports.
    for (const kind of ["call", "reply", "run", "finished", "forecast"] as const) {
      expect(KINDS, `${kind} left the union`).toContain(kind);
    }
  });

  it("draws no two kinds the same", () => {
    const byDrawing = new Map<string, WorkGlyphKind[]>();
    for (const kind of KINDS) {
      const drawing = drawingOf(kind);
      byDrawing.set(drawing, [...(byDrawing.get(drawing) ?? []), kind]);
    }
    const shared = [...byDrawing.values()]
      .filter((kinds) => kinds.length > 1)
      .map((kinds) => kinds.join(" + "));
    expect(shared, "these kinds share one silhouette, so a reader cannot tell them apart").toEqual(
      [],
    );
  });

  it("borrows no station's mark, because the two families sit on one row", () => {
    /*
     * A feed line carries its station mark and its kind mark side by side. Two
     * identical drawings on one row is not a near miss, it is the row saying the
     * same thing twice and the reader learning neither.
     */
    const stationDrawings = new Set(
      (Object.keys(STATION_GLYPHS) as StationGlyphKind[]).map((kind) => {
        const { container } = render(<StationGlyph kind={kind} />);
        return container.querySelector("svg")?.innerHTML ?? "";
      }),
    );
    const borrowed = KINDS.filter((kind) => stationDrawings.has(drawingOf(kind)));
    expect(borrowed, "these kind marks are a station mark").toEqual([]);
  });
});

describe("a mark is a mark and never a colour, a size or a label", () => {
  it("draws in the ink it inherits, never in a colour of its own", () => {
    // Law 4: identity is shape, status is hue. A per-kind colour would spend the
    // status palette on category.
    for (const kind of KINDS) {
      const { container } = render(<WorkGlyph kind={kind} />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("stroke")).toBe("currentColor");
      expect(container.innerHTML, `${kind} carries a raw colour`).not.toMatch(
        /#[0-9a-fA-F]{3,8}\b/,
      );
      expect(container.innerHTML, `${kind} carries a raw colour`).not.toMatch(/\brgba?\(/);
      expect(container.innerHTML, `${kind} carries a raw colour`).not.toMatch(/\boklch\(/);
    }
  });

  it("holds the family's default size, which is StationGlyph's", () => {
    // Two glyph sets that disagree about their default read as a rendering bug
    // on the row that carries both.
    const { container } = render(<WorkGlyph kind="prototype" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("13");
    expect(svg?.getAttribute("height")).toBe("13");

    const station = render(<StationGlyph kind="design" />);
    expect(station.container.querySelector("svg")?.getAttribute("width")).toBe("13");
  });

  it("stays out of the accessibility tree for every kind, old and new", () => {
    // Every one of these sits beside a word that already says what it is, so a
    // reader hearing "prototype icon, prototype" is hearing it twice.
    for (const kind of KINDS) {
      const { container } = render(<WorkGlyph kind={kind} />);
      expect(
        container.querySelector("svg")?.getAttribute("aria-hidden"),
        `${kind} announces itself`,
      ).toBe("true");
    }
  });

  it("assembles no type stop by hand", () => {
    // R-20 3: a hardcoded size or weight is a fail, not a nit.
    for (const kind of KINDS) {
      const { container } = render(<WorkGlyph kind={kind} />);
      expect(container.innerHTML).not.toMatch(/text-\[\d+(?:\.\d+)?px\]/);
      expect(container.innerHTML).not.toMatch(/font-\[\d+\]/);
    }
  });

  it("carries no motion, so it can carry no raw duration", () => {
    // R-20 4. A mark that reports nothing changing has nothing to animate; the
    // assertion exists so a later "polish" pass cannot add one without a token.
    for (const kind of KINDS) {
      const { container } = render(<WorkGlyph kind={kind} />);
      expect(container.innerHTML, `${kind} animates`).not.toMatch(/\d+m?s\b/);
      expect(container.innerHTML).not.toContain("<animate");
      expect(container.innerHTML).not.toContain("transition");
    }
  });

  it("carries no retired token, anywhere in the set", () => {
    for (const kind of KINDS) {
      const { container } = render(<WorkGlyph kind={kind} />);
      for (const retired of ["--sp-", "--ds-", "--text-", "hairline", "raised", "data-obsidian"]) {
        expect(container.innerHTML, `${kind} carries ${retired}`).not.toContain(retired);
      }
    }
  });
});
