// Composer behavior contract: one input model (collapsed strip is a button,
// expanded is THE textarea), Enter on free text submits the intent, Escape
// collapses, the mic affordance survives when supported, no cost figures.
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, mock } from "bun:test";
import { Composer, type ComposerProps } from "../Composer";
import type { DictationState } from "@/hooks/use-voice";

function makeDictation(overrides: Partial<DictationState> = {}): DictationState {
  return {
    supported: true,
    listening: false,
    interim: "",
    start: mock(() => {}),
    stop: mock(() => {}),
    ...overrides,
  };
}

function makeProps(overrides: Partial<ComposerProps> = {}): ComposerProps {
  return {
    draft: "",
    onDraftChange: mock(() => {}),
    onSubmitIntent: mock(() => {}),
    onActivateJourney: mock(() => {}),
    onRun: mock(() => {}),
    streaming: false,
    dictation: makeDictation(),
    expanded: true,
    onExpandedChange: mock(() => {}),
    ...overrides,
  };
}

describe("Composer: docked strip and expanded state", () => {
  test("collapsed renders a button strip and NO input box", () => {
    const props = makeProps({ expanded: false });
    const { container } = render(<Composer {...props} />);
    expect(container.querySelector("textarea, input")).toBe(null);
    fireEvent.click(screen.getByLabelText("Ask Supaprod"));
    expect(props.onExpandedChange).toHaveBeenCalledWith(true);
  });

  test("expanded renders exactly ONE input box", () => {
    const { container } = render(<Composer {...makeProps()} />);
    expect(container.querySelectorAll("textarea, input, [contenteditable=true]").length).toBe(1);
  });

  test("Enter on free text submits the intent and clears the draft", () => {
    const props = makeProps({ draft: "why did churn spike last week" });
    render(<Composer {...props} />);
    fireEvent.keyDown(screen.getByLabelText("Ask Supaprod anything"), { key: "Enter" });
    expect(props.onSubmitIntent).toHaveBeenCalledWith("why did churn spike last week");
    expect(props.onDraftChange).toHaveBeenCalledWith("");
  });

  test("Enter while streaming does not submit a second ask", () => {
    const props = makeProps({ draft: "another question", streaming: true });
    render(<Composer {...props} />);
    fireEvent.keyDown(screen.getByLabelText("Ask Supaprod anything"), { key: "Enter" });
    expect(props.onSubmitIntent).not.toHaveBeenCalled();
  });

  test("ArrowUp walks off the Ask row onto a typed match; Enter runs it", () => {
    const props = makeProps({ draft: "brain" });
    render(<Composer {...props} />);
    const textarea = screen.getByLabelText("Ask Supaprod anything");
    fireEvent.keyDown(textarea, { key: "ArrowUp" });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(props.onRun).toHaveBeenCalledTimes(1);
    expect(props.onSubmitIntent).not.toHaveBeenCalled();
  });

  test("Escape collapses the dock", () => {
    const props = makeProps({ draft: "half a thought" });
    render(<Composer {...props} />);
    fireEvent.keyDown(screen.getByLabelText("Ask Supaprod anything"), { key: "Escape" });
    expect(props.onExpandedChange).toHaveBeenCalledWith(false);
  });

  test("journey chips render and a chip activation emits the id", () => {
    const props = makeProps();
    const { container } = render(<Composer {...props} />);
    fireEvent.click(container.querySelector('button[data-journey="j1"]')!);
    expect(props.onActivateJourney).toHaveBeenCalledWith("j1");
  });

  test("the mic affordance renders when dictation is supported, never when not", () => {
    const { rerender } = render(<Composer {...makeProps()} />);
    expect(screen.getByLabelText("Dictate your question")).toBeTruthy();
    rerender(<Composer {...makeProps({ dictation: makeDictation({ supported: false }) })} />);
    expect(screen.queryByLabelText("Dictate your question")).toBe(null);
  });

  test("the mic toggles dictation start and stop", () => {
    const dictation = makeDictation();
    const { rerender } = render(<Composer {...makeProps({ dictation })} />);
    fireEvent.click(screen.getByLabelText("Dictate your question"));
    expect(dictation.start).toHaveBeenCalled();
    const listening = makeDictation({ listening: true });
    rerender(<Composer {...makeProps({ dictation: listening })} />);
    fireEvent.click(screen.getByLabelText("Stop dictation"));
    expect(listening.stop).toHaveBeenCalled();
  });

  test("typing an intent pre-lights the matching journey chip", () => {
    const { container } = render(
      <Composer {...makeProps({ draft: "what should we build next" })} />,
    );
    expect(container.querySelector('button[data-journey="j1"]')!.dataset.suggested).toBe("true");
  });

  test("no cost figures anywhere on the composer", () => {
    const { container } = render(<Composer {...makeProps({ draft: "launch the feature" })} />);
    expect(container.textContent ?? "").not.toContain("$");
    expect((container.textContent ?? "").toLowerCase()).not.toContain("credit");
  });
});
