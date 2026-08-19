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

    expect(
      document.activeElement,
      "the reader was stranded at the top of the document",
    ).toBe(trigger);
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

describe("it uses the two tokens that had no caller", () => {
  it("dims with --mrd-scrim rather than blurring", () => {
    const { container } = render(<Question open />);
    const scrim = container.querySelector("[aria-hidden]");
    expect(scrim?.className).toContain("bg-mrd-scrim");
    // The glass ban is a standing ruling: a blurred backdrop turns the text
    // behind it into texture and costs a compositor pass per covered surface.
    expect(container.innerHTML).not.toContain("backdrop-blur");
    expect(container.innerHTML).not.toContain("blur(");
  });

  it("floats on --mrd-shadow-pane, which had no caller in the whole tree", () => {
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
          <Actions trailing={<Action variant="destructive">Discard it</Action>}>
            <Approve>Let it finish</Approve>
          </Actions>
        }
      />,
    );
    expect(screen.getByRole("button", { name: "Let it finish" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Discard it" })).toBeTruthy();
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
