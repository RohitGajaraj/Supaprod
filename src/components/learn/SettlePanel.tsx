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
 * THE 2026-08-02 CHANGE: the agent gives the verdict now, and this surface has
 * two jobs instead of one.
 *
 * Founder ruling: "Why should it always be the user giving the verdict?
 * Primarily it should be the AGENT giving the verdict." So the hourly sweep
 * settles what it can evidence, and what reaches this panel is the exception,
 * not the loop. Two consequences the design has to carry honestly:
 *
 *   · AN OUTCOME AN AGENT SETTLED MUST NOT LOOK LIKE ONE A PERSON SETTLED.
 *     It carries the agent's mark, its confidence, and the facts it rested on,
 *     in its own block. Anything less would be a write nobody agreed to,
 *     dressed as a write somebody made.
 *   · DISAGREEING IS ONE CLICK AND IT IS ALWAYS THERE. Autonomy is paid for
 *     with evidence, and the payment only clears if the person can see the
 *     working and reverse it. The overturn is priced before the click, the
 *     same way a first verdict is, and it is recorded against the agent's
 *     original rather than replacing it silently.
 *
 * And the four rules the panel already obeyed, which the change does not
 * relax:
 *
 *   · NOTHING IS INVENTED. A bet with no linked opportunity says no priority
 *     moves, rather than printing a zero. A spec Measure could not draft from
 *     says exactly what was missing. The score movement shown BEFORE you click
 *     comes from `listPendingOutcomes` and `listAgentSettledOutcomes`, which
 *     run the same arithmetic the write runs, so the promise and the write
 *     cannot drift. The reason a bet is on your desk comes from the same pure
 *     function the sweep decided with.
 *   · A RECEIPT, NEVER A TOAST (anti-slop.md section 5). Settling writes a
 *     receipt carrying the real consequence: the priority that moved, the
 *     agent whose promotion is now held, the other bets that re-rank, and the
 *     verdict this one overturned. A failed write writes an honest failed one.
 *   · THE CREW IS PRESENT AND IT IS LOAD BEARING. Measure settles what it can
 *     evidence and hands over what it cannot, saying which and why. Every
 *     waiting row wears the mark of the agent that made the call being judged.
 *     Remove the agents and this is a manual form with no draft, no
 *     attribution, no consequence, and no verdicts settled at all.
 *   · ONE PRIMARY. The Gate asks and shows the evidence; the form beneath it
 *     is already filled, so the confident case is genuinely one click and the
 *     thin case is a review.
 */

import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  draftOutcomeSuggestion,
  listAgentSettledOutcomes,
  listPendingOutcomes,
  recordOutcome,
  type AgentSettledOutcome,
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

/** The agent's evidence score, as a person reads it. Never a bare decimal. */
function sureness(n: number | null | undefined): string | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return `${Math.round(Math.min(1, Math.max(0, n)) * 100)}%`;
}

type Mark = {
  key: string;
  verb: string;
  consequence: React.ReactNode;
  at: string;
  failed: boolean;
};

/** What the form is pointed at. A bet waiting for a first verdict, or one an
 *  agent already settled that a person is looking at again. The form itself is
 *  identical either way; only the Gate above it and the button beneath it
 *  change, because giving a verdict and replacing one are the same act with
 *  different consequences. */
type Target = {
  prdId: string;
  title: string;
  opportunity: PendingOutcome["opportunity"];
  /** Set only when a person is looking at a verdict an agent already gave. */
  settled: AgentSettledOutcome | null;
  pending: PendingOutcome | null;
};

export function SettlePanel() {
  const qc = useQueryClient();
  const fPending = useServerFn(listPendingOutcomes);
  const fSettled = useServerFn(listAgentSettledOutcomes);
  const fRecord = useServerFn(recordOutcome);
  const fDraft = useServerFn(draftOutcomeSuggestion);

  const pendingQ = useQuery({ queryKey: ["outcome-pending"], queryFn: () => fPending() });
  const settledQ = useQuery({ queryKey: ["outcome-agent-settled"], queryFn: () => fSettled() });
  const pending = React.useMemo(() => pendingQ.data?.pending ?? [], [pendingQ.data]);
  const agentSettled = React.useMemo(() => settledQ.data?.settled ?? [], [settledQ.data]);

  const [pickedId, setPickedId] = React.useState<string | null>(null);
  /** Which agent-settled verdict the person is reconsidering. Takes precedence
   *  over the waiting queue: they clicked it on purpose. */
  const [overturnId, setOverturnId] = React.useState<string | null>(null);

  const reconsidering = overturnId
    ? (agentSettled.find((s) => s.prdId === overturnId) ?? null)
    : null;
  const pendingFocus: PendingOutcome | null =
    pending.find((p) => p.prdId === pickedId) ?? pending[0] ?? null;

  const target: Target | null = reconsidering
    ? {
        prdId: reconsidering.prdId,
        title: reconsidering.title,
        opportunity: reconsidering.opportunity,
        settled: reconsidering,
        pending: null,
      }
    : pendingFocus
      ? {
          prdId: pendingFocus.prdId,
          title: pendingFocus.title,
          opportunity: pendingFocus.opportunity,
          settled: null,
          pending: pendingFocus,
        }
      : null;
  const targetId = target?.prdId ?? null;

  /* ---- the form, seeded from whatever verdict is already on the table ---- */
  const [verdict, setVerdict] = React.useState<Verdict | null>(null);
  const [summary, setSummary] = React.useState("");
  const [metricLabel, setMetricLabel] = React.useState("");
  const [metricValue, setMetricValue] = React.useState("");
  const [dirty, setDirty] = React.useState(false);
  /** The spec whose draft came back empty. Remembered so the Gate can say what
   *  was missing rather than leaving the button looking broken. */
  const [nothingToDraft, setNothingToDraft] = React.useState<string | null>(null);

  // `target` is a fresh object on every render, so the effect keys off the one
  // value that means "seed again", the spec id, and reads the row through a ref
  // rather than making an object identity a dependency. A refetch, or the
  // hourly tick landing a fresh draft mid-session, must never overwrite what is
  // being typed; asking for a draft seeds the form directly instead.
  const targetRef = React.useRef<Target | null>(target);
  targetRef.current = target;
  const seeded = React.useRef<string | null>(null);

  React.useEffect(() => {
    const t = targetRef.current;
    if (!t || !targetId) return;
    if (seeded.current === targetId) return;
    seeded.current = targetId;
    setDirty(false);
    if (t.settled) {
      // Seed with what the agent put on the record. Changing it IS the
      // disagreement, so the person edits a filled form rather than an empty
      // one and can see exactly what they are replacing.
      setVerdict(t.settled.verdict);
      setSummary(t.settled.summary);
      setMetricLabel(t.settled.metricLabel ?? "");
      setMetricValue(t.settled.metricValue ?? "");
      return;
    }
    const s = t.pending?.suggestion ?? null;
    setVerdict(s?.verdict ?? null);
    setSummary(s?.summary ?? "");
    setMetricLabel(s?.metric_label ?? "");
    setMetricValue(s?.metric_value ?? "");
  }, [targetId]);

  /* ---- the commit ---- */
  const [receipts, setReceipts] = React.useState<Mark[]>([]);
  const addReceipt = React.useCallback((m: Mark) => setReceipts((r) => [m, ...r].slice(0, 4)), []);

  const settle = useMutation({
    mutationFn: (v: { target: Target; verdict: Verdict; summary: string }) =>
      fRecord({
        data: {
          prdId: v.target.prdId,
          verdict: v.verdict,
          summary: v.summary,
          metricLabel: metricLabel.trim() || undefined,
          metricValue: metricValue.trim() || undefined,
        },
      }),
    onSuccess: (r, v) => {
      addReceipt({
        key: `${v.target.prdId}-${Date.now()}`,
        verb: r.overturned ? "You overturned it" : "You settled it",
        consequence: <SettledConsequence title={v.target.title} verdict={v.verdict} result={r} />,
        at: clock(),
        failed: false,
      });
      // The score moved, a learning landed, and the queues this drains all read
      // from those rows.
      void qc.invalidateQueries({ queryKey: ["outcome-pending"] });
      void qc.invalidateQueries({ queryKey: ["outcome-agent-settled"] });
      void qc.invalidateQueries({ queryKey: ["impact-ledger"] });
      void qc.invalidateQueries({ queryKey: ["outcome"] });
      void qc.invalidateQueries({ queryKey: ["learnings"] });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      setPickedId(null);
      setOverturnId(null);
      seeded.current = null;
    },
    onError: (e: Error, v) => {
      addReceipt({
        key: `${v.target.prdId}-${Date.now()}`,
        verb: "The outcome did not record",
        consequence: (
          <>
            {v.target.title}. Nothing was written. {e.message}
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

  if (!target) {
    return (
      <>
        <Gate
          question={
            agentSettled.length > 0
              ? "Nothing needs your verdict."
              : "Nothing has shipped that needs a verdict."
          }
          lines={[
            <span key="how">
              {agentSettled.length > 0 ? (
                <>
                  <b>{agentDisplayName(MEASURE_SLUG)} settled the last ones on the evidence.</b>{" "}
                  They are below, with what each rested on. Disagree with any of them and the record
                  keeps both.
                </>
              ) : (
                <>
                  A bet arrives here when its spec ships. {agentDisplayName(MEASURE_SLUG)} settles
                  it from what the usage actually did, and asks you only when the evidence does not
                  reach.
                </>
              )}
            </span>,
          ]}
        />
        <AgentSettledBlock
          rows={agentSettled}
          loading={settledQ.isLoading}
          onReconsider={setOverturnId}
        />
        <ReceiptStack receipts={receipts} />
      </>
    );
  }

  const s = target.pending?.suggestion ?? null;
  const settledByAgent = target.settled;
  const canRecord = !!verdict && !!summary.trim();
  const unchanged = !!settledByAgent && verdict === settledByAgent.verdict && !dirty;
  const confirmable = !settledByAgent && !!s && !dirty && canRecord && verdict === s.verdict;
  const drafting = draft.isPending && draft.variables === target.prdId;

  const lines: React.ReactNode[] = [];

  if (settledByAgent) {
    lines.push(
      <span key="settled">
        <b>
          {agentDisplayName(settledByAgent.agentSlug ?? MEASURE_SLUG)} settled this as{" "}
          {VERDICT_SAYS[settledByAgent.verdict]}
        </b>
        {sureness(settledByAgent.confidence) ? (
          <>
            , on <Num>{sureness(settledByAgent.confidence)}</Num> of the evidence it needed
          </>
        ) : null}
        . {settledByAgent.reason ?? ""}
      </span>,
    );
    if (settledByAgent.evidence.length > 0) {
      lines.push(<span key="worked">{settledByAgent.evidence.join(" ")}</span>);
    }
    lines.push(
      <ScoreLine
        key="score"
        opportunity={target.opportunity}
        verdict={verdict}
        replacing={settledByAgent.verdict}
      />,
    );
  } else {
    if (s?.predicted?.trim()) {
      lines.push(
        <span key="predicted">
          <b>You predicted</b> {s.predicted.trim()}
        </span>,
      );
    }

    // WHY THIS ONE IS YOURS. The sweep already looked at it and handed it over,
    // and this is the sentence it handed over WITH, recomputed by the same
    // function. Without it the queue reads as "the agent does not do this",
    // which is now false and would make every remaining ask feel arbitrary.
    const why = target.pending?.settlement ?? null;
    if (why && why.action === "escalate") {
      lines.push(
        <span key="why">
          <b>{agentDisplayName(MEASURE_SLUG)} did not settle this.</b> {why.reason}
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
    } else if (nothingToDraft === target.prdId) {
      lines.push(
        <span key="nodraft">
          <b>{agentDisplayName(MEASURE_SLUG)} found nothing to draft from</b>: no usage data, no
          merged change, and no bet written down against this spec.
        </span>,
      );
    } else {
      lines.push(
        <span key="undrafted">
          <b>No draft yet.</b> Measure can read the usage and the merged change, or you can write
          the verdict yourself.
        </span>,
      );
    }

    lines.push(<ScoreLine key="score" opportunity={target.opportunity} verdict={verdict} />);

    if (verdict === "missed" && target.pending?.decidedBy?.holdsPromotion) {
      lines.push(
        <span key="arc">
          <b>{agentDisplayName(target.pending.decidedBy.slug)} made this call.</b> Recording a miss
          holds its promotion while the miss is on the record.
        </span>,
      );
    }
  }

  return (
    <>
      <Gate
        question={
          settledByAgent
            ? `Was ${target.title} really ${VERDICT_SAYS[settledByAgent.verdict]}?`
            : `Did ${target.title} pay off?`
        }
        lines={lines}
      />

      {/* The Gate above asks and prices it; this is where the answer is given.
          The title is a verb rather than a noun so it does not restate the Line
          label under it (hard ban 10). */}
      <Block title={settledByAgent ? "Give your own verdict" : "Settle it"}>
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
              disabled={settle.isPending || (!!settledByAgent && unchanged)}
              onClick={() =>
                settle.mutate({ target, verdict: verdict as Verdict, summary: summary.trim() })
              }
            >
              {settle.isPending
                ? "Recording it."
                : settledByAgent
                  ? unchanged
                    ? "Change the verdict to overturn it"
                    : `Overturn: ${VERDICT_SAYS[verdict as Verdict]}`
                  : confirmable
                    ? `Confirm: ${VERDICT_SAYS[verdict as Verdict]}`
                    : "Record it"}
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={drafting}
              onClick={() => draft.mutate(target.prdId)}
            >
              {drafting
                ? "Reading the outcome."
                : `Ask ${agentDisplayName(MEASURE_SLUG)} to draft it`}
            </Button>
          )}
          {settledByAgent ? (
            <Button onClick={() => setOverturnId(null)}>Leave it as it is</Button>
          ) : canRecord && !s ? (
            <Button disabled={drafting} onClick={() => draft.mutate(target.prdId)}>
              {drafting ? "Reading the outcome." : `Ask ${agentDisplayName(MEASURE_SLUG)}`}
            </Button>
          ) : null}
        </Actions>

        {draft.isError ? (
          <Failed onRetry={() => draft.mutate(target.prdId)}>
            The draft did not come back, and nothing was written. {(draft.error as Error).message}
          </Failed>
        ) : null}
      </Block>

      <ReceiptStack receipts={receipts} />

      {pending.length > (target.pending ? 1 : 0) ? (
        <Block title={target.pending ? "Also waiting" : "Waiting on you"}>
          {pending
            .filter((p) => p.prdId !== target.prdId)
            .map((p) => (
              <Row
                key={p.prdId}
                tight
                marks={
                  p.decidedBy ? <AgentMark slug={p.decidedBy.slug} state="quiet" /> : undefined
                }
                lead={p.title}
                sub={waitingSub(p)}
                time={shortDay(p.shippedAt)}
                onClick={() => {
                  setOverturnId(null);
                  setPickedId(p.prdId);
                }}
              />
            ))}
        </Block>
      ) : null}

      <AgentSettledBlock
        rows={agentSettled.filter((r) => r.prdId !== target.prdId)}
        loading={settledQ.isLoading}
        onReconsider={(id) => {
          setPickedId(null);
          setOverturnId(id);
        }}
      />
    </>
  );
}

/** One line under a waiting row: why it is waiting, not what it is. */
function waitingSub(p: PendingOutcome): string {
  if (p.settlement?.action === "escalate") return p.settlement.reason;
  if (p.suggestion)
    return `${agentDisplayName(MEASURE_SLUG)} suggests ${VERDICT_SAYS[p.suggestion.verdict]}`;
  return "no draft yet";
}

/* ------------------------------------------------------------------ *
 * What the agents settled without you.
 *
 * This block is the whole reason the autonomy is defensible. An agent
 * verdict that is not visible, attributed, and reversible is not
 * autonomy, it is a silent write, so every one of them lands here with
 * its confidence and the facts it rested on, and every one of them can
 * be taken back.
 * ------------------------------------------------------------------ */

function AgentSettledBlock({
  rows,
  loading,
  onReconsider,
}: {
  rows: AgentSettledOutcome[];
  loading: boolean;
  onReconsider: (prdId: string) => void;
}) {
  if (loading || rows.length === 0) return null;
  return (
    <Block
      title={`${agentDisplayName(MEASURE_SLUG)} settled these`}
      sub="Click any of them to disagree. The record keeps what it said and what you said."
    >
      {rows.map((r) => (
        <Row
          key={r.prdId}
          tight
          marks={<AgentMark slug={r.agentSlug ?? MEASURE_SLUG} state="quiet" />}
          lead={r.title}
          sub={
            <>
              {VERDICT_SAYS[r.verdict]}
              {sureness(r.confidence) ? (
                <>
                  {" · "}
                  <Num>{sureness(r.confidence)}</Num> of the evidence it needed
                </>
              ) : null}
              {r.overturns.length > 0 ? " · you overturned this once" : ""}
            </>
          }
          time={shortDay(r.settledAt)}
          onClick={() => onReconsider(r.prdId)}
        />
      ))}
    </Block>
  );
}

/* ------------------------------------------------------------------ *
 * The score line: what the verdict on the table would cost, before you
 * click it. Every branch is a real fact or the absence of one.
 * ------------------------------------------------------------------ */

function ScoreLine({
  opportunity,
  verdict,
  replacing,
}: {
  opportunity: PendingOutcome["opportunity"];
  verdict: Verdict | null;
  /** The verdict already on the record, when this would replace one. The
   *  projections already account for it, so this only changes the words. */
  replacing?: Verdict;
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
        <b>{name}</b> holds at <Num>{prior}</Num>
        {replacing && verdict === replacing ? ", where the verdict already put it" : ""}.
      </span>
    );
  }
  return (
    <span>
      <b>{name}</b> {replacing ? "moves back" : "moves"} from <Num>{prior}</Num> to{" "}
      <Num>{next}</Num>.
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
  const over = result.overturned;

  return (
    <>
      {title}, {VERDICT_SAYS[verdict]}.{" "}
      {/* The contrast, kept out loud. Two verdicts on one bet is the record
          this product is built to produce, and a receipt that hid the first one
          would be the exact place to start losing it. */}
      {over ? (
        <>
          {over.from_agent_slug ? agentDisplayName(over.from_agent_slug) : "The agent"} had settled
          it as {VERDICT_SAYS[over.from_verdict as Verdict]}, and that call stays on the record
          beside yours.{" "}
        </>
      ) : null}
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
