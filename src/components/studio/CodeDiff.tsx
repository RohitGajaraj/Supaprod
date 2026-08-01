/**
 * The diff, in a terminal.
 *
 * FOUNDER RULINGS, 2026-08-01, in the order they arrived:
 *   1. "Lift Claude Code's diff view; it must sit inline or side by side with the
 *      file and change with the selection."
 *   2. "I see 1212 twice there ... should we make something different, like how
 *      the other terminal tools are using it?"
 *   3. "too congested and tightly placed."
 *   4. "give a terminal-like interface, meaning the box around the thing, and
 *      showcase it like a terminal, the proper enclosing enclosure."
 *
 * THE REFERENCE, named before building per the standing rule: a terminal window
 * plus a code-review diff. What is lifted is the ANATOMY, which is the same in
 * iTerm, VS Code's diff editor, GitHub's file view and Claude Code:
 *
 *   CHROME   a titled bar naming what you are looking at, with its controls on
 *            the right. The path belongs HERE. It used to sit in a separate row
 *            above the box, which is what made the region read as two things
 *            stacked rather than one instrument, and cost a whole row of height.
 *   BODY     mono, recessed, per-line colour, two-space gutter, scrolls in itself.
 *   STATUS   a footer stating what the body cannot: how many hunks, and what is
 *            being compared against what. Every terminal has one.
 *
 * WHY NOT MONACO, which this replaced. It is a code EDITOR: a tokenizer, a
 * language service and a canvas renderer, shipped to display text nobody can edit
 * (`readOnly: true`), pinned at a fixed 420px so a three-line change sat in an
 * empty pane and a three-hundred-line one scrolled inside the same box. It also
 * carried its own palette and needed a theme bridge to avoid rendering vs-dark
 * inside the light theme. And it computed its OWN diff, so it could disagree with
 * the per-hunk curation underneath it. This renders from `diffRows`, which walks
 * the same alignment the server applies.
 *
 * ON LONG LINES, measured rather than assumed. At 1512px the body had 467px and
 * the longest line needed 748px. Every terminal and editor scrolls horizontally
 * for this and so does the body, but a silent horizontal overflow READS as a
 * clipped line, which is exactly how the founder read it. So: the width is
 * reclaimed where it was being wasted (a 52px gutter meant for a page-level aside,
 * and an over-wide file column), the scrollbar is made visible instead of hidden,
 * and `Wrap` is offered for when you would rather have the whole line than the
 * whole shape. Three answers, because none of them alone is enough.
 */
import { useMemo, useState } from "react";

import { DIFF_CONTEXT_LINES, diffRows, pairDiffRows, type DiffRow } from "@/lib/ai/studio-hunks";

/** Rendered as the sign column and read out by a screen reader, so the meaning
 *  of a row never rests on its colour alone. */
const SIGN: Record<DiffRow["kind"], string> = {
  add: "+",
  del: "\u2212",
  same: " ",
  skipped: "",
};
const SPOKEN: Record<DiffRow["kind"], string> = {
  add: "added",
  del: "removed",
  same: "",
  skipped: "",
};

function Gutter({ n }: { n: number | null }) {
  // aria-hidden: the numbers are navigation for the eye. A screen reader reading
  // "two hundred and eleven" before every line of code is noise, and the sr-only
  // "added"/"removed" carries what matters.
  return (
    <span className="sp-codediff-no" aria-hidden="true">
      {n ?? ""}
    </span>
  );
}

/**
 * ONE NUMBER COLUMN, not two.
 *
 * FOUNDER: "I see 1212 twice there." He was right and the first version was
 * wrong. An unchanged line has the same number in both files, so two gutters
 * rendered "12 12", which reads as one meaningless four-digit number and costs a
 * glance to dismiss on EVERY unchanged row.
 *
 * The reference class is unanimous and none of them show two columns in a unified
 * view: Monaco's inline diff, `delta` and Claude Code show one, plain `git diff`
 * shows none. A removed line numbers the OLD file and everything else numbers the
 * new one; the sign column is what tells you which, so there is no ambiguity left
 * for a second column to solve. Two gutters ARE right in side by side, where each
 * column is a different file, and that is where the pairing view puts them.
 */
function Line({ row }: { row: DiffRow }) {
  if (row.kind === "skipped") return null;
  return (
    <div className="sp-codediff-row" data-kind={row.kind}>
      <Gutter n={row.kind === "del" ? row.baseNo : row.nextNo} />
      <span className="sp-codediff-sign" aria-hidden="true">
        {SIGN[row.kind]}
      </span>
      <span className="sp-codediff-text">
        {SPOKEN[row.kind] ? <span className="sp-sr-only">{SPOKEN[row.kind]}: </span> : null}
        {/* A blank line still needs to occupy a row, and an empty span collapses.
            The space is not content, so it is hidden rather than announced. */}
        {row.text === "" ? <span aria-hidden="true"> </span> : row.text}
      </span>
    </div>
  );
}

/** The gap, stated. Never silently dropped: a reader has to be able to tell a
 *  collapsed region from the end of the file. */
function Gap({ count }: { count: number }) {
  return (
    <div className="sp-codediff-gap">
      {count} unchanged {count === 1 ? "line" : "lines"}
    </div>
  );
}

/** The path, with the filename as the part that survives truncation. */
function ChromePath({ path }: { path: string }) {
  const cut = path.lastIndexOf("/");
  return (
    <span className="sp-codediff-path" title={path}>
      {cut >= 0 ? <span className="sp-codediff-dir">{path.slice(0, cut + 1)}</span> : null}
      <span className="sp-codediff-file">{cut >= 0 ? path.slice(cut + 1) : path}</span>
    </span>
  );
}

export function CodeDiff({
  base,
  next,
  path,
  against = "Base against staged",
  actions,
  /** Off by default: unified is how a diff is read, and two columns halve the
   *  width available to code that is already fighting for it. */
  defaultSideBySide = false,
}: {
  base: string;
  next: string;
  /** Shown as the terminal's title. Omit and the chrome carries only controls. */
  path?: string;
  /** What is being compared with what, for the status line. */
  against?: string;
  /** Controls belonging to the file rather than to the view, e.g. dropping it. */
  actions?: React.ReactNode;
  defaultSideBySide?: boolean;
}) {
  const [sideBySide, setSideBySide] = useState(defaultSideBySide);
  const [showAll, setShowAll] = useState(false);
  const [wrap, setWrap] = useState(false);

  const rows = useMemo(
    () => diffRows(base, next, showAll ? Infinity : DIFF_CONTEXT_LINES),
    [base, next, showAll],
  );
  const paired = useMemo(() => (sideBySide ? pairDiffRows(rows) : []), [rows, sideBySide]);

  const { hidden, added, removed, hunks } = useMemo(() => {
    let hidden = 0;
    let added = 0;
    let removed = 0;
    const ids = new Set<number>();
    for (const r of rows) {
      if (r.kind === "skipped") hidden += r.count;
      else if (r.kind === "add") {
        added++;
        ids.add(r.hunkId);
      } else if (r.kind === "del") {
        removed++;
        ids.add(r.hunkId);
      }
    }
    return { hidden, added, removed, hunks: ids.size };
  }, [rows]);

  const unchangedOnly = rows.length === 0 || rows.every((r) => r.kind === "same");

  return (
    <div className="sp-term">
      {/* CHROME. The title is the file, which is why the separate header row
          above this box is gone: two headers for one thing was the "congested"
          complaint, and it cost a row of height to say the path twice. */}
      <div className="sp-term-bar">
        {path ? <ChromePath path={path} /> : <span className="sp-term-path" />}
        <span className="sp-term-tools">
          {actions}
          {!unchangedOnly ? (
            <>
              {/* A TWO-STATE SEGMENT, not a lone toggle saying "Side by side".
                  Founder: "What is this side-by-side heading? It's not going well."
                  He was right, and the fault was the SHAPE rather than the words: a
                  single button labelled with a mode cannot tell you whether it is
                  describing what you are looking at or what you would get by
                  pressing it. Both readings are plausible and only one is true.
                  Naming both modes with the live one marked removes the question,
                  and it is what GitHub's diff and VS Code both do. */}
              <span className="sp-term-seg" role="group" aria-label="How to lay the diff out">
                {([false, true] as const).map((mode) => (
                  <button
                    key={String(mode)}
                    type="button"
                    className="sp-term-ctl"
                    aria-pressed={sideBySide === mode}
                    onClick={() => setSideBySide(mode)}
                  >
                    {mode ? "Split" : "Inline"}
                  </button>
                ))}
              </span>
              <button
                type="button"
                className="sp-term-ctl"
                aria-pressed={wrap}
                title="Wrap long lines instead of scrolling sideways"
                onClick={() => setWrap((v) => !v)}
              >
                Wrap
              </button>
              {hidden > 0 || showAll ? (
                <button
                  type="button"
                  className="sp-term-ctl"
                  aria-pressed={showAll}
                  onClick={() => setShowAll((v) => !v)}
                  title={
                    showAll
                      ? "Hide the unchanged lines again"
                      : "Show the unchanged lines between the changes"
                  }
                >
                  {showAll ? "Less" : `+${hidden}`}
                </button>
              ) : null}
            </>
          ) : null}
        </span>
      </div>

      {unchangedOnly ? (
        // A staged file can be rewritten back to its base by hunk curation, so
        // this is reachable. Saying so beats an empty box, which reads as a
        // failure to load.
        <div className="sp-term-none">Nothing differs between the base and this version.</div>
      ) : (
        <>
          <div
            className="sp-codediff-body"
            data-side={sideBySide ? "" : undefined}
            data-wrap={wrap ? "" : undefined}
            role="group"
            aria-label={path ? `What changed in ${path}` : "What changed in this file"}
            tabIndex={0}
          >
            {sideBySide
              ? paired.map((p, i) =>
                  p.skipped ? (
                    <Gap key={`g${i}`} count={p.skipped.count} />
                  ) : (
                    <div className="sp-codediff-pair" key={i}>
                      <div className="sp-codediff-side">
                        {p.left ? (
                          <Line row={p.left} />
                        ) : (
                          <div className="sp-codediff-row" data-kind="none" />
                        )}
                      </div>
                      <div className="sp-codediff-side">
                        {p.right ? (
                          <Line row={p.right} />
                        ) : (
                          <div className="sp-codediff-row" data-kind="none" />
                        )}
                      </div>
                    </div>
                  ),
                )
              : rows.map((r, i) =>
                  r.kind === "skipped" ? (
                    <Gap key={`g${i}`} count={r.count} />
                  ) : (
                    <Line key={i} row={r} />
                  ),
                )}
          </div>

          {/* STATUS. What the body cannot say about itself. Every terminal has
              one, and it is where the diffstat belongs: beside the hunk count,
              not repeated in the file list. */}
          <div className="sp-term-status">
            <span className="sp-term-stat">
              {added > 0 ? <b className="sp-pass">+{added}</b> : null}
              {removed > 0 ? <b className="sp-fail">&minus;{removed}</b> : null}
            </span>
            <span>
              {hunks} {hunks === 1 ? "hunk" : "hunks"}
            </span>
            <span className="sp-term-against">{against}</span>
          </div>
        </>
      )}
    </div>
  );
}
