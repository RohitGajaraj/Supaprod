import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Sparkles } from "lucide-react";
import { toast } from "@/lib/notify";
import { recordOutcome, checkPrdShipped, suggestOutcomeVerdict } from "@/lib/outcome.functions";
import { VerdictChip, type VerdictTone } from "@/components/supaprod/Primitives";
import { Action } from "@/components/meridian/surface-parts";

type Verdict = "validated" | "mixed" | "missed";

/** Shape of the `prds.outcome` jsonb payload written by recordOutcome. */
export type PrdOutcome = {
  verdict?: Verdict;
  summary?: string;
  metric_label?: string | null;
  metric_value?: string | null;
  prior_ice?: number | null;
  new_ice?: number | null;
};

/** RF-01 — shape of the `prds.outcome_suggestion` jsonb payload written by
 *  generateOutcomeSuggestion (outcome-tick's second pass). */
export type PrdOutcomeSuggestion = {
  verdict: Verdict;
  summary: string;
  predicted?: string;
  metric_label?: string | null;
  metric_value?: string | null;
  confidence: number;
  confidence_tier: "high" | "low";
};

export type OutcomePrd = {
  id: string;
  status: string;
  github_issue_url?: string | null;
  shipped_at?: string | null;
  outcome?: PrdOutcome | null;
  outcome_suggestion?: PrdOutcomeSuggestion | null;
};

type Props = {
  prd: OutcomePrd;
  /** Invalidate this query key after a ship-check or outcome record. */
  invalidateKey: readonly unknown[];
};

// Verdict chips per the DESIGN.md inline-annotation ruling. Outcomes are the
// one place moss/madder live; "mixed" is ember — the result needs the human's
// read before it feeds rescoring.
const VERDICT_TONES: Record<Verdict, VerdictTone> = {
  validated: "moss",
  mixed: "ember",
  missed: "madder",
};

const VERDICT_ORDER: Verdict[] = ["validated", "mixed", "missed"];

export function OutcomeCard({ prd, invalidateKey }: Props) {
  const qc = useQueryClient();
  const fCheck = useServerFn(checkPrdShipped);
  const fRecord = useServerFn(recordOutcome);
  const fSuggest = useServerFn(suggestOutcomeVerdict);

  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [summary, setSummary] = useState("");
  const [metricLabel, setMetricLabel] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [predicted, setPredicted] = useState<string | null>(null);

  // RF-01 — seed the manual form from an auto-drafted outcome suggestion once
  // per PRD, so a low-confidence suggestion reads as "already drafted, review
  // it" instead of forcing the operator to click "Draft with Historian" cold.
  // `touchedRef` tracks whether the operator has already started editing THIS
  // prd's form — a suggestion can arrive mid-flight (the hourly cron runs
  // while the card is open) and must never clobber in-progress typing, so the
  // seed is skipped once touched, not just once already-seeded.
  const seededPrdId = useRef<string | null>(null);
  const touchedRef = useRef<{ prdId: string | null; touched: boolean }>({
    prdId: null,
    touched: false,
  });
  if (touchedRef.current.prdId !== prd.id) {
    touchedRef.current = { prdId: prd.id, touched: false };
  }
  const markTouched = () => {
    touchedRef.current.touched = true;
  };
  useEffect(() => {
    const s = prd.outcome_suggestion;
    if (!s || prd.outcome) return;
    if (seededPrdId.current === prd.id) return;
    if (touchedRef.current.prdId === prd.id && touchedRef.current.touched) return;
    seededPrdId.current = prd.id;
    setVerdict(s.verdict);
    setSummary(s.summary);
    setMetricLabel(s.metric_label ?? "");
    setMetricValue(s.metric_value ?? "");
    setPredicted(s.predicted ?? null);
  }, [prd.id, prd.outcome, prd.outcome_suggestion]);

  const onOutcomeRecorded = (r: Awaited<ReturnType<typeof fRecord>>) => {
    if (r.opportunity) {
      toast.success(
        `Opportunity re-scored: ${Number(r.opportunity.prior_ice).toFixed(1)} → ${Number(
          r.opportunity.new_ice,
        ).toFixed(1)}`,
      );
    }
    qc.invalidateQueries({ queryKey: invalidateKey });
    qc.invalidateQueries({ queryKey: ["learnings"] });
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  };

  const check = useMutation({
    mutationFn: () => fCheck({ data: { prdId: prd.id } }),
    onSuccess: (r) => {
      if (r.shipped) {
        toast.success(
          `Shipped: GitHub issue closed${
            r.shippedAt ? ` ${new Date(r.shippedAt).toLocaleDateString()}` : ""
          }`,
        );
        qc.invalidateQueries({ queryKey: invalidateKey });
      } else if (r.issueState === "open") {
        toast("Not shipped yet. The linked GitHub issue is still open.");
      } else {
        toast("Ship status unknown. Could not read the linked GitHub issue.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const record = useMutation({
    mutationFn: () => {
      if (!verdict) throw new Error("Pick a verdict first");
      if (!summary.trim()) throw new Error("Summarize what actually happened");
      return fRecord({
        data: {
          prdId: prd.id,
          verdict,
          summary: summary.trim(),
          metricLabel: metricLabel.trim() || undefined,
          metricValue: metricValue.trim() || undefined,
        },
      });
    },
    onSuccess: (r) => {
      toast.success("Learning recorded");
      onOutcomeRecorded(r);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // LRN-02 · Historian assist — drafts the predicted-vs-actual verdict + summary
  // from the opportunity's prediction and whatever actual the operator has typed.
  // It only pre-fills; the human still confirms and fires "Record outcome".
  const suggest = useMutation({
    mutationFn: () =>
      fSuggest({
        data: {
          prdId: prd.id,
          metricLabel: metricLabel.trim() || undefined,
          metricValue: metricValue.trim() || undefined,
          notes: summary.trim() || undefined,
        },
      }),
    // Clear the prior prediction the moment a re-draft starts, so the operator
    // never reads a stale "Predicted:" line while the new draft is in flight.
    onMutate: () => setPredicted(null),
    onSuccess: (r) => {
      setVerdict(r.verdict);
      if (r.summary) setSummary(r.summary);
      setPredicted(r.predicted || null);
      toast.success("Historian drafted a verdict. Review, then record.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shipped = prd.status === "shipped" || !!prd.shipped_at;
  const outcome = prd.outcome ?? null;

  return (
    <div className="rounded-lg border hairline bg-card/60 p-4">
      <div className="text-mrd-nano uppercase tracking-[0.16em] text-muted-foreground mb-3 flex items-center gap-2">
        <Target className="h-3 w-3" /> Outcome
      </div>

      {outcome ? (
        <RecordedOutcome outcome={outcome} />
      ) : shipped ? (
        <div className="space-y-3">
          {prd.outcome_suggestion && (
            // "Confirm outcome" fires the SAME record mutation as the manual
            // form below (reads current verdict/summary/metric state, not the
            // raw suggestion object) — so an edit made before confirming is
            // never silently dropped in favor of the original draft.
            <OutcomeSuggestionBanner
              suggestion={prd.outcome_suggestion}
              onConfirm={() => record.mutate()}
              confirming={record.isPending}
              disabled={!verdict || !summary.trim()}
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-mrd-tiny text-muted-foreground">
              Score this bet against what you predicted.
            </span>
            <Action
              onClick={() => suggest.mutate()}
              busy={suggest.isPending}
              title="Let the Historian draft a predicted-vs-actual verdict you can edit"
            >
              {suggest.isPending ? "Drafting…" : "Draft with Historian"}
            </Action>
          </div>
          {predicted && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Predicted:</span> {predicted}
            </p>
          )}
          <div className="flex items-center gap-2">
            {VERDICT_ORDER.map((v) => (
              <button
                key={v}
                onClick={() => {
                  markTouched();
                  setVerdict(v);
                }}
                title={`Record as ${v}`}
              >
                <VerdictChip
                  tone={VERDICT_TONES[v]}
                  selected={verdict === v}
                  style={verdict !== null && verdict !== v ? { opacity: 0.45 } : undefined}
                >
                  {v}
                </VerdictChip>
              </button>
            ))}
          </div>
          <textarea
            aria-label="What actually happened"
            value={summary}
            onChange={(e) => {
              markTouched();
              setSummary(e.target.value);
            }}
            placeholder="What actually happened?"
            className="w-full min-h-[80px] rounded-md border hairline bg-background px-3 py-2 text-sm outline-none focus:border-foreground resize-y"
          />
          <div className="flex flex-wrap gap-2">
            <input
              aria-label="Metric label, optional"
              value={metricLabel}
              onChange={(e) => {
                markTouched();
                setMetricLabel(e.target.value);
              }}
              placeholder="Metric label (optional)"
              className="flex-1 min-w-[160px] rounded-md border hairline bg-background px-3 py-1.5 text-xs outline-none focus:border-foreground"
            />
            <input
              aria-label="Metric value, optional"
              value={metricValue}
              onChange={(e) => {
                markTouched();
                setMetricValue(e.target.value);
              }}
              placeholder="Metric value (optional)"
              className="flex-1 min-w-[160px] rounded-md border hairline bg-background px-3 py-1.5 text-xs outline-none focus:border-foreground"
            />
          </div>
          {/* THE SYSTEM'S BUTTON, AND NOT AN EMBER FILL. This and "Confirm
              outcome" below wore `.btn-pill`, a SOLID EMBER FACE
              (styles.css: `background-color: var(--mrd-you)`). Inside the
              authenticated product ember is a colour or an edge and never a
              fill: ink.css:236 declares it the mark that "marks the human, and
              nothing else", and the standing ruling in
              docs/design/DESIGN-SYSTEM.md is that it is "explicitly not the
              default for approval buttons, actions or tasks".

              THE RAISED DEFAULT, NOT `variant="primary"`. primitives.css states
              "one primary per screen", and this card renders on /plan/spec/$id
              underneath that page's own action row, which already spends the one
              on Approve/Save. Recording an outcome is the terminal act of THIS
              card, not of the page.

              The Tailwind size utilities left with the class rather than sitting
              on top of it: `.sp-btn` carries its own height (--sp-ctl-md) and
              padding, and keeping both gives a control that is neither size.
              `disabled:opacity-50` goes for the same reason -- `.sp-btn:disabled`
              already dims, and the disabled condition itself is unchanged.

              AND NOTHING IN THIS CARD IS A GHOST. The two `.btn-pill-outline`
              controls that first port left behind, "Draft with Historian" and
              "Check ship status", are now raised defaults too. Ghost is this
              system's escape hatch -- the Cancel that backs out of an inline
              editor -- and neither of these backs out of anything: one asks the
              Historian for a draft you can edit, the other reads GitHub. Every
              control here is a thing to do, so every control here is raised. */}
          <Action
            onClick={() => record.mutate()}
            disabled={!verdict || !summary.trim() || record.isPending}
          >
            {record.isPending ? "Recording…" : "Record outcome"}
          </Action>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Ships when the linked GitHub issue closes.
          </p>
          {prd.github_issue_url ? (
            <Action onClick={() => check.mutate()} busy={check.isPending}>
              {check.isPending ? "Checking…" : "Check ship status"}
            </Action>
          ) : (
            <p className="text-xs text-muted-foreground">Link a GitHub issue to track shipping.</p>
          )}
        </div>
      )}
    </div>
  );
}

function RecordedOutcome({ outcome }: { outcome: PrdOutcome }) {
  return (
    <div className="space-y-3">
      {outcome.verdict ? (
        <VerdictChip tone={VERDICT_TONES[outcome.verdict]}>{outcome.verdict}</VerdictChip>
      ) : (
        <span className="mono-label inline-flex rounded-full border hairline px-2 py-0.5 text-ink-faint">
          recorded
        </span>
      )}
      {outcome.summary && <p className="text-sm leading-mrd-prose">{outcome.summary}</p>}
      {(outcome.metric_label || outcome.metric_value) && (
        <p className="text-xs text-muted-foreground">
          {outcome.metric_label ?? "Metric"}
          {outcome.metric_value ? (
            <>
              : <span className="tabular-nums text-foreground">{outcome.metric_value}</span>
            </>
          ) : null}
        </p>
      )}
      {outcome.prior_ice != null && outcome.new_ice != null && (
        <p className="text-xs text-muted-foreground">
          Opportunity re-scored:{" "}
          <span className="tabular-nums">
            {Number(outcome.prior_ice).toFixed(1)} → {Number(outcome.new_ice).toFixed(1)}
          </span>{" "}
          <Link to="/arriving" className="link-action">
            View opportunities
          </Link>
        </p>
      )}
    </div>
  );
}

/** RF-01 — shows the auto-drafted suggestion (chained from outcome-tick +
 *  the Historian + SEN-05 usage deltas + the BYO-P3 changeset join). A
 *  high-confidence suggestion gets a one-click "Confirm outcome"; a
 *  low-confidence one is shown for context only — the form beneath it is
 *  already pre-filled from the same suggestion for the operator to review. */
function OutcomeSuggestionBanner({
  suggestion,
  onConfirm,
  confirming,
  disabled,
}: {
  suggestion: PrdOutcomeSuggestion;
  onConfirm: () => void;
  confirming: boolean;
  disabled: boolean;
}) {
  const highConfidence = suggestion.confidence_tier === "high";
  return (
    <div className="rounded-md border hairline bg-background/60 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-mrd-nano uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          {highConfidence ? "Suggested outcome" : "Suggested · review before recording"}
        </span>
        <VerdictChip tone={VERDICT_TONES[suggestion.verdict]}>{suggestion.verdict}</VerdictChip>
      </div>
      <p className="text-xs text-muted-foreground leading-mrd-prose">{suggestion.summary}</p>
      {(suggestion.metric_label || suggestion.metric_value) && (
        <p className="text-xs text-muted-foreground">
          {suggestion.metric_label ?? "Metric"}
          {suggestion.metric_value ? (
            <>
              : <span className="tabular-nums text-foreground">{suggestion.metric_value}</span>
            </>
          ) : null}
        </p>
      )}
      {highConfidence && (
        <Action
          onClick={onConfirm}
          disabled={disabled || confirming}
          title="Record this outcome in one click"
        >
          {confirming ? "Confirming…" : "Confirm outcome"}
        </Action>
      )}
    </div>
  );
}
