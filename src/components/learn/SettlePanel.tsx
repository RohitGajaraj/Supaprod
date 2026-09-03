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
import { failureLine, reasonLine } from "@/lib/error-copy";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  Approve,
  Num,
  ReadFailedLine,
  Reading,
  Region,
  ReadFailed,
} from "@/components/meridian/surface-parts";
import { Choices, Field, Input, Textarea } from "@/components/meridian/forms";
import { Quiet } from "@/components/meridian/Quiet";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import {
  draftOutcomeSuggestion,
  listAgentSettledOutcomes,
  listPendingOutcomes,
  recordOutcome,
  deferOutcomeCheck,
  type AgentSettledOutcome,
  type PendingOutcome,
  type PromisedMetric,
} from "@/lib/outcome.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
// The three words the whole station speaks in, lifted out of this file so the
// route can read a settled verdict back in the same words the Gate asks for it.
import { VERDICT_SAYS, type Verdict } from "@/components/learn/verdict-words";
// `Receipt` has no Meridian part yet, so it stays on the retired layer rather
// than being hand-rolled here: five surfaces each drawing their own chrome is
// exactly how the product ended up with four copies of one component.
import { AgentMark } from "@/components/meridian/marks";
import { Receipt } from "@/components/meridian/Receipt";

/** Choices needs a value; "none" is never drawn as an option. */
type VerdictPick = Verdict | "none";

const VERDICT_OPTIONS: { id: Verdict; label: string; title: string }[] = [
  { id: "validated", label: "It worked", title: "The bet paid off" },
  { id: "mixed", label: "Mixed", title: "Partly, or the evidence is unclear" },
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
  /** The workspace the bet in focus lives in. Reported upward so the record the
   *  page draws beside this panel is the record for THIS bet's workspace. */
  workspaceId: string | null;
  opportunity: PendingOutcome["opportunity"];
  /** What the spec promised to move, from its own Outcome Contract. Present on
   *  both halves of the desk, because an overturn writes the same permanent
   *  precedent a first verdict does. */
  promised: PromisedMetric[];
  /** The launch plan's metric, when one was written. Only the pending queue
   *  reads launch plans, so this is null on the reconsider path. */
  planMetric: string | null;
  /** Set only when a person is looking at a verdict an agent already gave. */
  settled: AgentSettledOutcome | null;
  pending: PendingOutcome | null;
};

/** The seed for "What you measured", when the agent's draft carries none.
 *
 *  WHY 200 IS THE CUT, SAID CORRECTLY. The comment that used to be here said
 *  "`recordOutcome` validates `metricLabel` at 200 characters, so seeding a
 *  longer clause would fail the write." It does not. `recordOutcome`'s
 *  validator is `metricLabel: z.string().optional()` (outcome.functions.ts:864)
 *  with no `.max()`, `applyOutcome` passes it through untouched, and
 *  `learnings.metric_label` is `text` with no length limit — checked live on
 *  2026-08-06: `character_maximum_length` is null and the only CHECK on the
 *  table is `learnings_verdict_check`. A longer value would have been written,
 *  not refused. The real 200s are the form field's own `maxLength={200}` below,
 *  which constrains TYPING and does not reject a programmatically seeded value,
 *  and `suggestOutcomeVerdict`, which genuinely caps at 200
 *  (outcome.functions.ts:1677) on a different call. The cut is kept because a
 *  label longer than that is not a label; it is just no longer justified by a
 *  write that would fail.
 *
 *  AND A PROMISE IS NOT A MEASUREMENT LABEL. This field is "What you measured"
 *  and its placeholder names metrics ("Weekly active users, support tickets");
 *  what it records is `learnings.metric_label`, permanently. A contract clause
 *  is a target sentence, and pasting one here fills a label field with an
 *  assertion the person has not made yet. Measured: all 7 `success_metrics`
 *  clauses in the database are sentences of 62–164 characters, e.g. "Increase
 *  activation rate (…) by 15% within one quarter" — every one of them would
 *  have been seeded verbatim by the old rule. So a clause contributes only the
 *  metric NAME its author wrote before the colon ("Checkout completion: 10
 *  percent increase…" -> "Checkout completion"), and a clause carrying no such
 *  name seeds nothing rather than something wrong. Nothing is lost from the
 *  screen either way: `promiseLine` states every clause in full on the Gate
 *  line above, which is where a promise belongs. `planMetric` is tried first
 *  and is exempt from all of this — a launch plan's `success_metric` already IS
 *  a metric name. */
const METRIC_LABEL_MAX = 200;
/** The metric NAME inside a contract clause, or null when it carries none.
 *  Pure and deliberately unclever: the colon prefix is a name its author typed,
 *  not a guess at one. Anything longer than a label is not a label. The
 *  balanced-parenthesis test is the one way this can cut mid-thought — a clause
 *  reading "Activation (definition: linked accounts) rises 10%" would otherwise
 *  yield the fragment "Activation (definition" — so an unbalanced head yields
 *  nothing instead. */
function labelWithinClause(text: string): string | null {
  const whole = text.trim();
  const head = whole.split(":")[0]?.trim() ?? "";
  if (!head || head.length === whole.length) return null;
  if (head.split("(").length !== head.split(")").length) return null;
  return head.length <= METRIC_LABEL_MAX ? head : null;
}
function seedMetricLabel(promised: PromisedMetric[], planMetric: string | null): string {
  if (planMetric && planMetric.length <= METRIC_LABEL_MAX) return planMetric;
  for (const p of promised) {
    const label = labelWithinClause(p.text);
    if (label) return label;
  }
  return "";
}

export function SettlePanel({
  onDeskWorkspace,
}: {
  /**
   * WHICH WORKSPACE THE BET IN FOCUS LIVES IN, reported up as it changes.
   *
   * The desk this panel drains is the RLS union across every workspace the
   * reader belongs to (`listPendingOutcomes` applies no workspace filter, on
   * purpose). The record the Learn page draws around it is one workspace at a
   * time. Left unconnected those are routinely different workspaces, and
   * settling a bet then changes nothing the reader can see: the learning lands
   * in the bet's workspace and every count on the page is drawn from another.
   *
   * The panel owns which bet is in focus -- the queue row you clicked, the
   * agent verdict you are reconsidering -- so it is the only thing that can
   * answer this, and it tells the page rather than the page guessing. Pass a
   * stable callback (a `useState` setter is one); it fires only when the
   * workspace actually changes, never on every render.
   */
  onDeskWorkspace?: (workspaceId: string | null) => void;
} = {}) {
  const qc = useQueryClient();
  const fPending = useServerFn(listPendingOutcomes);
  const fSettled = useServerFn(listAgentSettledOutcomes);
  const fRecord = useServerFn(recordOutcome);
  const fDefer = useServerFn(deferOutcomeCheck);
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
        workspaceId: reconsidering.workspaceId,
        opportunity: reconsidering.opportunity,
        promised: reconsidering.promised,
        planMetric: null,
        settled: reconsidering,
        pending: null,
      }
    : pendingFocus
      ? {
          prdId: pendingFocus.prdId,
          title: pendingFocus.title,
          workspaceId: pendingFocus.workspaceId,
          opportunity: pendingFocus.opportunity,
          promised: pendingFocus.promised,
          planMetric: pendingFocus.planMetric,
          settled: null,
          pending: pendingFocus,
        }
      : null;
  const targetId = target?.prdId ?? null;

  // Told, not guessed. Keyed on the workspace and not on `target`, which is a
  // fresh object every render, so the page is notified when the answer changes
  // and at no other time.
  const targetWorkspaceId = target?.workspaceId ?? null;
  React.useEffect(() => {
    onDeskWorkspace?.(targetWorkspaceId);
  }, [targetWorkspaceId, onDeskWorkspace]);

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
      setMetricLabel(t.settled.metricLabel || seedMetricLabel(t.promised, t.planMetric));
      setMetricValue(t.settled.metricValue ?? "");
      return;
    }
    const s = t.pending?.suggestion ?? null;
    setVerdict(s?.verdict ?? null);
    setSummary(s?.summary ?? "");
    // THE PROMISE FILLS THE GAP; IT DOES NOT YET BEAT THE DEFAULT, and the
    // heading on this comment used to claim it did. `s.metric_label` is
    // hard-coded to "Distinct users (30d)" by the suggestion drafter whenever
    // any analytics rows exist (outcome-suggestion.server.ts), which is a
    // generic counter and not the thing this spec said it would move — and it
    // is on the LEFT of the `||`, so it still wins. What changed is only the
    // empty case: a draft carrying no label seeds from the spec's own promise
    // instead of leaving the field blank. Displacing the hard-coded default
    // has to happen in the drafter, where the label is invented; until it
    // does, the Gate line above is what keeps the real promise on screen.
    //
    // `||` and not `??`, deliberately: an empty-string label from the drafter
    // is a missing label, not a chosen one. On the reconsider path (:296) that
    // means the field can differ from what the agent recorded while `dirty` is
    // still false, and the button correctly still says "Change the verdict to
    // overturn it".
    setMetricLabel(s?.metric_label || seedMetricLabel(t.promised, t.planMetric));
    setMetricValue(s?.metric_value ?? "");
  }, [targetId]);

  /* ---- the commit ---- */
  const [receipts, setReceipts] = React.useState<Mark[]>([]);
  const addReceipt = React.useCallback((m: Mark) => setReceipts((r) => [m, ...r].slice(0, 4)), []);

  /**
   * THE HONEST "NOT YET", AND WHY LEARN NEEDED ONE TO FINISH ITS OWN JOB.
   *
   * Every exit from this gate wrote a PERMANENT verdict. `learnings.verdict` is
   * constrained to exactly `validated | missed | mixed` -- three judgments and no
   * fourth door -- so a person looking at a bet that shipped last week, or one
   * whose metric has not moved yet because nothing could have moved it yet, had
   * to pick one of three permanent answers or abandon the queue.
   *
   * That is not a cosmetic gap. These rows ARE the precedent pool: `getFocusNext`
   * and the Decide ranking read settled outcomes to re-rank the next call. Typing
   * "it did not work" about a bet that has not had time to work teaches the brain
   * something untrue, and the product's whole claim is that it learns from this
   * record. A wrong verdict here is worse than no verdict, because it compounds.
   *
   * NOT A FOURTH VERDICT. Adding `too_early` to the constraint would put a value
   * in the pool that every consumer must then remember to filter -- the exact
   * shape of the `is_sample` defect this repo paid for twice. The product already
   * models "come back to this later": `listPendingOutcomes` reads the desk from
   * shipped-and-unsettled specs UNION launch plans whose `check_by` has arrived,
   * so a `check_by` in the future already means not yet due.
   *
   * IT WRITES ON `prds`, AND THE FIRST VERSION OF THIS DID NOT. I first mounted
   * `rearmOutcomeCheck`, which already existed and rides `launch_plans.check_by`.
   * That has a hole: launch plan rows come from the user-triggered "generate
   * launch plan" action, are not guaranteed at ship time, and `positioning` is
   * NOT NULL and AI-generated so one cannot be created on the fly to defer
   * against. That function ends in `.single()`, which THROWS on zero rows -- so
   * the button would have errored on precisely the case it exists for: a freshly
   * shipped spec nobody has written a launch plan for. `deferOutcomeCheck` writes
   * the spec itself, which always exists, and migration
   * 20260806100000 carried the old dates across so nothing sprang back onto the
   * desk.
   *
   * Fourteen days because that is the shortest window in which a shipped change
   * usually has any signal at all; the exact number matters less than that the
   * bet leaves the desk and comes BACK on its own rather than being dropped.
   */
  const defer = useMutation({
    mutationFn: (v: { target: Target }) => fDefer({ data: { prdId: v.target.prdId, days: 14 } }),
    onSuccess: (r, v) => {
      addReceipt({
        key: `${v.target.prdId}-${Date.now()}`,
        verb: "You gave it more time",
        consequence: (
          <>
            {v.target.title}. No verdict was written, so nothing was taught to the ranking. It comes
            back to this desk on {new Date(r.checkBy).toLocaleDateString()}
            {r.deferredCount > 1 ? (
              <>
                {" "}
                This is the <Num>{r.deferredCount}</Num> time it has been put off, which is itself
                worth a look.
              </>
            ) : (
              "."
            )}
          </>
        ),
        at: clock(),
        failed: false,
      });
      // Only the desk changes. Deliberately NOT invalidating the learning,
      // ledger or opportunity queries: no outcome was recorded, so claiming
      // those moved would be the same lie in a different place.
      void qc.invalidateQueries({ queryKey: ["outcome-pending"] });
      setPickedId(null);
      seeded.current = null;
    },
    onError: (e: Error, v) => {
      addReceipt({
        key: `${v.target.prdId}-${Date.now()}`,
        verb: "It stayed on your desk",
        consequence: (
          <>
            {v.target.title}.{" "}
            {failureLine("The check date did not move, so this is still waiting on you.", e)}
          </>
        ),
        at: clock(),
        failed: true,
      });
    },
  });

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
        /* THIS LINE USED TO READ "Nothing was written." and that was a promise
           this screen is in no position to make. `applyOutcome` is not one
           statement: it moves the opportunity's confidence, writes or updates a
           `learnings` row, calls `rememberOutcome`, and only THEN writes
           `prds.outcome` — and it throws on any of them. A failure at the last
           of those leaves the learning and the confidence change on the record
           and the spec unsettled, which is the opposite of nothing.
           What IS true at every throw site is that the verdict never reached
           the spec, so that is what the receipt now says. The reason travels
           verbatim in `e.message`, and `applyOutcome`'s own message names what
           landed when it knows. */
        consequence: (
          <>
            {v.target.title}. {failureLine("The verdict is not on the record.", e)}
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

  if (pendingQ.isLoading) return <Reading>Reading what shipped.</Reading>;

  if (pendingQ.isError) {
    return (
      /*
       * NOT A GATE, AND THE RULE IS ALREADY WRITTEN DOWN IN THIS REPO.
       * `_authenticated.decide.tsx` states it beside its own failed read: "A
       * failed read is not a decision, so it never wears the Gate." This wore
       * one. `Gate` prints "Waiting on you" unconditionally (Gate.tsx:75), so a
       * dead read rendered a purple chip claiming a person was required, over a
       * sentence saying the read had failed. Nothing was waiting on anybody.
       *
       * That is the same defect the run header's `runStatus` records fixing:
       * three statements about one run, and the loudest was the false one.
       * Photographed on /learn at 1440 against a forced 401.
       *
       * `ReadFailed` is the right component and carries the retry itself, in
       * the neutral paint the previous comment here was right about: orchid
       * means a person is required, and a control that merely RE-READS is
       * entitled to none of it. Passing the error also gets S0's `wayOut`, so
       * an ended session offers sign-in instead of a retry that cannot work.
       */
      <ReadFailed onRetry={() => void pendingQ.refetch()} error={pendingQ.error}>
        What shipped did not load.
      </ReadFailed>
    );
  }

  if (!target) {
    return (
      <>
        <Quiet
          says={
            agentSettled.length > 0
              ? "Nothing needs your verdict."
              : "Nothing has shipped that needs a verdict."
          }
          whatWillAppear={
            agentSettled.length > 0
              ? `${agentDisplayName(MEASURE_SLUG)} settled the last ones on the evidence. They are below, with what each rested on. Disagree with any of them and the record keeps both.`
              : `A bet arrives here when its spec ships. ${agentDisplayName(MEASURE_SLUG)} settles it from what the usage actually did, and asks you only when the evidence does not reach.`
          }
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
    lines.push(promiseLine(target.promised, target.planMetric));
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
    // FIRST, because it is the standard everything under it is read against.
    lines.push(promiseLine(target.promised, target.planMetric));

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
      {/* NOT AN `Ask`: the question below is answered by the three-way
          `Choices` radio group in the Region underneath, not by a yes/no
          press here, and this card's own child was always a door
          (`OpenTheSpec`), never a decline. `Ask` requires a real binary
          answer/decline pair; forcing one on would invent a "no" this
          surface has never offered. So this stays a plain heading, the way
          ship.tsx's non-binary states do (P-53). */}
      <p className="mrd-title text-mrd-ink">
        {settledByAgent
          ? `Was ${target.title} really ${VERDICT_SAYS[settledByAgent.verdict]}?`
          : `Did ${target.title} pay off?`}
      </p>
      <div className="flex flex-col gap-mrd-3">{lines}</div>
      {/* The way out, beside the question that needs it. The heading above
          states the promise; this is for the person who wants the whole
          contract, the body, and the discussion before writing a verdict that
          does not come back. */}
      <OpenTheSpec prdId={target.prdId} />

      {/* The Gate above asks and prices it; this is where the answer is given.
          The title is a verb rather than a noun so it does not restate the Line
          label under it (hard ban 10). */}
      <Region title={settledByAgent ? "Give your own verdict" : "Settle it"}>
        {/* `Region`, `Field` and `Actions` each set no outer margin, on purpose:
            the retired `Block` decided this spacing for every caller and none of
            them could say otherwise. Stated once, here. */}
        <div className="flex flex-col gap-mrd-5">
          <Line label="The verdict">
            {/* `mode` IS DECLARED NOW. It defaulted to "one" on the retired
                layer, and a default is the wrong way to carry a fact that
                changes the ARIA and the keyboard: `one` is a radio group with a
                single tab stop and arrow keys, `any` is independent toggles.
                Three verdicts are mutually exclusive, so it is `one`. */}
            <Choices<VerdictPick>
              mode="one"
              label="The verdict"
              value={verdict ?? "none"}
              options={VERDICT_OPTIONS}
              onChange={(id) => {
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
              placeholder="Weekly active users, support tickets, time to get started"
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
            {/* THE ONE `Approve` ON THIS SURFACE, and the test it passes is
                literal rather than stylistic: the bet is HELD on this desk until
                this button is pressed. `listPendingOutcomes` keeps returning it,
                the queue keeps counting it, and the station's headline keeps
                asking for it, until a verdict lands. That is what orchid means
                in this system — a person is required — and nothing else on this
                surface releases anything.
                The other branch is NOT an Approve. "Ask Measure to draft it"
                dispatches an agent and leaves the bet exactly where it was, so
                it is a primary `Action`: loud, because it is the one thing to do
                when the form is empty, and neutral in colour, because it settles
                nothing. */}
            {canRecord ? (
              <Approve
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
              </Approve>
            ) : (
              <Action variant="primary" busy={drafting} onClick={() => draft.mutate(target.prdId)}>
                {drafting
                  ? "Reading the outcome."
                  : `Ask ${agentDisplayName(MEASURE_SLUG)} to draft it`}
              </Action>
            )}
            {settledByAgent ? (
              <Action onClick={() => setOverturnId(null)}>Leave it as it is</Action>
            ) : canRecord && !s ? (
              <Action busy={drafting} onClick={() => draft.mutate(target.prdId)}>
                {drafting ? "Reading the outcome." : `Ask ${agentDisplayName(MEASURE_SLUG)}`}
              </Action>
            ) : null}
            {/* THE THIRD ANSWER, and the station could not finish its job without
              it. Offered only on a bet nobody has settled: once a verdict exists
              the honest moves are to overturn it or leave it, and "not yet"
              would be a third thing that quietly contradicts a written record.
              See the `defer` mutation for why this is a check date and not a
              fourth verdict. */}
            {!settledByAgent ? (
              <Action
                busy={defer.isPending}
                onClick={() => defer.mutate({ target })}
                title="No verdict is written. It returns to this desk in two weeks."
              >
                {defer.isPending ? "Giving it more time." : "Too early to tell"}
              </Action>
            ) : null}
          </Actions>

          {draft.isError ? (
            <ReadFailedLine onRetry={() => draft.mutate(target.prdId)} error={draft.error}>
              {reasonLine("The draft did not come back, and nothing was written.", draft.error)}
            </ReadFailedLine>
          ) : null}
        </div>
      </Region>

      <ReceiptStack receipts={receipts} />

      {pending.length > (target.pending ? 1 : 0) ? (
        <Region title={target.pending ? "Also waiting" : "Waiting on you"}>
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
                // Outside the clickable region, so the row still focuses the
                // bet and the link still opens the spec (primitives Row splits
                // itself when it carries both).
                action={<OpenTheSpec prdId={p.prdId} quiet />}
              />
            ))}
        </Region>
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

/**
 * WHAT THIS SPEC PROMISED TO MOVE, above the three verdict buttons.
 *
 * The desk used to ask "Did <spec> pay off?" with nowhere on screen saying what
 * it promised, so the verdict was given from memory — and that verdict is
 * precedent the Decide ranking reads forever. The clause text is the same
 * `prds.contract.success_metrics` Ship's release document already renders under
 * "What it promised", so the promise a person reads on Ship and the promise
 * they are judged against on Learn are now the same words.
 *
 * NOTHING IS INVENTED, including the absence. A spec that carries no contract
 * gets a line SAYING it carries none, rather than the silence that let this
 * look like a form with a missing field. Live today most shipped-and-unsettled
 * specs have an empty contract, so this branch is the common one and it has to
 * be honest rather than blank.
 */
function promiseLine(promised: PromisedMetric[], planMetric: string | null): React.ReactNode {
  if (promised.length > 0) {
    const alsoPlan = planMetric && !promised.some((p) => p.text === planMetric);
    return (
      <span key="promised">
        <b>It promised</b> {promised.map((p) => p.text).join(" · ")}
        {alsoPlan ? <>. The launch plan measures that as {planMetric}</> : null}.
      </span>
    );
  }
  if (planMetric) {
    return (
      <span key="promised">
        <b>The launch plan promised</b> {planMetric}. The spec's own contract carries no success
        metric.
      </span>
    );
  }
  // Scoped to the contract on purpose. The reconsider path reads the spec's
  // contract and NOT launch plans, so a wider claim ("nothing was written down
  // anywhere") would be a sentence this component cannot stand behind there.
  return (
    <span key="promised">
      <b>This spec&apos;s contract named no success metric</b>, so there is nothing in it to judge
      this against.
    </span>
  );
}

/** The way back to the thing being judged.
 *
 *  The desk asked for a permanent verdict and offered no route to the spec that
 *  earned it: no link, no spec id, not even a URL to paste, so checking the
 *  promise meant leaving /learn, finding the spec by title on Plan, and coming
 *  back to re-pick the row. `/plan/spec/$id` is where OutcomeContractPanel
 *  renders the contract in full, which is the one place the summarised Gate
 *  line above cannot replace. */
function OpenTheSpec({ prdId, quiet = false }: { prdId: string; quiet?: boolean }) {
  // A real <Link>, not a Door with navigate(): the primitive Door is a button,
  // and the whole point of this fix is that the spec becomes reachable —
  // middle-click, open in a new tab, copy the address. It wears the Door's own
  // classes on a list row so a tight row stays tight, and the ghost button in
  // the Gate's action slot where a control is what the eye expects.
  const quietClass = "sp-block-more sp-door";
  return (
    <Link
      to="/plan/spec/$id"
      params={{ id: prdId }}
      className={quiet ? quietClass : "sp-btn"}
      {...(quiet ? {} : { "data-variant": "ghost" })}
      title="Read the spec and its full Outcome Contract"
    >
      Open the spec
    </Link>
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
    <Region
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
          action={<OpenTheSpec prdId={r.prdId} quiet />}
        />
      ))}
    </Region>
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
    <Region title="What you settled">
      {receipts.map((r) => (
        <Receipt
          key={r.key}
          verb={r.verb}
          consequence={r.consequence}
          time={r.at}
          failed={r.failed}
        />
      ))}
    </Region>
  );
}
