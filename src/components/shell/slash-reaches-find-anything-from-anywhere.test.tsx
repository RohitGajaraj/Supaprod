import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";

/**
 * P-64: "/" REACHES FIND ANYTHING FROM ANYWHERE, AND THE GUARD IS
 * GOTOSHORTCUTS' OWN (`chord-stands-down-under-a-confirmation.test.tsx`),
 * carried over for the same reasons: a keystroke into a native input/select
 * must pass through untouched, and a keystroke under an open dialog must not
 * reach past it. This file adds the one refusal that is new here -- the run
 * screen's own "/" already means "steer" (`run-keys.ts`), so one key must
 * not mean two things at once.
 */

const navigateSpy = mock((_: unknown) => {});
let pathname = "/start";
const routerActual = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...routerActual,
  useNavigate: () => navigateSpy,
  useRouterState: () => pathname,
}));

const searchActual = await import("@tanstack/react-start");
mock.module("@tanstack/react-start", () => ({
  ...searchActual,
  useServerFn: (fn: unknown) => fn,
}));

const { FindAnything } = await import("./FindAnything");

const press = (key: string, target: EventTarget = window) =>
  act(() => {
    fireEvent.keyDown(target, { key });
  });

function openOverlay(attrs: Record<string, string>) {
  const el = document.createElement("div");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  navigateSpy.mockClear();
  pathname = "/start";
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe('"/" focuses Find Anything, from anywhere, keyboard only', () => {
  test("with nothing open, on an ordinary route, focuses the field", () => {
    const { getByLabelText } = render(<FindAnything narrow={false} onExpand={() => {}} />);
    press("/");
    expect(document.activeElement).toBe(getByLabelText("Find anything"));
  });

  test("in narrow mode, expands the rail first, then focuses", () => {
    const onExpand = mock(() => {});
    render(<FindAnything narrow={true} onExpand={onExpand} />);
    press("/");
    expect(onExpand).toHaveBeenCalled();
  });

  test('typing "/" into a real input passes through untouched', () => {
    const { getByLabelText } = render(<FindAnything narrow={false} onExpand={() => {}} />);
    const other = document.createElement("input");
    document.body.appendChild(other);
    other.focus();
    press("/", other);
    // The field this binding targets never took focus -- the keystroke was
    // never claimed, exactly like GotoShortcuts' own INPUT/TEXTAREA/SELECT
    // refusal.
    expect(document.activeElement).not.toBe(getByLabelText("Find anything"));
  });

  test("a modifier held means a different key entirely, and is not claimed", () => {
    const { getByLabelText } = render(<FindAnything narrow={false} onExpand={() => {}} />);
    act(() => {
      fireEvent.keyDown(window, { key: "/", metaKey: true });
    });
    expect(document.activeElement).not.toBe(getByLabelText("Find anything"));
  });

  test("an open confirmation owns the key, same selector GotoShortcuts refuses under", () => {
    const { getByLabelText } = render(<FindAnything narrow={false} onExpand={() => {}} />);
    openOverlay({ role: "alertdialog", "data-state": "open", "aria-modal": "true" });
    press("/");
    expect(document.activeElement).not.toBe(getByLabelText("Find anything"));
  });

  test("the run screen's own \"/\" is steer's, and this does not reach for it there", () => {
    pathname = "/track/1c92c15c";
    const { getByLabelText } = render(<FindAnything narrow={false} onExpand={() => {}} />);
    press("/");
    expect(document.activeElement).not.toBe(getByLabelText("Find anything"));
  });
});
