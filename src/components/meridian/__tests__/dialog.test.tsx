/**
 * THE FOCUS CONTRACT IS THE COMPONENT, so it is what this asserts hardest.
 *
 * A modal that looks right and strands a keyboard reader is worse than no modal,
 * and the part everybody drops is the LAST one: returning focus to whatever
 * opened it. Drop that and every question in the product leaves the reader back
 * at the top of the document, tabbing down through everything they had already
 * passed.
 *
 * WHAT IS FAKED, AND WHAT IS NOT. happy-dom moves no focus on a Tab keypress,
 * because that is the browser's job and not the DOM's. So the trap is asserted
 * the only honest way: this component intervenes at the two EDGES by calling
 * `focus()` itself, and that call is real and observable. The middle of the tab
 * order is the browser's and is not under test here, deliberately, which is also
 * why the implementation does not touch it.
 */
import { readFileSync } from "node:fs";

import * as React from "react";
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Dialog } from "../Dialog";
import { Action, Actions, Approve } from "../surface-parts";

function Question({
  open,
  onClose = () => {},
  actions,
}: {
  open: boolean;
  onClose?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Stop this run?"
      actions={
        actions ?? (
          <Actions trailing={<Action variant="destructive">Stop it</Action>}>
            <Action variant="quiet">Keep going</Action>
          </Actions>
        )
      }
    >
      Engineer has been working for 41 minutes and has touched nine files. Stopping now discards the
      changeset, and the credits already drawn are not returned.
    </Dialog>
  );
}

describe("focus goes in, cannot leave, and comes back", () => {
  it("moves focus to the first control on open", () => {
    render(<Question open />);
    expect(document.activeElement?.textContent).toBe("Keep going");
  });

  it("focuses the panel itself when there is nothing focusable in it", () => {
    /*
     * A dialog with no controls still has to take focus, or the reader is left
     * outside something that has taken over the screen. The panel carries
     * tabIndex -1 for exactly this.
     */
    render(
      <Dialog open onClose={() => {}} title="Reading the run">
        This takes a moment.
      </Dialog>,
    );
    expect(document.activeElement?.getAttribute("role")).toBe("dialog");
  });

  it("returns focus to whatever opened it", () => {
    function Host() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Stop this run
          </button>
          <Question open={open} onClose={() => setOpen(false)} />
        </>
      );
    }

    render(<Host />);
    const trigger = screen.getByRole("button", { name: "Stop this run" });
    trigger.focus();
    fireEvent.click(trigger);

    expect(document.activeElement?.textContent).toBe("Keep going");

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(document.activeElement, "the reader was stranded at the top of the document").toBe(
      trigger,
    );
  });

  it("wraps forward off the last stop", () => {
    render(<Question open />);
    const stops = screen.getAllByRole("button");
    const last = stops[stops.length - 1];
    last.focus();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });

    expect(document.activeElement).toBe(stops[0]);
  });

  it("wraps backward off the first stop", () => {
    render(<Question open />);
    const stops = screen.getAllByRole("button");
    stops[0].focus();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(stops[stops.length - 1]);
  });

  it("keeps the scrim out of the tab order, so dismiss is never an unnamed stop", () => {
    const { container } = render(<Question open />);
    const scrim = container.querySelector("[aria-hidden]");
    expect(scrim?.getAttribute("tabindex")).toBe("-1");
  });
});

describe("the ways out, and the way that is not one", () => {
  it("closes on Escape", () => {
    let closed = 0;
    render(<Question open onClose={() => closed++} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(closed).toBe(1);
  });

  it("closes on a click on the scrim", () => {
    let closed = 0;
    const { container } = render(<Question open onClose={() => closed++} />);
    fireEvent.click(container.querySelector("[aria-hidden]")!);
    expect(closed).toBe(1);
  });

  it("does not close on a click inside", () => {
    let closed = 0;
    render(<Question open onClose={() => closed++} />);
    fireEvent.click(screen.getByRole("dialog"));
    fireEvent.click(screen.getByText(/Engineer has been working/));
    expect(closed).toBe(0);
  });

  it("does not close itself when an action is pressed", () => {
    /*
     * The caller owns that, and it matters: "keep the question open and say what
     * went wrong" is a real answer, and a component cannot know when it applies.
     */
    let closed = 0;
    render(<Question open onClose={() => closed++} />);
    fireEvent.click(screen.getByRole("button", { name: "Stop it" }));
    expect(closed).toBe(0);
  });
});

describe("it is announced as a modal, and named by its own question", () => {
  it("carries role, aria-modal and a label pointing at the title", () => {
    render(<Question open />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)?.textContent).toBe("Stop this run?");
  });

  it("points its description at the consequence, not at the title", () => {
    render(<Question open />);
    const id = screen.getByRole("dialog").getAttribute("aria-describedby");
    expect(document.getElementById(id!)?.textContent).toContain("discards the changeset");
  });

  it("renders nothing at all when closed", () => {
    const { container } = render(<Question open={false} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("it spends the two tokens no Meridian component had spent", () => {
  it("dims with --mrd-scrim rather than blurring", () => {
    const { container } = render(<Question open />);
    const scrim = container.querySelector("[aria-hidden]");
    expect(scrim?.className).toContain("bg-mrd-scrim");
    // The glass ban is a standing ruling: a blurred backdrop turns the text
    // behind it into texture and costs a compositor pass per covered surface.
    expect(container.innerHTML).not.toContain("backdrop-blur");
    expect(container.innerHTML).not.toContain("blur(");
  });

  it("floats on --mrd-shadow-pane, which no Meridian component had consumed", () => {
    /*
     * THIS NAME USED TO ASSERT SOMETHING UNTRUE and it passed anyway, which is
     * the worst version of the problem: a test name is the artefact a future
     * reader trusts most, and this one said the pane shadow "had no caller in the
     * whole tree". It has five, all in the retired layer. The token is unspent
     * WITHIN MERIDIAN, which is the claim that survives measuring and is also the
     * sharper one, since it is the reason this component had to exist.
     */
    render(<Question open />);
    expect(screen.getByRole("dialog").getAttribute("style")).toContain("var(--mrd-shadow-pane)");
  });

  it("declares its entrance inline so reduced motion can reach it", () => {
    /*
     * meridian.css's reduced-motion block matches on the style attribute. An
     * animation in a utility class keeps playing for somebody who asked it not
     * to, which is a defect this repo has paid for in six files.
     */
    const { container } = render(<Question open />);
    expect(screen.getByRole("dialog").getAttribute("style")).toContain("mrd-pop-in");
    expect(container.querySelector("[aria-hidden]")?.getAttribute("style")).toContain(
      "mrd-fade-in",
    );
  });
});

describe("no native chrome, anywhere", () => {
  it("uses no native dialog element", () => {
    const { container } = render(<Question open />);
    expect(container.querySelector("dialog")).toBeNull();
  });

  it("names no banned browser primitive in its own source", () => {
    /*
     * `alert`, `confirm`, `prompt` and `<dialog>` are banned repo-wide and
     * ESLint enforces it. Asserted against the source as well, because this is
     * the component whose whole job is to make the ban survivable, and a
     * fallback to a native prompt inside it would be the one place nobody would
     * think to look.
     */
    const source = readFileSync(new URL("../Dialog.tsx", import.meta.url), "utf8");
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toContain("window.alert");
    expect(code).not.toContain("window.confirm");
    expect(code).not.toContain("window.prompt");
    expect(code).not.toContain("<dialog");
  });
});

describe("the page behind it holds still", () => {
  it("locks the body while open and puts back exactly what was there", () => {
    document.body.style.overflow = "scroll";
    const { rerender } = render(<Question open />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Question open={false} />);
    expect(document.body.style.overflow, "a surface's own lock was cleared").toBe("scroll");

    document.body.style.overflow = "";
  });
});

describe("the controls are the caller's, not the dialog's", () => {
  it("renders whatever is passed, including the gate control", () => {
    render(
      <Question
        open
        actions={
          <Actions>
            <Action variant="quiet">Discard it</Action>
            <Approve>Let it finish</Approve>
          </Actions>
        }
      />,
    );
    expect(screen.getByRole("button", { name: "Discard it" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Let it finish" })).toBeTruthy();
  });

  it("draws no actions row at all when there are none", () => {
    render(
      <Dialog open onClose={() => {}} title="Reading the run">
        This takes a moment.
      </Dialog>,
    );
    /*
     * ZERO, not one. The scrim IS a button in the markup, and it is `aria-hidden`,
     * so a role query cannot see it. That is the point of the attribute and this
     * assertion is now the proof: a screen reader is offered exactly one way out,
     * Escape, and never an unnamed dismiss control.
     */
    expect(screen.queryAllByRole("button").length).toBe(0);
  });
});

describe("a panel taller than the screen is recoverable", () => {
  /*
   * WHAT THESE CAN AND CANNOT PROVE, said out loud because the defect they guard
   * shipped past a green suite. happy-dom lays nothing out: no viewport, no
   * heights, no overflow, so there is no honest way to assert from here that the
   * top of a tall panel is reachable. What IS assertable is the structure that
   * makes it reachable, and the first build's structure could not: a centred flex
   * item with no height cap, no scroll region, and the page behind it locked.
   *
   * These read class names, which is the weakest kind of assertion in this suite.
   * They are here because the alternative is nothing, and because the specific
   * strings they name are load-bearing rather than cosmetic. The real check was a
   * browser at 400px tall.
   */
  it("caps the panel against the overlay instead of growing past it", () => {
    render(<Question open />);
    const panel = screen.getByRole("dialog");
    expect(panel.className, "a panel with no cap overflows both edges at once").toContain(
      "max-h-full",
    );
    expect(panel.className, "the cap only means anything if the panel is a column").toContain(
      "flex-col",
    );
  });

  it("scrolls the consequence and nothing else", () => {
    render(<Question open />);
    const panel = screen.getByRole("dialog");
    const body = document.getElementById(panel.getAttribute("aria-describedby")!)!;

    expect(body.className).toContain("overflow-y-auto");
    /*
     * `min-h-0` is the whole trick and it is invisible: a flex child's default
     * `min-height: auto` refuses to shrink below its content, so `overflow-y-auto`
     * on its own does nothing and the panel grows anyway. Both siblings that can
     * grow carry the same pair.
     */
    expect(
      body.className,
      "overflow-y-auto without min-h-0 does nothing in a flex column",
    ).toContain("min-h-0");

    /* The question and the controls stay put while the middle moves. */
    const title = document.getElementById(panel.getAttribute("aria-labelledby")!)!;
    expect(title.className).toContain("shrink-0");
    expect(title.className).not.toContain("overflow-y-auto");
  });
});

describe("the confirming action is on one side, and the component decides which", () => {
  it("right-aligns the actions row itself rather than leaving it to the caller", () => {
    render(<Question open />);
    const panel = screen.getByRole("dialog");
    /* Title, consequence, controls. The controls are last, which is the point. */
    const row = panel.lastElementChild!;
    expect(row.contains(screen.getByRole("button", { name: "Stop it" }))).toBe(true);
    expect(row.className, "the side moved across this component's own gallery cases").toContain(
      "justify-end",
    );
    expect(row.className).toContain("shrink-0");
  });

  it("leaves the way out as the first stop, so nothing lands on the destructive control", () => {
    render(<Question open />);
    const stops = screen.getAllByRole("button");
    expect(stops[0].textContent).toBe("Keep going");
    expect(stops[stops.length - 1].textContent).toBe("Stop it");
    expect(document.activeElement?.textContent).toBe("Keep going");
  });

  it("holds that side across every case on the gallery route", () => {
    /*
     * READ FROM THE ROUTE, because that is where the defect actually was: the
     * component was fine and its four reference cases disagreed with each other,
     * right then LEFT then right. Nothing in a component test could see that, and
     * a component test is what passed while it was true.
     *
     * `trailing` is what moved it. `Actions` renders children then `trailing` with
     * `ml-auto`, so a confirming action placed there jumps sides depending on
     * which control the caller happened to put in that slot. A dialog does not use
     * the slot at all, and this asserts that against the source rather than
     * against the comments in it.
     */
    const route = readFileSync(
      new URL("../../../routes/_authenticated.meridian.tsx", import.meta.url),
      "utf8",
    );
    const start = route.indexOf("function DialogCases()");
    expect(start, "DialogCases was renamed or removed").toBeGreaterThan(-1);
    const after = route.indexOf("\nfunction ", start + 1);
    const cases = route.slice(start, after === -1 ? undefined : after);

    const code = cases.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code, "a dialog case reached for the trailing slot and moved the confirm").not.toContain(
      "trailing",
    );
    /* Presence is asserted against the raw slice, so a comment cannot satisfy it. */
    expect(cases.split("<Dialog").length - 1).toBeGreaterThanOrEqual(4);
  });
});
