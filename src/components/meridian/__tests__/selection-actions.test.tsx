/**
 * THE PASSAGE BAR'S CONTRACTS, ASSERTED WHERE THE OLD BAR'S WEREN'T.
 *
 * The retired selection bar shipped behaviours that lived only inside its
 * component body -- Escape clearing, nothing rendering while empty -- and no
 * test rendered that component until bulk-bar.test.tsx opened the pattern.
 * This file does the same job for the OTHER kind of selection: the anchored
 * toolbar that hands a passage of prose to an agent.
 *
 * ── WHAT IS REAL HERE AND WHAT IS A STAND-IN ────────────────────────────
 * Everything behavioural is driven through the real component with hand-built
 * rects, because the claims are about what the bar SHOWS and FIRES, not about
 * geometry. The mirror-div measurement (`measureSelectionRects`) needs real
 * layout to say anything true: happy-dom computes no boxes, so marker spans
 * all land at offset zero and any rect it returned here would be fiction.
 * Only the honest parts are asserted -- empty selections return null, and the
 * guards before measurement run. Geometry is proven in a browser, not here.
 */
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  SelectionActions,
  measureSelectionRects,
  type SelectionRect,
} from "../SelectionActions";

const BANDS: Array<SelectionRect> = [
  { x: 10, y: 40, width: 300, height: 18 },
  { x: 10, y: 58, width: 260, height: 18 },
];

/* A real element rather than `{ current: null }`: the bar hides itself until
 * it has measured against its container, and an unpositioned toolbar is out of
 * the accessibility tree -- exactly what production hands it via `taRef`.
 * happy-dom computes no layout, so the measurement reads zeros, which is fine:
 * these claims are about what shows and what fires, not where. */
const CONTAINER = {
  current: typeof document === "undefined" ? null : document.createElement("div"),
};

function Bar(over: Partial<Parameters<typeof SelectionActions>[0]> = {}) {
  return (
    <SelectionActions
      rects={BANDS}
      containerRef={CONTAINER}
      phase="idle"
      actions={[
        { key: "rewrite", label: "Rewrite", onRun: () => {} },
        { key: "expand", label: "Expand", onRun: () => {} },
      ]}
      {...over}
    />
  );
}

describe("nothing handed is not an empty bar, it is no bar", () => {
  it("renders nothing at all when rects are null and the phase is idle", () => {
    const { container } = render(<Bar rects={null} />);
    expect(container.innerHTML, "a resting bar held a row open over the prose").toBe("");
  });

  it("stays up when the phase has moved on even though the rects are gone", () => {
    /* The field drops its native selection the moment one of the bar's own
       buttons takes focus. A bar that vanished then would hide the handoff
       exactly when the reader most needs to see what was handed. */
    const { container } = render(<Bar rects={null} phase="working" />);
    expect(container.textContent).toContain("The crew is on your words.");
    expect(container.innerHTML).not.toBe("");
  });
});

describe("the verbs wait beside the words they act on", () => {
  it("renders each caller action as a quiet control", () => {
    render(<Bar />);
    expect(screen.getByRole("button", { name: "Rewrite" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Expand" })).toBeTruthy();
  });

  it("washes the measured bands while attached", () => {
    const { container } = render(<Bar />);
    const panels = container.querySelectorAll('[data-mark-wash], [aria-hidden="true"]');
    expect(panels.length, "one wash per band, none otherwise").toBe(BANDS.length);
  });

  it("names itself by what it is for", () => {
    render(<Bar />);
    expect(screen.getByRole("toolbar", { name: "Edit the selected passage" })).toBeTruthy();
  });
});

describe("the ask field teaches by example and refuses to send air", () => {
  it("opens collapsed and submits the trimmed instruction", () => {
    let got: string | null = null;
    render(<Bar onInstruct={(instruction) => (got = instruction)} />);

    fireEvent.click(screen.getByRole("button", { name: "Ask AI to edit" }));
    const field = screen.getByRole("textbox", { name: "Instruction for the selected passage" });
    fireEvent.change(field, { target: { value: "   Make this tighter   " } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(got, "padding must not ride along into the prompt").toBe("Make this tighter");
  });

  it("does not submit an instruction made only of whitespace", () => {
    let calls = 0;
    render(<Bar onInstruct={() => calls++} />);

    fireEvent.click(screen.getByRole("button", { name: "Ask AI to edit" }));
    const field = screen.getByRole("textbox", { name: "Instruction for the selected passage" });
    fireEvent.change(field, { target: { value: "     " } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(calls, "an empty instruction would burn a model call to do nothing").toBe(0);
  });
});

describe("handed and working says so, once, plainly", () => {
  it("shows the caller's working label instead of the verbs", () => {
    render(<Bar phase="working" workingLabel="Rewriting your paragraph." />);
    expect(screen.getByText("Rewriting your paragraph.")).toBeTruthy();
    // The verbs step aside while the work runs: a second click would start a
    // second handoff the reader cannot see the state of.
    expect(screen.queryByRole("button", { name: "Rewrite" })).toBeNull();
  });
});

describe("what came back is held as keep or discard", () => {
  const proposal = { before: "The old sentence.", after: "The better one." };

  it("shows both passages side by side", () => {
    render(<Bar phase="ready" proposal={proposal} />);
    expect(screen.getByText("Before")).toBeTruthy();
    expect(screen.getByText("After")).toBeTruthy();
    expect(screen.getByText(proposal.before)).toBeTruthy();
    expect(screen.getByText(proposal.after)).toBeTruthy();
  });

  it("keeps on Keep", () => {
    let kept = 0;
    render(
      <Bar phase="ready" proposal={proposal} onKeep={() => kept++} onDiscard={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(kept).toBe(1);
  });

  it("discards on Discard", () => {
    let tossed = 0;
    render(
      <Bar phase="ready" proposal={proposal} onKeep={() => {}} onDiscard={() => tossed++} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(tossed).toBe(1);
  });
});

describe("broken comes back said, with a way out", () => {
  it("surfaces the failure honestly and dismisses", () => {
    let dismissed = 0;
    render(
      <Bar
        phase="error"
        error="The crew could not reach the model."
        onDismissError={() => dismissed++}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("could not reach the model");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(dismissed).toBe(1);
  });

  it("offers Retry only when the caller can serve it", () => {
    let retried = 0;
    const view = render(
      <Bar phase="error" error="No." onRetry={() => retried++} onDismissError={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retried).toBe(1);
    view.unmount();

    render(<Bar phase="error" error="No." />);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});

describe("Escape leaves the mode, like every mode here", () => {
  it("fires dismiss on Escape and no other key", () => {
    let dismissed = 0;
    render(<Bar onDismiss={() => dismissed++} />);

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(dismissed).toBe(0);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(dismissed).toBe(1);
  });

  it("listens only while something is handed off or in flight", () => {
    /* The gate matters: this listener sits on window, so an always-on one
       would answer Escape for every dialog and menu on the page. */
    let dismissed = 0;
    render(<Bar rects={null} phase="idle" onDismiss={() => dismissed++} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(dismissed).toBe(0);
  });
});

describe("measureSelectionRects", () => {
  it("returns null for an empty selection", () => {
    const ta = document.createElement("textarea");
    ta.value = "A passage worth keeping.";
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    expect(measureSelectionRects(ta)).toBeNull();
  });

  it("returns null for the degenerate reversed range", () => {
    const ta = document.createElement("textarea");
    ta.value = "A passage worth keeping.";
    ta.selectionStart = 9;
    ta.selectionEnd = 2;
    expect(measureSelectionRects(ta)).toBeNull();
  });

  it("guards before it measures, rather than measuring nothing", () => {
    /* What CANNOT be honestly tested here: the rect arithmetic itself. It
       reads offsetTop/offsetLeft off mirror markers, which need layout;
       happy-dom lays nothing out. The multi-line band shapes are asserted in
       the browser suite, never encoded from fake geometry. */
    const ta = document.createElement("textarea");
    ta.value = "";
    ta.selectionStart = 0;
    ta.selectionEnd = 0;
    expect(measureSelectionRects(ta)).toBeNull();
  });
});
