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
 *
 * ══════════════════════════════════════════════════════════════════════════
 * PORTED TO MERIDIAN, 2026-08-18. THE COMPONENT WAS ALREADY CLEAN; THE PAINT
 * WAS THE WHOLE OF THE DEBT.
 *
 * This file scored zero on the ratchet's component count and was entirely drawn
 * by `src/styles/primitives.css` — 29 `.sp-term*` / `.sp-codediff-*` class names
 * pointing at ~250 lines of the retired Cadence/ink stylesheet. That is the
 * exact hole the ratchet closed on 2026-08-18 when it started reading
 * stylesheets and counting retired CLASS NAMES: "a port that swaps `Block` for
 * `Region` in every file and leaves `.sp-term` and `.sp-codediff-*` behind moves
 * the debt rather than clearing it — and every gate reports green the whole way".
 *
 * ── WHY NOT `meridian/DiffTable`, AND WHY NOT `CodeBlock` ────────────────
 * Meridian has no code-diff viewer. `DiffTable` is not one and does not pretend
 * to be: it is a RECORD-EDIT table with columns, cells, added/removed rows and a
 * "Waiting on you" state — the shape for "this field changed from X to Y", not
 * for a unified diff with a gutter, a sign column, hunks and a wrap toggle.
 * `CodeBlock` is the other near miss and is refused on the same grounds three
 * agents found independently: it needs a `filename` this payload has, but it
 * takes `lines: CodeToken[][]` rather than text, and it caps a height, which
 * would put a scroll trap back inside the page's own scroller — the precise bug
 * the note on the body below records fixing.
 *
 * ── WHY A COMPONENT-LOCAL STYLESHEET AND NOT UTILITY CLASSES ────────────
 * Four of the mechanics here cannot be written as Tailwind utilities without
 * losing something, and every one of them is load bearing:
 *
 *   · TWO CONTAINER QUERIES. `.cd-term` is a container, and both the pair
 *     collapse and the file-list stacking key off the width of THIS BOX rather
 *     than the viewport's. Written as a media query it was visibly wrong the
 *     moment the diff moved into a right-hand pane: at 1512px the query never
 *     fires while the pane is 467px, so two code columns would be ~230px each.
 *   · THE VISIBLE SCROLLBAR. `scrollbar-color` plus the `::-webkit-scrollbar`
 *     pair. A silently overflowing line reads as a CLIPPED line, which is
 *     exactly how the founder read it.
 *   · THE EDGE BAR as an inset shadow, so an unchanged row needs no matching
 *     transparent border and the text never shifts by 2px between kinds.
 *   · `white-space: pre` flipping to `pre-wrap` under `[data-wrap]`.
 *
 * The precedent is `runs/RunBoard.tsx`, which does the same thing for the same
 * reason: a prefixed local sheet, every value a `--mrd-*` token, hoisted once by
 * React's `<style href precedence>` however many diffs are on the page.
 *
 * ── THE SYNTAX PALETTE IS DELIBERATELY NOT USED ─────────────────────────
 * Meridian ships `--mrd-code-kw`, `-fn`, `-str`, `-num`, `-type`, `-var`,
 * `-punc` and `-comment`. THIS COMPONENT HAS NO TOKENIZER: it renders the raw
 * text of a line. Painting a whole line `--mrd-code-var` would claim a
 * highlighting that is not happening, and it would also be a step DOWN in
 * contrast from `--mrd-ink` on the changed rows, which the ratchet law forbids.
 * When a tokenizer lands, the palette is what it reaches for and the hooks are
 * `.cd-text`'s children; until then the diff's colour is add/remove and nothing
 * else, which is the one place in this system colour needs no legend.
 *
 * Everything else is a name change and the geometry does not move: every stop
 * below is the value `ink.css` was aliasing to Meridian already, and the four
 * places where Meridian's ramp has no exact stop (12px and 13.5px, 1.55 leading,
 * the 3.4em gutter) are written as literals for the reason `Prose.tsx` gives —
 * rounding a measured value to make a port tidier makes the surface worse, and
 * that is the one thing a port may not do.
 */
import { useMemo, useState } from "react";

import { DIFF_CONTEXT_LINES, diffRows, pairDiffRows, type DiffRow } from "@/lib/ai/studio-hunks";

/**
 * The terminal's own paint, in Meridian tokens.
 *
 * Hoisted once by React regardless of how many diffs mount, because `href` is
 * the dedupe key and `precedence` puts it in the right place in the cascade.
 */
const TERM_CSS = `
/* THE ONE BORDERED CONTAINER IN ITS REGION, which is what the no-cards rule
 * actually asks for. Chrome on top, body in the middle, status underneath: the
 * anatomy every terminal and diff viewer shares. */
.cd-term {
  margin-top: 12px;
  border: 1px solid var(--mrd-line);
  border-radius: var(--mrd-r-card);
  background: var(--mrd-sink);
  overflow: hidden;
  /* A CONTAINER QUERY CONTEXT, and a correctness fix rather than a flourish.
   * What decides whether two columns fit is the width of THIS box, not the
   * window's. */
  container-type: inline-size;
}
/* Where a caller stacks the terminal directly under something of its own, the
 * leading margin is the caller's to own. */
.cd-flush { margin-top: 0; }

.cd-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 10px 7px 12px;
  border-bottom: 1px solid var(--mrd-line-soft);
  background: var(--mrd-lift);
  min-width: 0;
}
/* The title. Mono, because it is a path, and truncating from the directory end
 * so the filename is never the part that disappears. */
.cd-path {
  display: flex;
  align-items: baseline;
  min-width: 0;
  flex: 1;
  font-family: var(--mrd-mono);
  font-size: 12px;
}
/* Same shrink order as the file list: the directory yields, the filename is the
 * last thing to lose characters. */
.cd-dir {
  min-width: 0;
  flex: 0 1 auto;
  flex-shrink: 999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--mrd-mute);
}
.cd-file {
  min-width: 0;
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--mrd-ink);
}
.cd-tools {
  flex: none;
  display: flex;
  align-items: center;
  gap: 2px;
}
/* A CHROME CONTROL, NOT AN \`Action\`. Meridian's control shape is a 32px-high
 * button with its own padding and press scale, which is right for a control a
 * surface is ASKING you to press. These sit inside a 34px title bar and switch
 * how you are reading; at the house control size the bar would be half as tall
 * again as the code it labels. Same reasoning MoreMenu gives for its 26px
 * trigger. */
.cd-ctl {
  font: inherit;
  font-size: 13px;
  color: var(--mrd-mute);
  background: none;
  border: 0;
  padding: 3px 8px;
  border-radius: var(--mrd-r-chip);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--mrd-d-press) var(--mrd-ease),
    color var(--mrd-d-press) var(--mrd-ease);
}
.cd-ctl:hover:enabled { background: var(--mrd-hover); color: var(--mrd-ink); }
.cd-ctl:disabled { cursor: default; opacity: 0.45; }
/* THE LIVE MODE IS \`--mrd-select\`, NEVER \`--mrd-hover\`. meridian.css names
 * using a hover wash as a selected state as a recurring bug in this codebase:
 * hover is a 4.5% whisper designed to be barely perceptible under a pointer,
 * and the selected mode has to be unmistakable because everything below is
 * about exactly that choice. The ink step and the hairline make it survive a
 * greyscale test rather than depending on the tint alone. */
.cd-ctl[aria-pressed="true"] {
  background: var(--mrd-select);
  color: var(--mrd-ink);
  box-shadow: inset 0 0 0 1px var(--mrd-line);
}
/* The layout segment: both modes named, the live one marked. A hairline round
 * the pair is what makes them read as one control with two states rather than
 * as two unrelated buttons that happen to sit together. */
.cd-seg {
  display: inline-flex;
  align-items: center;
  padding: 1px;
  border-radius: var(--mrd-r-chip);
  box-shadow: inset 0 0 0 1px var(--mrd-line-soft);
}
.cd-seg .cd-ctl[aria-pressed="true"] {
  background: var(--mrd-select);
  box-shadow: none;
}

/* The status line: what the body cannot say about itself. */
.cd-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-top: 1px solid var(--mrd-line-soft);
  background: var(--mrd-lift);
  font-family: var(--mrd-mono);
  font-size: var(--mrd-t-data);
  color: var(--mrd-mute);
}
.cd-stat {
  display: inline-flex;
  gap: 6px;
  font-weight: var(--mrd-w-medium);
}
/* Green and red are OUTCOMES here, which is the only thing they are allowed to
 * be in this system, and a diffstat is the one place that needs no legend. */
.cd-stat .cd-add { color: var(--mrd-pass); }
.cd-stat .cd-del { color: var(--mrd-fail); }
.cd-against { margin-left: auto; }

.cd-none {
  padding: var(--mrd-s5) 14px;
  font-family: var(--mrd-font);
  font-size: 13.5px;
  color: var(--mrd-mute);
}

.cd-body {
  /* HORIZONTAL ONLY. It used to be \`overflow: auto\` with \`max-height: 60vh\`,
   * which made this a vertical scroll container nested inside the page's own
   * scroller, and that is what made the page feel stuck: the wheel scrolled the
   * diff and the page stayed where it was.
   *
   * A diff is now as tall as it is and the page carries it, which is what
   * GitHub's files-changed view does and why that view never traps a scroll.
   * The collapsed context is what keeps the height sane in the first place.
   *
   * Sideways still scrolls here, because a long line has nowhere else to go. */
  overflow-x: auto;
  overflow-y: hidden;
  padding: 6px 0;
  font-family: var(--mrd-mono);
  font-size: 12px;
  line-height: 1.55;
  /* A VISIBLE SCROLLBAR, deliberately. A silently overflowing line reads as a
   * CLIPPED line, which is exactly how the founder read it, and a hidden
   * scrollbar removes the only cue that there is more to the right. Slim enough
   * not to be furniture. */
  scrollbar-width: thin;
  scrollbar-color: var(--mrd-line) transparent;
}
.cd-body::-webkit-scrollbar { height: 9px; width: 9px; }
.cd-body::-webkit-scrollbar-thumb {
  background: var(--mrd-line);
  border-radius: 999px;
}
.cd-body:focus-visible { outline: none; }
/* WRAP, the third answer to a long line. Scrolling keeps the shape of the code
 * and costs you the end of the line; wrapping keeps the whole line and costs
 * you the shape. Which one is right depends on what you are reading, so it is a
 * control rather than a decision made on the reader's behalf. */
.cd-body[data-wrap] .cd-row { white-space: pre-wrap; }
.cd-body[data-wrap] .cd-text { overflow-wrap: anywhere; }

.cd-row {
  display: flex;
  align-items: baseline;
  /* \`pre\` and not \`pre-wrap\`: code is indentation-significant and a wrapped
   * line makes a diff unreadable. It scrolls sideways inside this box, which is
   * the one place that is the right trade. */
  white-space: pre;
  min-height: 1.55em;
}
/* THE EDGE BAR, and it does real work rather than decorating.
 *
 * No icon: Claude Code, GitHub, git and delta all use a bare plus and minus,
 * which is narrower, needs no learning and is already what a developer's eye
 * looks for. What that reference class DOES have is a coloured edge, which is
 * what makes a changed region findable in peripheral vision while scrolling
 * past. A background tint alone is too low-contrast to catch the eye at speed.
 *
 * An inset shadow rather than a border-left, so an unchanged row needs no
 * matching transparent border and the text never shifts by 2px between kinds. */
.cd-row[data-kind="add"] {
  background: color-mix(in oklab, var(--mrd-pass) 13%, transparent);
  box-shadow: inset 2px 0 0 var(--mrd-pass);
}
.cd-row[data-kind="del"] {
  background: color-mix(in oklab, var(--mrd-fail) 13%, transparent);
  box-shadow: inset 2px 0 0 var(--mrd-fail);
}
/* The empty half of a lopsided side-by-side pair. Recessed, so it reads as
 * "nothing here" rather than as a blank line of code. */
.cd-row[data-kind="none"] {
  background: color-mix(in oklab, var(--mrd-mute) 7%, transparent);
}
/* ONE gutter, not two. See the note on \`Line\` below: an unchanged line has the
 * same number in both files, so two columns rendered "12 12" and cost a glance
 * to dismiss on every unchanged row. Padded left to clear the edge bar. */
.cd-no {
  flex: none;
  width: 3.4em;
  padding-left: 8px;
  padding-right: 10px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--mrd-mute);
  opacity: 0.65;
  user-select: none;
}
.cd-sign {
  flex: none;
  width: 1.2em;
  text-align: center;
  user-select: none;
}
.cd-row[data-kind="add"] .cd-sign { color: var(--mrd-pass); }
.cd-row[data-kind="del"] .cd-sign { color: var(--mrd-fail); }
.cd-text {
  color: var(--mrd-body);
  padding-right: 14px;
}
.cd-row[data-kind="add"] .cd-text,
.cd-row[data-kind="del"] .cd-text {
  color: var(--mrd-ink);
}
/* The collapsed run, stated. A reader must be able to tell a gap from the end
 * of the file, so it is never silently dropped. Aligned to where the code
 * starts, so it reads as part of the listing rather than as a banner across it. */
.cd-gap {
  padding: 4px 0 4px calc(3.4em + 1.2em + 18px);
  font-size: var(--mrd-t-data);
  color: var(--mrd-mute);
  background: color-mix(in oklab, var(--mrd-mute) 5%, transparent);
  border-top: 1px solid var(--mrd-line-soft);
  border-bottom: 1px solid var(--mrd-line-soft);
  user-select: none;
}

/* Side by side. Two independent columns over the SAME rows, so the layout is a
 * choice about reading and never a second opinion about what changed. */
.cd-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.cd-side {
  min-width: 0;
  overflow-x: auto;
}
.cd-side + .cd-side { border-left: 1px solid var(--mrd-line-soft); }
/* Below this the two columns are narrower than a usable line of code, so the
 * grid collapses to one whatever the toggle says. A CONTAINER query, not a
 * media query: what decides whether two columns fit is the width of the diff
 * box, which is a right-hand pane rather than the page. */
@container (max-width: 720px) {
  .cd-pair { grid-template-columns: 1fr; }
  .cd-side + .cd-side {
    border-left: 0;
    border-top: 1px solid var(--mrd-line-soft);
  }
}
`;

/**
 * The terminal's stylesheet, mounted once.
 *
 * Exported so the panels that draw a terminal WITHOUT a diff in it — a failed
 * read, a rendered markdown document — get the same box rather than a second
 * one that drifts from this. `href` is React's dedupe key, so mounting it four
 * times on one page still emits one `<style>`.
 */
function TermStyle() {
  return (
    <style href="mrd-code-diff" precedence="medium">
      {TERM_CSS}
    </style>
  );
}

/** The terminal box, with its own paint attached. See `TermStyle`. */
function TermFrame({
  children,
  flush = false,
}: {
  children: React.ReactNode;
  /** Drop the leading margin, for a caller that already spaced it. */
  flush?: boolean;
}) {
  return (
    <div className={flush ? "cd-term cd-flush" : "cd-term"}>
      <TermStyle />
      {children}
    </div>
  );
}

/** A control in the terminal's chrome. See `.cd-ctl` for why it is not an
 *  `Action`. Exported because the file-level acts (dropping a file) belong to
 *  the caller and must sit in this bar wearing this size. */
export const TERM_CONTROL = "cd-ctl";

/** Rendered as the sign column and read out by a screen reader, so the meaning
 *  of a row never rests on its colour alone. */
const SIGN: Record<DiffRow["kind"], string> = {
  add: "+",
  del: "−",
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
    <span className="cd-no" aria-hidden="true">
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
    <div className="cd-row" data-kind={row.kind}>
      <Gutter n={row.kind === "del" ? row.baseNo : row.nextNo} />
      <span className="cd-sign" aria-hidden="true">
        {SIGN[row.kind]}
      </span>
      <span className="cd-text">
        {/* `sr-only` is Tailwind's own, and it replaces `.sp-sr-only` from the
            retired sheet. The two render the same clipped 1px box; this one is
            not a class the product has to keep declaring. */}
        {SPOKEN[row.kind] ? <span className="sr-only">{SPOKEN[row.kind]}: </span> : null}
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
    <div className="cd-gap">
      {count} unchanged {count === 1 ? "line" : "lines"}
    </div>
  );
}

/** The path, with the filename as the part that survives truncation. */
function ChromePath({ path }: { path: string }) {
  const cut = path.lastIndexOf("/");
  return (
    <span className="cd-path" title={path}>
      {cut >= 0 ? <span className="cd-dir">{path.slice(0, cut + 1)}</span> : null}
      <span className="cd-file">{cut >= 0 ? path.slice(cut + 1) : path}</span>
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
  /** Controls belonging to the file rather than to the view, e.g. dropping it.
   *  They sit in the chrome, so they wear `TERM_CONTROL`. */
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
    <TermFrame>
      {/* CHROME. The title is the file, which is why the separate header row
          above this box is gone: two headers for one thing was the "congested"
          complaint, and it cost a row of height to say the path twice. */}
      <div className="cd-bar">
        {path ? <ChromePath path={path} /> : <span className="cd-path" />}
        <span className="cd-tools">
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
              <span className="cd-seg" role="group" aria-label="How to lay the diff out">
                {([false, true] as const).map((mode) => (
                  <button
                    key={String(mode)}
                    type="button"
                    className="cd-ctl"
                    aria-pressed={sideBySide === mode}
                    onClick={() => setSideBySide(mode)}
                  >
                    {mode ? "Split" : "Inline"}
                  </button>
                ))}
              </span>
              <button
                type="button"
                className="cd-ctl"
                aria-pressed={wrap}
                title="Wrap long lines instead of scrolling sideways"
                onClick={() => setWrap((v) => !v)}
              >
                Wrap
              </button>
              {hidden > 0 || showAll ? (
                <button
                  type="button"
                  className="cd-ctl"
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
        <div className="cd-none">Nothing differs between the base and this version.</div>
      ) : (
        <>
          <div
            className="cd-body"
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
                    <div className="cd-pair" key={i}>
                      <div className="cd-side">
                        {p.left ? (
                          <Line row={p.left} />
                        ) : (
                          <div className="cd-row" data-kind="none" />
                        )}
                      </div>
                      <div className="cd-side">
                        {p.right ? (
                          <Line row={p.right} />
                        ) : (
                          <div className="cd-row" data-kind="none" />
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
          <div className="cd-status">
            <span className="cd-stat">
              {added > 0 ? <b className="cd-add">+{added}</b> : null}
              {removed > 0 ? <b className="cd-del">&minus;{removed}</b> : null}
            </span>
            <span>
              {hunks} {hunks === 1 ? "hunk" : "hunks"}
            </span>
            <span className="cd-against">{against}</span>
          </div>
        </>
      )}
    </TermFrame>
  );
}
