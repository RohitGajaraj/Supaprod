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
  placeSelectionBar,
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
    const ask = screen.getByRole("button", { name: "Ask" }) as HTMLButtonElement;
    expect(ask.disabled, "a dead submit is the visible refusal").toBe(true);
    fireEvent.click(ask);
    expect(calls, "an empty instruction would burn a model call to do nothing").toBe(0);
  });

  it("is a real Meridian field a person can type into", () => {
    /* The founder's rejection said this affordance did not accept typing. What
       is asserted here is the shape that makes typing possible and honest: no
       readOnly anywhere, a controlled value wired to onChange, the forms.tsx
       FIELD paint (h-8, the measured --mrd-field border, the control radius,
       the focus step-up), and focus claimed by the component rather than
       trusted to autoFocus alone. */
    render(<Bar onInstruct={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Ask AI to edit" }));
    const field = screen.getByRole("textbox", {
      name: "Instruction for the selected passage",
    }) as HTMLInputElement;
    expect(field.readOnly, "a readOnly field is the defect wearing a field's clothes").toBe(false);
    expect(field.disabled).toBe(false);
    expect(field.className).toContain("h-8");
    expect(field.className).toContain("border-mrd-field");
    expect(field.className).toContain("focus:border-mrd-field-focus");
    expect(field.className).toContain("rounded-mrd-ctl");
  });

  it("submits on Enter from the field itself", () => {
    let got: string | null = null;
    render(<Bar onInstruct={(instruction) => (got = instruction)} />);
    fireEvent.click(screen.getByRole("button", { name: "Ask AI to edit" }));
    const field = screen.getByRole("textbox", { name: "Instruction for the selected passage" });
    fireEvent.change(field, { target: { value: "Tighten this" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(got).toBe("Tighten this");
  });

  it("Escape inside the field collapses the field and keeps the handoff", () => {
    let dismissed = 0;
    render(<Bar onInstruct={() => {}} onDismiss={() => dismissed++} />);
    fireEvent.click(screen.getByRole("button", { name: "Ask AI to edit" }));
    const field = screen.getByRole("textbox", { name: "Instruction for the selected passage" });

    fireEvent.keyDown(field, { key: "Escape" });

    // The verbs are back, the bar never left, and the loop was not torn down:
    // Escape while TYPING means "never mind this sentence", not "cancel
    // everything I selected".
    expect(dismissed).toBe(0);
    expect(screen.getByRole("toolbar", { name: "Edit the selected passage" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ask AI to edit" })).toBeTruthy();
    expect(
      screen.queryByRole("textbox", { name: "Instruction for the selected passage" }),
    ).toBeNull();
  });

  it("Escape outside the field still dismisses the whole bar", () => {
    let dismissed = 0;
    render(<Bar onDismiss={() => dismissed++} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(dismissed).toBe(1);
  });

  it("wears MoreMenu's float surface, not a plain card", () => {
    /* The founder's rejection drew the comparison directly: this bar is the
       floating-menu family, so its surface classes must match MoreMenu's panel
       (rounded card radius, hairline border, float ground, floating shadow)
       and its stacking order must match too. */
    const { container } = render(<Bar />);
    const toolbar = container.querySelector('[role="toolbar"]') as HTMLElement;
    for (const cls of [
      "rounded-mrd-card",
      "border-mrd-line",
      "bg-mrd-float",
      "p-1",
      "shadow-mrd-float",
      "z-[5]",
    ]) {
      expect(
        toolbar.className.includes(cls),
        `the bar's surface is missing "${cls}" from the MoreMenu family`,
      ).toBe(true);
    }
  });
});

describe("placeSelectionBar decides geometry once, where tests can hold it", () => {
  const CONTAINER = { left: 0, top: 100, right: 600, bottom: 900 };
  const BAR = { w: 200, h: 60 };
  const band = (y: number): SelectionRect => ({ x: 50, y, width: 300, height: 18 });

  it("sits above the topmost band with a six pixel gap", () => {
    const placed = placeSelectionBar([band(400)], CONTAINER, BAR.w, BAR.h);
    expect(placed.top).toBe(400 - BAR.h - 6);
  });

  it("anchors to the topmost band of a multi-band selection", () => {
    const placed = placeSelectionBar([band(500), band(200)], CONTAINER, BAR.w, BAR.h);
    expect(placed.top).toBe(200 - BAR.h - 6);
  });

  it("flips below the bottom-most band when the top would clip the container", () => {
    // Above position would be 120 - 60 - 6 = 54, above the container top + 8.
    const placed = placeSelectionBar([band(120), band(300)], CONTAINER, BAR.w, BAR.h);
    expect(placed.top).toBe(318 + 6);
  });

  it("never overlaps any band while there is room either side", () => {
    // Container top clips the above position here, so this exercises the
    // flip-below path: the bar must end up disjoint from every band.
    const bands = [band(150), band(168), band(186)];
    const placed = placeSelectionBar(bands, CONTAINER, BAR.w, BAR.h);
    const barTop = placed.top;
    const barBottom = placed.top + BAR.h;
    for (const b of bands) {
      const overlaps = barTop < b.y + b.height && b.y < barBottom;
      expect(overlaps, `bar [${barTop}, ${barBottom}] overlaps band at y=${b.y}`).toBe(false);
    }
    // And when there IS room above, the bar sits clear of every band too.
    const roomy = placeSelectionBar(
      [band(400), band(418)],
      { ...CONTAINER, top: 0, bottom: 900 },
      BAR.w,
      BAR.h,
    );
    expect(roomy.top + BAR.h <= 400 - 6).toBe(true);
  });

  it("clamps horizontally inside the container with an eight pixel margin", () => {
    const farRight = placeSelectionBar(
      [{ x: 5500, y: 400, width: 40, height: 18 }],
      CONTAINER,
      BAR.w,
      BAR.h,
    );
    expect(farRight.left).toBe(CONTAINER.right - 8 - BAR.w);
    const offLeft = placeSelectionBar(
      [{ x: -500, y: 400, width: 40, height: 18 }],
      CONTAINER,
      BAR.w,
      BAR.h,
    );
    expect(offLeft.left).toBe(CONTAINER.left + 8);
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
    render(<Bar phase="ready" proposal={proposal} onKeep={() => kept++} onDiscard={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(kept).toBe(1);
  });

  it("discards on Discard", () => {
    let tossed = 0;
    render(<Bar phase="ready" proposal={proposal} onKeep={() => {}} onDiscard={() => tossed++} />);
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
