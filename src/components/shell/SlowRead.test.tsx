import * as React from "react";
import { render, screen, waitFor, renderHook } from "@testing-library/react";
import { describe, expect, it } from "bun:test";

import { SlowRead } from "./SlowRead";
import { useSlowRead, SLOW_READ_MS } from "./use-slow-read";

/**
 * A READ THAT HAS BEEN GOING TEN SECONDS MUST STOP LOOKING LIKE ONE THAT JUST
 * STARTED.
 *
 * ── THE MEASUREMENT THIS PINS ──────────────────────────────────────────────
 * `/today`, signed in, on the running product, 2026-08-27. The whole page was
 * the word "Opening" at 0.5s, 1.5s and 3.0s. At 5.0s two sentences appeared,
 * at 7.0s a third, and **at 10.0s all three were unchanged**. For those ten
 * seconds a slow read and a hung read were the same pixels.
 *
 * That is a dev server, so the DURATION is not what is being asserted here and
 * a production number would be smaller. What is asserted is the behaviour that
 * matters at any duration: past a threshold the surface starts reporting.
 *
 * ── WHY THE ASSERTIONS ARE STRUCTURAL ──────────────────────────────────────
 * The elapsed figure's FORMAT belongs to `formatElapsed` in `run-rows`, which
 * has its own tests and its own rollover rules. Matching a format string here
 * would make this file fail the day that one legitimately changes, for a
 * reason that has nothing to do with what this file is about. So this asserts
 * the SHAPE: quiet state is `Reading`'s paragraph, reporting state is not.
 */

describe("useSlowRead", () => {
  it("holds `startedAt` from the first render, so the figure counts the READ and not the escalation", async () => {
    // The whole point of passing `startedAt` down: `use-elapsed`'s header warns
    // that a timer restarting on mount "reports the age of the COMPONENT, not
    // the age of the WORK". If this moved when `slow` flipped, every wait would
    // be under-reported by exactly the threshold.
    const { result } = renderHook(() => useSlowRead(10));
    const first = result.current.startedAt;
    expect(result.current.slow).toBe(false);
    await waitFor(() => expect(result.current.slow).toBe(true));
    expect(result.current.startedAt).toBe(first);
  });

  it("is already slow when the threshold is zero, without waiting a tick", () => {
    const { result } = renderHook(() => useSlowRead(0));
    expect(result.current.slow).toBe(true);
  });

  it("keeps the boundary a stated constant rather than a number typed at a call site", () => {
    expect(SLOW_READ_MS).toBe(2500);
  });
});

describe("SlowRead", () => {
  it("is INDISTINGUISHABLE from the quiet state while the read is still ordinary", async () => {
    // A replacement that changed the fast path would have to be argued for at
    // every site that already draws `Reading`. This one only changes what
    // happens once the surface was already failing its reader.
    render(<SlowRead afterMs={100_000}>Reading the run record.</SlowRead>);
    const p = await screen.findByText("Reading the run record.");
    expect(p.tagName).toBe("P");
    expect(p.getAttribute("role")).toBe("status");
  });

  it("starts reporting once the read has taken long enough to owe a figure", async () => {
    const { container } = render(<SlowRead afterMs={10}>Reading the run record.</SlowRead>);
    await waitFor(() => {
      const hidden = container.querySelector("[aria-hidden]");
      expect(hidden, "the visual loader has not appeared").not.toBeNull();
      // The sentence survives the escalation: the reader is not told a
      // different thing is happening, only how long it has taken.
      expect(hidden!.textContent).toContain("Reading the run record.");
      // A figure is actually being reported, not just a different wrapper.
      expect(hidden!.textContent).toMatch(/\d/);
    });
  });

  it("KEEPS THE TICKING FIGURE OUT OF THE LIVE REGION, so a listener is not read a stream of numbers", async () => {
    // `use-elapsed` ticks every 100ms and `LoadingState` puts the figure inside
    // its own `role="status" aria-live="polite"`. The board draws three of
    // these at once, and the load this component exists for was measured at
    // twenty-two seconds, so a screen-reader user would be read numbers for
    // twenty-two seconds. R-19 defers small screens and does NOT defer
    // accessibility, naming aria-live on async updates specifically.
    const { container } = render(<SlowRead afterMs={10}>Reading the run record.</SlowRead>);
    await waitFor(() => expect(container.querySelector("[aria-hidden]")).not.toBeNull());

    // Nothing that can still SPEAK may carry the figure. `LoadingState` brings
    // its own live region and that one is meant to be inside the hidden half —
    // being hidden is exactly what silences it — so the rule is about what is
    // left audible, not about where every live region sits.
    const audible = [...container.querySelectorAll('[role="status"], [aria-live]')].filter(
      (el) => !el.closest("[aria-hidden]"),
    );
    expect(audible.length, "nothing is left to announce the wait at all").toBeGreaterThan(0);
    for (const live of audible) {
      expect(
        live.textContent ?? "",
        "an audible live region carries the ticking figure",
      ).not.toMatch(/\d+\.\d/);
    }

    // And what is left audible still says something. Read from `audible` and
    // not from a bare querySelector: the first `role="status"` in the tree is
    // LoadingState's own, the silenced one, and asserting on it would pass
    // while proving nothing about what a person actually hears.
    expect(audible.map((el) => el.textContent ?? "").join(" ")).toContain("Still reading.");
  });

  it("still says something when no sentence is supplied", () => {
    render(<SlowRead afterMs={100_000} />);
    expect(screen.getByText("Reading.")).toBeTruthy();
  });
});

describe("SlowRead inline", () => {
  /*
   * THE PROPERTY THAT MAKES IT SAFE IS ABOUT THE DOM, NOT ABOUT THE LOOK.
   *
   * `PageHeading` draws its `sub` inside a `<p>`, and crew's loading state —
   * the one measured at 6.9 seconds on the running product — lives there. A
   * `<p>` or a `<div>` inside a `<p>` is not a nesting mistake the browser
   * tolerates: the parser CLOSES the outer paragraph and rehangs everything
   * after it, so React's tree and the document's tree stop agreeing. Asserting
   * "no block element is emitted" is asserting the thing that would actually
   * break, rather than asserting how it looks.
   */
  const BLOCKS = "p,div,ul,ol,li,h1,h2,h3,section,article";

  it("emits NO block element, which is the whole reason it exists", async () => {
    const { container } = render(
      <SlowRead inline afterMs={10}>
        Reading the boundary in force.
      </SlowRead>,
    );
    await waitFor(() => expect(container.textContent).toMatch(/\d/));
    expect(container.querySelector(BLOCKS)).toBeNull();
  });

  it("is bare text while the read is still ordinary, adding nothing to the slot", () => {
    const { container } = render(
      <SlowRead inline afterMs={100_000}>
        Reading the boundary in force.
      </SlowRead>,
    );
    expect(container.textContent).toBe("Reading the boundary in force.");
    expect(container.querySelector(BLOCKS)).toBeNull();
  });

  it("keeps the sentence and adds the figure once the read has earned it", async () => {
    const { container } = render(
      <SlowRead inline afterMs={10}>
        Reading the boundary in force.
      </SlowRead>,
    );
    await waitFor(() => {
      expect(container.textContent).toContain("Reading the boundary in force.");
      expect(container.textContent).toMatch(/\d+\.\d/);
    });
  });
});
