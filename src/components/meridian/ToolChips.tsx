import type { ReactNode } from "react";
import { useState } from "react";

/*
 * TOOL CHIPS, an agent run collapsed into rows you can open one at a time.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Tool Chips"
 *                 (their file: components/ToolChips.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * This is the founder's backlog item 2, almost word for word. On Build, opening
 * a touched file "opens something he cannot locate, with unexplained blank
 * space above it": the detail appears somewhere other than under the thing that
 * was clicked, so the eye has to go hunting for what it just asked for. Here
 * every row opens directly beneath itself, into a rail that starts at the row's
 * own left edge, and nothing else on the surface moves.
 *
 * ── WHAT WE CHANGED, AND WHY ────────────────────────────────────────────
 * Their argument chip and their file chips are `<span>`s wearing `cursor-pointer`
 * and a hover state, with nothing bound to them. That is the exact failure this
 * component was picked to fix, one level down: an affordance that says "click
 * me" and does nothing when clicked. Here the argument chip is plainly inert,
 * it is a value and it reads as one, and a file chip becomes a real button only
 * when a caller passes `onSelectFile`. No handler, no pointer, no hover.
 *
 * The run header withholds the file summary while `working` is true. A count of
 * what changed, taken from a run that has not stopped changing things, is a
 * number that will be wrong by the time it is read.
 *
 * ── COLOUR ──────────────────────────────────────────────────────────────
 * Green and red appear only on line counts, which is the outcome register:
 * they say what happened to a file, never that a person must act. Nothing here
 * asks for a person, so `--mrd-you` appears nowhere. `--mrd-agent` appears only
 * on the shimmer of a run still going.
 */

/*
 * The rows live inside an overflow-hidden clip box whose horizontal padding is
 * spent entirely on the row's own negative margin, so an OUTSET focus ring has
 * nothing left to draw into and comes out shaved. The inset variant is what
 * meridian.css keeps for a control inside a clipping container. The explicit
 * utilities restate what the `[data-mrd]` rule already says, so the treatment
 * holds if this component is dropped on a surface that rule has not reached.
 */
const FOCUS_INSET =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

/** What the call was. Four kinds, because a fifth glyph nobody can name is noise. */
export type ToolKind = "think" | "write" | "run" | "read";

const ICONS: Record<ToolKind, ReactNode> = {
  think: <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />,
  write: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </g>
  ),
  run: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 17l6-5-6-5M12 19h8" />
    </g>
  ),
  read: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </g>
  ),
};

export type ToolDetailLine = {
  text: string;
  /** Marks the line as something the run added. Outcome register only. */
  tone?: "add";
};

export type ToolChipRow = {
  /** Stable across renders. Two rows can share a label, so this is not it. */
  id: string;
  kind: ToolKind;
  label: string;
  /** The argument: a filename, a command, a one line summary. Inert by design. */
  argument?: string;
  /** Render the argument in mono. True for anything a machine would type. */
  mono?: boolean;
  detail?: ToolDetailLine[];
  detailMono?: boolean;
};

export type ToolChipDiff = { file: string; add?: number; del?: number };

/*
 * The header counts what is actually in `rows`. Their version prints the string
 * "4 tool calls, 2 messages" whatever it was handed, which is fine in a demo
 * with four rows and a lie anywhere else.
 */
function runSummary(rowCount: number, messageCount?: number, working?: boolean) {
  if (rowCount === 0) return working ? "No tool calls yet" : "No tool calls";
  const parts = [rowCount === 1 ? "1 tool call" : `${rowCount} tool calls`];
  if (messageCount !== undefined) {
    parts.push(messageCount === 1 ? "1 message" : `${messageCount} messages`);
  }
  return parts.join(", ");
}

export function ToolChips({
  rows,
  diffs = [],
  messageCount,
  working = false,
  moreCount = 0,
  defaultOpen = true,
  onSelectFile,
  onShowMore,
}: {
  /** What the agent called, in order. Empty is a first class case. */
  rows: ToolChipRow[];
  /** Files the run touched. Withheld entirely while `working`. */
  diffs?: ToolChipDiff[];
  messageCount?: number;
  working?: boolean;
  /** Files touched beyond the ones listed. */
  moreCount?: number;
  defaultOpen?: boolean;
  /** Omit and the file chips render as plain values, with no pointer. */
  onSelectFile?: (diff: ToolChipDiff) => void;
  onShowMore?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [openRows, setOpenRows] = useState<Set<string>>(() => new Set());

  const toggleRow = (id: string) =>
    setOpenRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const showDiffs = !working && diffs.length > 0;

  return (
    /*
     * The 220px floor is the reference's and it earns its place here for a
     * reason the reference never had to state: this block GROWS THREE TIMES
     * while a run goes — rows arrive one at a time, a row opens into its
     * detail, and the file summary lands at the end. Without a floor every one
     * of those pushes the page down under the reader's eye. Reserving the tall
     * case means the run fills space that was already there.
     */
    <div data-mrd="" className="min-h-[220px] w-full max-w-80 pb-1 font-mrd">
      {/* The run header, which is also the only control that hides everything. */}
      <button
        type="button"
        aria-expanded={open}
        aria-live="polite"
        onClick={() => setOpen((current) => !current)}
        className="-mx-1.5 flex w-fit items-center gap-1.5 rounded-mrd-ctl px-1.5 py-1 text-[12.5px] text-mrd-body transition-colors duration-100 hover:bg-mrd-hover"
      >
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>

        {working ? (
          /*
           * A run still going says so in the header, because the header is the
           * only part of this component that survives being collapsed. A static
           * count on a live run is the state the audit found everywhere: it
           * reads finished, and there is no way to tell that it is not.
           */
          <span
            className="bg-clip-text tabular-nums text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--mrd-mute) 35%, var(--mrd-ink) 50%, var(--mrd-mute) 65%)",
              backgroundSize: "200% 100%",
              animation: "mrd-shimmer 1.4s linear infinite",
            }}
          >
            {runSummary(rows.length, messageCount, true)}
          </span>
        ) : (
          <span className="tabular-nums">{runSummary(rows.length, messageCount, false)}</span>
        )}
      </button>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/*
         * The negative margin plus the larger padding keeps the content on the
         * same x while giving the row hover pills room to breathe inside this
         * overflow-hidden clip box. Remove either half and the pills get their
         * left edge shaved off.
         */}
        <div className="-mx-1 overflow-hidden px-1.5 pb-1">
          {rows.length === 0 ? (
            <p className="mt-1.5 px-[3px] text-[12.5px] text-mrd-mute">
              {working ? "Nothing called yet." : "This run called no tools."}
            </p>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1">
              {rows.map((row) => {
                const rowOpen = openRows.has(row.id);
                const hasDetail = Boolean(row.detail?.length);
                return (
                  <div
                    key={row.id}
                    style={{
                      animation: "mrd-fade-up 300ms cubic-bezier(0.23,1,0.32,1) both",
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={rowOpen}
                      disabled={!hasDetail}
                      onClick={() => toggleRow(row.id)}
                      className={`group/row ${FOCUS_INSET} -mx-[3px] flex h-7 w-[calc(100%+6px)] min-w-0 items-center gap-2 rounded-mrd-ctl px-[3px] text-left transition-colors duration-100 enabled:hover:bg-mrd-hover disabled:cursor-default`}
                    >
                      {/*
                       * The glyph swaps for a chevron on hover, in place, so
                       * the row never changes width and the label beside it
                       * never shifts. A row that reflows under the pointer is
                       * a row that is hard to click.
                       */}
                      <span className="relative flex size-4 shrink-0 items-center justify-center text-mrd-mute">
                        <svg
                          aria-hidden
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill={row.kind === "think" ? "currentColor" : "none"}
                          stroke="currentColor"
                          className={`transition-opacity duration-100 ${
                            hasDetail ? "group-hover/row:opacity-0" : ""
                          } ${rowOpen ? "opacity-0" : ""}`}
                        >
                          {ICONS[row.kind]}
                        </svg>
                        {hasDetail && (
                          <svg
                            aria-hidden
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`absolute transition-[opacity,transform] duration-150 group-hover/row:opacity-100 ${
                              rowOpen ? "opacity-100" : "opacity-0"
                            }`}
                            style={{
                              transform: rowOpen ? "rotate(0deg)" : "rotate(-90deg)",
                            }}
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        )}
                      </span>

                      {/*
                       * 12.5 for the call, 11.5 for its argument. The half
                       * stops are the reference's own pairing and they are what
                       * let an argument chip sit beside a label without either
                       * winning; rounding both to whole pixels closes the gap
                       * and the row reads as one undifferentiated string.
                       */}
                      <span className="shrink-0 text-[12.5px] font-medium text-mrd-ink">
                        {row.label}
                      </span>

                      {row.argument && (
                        /*
                         * A value, not a control. See the header note: this is
                         * the span that used to claim to be clickable.
                         */
                        <span
                          className={`inline-flex h-5.5 min-w-0 flex-1 items-center truncate rounded-mrd-chip border border-mrd-line bg-mrd-sink px-1.5 text-[11.5px] text-mrd-body ${
                            row.mono ? "font-mrd-mono" : ""
                          }`}
                        >
                          {row.argument}
                        </span>
                      )}
                    </button>

                    {hasDetail && (
                      <div
                        className="grid transition-[grid-template-rows,opacity] duration-300"
                        style={{
                          gridTemplateRows: rowOpen ? "1fr" : "0fr",
                          opacity: rowOpen ? 1 : 0,
                          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                        }}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="mt-0.5 mb-1 ml-2 flex flex-col gap-0.5 border-l border-mrd-line py-0.5 pl-3.5">
                            {row.detail?.map((line, i) => (
                              <span
                                key={`${i}-${line.text}`}
                                className={`truncate text-[11.5px] leading-[1.6] ${
                                  row.detailMono ? "font-mrd-mono" : ""
                                } ${line.tone === "add" ? "text-mrd-pass" : "text-mrd-body"}`}
                              >
                                {line.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showDiffs && (
            <div className="mt-2.5 flex max-w-full flex-wrap gap-1.5 border-t border-mrd-line pt-2.5">
              {diffs.map((d, i) => {
                const face = (
                  <>
                    <span className="min-w-0 truncate">{d.file}</span>
                    {d.add !== undefined && d.add > 0 && (
                      <span className="shrink-0 tabular-nums text-mrd-pass">+{d.add}</span>
                    )}
                    {d.del !== undefined && d.del > 0 && (
                      <span className="shrink-0 tabular-nums text-mrd-fail">-{d.del}</span>
                    )}
                  </>
                );
                const chipClass =
                  "inline-flex h-7 max-w-full items-center gap-1.5 rounded-mrd-chip bg-mrd-lift px-2 font-mrd-mono text-[11.5px] text-mrd-ink";
                /*
                 * These POP in rather than rise. The distinction is the one
                 * meridian.css draws between its two entrances: a row joining a
                 * list it already belongs to rises, and something that was not
                 * there a moment ago scales up from 98. A file summary is the
                 * second kind — it appears only once the run has stopped, it is
                 * a new object rather than another row, and the reference marks
                 * it the same way.
                 */
                const enter = {
                  animation: `mrd-pop-in 250ms cubic-bezier(0.23,1,0.32,1) ${i * 80}ms both`,
                  boxShadow: "var(--mrd-shadow-card)",
                };

                if (!onSelectFile) {
                  return (
                    <span key={d.file} className={chipClass} style={enter}>
                      {face}
                    </span>
                  );
                }
                return (
                  <button
                    key={d.file}
                    type="button"
                    onClick={() => onSelectFile(d)}
                    className={`${chipClass} cursor-pointer transition-colors duration-100 hover:bg-mrd-lift-hover`}
                    style={enter}
                  >
                    {face}
                  </button>
                );
              })}

              {moreCount > 0 &&
                (onShowMore ? (
                  <button
                    type="button"
                    onClick={onShowMore}
                    className="inline-flex h-7 items-center rounded-mrd-chip px-1.5 font-mrd-mono text-[11.5px] text-mrd-mute underline decoration-transparent underline-offset-2 transition-colors duration-100 hover:text-mrd-body hover:decoration-current"
                    style={{
                      animation: `mrd-fade-in 300ms ease-out ${diffs.length * 80}ms both`,
                    }}
                  >
                    +{moreCount} more
                  </button>
                ) : (
                  <span
                    className="inline-flex h-7 items-center px-1.5 font-mrd-mono text-[11.5px] text-mrd-mute"
                    style={{
                      animation: `mrd-fade-in 300ms ease-out ${diffs.length * 80}ms both`,
                    }}
                  >
                    +{moreCount} more
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ToolChips;
