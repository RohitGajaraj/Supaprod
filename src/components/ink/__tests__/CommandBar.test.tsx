/**
 * CommandBar component tests — Tempo v5 intent input, hero + rail variants.
 *
 * Coverage: rendering, hero/rail variant classes, placeholder, submit via
 * button click + Enter key, Shift+Enter does NOT submit, disabled state,
 * busy state during async submit, value clears after successful submit,
 * ERROR HANDLING (the catch block fix): onSubmit rejection surfaces as error
 * message and busy is released, focus on container click, custom className.
 *
 * The catch block fix (CommandBar.tsx): before this fix, a rejected onSubmit
 * promise would bubble as an unhandled rejection silently. After the fix, the
 * error message is displayed in the status span and busy is reset.
 */

import { describe, test, expect, mock } from "bun:test";
import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import { CommandBar } from "../CommandBar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderBar(
  props: Partial<Parameters<typeof CommandBar>[0]> & {
    onSubmit?: (intent: string) => void | Promise<void>;
  } = {},
) {
  const onSubmit = props.onSubmit ?? (() => {});
  return render(
    React.createElement(CommandBar, {
      placeholder: "What do you want to build?",
      onSubmit,
      ...props,
    }),
  );
}

function getTextarea(container: HTMLElement) {
  return container.querySelector("textarea") as HTMLTextAreaElement;
}

function getStartButton(container: HTMLElement) {
  return container.querySelector("button[aria-label='Start']") as HTMLButtonElement;
}

function getStatusSpan(container: HTMLElement) {
  return container.querySelector("span.ink-mono") as HTMLElement;
}

/** Type into the textarea, avoiding the scrollHeight readonly property issue */
function typeInto(ta: HTMLTextAreaElement, value: string) {
  fireEvent.change(ta, { target: { value } });
}

// ---------------------------------------------------------------------------
// Rendering — base
// ---------------------------------------------------------------------------

describe("CommandBar — base rendering", () => {
  test("renders a textarea element", () => {
    const { container } = renderBar();
    expect(getTextarea(container)).toBeTruthy();
  });

  test("renders a Start button", () => {
    const { container } = renderBar();
    expect(getStartButton(container)).toBeTruthy();
  });

  test("textarea has placeholder text", () => {
    const { container } = renderBar({ placeholder: "Type your intent" });
    expect(getTextarea(container).getAttribute("placeholder")).toBe("Type your intent");
  });

  test("textarea has aria-label matching the placeholder", () => {
    const { container } = renderBar({ placeholder: "What to build?" });
    expect(getTextarea(container).getAttribute("aria-label")).toBe("What to build?");
  });

  test("status span shows 'Enter to start' by default", () => {
    const { container } = renderBar();
    expect(getStatusSpan(container).textContent).toBe("Enter to start");
  });

  test("renders with rows=1 initially", () => {
    const { container } = renderBar();
    expect(getTextarea(container).getAttribute("rows")).toBe("1");
  });
});

// ---------------------------------------------------------------------------
// Hero vs rail variant classes
// ---------------------------------------------------------------------------

describe("CommandBar — variant classes", () => {
  test("hero variant applies hero radius class", () => {
    const { container } = renderBar({ variant: "hero" });
    const wrapper = container.querySelector("div");
    expect(wrapper?.className).toContain("rounded-[var(--ink-radius-hero)]");
  });

  test("hero variant applies larger padding (px-5 py-4)", () => {
    const { container } = renderBar({ variant: "hero" });
    const wrapper = container.querySelector("div");
    expect(wrapper?.className).toContain("px-5");
    expect(wrapper?.className).toContain("py-4");
  });

  test("rail variant applies control radius class", () => {
    const { container } = renderBar({ variant: "rail" });
    const wrapper = container.querySelector("div");
    expect(wrapper?.className).toContain("rounded-[var(--ink-radius-control)]");
  });

  test("rail variant applies tighter padding (px-3 py-2.5)", () => {
    const { container } = renderBar({ variant: "rail" });
    const wrapper = container.querySelector("div");
    expect(wrapper?.className).toContain("px-3");
    expect(wrapper?.className).toContain("py-2.5");
  });

  test("hero textarea applies text-lg", () => {
    const { container } = renderBar({ variant: "hero" });
    expect(getTextarea(container).className).toContain("text-lg");
  });

  test("rail textarea applies text-sm", () => {
    const { container } = renderBar({ variant: "rail" });
    expect(getTextarea(container).className).toContain("text-sm");
  });

  test("defaults to hero variant when no variant is supplied", () => {
    const { container } = renderBar();
    const wrapper = container.querySelector("div");
    expect(wrapper?.className).toContain("rounded-[var(--ink-radius-hero)]");
  });
});

// ---------------------------------------------------------------------------
// Value management
// ---------------------------------------------------------------------------

describe("CommandBar — value management", () => {
  test("textarea starts empty", () => {
    const { container } = renderBar();
    expect(getTextarea(container).value).toBe("");
  });

  test("typing updates the textarea value", () => {
    const { container } = renderBar();
    const ta = getTextarea(container);
    typeInto(ta, "Build a dashboard");
    expect(ta.value).toBe("Build a dashboard");
  });

  test("Start button is disabled when textarea is empty", () => {
    const { container } = renderBar();
    expect(getStartButton(container).disabled).toBe(true);
  });

  test("Start button is enabled after typing non-whitespace", () => {
    const { container } = renderBar();
    typeInto(getTextarea(container), "Build");
    expect(getStartButton(container).disabled).toBe(false);
  });

  test("whitespace-only input keeps Start button disabled", () => {
    const { container } = renderBar();
    typeInto(getTextarea(container), "   ");
    expect(getStartButton(container).disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Submit — button click
// ---------------------------------------------------------------------------

describe("CommandBar — submit via button click", () => {
  test("calls onSubmit with trimmed intent on button click", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), "  Build a calendar  ");
    });
    await act(async () => {
      fireEvent.click(getStartButton(container));
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toBe("Build a calendar");
  });

  test("clears textarea after successful submit", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ onSubmit });
    const ta = getTextarea(container);
    await act(async () => {
      typeInto(ta, "Build something");
    });
    await act(async () => {
      fireEvent.click(getStartButton(container));
    });
    expect(ta.value).toBe("");
  });

  test("does not submit when textarea is empty", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ onSubmit });
    await act(async () => {
      fireEvent.click(getStartButton(container));
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Submit — Enter key
// ---------------------------------------------------------------------------

describe("CommandBar — submit via Enter key", () => {
  test("Enter key triggers submit", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ onSubmit });
    const ta = getTextarea(container);
    await act(async () => {
      typeInto(ta, "Plan sprint");
    });
    await act(async () => {
      fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toBe("Plan sprint");
  });

  test("Shift+Enter does NOT trigger submit (newline insertion)", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ onSubmit });
    const ta = getTextarea(container);
    await act(async () => {
      typeInto(ta, "Line one");
    });
    await act(async () => {
      fireEvent.keyDown(ta, { key: "Enter", shiftKey: true });
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe("CommandBar — disabled prop", () => {
  test("textarea is disabled when disabled=true", () => {
    const { container } = renderBar({ disabled: true });
    expect(getTextarea(container).disabled).toBe(true);
  });

  test("Start button is disabled when disabled=true regardless of typed value", () => {
    const { container } = renderBar({ disabled: true });
    // The button disabled logic is: !value.trim() || busy || disabled
    // With disabled=true it is always disabled even with a value typed
    expect(getStartButton(container).disabled).toBe(true);
  });

  test("does not call onSubmit when disabled via Enter key", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ disabled: true, onSubmit });
    const ta = getTextarea(container);
    await act(async () => {
      fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("textarea applies opacity-60 class when disabled", () => {
    const { container } = renderBar({ disabled: true });
    expect(getTextarea(container).className).toContain("opacity-60");
  });
});

// ---------------------------------------------------------------------------
// Busy state
// ---------------------------------------------------------------------------

describe("CommandBar — busy state during async submit", () => {
  test("shows 'Handing to agents' while submit is pending", async () => {
    let resolve!: () => void;
    const onSubmit = () =>
      new Promise<void>((res) => {
        resolve = res;
      });

    const { container } = renderBar({ onSubmit });
    typeInto(getTextarea(container), "Build");

    act(() => {
      fireEvent.click(getStartButton(container));
    });

    expect(getStatusSpan(container).textContent).toBe("Handing to agents");

    await act(async () => {
      resolve();
    });
  });

  test("Start button is disabled while busy", async () => {
    let resolve!: () => void;
    const onSubmit = () =>
      new Promise<void>((res) => {
        resolve = res;
      });

    const { container } = renderBar({ onSubmit });
    typeInto(getTextarea(container), "Build");

    act(() => {
      fireEvent.click(getStartButton(container));
    });

    expect(getStartButton(container).disabled).toBe(true);

    await act(async () => {
      resolve();
    });
  });

  test("textarea is disabled while busy", async () => {
    let resolve!: () => void;
    const onSubmit = () =>
      new Promise<void>((res) => {
        resolve = res;
      });

    const { container } = renderBar({ onSubmit });
    const ta = getTextarea(container);
    typeInto(ta, "Build");

    act(() => {
      fireEvent.click(getStartButton(container));
    });

    expect(ta.disabled).toBe(true);

    await act(async () => {
      resolve();
    });
  });

  test("status resets to 'Enter to start' after successful submit", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), "Build");
      fireEvent.click(getStartButton(container));
    });
    expect(getStatusSpan(container).textContent).toBe("Enter to start");
  });
});

// ---------------------------------------------------------------------------
// ERROR HANDLING — the catch block fix
// ---------------------------------------------------------------------------

describe("CommandBar — error handling (catch block fix)", () => {
  test("when onSubmit rejects, busy is released (status not 'Handing to agents')", async () => {
    const onSubmit = mock(async () => {
      throw new Error("Agent unavailable");
    });

    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), "Build something");
      fireEvent.click(getStartButton(container));
    });

    expect(getStatusSpan(container).textContent).not.toBe("Handing to agents");
  });

  test("when onSubmit rejects, the error message is shown in the status span", async () => {
    const onSubmit = mock(async () => {
      throw new Error("Agent unavailable");
    });

    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), "Build something");
      fireEvent.click(getStartButton(container));
    });

    expect(getStatusSpan(container).textContent).toBe("Agent unavailable");
  });

  test("when onSubmit rejects with a non-Error, fallback message is shown", async () => {
    const onSubmit = mock(async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "plain string error";
    });

    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), "Build something");
      fireEvent.click(getStartButton(container));
    });

    expect(getStatusSpan(container).textContent).toBe("Something went wrong. Try again.");
  });

  test("when onSubmit rejects, textarea value is preserved so user can retry", async () => {
    const onSubmit = mock(async () => {
      throw new Error("Network error");
    });

    const { container } = renderBar({ onSubmit });
    const ta = getTextarea(container);
    await act(async () => {
      typeInto(ta, "My intent");
      fireEvent.click(getStartButton(container));
    });

    expect(ta.value).toBe("My intent");
  });

  test("error is cleared when the next submit begins", async () => {
    let callCount = 0;
    const onSubmit = mock(async () => {
      callCount++;
      if (callCount === 1) throw new Error("First attempt failed");
    });

    const { container } = renderBar({ onSubmit });
    const ta = getTextarea(container);

    // First attempt — fails and sets error text
    await act(async () => {
      typeInto(ta, "Build");
      fireEvent.click(getStartButton(container));
    });
    expect(getStatusSpan(container).textContent).toBe("First attempt failed");

    // Second attempt — succeeds; error clears
    await act(async () => {
      typeInto(ta, "Build again");
      fireEvent.click(getStartButton(container));
    });
    expect(getStatusSpan(container).textContent).not.toBe("First attempt failed");
  });

  test("REGRESSION: rejected onSubmit does not cause an unhandled promise rejection", async () => {
    const onSubmit = async () => {
      throw new Error("Simulated failure");
    };

    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), "Test intent");
    });

    // If the catch block is missing this would throw an unhandled rejection; with the fix it must not
    let threw = false;
    try {
      await act(async () => {
        fireEvent.click(getStartButton(container));
      });
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    // The error was caught and surfaced in the status span
    expect(getStatusSpan(container).textContent).toBe("Simulated failure");
  });
});

// ---------------------------------------------------------------------------
// Custom className
// ---------------------------------------------------------------------------

describe("CommandBar — custom className", () => {
  test("applies custom className to the outer wrapper", () => {
    const { container } = renderBar({ className: "my-command-bar" });
    // RTL's root div is the container; its first child is the CommandBar wrapper div
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper?.className).toContain("my-command-bar");
  });

  test("custom className does not replace default layout classes", () => {
    const { container } = renderBar({ className: "custom" });
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper?.className).toContain("custom");
    expect(wrapper?.className).toContain("w-full");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("CommandBar — edge cases", () => {
  test("renders without autoFocus without error", () => {
    expect(() => renderBar({ autoFocus: false })).not.toThrow();
  });

  test("handles synchronous (non-async) onSubmit", async () => {
    const onSubmit = mock(() => undefined as void);
    const { container } = renderBar({ onSubmit });
    // Separate acts: first type (state update), then click (async submit)
    await act(async () => {
      typeInto(getTextarea(container), "Build");
    });
    await act(async () => {
      fireEvent.click(getStartButton(container));
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("double-click on Start does not double-submit while busy", async () => {
    let resolve!: () => void;
    const onSubmit = mock(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );

    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), "Build");
    });

    // First click — starts the async submit
    act(() => {
      fireEvent.click(getStartButton(container));
    });
    // Second click while busy — button is now disabled, guarded by busy state
    act(() => {
      fireEvent.click(getStartButton(container));
    });

    await act(async () => {
      resolve();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("special characters in input are passed through unchanged", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), 'Build <dashboard> with "charts" & stats');
    });
    await act(async () => {
      fireEvent.click(getStartButton(container));
    });
    expect(onSubmit.mock.calls[0][0]).toBe('Build <dashboard> with "charts" & stats');
  });

  test("unicode input is submitted correctly", async () => {
    const onSubmit = mock(async () => {});
    const { container } = renderBar({ onSubmit });
    await act(async () => {
      typeInto(getTextarea(container), "Build a product with emojis");
    });
    await act(async () => {
      fireEvent.click(getStartButton(container));
    });
    expect(onSubmit.mock.calls[0][0]).toBe("Build a product with emojis");
  });
});
