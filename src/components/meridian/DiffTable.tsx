import { useEffect, useState } from "react";

/*
 * DIFF TABLE, a proposed edit sweeping through tabular data.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Diff Table"
 *                 (their file: components/DiffTable.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * Design's proposed changes and spec revisions both show the AFTER and leave
 * the reader to remember the before. That is a fine way to present a fact and a
 * poor way to present a proposal, because the only question a reader has about
 * a proposal is what it moves. The sweep answers exactly that question and
 * nothing else: the table renders as it stands, then the rows the edit touches
 * mark themselves.
 *
 * ── THE ONE THING WE ADDED ──────────────────────────────────────────────
 * Their card shows a proposed edit with no sign that it is waiting on anybody.
 * In this product that is the most important fact on the surface, so the header
 * carries a `--mrd-you` mark while `status` is "proposed" and drops it the
 * moment the proposal is resolved. That is the hue's whole meaning: this does
 * not move until you touch it.
 *
 * Green and red stay on the rows, in the outcome register: they report what the
 * edit does to each row, added or removed, and never that a person must act.
 * Keeping those two jobs on different hues is the point. If the row tint and
 * the "waiting on you" mark were the same colour, a diff with nothing pending
 * and a diff blocking a release would look identical.
 *
 * ── WHAT WE DROPPED ─────────────────────────────────────────────────────
 * Their category pill carries a coloured dot on a three way rotation, and the
 * pill already spells the category out beside it. The dot is decoration, it
 * would not survive the greyscale test, and one of its three hues is a colour
 * this system no longer has. The pill keeps its shape, which is what made it
 * read as a tag, and loses the dot.
 */

export type DiffChange = "added" | "removed";

export type DiffTableRow = {
  /** Stable across renders. Two rows can print the same first cell. */
  id: string;
  /** One entry per column. Short of the column count renders blank cells. */
  cells: string[];
  /** Omit for a row the edit leaves alone. */
  change?: DiffChange;
};

export type DiffStatus = "proposed" | "applied" | "rejected";

const RESOLVED_NOTE: Record<Exclude<DiffStatus, "proposed">, string> = {
  applied: "Applied",
  rejected: "Rejected",
};

/*
 * ── HOW A CELL HANDLES A VALUE TOO LONG FOR IT ──────────────────────────
 *
 * Every text cell in this table clamps to two lines. Three shapes were
 * available and only this one is right for the content:
 *
 *   wrap freely   what the table did in column one, because that cell carried
 *                 no rule at all. A real supplier name then took four lines and
 *                 the row grew to match, so a table of five edits scrolled. It
 *                 also broke the tag pill's alignment, since the pill sits at a
 *                 fixed height beside a cell that no longer is.
 *   one line      what the other columns did. Safe, and it hides too much: the
 *                 values here are the whole point of a diff, and a name ellipsed
 *                 at "Northfield Creamery Suppl…" is a name the reader has to
 *                 hover to read, on every single row.
 *   two lines     enough for essentially every real value to land in full, and
 *                 a hard ceiling so a pathological one cannot grow the row.
 *
 * `break-words` is the part that is easy to leave out and the part that makes
 * it hold: without it a single unbroken token — a URL, a slug, an id — refuses
 * to break anywhere, so it overflows the cell horizontally no matter what the
 * line clamp says. The clamp bounds height; only this bounds width.
 *
 * Every clamped cell also carries `title`, so nothing is ever unreachable.
 */
const CLAMP = "line-clamp-2 break-words";

/*
 * A wash derived from the outcome token rather than a token of its own.
 * Meridian carries no tint pair, and inventing one would put two sources of
 * truth on the same hue: the next time `--mrd-fail` is tuned, a hand mixed
 * tint beside it stops matching and nobody notices, because a background wash
 * is exactly the thing no one inspects.
 */
const WASH: Record<DiffChange, string> = {
  removed: "color-mix(in oklab, var(--mrd-fail) 13%, transparent)",
  added: "color-mix(in oklab, var(--mrd-pass) 13%, transparent)",
};

export function DiffTable({
  title,
  columns,
  widths,
  rows,
  status = "proposed",
  tagColumn = 1,
  animate = true,
  emptyLabel = "No changes proposed.",
}: {
  title: string;
  columns: string[];
  /** CSS widths, one per column. Defaults to equal shares. */
  widths?: string[];
  /** Empty is the primary case here, not the afterthought. */
  rows: DiffTableRow[];
  status?: DiffStatus;
  /** Which cell renders as a tag pill. Pass -1 for none. */
  tagColumn?: number;
  animate?: boolean;
  emptyLabel?: string;
}) {
  /*
   * Two beats: the removals mark, then the additions open. Their version waits
   * 1.8s for the first and 2.8s for the second, which is a long time to hold
   * someone who has been sent here to make a call. 600 and 500 keep the
   * sequence readable, which is the only thing the delay was buying.
   *
   * Reduced motion lands on the settled state at once rather than replaying it
   * fast. The sweep is decoration: every fact it carries is still in the tint
   * and the strikethrough after it finishes.
   */
  const [phase, setPhase] = useState(() => {
    if (!animate) return 2;
    if (typeof window === "undefined") return 2;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 2 : 0;
  });

  useEffect(() => {
    if (phase >= 2) return;
    const t = setTimeout(() => setPhase((p) => p + 1), phase === 0 ? 600 : 500);
    return () => clearTimeout(t);
  }, [phase]);

  const marked = phase >= 1;
  const revealed = phase >= 2;

  const cols = widths ?? columns.map(() => `${(100 / columns.length).toFixed(2)}%`);
  const grid = cols.join(" ");
  const keptRows = rows.filter((r) => r.change !== "added");
  const addedRows = rows.filter((r) => r.change === "added");

  return (
    <div data-mrd="" className="w-full max-w-95 font-mrd">
      <div
        className="relative overflow-hidden rounded-mrd-card bg-mrd-sheet"
        style={{ boxShadow: "var(--mrd-shadow-card)" }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-mrd-line px-2.5 py-1.5">
          <span className="min-w-0 truncate text-[12px] font-medium text-mrd-ink">{title}</span>

          {status === "proposed" ? (
            /*
             * The only `--mrd-you` on the surface. It says the single thing a
             * reader of a proposal needs before reading any of it.
             */
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-mrd-you">
              <span aria-hidden className="size-1.5 rounded-full bg-mrd-you" />
              Waiting on you
            </span>
          ) : (
            <span className="shrink-0 text-[11px] text-mrd-mute">{RESOLVED_NOTE[status]}</span>
          )}
        </div>

        {rows.length === 0 ? (
          /*
           * No header row over an empty body. A table that prints its columns
           * and nothing else reads as a failed load, and this is not one: it is
           * an edit that proposes nothing, which is a legitimate answer.
           */
          <p className="px-2.5 py-4 text-[12px] text-mrd-mute">{emptyLabel}</p>
        ) : (
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              {cols.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-mrd-line">
                {columns.map((h) => (
                  <th
                    key={h}
                    title={h}
                    className="truncate px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap text-mrd-mute"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keptRows.map((row) => {
                const out = row.change === "removed" && marked;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-mrd-line transition-colors duration-[400ms] last:border-0 hover:bg-mrd-hover"
                    style={{ background: out ? WASH.removed : undefined }}
                  >
                    {columns.map((_, i) => {
                      const value = row.cells[i] ?? "";
                      if (i === tagColumn) {
                        return (
                          <td key={i} className="px-2.5 py-1.5 align-top">
                            {value && (
                              <span
                                title={value}
                                className="inline-flex h-5.5 max-w-full items-center rounded-full border border-mrd-line bg-mrd-sink px-2 text-[11px] font-medium text-mrd-body transition-opacity duration-[400ms]"
                                style={{ opacity: out ? 0.55 : 1 }}
                              >
                                {/*
                                 * The pill is a FIXED HEIGHT, so its label can
                                 * never be allowed to wrap: a two-word supplier
                                 * name inside `h-5.5` pushes its second line
                                 * straight out through the bottom of the
                                 * capsule. One line, ellipsed, full value on
                                 * hover and in the accessible name.
                                 */}
                                <span className="min-w-0 truncate">{value}</span>
                              </span>
                            )}
                          </td>
                        );
                      }
                      if (i === 0) {
                        return (
                          <td
                            key={i}
                            title={value}
                            className="px-2.5 py-1.5 align-top text-[13px] font-medium tabular-nums transition-colors duration-[400ms]"
                            style={{
                              color: out ? "var(--mrd-fail)" : "var(--mrd-ink)",
                            }}
                          >
                            <span className={CLAMP}>{value}</span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={i}
                          title={value}
                          className="px-2.5 py-1.5 align-top text-[12px] transition-colors duration-[400ms]"
                          style={{
                            color: out ? "var(--mrd-fail)" : "var(--mrd-body)",
                            textDecorationLine: out ? "line-through" : "none",
                            textDecorationColor:
                              "color-mix(in oklab, var(--mrd-fail) 50%, transparent)",
                          }}
                        >
                          <span className={CLAMP}>{value}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/*
               * The additions live in one full width cell holding a grid that
               * repeats the column widths. A `<tr>` cannot animate its own
               * height, so an added row that grew in place would pop rather
               * than open, and popping is what makes an addition easy to miss.
               */}
              {addedRows.length > 0 && (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-[400ms]"
                      style={{
                        gridTemplateRows: revealed ? "1fr" : "0fr",
                        opacity: revealed ? 1 : 0,
                        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                      }}
                    >
                      <div className="overflow-hidden" style={{ background: WASH.added }}>
                        {addedRows.map((row) => (
                          <div
                            key={row.id}
                            className="grid items-start border-t border-mrd-line"
                            style={{ gridTemplateColumns: grid }}
                          >
                            {/*
                             * `min-w-0` on every one of these, and it is the
                             * defect that hid the longest. These are GRID
                             * items, and a grid item's default `min-width` is
                             * `auto`, which means it refuses to shrink below
                             * its own content. So `truncate` here was inert:
                             * the ellipsis never fired, the track grew past its
                             * percentage instead, and a long added value pushed
                             * the whole added-row block wider than the table it
                             * is supposed to line up with — which is what put
                             * the added columns out of register with the header
                             * above them. The rule is the same one that governs
                             * the source rows in StreamingText.
                             */}
                            {columns.map((_, i) => {
                              const value = row.cells[i] ?? "";
                              if (i === tagColumn) {
                                return (
                                  <span key={i} className="min-w-0 px-2.5 py-1.5">
                                    {value && (
                                      <span
                                        title={value}
                                        className="inline-flex h-5.5 max-w-full items-center rounded-full border border-mrd-line bg-mrd-sheet px-2 text-[11px] font-medium text-mrd-body"
                                      >
                                        <span className="min-w-0 truncate">{value}</span>
                                      </span>
                                    )}
                                  </span>
                                );
                              }
                              return (
                                <span
                                  key={i}
                                  title={value}
                                  className={`min-w-0 px-2.5 py-1.5 text-mrd-pass ${CLAMP} ${
                                    i === 0 ? "text-[13px] font-medium tabular-nums" : "text-[12px]"
                                  }`}
                                >
                                  {value}
                                </span>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DiffTable;
