/**
 * THE ROWS WITH THE MOST HIDDEN WERE THE ONLY ONES WITH NO WAY IN (2026-09-01).
 *
 * `Row` truncates when a caller passes `tight`, and it hands the cut text back
 * through a `title`. That tooltip was guarded on `typeof value === "string"`,
 * and the guard is correct on its own terms: `title` on a React fragment is
 * either a type error or the literal text "[object Object]".
 *
 * But a row is a fragment EXACTLY WHEN it is composing several facts onto one
 * line, which is exactly when it has something to hide. Measured on Discover:
 * every ranking row carries rank, score, volume, which sources it came from and
 * its novelty on one line, built as a fragment, cut with an ellipsis that led
 * nowhere. The rows that most needed the way back were the only rows the guard
 * excluded.
 *
 * Founder, on this class of thing: *"everywhere, the text is getting truncated
 * ... either shorten it or give only the summary that it has required. Use
 * wherever that's necessary to get to the inside and give a clickable action."*
 *
 * So a caller that knows the plain text can hand it over. What this file pins
 * is the two rules that keep the tooltip worth believing.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { Row } from "./rows";

function titles(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll("span[title]")].map((e) => e.getAttribute("title"));
}

describe("a truncated row hands its text back", () => {
  it("takes the plain-text form from a caller whose lead is a fragment", () => {
    const { container } = render(
      <Row
        tight
        lead={
          <>
            Rank 3 <b>·</b> ICE 8.2 <b>·</b> 41 signals
          </>
        }
        leadTitle="Rank 3 · ICE 8.2 · 41 signals"
      />,
    );
    expect(titles(container)).toContain("Rank 3 · ICE 8.2 · 41 signals");
  });

  it("does the same for the sub line, which is where Discover composes", () => {
    const { container } = render(
      <Row
        tight
        lead="A cluster"
        sub={<>from Slack, Zendesk and 2 more</>}
        subTitle="from Slack, Zendesk, Intercom and Linear"
      />,
    );
    expect(titles(container)).toContain("from Slack, Zendesk, Intercom and Linear");
  });

  it("prefers the caller's sentence over the string it can read itself", () => {
    // A caller passing both has composed one thing for the eye and another for
    // a reader who has lost the context. The sentence is the one that survives.
    const { container } = render(
      <Row tight lead="Prism" leadTitle="Prism, the checkout product at Helio Labs" />,
    );
    expect(titles(container)).toContain("Prism, the checkout product at Helio Labs");
    expect(titles(container)).not.toContain("Prism");
  });
});

describe("and stays quiet where there is nothing to hand back", () => {
  /*
   * A tooltip repeating text that is fully on screen is noise, and noise is how
   * a reader learns to stop believing tooltips on the one row where something
   * really is hidden. `tight` is the caller ASSERTING the row is cut, so it
   * remains the gate even when a title is offered.
   */
  it("renders no title on a row that is not truncated, even when one is offered", () => {
    const { container } = render(
      <Row lead={<>Rank 3</>} leadTitle="Rank 3 · ICE 8.2" sub={<>x</>} subTitle="the full sub" />,
    );
    expect(titles(container)).toEqual([]);
  });

  it("still reads a plain string by itself, so 73 existing call sites are untouched", () => {
    const { container } = render(<Row tight lead="A long lead that gets cut" />);
    expect(titles(container)).toContain("A long lead that gets cut");
  });

  it("puts no title on a fragment when the caller offers none", () => {
    // The original guard, intact: better no tooltip than "[object Object]".
    const { container } = render(<Row tight lead={<>a fragment</>} />);
    expect(titles(container)).toEqual([]);
  });
});
