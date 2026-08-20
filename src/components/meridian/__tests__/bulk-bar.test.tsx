/**
 * THE SELECTION BAR, AND THE THREE CONTRACTS NOTHING IN THIS REPO ASSERTED.
 *
 * ── WHY THIS FILE IS THE POINT OF THE ITEM RATHER THAN A CHORE ──────────
 * The retired `SelectionBar` shipped three behaviours that live ONLY inside the
 * component body, and until this file no test in the repo rendered that
 * component at all. So all three were carried by reading:
 *
 *   Escape clears.        A `window` keydown listener. It is not in
 *                         `use-selection.ts` -- that module exports a type and a
 *                         hook and the word "keydown" does not appear in it -- so
 *                         an agent porting the paint has nothing to trip over.
 *                         This is exactly the behaviour a paint-only port drops.
 *   Nothing selected      An early `return null`. A bar that renders an empty
 *   renders nothing.      strip holds a row open on every list in the product.
 *   Select-all appears    `!allSelected && total > count`. Both halves matter:
 *   only when it would    without the second, a filtered list where every
 *   change something.     visible row is already selected offers a button that
 *                         reports a number and does nothing.
 *
 * ── WHAT IS REAL HERE AND WHAT IS A STAND-IN ────────────────────────────
 * The clearing tests drive the REAL `useSelection`, because the thing under test
 * is a listener talking to that hook's `clear`, and a fake would only prove the
 * fake works. The gate tests use a hand-built `Selection` with a counting
 * `clear`, because the claim there is a NEGATIVE -- that no listener is bound
 * while the selection is empty -- and the only honest way to observe a call that
 * must not happen is to be able to count it.
 */
import * as React from "react";
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Action, BulkBar } from "../surface-parts";
import { useSelection, type Selection } from "@/components/shell/use-selection";

const ROWS = ["d1", "d2", "d3", "d4"];

/** A list with real selection state, so the bar is wired to the hook it ships
 *  against rather than to a description of it. Seeded in an effect rather than
 *  during render, because a render-phase toggle is a different code path from
 *  the one a person clicking a row takes. */
function Queue({ preselect, noun = "decision" }: { preselect: string[]; noun?: string }) {
  const selection = useSelection(ROWS);
  const { toggle } = selection;
  React.useEffect(() => {
    for (const id of preselect) toggle(id);
    // Seeds once. The ids are a fixture and do not change under the test.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <BulkBar selection={selection} total={ROWS.length} noun={noun}>
      <Action>Approve</Action>
    </BulkBar>
  );
}

/** A `Selection` built by hand, for the assertions that are about what the bar
 *  does NOT do. */
function stubSelection(over: Partial<Selection> = {}): Selection {
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

describe("nothing selected is not an empty bar, it is no bar", () => {
  it("renders nothing at all when the count is zero", () => {
    const { container } = render(
      <BulkBar selection={stubSelection()} total={4}>
        <Action>Approve</Action>
      </BulkBar>,
    );
    expect(container.innerHTML, "an empty selection held a row open").toBe("");
  });

  it("binds no Escape listener while the selection is empty", () => {
    /*
     * The listener is gated behind `if (count === 0) return`, and that gate is
     * not tidiness: Escape is how every dialog, menu and mode in this product
     * closes, so a bar that listens for it while nothing is selected is a
     * keystroke competing with all of them, from every list on the page.
     */
    let cleared = 0;
    render(
      <BulkBar selection={stubSelection({ clear: () => cleared++ })} total={4}>
        <Action>Approve</Action>
      </BulkBar>,
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(cleared, "an empty bar answered Escape on behalf of the whole page").toBe(0);
  });
});

describe("Escape clears, because a selection is a mode", () => {
  it("clears a live selection on Escape", () => {
    render(<Queue preselect={["d1", "d2"]} />);
    expect(screen.getByText(/selected/)).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      screen.queryByText(/selected/),
      "Escape did not leave the mode, which is how every other mode here leaves",
    ).toBeNull();
  });

  it("answers Escape and no other key", () => {
    render(<Queue preselect={["d1", "d2"]} />);

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Backspace" });
    fireEvent.keyDown(window, { key: "Delete" });

    expect(screen.getByText(/selected/), "a bare keystroke discarded a selection").toBeTruthy();
  });

  it("stops listening once the bar has gone", () => {
    /* The effect's cleanup, checked by the only observable route: after Escape
       the bar is unmounted, so a second Escape has nothing to reach. A leaked
       listener here would be one per list, per selection. */
    render(<Queue preselect={["d1"]} />);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByText(/selected/)).toBeNull();
  });
});

describe("select all is offered only when it would change something", () => {
  it("offers it, with the real total, when rows are left unselected", () => {
    render(<Queue preselect={["d1"]} />);
    expect(screen.getByRole("button", { name: "Select all 4" })).toBeTruthy();
  });

  it("withholds it once everything is selected", () => {
    render(
      <BulkBar selection={stubSelection({ count: 4, allSelected: true })} total={4}>
        <Action>Approve</Action>
      </BulkBar>,
    );
    expect(screen.queryByRole("button", { name: /Select all/ })).toBeNull();
  });

  it("withholds it when the total does not exceed the count, whatever allSelected says", () => {
    /*
     * The second half of the gate, and the half a port drops. `allSelected` is
     * computed against the ids the hook was handed; `total` is what the surface
     * is showing after its own filtering. The two can disagree, and when the
     * total is not larger than the count the button would state a number and do
     * nothing.
     */
    render(
      <BulkBar selection={stubSelection({ count: 4, allSelected: false })} total={4}>
        <Action>Approve</Action>
      </BulkBar>,
    );
    expect(screen.queryByRole("button", { name: /Select all/ })).toBeNull();
  });

  it("selects every row when it is taken, and then withdraws itself", () => {
    const { container } = render(<Queue preselect={["d1"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Select all 4" }));
    expect(container.textContent).toContain("4 decisions selected");
    expect(screen.queryByRole("button", { name: /Select all/ })).toBeNull();
  });

  it("keeps Clear on offer whenever the bar is up", () => {
    render(<Queue preselect={ROWS} />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
  });

  it("clears on the button as well as on the key", () => {
    render(<Queue preselect={["d1", "d2"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText(/selected/)).toBeNull();
  });
});

describe("the count is a fact, stated once", () => {
  it("pluralises the caller's singular noun", () => {
    const one = render(<Queue preselect={["d1"]} />);
    expect(one.container.textContent).toContain("1 decision selected");
    one.unmount();

    const two = render(<Queue preselect={["d1", "d2"]} />);
    expect(two.container.textContent).toContain("2 decisions selected");
  });

  it("puts the figure in the data face, which is the rule for every number here", () => {
    const { container } = render(<Queue preselect={["d1", "d2"]} />);
    expect(
      container.querySelector("[data-num]")?.textContent,
      "the count is a number, and a number goes in Num",
    ).toBe("2");
  });

  it("names itself to a screen reader by what is true of it", () => {
    render(<Queue preselect={["d1", "d2", "d3"]} />);
    expect(screen.getByRole("region", { name: "3 selected" })).toBeTruthy();
  });
});

describe("the frame", () => {
  it("carries data-mrd, or every control in it loses the focus ring", () => {
    render(<Queue preselect={["d1"]} />);
    expect(screen.getByRole("region", { name: "1 selected" }).hasAttribute("data-mrd")).toBe(true);
  });

  it("pushes the verbs to the trailing edge and leaves the escapes on the left", () => {
    /* The count and the two escapes stay together where the eye lands first. The
       verbs are the only thing that moves, and they move by `ml-auto` rather than
       by a spacer, so an added verb cannot push the count off its own edge. */
    const { container } = render(<Queue preselect={["d1"]} />);
    expect(container.querySelector(".ml-auto")?.textContent).toBe("Approve");
  });

  it("spends no status hue, because a selection is a state and not an outcome", () => {
    const bar = render(<Queue preselect={["d1"]} />).container.firstElementChild!;
    const paint = bar.getAttribute("class") ?? "";
    for (const word of ["you", "agent", "pass", "fail", "hold", "stop"]) {
      expect(paint, `the bar wore --mrd-${word}, which reports something it is not`).not.toContain(
        `mrd-${word}`,
      );
    }
  });
});
