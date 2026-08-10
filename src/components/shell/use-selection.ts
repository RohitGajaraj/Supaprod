import * as React from "react";

/**
 * MULTI-SELECT, AND WHY IT IS A PRIMITIVE RATHER THAN A SURFACE'S PROBLEM.
 *
 * A sweep of every queue in the product on 2026-08-10 found the same absence in
 * every one of them: not a single multi-select, select-all or range-select
 * anywhere. Today, Approvals, Runs, Build, Brain, Decide, Discover, Plan --
 * each one lets a person act on exactly one thing at a time. A Head of Product
 * arriving to twenty overnight approvals has no path but twenty keypresses.
 *
 * That eight surfaces independently failed to have it is the tell that it was
 * never a surface's job. It is a missing primitive, so it goes here, and every
 * queue gets it in one change rather than eight.
 *
 * THE SHAPE IS INLINE, NOT FLOATING, and that is a considered break from the
 * majority. Across the products studied, the bulk bar is usually a pill
 * floating at the bottom centre; the minority replace the list header with the
 * selection state instead. Floating never reflows the list, which is its whole
 * appeal. But every queue in THIS product carries a paginator or a "Show all N"
 * beneath it and a context rail beside it, and a floating bar lands on top of
 * exactly those. A control that covers the way out of the list is worse than
 * one that costs a row. So the bar takes the list's own header slot, which is
 * space the surface has already spent.
 */

export type Selection = {
  /** Ids currently selected, in no particular order. */
  ids: ReadonlySet<string>;
  count: number;
  has: (id: string) => boolean;
  /** Toggle one id. Pass the event to get range-select from a shift-click. */
  toggle: (id: string, e?: { shiftKey?: boolean }) => void;
  selectAll: () => void;
  clear: () => void;
  /** True when every currently-visible id is selected. */
  allSelected: boolean;
};

/**
 * Selection state over an ORDERED list of ids.
 *
 * The order matters and is the caller's, not ours: range-select means "every
 * row between the last one I touched and this one", and only the surface knows
 * what is between them after its own filtering and sorting. Passing the ids in
 * render order is what makes shift-click mean what a person expects.
 *
 * SELF-HEALING against a list that changes underneath it. These queues poll --
 * approvals every few seconds, runs every five -- so a selected row can settle,
 * be archived by someone else, or drop out of a filter while it is selected.
 * The selection is intersected with the live ids on every read, so a bulk
 * action can never act on something that has left the list, and the count can
 * never claim more than the surface is showing.
 */
export function useSelection(ids: readonly string[]): Selection {
  const [raw, setRaw] = React.useState<ReadonlySet<string>>(() => new Set());
  const anchor = React.useRef<string | null>(null);

  // Intersect with what is actually on screen. See SELF-HEALING above.
  const live = React.useMemo(() => {
    const present = new Set(ids);
    const next = new Set<string>();
    for (const id of raw) if (present.has(id)) next.add(id);
    return next;
  }, [raw, ids]);

  const toggle = React.useCallback(
    (id: string, e?: { shiftKey?: boolean }) => {
      setRaw((prev) => {
        const next = new Set(prev);
        const from = anchor.current;

        // Shift extends from the last row touched, which is how every list in
        // every operating system behaves. Without an anchor it is an ordinary
        // toggle rather than an error.
        if (e?.shiftKey && from && from !== id) {
          const a = ids.indexOf(from);
          const b = ids.indexOf(id);
          if (a !== -1 && b !== -1) {
            const [lo, hi] = a < b ? [a, b] : [b, a];
            // A range ADDS. Shift-clicking never removes rows a person cannot
            // see themselves removing.
            for (let i = lo; i <= hi; i++) next.add(ids[i]);
            anchor.current = id;
            return next;
          }
        }

        if (next.has(id)) next.delete(id);
        else next.add(id);
        anchor.current = id;
        return next;
      });
    },
    [ids],
  );

  const selectAll = React.useCallback(() => {
    setRaw(new Set(ids));
    anchor.current = null;
  }, [ids]);

  const clear = React.useCallback(() => {
    setRaw(new Set());
    anchor.current = null;
  }, []);

  return {
    ids: live,
    count: live.size,
    has: (id: string) => live.has(id),
    toggle,
    selectAll,
    clear,
    allSelected: ids.length > 0 && live.size === ids.length,
  };
}
