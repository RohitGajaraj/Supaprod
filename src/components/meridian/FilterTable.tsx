import { useMemo, useState, type ReactNode } from "react";
import { RecordsTable, type RecordColumn } from "./RecordsTable";

/*
 * FILTER TABLE, status chips that reorganise a live grid.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Filter Table"
 *                 (their file: components/FilterTable.tsx), MIT licensed,
 *                 read on 2026-08-14 from the exact string that page's own
 *                 "View code" panel renders.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * The 2026-08-14 surface audit found three shipped surfaces with no
 * dense-data affordance at all. Design renders every drawing in the workspace
 * uncapped, unfiltered and unsearchable. Ship carries five independent expand
 * toggles and no filter or sort. Build lists workspace-wide changes with no
 * search. All three are the same hole: the reader can see everything and
 * therefore cannot see anything.
 *
 * ── WHY IT COMPOSES RATHER THAN REIMPLEMENTS ────────────────────────────
 * The grid underneath is `RecordsTable`. This file owns exactly one idea, the
 * chip row and the narrowing it drives, and hands the result down. The
 * alternative is two tables in the codebase that drift apart, and the second
 * one is always the one that forgets the empty states.
 *
 * ── WHY THE CHIPS CARRY NO COLOUR ───────────────────────────────────────
 * The reference gives every chip its own coloured dot, one hue per status.
 * That reflex is exactly what this system removes, and for two reasons.
 *
 * The first is that a chip is a COUNT, not a status. Orchid means a person is
 * required, azure means a machine is working, green and red report an outcome.
 * A count of the in-progress rows is none of those: it is not itself a machine
 * working, it is a number about rows. Painting it says something untrue before
 * the reader has read a word.
 *
 * The second is that a per-status palette has to invent a hue for every state,
 * and the reference's four dots are four hues chosen to look distinct rather
 * than to mean anything. The chips are separated by fill, weight, elevation and
 * position instead, which is what an active control is separated by anyway,
 * and the accent is left for the cells, where `RecordStatus` spends it on
 * status that is genuinely status.
 *
 * CORRECTING THIS HEADER, 2026-08-15. It used to close that paragraph with
 * "there is no amber here and no `warn`", and as of the same day that is simply
 * false: meridian.css admits `--mrd-hold`, an amber that means "stopped, and
 * NOT on you", after production was found with thirty-nine of forty-three work
 * items in exactly that state and no colour for it. The RULING above survives
 * the correction untouched — a count of the held rows is still a number about
 * rows and not itself a held thing — but a header that argues from a palette
 * fact that stopped being true is a header the next reader cannot trust on the
 * parts that are still right.
 */

export type Facet<Row> = {
  /** Stable id, also the chip's key. */
  key: string;
  /** The chip's word. Name the state, never the enum. */
  label: string;
  /** Which rows this facet keeps. */
  match: (row: Row) => boolean;
};

export type FilterTableProps<Row> = {
  rows: Row[];
  columns: RecordColumn<Row>[];
  facets: Facet<Row>[];
  rowKey: (row: Row) => string;
  caption: string;
  /** The chip that means no narrowing. Rendered first, always present. */
  allLabel?: string;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  emptyTitle?: string;
  emptyDetail?: string;
  failure?: { message: string; onRetry?: () => void };
  maxRows?: number;
  footer?: ReactNode;
};

const FOCUS =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

export function FilterTable<Row>({
  rows,
  columns,
  facets,
  rowKey,
  caption,
  allLabel = "All",
  selectable,
  onSelectionChange,
  emptyTitle = "Nothing here yet",
  emptyDetail,
  failure,
  maxRows,
  footer,
}: FilterTableProps<Row>) {
  const [active, setActive] = useState<string | null>(null);

  /*
   * Counts come from the unfiltered set every time. A chip whose number moves
   * when you press a different chip is telling you about the current view, not
   * about the workspace, and it stops being a reason to press it.
   */
  const counts = useMemo(() => {
    const out = new Map<string, number>();
    for (const facet of facets) out.set(facet.key, rows.filter(facet.match).length);
    return out;
  }, [rows, facets]);

  const visible = useMemo(() => {
    if (!active) return rows;
    const facet = facets.find((f) => f.key === active);
    return facet ? rows.filter(facet.match) : rows;
  }, [rows, facets, active]);

  /*
   * A read that failed has no honest counts to show, so the chip row is not
   * rendered at all. Chips reading zero over a failed read say "your workspace
   * is empty", which is the one thing the reader must not be told here.
   */
  const chipsUsable = !failure && rows.length > 0;

  const chip = (key: string | null, label: string, count: number) => {
    const isActive = active === key;
    return (
      <button
        key={key ?? "__all"}
        type="button"
        aria-pressed={isActive}
        onClick={() => setActive(key)}
        className={`flex h-6.5 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-[background-color,box-shadow,color] ${FOCUS} ${
          isActive
            ? "bg-mrd-lift text-mrd-ink"
            : "text-mrd-body hover:bg-mrd-hover hover:text-mrd-ink"
        }`}
        style={{
          /*
           * ── THE PRESSED CHIP HAS TO LOOK PRESSED ──────────────────────────
           *
           * The reference's active chip is `bg-surface shadow-btn`: it steps up
           * off the strip AND takes an edge and a shadow, so it reads as a key
           * held down. The port kept only the fill, and on our dark ground the
           * step from sheet to lift is four points of lightness with no edge on
           * it — which is a chip that is arguably differently coloured, not one
           * that is obviously chosen. On paper it is worse: `lift` sits BELOW
           * the canvas there, so the only cue was a one-and-a-half point
           * darkening.
           *
           * Three shadows, all inset except the drop, so nothing reflows when
           * the selection moves between chips: the hairline is the chip's edge,
           * the sheen is the specular top the system gives every filled control,
           * and the card shadow lifts it off the strip. A border would have cost
           * two pixels of width and shunted every chip to its right.
           */
          boxShadow: isActive
            ? "inset 0 0 0 1px var(--mrd-line), inset 0 1px 0 var(--mrd-sheen), var(--mrd-shadow-card)"
            : "none",
          /* The reference runs this at 200ms; `--mrd-d-move` is the system's
             stop for something changing state and is the nearest thing to it.
             At `d-press` the fill and the shadow arrived faster than the eye
             tracks the pointer, which is what made the old chip snap. */
          transitionDuration: "var(--mrd-d-move)",
        }}
      >
        {label}
        <span
          className={`rounded-mrd-xs px-1 font-mrd-mono text-[10.5px] tabular-nums ${
            isActive ? "bg-mrd-sink text-mrd-body" : "text-mrd-mute"
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div data-mrd="" className="flex w-full flex-col gap-2">
      {chipsUsable && (
        <div
          role="group"
          aria-label={`Narrow ${caption}`}
          className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 py-1"
          style={{ scrollbarWidth: "none" }}
        >
          {chip(null, allLabel, rows.length)}
          {facets.map((facet) => chip(facet.key, facet.label, counts.get(facet.key) ?? 0))}
        </div>
      )}

      {/*
       * ── THE FILTER MOVES, IT DOES NOT SNAP ──────────────────────────────
       *
       * The reference keeps every row mounted and collapses the excluded ones
       * with `grid-template-rows: 1fr -> 0fr`, so narrowing a list reads as the
       * table reorganising itself. We cannot do that here, and the reason is
       * deliberate: this component COMPOSES RecordsTable rather than
       * reimplementing a grid, so the rows are not ours to keep mounted, and
       * teaching that grid to render rows it has been told to exclude would put
       * its sort, its cap, its selection and its empty-state logic all in
       * disagreement about how many rows exist.
       *
       * So the motion moves up a level: the body plays a short settle whenever
       * the chip changes, keyed on the active facet so React replays it. Same
       * message — "this list just reorganised" — without two components
       * disagreeing about what a row is.
       *
       * `isFiltered` is passed straight through, and it is the whole reason
       * the grid below can tell "you have no rows" apart from "your chip hid
       * them all". Getting it wrong shows a reader an empty workspace that is
       * in fact full, and they will believe it.
       */}
      <div
        key={active ?? "__all"}
        style={{ animation: "mrd-fade-up var(--mrd-d-move) var(--mrd-ease) both" }}
      >
        <RecordsTable
          rows={visible}
          columns={columns}
          rowKey={rowKey}
          caption={caption}
          selectable={selectable}
          onSelectionChange={onSelectionChange}
          isFiltered={active !== null}
          onClearFilter={() => setActive(null)}
          totalBeforeFilter={rows.length}
          emptyTitle={emptyTitle}
          emptyDetail={emptyDetail}
          failure={failure}
          maxRows={maxRows}
          footer={footer}
        />
      </div>
    </div>
  );
}

export default FilterTable;
