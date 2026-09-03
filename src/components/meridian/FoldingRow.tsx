/**
 * ── A ROW THAT GREW, NOT A TOGGLE THAT FIRED ──────────────────────────────
 *
 * P-37, shape 6. The transcript row showed the seat name, the verdict, the
 * duration, the tokens, a paragraph and a tool-call count **all at one weight**.
 * Six facts with no rank is six facts nobody reads.
 *
 * The verdict leads because it is the only thing a person scanning a transcript
 * is looking for. Everything else answers a question they have not asked yet, so
 * everything else folds.
 *
 * ── WHY THERE IS NO CHEVRON ───────────────────────────────────────────────
 *
 * A chevron is a control reporting its own state, and the row's HEIGHT already
 * reports it. Two indicators of one state is shape 2 of this same packet ("two
 * verbs for one state") in miniature. It is also a 12px target on a tablet,
 * which is the device this defect was found on.
 *
 * ── THE MOTION, AND A REASON PER VALUE ────────────────────────────────────
 *
 *   the lead never moves        it is outside the animated region entirely. If
 *                               the thing you clicked jumps, you clicked the
 *                               wrong thing.
 *   height and opacity          `--mrd-d-move` (140ms) on `--mrd-ease`, which is
 *                               already out-quint. Under 300ms, and the ramp is
 *                               the curve this wants rather than a new one.
 *   the body rises 4px          matter that arrives from nowhere reads as a
 *                               popup; 4px of travel reads as an unfolding.
 *   symmetric close             this is not an exit, it is the same object at
 *                               another size.
 *   grid-template-rows          animating `height` needs a measured pixel value;
 *                               `1fr` to `0fr` animates to content height with
 *                               no measurement and no jump on resize.
 *
 * Under `prefers-reduced-motion` the height still changes, because that is
 * layout rather than decoration, and the rise and the fade are dropped.
 */
import * as React from "react";

export type RowMark = "filed" | "filed-nothing" | "stopped";

/**
 * Three marks and only three (A1, amendment 5). A row either filed something,
 * filed nothing, or was stopped. Anything finer is a taxonomy the reader has to
 * learn before the transcript is legible.
 */
const MARK: Record<RowMark, string> = {
  filed: "✓",
  "filed-nothing": "◦",
  stopped: "⊘",
};

export function FoldingRow({
  mark,
  lead,
  meta,
  children,
}: {
  mark: RowMark;
  /**
   * What leads. For a filed row, what it filed; for an empty one, what it looked
   * for; **for a stopped row, the CONSEQUENCE and not the cause**, because the
   * consequence is what the reader has to act on.
   */
  lead: string;
  /** One line, no tokens. Tokens and cost are an audit fact and live inside. */
  meta?: string | null;
  /** The body: the paragraph, the tool names, the data line. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const hasBody = Boolean(children);

  return (
    <div data-mrd="" className="font-mrd">
      <button
        type="button"
        /* The whole row is the target, not an icon inside it. */
        className="flex w-full items-start gap-mrd-3 rounded-mrd-xs px-mrd-1 py-mrd-2 text-left transition-colors hover:bg-mrd-hover"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={hasBody ? open : undefined}
        disabled={!hasBody}
      >
        <span aria-hidden className="mt-px shrink-0 text-mrd-small text-mrd-mute">
          {MARK[mark]}
        </span>
        {/* OUTSIDE the animated region, deliberately. See the header. */}
        <span className="flex min-w-0 flex-col gap-mrd-1">
          <span className="text-mrd-base text-mrd-ink">{lead}</span>
          {meta ? <span className="text-mrd-data text-mrd-faint">{meta}</span> : null}
        </span>
      </button>

      {hasBody ? (
        <div
          /* `1fr` to `0fr` animates to the content's own height with no
             measurement, so a resize cannot leave a stale pixel value behind. */
          className="grid transition-[grid-template-rows] duration-(--mrd-d-move) ease-(--mrd-ease) motion-reduce:transition-none"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div
              className="flex flex-col gap-mrd-2 px-mrd-1 pb-mrd-3 pl-mrd-6 transition-[opacity,transform] duration-(--mrd-d-move) ease-(--mrd-ease) motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0)" : "translateY(4px)",
              }}
            >
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default FoldingRow;
