import { Action } from "@/components/meridian/surface-parts";

/*
 * THE FILTER ROW, drawn in Meridian.
 *
 * Text tabs with a count each, never a facet explosion: this queue federates
 * ten gate families into five buckets on purpose, and five is already the most
 * a person will read before they stop reading.
 *
 * ── NO COLOUR HERE, DELIBERATELY ────────────────────────────────────────
 * The counts are counts. They are not status, so they carry no hue: the accent
 * on this surface means a person is required, and every one of these buckets is
 * that, so tinting them would say nothing and spend the one signal the surface
 * has. The selected tab is separated by GROUND and by ink weight instead, which
 * is what keeps it legible in greyscale.
 *
 * A bucket with nothing in it still draws, and draws its zero as an absence
 * rather than as a "0". Hiding an empty bucket makes the row change width as
 * work lands, and a control that moves under the cursor is a control that gets
 * mis-clicked.
 */

export function QueueFilters<T extends string>({
  filters,
  counts,
  active,
  onSelect,
}: {
  filters: { id: T; label: string }[];
  counts: Record<T, number>;
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-mrd-2"
      role="tablist"
      aria-label="Filter the queue"
    >
      {filters.map((f) => {
        const on = active === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(f.id)}
            data-mrd=""
            className={`inline-flex h-8 items-center gap-2 rounded-mrd-chip px-3 text-mrd-label transition-colors ${
              on
                ? "bg-mrd-lift font-medium text-mrd-ink"
                : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-ink text-mrd-body"
            }`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {f.label}
            {counts[f.id] > 0 ? (
              <span className="font-mrd-mono text-mrd-tiny tabular-nums text-mrd-faint">
                {counts[f.id]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A FILTER EXCLUDED EVERYTHING, which is not an empty queue.
 *
 * The two look identical and mean opposite things: one says the work is done,
 * the other says the work is behind a control you set two seconds ago. This one
 * therefore names the control and offers to undo it, which the surface could
 * not do before: it said "Nothing in this filter." and left the reader to find
 * their own way back.
 */
export function FilterExcludedEverything({
  total,
  label,
  onClearFilter,
}: {
  /** How many calls are waiting outside this filter. A real number, always. */
  total: number;
  /** The bucket in force, in the words the tab uses. */
  label: string;
  onClearFilter: () => void;
}) {
  return (
    <section className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-6">
      <h2 className="text-[16px] leading-mrd-snug font-medium text-mrd-ink">
        Nothing under {label}.
      </h2>
      <p className="mt-mrd-3 max-w-[62ch] leading-mrd-prose text-mrd-prose text-mrd-body">
        {total === 1
          ? "One call is still waiting, under another heading."
          : `${total} calls are still waiting, under other headings.`}
      </p>
      <div className="mt-mrd-5">
        <Action onClick={onClearFilter}>Show everything</Action>
      </div>
    </section>
  );
}
