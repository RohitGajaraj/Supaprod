/**
 * AN EMPTY REGION HAS A HEADLINE, AND IT IS BIGGER THAN THE SENTENCE UNDER IT.
 *
 * THE DEFECT THIS EXISTS AGAINST, in the founder's words on 2026-08-23: text is
 * dumped, with "no proper distinction between what is header one, what is header
 * two, and what is header three". Measured the same day, nine of the sixteen
 * headings in this directory rendered at 14px or smaller, which is the size of
 * body copy or less. A heading the same size as its own paragraph is not a
 * heading, and no weight rescues it at a glance.
 *
 * WHY THE ASSERTIONS ARE ON ROLE NAMES rather than on pixel values. The whole
 * point of a role is that the call site does not carry the size, so asserting
 * `20px` here would pin the wrong thing: it would pass while `--mrd-t-h3` moved
 * underneath it, and it would fail on a deliberate change to the ladder that this
 * component had nothing to do with. `a-heading-is-never-smaller-than-its-content`
 * is where the px comparison lives, and it resolves roles through `meridian.css`.
 *
 * WHAT MUST NOT BE ADDED. A fourth text level. Both references read for this
 * component (Copilot and Front, web, Mobbin, 2026-08-23) stop at three: headline,
 * supporting sentence, one control. The `meta` line is the third and it is
 * optional; anything past it is the wall of small text this replaces.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { EmptyRegion } from "../EmptyRegion";

describe("an empty region reads as a region, not as a stray sentence", () => {
  it("gives the headline a role that outranks the body", () => {
    const { container } = render(
      <EmptyRegion title="No decisions yet">Nothing has reached Decide.</EmptyRegion>,
    );
    const h2 = container.querySelector("h2");
    expect(h2?.className).toContain("mrd-title");
    // and the body is copy, which is a different role and a smaller stop
    expect(container.innerHTML).toContain("mrd-copy");
  });

  it("never assembles a size by hand", () => {
    // The failure mode being designed out: an author choosing a size, a weight
    // and a colour independently and landing somewhere no other surface landed.
    const { container } = render(
      <EmptyRegion title="No decisions yet" meta="Checked a minute ago.">
        Nothing has reached Decide.
      </EmptyRegion>,
    );
    expect(container.innerHTML).not.toMatch(/text-\[\d+(?:\.\d+)?px\]/);
    expect(container.innerHTML).not.toMatch(/font-\[\d+\]/);
  });

  it("uses no raw colour", () => {
    const { container } = render(
      <EmptyRegion title="No decisions yet">Nothing has reached Decide.</EmptyRegion>,
    );
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(container.innerHTML).not.toMatch(/\brgba?\(/);
  });

  it("omits the action entirely rather than rendering an empty slot", () => {
    /*
     * An empty region often has NOTHING for a person to do, and inventing a
     * control to look helpful is the failure `NeedsSetup` was careful about in
     * the opposite direction. No action means no container, not an empty one.
     */
    const { container } = render(
      <EmptyRegion title="No decisions yet">Nothing has reached Decide.</EmptyRegion>,
    );
    expect(container.querySelectorAll("div").length).toBeLessThanOrEqual(3);
  });

  it("stops at three text levels", () => {
    // headline + copy + meta. A fourth is the wall of small text this replaces.
    const { container } = render(
      <EmptyRegion title="No decisions yet" meta="Checked a minute ago.">
        Nothing has reached Decide.
      </EmptyRegion>,
    );
    const roles = ["mrd-title", "mrd-copy", "mrd-meta", "mrd-subtitle", "mrd-eyebrow"].filter((r) =>
      container.innerHTML.includes(r),
    );
    expect(roles.sort()).toEqual(["mrd-copy", "mrd-meta", "mrd-title"]);
  });
});
