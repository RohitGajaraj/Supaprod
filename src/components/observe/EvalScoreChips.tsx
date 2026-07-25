// Trace replay eval scores as verdicts (IA 2026-07-11): every eval score
// renders as a pass / watch / fail VerdictChip with the raw number kept as a
// quiet mono tail, so a PM reads the judgment and an engineer still sees the
// figure. Thresholds reuse the eval-health verdict cutoffs (the single
// quality truth, src/lib/evals/health.ts): 0.9 and above passes, 0.7 and
// above is watch, below fails. Risk-shaped metrics (hallucination, toxicity,
// PII risk) score LOW when good, so their goodness inverts before the same
// cutoffs apply. Pure presentation: numbers are real or absent, never
// fabricated (a null score renders nothing).
import { VerdictChip, type VerdictTone } from "@/components/obsidian";

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

// Hue mapping rides the existing VerdictChip roles: moss for pass, marigold
// for watch, madder for fail. Status color on status only.
const CHIP_TONE: Record<ScoreVerdict, VerdictTone> = {
  pass: "VALIDATED",
  watch: "WATCH",
  fail: "MISSED",
};

export interface EvalScore {
  label: string;
  value: number | null;
  /** false for risk-shaped metrics where a LOW score is the good outcome. */
  higherIsBetter: boolean;
}

/**
 * The eval-score strip for a selected trace span. Static (non-interactive)
 * cells; both themes resolve from the same role tokens via VerdictChip and
 * the text ramp. Renders nothing when every score is absent.
 */
export function EvalScoreChips({ scores }: { scores: EvalScore[] }) {
  const present = scores.filter(
    (s): s is EvalScore & { value: number } => s.value != null && Number.isFinite(s.value),
  );
  if (present.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {present.map((s) => {
        const verdict = evalScoreVerdict(s.value, s.higherIsBetter);
        return (
          <div
            key={s.label}
            // One readable unit per metric for assistive tech; the visible
            // chip + tail carry the same words.
            role="group"
            aria-label={`${s.label}: ${verdict}, score ${s.value.toFixed(2)}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              minWidth: 96,
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              padding: "7px 10px",
            }}
          >
            <span
              className="uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.11em",
                color: "var(--text-subtle)",
              }}
            >
              {s.label}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <VerdictChip tone={CHIP_TONE[verdict]}>{verdict}</VerdictChip>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                }}
              >
                {s.value.toFixed(2)}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
