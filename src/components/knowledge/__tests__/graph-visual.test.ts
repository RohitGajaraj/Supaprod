import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";

// ---------------------------------------------------------------------------
// React module mock — must be declared before the static import of graph-visual
// so that when graph-visual imports { useState, useEffect } from "react" it
// gets our controlled stubs instead of the real implementations.
//
// The three mutable variables below are captured by reference: mutations made
// inside tests are visible inside the mock closures.
// ---------------------------------------------------------------------------

let _effectCb: (() => (() => void) | void) | null = null;
let _effectCleanup: (() => void) | void = undefined;
const _setterCalls: boolean[] = [];

mock.module("react", () => ({
  useState: (initial: boolean) => [initial, (v: boolean) => _setterCalls.push(v)],
  useEffect: (cb: () => (() => void) | void) => {
    _effectCb = cb;
  },
}));

import {
  kindTracePrefix,
  kindVisual,
  kindCssColor,
  kindLabel,
  nodeRadius,
  truncateTitle,
  resolveKindColors,
  usePrefersReducedMotion,
} from "../graph-visual";

// dim 17: every graph node carries a typed trace-ref prefix. The shared object
// kinds use their registered prefix (DESIGN-LOOM dim 17 / design-anatomy §4);
// graph-only kinds carry a stable local 3-letter code so no node is untraceable.
describe("kindTracePrefix", () => {
  test("maps the registered shared kinds to their registry prefix", () => {
    expect(kindTracePrefix("signal")).toBe("SIG");
    expect(kindTracePrefix("theme")).toBe("THM");
    expect(kindTracePrefix("opportunity")).toBe("OPP");
    expect(kindTracePrefix("prd")).toBe("PRD");
    expect(kindTracePrefix("mission")).toBe("MIS");
    // DEC is the prefix newly registered for decisions in this pass.
    expect(kindTracePrefix("decision")).toBe("DEC");
  });

  test("maps the graph-only kinds to their stable local code", () => {
    expect(kindTracePrefix("meeting")).toBe("MTG");
    expect(kindTracePrefix("roadmap_item")).toBe("RDM");
    expect(kindTracePrefix("task")).toBe("TSK");
    expect(kindTracePrefix("design_memory")).toBe("DSG");
  });

  test("derives a 3-letter uppercase code for an unknown kind", () => {
    expect(kindTracePrefix("widget")).toBe("WID");
  });

  test("never returns empty: falls back to REF when no alpha chars exist", () => {
    expect(kindTracePrefix("___")).toBe("REF");
    expect(kindTracePrefix("")).toBe("REF");
  });
});

describe("kindVisual", () => {
  test("resolves a registered kind to its named token, fallback, and label", () => {
    expect(kindVisual("signal")).toEqual({
      token: "--blossom",
      fallback: "#e5bddf",
      label: "Signal",
    });
  });

  test("falls back to the unknown-kind visual, labeled with the raw kind, for an unregistered kind", () => {
    expect(kindVisual("widget")).toEqual({ token: "--ash", fallback: "#a8a29a", label: "widget" });
  });
});

describe("kindCssColor", () => {
  test("wraps the kind's token with its fallback in a var() expression", () => {
    expect(kindCssColor("theme")).toBe("var(--violet-soft, #a67fc9)");
  });

  test("falls back to the unknown-kind token for an unregistered kind", () => {
    expect(kindCssColor("widget")).toBe("var(--ash, #a8a29a)");
  });
});

describe("kindLabel", () => {
  test("returns the registered display label for a known kind", () => {
    expect(kindLabel("decision")).toBe("Decision");
  });

  test("falls back to the raw kind string for an unregistered kind", () => {
    expect(kindLabel("widget")).toBe("widget");
  });
});

describe("nodeRadius", () => {
  test("grows with influence, capped at 8", () => {
    expect(nodeRadius({ influence: 0 }, false)).toBe(7);
    expect(nodeRadius({ influence: 8 }, false)).toBeCloseTo(18.2);
    // Influence above the cap (8) reads identically to exactly 8.
    expect(nodeRadius({ influence: 50 }, false)).toBeCloseTo(18.2);
  });

  test("a focused node is drawn 3px larger than the same unfocused node", () => {
    const base = nodeRadius({ influence: 4 }, false);
    expect(nodeRadius({ influence: 4 }, true)).toBeCloseTo(base + 3);
  });
});

describe("truncateTitle", () => {
  test("returns an empty string unchanged", () => {
    expect(truncateTitle("")).toBe("");
  });

  test("leaves a short title untouched", () => {
    expect(truncateTitle("Short title")).toBe("Short title");
  });

  test("truncates a long title to max-1 chars plus an ellipsis", () => {
    const long = "A".repeat(40);
    const out = truncateTitle(long, 26);
    expect(out).toBe(`${"A".repeat(25)}…`);
    expect(out.length).toBe(26);
  });
});

describe("resolveKindColors", () => {
  let originalWindow: typeof globalThis.window;
  let mockGetComputedStyle: ReturnType<typeof test>;

  beforeEach(() => {
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    if (originalWindow) {
      globalThis.window = originalWindow;
    }
  });

  test("returns a map with all kinds when getComputedStyle is available", () => {
    const mockStyles = new Map([
      ["--blossom", "#e5bddf"],
      ["--violet-soft", "#a67fc9"],
      ["--moss", "#7fb069"],
      ["--ash", "#a8a29a"],
    ]);

    // Mock window.getComputedStyle
    const mockGetComputedStyle = () => ({
      getPropertyValue: (prop: string) => mockStyles.get(prop) || "",
      trim: () => "",
    });

    // Type assertion needed for testing
    Object.defineProperty(globalThis, "window", {
      value: { getComputedStyle: mockGetComputedStyle },
      writable: true,
      configurable: true,
    });

    const fakeEl = {} as HTMLElement;
    const result = resolveKindColors(fakeEl);

    expect(result instanceof Map).toBe(true);
    expect(result.size).toBeGreaterThan(0);
  });

  test("uses fallback colors when window is undefined", () => {
    // Simulate no window
    const result = resolveKindColors({} as HTMLElement);
    expect(result instanceof Map).toBe(true);
    // Should have fallback values (ash, etc.)
    expect(result.size).toBeGreaterThan(0);
  });

  test("returns __unknown key for unregistered kinds", () => {
    const mockGetComputedStyle = () => ({
      getPropertyValue: () => "",
      trim: () => "",
    });

    Object.defineProperty(globalThis, "window", {
      value: { getComputedStyle: mockGetComputedStyle },
      writable: true,
      configurable: true,
    });

    const result = resolveKindColors({} as HTMLElement);
    expect(result.has("__unknown")).toBe(true);
  });

  test("maps each kind to its resolved or fallback color", () => {
    const mockGetComputedStyle = () => ({
      getPropertyValue: (prop: string) => {
        if (prop === "--blossom") return "  #e5bddf  "; // with whitespace
        if (prop === "--ash") return ""; // empty, should use fallback
        return "";
      },
      trim: () => "",
    });

    Object.defineProperty(globalThis, "window", {
      value: { getComputedStyle: mockGetComputedStyle },
      writable: true,
      configurable: true,
    });

    const result = resolveKindColors({} as HTMLElement);
    // At least signal (--blossom) should be in the map
    expect(result.get("signal")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// usePrefersReducedMotion
//
// Testing strategy: the React module is mocked at the top of this file so
// useState and useEffect are our controlled stubs. Each test installs minimal
// browser API mocks (window.matchMedia, MutationObserver, document) on
// globalThis and clears them in afterEach before the shared setup.ts afterEach
// runs. All Object.defineProperty calls use configurable: true so that
// subsequent tests can redefine or clear them without "Unable to delete" errors.
// ---------------------------------------------------------------------------

// Clears browser globals set by this test suite without using `delete`
// (which fails on non-configurable properties).
function clearBrowserMocks(): void {
  for (const key of ["window", "document", "MutationObserver"] as const) {
    Object.defineProperty(globalThis, key, {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
}

interface ObserverTracker {
  observeCalled: boolean;
  observeTarget: Node | null;
  observeOptions: MutationObserverInit | null;
  disconnectCalled: boolean;
  triggerMutation: () => void;
}

interface MockEnv {
  mq: { matches: boolean };
  mqListeners: (() => void)[];
  mqRemovedListeners: (() => void)[];
  obs: ObserverTracker | null;
  docEl: { dataset: Record<string, string | undefined> };
  runEffect(): void;
  runCleanup(): void;
}

function buildMockEnv(mqMatches: boolean, dataMotion?: string): MockEnv {
  const mqListeners: (() => void)[] = [];
  const mqRemovedListeners: (() => void)[] = [];
  const mq = {
    matches: mqMatches,
    addEventListener(_type: string, cb: () => void) {
      mqListeners.push(cb);
    },
    removeEventListener(_type: string, cb: () => void) {
      mqRemovedListeners.push(cb);
    },
  };

  const dataset: Record<string, string | undefined> = {};
  if (dataMotion !== undefined) dataset.motion = dataMotion;
  const docEl = { dataset };

  // obs is populated when the MutationObserver constructor runs inside runEffect
  let obs: ObserverTracker | null = null;

  Object.defineProperty(globalThis, "window", {
    value: { matchMedia: () => mq },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: { documentElement: docEl },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "MutationObserver", {
    value: class {
      constructor(cb: () => void) {
        const tracker: ObserverTracker = {
          observeCalled: false,
          observeTarget: null,
          observeOptions: null,
          disconnectCalled: false,
          triggerMutation: cb,
        };
        obs = tracker;
        Object.assign(this, {
          observe(target: Node, options: MutationObserverInit) {
            tracker.observeCalled = true;
            tracker.observeTarget = target;
            tracker.observeOptions = options;
          },
          disconnect() {
            tracker.disconnectCalled = true;
          },
        });
      }
      observe(_target: Node, _options: MutationObserverInit) {}
      disconnect() {}
    },
    writable: true,
    configurable: true,
  });

  return {
    mq,
    mqListeners,
    mqRemovedListeners,
    get obs() {
      return obs;
    },
    docEl,
    runEffect() {
      if (!_effectCb) throw new Error("no useEffect callback — call the hook first");
      _effectCleanup = _effectCb();
    },
    runCleanup() {
      if (typeof _effectCleanup === "function") _effectCleanup();
    },
  };
}

describe("usePrefersReducedMotion — initial state", () => {
  beforeEach(() => {
    _effectCb = null;
    _effectCleanup = undefined;
    _setterCalls.length = 0;
  });
  afterEach(clearBrowserMocks);

  test("should return false initially (useState default is false)", () => {
    buildMockEnv(false);
    const result = usePrefersReducedMotion();
    expect(result).toBe(false);
  });

  test("should register exactly one useEffect callback on call", () => {
    buildMockEnv(false);
    usePrefersReducedMotion();
    expect(_effectCb).not.toBeNull();
  });
});

describe("usePrefersReducedMotion — compute logic (setState values)", () => {
  beforeEach(() => {
    _effectCb = null;
    _effectCleanup = undefined;
    _setterCalls.length = 0;
  });
  afterEach(clearBrowserMocks);

  test("should call setState(false) when OS preference is off and no data-motion attribute", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    expect(_setterCalls[0]).toBe(false);
  });

  test("should call setState(true) when OS prefers-reduced-motion is set", () => {
    const env = buildMockEnv(true);
    usePrefersReducedMotion();
    env.runEffect();
    expect(_setterCalls[0]).toBe(true);
  });

  test("should call setState(true) when data-motion='off' is present on documentElement", () => {
    const env = buildMockEnv(false, "off");
    usePrefersReducedMotion();
    env.runEffect();
    expect(_setterCalls[0]).toBe(true);
  });

  test("should call setState(true) when BOTH OS preference and data-motion='off' are active", () => {
    const env = buildMockEnv(true, "off");
    usePrefersReducedMotion();
    env.runEffect();
    expect(_setterCalls[0]).toBe(true);
  });

  test("should call setState(false) when data-motion='reduce' (hook only reacts to 'off', not 'reduce')", () => {
    const env = buildMockEnv(false, "reduce");
    usePrefersReducedMotion();
    env.runEffect();
    expect(_setterCalls[0]).toBe(false);
  });

  test("should query window.matchMedia with '(prefers-reduced-motion: reduce)'", () => {
    const queriesSeen: string[] = [];
    const mq = { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
    Object.defineProperty(globalThis, "window", {
      value: {
        matchMedia: (q: string) => {
          queriesSeen.push(q);
          return mq;
        },
      },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: { documentElement: { dataset: {} } },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "MutationObserver", {
      value: class {
        constructor(_cb: () => void) {}
        observe() {}
        disconnect() {}
      },
      writable: true,
      configurable: true,
    });

    usePrefersReducedMotion();
    if (!_effectCb) throw new Error("no effect");
    _effectCleanup = _effectCb();

    expect(queriesSeen).toContain("(prefers-reduced-motion: reduce)");
  });
});

describe("usePrefersReducedMotion — SSR safety", () => {
  beforeEach(() => {
    _effectCb = null;
    _effectCleanup = undefined;
    _setterCalls.length = 0;
    clearBrowserMocks();
  });
  afterEach(clearBrowserMocks);

  test("should not throw when window is undefined (SSR environment)", () => {
    usePrefersReducedMotion();
    expect(() => {
      if (!_effectCb) throw new Error("no effect");
      _effectCleanup = _effectCb();
    }).not.toThrow();
  });

  test("should return undefined cleanup when window is undefined (no listeners registered)", () => {
    usePrefersReducedMotion();
    if (!_effectCb) throw new Error("no effect");
    const cleanup = _effectCb();
    expect(cleanup).toBeUndefined();
  });

  test("should not construct MutationObserver when window is undefined", () => {
    let constructed = false;
    Object.defineProperty(globalThis, "MutationObserver", {
      value: class {
        constructor() {
          constructed = true;
        }
        observe() {}
        disconnect() {}
      },
      writable: true,
      configurable: true,
    });
    usePrefersReducedMotion();
    if (!_effectCb) throw new Error("no effect");
    _effectCleanup = _effectCb();
    expect(constructed).toBe(false);
  });

  test("should not call matchMedia when window is undefined", () => {
    let called = false;
    usePrefersReducedMotion();
    if (!_effectCb) throw new Error("no effect");
    expect(() => (_effectCleanup = _effectCb())).not.toThrow();
    expect(called).toBe(false);
  });
});

describe("usePrefersReducedMotion — MutationObserver setup", () => {
  beforeEach(() => {
    _effectCb = null;
    _effectCleanup = undefined;
    _setterCalls.length = 0;
  });
  afterEach(clearBrowserMocks);

  test("should observe document.documentElement", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    expect(env.obs!.observeCalled).toBe(true);
    expect(env.obs!.observeTarget).toBe(env.docEl);
  });

  test("should configure MutationObserver with attributes: true", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    expect(env.obs!.observeOptions?.attributes).toBe(true);
  });

  test("should configure MutationObserver to watch only the data-motion attribute", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    expect(env.obs!.observeOptions?.attributeFilter).toEqual(["data-motion"]);
  });

  test("should register exactly one change listener on the matchMedia query", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    expect(env.mqListeners.length).toBe(1);
    expect(typeof env.mqListeners[0]).toBe("function");
  });
});

describe("usePrefersReducedMotion — cleanup on unmount", () => {
  beforeEach(() => {
    _effectCb = null;
    _effectCleanup = undefined;
    _setterCalls.length = 0;
  });
  afterEach(clearBrowserMocks);

  test("should remove the matchMedia change listener on cleanup", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    const registered = env.mqListeners[0];
    env.runCleanup();
    expect(env.mqRemovedListeners.length).toBe(1);
    expect(env.mqRemovedListeners[0]).toBe(registered);
  });

  test("should disconnect the MutationObserver on cleanup", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    expect(env.obs!.disconnectCalled).toBe(false);
    env.runCleanup();
    expect(env.obs!.disconnectCalled).toBe(true);
  });

  test("should call both removeEventListener and disconnect when unmounting", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    env.runCleanup();
    expect(env.mqRemovedListeners.length).toBe(1);
    expect(env.obs!.disconnectCalled).toBe(true);
  });
});

describe("usePrefersReducedMotion — reactivity to runtime changes", () => {
  beforeEach(() => {
    _effectCb = null;
    _effectCleanup = undefined;
    _setterCalls.length = 0;
  });
  afterEach(clearBrowserMocks);

  test("should call setState when the matchMedia change listener fires", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    const before = _setterCalls.length;
    env.mqListeners[0]();
    expect(_setterCalls.length).toBe(before + 1);
  });

  test("should call setState when the MutationObserver fires", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    const before = _setterCalls.length;
    env.obs!.triggerMutation();
    expect(_setterCalls.length).toBe(before + 1);
  });

  test("should set state to true when matchMedia fires with matches=true", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    expect(_setterCalls[0]).toBe(false);
    env.mq.matches = true;
    env.mqListeners[0]();
    expect(_setterCalls[_setterCalls.length - 1]).toBe(true);
  });

  test("should set state to true when MutationObserver fires after data-motion is set to 'off'", () => {
    const env = buildMockEnv(false);
    usePrefersReducedMotion();
    env.runEffect();
    expect(_setterCalls[0]).toBe(false);
    env.docEl.dataset.motion = "off";
    env.obs!.triggerMutation();
    expect(_setterCalls[_setterCalls.length - 1]).toBe(true);
  });

  test("should set state back to false when data-motion attribute is removed", () => {
    const env = buildMockEnv(false, "off");
    usePrefersReducedMotion();
    env.runEffect();
    expect(_setterCalls[0]).toBe(true);
    delete env.docEl.dataset.motion;
    env.obs!.triggerMutation();
    expect(_setterCalls[_setterCalls.length - 1]).toBe(false);
  });
});
