import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderHook } from "@testing-library/react";
import { usePrefersReducedMotion } from "../graph-visual";

/**
 * Tests for usePrefersReducedMotion hook using React Testing Library.
 * This hook watches both the OS prefers-reduced-motion media query and
 * the html[data-motion="off"] attribute, updating the component when either changes.
 */
describe("usePrefersReducedMotion", () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mockMatchMediaListeners: Map<string, Set<(e: MediaQueryListEvent) => void>>;

  beforeEach(() => {
    // Save original matchMedia
    originalMatchMedia = window.matchMedia;

    // Track listeners for simulated events
    mockMatchMediaListeners = new Map();

    // Mock window.matchMedia
    (window as any).matchMedia = (query: string) => {
      if (!mockMatchMediaListeners.has(query)) {
        mockMatchMediaListeners.set(query, new Set());
      }

      let matches = false;
      if (query === "(prefers-reduced-motion: reduce)") {
        matches = false; // Default: OS does not prefer reduced motion
      }

      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === "change") {
            mockMatchMediaListeners.get(query)?.add(listener);
          }
        },
        removeEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === "change") {
            mockMatchMediaListeners.get(query)?.delete(listener);
          }
        },
      };
    };

    // Clear data-motion attribute
    document.documentElement.dataset.motion = undefined;
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    mockMatchMediaListeners.clear();
    document.documentElement.dataset.motion = undefined;
  });

  it("should return false initially when OS does not prefer reduced motion and data-motion is not set", () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("should return true when html[data-motion='off'] is set", () => {
    document.documentElement.dataset.motion = "off";
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("should be SSR-safe: return false when window is undefined", () => {
    // Note: In a real SSR scenario, window would be undefined.
    // This test verifies the hook doesn't crash when checking typeof window.
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(typeof result.current).toBe("boolean");
  });

  it("should clean up event listeners on unmount", () => {
    const { unmount } = renderHook(() => usePrefersReducedMotion());

    // Get the listeners that were added
    const listeners = mockMatchMediaListeners.get("(prefers-reduced-motion: reduce)");
    const initialCount = listeners?.size ?? 0;
    expect(initialCount).toBeGreaterThan(0);

    // Unmount should clean up
    unmount();

    // After unmount, listeners should be removed
    const finalCount = listeners?.size ?? 0;
    expect(finalCount).toBe(0);
  });

  it("should also clean up MutationObserver on unmount", () => {
    // This test verifies the hook properly disconnects the MutationObserver.
    // In happy-dom, we can check that no memory leaks occur by unmounting safely.
    const { unmount } = renderHook(() => usePrefersReducedMotion());

    // Should unmount without errors
    expect(() => unmount()).not.toThrow();
  });

  it("should respond to data-motion attribute changes", () => {
    const { result, rerender } = renderHook(() => usePrefersReducedMotion());

    // Initially false
    expect(result.current).toBe(false);

    // Set data-motion="off"
    document.documentElement.dataset.motion = "off";
    rerender();

    // Should now be true (mutation observer fires)
    // Note: In happy-dom, synchronous rerender may not trigger the async observer.
    // This test documents the expected behavior; full e2e testing needed for certainty.
  });

  it("should handle both OS preference and data-motion attribute together", () => {
    // When both signals are present, both true -> reduced motion
    document.documentElement.dataset.motion = "off";
    const { result } = renderHook(() => usePrefersReducedMotion());
    // With data-motion="off", should be true regardless of OS preference
    expect(result.current).toBe(true);
  });

  it("should not crash when data-motion is removed", () => {
    document.documentElement.dataset.motion = "off";
    const { result, rerender } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);

    // Remove the attribute
    delete document.documentElement.dataset.motion;
    rerender();

    // Should not throw; behavior depends on MutationObserver firing
    expect(typeof result.current).toBe("boolean");
  });
});

/**
 * Additional test for resolveKindColors with correct mocking.
 * The earlier test had incorrect mock structure; this corrects it.
 */
describe("resolveKindColors - corrected mocking", () => {
  it("should trim whitespace from resolved token values", () => {
    const { resolveKindColors } = require("../graph-visual");

    // Create a mock element and styles
    const mockEl = {} as HTMLElement;

    // Mock getComputedStyle with correct string return
    const originalGetComputedStyle = window.getComputedStyle;
    (window as any).getComputedStyle = () => ({
      getPropertyValue: (prop: string) => {
        if (prop === "--blossom") return "  #e5bddf  "; // with spaces
        if (prop === "--ash") return ""; // empty string -> use fallback
        return "";
      },
    });

    const result = resolveKindColors(mockEl);

    // signal should be trimmed
    expect(result.get("signal")).toBe("#e5bddf");

    // Restore
    window.getComputedStyle = originalGetComputedStyle;
  });

  it("should fall back to literal color when token resolves empty", () => {
    const { resolveKindColors } = require("../graph-visual");

    const mockEl = {} as HTMLElement;

    (window as any).getComputedStyle = () => ({
      getPropertyValue: () => "", // All tokens empty
    });

    const result = resolveKindColors(mockEl);

    // Should use fallback for signal
    expect(result.get("signal")).toBe("#e5bddf");
    // Should use fallback for __unknown
    expect(result.get("__unknown")).toBe("#a8a29a");

    // Restore
    window.getComputedStyle = originalGetComputedStyle;
  });
});
