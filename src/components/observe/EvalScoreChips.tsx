// Trace replay eval scores as verdicts (IA 2026-07-11): every eval score
// renders as a pass / watch / fail word with the raw number kept as a quiet
// mono tail, so a PM reads the judgment and an engineer still sees the figure.
// Thresholds reuse the eval-health verdict cutoffs (the single quality truth,
// src/lib/evals/health.ts): 0.9 and above passes, 0.7 and above is watch, below
// fails. Risk-shaped metrics (hallucination, toxicity, PII risk) score LOW when
// good, so their goodness inverts before the same cutoffs apply. Pure
// presentation: numbers are real or absent, never fabricated (a null score
// renders nothing).
//
// NOTE for whoever reads this next: only `evalScoreVerdict` is mounted today.
// /traces/$traceId imports the function and draws its own cells; the
// `EvalScoreChips` component below has no call site. It is ported rather than
// deleted because the pure function and the shape it implies belong together,
// and because deleting it is a scope call, not a styling one.
import * as React from "react";
import { Num } from "@/components/meridian/surface-parts";
import { Cell } from "@/components/shell/primitives";

export type ScoreVerdict = "pass" | "watch" | "fail";

// The eval-health cutoffs (src/lib/evals/health.ts computeEvalHealth):
// healthy at >= 0.9, watch at >= 0.7, at-risk below.
const PASS_AT = 0.9;
const WATCH_AT = 0.7;

export function evalScoreVerdict(value: number, higherIsBetter: boolean): ScoreVerdict {
  const goodness = higherIsBetter ? value : 1 - value;
  if (goodness >= PASS_AT) return "pass";
  if (goodness >= WATCH_AT) return "watch";
  return "fail";
}

// The three outcome colours, and only those three. A verdict IS an outcome, so
// this is the one case where colour carries the fact rather than dressing it.
const VERDICT_INK: Record<ScoreVerdict, string> = {
  pass: "var(--mrd-pass)",
  watch: "var(--sp-warn)",
  fail: "var(--mrd-fail)",
};

export interface EvalScore {
  label: string;
  value: number | null;
  /** false for risk-shaped metrics where a LOW score is the good outcome. */
  higherIsBetter: boolean;
}

/**
 * The eval-score strip for a selected trace span.
 *
 * Ported off the retired system (2026-07-29). It was a run of bordered chips,
 * each carrying a mono uppercase caps label over a second bordered chip: a card
 * inside a card, and a label wearing mono, which is reserved for data. Each
 * metric is now one `Cell`, tinted and never bordered, with the verdict as a
 * WORD in its outcome colour and the figure beside it in mono. Renders nothing
 * when every score is absent, and never renders a zero for a missing score.
 */
export function EvalScoreChips({ scores }: { scores: EvalScore[] }) {
  const present = scores.filter(
    (s): s is EvalScore & { value: number } => s.value != null && Number.isFinite(s.value),
  );
  if (present.length === 0) return null;
  return (
    // An eval metric is two short words, so the catalog's 196px cell floor
    // would leave half of every cell empty. The floor is the primitive's own
    // knob, set here rather than worked around.
    <div className="sp-grid" style={{ "--sp-cell-min": "132px" } as React.CSSProperties}>
      {present.map((s) => {
        const verdict = evalScoreVerdict(s.value, s.higherIsBetter);
        return (
          <Cell
            key={s.label}
            tone="recessed"
            lead={
              <>
                <span style={{ color: VERDICT_INK[verdict] }}>{verdict}</span>{" "}
                <Num>{s.value.toFixed(2)}</Num>
              </>
            }
            sub={s.label}
            title={`${s.label}: ${verdict}, score ${s.value.toFixed(2)}`}
          />
        );
      })}
    </div>
  );
}
