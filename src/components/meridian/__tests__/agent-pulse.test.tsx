/**
 * ONE MARK, ONE TYPE STOP, AND THE AZURE STAYS.
 *
 * Two of these three are enforcements of a ruling and the third is a defence
 * against a tidy-up, which is why they are worth a file. `AgentPulse` shipped
 * with a `glyph` prop offering `"mark" | "grid"`, defaulting to a seven-petal
 * brand geometry the founder ruled out on 2026-08-19: *"That circle gear icon is
 * not good. I don't want to use that."* A ruling enforced by a default is not
 * enforced; the option is deleted, and these assertions are what stop it coming
 * back as a reasonable-looking variant.
 *
 * THE THIRD ONE POINTS THE OTHER WAY, and that is the interesting part. The same
 * review reported that the glyphs were invisible in light mode, and the obvious
 * repair, repainting this lattice in ink to match `LoadingState`, would have been
 * wrong twice over: the invisibility was a `color` never re-bound on the light
 * ground (fixed in `meridian.css`, and this lattice measures 7.02 on dark and
 * 5.62 on paper after it), and azure is the only thing separating an indicator
 * that reports an AGENT from one that reports a JOB. So this file also asserts
 * that the colour has NOT been changed, in the same breath as asserting the mark
 * has.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";

import { AgentPulse } from "../AgentPulse";

const SOURCE = readFileSync("src/components/meridian/AgentPulse.tsx", "utf8");

/**
 * The file with its prose removed.
 *
 * Needed because the assertions below are about the CODE, and the code's own
 * comment names the union it deleted so the next reader knows what went. The
 * first draft matched that sentence and failed on the explanation of the fix it
 * was checking for. Safe here: this file has no `/*` inside a string literal.
 */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/** The one element every case needs: the component's own root. */
function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector("[data-mrd]");
  if (!el) throw new Error("AgentPulse rendered no data-mrd root");
  return el as HTMLElement;
}

describe("the brand mark is gone, and not merely un-defaulted", () => {
  it("draws no petal geometry on any path", () => {
    // The mark was seven ellipses rotated around a shared centre. There is no
    // prop left to ask for it, so this is a check that nothing draws it anyway.
    const { container } = render(<AgentPulse label="Scout is reading the record" />);
    expect(container.querySelectorAll("ellipse").length).toBe(0);
    expect(container.innerHTML).not.toContain("mrd-spin");
  });

  it("offers no glyph choice at all", () => {
    // Asserted against the source rather than the render, because the failure
    // being guarded is somebody re-adding the union with `grid` as the default.
    // That renders identically today and puts the ruled-out drawing one prop
    // away again.
    expect(CODE).not.toMatch(/glyph\??\s*:/);
    expect(CODE).not.toMatch(/"mark"\s*\|\s*"grid"/);
    expect(CODE).not.toContain("BrandGlyph");
    // And the prose has to keep saying what went, or the next reader finds an
    // absence with no reason attached to it.
    expect(SOURCE).toContain("THERE IS NO `glyph` PROP ANY MORE");
  });

  it("no longer claims the standing ruling it was reversed by", () => {
    // The file used to say what a person watches while they wait should be the
    // brand rather than a borrowed spinner, and cited it as standing. It is not
    // written anywhere: `grep -ci brand` in DESIGN-SYSTEM.md returns 0. A file
    // arguing against the code it contains is worse than either end.
    expect(SOURCE).not.toMatch(/standing ruling that (the thing|what) a person watches/);
    // And it records the reversal instead, with the date, so this is not simply
    // an absence somebody deleted a paragraph to produce.
    expect(SOURCE).toContain("2026-08-19");
  });
});

/*
 * REVERSED 2026-08-23, ON A FOUNDER RULING, AND THE GUARD IS KEPT RATHER THAN
 * DELETED.
 *
 * This block used to be called "the azure stays, and a test is the reason it
 * can", and it asserted the opposite of everything below. It is inverted rather
 * than removed because the decision still needs enforcing; only its direction
 * changed. Deleting it would leave the next author free to re-tint the lattice
 * with nothing to stop them and no record that it was ever decided.
 *
 * FOUNDER, verbatim: "Why should it be blue colour? ... can't it be the same as
 * how it is there in the loading state? The loading state colours are both light
 * and dark, and they look premium."
 *
 * THE OLD ARGUMENT, so the reversal is arguable rather than merely obeyed:
 * `LoadingState` reports a JOB, which has no actor, while this reports an AGENT,
 * so azure named the actor. It does not survive the check. The actor is already
 * named in words, in the label this component REQUIRES ("Scout is reading the
 * record"), so the hue repeated a sentence sitting next to it. Four carriers say
 * a machine is working here (label, gerund, motion, elapsed) and repainting
 * removes only the one that dies in greyscale.
 *
 * The deciding fact was an inconsistency rather than a preference: the same 3x3
 * chevron, the same 650ms stagger, the same meaning, two different paints across
 * two components in one design system. Reasoning lives in `AgentPulse.tsx` under
 * THE LATTICE IS INK.
 */
describe("the lattice is ink, matching LoadingState, and a test is the reason it stays", () => {
  it("paints the lattice with ink", () => {
    const { container } = render(<AgentPulse label="Scout is reading the record" />);
    const cells = [...container.querySelectorAll("span")].filter((s) =>
      s.className.includes("bg-mrd-ink"),
    );
    // Nine cells on the chevron stagger, which is the reference's grid.
    expect(cells.length).toBe(9);
  });

  it("never re-tints the lattice with the agent hue", () => {
    // One mechanic meaning one thing wears one colour. `LoadingState` draws this
    // same lattice in ink; a second paint here is the two-vocabularies defect.
    const { container } = render(<AgentPulse label="Scout is reading the record" />);
    expect(container.innerHTML).not.toContain("bg-mrd-agent");
  });

  it("shimmers the word toward ink rather than toward azure", () => {
    // Brightness is what a reader perceives as motion, so the gradient's
    // midpoint is the assertion that matters.
    const { container } = render(<AgentPulse label="Scout is reading the record" />);
    const shimmer = [...container.querySelectorAll("span")].find((s) =>
      (s.getAttribute("style") ?? "").includes("linear-gradient"),
    );
    expect(shimmer?.getAttribute("style")).toContain("var(--mrd-ink) 50%");
    expect(shimmer?.getAttribute("style")).not.toContain("var(--mrd-agent)");
  });

  it("uses no raw colour", () => {
    const { container } = render(
      <AgentPulse label="Scout is reading the record" detail="14 signals" startedAt={1} />,
    );
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(container.innerHTML).not.toMatch(/\brgba?\(/);
  });
});

describe("one indicator, one type stop", () => {
  it("sits on 13px, which is the stop LoadingState's label uses", () => {
    const { container } = render(<AgentPulse label="Scout is reading the record" />);
    expect(root(container).className).toContain("text-mrd-base");
    expect(root(container).className).not.toContain("text-mrd-body");
  });

  it("keeps the same stop when compact", () => {
    // `compact` used to drop 14px to 13px, which made two indicators out of one
    // component. Compact means tighter, never smaller.
    const { container } = render(<AgentPulse label="Scout is reading the record" compact />);
    expect(root(container).className).toContain("text-mrd-base");
    expect(root(container).className).not.toContain("text-mrd-body");
  });

  it("changes the gap and only the gap between the two densities", () => {
    const { container: roomy } = render(<AgentPulse label="Scout is reading" seed="a" />);
    const { container: tight } = render(<AgentPulse label="Scout is reading" seed="a" compact />);
    const classes = (c: HTMLElement) => root(c).className.split(/\s+/).sort();
    const only = (list: string[], other: string[]) => list.filter((c) => !other.includes(c));
    expect(only(classes(roomy), classes(tight))).toEqual(["gap-mrd-4"]);
    expect(only(classes(tight), classes(roomy))).toEqual(["gap-mrd-3"]);
  });

  it("still names 13px on the ladder rather than as a raw pixel value", () => {
    // `LoadingState` writes the same stop as `text-[13px]`. That is on the ladder
    // by value and off it by form, and it is not this item's file to change; this
    // pins that AgentPulse does not copy the habit.
    expect(SOURCE).not.toMatch(/text-\[13px]/);
  });
});

describe("what it says out loud", () => {
  it("announces the static label once, never the rotating word", () => {
    // A screen reader interrupting itself every 2.6 seconds with a new gerund is
    // hostile, which is why the live region holds the sentence and the shimmering
    // word is hidden from it.
    const { container } = render(<AgentPulse label="Scout is reading the record" />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toBe("Scout is reading the record");
    expect(live?.className).toContain("sr-only");
  });

  it("shows a noun when it is given one and nothing when it is not", () => {
    const { container: withNoun } = render(
      <AgentPulse label="Scout is reading" detail="14 signals" />,
    );
    expect(screen.getByText("14 signals")).toBeTruthy();
    // The empty slot is the correct output when the specific fact is out of
    // scope. An invented one would be the same defect as a made-up progress bar.
    const { container: without } = render(<AgentPulse label="Scout is reading" seed="z" />);
    expect(without.innerHTML).not.toContain("text-mrd-faint");
    expect(withNoun.innerHTML).toContain("text-mrd-faint");
  });

  it("shows no clock unless a caller can prove when the work began", () => {
    const { container } = render(<AgentPulse label="Scout is reading" />);
    expect(container.innerHTML).not.toContain("tabular-nums");
  });
});
