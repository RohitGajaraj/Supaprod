/**
 * THE THING BEING MADE, RENDERED AS ITSELF.
 *
 * WHY THIS IS NOT `TrackChain` IN ANOTHER HAT. The chain answers *what was
 * filed*; this answers *what the work is*. The distinction is the whole right
 * pane of the design ruling (DESIGN-DIRECTION §1): a spec rendered as a spec,
 * not as a row saying a spec exists. Bodies come from `getTrackArtifacts`
 * (SPEC-ARTIFACTS §1, in main as of RL0-021); Plan keeps `getPrd`, whose full
 * row is what its edit action writes back.
 *
 * THE FOUR STATES ARE DERIVED, NEVER GUESSED (SPEC-ARTIFACTS §2). Not-run,
 * ran-and-filed-nothing, produced, and waived each come from chain rows --
 * `state`, member count, and whether the track was ever driven. "Produced
 * nothing" is the measured common case on production, so it renders as a plain
 * sentence, never as a skeleton or an apology.
 *
 * ONE STATION AT A TIME, ON TABS. Meridian's `Tabs`/`TabPanel` exist and are
 * the named answer for exactly this pane (SPEC-ARTIFACTS §10); Lindy's
 * `Browser | Terminal` is the reference. Default tab is where the work stands,
 * so arriving here answers "what has it made so far" without a click.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getTrackArtifacts,
  getTrackChain,
  type ArtifactView,
  type StationArtifactView,
} from "@/lib/spine/track.functions";
import { getPrd, savePrd } from "@/lib/discovery.functions";
import { setDecisionForecast, updateDecision } from "@/lib/decisions.functions";
import { deferForecastCheck, reopenForecast, settleForecast } from "@/lib/forecast.functions";
import type { ChainMember, ChainStop } from "@/lib/spine/chain";
import { wordFor } from "@/lib/spine/chain";
import { STATION_ARTIFACT } from "@/lib/spine/attach";
import { relativeTime } from "@/lib/memory-view";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  Action,
  Reading,
  ReadFailedLine,
  RecordSpeaks,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { Prose } from "@/components/meridian/Prose";
import { RunNote } from "@/components/meridian/run-rows";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { ReasonField } from "@/components/meridian/forms";
import { TabPanel, Tabs } from "@/components/meridian/Tabs";

/** What each station exists to do, for the not-run sentence. Display labels only. */
const PURPOSE: Record<string, string> = {
  sense: "It reads the world and surfaces what changed.",
  decide: "It records the call, what it rejected, and what it expects to happen.",
  define: "It turns the decision into a spec.",
  design: "It registers a prototype against the spec.",
  build: "",
  ship: "",
  learn: "",
};

type PrdRow = {
  id: string;
  title: string;
  body_md: string;
  status: string | null;
  updated_at: string;
};

/** The prd status word, on the same five-word scale every surface shares.
 *  A draft carries no chip on purpose: quiet in this system means "nothing to
 *  report", and a chip that says nothing is noise. */
function prdTone(status: string | null): "you" | "pass" | null {
  if (status === "review") return "you";
  if (status === "approved" || status === "shipped") return "pass";
  return null;
}

/*
 * The Plan body. The one artifact whose full row an id-keyed read already
 * returns, so it renders as itself today: title, state, the text itself, and
 * the edit that writes the whole document back (SPEC-ARTIFACTS §5 -- there is
 * no section model on the row, so a partial save would be a fiction).
 */
function PlanSpec({ prdId }: { prdId: string }) {
  const fGet = useServerFn(getPrd);
  const fSave = useServerFn(savePrd);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["track-prd", prdId],
    queryFn: () => fGet({ data: { id: prdId } }),
  });

  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState<string | null>(null);
  const [body, setBody] = React.useState<string | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  const prd = q.data?.prd as PrdRow | undefined;

  const save = useMutation({
    mutationFn: () => {
      const patch: { id: string; title?: string; body_md?: string } = { id: prdId };
      if (title !== null && title.trim() && title !== prd?.title) patch.title = title.trim();
      if (body !== null && body !== prd?.body_md) patch.body_md = body;
      return fSave({ data: patch });
    },
    onSuccess: () => {
      setEditing(false);
      setTitle(null);
      setBody(null);
      setProblem(null);
      void qc.invalidateQueries({ queryKey: ["track-prd", prdId] });
      void qc.invalidateQueries({ queryKey: ["spine-track-chain"] });
    },
    onError: (e: Error) => setProblem(e.message),
  });

  if (q.isLoading) return <Reading>Reading the spec.</Reading>;
  if (q.isError || !prd) {
    return (
      <ReadFailedLine>
        The spec did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-mrd-4">
        <div className="flex flex-wrap items-center gap-mrd-3">
          {prdTone(prd.status) ? (
            <StatusChip status={prdTone(prd.status)!}>{prd.status}</StatusChip>
          ) : null}
          <span className="mrd-meta">saved {relativeTime(prd.updated_at, Date.now())}</span>
        </div>
        <Prose markdown>{prd.body_md}</Prose>
        {/* R-03: the person can act here, and the act is the write the row
            supports -- the whole document back, nothing more specific claimed. */}
        <div>
          <Action
            onClick={() => {
              setTitle(prd.title);
              setBody(prd.body_md);
              setProblem(null);
              setEditing(true);
            }}
          >
            Edit the spec
          </Action>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-mrd-4">
      <Field label="Title" htmlFor={`prd-title-${prdId}`}>
        <Input
          id={`prd-title-${prdId}`}
          value={title ?? ""}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
      </Field>
      <Field label="The spec, as markdown" htmlFor={`prd-body-${prdId}`}>
        <Textarea
          id={`prd-body-${prdId}`}
          rows={16}
          value={body ?? ""}
          onChange={(e) => setBody(e.currentTarget.value)}
        />
      </Field>
      <div className="flex items-center gap-mrd-3">
        <Action variant="primary" busy={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving" : "Save the spec"}
        </Action>
        <Action
          variant="quiet"
          onClick={() => {
            setEditing(false);
            setTitle(null);
            setBody(null);
            setProblem(null);
          }}
        >
          Discard edits
        </Action>
      </div>
      {problem ? <RecordSpeaks>{problem}</RecordSpeaks> : null}
    </div>
  );
}

/*
 * ── THE DECIDE CARD ────────────────────────────────────────────────────────
 * The call, what it rejected, and what it expects to happen (SPEC-ARTIFACTS
 * §4). The forecast block is the moat rendered: what was believed, how we will
 * know, when it falls due -- and, while nothing has graded it, the honest word
 * for that state instead of a placeholder. "Who believed it" always renders,
 * because every live forecast so far is agent-authored and a person reading
 * "what we believed" is entitled to know which of us did.
 */
function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function DecisionCard({ item }: { item: ArtifactView }) {
  const f = item.fields;
  const status = str(f.status);
  const rationale = str(f.rationale);
  const alternatives = Array.isArray(f.alternatives_considered)
    ? f.alternatives_considered.filter((a): a is string => typeof a === "string")
    : [];
  const claim = str(f.forecast_claim);
  const know = str(f.forecast_how_we_will_know);
  const horizon = str(f.forecast_horizon_date);
  const resolution = str(f.forecast_resolution);
  const resolutionRationale = str(f.forecast_resolution_rationale);
  const bySlug = str(f.decided_by_agent_slug);
  const deferred = num(f.forecast_deferred_count);

  // The horizon as a calendar day; the schema wants an instant, the reader
  // wants a day.
  const horizonDay = horizon ? horizon.slice(0, 10) : null;
  const horizonPast = horizon ? Date.parse(horizon) < Date.now() : false;
  const daysPast =
    horizonPast && horizon
      ? Math.max(1, Math.round((Date.now() - Date.parse(horizon)) / 86_400_000))
      : 0;

  return (
    <div className="flex flex-col gap-mrd-4">
      <div className="flex flex-wrap items-center gap-mrd-3">
        {status === "pending" ? (
          <StatusChip status="you">Waiting on you</StatusChip>
        ) : status === "approved" ? (
          <StatusChip status="pass">Approved</StatusChip>
        ) : status === "rejected" ? (
          <StatusChip status="fail">Rejected</StatusChip>
        ) : null}
        <span className="mrd-meta">{relativeTime(item.createdAt, Date.now())}</span>
      </div>

      {rationale ? <Prose markdown={false}>{rationale}</Prose> : null}

      {/* The field that makes a decision a decision. Rendered only from an
          array of strings; anything else in the Json column renders nothing
          rather than being coerced (SPEC-ARTIFACTS §4(2)). */}
      {alternatives.length > 0 ? (
        <div className="flex flex-col gap-mrd-2">
          <span className="mrd-eyebrow">Rejected</span>
          {alternatives.map((a) => (
            <Row key={a} tight lead={a} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-mrd-2 rounded-mrd-chip bg-mrd-sink p-mrd-4">
        <span className="mrd-eyebrow">What we expect to happen</span>
        {claim ? (
          <>
            <RunNote>{claim}</RunNote>
            {know ? (
              <span className="text-mrd-small text-mrd-mute">How we will know: {know}</span>
            ) : null}
            {horizonDay ? (
              <span className="text-mrd-small text-mrd-mute">Due {horizonDay}</span>
            ) : null}
            {/* THE UNGRADED STATE IS THE DESIGN, NOT A GAP. Which nothing it
                is depends on the clock, and both are said plainly. */}
            {!resolution && horizon ? (
              horizonPast ? (
                <span className="font-medium text-mrd-body">
                  Due {daysPast} {daysPast === 1 ? "day" : "days"} ago, not graded.
                </span>
              ) : (
                <span className="text-mrd-small text-mrd-mute">Not due yet.</span>
              )
            ) : null}
            {resolution ? (
              <span className="flex items-center gap-mrd-3">
                <StatusChip
                  status={resolution === "hit" ? "pass" : resolution === "miss" ? "fail" : "hold"}
                >
                  {resolution}
                </StatusChip>
                {resolutionRationale ? (
                  <span className="min-w-0 text-mrd-small text-mrd-mute">
                    {resolutionRationale}
                  </span>
                ) : null}
              </span>
            ) : null}
            {deferred !== null && deferred > 0 ? (
              <span className="text-mrd-small text-mrd-mute">
                Check pushed back {deferred} {deferred === 1 ? "time" : "times"}.
              </span>
            ) : null}
            <span className="mrd-meta">
              {bySlug ? `Recorded by the ${agentDisplayName(bySlug)} agent` : "Recorded by you"}
            </span>
          </>
        ) : (
          <ForecastForm decisionId={item.artifactId} />
        )}
      </div>

      {/* The gate action on the call itself: unblocking it is a real approval,
          refusing it is a real rejection. Nothing here merely shows. */}
      {status === "pending" ? <DecisionVerdict decisionId={item.artifactId} /> : null}
    </div>
  );
}

/*
 * SAY WHAT YOU EXPECT. Write-once, enforced by the server and the database;
 * the form says so BEFORE the press, because a field you cannot edit later is
 * exactly the thing to know going in. This control is the only thing that can
 * move the human-authored forecast count off zero.
 */
function ForecastForm({ decisionId }: { decisionId: string }) {
  const fSet = useServerFn(setDecisionForecast);
  const qc = useQueryClient();
  const [claim, setClaim] = React.useState("");
  const [know, setKnow] = React.useState("");
  const [day, setDay] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      fSet({
        data: {
          decisionId,
          forecast_claim: claim.trim(),
          forecast_how_we_will_know: know.trim(),
          // A date input gives a day, not an instant; midday UTC is the
          // stated convention, not a fabricated precision.
          forecast_horizon_date: `${day}T12:00:00Z`,
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["track-artifacts"] });
      setProblem(null);
    },
    onError: (e: Error) => setProblem(e.message),
  });

  const ready =
    claim.trim().length > 0 && know.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(day);

  return (
    <div className="flex flex-col gap-mrd-3">
      <Field label="What do you expect to happen?" htmlFor={`fc-claim-${decisionId}`}>
        <Textarea
          id={`fc-claim-${decisionId}`}
          rows={2}
          value={claim}
          onChange={(e) => setClaim(e.currentTarget.value)}
          placeholder="Supports answer questions on their first try without escalation"
        />
      </Field>
      <Field label="How will we know?" htmlFor={`fc-know-${decisionId}`}>
        <Input
          id={`fc-know-${decisionId}`}
          value={know}
          onChange={(e) => setKnow(e.currentTarget.value)}
          placeholder="Escalation rate for this intent drops below 10%"
        />
      </Field>
      <Field label="Due by" htmlFor={`fc-day-${decisionId}`}>
        <Input
          id={`fc-day-${decisionId}`}
          type="date"
          value={day}
          onChange={(e) => setDay(e.currentTarget.value)}
        />
      </Field>
      <span className="mrd-meta">Once recorded this cannot be edited.</span>
      <div>
        <Action
          variant="primary"
          busy={save.isPending}
          disabled={!ready || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Recording" : "Record the forecast"}
        </Action>
      </div>
      {problem ? <RecordSpeaks>{problem}</RecordSpeaks> : null}
    </div>
  );
}

/** Approve or refuse the call itself. Both write; neither merely shows. */
function DecisionVerdict({ decisionId }: { decisionId: string }) {
  const fUpdate = useServerFn(updateDecision);
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (status: "approved" | "rejected") => fUpdate({ data: { id: decisionId, status } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["track-artifacts"] }),
  });

  return (
    <div className="flex items-center gap-mrd-3">
      <Action variant="primary" busy={save.isPending} onClick={() => save.mutate("approved")}>
        Approve the call
      </Action>
      <Action busy={save.isPending} onClick={() => save.mutate("rejected")}>
        Reject it
      </Action>
    </div>
  );
}

/*
 * ── DISCOVER'S TWO ARTIFACTS ────────────────────────────────────────────────
 * Signals as they landed, clusters as they formed. Read-only in this slice:
 * their inline actions are the next unit, so nothing here pretends at a
 * control it does not have yet.
 */
function SignalCard({ item, now }: { item: ArtifactView; now: number }) {
  const f = item.fields;
  const content = str(f.content);
  const source = str(f.source);
  const sourceKind = str(f.source_kind);
  const url = str(f.url);
  const themeId = str(f.theme_id);

  return (
    <div className="flex flex-col gap-mrd-2 border-b border-mrd-line-soft pb-mrd-3 last:border-0">
      <span className="text-mrd-label font-medium leading-mrd-snug text-mrd-ink">
        {item.title ?? (content ? content.slice(0, 120) : item.word)}
      </span>
      {content ? <Prose markdown={false}>{content}</Prose> : null}
      <span className="mrd-meta">
        {[
          source,
          sourceKind ?? "unknown",
          relativeTime(item.createdAt, now),
          themeId ? "clustered" : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-mrd-small font-medium text-mrd-you underline underline-offset-2"
        >
          Open the source
        </a>
      ) : null}
    </div>
  );
}

function ThemeCard({ item }: { item: ArtifactView }) {
  const f = item.fields;
  const summary = str(f.summary);
  const status = str(f.status);
  const statusReason = str(f.status_reason);
  const frequency = num(f.frequency);
  const severity = num(f.severity);
  const confidence = num(f.confidence);

  return (
    <div className="flex flex-col gap-mrd-2 border-b border-mrd-line-soft pb-mrd-3 last:border-0">
      <span className="text-mrd-label font-medium leading-mrd-snug text-mrd-ink">
        {item.title ?? item.word}
      </span>
      {summary ? <Prose markdown={false}>{summary}</Prose> : null}
      <span className="mrd-meta">
        {[
          frequency !== null ? `${frequency} signals` : "",
          severity !== null ? `severity ${severity}` : "",
          confidence !== null ? `confidence ${confidence}` : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {status === "dismissed" ? (
        <span className="text-mrd-small text-mrd-mute">
          Dismissed{statusReason ? `: ${statusReason}` : ""}
        </span>
      ) : null}
    </div>
  );
}

/*
 * ── THE LEARN VERDICT ──────────────────────────────────────────────────────
 * PREDICTED · ACTUALLY · WHAT WE NOW BELIEVE (SPEC-ARTIFACTS §9). The predicted
 * half lives on the track's DECISION, so this card joins the learning member to
 * the decide member: the one station whose artifact is a join of two rows.
 * The ungraded state is the design, not a fallback: zero forecasts have ever
 * been graded on a real workspace, and the card names WHICH nothing it is
 * rather than drawing a placeholder verdict.
 */
function LearningCard({ item, decision }: { item: ArtifactView; decision?: ArtifactView }) {
  const f = item.fields;
  const summary = str(f.summary);
  const verdict = str(f.verdict);
  const metricLabel = str(f.metric_label);
  const metricValue = str(f.metric_value);
  const bySlug = str(f.recorded_by_agent_slug);

  const d = decision?.fields;
  const claim = d ? str(d.forecast_claim) : null;
  const know = d ? str(d.forecast_how_we_will_know) : null;
  const horizon = d ? str(d.forecast_horizon_date) : null;
  const resolution = d ? str(d.forecast_resolution) : null;
  const rationale = d ? str(d.forecast_resolution_rationale) : null;
  const resolvedBy = d ? str(d.forecast_resolved_by_agent_slug) : null;

  const horizonDay = horizon ? horizon.slice(0, 10) : null;
  const horizonPast = horizon ? Date.parse(horizon) < Date.now() : false;
  const daysPast =
    horizonPast && horizon
      ? Math.max(1, Math.round((Date.now() - Date.parse(horizon)) / 86_400_000))
      : 0;

  return (
    <div className="flex flex-col gap-mrd-4">
      {claim ? (
        <div className="flex flex-col gap-mrd-2">
          <span className="mrd-eyebrow">Predicted</span>
          <RunNote>{claim}</RunNote>
          {know ? (
            <span className="text-mrd-small text-mrd-mute">How we will know: {know}</span>
          ) : null}
          {horizonDay ? (
            <span className="text-mrd-small text-mrd-mute">Due {horizonDay}</span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-mrd-2">
        <span className="mrd-eyebrow">Actually</span>
        {resolution ? (
          <>
            <span className="flex items-center gap-mrd-3">
              <StatusChip
                status={resolution === "hit" ? "pass" : resolution === "miss" ? "fail" : "hold"}
              >
                {resolution}
              </StatusChip>
              <span className="min-w-0 text-mrd-small text-mrd-mute">{rationale}</span>
            </span>
            <span className="mrd-meta">
              {resolvedBy ? `Graded by the ${agentDisplayName(resolvedBy)} agent` : "Graded by you"}
            </span>
          </>
        ) : horizonPast ? (
          <span className="font-medium text-mrd-body">
            Due {daysPast} {daysPast === 1 ? "day" : "days"} ago and not graded.
          </span>
        ) : horizonDay ? (
          <span className="text-mrd-small text-mrd-mute">Not due until {horizonDay}.</span>
        ) : (
          <span className="text-mrd-small text-mrd-mute">
            Nothing was recorded as expected, so there is nothing to check against.
          </span>
        )}
      </div>

      {summary ? (
        <div className="flex flex-col gap-mrd-2 rounded-mrd-chip bg-mrd-sink p-mrd-4">
          <span className="mrd-eyebrow">What we now believe</span>
          <Prose markdown={false}>{summary}</Prose>
          <span className="flex flex-wrap items-center gap-mrd-3">
            {verdict === "validated" ? (
              <StatusChip status="pass">Held up</StatusChip>
            ) : verdict === "missed" ? (
              <StatusChip status="fail">Did not hold</StatusChip>
            ) : verdict === "mixed" ? (
              <StatusChip status="hold">Mixed</StatusChip>
            ) : null}
            {metricLabel && metricValue ? (
              <span className="font-mrd-mono text-mrd-data tabular-nums text-mrd-mute">
                {metricLabel}: {metricValue}
              </span>
            ) : null}
          </span>
          <span className="mrd-meta">
            {bySlug ? `Recorded by the ${agentDisplayName(bySlug)} agent` : "Recorded by you"}
          </span>
        </div>
      ) : null}

      {decision && !resolution ? (
        <SettleControls decisionId={decision.artifactId} due={horizonPast} />
      ) : null}
      {decision && resolution ? <ReopenControl decisionId={decision.artifactId} /> : null}
    </div>
  );
}

/** Grade the forecast, or push its check back. The closing move of the loop. */
function SettleControls({ decisionId, due }: { decisionId: string; due: boolean }) {
  const fSettle = useServerFn(settleForecast);
  const fDefer = useServerFn(deferForecastCheck);
  const qc = useQueryClient();
  const [choice, setChoice] = React.useState<"hit" | "miss" | "inconclusive" | null>(null);
  const [rationale, setRationale] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);

  const settle = useMutation({
    mutationFn: () =>
      fSettle({ data: { decisionId, resolution: choice ?? "hit", rationale: rationale.trim() } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["track-artifacts"] });
      void qc.invalidateQueries({ queryKey: ["spine-track", decisionId] });
      setProblem(null);
    },
    onError: (e: Error) => setProblem(e.message),
  });
  const defer = useMutation({
    mutationFn: () => fDefer({ data: { decisionId, days: 14 } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["track-artifacts"] });
      setProblem(null);
    },
    onError: (e: Error) => setProblem(e.message),
  });

  if (!due) {
    return (
      <div>
        <Action variant="quiet" busy={defer.isPending} onClick={() => defer.mutate()}>
          Not due yet. Check back in two weeks
        </Action>
        {problem ? <RecordSpeaks>{problem}</RecordSpeaks> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-mrd-3">
      <div role="group" aria-label="What actually happened" className="flex flex-wrap gap-mrd-3">
        {(["hit", "miss", "inconclusive"] as const).map((r) => (
          <button
            key={r}
            type="button"
            data-mrd=""
            onClick={() => setChoice(r)}
            className={`rounded-mrd-ctl px-mrd-4 py-mrd-2 text-mrd-small font-medium transition-colors ${
              choice === r ? "bg-mrd-ink text-mrd-bg" : "text-mrd-body enabled:hover:bg-mrd-hover"
            }`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {r === "hit" ? "It held up" : r === "miss" ? "It did not" : "Cannot tell"}
          </button>
        ))}
      </div>
      <Field label="What actually happened, in one line" htmlFor={`settle-${decisionId}`}>
        <Input
          id={`settle-${decisionId}`}
          value={rationale}
          onChange={(e) => setRationale(e.currentTarget.value)}
          placeholder="Escalations fell from 18% to 6% over the fortnight"
        />
      </Field>
      <div>
        <Action
          variant="primary"
          busy={settle.isPending}
          disabled={!choice || rationale.trim().length === 0 || settle.isPending}
          onClick={() => settle.mutate()}
        >
          {settle.isPending ? "Recording the grade" : "Grade it"}
        </Action>
      </div>
      {problem ? <RecordSpeaks>{problem}</RecordSpeaks> : null}
    </div>
  );
}

/** A wrong verdict nobody can correct is also a false entry. Reopening argues. */
function ReopenControl({ decisionId }: { decisionId: string }) {
  const fReopen = useServerFn(reopenForecast);
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const reopen = useMutation({
    mutationFn: (reason: string) => fReopen({ data: { decisionId, reason } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["track-artifacts"] });
      setOpen(false);
    },
  });

  return open ? (
    <ReasonField
      id={`reopen-${decisionId}`}
      label="Why is this verdict wrong?"
      hint="It becomes the newest entry in the forecast's history, beside the verdict it corrects."
      placeholder="The horizon measure was never instrumented, so inconclusive was recorded without checking"
      commitLabel="Reopen the forecast"
      cancelLabel="Keep the verdict"
      busy={reopen.isPending}
      onCommit={(reason) => reopen.mutate(reason)}
      onCancel={() => setOpen(false)}
    />
  ) : (
    <div>
      <Action variant="quiet" onClick={() => setOpen(true)}>
        Disagree with this verdict
      </Action>
    </div>
  );
}

/*
 * One station's panel. Four states, derived per SPEC-ARTIFACTS §2, branching on
 * rows and counts only -- never on hold prose (§11.5).
 */
function StationPanel({
  stop,
  view,
  decisionItem,
  everDriven,
  hold,
  now,
}: {
  stop: ChainStop;
  view?: StationArtifactView;
  decisionItem?: ArtifactView;
  everDriven: boolean;
  hold: string | null;
  now: number;
}) {
  if (stop.state === "waived") {
    // The person's own words for why this station is off the route. Never an
    // empty pane (SPEC-ARTIFACTS §2).
    return <RecordSpeaks>Waived. {stop.waivedReason ?? "No reason was recorded."}</RecordSpeaks>;
  }

  const hasNotRun = stop.state === "not-reached" || (stop.state === "here" && !everDriven);

  if (hasNotRun) {
    const purpose = PURPOSE[stop.station];
    return (
      <RecordSpeaks>{`${stop.label} has not run yet.${purpose ? ` ${purpose}` : ""}`}</RecordSpeaks>
    );
  }

  if (stop.members.length === 0) {
    // The noun comes from the one vocabulary (STATION_ARTIFACT -> KIND_WORD):
    // "filed no code change", not "filed no changeset".
    const noun = wordFor(STATION_ARTIFACT[stop.station].kind, 1);
    return (
      <div className="flex flex-col gap-mrd-3">
        <RecordSpeaks>{`${stop.label} ran and filed no ${noun}.`}</RecordSpeaks>
        {hold ? <Row tight lead={hold} /> : null}
      </div>
    );
  }

  /*
   * BODIES WHERE THE READ EXISTS. The artifacts read and the chain derive
   * position from the same builder, so they cannot disagree about what exists.
   * While the artifacts read is in flight the member titles render; a kind
   * with no body renderer keeps its title line rather than pretending.
   */
  const items = view?.items;
  const primaryItem =
    items?.find((it) => it.kind === view?.expects.kind && !it.missing) ??
    items?.find((it) => !it.missing);

  const bodyFor = (item: ArtifactView) => {
    switch (item.kind) {
      case "decision":
        return <DecisionCard item={item} />;
      case "signal":
        return <SignalCard item={item} now={now} />;
      case "theme":
        return <ThemeCard item={item} />;
      case "learning":
        return <LearningCard item={item} decision={decisionItem} />;
      case "prd":
        return <PlanSpec prdId={item.artifactId} />;
      default:
        return null;
    }
  };

  if (items) {
    return (
      <div className="flex flex-col gap-mrd-4">
        {primaryItem ? bodyFor(primaryItem) : null}
        {items.map((item) => {
          if (primaryItem && item.artifactId === primaryItem.artifactId && bodyFor(primaryItem)) {
            return null;
          }
          if (!primaryItem && item.kind === "prd" && !item.missing) {
            return null;
          }
          return (
            <MemberLine key={`${item.kind}:${item.artifactId}`} m={toMemberLine(item)} now={now} />
          );
        })}
      </div>
    );
  }

  // Artifacts read not back yet: titles only, from the chain.
  const primaryMember = stop.members.find((m) => m.kind === "prd" && !m.missing);

  return (
    <div className="flex flex-col gap-mrd-3">
      {primaryMember ? <PlanSpec prdId={primaryMember.artifactId} /> : null}
      {stop.members.map((m) =>
        m === primaryMember || (m.kind === "prd" && !m.missing) ? null : (
          <MemberLine key={`${m.kind}:${m.artifactId}`} m={m} now={now} />
        ),
      )}
    </div>
  );
}

/** Same shape, one field fewer -- enough for the title line. */
function toMemberLine(item: ArtifactView): ChainMember {
  return {
    kind: item.kind,
    word: item.word,
    artifactId: item.artifactId,
    station: "",
    createdAt: item.createdAt,
    title: item.title,
    missing: item.missing,
  };
}

function MemberLine({ m, now }: { m: ChainMember; now: number }) {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <Row
      tight
      lead={m.missing ? `This ${m.word} is no longer there` : (m.title ?? cap(m.word))}
      time={relativeTime(m.createdAt, now)}
      action={
        m.missing ? <Value tone="fail">not found</Value> : <Value tone="quiet">{m.word}</Value>
      }
    />
  );
}

export function ArtifactPane({
  trackId,
  active: activeProp,
  onActiveChange,
}: {
  trackId: string;
  /** Controlled tab, so another surface (the chain record) can reveal one. */
  active?: string | null;
  onActiveChange?: (station: string) => void;
}) {
  const fChain = useServerFn(getTrackChain);
  const fArtifacts = useServerFn(getTrackArtifacts);
  const q = useQuery({
    queryKey: ["spine-track-chain", trackId],
    queryFn: () => fChain({ data: { trackId } }),
    // Same beat as the transcript, on the SAME cache entry TrackChain reads:
    // one poll drives both views, and a walk that files something changes the
    // pane within ten seconds without a refresh.
    refetchInterval: 10_000,
  });
  const bodies = useQuery({
    queryKey: ["track-artifacts", trackId],
    queryFn: () => fArtifacts({ data: { trackId } }),
    refetchInterval: 10_000,
  });

  const [activeState, setActiveState] = React.useState<string | null>(null);
  const active = activeProp ?? activeState;
  const onSelect = (id: string) => {
    setActiveState(id);
    onActiveChange?.(id);
  };

  if (q.isLoading) return <Reading>Reading what this work has made.</Reading>;
  if (q.isError) {
    return (
      <ReadFailedLine>
        The record did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );
  }

  const chain = q.data?.chain;
  const track = q.data?.track;
  if (!track || !chain || chain.stops.length === 0) {
    return <ReadFailedLine>That work could not be found.</ReadFailedLine>;
  }

  // Where the work stands wins the first paint; a finished or untouched route
  // falls back to the last stop worth showing. The person's own click always
  // outranks both.
  const standing =
    chain.stops.find((s) => s.state === "here") ??
    [...chain.stops].reverse().find((s) => s.state === "passed") ??
    chain.stops[0];
  const current =
    active && chain.stops.some((s) => s.station === active) ? active : standing.station;
  const now = Date.now();
  const shown = chain.stops.find((s) => s.station === current) ?? chain.stops[0];

  return (
    <Region
      title="What it has made"
      sub="The thing each station filed, rendered as itself. Pick a step to see its output."
    >
      <Tabs<string>
        group={`artifact-pane-${trackId}`}
        label="Stations on this route"
        tabs={chain.stops.map((s) => ({ id: s.station, label: s.label }))}
        active={current}
        onSelect={onSelect}
      />
      <TabPanel group={`artifact-pane-${trackId}`} active={current}>
        <StationPanel
          stop={shown}
          view={bodies.data?.stops.find((s) => s.station === shown.station)}
          decisionItem={bodies.data?.stops
            .find((s) => s.station === "decide")
            ?.items.find((it) => it.kind === "decision" && !it.missing)}
          everDriven={track.drivenAt !== null}
          hold={track.hold}
          now={now}
        />
      </TabPanel>
    </Region>
  );
}

export default ArtifactPane;
