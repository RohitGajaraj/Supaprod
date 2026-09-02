/**
 * ── A VERDICT: WHAT SOMETHING OTHER THAN THE MAKER CONCLUDED ──────────────
 *
 * One block that says what was checked, what it concluded, and what it found,
 * with every finding citing the line it read. It is the shape of a review, and
 * it is deliberately not the shape of `studio.review`: this file knows nothing
 * about changesets, `code_review`, or which column a verdict arrives in.
 *
 * ── WHY THE SPLIT IS THE WHOLE POINT OF PROMOTING IT ──────────────────────
 * The version this replaces lived in `src/components/track/` and parsed a
 * `Json` column on `studio_changesets` in the same file that drew the block. As
 * one component that was fine. As a Meridian primitive it would be a mistake:
 * the second caller is a design review, a spec check, an eval suite, and none of
 * those has a `code_review` column. So the READING stays in the track layer
 * (`verdict-reading.ts`, which owns the two absences and the tool's own
 * vocabulary) and the DRAWING is here, taking facts.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Cursor's completion screen (Mobbin, 2026-09-02) puts **Runtime evidence I
 * checked** under the answer and has every line cite its terminal line.
 * Cofounder's **Verified** block is the other half, and it is why `compared`
 * renders before the conclusion: a verdict with no denominator is an opinion.
 *
 * ── THE ABSENCE IS A FIRST-CLASS STATE, NOT A FALLBACK ────────────────────
 * Measured where this came from: 0 of 45 changesets carried a review, because
 * the tool that writes them had never run successfully. So the sentence most
 * people meet is the one saying there is no verdict, and a component that
 * treats that as an edge case gets it wrong for the common reader. `absence` is
 * a required prop for exactly that reason: a caller cannot forget to say why.
 */
import { StatusChip } from "@/components/meridian/StatusChip";
import { RunNote } from "@/components/meridian/run-rows";

export type VerdictTone = "pass" | "fail" | "hold";

/** One thing a reviewer found, and where it found it. */
export type VerdictFinding = {
  /** The rank a reader sorts by. Free text: callers name their own severities. */
  severity?: string;
  category?: string;
  /** Where it was found, cited so the claim can be followed back. */
  where?: string | null;
  issue?: string;
  fix?: string | null;
  /** True when a deterministic check produced it rather than a judgment. */
  checked?: boolean;
};

/**
 * ONE THING THAT WAS ASKED FOR, AND WHETHER IT HOLDS.
 *
 * Deliberately not a finding. A finding is something the reviewer NOTICED; a
 * check is something it was TOLD to look for and had to answer. Drawing them in
 * one list would lose that difference, and the difference is the reason this
 * block can be believed: a reviewer cannot quietly pass a requirement by not
 * mentioning it, because every line it was given is printed whether it judged it
 * or not.
 */
export type VerdictCheck = {
  /** What was asked for, in the words of whoever asked. Never paraphrased. */
  line: string;
  held: boolean;
  /** Why it does not hold. Drawn only when it does not. */
  why?: string | null;
};

export function Verdict({
  label,
  tone,
  word,
  compared,
  summary,
  checks = [],
  findings = [],
  clean,
  meta,
  absence,
  max = 25,
}: {
  /** What this block is, in the caller's own words. */
  label: string;
  /** Null means there is no verdict, and `absence` is what gets drawn. */
  tone: VerdictTone | null;
  /** The conclusion, in a word. Required whenever there is a tone. */
  word?: string;
  /** What was compared, said BEFORE what was concluded. Absent when unknown. */
  compared?: string | null;
  summary?: string | null;
  /** What was asked for, line by line. Drawn above the findings; see the type. */
  checks?: readonly VerdictCheck[];
  findings?: readonly VerdictFinding[];
  /** What a clean pass reads as. Without it, silence, which looks undrawn. */
  clean?: string;
  /** Who or what produced it, and when. One quiet line. */
  meta?: string | null;
  /** Why there is no verdict. Required, because the absence is the common case. */
  absence: string;
  /** How many findings to draw before saying how many are left. */
  max?: number;
}) {
  return (
    <div
      data-mrd=""
      className="flex flex-col gap-mrd-2 rounded-mrd-chip bg-mrd-sink p-mrd-4 font-mrd"
    >
      <span className="mrd-eyebrow">{label}</span>

      {tone === null ? (
        /* ONE LINE, AND IT NAMES THE REASON. Not a bordered empty state: this
           block is already a container and the standard caps a region at one. */
        <p className="text-mrd-small text-mrd-mute">{absence}</p>
      ) : (
        <>
          <span className="flex flex-wrap items-center gap-mrd-3">
            <StatusChip status={tone}>{word ?? ""}</StatusChip>
            {compared ? <span className="mrd-meta">{compared}</span> : null}
          </span>

          {summary ? <span className="min-w-0 text-mrd-small text-mrd-mute">{summary}</span> : null}

          {/* WHAT WAS ASKED FOR, BEFORE WHAT WAS NOTICED. The order is the
              argument: the findings are this reader's opinion of the change, and
              the checks are the change measured against somebody else's stated
              requirement. The second outranks the first, so it is read first. */}
          {checks.length > 0 ? (
            <ul className="flex flex-col gap-mrd-2">
              {checks.map((c, i) => (
                <li
                  key={`${c.line}:${i}`}
                  className="flex min-w-0 items-start gap-mrd-2 border-b border-mrd-line-soft pb-mrd-2 last:border-0"
                >
                  <span className="shrink-0 pt-0.5">
                    <StatusChip status={c.held ? "pass" : "hold"}>
                      {c.held ? "holds" : "did not"}
                    </StatusChip>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="min-w-0 text-mrd-small text-mrd-body">{c.line}</span>
                    {/* Only when it did not hold. A reason beside a pass reads as
                        a caveat on it, and there is no caveat to make. */}
                    {!c.held && c.why ? (
                      <span className="min-w-0 text-mrd-small text-mrd-mute">{c.why}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {findings.length === 0 ? (
            /* A CLEAN PASS SAID OUT LOUD. An empty space where findings would be
               is indistinguishable from a block nobody finished drawing. */
            clean ? (
              <p className="text-mrd-small text-mrd-body">{clean}</p>
            ) : null
          ) : (
            <div className="flex flex-col gap-mrd-2">
              {findings.slice(0, max).map((f, i) => (
                <div
                  key={`${f.where ?? "nowhere"}:${i}`}
                  className="flex flex-col gap-0.5 border-b border-mrd-line-soft pb-mrd-2 last:border-0"
                >
                  <span className="text-mrd-small font-medium text-mrd-body">
                    {[
                      f.severity,
                      f.category,
                      f.checked === undefined ? "" : f.checked ? "checked" : "judged",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {f.issue ? <RunNote>{f.issue}</RunNote> : null}
                  {f.fix ? (
                    <span className="text-mrd-small text-mrd-mute">Fix: {f.fix}</span>
                  ) : null}
                  {/* THE LINE IT READ, CITED. A check that cannot be followed
                      back to what it looked at is not evidence. */}
                  {f.where ? (
                    <span className="font-mrd-mono text-mrd-data text-mrd-faint">{f.where}</span>
                  ) : null}
                </div>
              ))}
              {findings.length > max ? (
                <p className="font-mrd-mono text-mrd-small tabular-nums text-mrd-faint">
                  {findings.length - max} further findings not shown here.
                </p>
              ) : null}
            </div>
          )}

          {meta ? <span className="mrd-meta">{meta}</span> : null}
        </>
      )}
    </div>
  );
}

export default Verdict;
