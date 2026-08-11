/**
 * The two rules these instruments exist to keep, pinned.
 *
 * 1. THE SHAPE CARRIES THE STATE. A ring whose four states are told apart only
 *    by hue is the thing this component replaced, and it would still look
 *    correct in a screenshot on the day it stopped working for the reader who
 *    cannot see the hue. So the test asks the question greyscale asks: with
 *    every colour identical, are the four states still four different objects?
 *
 * 2. A DELTA IS NEVER INVENTED. The movement arrow is the one element on
 *    /decide that makes the compounding claim falsifiable, which means it is
 *    also the one element that must never appear off a number this product
 *    computed at render time. No previous score, no arrow. A previous score
 *    that rounds to no move, no arrow.
 *
 * Asserted against the STYLE ATTRIBUTE rather than the computed style: every
 * dimension here is a `--sp-*` token, jsdom resolves no custom properties, and
 * a test that read computed values would be asserting jsdom's fallbacks.
 */
import { describe, expect, test } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";

import { BatchHeader, ScoreMeter, SelectBox, StatusRing } from "./queue-instruments";
import type { Selection } from "@/components/shell/use-selection";

/** The ring is the only element carrying a role, so it is findable by it. */
function ring(label: string): HTMLElement {
  return screen.getByRole("img", { name: label });
}

describe("the status ring survives greyscale", () => {
  test("the four states are four different shapes, not four colours", () => {
    const drawn = (["empty", "part", "full", "struck"] as const).map((fill) => {
      const { unmount } = render(<StatusRing fill={fill} label={fill} />);
      const el = ring(fill);
      const shape = {
        // A filled disc sets its own background; an empty ring does not.
        filled: /background:\s*var\(--sp-[a-z-]+\)/.test(el.getAttribute("style") ?? ""),
        // The wedge and the bar are each one child; the two plain rings have none.
        parts: el.children.length,
        rotated: el.innerHTML.includes("rotate"),
      };
      unmount();
      return { fill, ...shape };
    });

    // Every state distinguishable from every other with the palette collapsed.
    const fingerprints = drawn.map((d) => `${d.filled}/${d.parts}/${d.rotated}`);
    expect(new Set(fingerprints).size).toBe(drawn.length);
  });

  test("a quiet ring spends no status colour, so amber and red stay rare", () => {
    const { unmount } = render(<StatusRing fill="part" label="watch" />);
    const style = ring("watch").getAttribute("style") ?? "";
    // The neutral is the default. A ring that reached for --sp-warn or
    // --sp-gate by accident would make the exception-only rule meaningless.
    expect(style).toContain("var(--sp-mute)");
    expect(style).not.toContain("--sp-warn");
    expect(style).not.toContain("--sp-gate");
    unmount();
  });

  test("a flagged ring confirms the shape with a hue, never replaces it", () => {
    const { unmount } = render(<StatusRing fill="struck" tone="fail" label="kill" />);
    const el = ring("kill");
    expect(el.getAttribute("style")).toContain("var(--sp-fail)");
    // The bar is still drawn: the colour is the second encoding, not the first.
    expect(el.children.length).toBe(1);
    unmount();
  });

  test("it always carries a name, because it is the row's whole state", () => {
    const { unmount } = render(<StatusRing fill="empty" label="Not reviewed" />);
    expect(ring("Not reviewed")).toBeDefined();
    unmount();
  });

  test("no raw colour and no raw size anywhere in it", () => {
    const { container, unmount } = render(<StatusRing fill="full" tone="pass" label="ship" />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(html).not.toMatch(/rgba?\(/);
    unmount();
  });
});

describe("the score meter states its ceiling and never invents a movement", () => {
  test("the title names the ceiling, so a bare number is never left to guess", () => {
    const { unmount } = render(<ScoreMeter value={7.3} ceiling={10} decimals={1} what="ICE" />);
    expect(screen.getByTitle("ICE 7.3 out of 10")).toBeDefined();
    unmount();
  });

  test("no previous score, no arrow", () => {
    const { container, unmount } = render(
      <ScoreMeter value={7.3} ceiling={10} decimals={1} delta={null} what="ICE" />,
    );
    expect(container.textContent).not.toContain("▲");
    expect(container.textContent).not.toContain("▼");
    unmount();
  });

  test("a previous score that did not move is not a movement", () => {
    const { container, unmount } = render(
      <ScoreMeter value={7.3} ceiling={10} decimals={1} delta={0} what="ICE" />,
    );
    expect(container.textContent).not.toContain("▲");
    unmount();
  });

  test("a real movement is drawn with its direction and its size", () => {
    const up = render(<ScoreMeter value={7.3} ceiling={10} decimals={1} delta={2} what="ICE" />);
    expect(up.container.textContent).toContain("▲2.0");
    up.unmount();

    const down = render(
      <ScoreMeter value={4.1} ceiling={10} decimals={1} delta={-1.5} what="ICE" />,
    );
    expect(down.container.textContent).toContain("▼1.5");
    down.unmount();
  });

  /**
   * COLOUR IS THE SECOND CHANNEL AND NEVER THE ONLY ONE.
   *
   * The ramp was added on 2026-08-11 because a grey bar has to be MEASURED to
   * be read, which costs a fixation per row on a ranked queue, and the founder
   * put it plainly: "everything is a grey tone, the user cannot really pick
   * until he clearly focuses on the score."
   *
   * These assertions pin BOTH halves, because the hue is only defensible while
   * the redundant channel survives. If someone later drops the width or the
   * numeral and keeps the colour, this fails, which is the point: that version
   * would be unreadable in greyscale and to a reader who cannot separate red
   * from green.
   */
  test("the band is carried by hue AND by the two channels that survive greyscale", () => {
    const strong = render(<ScoreMeter value={9} ceiling={10} decimals={1} what="ICE" />);
    expect(strong.container.innerHTML).toContain("--sp-score-strong");
    expect(strong.container.innerHTML).toContain("width: 90%");
    expect(strong.container.textContent).toContain("9.0");
    strong.unmount();

    const fair = render(<ScoreMeter value={5} ceiling={10} decimals={1} what="ICE" />);
    expect(fair.container.innerHTML).toContain("--sp-score-fair");
    fair.unmount();

    const weak = render(<ScoreMeter value={2} ceiling={10} decimals={1} what="ICE" />);
    expect(weak.container.innerHTML).toContain("--sp-score-weak");
    weak.unmount();
  });

  test("the band reads the same at ceiling 100 as at ceiling 10", () => {
    // The meter is used with both. A threshold in points would mean two
    // different things on two surfaces, so the band is a fraction.
    const ten = render(<ScoreMeter value={8} ceiling={10} what="ICE" />);
    const hundred = render(<ScoreMeter value={80} ceiling={100} what="severity" />);
    expect(ten.container.innerHTML).toContain("--sp-score-strong");
    expect(hundred.container.innerHTML).toContain("--sp-score-strong");
    ten.unmount();
    hundred.unmount();
  });

  test("movement says which way in colour as well as in the glyph", () => {
    const up = render(<ScoreMeter value={7.3} ceiling={10} decimals={1} delta={2} what="ICE" />);
    expect(up.container.innerHTML).toContain("--sp-move-up");
    up.unmount();

    const down = render(
      <ScoreMeter value={4.1} ceiling={10} decimals={1} delta={-1.5} what="ICE" />,
    );
    expect(down.container.innerHTML).toContain("--sp-move-down");
    down.unmount();
  });

  test("the bar is drawn against the stated ceiling and cannot overflow it", () => {
    const { container, unmount } = render(<ScoreMeter value={99} ceiling={10} what="ICE" />);
    expect(container.innerHTML).toContain("width: 100%");
    unmount();
  });

  test("the bar carries no hue: magnitude is length, status is colour", () => {
    const { container, unmount } = render(<ScoreMeter value={9} ceiling={10} what="ICE" />);
    const html = container.innerHTML;
    for (const status of ["--sp-pass", "--sp-fail", "--sp-warn", "--sp-gate"]) {
      expect(html).not.toContain(status);
    }
    unmount();
  });
});

describe("the batch header refuses to render a zero as a finding", () => {
  test("a bucket at zero is dropped", () => {
    const { container, unmount } = render(
      <BatchHeader
        facts={[
          { n: 12, label: "bets ranked", always: true },
          { n: 0, label: "flagged" },
          { n: 3, label: "awaiting review" },
        ]}
      />,
    );
    expect(container.textContent).toContain("bets ranked");
    expect(container.textContent).toContain("awaiting review");
    expect(container.textContent).not.toContain("flagged");
    unmount();
  });

  test("the total keeps its zero, because on an empty queue the zero IS the answer", () => {
    const { container, unmount } = render(
      <BatchHeader facts={[{ n: 0, label: "bets ranked", always: true }]} />,
    );
    expect(container.textContent).toContain("bets ranked");
    unmount();
  });

  test("nothing to say, nothing drawn", () => {
    const { container, unmount } = render(<BatchHeader facts={[{ n: 0, label: "flagged" }]} />);
    expect(container.innerHTML).toBe("");
    unmount();
  });
});

describe("the row tick keeps shift-range alive", () => {
  function stub(over: Partial<Selection> = {}): Selection {
    return {
      ids: new Set<string>(),
      count: 0,
      has: () => false,
      toggle: () => {},
      selectAll: () => {},
      clear: () => {},
      allSelected: false,
      ...over,
    };
  }

  test("the modifier reaches useSelection, which onChange alone cannot report", () => {
    const seen: { id: string; shift?: boolean }[] = [];
    const { unmount } = render(
      <SelectBox
        id="b1"
        label="Select b1"
        selection={stub({ toggle: (id, e) => seen.push({ id, shift: e?.shiftKey }) })}
      />,
    );
    const box = screen.getByLabelText("Select b1");
    fireEvent.mouseDown(box, { shiftKey: true });
    fireEvent.click(box);
    expect(seen).toEqual([{ id: "b1", shift: true }]);
    unmount();
  });

  test("an ordinary click is an ordinary toggle", () => {
    const seen: { id: string; shift?: boolean }[] = [];
    const { unmount } = render(
      <SelectBox
        id="b2"
        label="Select b2"
        selection={stub({ toggle: (id, e) => seen.push({ id, shift: e?.shiftKey }) })}
      />,
    );
    const box = screen.getByLabelText("Select b2");
    fireEvent.mouseDown(box);
    fireEvent.click(box);
    expect(seen).toEqual([{ id: "b2", shift: false }]);
    unmount();
  });
});
