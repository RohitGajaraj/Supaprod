import { describe, expect, test, afterEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";

import {
  kindTracePrefix,
  kindVisual,
  kindCssColor,
  kindLabel,
  nodeRadius,
  truncateTitle,
  resolveKindColors,
  computeReducedMotion,
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
  /* "Signal" until 2026-08-27. §12 bans the word outright and `artifact-words.ts`
     renamed the display word to "finding"; the graph kept its own map and drifted.
     The TRACE PREFIX is still SIG, deliberately, because it is minted off the
     stored `artifact_kind` rather than off the word a person reads -- asserted
     above and explained at the map. */
  test("resolves a registered kind to its named token, fallback, and label", () => {
    expect(kindVisual("signal")).toEqual({
      token: "--blossom",
      fallback: "#e5bddf",
      label: "Finding",
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

describe("computeReducedMotion", () => {
  /**
   * Pure function that combines OS media query preference with in-product toggle.
   * Extracted from the hook for unit testability (no DOM/browser-API coupling).
   */

  test("returns false when both mediaQueryMatches and motionDataset are falsy", () => {
    expect(computeReducedMotion(false, undefined)).toBe(false);
    expect(computeReducedMotion(false, null as unknown as string)).toBe(false);
    expect(computeReducedMotion(false, "")).toBe(false);
  });

  test("returns true when OS mediaQueryMatches is true (prefers-reduced-motion)", () => {
    expect(computeReducedMotion(true, undefined)).toBe(true);
    expect(computeReducedMotion(true, "")).toBe(true);
    expect(computeReducedMotion(true, "on")).toBe(true); // even with non-"off" toggle
  });

  test("returns true when in-product toggle is 'off'", () => {
    expect(computeReducedMotion(false, "off")).toBe(true);
  });

  test("returns false when in-product toggle is 'on' (not 'off')", () => {
    expect(computeReducedMotion(false, "on")).toBe(false);
  });

  test("returns true when OS preference is true (takes precedence)", () => {
    // OS preference wins: even if toggle is "on", reduced motion is still true
    expect(computeReducedMotion(true, "on")).toBe(true);
  });

  test("returns true when EITHER the OS preference OR the toggle is 'off'", () => {
    // OR logic: true if any condition is true
    expect(computeReducedMotion(true, "off")).toBe(true); // both true
    expect(computeReducedMotion(true, "on")).toBe(true); // OS true, toggle not "off"
    expect(computeReducedMotion(false, "off")).toBe(true); // OS false, toggle "off"
  });

  test("returns false only when BOTH OS preference is false AND toggle is not 'off'", () => {
    expect(computeReducedMotion(false, undefined)).toBe(false);
    expect(computeReducedMotion(false, "")).toBe(false);
    expect(computeReducedMotion(false, "on")).toBe(false);
    expect(computeReducedMotion(false, "anything_else")).toBe(false);
  });
});

describe("resolveKindColors", () => {
  // Stub ONLY window.getComputedStyle, never the window identity: happy-dom's
  // global `document` is a getter off the registered window, so swapping the
  // whole window object silently killed every DOM-mounted test that ran after
  // this file in a combined run.
  const originalGetComputedStyle = globalThis.window.getComputedStyle;

  afterEach(() => {
    globalThis.window.getComputedStyle = originalGetComputedStyle;
  });

  function stubGetComputedStyle(fn: () => { getPropertyValue: (prop: string) => string }) {
    globalThis.window.getComputedStyle = fn as unknown as typeof window.getComputedStyle;
  }

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

    stubGetComputedStyle(mockGetComputedStyle);

    const fakeEl = {} as HTMLElement;
    const result = resolveKindColors(fakeEl);

    expect(result instanceof Map).toBe(true);
    expect(result.size).toBeGreaterThan(0);
  });

  test("uses fallback colors when styles resolve empty", () => {
    stubGetComputedStyle(() => ({ getPropertyValue: () => "" }));
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

    stubGetComputedStyle(mockGetComputedStyle);

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

    stubGetComputedStyle(mockGetComputedStyle);

    const result = resolveKindColors({} as HTMLElement);
    // signal (--blossom) should be in the map with the trimmed hex value
    expect(result.get("signal")).toBeDefined();
    expect(result.get("signal")).toBe("#e5bddf"); // Verify whitespace is trimmed
  });

  test("trims whitespace from resolved CSS variable values", () => {
    stubGetComputedStyle(() => ({ getPropertyValue: () => "  #ffffff  " }));
    const result = resolveKindColors({} as HTMLElement);
    const color = result.get("signal");
    expect(color).not.toContain("  ");
  });

  test("falls back to literal color when CSS variable is empty", () => {
    stubGetComputedStyle(() => ({ getPropertyValue: () => "" }));
    const result = resolveKindColors({} as HTMLElement);
    // signal should have fallback color #e5bddf
    expect(result.get("signal")).toBe("#e5bddf");
  });

  test("resolves all registered kinds without error", () => {
    const allKinds = [
      "signal",
      "theme",
      "opportunity",
      "prd",
      "roadmap_item",
      "task",
      "meeting",
      "mission",
      "design_memory",
      "decision",
    ];

    stubGetComputedStyle(() => ({ getPropertyValue: () => "#dedede" }));

    const result = resolveKindColors({} as HTMLElement);

    // All registered kinds should be in the result
    for (const kind of allKinds) {
      expect(result.has(kind)).toBe(true);
      expect(result.get(kind)).toBeDefined();
    }
  });

  test("handles getPropertyValue returning non-empty then trimming to empty", () => {
    stubGetComputedStyle(() => ({ getPropertyValue: () => "   " })); // Whitespace only, trims to empty
    const result = resolveKindColors({} as HTMLElement);
    // Should use fallback when trimmed value is empty
    expect(result.get("signal")).toBe("#e5bddf");
  });

  test("__unknown color is always set", () => {
    stubGetComputedStyle(() => ({ getPropertyValue: () => "#dedede" }));
    const result = resolveKindColors({} as HTMLElement);
    expect(result.has("__unknown")).toBe(true);
    expect(result.get("__unknown")).toBeDefined();
  });

  test("map size includes all registered kinds plus __unknown", () => {
    stubGetComputedStyle(() => ({ getPropertyValue: () => "#dedede" }));
    const result = resolveKindColors({} as HTMLElement);
    // 10 registered kinds + __unknown = 11 entries minimum
    expect(result.size).toBeGreaterThanOrEqual(11);
  });
});

// ---------------------------------------------------------------------------
// usePrefersReducedMotion
//
// ---------------------------------------------------------------------------
// usePrefersReducedMotion - tested against the REAL React + the happy-dom
// globals registered by test/setup.ts. The previous harness mock.module()'d
// react (process-global in bun, poisoning the jsx runtime for every test file
// loaded after this one) and nulled window/document between tests (killing
// later DOM suites). Only window.matchMedia and MutationObserver are stubbed,
// and both are restored exactly.
// ---------------------------------------------------------------------------

interface ObserverTracker {
  observeCalled: boolean;
  observeTarget: Node | null;
  observeOptions: MutationObserverInit | null;
  disconnectCalled: boolean;
  triggerMutation: () => void;
}

interface MockEnv {
  mq: {
    matches: boolean;
    addEventListener: (type: string, cb: () => void) => void;
    removeEventListener: (type: string, cb: () => void) => void;
  };
  mqListeners: (() => void)[];
  mqRemovedListeners: (() => void)[];
  queriesSeen: string[];
  get obs(): ObserverTracker | null;
}

const REAL_MATCH_MEDIA = globalThis.window.matchMedia;
const REAL_MUTATION_OBSERVER = globalThis.MutationObserver;

function buildMockEnv(mqMatches: boolean, dataMotion?: string): MockEnv {
  const mqListeners: (() => void)[] = [];
  const mqRemovedListeners: (() => void)[] = [];
  const queriesSeen: string[] = [];
  const mq = {
    matches: mqMatches,
    addEventListener(_type: string, cb: () => void) {
      mqListeners.push(cb);
    },
    removeEventListener(_type: string, cb: () => void) {
      mqRemovedListeners.push(cb);
    },
  };

  if (dataMotion !== undefined) {
    document.documentElement.dataset.motion = dataMotion;
  }

  let obs: ObserverTracker | null = null;

  globalThis.window.matchMedia = ((query: string) => {
    queriesSeen.push(query);
    return mq;
  }) as unknown as typeof window.matchMedia;

  globalThis.MutationObserver = class {
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
    takeRecords(): MutationRecord[] {
      return [];
    }
  } as unknown as typeof MutationObserver;

  return {
    mq,
    mqListeners,
    mqRemovedListeners,
    queriesSeen,
    get obs() {
      return obs;
    },
  };
}

function restoreEnv(): void {
  globalThis.window.matchMedia = REAL_MATCH_MEDIA;
  globalThis.MutationObserver = REAL_MUTATION_OBSERVER;
  delete document.documentElement.dataset.motion;
}

describe("usePrefersReducedMotion - computed state", () => {
  afterEach(restoreEnv);

  test("false when OS preference is off and no data-motion attribute", () => {
    buildMockEnv(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  test("true when OS prefers-reduced-motion is set", () => {
    buildMockEnv(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  test("true when data-motion='off' is present on documentElement", () => {
    buildMockEnv(false, "off");
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  test("true when BOTH the OS preference and data-motion='off' are active", () => {
    buildMockEnv(true, "off");
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  test("false when data-motion='reduce' (hook only reacts to 'off', not 'reduce')", () => {
    buildMockEnv(false, "reduce");
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  test("queries window.matchMedia with '(prefers-reduced-motion: reduce)'", () => {
    const env = buildMockEnv(false);
    renderHook(() => usePrefersReducedMotion());
    expect(env.queriesSeen).toContain("(prefers-reduced-motion: reduce)");
  });
});

/**
 * SSR Guard Test: Behavioral verification that the hook is SSR-safe.
 *
 * The hook's useEffect never runs during SSR (React ensures this). The guard
 * in the effect body ensures that even if the effect somehow runs before window
 * is defined, it returns gracefully (false) without crashing.
 *
 * Test strategy: Verify the hook returns false initially (before effect setup)
 * and that the guard is present in the source code.
 */
describe("usePrefersReducedMotion - SSR guard", () => {
  test("returns false initially (SSR-safe default before effects run)", () => {
    // The hook initializes to false via useState(false).
    // This is the SSR-safe default returned before any effect runs.
    // In a real SSR scenario, effects never run, so the hook always returns false.
    const result = renderHook(() => usePrefersReducedMotion());

    // Verify: hook's initial value is false (safe for SSR)
    expect(result.result.current).toBe(false);
  });

  test("the effect guards on typeof window before accessing browser APIs", () => {
    // Supplementary: verify the guard is present in source code (transpile-tolerant).
    // bun minifies `typeof window !== "undefined"` to `typeof window > "u"`.
    // This ensures that if the effect somehow runs in an SSR context,
    // it returns early without crashing.
    const source = String(usePrefersReducedMotion);
    expect(source).toContain("typeof window");
  });
});

describe("usePrefersReducedMotion - MutationObserver setup", () => {
  afterEach(restoreEnv);

  test("observes document.documentElement", () => {
    const env = buildMockEnv(false);
    renderHook(() => usePrefersReducedMotion());
    expect(env.obs!.observeCalled).toBe(true);
    expect(env.obs!.observeTarget).toBe(document.documentElement);
  });

  test("configures the observer with attributes: true", () => {
    const env = buildMockEnv(false);
    renderHook(() => usePrefersReducedMotion());
    expect(env.obs!.observeOptions?.attributes).toBe(true);
  });

  test("watches only the data-motion attribute", () => {
    const env = buildMockEnv(false);
    renderHook(() => usePrefersReducedMotion());
    expect(env.obs!.observeOptions?.attributeFilter).toEqual(["data-motion"]);
  });

  test("registers exactly one change listener on the matchMedia query", () => {
    const env = buildMockEnv(false);
    renderHook(() => usePrefersReducedMotion());
    expect(env.mqListeners.length).toBe(1);
    expect(typeof env.mqListeners[0]).toBe("function");
  });
});

describe("usePrefersReducedMotion - cleanup on unmount", () => {
  afterEach(restoreEnv);

  test("removes the matchMedia change listener on unmount", () => {
    const env = buildMockEnv(false);
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    const registered = env.mqListeners[0];
    unmount();
    expect(env.mqRemovedListeners.length).toBe(1);
    expect(env.mqRemovedListeners[0]).toBe(registered);
  });

  test("disconnects the MutationObserver on unmount", () => {
    const env = buildMockEnv(false);
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(env.obs!.disconnectCalled).toBe(false);
    unmount();
    expect(env.obs!.disconnectCalled).toBe(true);
  });
});

describe("usePrefersReducedMotion - reactivity to runtime changes", () => {
  afterEach(restoreEnv);

  test("recomputes to true when matchMedia fires with matches=true", () => {
    const env = buildMockEnv(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      env.mq.matches = true;
      env.mqListeners[0]();
    });
    expect(result.current).toBe(true);
  });

  test("recomputes to true when the observer fires after data-motion='off' lands", () => {
    const env = buildMockEnv(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      document.documentElement.dataset.motion = "off";
      env.obs!.triggerMutation();
    });
    expect(result.current).toBe(true);
  });

  test("recomputes back to false when the data-motion attribute is removed", () => {
    const env = buildMockEnv(false, "off");
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
    act(() => {
      delete document.documentElement.dataset.motion;
      env.obs!.triggerMutation();
    });
    expect(result.current).toBe(false);
  });
});
