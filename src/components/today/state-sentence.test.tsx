import { render } from "@testing-library/react";
import { describe, expect, it } from "bun:test";

import { stateSentence } from "./state-sentence";

/**
 * THE PRODUCT'S MOST IMPORTANT SENTENCE, ACTUALLY RENDERED.
 *
 * ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
 * `stateSentence` builds the headline of the board: the first thing a person
 * reads, every morning, and the line every other count on the surface is
 * checked against. It lived inline in a 2,700-line route, so the only way to
 * assert anything about it was to read the route as TEXT and check that a
 * literal appeared somewhere in it.
 *
 * That is a real gap and it was found by hitting it. The "At least" wording
 * added when a bounded read is reported could not be exercised against the
 * running product: this workspace's largest family holds 10 calls against a
 * limit of 100, so the capped path never fires here, and injecting the gap into
 * the response failed because the server function's body is TSS-framed rather
 * than plain JSON. A source assertion cannot tell "At least 52 decisions" from
 * "At least52 decisions", and neither can `tsc`.
 *
 * Extracting the function makes the sentence renderable, so these read what a
 * person would read.
 *
 * ── WHAT IS PINNED, AND WHY EACH ONE ───────────────────────────────────────
 * The counts here are the live shape, not invented: 52 calls, 89 proposed
 * missions nobody launched, and a queue whose largest family is 10.
 */

const text = (node: React.ReactNode) => {
  const { container } = render(<>{node}</>);
  return container.textContent ?? "";
};

const base = { ready: 0, partial: false, stuck: 0, waiting: 0, shipped: 0 };

describe("the ready clause", () => {
  it("states an exact count when the queue reported itself in full", () => {
    expect(text(stateSentence({ ...base, ready: 52 }))).toContain(
      "52 decisions are ready for your review.",
    );
  });

  it("CALLS IT A FLOOR WHEN THE READ WAS BOUNDED, with the space intact", () => {
    // The defect a source assertion cannot catch: "At least52".
    expect(text(stateSentence({ ...base, ready: 52, partial: true }))).toContain(
      "At least 52 decisions are ready for your review.",
    );
  });

  it("agrees with itself about one, in both forms", () => {
    expect(text(stateSentence({ ...base, ready: 1 }))).toContain(
      "1 decision is ready for your review.",
    );
    expect(text(stateSentence({ ...base, ready: 1, partial: true }))).toContain(
      "At least 1 decision is ready for your review.",
    );
  });

  it("REFUSES 'Nothing is ready' ON A ZERO IT CANNOT TRUST", () => {
    // A zero from a partial read is the sentence a person acts on by closing
    // the tab. It must never be printed from a queue that failed to load.
    const out = text(stateSentence({ ...base, ready: 0, partial: true }));
    expect(out).not.toContain("Nothing is ready");
    expect(out).toContain("did not load");
  });

  it("still says nothing is ready when the queue genuinely reported zero", () => {
    expect(text(stateSentence({ ...base, ready: 0 }))).toContain(
      "Nothing is ready for your review.",
    );
  });
});

describe("the second clause", () => {
  it("SAYS NOTHING while the run record has not answered", () => {
    // Silent, not zero: every branch reads a number the record owns, and the
    // fallback " Nothing is stuck." is exactly the false claim an unanswered
    // read would produce.
    const out = text(
      stateSentence({ ...base, ready: 52, stuck: null, waiting: null, shipped: null }),
    );
    expect(out).toBe("52 decisions are ready for your review.");
  });

  it("puts a failure ahead of a queue, because something broke outranks something not begun", () => {
    expect(text(stateSentence({ ...base, ready: 52, stuck: 2, waiting: 89 }))).toContain(
      "2 runs are stuck.",
    );
  });

  it("NEVER FOLDS 89 UNLAUNCHED RUNS INTO 'stuck'", () => {
    // `waiting` counts `proposed` missions an ambient trigger raised and nobody
    // launched. Nothing went wrong with them; calling them stuck would tell a
    // person 89 things had broken when none had started.
    const out = text(stateSentence({ ...base, ready: 0, stuck: 0, waiting: 89 }));
    expect(out).toContain("89 runs are waiting for you to launch them.");
    expect(out).not.toContain("stuck");
  });

  it("keeps the 24-hour window on the shipped clause and nowhere else", () => {
    const shipped = text(stateSentence({ ...base, ready: 0, shipped: 3 }));
    expect(shipped).toContain("3 runs shipped in the last 24 hours.");
    const stuck = text(stateSentence({ ...base, ready: 0, stuck: 2 }));
    expect(stuck).not.toContain("24 hours");
  });
});
