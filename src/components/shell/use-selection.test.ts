import { describe, it, expect } from "bun:test";
import { renderHook, act } from "@testing-library/react";

import { useSelection } from "./use-selection";

/**
 * WHAT THIS GUARDS.
 *
 * `useSelection` exists because a sweep on 2026-08-10 found that not one queue
 * in the product had multi-select, and a Head of Product arriving to twenty
 * overnight approvals had no path but twenty keypresses. Two of its behaviours
 * are non-obvious and would be easy to lose in a refactor, so they are pinned
 * here rather than left to a reviewer to notice.
 *
 * The tests assert BEHAVIOUR, not shape. A future implementation is free to
 * store the selection however it likes.
 */

describe("useSelection: the ordinary cases", () => {
  it("toggles one id on and off", () => {
    const { result } = renderHook(() => useSelection(["a", "b", "c"]));
    expect(result.current.count).toBe(0);

    act(() => result.current.toggle("b"));
    expect(result.current.has("b")).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggle("b"));
    expect(result.current.has("b")).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("knows when everything visible is selected", () => {
    const { result } = renderHook(() => useSelection(["a", "b"]));
    expect(result.current.allSelected).toBe(false);

    act(() => result.current.selectAll());
    expect(result.current.allSelected).toBe(true);
    expect(result.current.count).toBe(2);

    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });

  it("is never allSelected over an empty list", () => {
    // Otherwise a queue that has just emptied would render "all selected" and
    // offer verbs over nothing.
    const { result } = renderHook(() => useSelection([]));
    expect(result.current.allSelected).toBe(false);
  });
});

describe("useSelection: range select", () => {
  it("shift extends from the last row touched, in the caller's order", () => {
    // The order is the SURFACE's, after its own filtering and sorting, which is
    // the whole reason the hook takes an ordered array rather than a set.
    const { result } = renderHook(() => useSelection(["a", "b", "c", "d", "e"]));

    act(() => result.current.toggle("b"));
    act(() => result.current.toggle("d", { shiftKey: true }));

    expect([...result.current.ids].sort()).toEqual(["b", "c", "d"]);
  });

  it("extends backwards too", () => {
    const { result } = renderHook(() => useSelection(["a", "b", "c", "d"]));

    act(() => result.current.toggle("d"));
    act(() => result.current.toggle("b", { shiftKey: true }));

    expect([...result.current.ids].sort()).toEqual(["b", "c", "d"]);
  });

  it("a range only ever ADDS", () => {
    // Shift-clicking must never remove rows a person cannot watch being
    // removed. Selecting a range that overlaps an existing selection keeps it.
    const { result } = renderHook(() => useSelection(["a", "b", "c", "d"]));

    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("c"));
    act(() => result.current.toggle("d", { shiftKey: true }));

    expect([...result.current.ids].sort()).toEqual(["a", "c", "d"]);
  });

  it("shift with no anchor is an ordinary toggle, not an error", () => {
    const { result } = renderHook(() => useSelection(["a", "b", "c"]));
    act(() => result.current.toggle("b", { shiftKey: true }));
    expect([...result.current.ids]).toEqual(["b"]);
  });
});

describe("useSelection: self-healing against a list that moves underneath it", () => {
  it("drops ids that have left the list", () => {
    /**
     * THE REASON THIS MATTERS. These queues poll -- approvals every few
     * seconds, runs every five. A selected row can settle, be archived by a
     * teammate, or fall out of a filter WHILE it is selected. Without this, a
     * bulk action would act on something that is no longer on screen, and the
     * count would claim more than the surface is showing.
     */
    const { result, rerender } = renderHook(({ ids }) => useSelection(ids), {
      initialProps: { ids: ["a", "b", "c"] },
    });

    act(() => result.current.selectAll());
    expect(result.current.count).toBe(3);

    // "b" settles and leaves the queue.
    rerender({ ids: ["a", "c"] });

    expect(result.current.count).toBe(2);
    expect(result.current.has("b")).toBe(false);
    expect([...result.current.ids].sort()).toEqual(["a", "c"]);
  });

  it("restores a selection if the row comes back", () => {
    // A row that leaves because of a filter and returns when the filter is
    // cleared was never deselected by a person, so it should still be selected.
    // This falls out of intersecting rather than mutating, and is worth pinning
    // so a future rewrite does not "fix" it into destructive pruning.
    const { result, rerender } = renderHook(({ ids }) => useSelection(ids), {
      initialProps: { ids: ["a", "b"] },
    });

    act(() => result.current.selectAll());
    rerender({ ids: ["a"] });
    expect(result.current.count).toBe(1);

    rerender({ ids: ["a", "b"] });
    expect(result.current.count).toBe(2);
  });

  it("allSelected tracks the live list, not the remembered one", () => {
    const { result, rerender } = renderHook(({ ids }) => useSelection(ids), {
      initialProps: { ids: ["a", "b"] },
    });

    act(() => result.current.toggle("a"));
    expect(result.current.allSelected).toBe(false);

    // "b" leaves, so "a" is now everything there is.
    rerender({ ids: ["a"] });
    expect(result.current.allSelected).toBe(true);
  });
});
