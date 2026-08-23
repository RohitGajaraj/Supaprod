import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/*
 * RECORDS TABLE, a dense grid for a list nobody can scan by eye.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Records Table"
 *                 (their file: components/RecordsTable.tsx), MIT licensed,
 *                 read on 2026-08-14 from the exact string that page's own
 *                 "View code" panel renders.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * `runs.index` and the Decide queue both print a list that only reads at ten
 * rows. Past that the reader is scrolling and hoping. This is the grid that
 * carries a wide row without losing the one column that identifies it: the
 * first column stays put while the rest scroll under it, and the head stays
 * put while the body scrolls under that.
 *
 * ── GENERIC ON PURPOSE ──────────────────────────────────────────────────
 * The reference hardcodes one fixture (an ice cream CRM). Three different
 * surfaces need this grid over three different row shapes, so the data comes
 * in as rows plus a column definition and nothing about the shape is baked in
 * here. A column says how to PRINT a cell and, separately, how to COMPARE it.
 *
 * ── THE FOUR THINGS A LIST CAN BE, WHICH ARE NOT ONE THING ──────────────
 *   nothing exists          an empty workspace. Say so, and say what would
 *                           put something here.
 *   a filter excluded it    the rows exist and you cannot see them. This is a
 *                           different fact and it must offer the way back.
 *   the read failed         never wears the empty state's clothes. It gets a
 *                           retry, because the alternative is a reader who
 *                           believes their workspace is empty when it is not.
 *   capped                  if rows are withheld, the count of withheld rows
 *                           is on screen. Silently truncating a list is the
 *                           failure this product has already shipped once.
 */

/**
 * The only colours a cell may carry, and they are the product's law rather
 * than a palette. Orchid means a person is required. Azure means a machine is
 * working. Green and red report an outcome and never a need.
 *
 * `hold` is the fifth, added 2026-08-15: stopped, and NOT on you. It is the
 * difference between a row you can unblock by deciding something and a row
 * that needs a condition to change — a source connected, a cap raised, a
 * dependency to answer. Those used to share the `quiet` grey with genuinely
 * uninteresting rows, which is how the most common state in the workspace
 * ended up as the least visible thing in the table.
 *
 * Anything categorical (a tag, a team, a file type) is a neutral: it is not
 * status, and spending the accent on it makes the real status unreadable.
 * Reach for a token by NAME, never by picking a colour that looks about right.
 */
export type RecordTone = "you" | "agent" | "hold" | "pass" | "fail" | "quiet";

const TONE: Record<RecordTone, string> = {
  you: "var(--mrd-you)",
  agent: "var(--mrd-agent)",
  hold: "var(--mrd-hold)",
  pass: "var(--mrd-pass)",
  fail: "var(--mrd-fail)",
  quiet: "var(--mrd-faint)",
};

export type RecordColumn<Row> = {
  /** Stable id, also the sort key. */
  key: string;
  /** The heading. Name the fact, never the mechanism that produced it. */
  header: string;
  /** What the cell prints. */
  cell: (row: Row) => ReactNode;
  /**
   * Return something genuinely comparable, and note that this is NOT the
   * printed value. Sorting the printed string is the trap the reference demo
   * fell into: "9 days ago" sorts ahead of "2 months ago" alphabetically,
   * which is backwards, and the column looks like it works. Return epoch ms,
   * or a rank. Omit the function and the column is simply not sortable.
   */
  sortValue?: (row: Row) => string | number;
  /** Mono and tabular. Use for counts, durations, ids. */
  numeric?: boolean;
  /** Width for the colgroup, e.g. "22ch". Omit and the column takes its share. */
  width?: string;
};

export type RecordsTableProps<Row> = {
  rows: Row[];
  columns: RecordColumn<Row>[];
  /** Stable identity per row. Selection and React keys both ride on it. */
  rowKey: (row: Row) => string;
  /** Read aloud before the grid. Say what the grid is, not that it is a grid. */
  caption: string;
  /** Checkboxes in the first column. Off unless a surface can act on a set. */
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  /**
   * True when something upstream is narrowing the rows. It is the ONLY way
   * this component can tell "your workspace is empty" apart from "your filter
   * excluded everything", and it gets those two wrong in opposite directions
   * if the caller forgets to pass it.
   */
  isFiltered?: boolean;
  onClearFilter?: () => void;
  /**
   * How many rows existed BEFORE the filter ran. This component cannot work it
   * out: by the time rows arrive here they are already narrowed, so `rows` is
   * empty in the excluded case and counting it would print a confident zero.
   * Pass it and the reader is told how many rows their filter is hiding; leave
   * it off and the message stays honest by naming no number at all.
   */
  totalBeforeFilter?: number;
  /** Shown when nothing exists at all. */
  emptyTitle?: string;
  emptyDetail?: string;
  /** A read that did not come back. Never an empty state. */
  failure?: { message: string; onRetry?: () => void };
  /** Rows rendered before the cap notice appears. Omit for no cap. */
  maxRows?: number;
  /** Summary strip under the body, e.g. counts. Optional. */
  footer?: ReactNode;
};

function compare(a: string | number, b: string | number) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * A status cell, restricted to the four meanings the product has. Exported so
 * a surface never has to reach for a colour itself; if it needs a fifth
 * meaning, that is a conversation about the system, not a hex value.
 */
export function RecordStatus({ tone, label }: { tone: RecordTone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: TONE[tone] }}
      />
      <span className={tone === "quiet" ? "text-mrd-faint" : "text-mrd-body"}>{label}</span>
    </span>
  );
}

/**
 * A categorical chip: a tag, a team, a kind. Deliberately colourless. The
 * reference carries twelve hand-picked tag hues, which is exactly the thing
 * that makes a grid's real status invisible.
 */
export function RecordTag({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded-mrd-xs border border-mrd-line bg-mrd-sink px-1.5 text-mrd-data text-mrd-body">
      {label}
    </span>
  );
}

function Chevron() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

/* One focus treatment for every control in the file, so nothing is unreachable
 * by keyboard and nothing invents its own ring. */
const FOCUS =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

export function RecordsTable<Row>({
  rows,
  columns,
  rowKey,
  caption,
  selectable = false,
  onSelectionChange,
  isFiltered = false,
  onClearFilter,
  totalBeforeFilter,
  emptyTitle = "Nothing here yet",
  emptyDetail,
  failure,
  maxRows,
  footer,
}: RecordsTableProps<Row>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [capLifted, setCapLifted] = useState(false);
  const headBox = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const value = column.sortValue;
    return [...rows].sort((a, b) => compare(value(a), value(b)) * sort.dir);
  }, [rows, columns, sort]);

  const cap = maxRows && !capLifted ? maxRows : undefined;
  const shown = cap ? sorted.slice(0, cap) : sorted;
  const withheld = sorted.length - shown.length;

  /*
   * Selection counts only what is on screen. A "select all" that silently
   * takes in rows the reader cannot see is how a bulk action goes wrong, and
   * it goes wrong quietly.
   */
  const allSelected = shown.length > 0 && shown.every((row) => selected.has(rowKey(row)));
  const someSelected = !allSelected && shown.some((row) => selected.has(rowKey(row)));

  useEffect(() => {
    if (headBox.current) headBox.current.indeterminate = someSelected;
  }, [someSelected]);

  const commit = (next: Set<string>) => {
    setSelected(next);
    onSelectionChange?.([...next]);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    commit(next);
  };

  const toggleAll = () => {
    const next = new Set(selected);
    for (const row of shown) {
      if (allSelected) next.delete(rowKey(row));
      else next.add(rowKey(row));
    }
    commit(next);
  };

  const toggleSort = (key: string) =>
    setSort((current) =>
      current?.key === key ? { key, dir: (current.dir * -1) as 1 | -1 } : { key, dir: 1 },
    );

  const span = columns.length + (selectable ? 1 : 0);

  /*
   * The colgroup is only binding if EVERY column declared a width. With one
   * column left open, `table-fixed` would hand it whatever is left over and
   * the others their declared share, which is a different layout from the one
   * the caller described — so in that case the table stays on auto layout and
   * the browser's own sizing, which is the right answer when the description
   * is incomplete. `2.25rem` is the selection column, and it is repeated from
   * the colgroup below; if one changes the other must.
   */
  const allWidthsDeclared = columns.every((column) => Boolean(column.width));
  const minTableWidth = allWidthsDeclared
    ? `calc(${columns.map((column) => column.width).join(" + ")}${selectable ? " + 2.25rem" : ""})`
    : undefined;

  /* Every state below fills one full-width body row, so the head stays visible
   * and the reader can still see which columns they are missing. */
  const body = failure ? (
    <tr>
      <td colSpan={span} className="px-4 py-10">
        <div className="mx-auto flex max-w-[46ch] flex-col items-center gap-2 text-center">
          <span className="text-mrd-base font-medium" style={{ color: "var(--mrd-fail)" }}>
            {failure.message}
          </span>
          <span className="mrd-meta">
            This is a read that did not come back, not an empty workspace.
          </span>
          {failure.onRetry && (
            <button
              type="button"
              onClick={failure.onRetry}
              className={`mt-1 rounded-mrd-ctl bg-mrd-solid px-2.5 py-1 text-mrd-label font-medium text-mrd-on-solid transition-opacity hover:opacity-90 ${FOCUS}`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              Try again
            </button>
          )}
        </div>
      </td>
    </tr>
  ) : shown.length === 0 && isFiltered ? (
    <tr>
      <td colSpan={span} className="px-4 py-10">
        <div className="mx-auto flex max-w-[46ch] flex-col items-center gap-2 text-center">
          <span className="text-mrd-base font-medium text-mrd-ink">No rows match this filter</span>
          <span className="mrd-meta">
            {totalBeforeFilter
              ? `${totalBeforeFilter} row${totalBeforeFilter === 1 ? "" : "s"} exist and the filter is hiding all of them.`
              : "The rows exist. Widen the filter to bring them back."}
          </span>
          {onClearFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              className={`mt-1 rounded-mrd-ctl border border-mrd-edge px-2.5 py-1 text-mrd-label font-medium text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              Clear the filter
            </button>
          )}
        </div>
      </td>
    </tr>
  ) : shown.length === 0 ? (
    <tr>
      <td colSpan={span} className="px-4 py-10">
        <div className="mx-auto flex max-w-[46ch] flex-col items-center gap-1.5 text-center">
          <span className="text-mrd-base font-medium text-mrd-ink">{emptyTitle}</span>
          {emptyDetail && <span className="mrd-meta">{emptyDetail}</span>}
        </div>
      </td>
    </tr>
  ) : (
    shown.map((row) => {
      const id = rowKey(row);
      const isSelected = selected.has(id);

      /*
       * The pinned column needs its own opaque fill or the scrolled cells show
       * through it, and that fill would otherwise swallow the row's hover and
       * selection tints: every cell would light up except the one holding the
       * name. So the pinned cell steps up the neutral ladder instead of taking
       * the translucent overlay, which lands at the same lightness.
       */
      const pinFill = isSelected ? "bg-mrd-lift" : "bg-mrd-sheet group-hover:bg-mrd-lift";

      /*
       * TWO pins, not one, and this was a real defect.
       *
       * The pin used to be gated on `!selectable`, so switching selection on
       * silently unpinned the identity column: the 36px checkbox stayed put and
       * the NAME scrolled away, which is the one thing pinning exists to
       * prevent. Selection makes it worse, not better, because a checkbox with
       * nothing beside it cannot tell you what you just ticked.
       *
       * So the checkbox pins at 0 and the identity column pins immediately to
       * its right. `left-9` is 2.25rem, which is the width declared for that
       * column in the colgroup below; if one moves the other must.
       */
      const pinnedCheckbox = `sticky left-0 z-[1] ${pinFill}`;
      const pinnedIdentity = `sticky ${selectable ? "left-9" : "left-0"} z-[1] ${pinFill}`;

      return (
        <tr
          key={id}
          className={`group transition-colors ${isSelected ? "bg-mrd-hover" : "hover:bg-mrd-hover"}`}
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          {selectable && (
            <td
              className={`w-9 border-b border-mrd-line-soft px-3 py-2 align-middle transition-colors ${pinnedCheckbox}`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleRow(id)}
                aria-label={`Select row ${id}`}
                className={`size-3.5 cursor-pointer accent-[var(--mrd-solid)] ${FOCUS}`}
              />
            </td>
          )}
          {columns.map((column, index) => (
            <td
              key={column.key}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
              className={`border-b border-mrd-line-soft px-3 py-2 align-middle text-[12.5px] text-mrd-body transition-colors ${
                column.numeric ? "text-right font-mrd-mono tabular-nums" : ""
              } ${index === 0 ? `${pinnedIdentity} font-medium text-mrd-ink` : ""}`}
            >
              {column.cell(row)}
            </td>
          ))}
        </tr>
      );
    })
  );

  return (
    <div
      data-mrd=""
      className="w-full overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet"
    >
      {/*
       * The scroll container is focusable and named. A grid that only scrolls
       * under a pointer is a grid a keyboard reader cannot finish reading, and
       * a wide one always scrolls.
       *
       * ── SIDEWAYS ONLY. THE HEIGHT IS NEVER CAPPED. ────────────────────────
       * This carried `max-h-[28rem]`, which put a second vertical scroller
       * inside the page's own. The founder ruled that out on this exact
       * surface: commit 37feadff, "one scroll, not a scroll inside a scroll",
       * took the same cap off the Runs board and wrote the rule into the CSS
       * beside it. An opened list grows and THE PAGE scrolls.
       *
       * It also made "Show all N" a worse control than the one it replaced.
       * The old All 43 grew the page; a capped box turns the same click into
       * 43 rows posted through a 448px slot, so lifting the cap revealed
       * almost nothing and cost a person their place on the page.
       *
       * `overflow-auto` stays, because the horizontal scroll is not optional:
       * the identity column is `position: sticky` and needs this element to be
       * its scroll container. With no height limit there is nothing to overflow
       * vertically, so no second wheel trap can appear.
       */}
      <div role="region" tabIndex={0} aria-label={caption} className={`overflow-auto ${FOCUS}`}>
        {/*
         * ── WHY `table-fixed` AND A MIN-WIDTH, AND NOT `w-full` ALONE ──────
         *
         * This table declared real column widths — 34ch for the work title,
         * 13ch for the station — and did not get them. Under the default
         * `table-layout: auto`, a `<col width>` is a SUGGESTION the browser is
         * free to overrule, and `w-full` caps the table at its container. The
         * declared widths here sum to about 600px; inside the two-up gallery
         * ground each table gets about 430px. So the browser had to claw back
         * 170px, and auto layout takes it from whichever column can still
         * break — the prose one. The work title rendered about 90px wide, one
         * word per line, six lines deep, while three columns beside it sat
         * half empty.
         *
         * That is also why the horizontal scroll this component's own note
         * promises never appeared: a table that shrinks to fit has nothing to
         * overflow, so `overflow-auto` had no work to do and the sticky
         * identity column had no scroll to stick against.
         *
         * `table-fixed` makes the colgroup binding. The min-width is the sum
         * of what the columns actually asked for, so when the container is
         * narrower than that the table keeps its shape and the region scrolls;
         * when it is wider, `w-full` lets the columns grow proportionally.
         * Computed from the declared widths rather than hardcoded, so it
         * cannot drift out of agreement with the colgroup above it.
         */}
        <table
          className={`w-full border-separate border-spacing-0 text-left ${allWidthsDeclared ? "table-fixed" : ""}`}
          style={minTableWidth ? { minWidth: minTableWidth } : undefined}
        >
          <caption className="sr-only">{caption}</caption>
          <colgroup>
            {selectable && <col style={{ width: "2.25rem" }} />}
            {columns.map((column) => (
              <col key={column.key} style={column.width ? { width: column.width } : undefined} />
            ))}
          </colgroup>

          <thead>
            <tr>
              {selectable && (
                <th
                  scope="col"
                  className="sticky top-0 left-0 z-[3] border-b border-mrd-line bg-mrd-sheet px-3 py-2"
                >
                  <input
                    ref={headBox}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select every row on screen"
                    className={`size-3.5 cursor-pointer accent-[var(--mrd-solid)] ${FOCUS}`}
                  />
                </th>
              )}
              {columns.map((column, index) => {
                const active = sort?.key === column.key;
                const sortable = Boolean(column.sortValue);
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : "none"}
                    className={`sticky top-0 border-b border-mrd-line bg-mrd-sheet px-3 py-2 text-mrd-data font-medium text-mrd-mute ${
                      column.numeric ? "text-right" : ""
                    } ${index === 0 ? (selectable ? "left-9 z-[3]" : "left-0 z-[3]") : "z-[2]"}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={`inline-flex items-center gap-1 rounded-mrd-xs transition-colors hover:text-mrd-ink ${FOCUS}`}
                        style={{ transitionDuration: "var(--mrd-d-press)" }}
                      >
                        <span className="truncate">{column.header}</span>
                        {/*
                         * The arrow holds its space at rest instead of appearing
                         * on sort. A glyph that arrives on click shifts every
                         * heading beside it, and the reader reads that shift as
                         * the table having changed shape.
                         */}
                        <span
                          className="transition-[opacity,transform]"
                          style={{
                            opacity: active ? 1 : 0,
                            transform: active && sort!.dir === -1 ? "rotate(180deg)" : undefined,
                            transitionDuration: "var(--mrd-d-move)",
                            transitionTimingFunction: "var(--mrd-ease)",
                          }}
                        >
                          <Chevron />
                        </span>
                      </button>
                    ) : (
                      <span className="truncate">{column.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>{body}</tbody>
        </table>
      </div>

      {/*
       * The cap is stated, with both real numbers and a way out. A grid that
       * quietly stops at fifty teaches its reader that fifty is all there is.
       */}
      {withheld > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-mrd-line bg-mrd-sink px-3 py-2">
          {/* Sans, not mono: this is a sentence that happens to contain
              numbers, and mono is for the numbers themselves. `tabular-nums`
              stays so the counts do not jitter as rows load. */}
          <span className="mrd-meta tabular-nums">
            Showing {shown.length} of {sorted.length} rows. {withheld} not shown.
          </span>
          <button
            type="button"
            onClick={() => setCapLifted(true)}
            className={`rounded-mrd-ctl border border-mrd-edge px-2 py-0.5 text-mrd-small font-medium text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            Show all {sorted.length}
          </button>
        </div>
      )}

      {footer && (
        <div className="border-t border-mrd-line bg-mrd-sink px-3 py-2 mrd-meta">
          {footer}
        </div>
      )}
    </div>
  );
}

export default RecordsTable;
