/**
 * Settling an outcome. The one write stage 07 exists for.
 *
 * The audit that produced this: `/learn` called exactly two server functions
 * and both were reads, so the last stage of the loop could REPORT what came
 * back and could never CAPTURE it. `recordOutcome` had been built and shipped
 * in `outcome.functions.ts` and no surface on the spine called it; the only
 * caller in the product was a pre-rebuild card buried in a tab of
 * `/plan/spec/$id`, which fired a success toast and rendered nothing of what
 * the write caused. A loop whose last stage cannot capture what happened does
 * not compound, it reports.
 *
 * So this panel is the whole justification for the surface, and it obeys four
 * rules that are not negotiable here:
 *
 *   · NOTHING IS INVENTED. A bet with no linked opportunity says no priority
 *     moves, rather than printing a zero. A spec Measure could not draft from
 *     says exactly what was missing. The score movement shown BEFORE you click
 *     comes from `listPendingOutcomes`, which runs the same arithmetic the
 *     write runs, so the promise and the write cannot drift.
 *   · A RECEIPT, NEVER A TOAST (anti-slop.md section 5). Settling writes a
 *     receipt carrying the real consequence: the priority that moved, the
 *     agent whose promotion is now held, the other bets that re-rank. A failed
 *     write writes an honest failed one.
 *   · THE CREW IS PRESENT AND IT IS LOAD BEARING. Measure drafts the verdict
 *     from usage data and the merged change. Every waiting row wears the mark
 *     of the agent that made the call being judged. A missed verdict against
 *     an agent still earning its autonomy holds its promotion, which the Gate
 *     warns about before you click and the receipt records after. Remove the
 *     agents and this is a manual form with no draft, no attribution and no
 *     consequence.
 *   · ONE PRIMARY. The Gate asks and shows the evidence; the form beneath it
 *     is already filled when Measure is confident, so the confident case is
 *     genuinely one click and the thin case is a review.
 */

import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  draftOutcomeSuggestion,
  listPendingOutcomes,
  recordOutcome,
  type PendingOutcome,
} from "@/lib/outcome.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Choices,
  Failed,
  Field,
  Gate,
  Input,
  Line,
  Loading,
  Num,
  Receipt,
  Row,
  Textarea,
} from "@/components/shell/primitives";

type Verdict = "validated" | "mixed" | "missed";
/** Choices needs a value; "none" is never drawn as an option. */
type VerdictPick = Verdict | "none";

/** The product's words for a verdict, the same three the run screen's stage 07
 *  panel uses, so /learn and /runs never call the same thing two things. */
const VERDICT_SAYS: Record<Verdict, string> = {
  validated: "it worked",
  missed: "it did not work",
  mixed: "the signal was mixed",
};

const VERDICT_OPTIONS: { id: Verdict; label: string; title: string }[] = [
  { id: "validated", label: "It worked", title: "The bet paid off" },
  { id: "mixed", label: "Mixed", title: "Partly, or the signal is unclear" },
  { id: "missed", label: "It did not", title: "The bet did not pay off" },
];

/** The agent that reads an outcome against the bet. The catalog calls the
 *  learn-station specialist Measure; `historian` is its deprecated alias and
 *  resolves to the same name and glyph. */
const MEASURE_SLUG = "data-analyst";

function shortDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function clock(): string {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function score(n: number | null | undefined): string | null {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(1) : null;
}

type Mark = {
  key: string;
  verb: string;
  consequence: React.ReactNode;
  at: string;
  failed: boolean;
};

export function SettlePanel() {
  const qc = useQueryClient();
  const fPending = useServerFn(listPendingOutcomes);
  const fRecord = useServerFn(recordOutcome);
  const fDraft = useServerFn(draftOutcomeSuggestion);

  const pendingQ = useQuery({ queryKey: ["outcome-pending"], queryFn: () => fPending() });
  const pending = React.useMemo(() => pendingQ.data?.pending ?? [], [pendingQ.data]);

  const [pickedId, setPickedId] = React.useState<string | null>(null);
  const focus: PendingOutcome | null =
    pending.find((p) => p.prdId === pickedId) ?? pending[0] ?? null;
  const focusId = focus?.prdId ?? null;

  /* ---- the form, seeded from Measure's draft ---- */
  const [verdict, setVerdict] = React.useState<Verdict | null>(null);
  const [summary, setSummary] = React.useState("");
  const [metricLabel, setMetricLabel] = React.useState("");
  const [metricValue, setMetricValue] = React.useState("");
  const [dirty, setDirty] = React.useState(false);
  /** The spec whose draft came back empty. Remembered so the Gate can say what
   *  was missing rather than leaving the button looking broken. */
  const [nothingToDraft, setNothingToDraft] = React.useState<string | null>(null);

  // `focus` is a fresh object on every render, so the effect keys off the one
  // value that means "seed again", the spec id, and reads the row through a ref
  // rather than making an object identity a dependency. A refetch, or the
  // hourly tick landing a fresh draft mid-session, must never overwrite what is
  // being typed; asking for a draft seeds the form directly instead.
  const focusRef = React.useRef<PendingOutcome | null>(focus);
  focusRef.current = focus;
  const seeded = React.useRef<string | null>(null);

  React.useEffect(() => {
    const row = focusRef.current;
    if (!row || !focusId) return;
    if (seeded.current === focusId) return;
    seeded.current = focusId;
    setDirty(false);
    const s = row.suggestion;
    setVerdict(s?.verdict ?? null);
    setSummary(s?.summary ?? "");
    setMetricLabel(s?.metric_label ?? "");
    setMetricValue(s?.metric_value ?? "");
  }, [focusId]);

  /* ---- the commit ---- */
  const [receipts, setReceipts] = React.useState<Mark[]>([]);
  const addReceipt = React.useCallback((m: Mark) => setReceipts((r) => [m, ...r].slice(0, 4)), []);

  const settle = useMutation({
    mutationFn: (v: { row: PendingOutcome; verdict: Verdict; summary: string }) =>
      fRecord({
        data: {
          prdId: v.row.prdId,
          verdict: v.verdict,
          summary: v.summary,
          metricLabel: metricLabel.trim() || undefined,
          metricValue: metricValue.trim() || undefined,
        },
      }),
    onSuccess: (r, v) => {
      addReceipt({
        key: `${v.row.prdId}-${Date.now()}`,
        verb: "You settled it",
        consequence: <SettledConsequence title={v.row.title} verdict={v.verdict} result={r} />,
        at: clock(),
        failed: false,
      });
      // The score moved, a learning landed, and the queue this drains all read
      // from those rows.
      void qc.invalidateQueries({ queryKey: ["outcome-pending"] });
      void qc.invalidateQueries({ queryKey: ["impact-ledger"] });
      void qc.invalidateQueries({ queryKey: ["outcome"] });
      void qc.invalidateQueries({ queryKey: ["learnings"] });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      setPickedId(null);
      seeded.current = null;
    },
    onError: (e: Error, v) => {
      addReceipt({
        key: `${v.row.prdId}-${Date.now()}`,
        verb: "The outcome did not record",
        consequence: (
          <>
            {v.row.title}. Nothing was written. {e.message}
          </>
        ),
        at: clock(),
        failed: true,
      });
    },
  });

  const draft = useMutation({
    mutationFn: (prdId: string) => fDraft({ data: { prdId } }),
    onSuccess: (r, prdId) => {
      if (!r.suggestion) {
        setNothingToDraft(prdId);
        return;
      }
      setNothingToDraft(null);
      setVerdict(r.suggestion.verdict);
      setSummary(r.suggestion.summary);
      setMetricLabel(r.suggestion.metric_label ?? "");
      setMetricValue(r.suggestion.metric_value ?? "");
      setDirty(false);
      void qc.invalidateQueries({ queryKey: ["outcome-pending"] });
    },
  });

  /* ---- render ---- */

  if (pendingQ.isLoading) return <Loading>Reading what shipped.</Loading>;

  if (pendingQ.isError) {
    return (
      <Gate question="What shipped did not load.">
        <Button variant="primary" onClick={() => void pendingQ.refetch()}>
          Try again
        </Button>
      </Gate>
    );
  }

  if (!focus) {
    return (
      <>
        <Gate
          question="Nothing has shipped that needs a verdict."
          lines={[
            <span key="how">
              A bet arrives here when its spec ships. Measure drafts a verdict from what the usage
              actually did, and you settle it.
            </span>,
          ]}
        />
        <ReceiptStack receipts={receipts} />
      </>
    );
  }

  const s = focus.suggestion;
  const canRecord = !!verdict && !!summary.trim();
  const confirmable = !!s && !dirty && canRecord && verdict === s.verdict;
  const drafting = draft.isPending && draft.variables === focus.prdId;

  const lines: React.ReactNode[] = [];

  if (s?.predicted?.trim()) {
    lines.push(
      <span key="predicted">
        <b>You predicted</b> {s.predicted.trim()}
      </span>,
    );
  }

  if (s) {
    const read: string[] = [];
    if (s.basis.data_days > 0) {
      read.push(
        `${s.basis.sample_users} ${s.basis.sample_users === 1 ? "person" : "people"} over ${s.basis.data_days} ${s.basis.data_days === 1 ? "day" : "days"}`,
      );
    }
    if (s.basis.has_shipped_changeset) read.push("the merged change");
    if (s.basis.has_prediction) read.push("the bet you wrote down");
    const tier =
      s.confidence_tier === "high"
        ? "Enough to confirm in one click."
        : "Thin, so read the draft before you record it.";
    lines.push(
      <span key="basis">
        {read.length > 0 ? (
          <>
            <b>{agentDisplayName(MEASURE_SLUG)} read</b> {read.join(", ")}.{" "}
          </>
        ) : (
          <>
            <b>{agentDisplayName(MEASURE_SLUG)} drafted this.</b>{" "}
          </>
        )}
        {tier}
      </span>,
    );
  } else if (nothingToDraft === focus.prdId) {
    lines.push(
      <span key="nodraft">
        <b>{agentDisplayName(MEASURE_SLUG)} found nothing to draft from</b>: no usage data, no
        merged change, and no bet written down against this spec.
      </span>,
    );
  } else {
    lines.push(
      <span key="undrafted">
        <b>No draft yet.</b> Measure can read the usage and the merged change, or you can write the
        verdict yourself.
      </span>,
    );
  }

  lines.push(<ScoreLine key="score" opportunity={focus.opportunity} verdict={verdict} />);

  if (verdict === "missed" && focus.decidedBy?.holdsPromotion) {
    lines.push(
      <span key="arc">
        <b>{agentDisplayName(focus.decidedBy.slug)} made this call.</b> Recording a miss holds its
        promotion while the miss is on the record.
      </span>,
    );
  }

  return (
    <>
      <Gate question={`Did ${focus.title} pay off?`} lines={lines} />

      {/* The Gate above asks and prices it; this is where the answer is given.
          The title is a verb rather than a noun so it does not restate the Line
          label under it (hard ban 10). */}
      <Block title="Settle it">
        <Line label="The verdict">
          <Choices<VerdictPick>
            label="The verdict"
            value={verdict ?? "none"}
            options={VERDICT_OPTIONS}
            onPick={(id) => {
              if (id === "none") return;
              setDirty(true);
              setVerdict(id);
            }}
          />
        </Line>

        <Field label="What actually happened" htmlFor="settle-summary">
          <Textarea
            id="settle-summary"
            value={summary}
            rows={4}
            maxLength={2000}
            placeholder="One or two plain sentences. What you expected, and what came back."
            onChange={(e) => {
              setDirty(true);
              setSummary(e.target.value);
            }}
          />
        </Field>

        <Field label="What you measured" htmlFor="settle-metric-label">
          <Input
            id="settle-metric-label"
            value={metricLabel}
            maxLength={200}
            placeholder="Weekly active users, support tickets, time to first run"
            onChange={(e) => {
              setDirty(true);
              setMetricLabel(e.target.value);
            }}
          />
        </Field>

        <Field label="What it came to" htmlFor="settle-metric-value">
          <Input
            id="settle-metric-value"
            value={metricValue}
            maxLength={200}
            placeholder="A number, or a before and after"
            onChange={(e) => {
              setDirty(true);
              setMetricValue(e.target.value);
            }}
          />
        </Field>

        <Actions>
          {canRecord ? (
            <Button
              variant="primary"
              disabled={settle.isPending}
              onClick={() =>
                settle.mutate({ row: focus, verdict: verdict as Verdict, summary: summary.trim() })
              }
            >
              {settle.isPending
                ? "Recording it."
                : confirmable
                  ? `Confirm: ${VERDICT_SAYS[verdict as Verdict]}`
                  : "Record it"}
            </Button>
          ) : (
            <Button variant="primary" disabled={drafting} onClick={() => draft.mutate(focus.prdId)}>
              {drafting
                ? "Reading the outcome."
                : `Ask ${agentDisplayName(MEASURE_SLUG)} to draft it`}
            </Button>
          )}
          {canRecord && !s ? (
            <Button disabled={drafting} onClick={() => draft.mutate(focus.prdId)}>
              {drafting ? "Reading the outcome." : `Ask ${agentDisplayName(MEASURE_SLUG)}`}
            </Button>
          ) : null}
        </Actions>

        {draft.isError ? (
          <Failed onRetry={() => draft.mutate(focus.prdId)}>
            The draft did not come back, and nothing was written. {(draft.error as Error).message}
          </Failed>
        ) : null}
      </Block>

      <ReceiptStack receipts={receipts} />

      {pending.length > 1 ? (
        <Block title="Also waiting">
          {pending
            .filter((p) => p.prdId !== focus.prdId)
            .map((p) => (
              <Row
                key={p.prdId}
                tight
                marks={
                  p.decidedBy ? <AgentMark slug={p.decidedBy.slug} state="quiet" /> : undefined
                }
                lead={p.title}
                sub={
                  p.suggestion
                    ? `${agentDisplayName(MEASURE_SLUG)} suggests ${VERDICT_SAYS[p.suggestion.verdict]}`
                    : "no draft yet"
                }
                time={shortDay(p.shippedAt)}
                onClick={() => setPickedId(p.prdId)}
              />
            ))}
        </Block>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The score line: what the verdict on the table would cost, before you
 * click it. Every branch is a real fact or the absence of one.
 * ------------------------------------------------------------------ */

function ScoreLine({
  opportunity,
  verdict,
}: {
  opportunity: PendingOutcome["opportunity"];
  verdict: Verdict | null;
}) {
  if (!opportunity) {
    return <span>No bet is linked to this spec, so settling it moves no priority.</span>;
  }
  const name = opportunity.title?.trim() || "The linked bet";
  const prior = score(opportunity.priorIce);

  if (prior === null) {
    const first = verdict && opportunity.projected ? score(opportunity.projected[verdict]) : null;
    return (
      <span>
        <b>{name}</b> carries no score yet
        {first !== null ? (
          <>
            . Settling it puts it at <Num>{first}</Num>.
          </>
        ) : (
          ", so there is nothing to move."
        )}
      </span>
    );
  }
  if (!verdict || !opportunity.projected) {
    return (
      <span>
        <b>{name}</b> is scored <Num>{prior}</Num> today.
      </span>
    );
  }
  const next = score(opportunity.projected[verdict]);
  if (next === null || next === prior) {
    return (
      <span>
        <b>{name}</b> holds at <Num>{prior}</Num>.
      </span>
    );
  }
  return (
    <span>
      <b>{name}</b> moves from <Num>{prior}</Num> to <Num>{next}</Num>.
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * The consequence a settled outcome actually caused.
 * ------------------------------------------------------------------ */

type RecordResult = Awaited<ReturnType<typeof recordOutcome>>;

function SettledConsequence({
  title,
  verdict,
  result,
}: {
  title: string;
  verdict: Verdict;
  result: RecordResult;
}) {
  const prior = score(result.opportunity?.prior_ice ?? null);
  const next = score(result.opportunity?.new_ice ?? null);
  const oppName = result.opportunityTitle?.trim() || "the linked bet";

  return (
    <>
      {title}, {VERDICT_SAYS[verdict]}.{" "}
      {!result.opportunity ? (
        <>No bet was linked, so no priority moved. </>
      ) : prior !== null && next !== null && prior !== next ? (
        <>
          {oppName} moved from <Num>{prior}</Num> to <Num>{next}</Num>.{" "}
        </>
      ) : prior === null && next !== null ? (
        <>
          {oppName} is now scored <Num>{next}</Num>.{" "}
        </>
      ) : prior !== null ? (
        <>
          {oppName} held at <Num>{prior}</Num>.{" "}
        </>
      ) : (
        <>{oppName} carries no score, so nothing moved. </>
      )}
      {result.arcHold ? (
        <>
          {agentDisplayName(result.arcHold.slug)} made this call, so its promotion is held while the
          miss is on the record.{" "}
        </>
      ) : null}
      {result.themeMoved ? (
        <>
          <Num>{result.themeMoved.otherBets}</Num>{" "}
          {result.themeMoved.otherBets === 1 ? "other bet" : "other bets"} on the same evidence
          re-rank on Decide.
        </>
      ) : null}
    </>
  );
}

function ReceiptStack({ receipts }: { receipts: Mark[] }) {
  if (receipts.length === 0) return null;
  return (
    <Block title="What you settled">
      {receipts.map((r) => (
        <Receipt
          key={r.key}
          verb={r.verb}
          consequence={r.consequence}
          time={r.at}
          failed={r.failed}
        />
      ))}
    </Block>
  );
}
