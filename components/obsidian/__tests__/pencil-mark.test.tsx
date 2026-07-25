import { describe, expect, test } from "bun:test";
import { PencilArrow, PencilCircle, PencilLabel, PencilUnderline } from "../pencil-mark";

const PENCIL_STROKES = ["var(--pencil-lime)", "var(--pencil-blossom)", "var(--pencil-apricot)"];

describe("PencilCircle - a rough near-circle", () => {
  test("renders a rough path (more than a handful of vertices), no fill", () => {
    const el = PencilCircle({ cx: 50, cy: 50, r: 20, seed: 7 }) as any;
    expect(el.type).toBe("path");
    expect(el.props.fill).toBe("none");
    expect(el.props.d.split("L").length).toBeGreaterThan(4);
  });

  test("is deterministic across two renders with the same seed", () => {
    const a = PencilCircle({ cx: 50, cy: 50, r: 20, seed: 7 }) as any;
    const b = PencilCircle({ cx: 50, cy: 50, r: 20, seed: 7 }) as any;
    expect(a.props.d).toBe(b.props.d);
  });

  test("only uses pencil inks", () => {
    for (const ink of ["best-bet", "pet-feature", "scope-creep"] as const) {
      const el = PencilCircle({ cx: 10, cy: 10, r: 5, ink, seed: 1 }) as any;
      expect(PENCIL_STROKES).toContain(el.props.stroke);
    }
  });
});

describe("PencilArrow - a hand arrow", () => {
  test("renders a shaft plus two barbs, all in a pencil ink", () => {
    const el = PencilArrow({ from: [0, 0], to: [40, 40], seed: 3 }) as any;
    expect(el.type).toBe("g");
    expect(PENCIL_STROKES).toContain(el.props.stroke);
    const children = el.props.children as any[];
    expect(children.length).toBe(3);
  });
});

describe("PencilUnderline - a wavy underline", () => {
  test("renders a rough horizontal path in a pencil ink", () => {
    const el = PencilUnderline({ x1: 10, x2: 90, y: 20, seed: 5 }) as any;
    expect(el.type).toBe("path");
    expect(PENCIL_STROKES).toContain(el.props.stroke);
    expect(el.props.fill).toBe("none");
  });
});

describe("PencilLabel - the PM's own handwriting", () => {
  test("renders role=note in the pencil font, in a pencil ink", () => {
    const el = PencilLabel({ x: 10, y: 20, children: "our best bet" }) as any;
    expect(el.props.role).toBe("note");
    expect(el.props.fontFamily).toBe("var(--font-pencil)");
    expect(PENCIL_STROKES).toContain(el.props.fill);
  });

  test("rotates -2deg by default", () => {
    const el = PencilLabel({ x: 10, y: 20, children: "watch this week" }) as any;
    expect(el.props.transform).toBe("rotate(-2 10 20)");
  });
});
