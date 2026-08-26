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
import { deleteSignal, renameTheme, setThemeStatus } from "@/lib/discovery.functions";
import { setDecisionForecast, updateDecision } from "@/lib/decisions.functions";
import { deferForecastCheck, reopenForecast, settleForecast } from "@/lib/forecast.functions";
import type { ChainMember, ChainStop } from "@/lib/spine/chain";
import { wordFor } from "@/lib/spine/chain";
import { STATION_ARTIFACT } from "@/lib/spine/attach";
import { relativeTime } from "@/lib/memory-view";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { supabase } from "@/integrations/supabase/client";
import { buildSrcDoc, type PrototypeFileRow } from "@/lib/prototype-srcdoc";
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
import { Field, Input, ReasonField, Textarea } from "@/components/meridian/forms";
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
 * ── DISCOVER'S TWO ARTIFACTS, NOW ACTIONABLE ────────────────────────────────
 * Signals as they landed, clusters as they formed. The actions are THE
 * ONE-SCREEN's ruled set -- keep/discard a signal, rename a theme -- and they
 * write through the same server functions the full Discover surface uses
 * (`deleteSignal`, `renameTheme`, `setThemeStatus`), so the record cannot
 * disagree about a signal dismissed here versus there. A discard is a removal,
 * said in its own words; a theme decline records its reason and can be taken
 * back, which is what makes declining safe.
 */
function SignalCard({
  item,
  now,
  trackId,
}: {
  item: ArtifactView;
  now: number;
  trackId: string;
}) {
  const f = item.fields;
  const content = str(f.content);
  const source = str(f.source);
  const sourceKind = str(f.source_kind);
  const url = str(f.url);
  const themeId = str(f.theme_id);

  const fDelete = useServerFn(deleteSignal);
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => fDelete({ data: { id: item.artifactId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["track-artifacts", trackId] });
      void qc.invalidateQueries({ queryKey: ["spine-track-chain", trackId] });
    },
  });

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
      <div className="flex items-center gap-mrd-4">
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
        {del.isError ? (
          <span role="status" className="text-mrd-small text-mrd-body">
            {(del.error as Error).message}
          </span>
        ) : (
          <Action variant="quiet" busy={del.isPending} onClick={() => del.mutate()}>
            {del.isPending ? "Removing it" : "Discard this signal"}
          </Action>
        )}
      </div>
    </div>
  );
}

function ThemeCard({ item, trackId }: { item: ArtifactView; trackId: string }) {
  const f = item.fields;
  const summary = str(f.summary);
  const status = str(f.status);
  const statusReason = str(f.status_reason);
  const frequency = num(f.frequency);
  const severity = num(f.severity);
  const confidence = num(f.confidence);

  const fRename = useServerFn(renameTheme);
  const fStatus = useServerFn(setThemeStatus);
  const qc = useQueryClient();
  /** Which inline editor is open, if any. One at a time on one card. */
  const [openPanel, setOpenPanel] = React.useState<"rename" | "dismiss" | null>(null);
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["track-artifacts", trackId] });
    void qc.invalidateQueries({ queryKey: ["spine-track-chain", trackId] });
  };

  const rename = useMutation({
    mutationFn: (title: string) =>
      fRename({ data: { theme_id: item.artifactId, title } }),
    onSuccess: () => {
      setOpenPanel(null);
      invalidate();
    },
  });
  const setStatus = useMutation({
    mutationFn: (input: { status: "new" | "dismissed"; reason?: string }) =>
      fStatus({ data: { theme_id: item.artifactId, ...input } }),
    onSuccess: () => {
      setOpenPanel(null);
      invalidate();
    },
  });

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

      <div className="flex flex-wrap items-center gap-mrd-2">
        {status !== "dismissed" ? (
          <Action variant="quiet" onClick={() => setOpenPanel(openPanel === "dismiss" ? null : "dismiss")}>
            Not a pattern
          </Action>
        ) : (
          <Action
            variant="quiet"
            busy={setStatus.isPending}
            onClick={() => setStatus.mutate({ status: "new" })}
          >
            {setStatus.isPending ? "Bringing it back" : "Bring it back"}
          </Action>
        )}
        <Action variant="quiet" onClick={() => setOpenPanel(openPanel === "rename" ? null : "rename")}>
          Rename this theme
        </Action>
      </div>

      {openPanel === "rename" ? (
        <ReasonField
          id={`theme-rename-${item.artifactId}`}
          label="What should this theme be called?"
          hint="Your name replaces the generated one, everywhere this theme appears."
          placeholder="Checkout friction on mobile"
          commitLabel="Rename it"
          cancelLabel="Keep the current name"
          busy={rename.isPending}
          onCommit={(title) => rename.mutate(title)}
          onCancel={() => setOpenPanel(null)}
        />
      ) : null}
      {openPanel === "dismiss" ? (
        <ReasonField
          id={`theme-dismiss-${item.artifactId}`}
          label="Why is this not a pattern?"
          hint="Recorded beside the decline, so bringing it back later starts from what you knew."
          placeholder="Two of the four mentions are the same account"
          commitLabel="Dismiss it"
          cancelLabel="Keep it"
          busy={setStatus.isPending}
          onCommit={(reason) => setStatus.mutate({ status: "dismissed", reason })}
          onCancel={() => setOpenPanel(null)}
        />
      ) : null}
      {(rename.error || setStatus.error) && openPanel === null ? (
        <span role="status" className="text-mrd-small text-mrd-body">
          {((rename.error ?? setStatus.error) as Error).message}
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
function LearningCard({
  item,
  decisions,
}: {
  item: ArtifactView;
  /** Every decision the track filed, so the join can be BY KEY. */
  decisions?: ArtifactView[];
}) {
  const f = item.fields;
  /*
   * THE JOIN IS BY KEY, NEVER BY POSITION (D-9.8). The learning carries
   * `decision_id` -- it names the one call its verdict grades. Matching "the
   * first decision on the decide stop" put a verdict beside whatever forecast
   * happened to sit first, and on a track that decided twice that was a
   * confidently wrong pairing of predicted and actual. No match renders no
   * forecast half at all, which is honest; a wrong half never is.
   */
  const decisionId = str(f.decision_id);
  const decision = decisionId
    ? decisions?.find((x) => x.artifactId === decisionId && !x.missing)
    : undefined;
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
  // What a deferral writes (D-9.9): rendered, so pressing the control has a
  // visible effect instead of landing a write nothing on screen reflects.
  const nextCheck = d ? str(d.forecast_next_check_at) : null;

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
        {!resolution && nextCheck ? (
          <span className="mrd-meta">Next look: {nextCheck.slice(0, 10)}.</span>
        ) : null}
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
 * ── THE BUILD CARD, WITH ITS REVIEW ────────────────────────────────────────
 * The change the run wrote, and the verdict `studio.review` filed against it
 * (queue item 23: the review used to live in a column nothing selected).
 *
 * THE HONEST EMPTY IS THE COMMON CASE AND IT SAYS SOMETHING TRUE:
 * studio.review has never once run successfully (0 of 45 changesets carry a
 * review), so "its reviewer has not reported yet" is the sentence a person
 * will see first — not an apology, and never a fabricated verdict.
 *
 * Findings render facts before opinions (`deterministic` marks which), capped
 * at 25 with a printed remainder, because the deterministic loops are unbounded
 * by the writer and a list without a cap is a wall.
 */
type ReviewFindingView = {
  severity?: string;
  category?: string;
  path?: string | null;
  line?: number | null;
  issue?: string;
  fix?: string | null;
  deterministic?: boolean;
};

type ChangesetReviewView = {
  verdict?: string;
  summary?: string;
  findings?: ReviewFindingView[];
  files_reviewed?: number;
  reviewer_model?: string | null;
  reviewed_at?: string;
};

function parseReview(raw: unknown): ChangesetReviewView | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ChangesetReviewView;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as ChangesetReviewView;
  return null;
}

/*
 * THE DRAWING, SHOWN AS A DRAWING (founder, 2026-08-25: "what is happening
 * under each station... needs to be seen").
 *
 * Design's station files real prototypes with real files, `/p/$slug` has
 * rendered them in a sandboxed iframe for weeks — and this pane showed a
 * one-line TITLE, because `prototype` fell through the kind switch to null.
 * The most visual station in the product was the least visible one here.
 *
 * The read is the caller's own RLS-scoped client, the exact pattern the
 * public page uses minus the share gate: a member sees the workspace's
 * prototype, a stranger reads nothing and the card says the read came back
 * empty rather than pretending. The srcdoc builder is SHARED with `/p`
 * (`@/lib/prototype-srcdoc`) so the two previews cannot drift.
 *
 * The sandbox carries no `allow-same-origin` — scripts run isolated, and a
 * prototype cannot read the app's storage or cookies from inside the frame.
 */
function PrototypeCard({ item }: { item: ArtifactView }) {
  const proto = useQuery({
    queryKey: ["pane-prototype", item.artifactId],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("prototypes")
        .select("id,name,entry_path,share_slug,is_public,created_at")
        .eq("id", item.artifactId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return null;
      const { data: files, error: fErr } = await supabase
        .from("prototype_files")
        .select("path,content,language")
        .eq("prototype_id", row.id);
      if (fErr) throw new Error(fErr.message);
      return { row, files: (files ?? []) as PrototypeFileRow[] };
    },
    staleTime: 60_000,
  });

  if (proto.isLoading) {
    return <span className="mrd-meta">Opening the drawing…</span>;
  }
  // A failed read is said, never dressed as an empty state (R-16).
  if (proto.isError) {
    return <RecordSpeaks>The drawing could not be read just now.</RecordSpeaks>;
  }
  if (!proto.data) {
    return <RecordSpeaks>This drawing is not visible from here.</RecordSpeaks>;
  }

  const { row, files } = proto.data;
  return (
    <div className="flex flex-col gap-mrd-3">
      <div className="flex flex-wrap items-center gap-mrd-3">
        <span className="font-medium text-mrd-ink">{row.name}</span>
        <span className="mrd-meta">{relativeTime(item.createdAt, Date.now())}</span>
        {row.is_public && row.share_slug ? (
          <a
            className="text-mrd-small text-mrd-mute underline underline-offset-2"
            href={`/p/${row.share_slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Open full size
          </a>
        ) : null}
      </div>
      {files.length > 0 ? (
        <iframe
          title={`Prototype: ${row.name}`}
          sandbox="allow-scripts allow-forms allow-modals"
          srcDoc={buildSrcDoc(files, row.entry_path)}
          className="h-[420px] w-full rounded-mrd-card border border-mrd-line bg-canvas"
        />
      ) : (
        <RecordSpeaks>The drawing has no files on the record.</RecordSpeaks>
      )}
      <span className="mrd-meta">
        {files.length} {files.length === 1 ? "file" : "files"}, rendered exactly as filed.
      </span>
    </div>
  );
}

function ChangesetCard({ item }: { item: ArtifactView }) {
  const f = item.fields;
  const summary = str(f.summary);
  const status = str(f.status);
  const repo = str(f.repo);
  const branch = str(f.branch);
  const prUrl = str(f.pr_url);
  const review = parseReview(f.code_review);

  return (
    <div className="flex flex-col gap-mrd-4">
      <div className="flex flex-wrap items-center gap-mrd-3">
        <span className="text-mrd-label font-medium text-mrd-ink">{item.title ?? item.word}</span>
        <span className="mrd-meta">{relativeTime(item.createdAt, Date.now())}</span>
      </div>
      {summary ? <Prose markdown={false}>{summary}</Prose> : null}
      <span className="mrd-meta">
        {[repo, branch ? `branch ${branch}` : "", prUrl ? "pull request open" : ""]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {prUrl ? (
        <a
          href={prUrl}
          target="_blank"
          rel="noreferrer"
          className="text-mrd-small font-medium text-mrd-you underline underline-offset-2"
        >
          Open the pull request
        </a>
      ) : null}

      {/* THE REVIEW, OR THE TRUTH ABOUT ITS ABSENCE. */}
      <div className="flex flex-col gap-mrd-2 rounded-mrd-chip bg-mrd-sink p-mrd-4">
        <span className="mrd-eyebrow">What the reviewer found</span>
        {!review || !review.verdict || review.verdict === "unreviewed" ? (
          <RecordSpeaks>
            The reviewer has not reported on this change yet. It runs as part of Build, before
            anything is proposed to merge.
          </RecordSpeaks>
        ) : (
          <>
            <span className="flex items-center gap-mrd-3">
              <StatusChip
                status={
                  review.verdict === "approve"
                    ? "pass"
                    : review.verdict === "block"
                      ? "fail"
                      : "hold"
                }
              >
                {review.verdict === "approve"
                  ? "Nothing blocking"
                  : review.verdict === "block"
                    ? "Blocked"
                    : "Revise"}
              </StatusChip>
              {review.summary ? (
                <span className="min-w-0 text-mrd-small text-mrd-mute">{review.summary}</span>
              ) : null}
            </span>

            {(review.findings ?? []).length > 0 ? (
              <div className="flex flex-col gap-mrd-2">
                {(review.findings ?? []).slice(0, 25).map((fd, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-0.5 border-b border-mrd-line-soft pb-mrd-2 last:border-0"
                  >
                    <span className="text-mrd-small font-medium text-mrd-body">
                      {[fd.severity, fd.category, fd.deterministic ? "checked" : "judged"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {fd.issue ? <RunNote>{fd.issue}</RunNote> : null}
                    {fd.fix ? (
                      <span className="text-mrd-small text-mrd-mute">Fix: {fd.fix}</span>
                    ) : null}
                    {fd.path ? (
                      <span className="font-mrd-mono text-mrd-data text-mrd-faint">
                        {fd.path}
                        {fd.line ? `:${fd.line}` : ""}
                      </span>
                    ) : null}
                  </div>
                ))}
                {(review.findings ?? []).length > 25 ? (
                  <p className="font-mrd-mono text-mrd-small tabular-nums text-mrd-faint">
                    {(review.findings ?? []).length - 25} further findings not shown here.
                  </p>
                ) : null}
              </div>
            ) : null}

            <span className="mrd-meta">
              {[
                review.files_reviewed != null
                  ? `${review.files_reviewed} ${review.files_reviewed === 1 ? "file" : "files"} reviewed`
                  : "",
                review.reviewer_model ? `reviewer ${review.reviewer_model}` : "",
                review.reviewed_at ? relativeTime(review.reviewed_at, Date.now()) : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/*
 * One station's panel. Four states, derived per SPEC-ARTIFACTS §2, branching on
 * rows and counts only -- never on hold prose (§11.5).
 */
/**
 * ── THE PLAN'S STEPS, AS STEPS ─────────────────────────────────────────────
 *
 * 118 filed tasks — the third most common artifact the spine files — rendered
 * as bare title lines, because `bodyFor` serves only the station's PRIMARY
 * artifact and a task is never primary. A plan read as "the spec, then six
 * opaque rows" hides exactly the thing a person scans a breakdown for: the
 * order, what each step is, and whether it is done.
 *
 * One block for all of them, ordered by `seq` (filing order when `seq` is
 * absent), each row carrying its number, title, status word, and the risk if
 * one was recorded. Exported for its test.
 */
export function TaskSteps({ items }: { items: ArtifactView[] }) {
  const ordered = [...items].sort((a, b) => {
    const sa = num(a.fields.seq);
    const sb = num(b.fields.seq);
    if (sa !== null && sb !== null) return sa - sb;
    if (sa !== null) return -1;
    if (sb !== null) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
  return (
    <div className="flex flex-col gap-mrd-2 border-b border-mrd-line-soft pb-mrd-3 last:border-0">
      <span className="mrd-meta">
        {ordered.length === 1
          ? "The one step of this plan"
          : `The ${ordered.length} steps of this plan`}
      </span>
      <ol className="flex flex-col gap-mrd-2">
        {ordered.map((t, i) => {
          const status = str(t.fields.status);
          const risk = str(t.fields.risk);
          const estimate = num(t.fields.estimate_hours);
          const detail = str(t.fields.detail);
          const done = status === "done" || status === "completed";
          return (
            <li key={t.artifactId} className="flex flex-col gap-mrd-1">
              <span className="flex items-baseline gap-mrd-2">
                <span className="mrd-meta tabular-nums">{num(t.fields.seq) ?? i + 1}</span>
                <span
                  className={
                    done
                      ? "text-mrd-label leading-mrd-snug text-mrd-mute line-through"
                      : "text-mrd-label leading-mrd-snug text-mrd-ink"
                  }
                >
                  {t.title ?? t.word}
                </span>
                {done ? <StatusChip status="pass">Done</StatusChip> : null}
                {!done && status ? <span className="mrd-meta">{status}</span> : null}
              </span>
              {detail ? <Prose markdown={false}>{detail}</Prose> : null}
              {risk || estimate !== null ? (
                <span className="mrd-meta">
                  {[risk ? `risk: ${risk}` : "", estimate !== null ? `~${estimate}h` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * ── THE MACHINE THE BUILD CREW RAN ─────────────────────────────────────────
 *
 * A mission member said only its title. The row carries the goal the crew was
 * given, how many hops it took, and whether the verify loop cycled — the three
 * facts that answer "what did the crew set out to do, and did it check its own
 * work". Exported for its test.
 */
export function MissionCard({ item }: { item: ArtifactView }) {
  const f = item.fields;
  const goal = str(f.goal);
  const status = str(f.status);
  const hops = num(f.hop_count);
  const verifyCycles = num(f.verify_cycles);
  const completedAt = str(f.completed_at);
  return (
    <div className="flex flex-col gap-mrd-2 border-b border-mrd-line-soft pb-mrd-3 last:border-0">
      <span className="flex items-baseline gap-mrd-2">
        <span className="text-mrd-label font-medium leading-mrd-snug text-mrd-ink">
          {item.title ?? item.word}
        </span>
        {completedAt ? <StatusChip status="pass">Completed</StatusChip> : null}
        {!completedAt && status ? <span className="mrd-meta">{status}</span> : null}
      </span>
      {goal ? <Prose markdown={false}>{goal}</Prose> : null}
      <span className="mrd-meta">
        {[
          hops !== null ? `${hops} ${hops === 1 ? "hop" : "hops"}` : "",
          verifyCycles !== null && verifyCycles > 0
            ? `checked its own work ${verifyCycles} ${verifyCycles === 1 ? "time" : "times"}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </div>
  );
}

function StationPanel({
  stop,
  view,
  decisions,
  everDriven,
  hold,
  now,
  trackId,
}: {
  stop: ChainStop;
  view?: StationArtifactView;
  /** Every decision this track filed, for the by-key learning join. */
  decisions?: ArtifactView[];
  everDriven: boolean;
  hold: string | null;
  now: number;
  /** Routes the Discover cards' writes back to this pane's cache entries. */
  trackId: string;
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
        return <SignalCard item={item} now={now} trackId={trackId} />;
      case "theme":
        return <ThemeCard item={item} trackId={trackId} />;
      case "learning":
        return <LearningCard item={item} decisions={decisions} />;
      case "changeset":
        return <ChangesetCard item={item} />;
      case "prd":
        return <PlanSpec prdId={item.artifactId} />;
      case "prototype":
        return <PrototypeCard item={item} />;
      default:
        return null;
    }
  };

  if (items) {
    /*
     * TASKS AND MISSIONS NEVER GET TO BE PRIMARY — no station expects them —
     * so under the primary-plus-lines rule they rendered as bare titles
     * forever: the plan's whole breakdown as opaque rows. They render as
     * themselves instead: the tasks as ONE ordered step list, each mission as
     * its card. Everything else keeps the title line it had.
     */
    const stepItems = items.filter((it) => it.kind === "task" && !it.missing);
    const missionItems = items.filter((it) => it.kind === "mission" && !it.missing);
    return (
      <div className="flex flex-col gap-mrd-4">
        {primaryItem ? bodyFor(primaryItem) : null}
        {stepItems.length > 0 ? <TaskSteps items={stepItems} /> : null}
        {missionItems.map((m) => (
          <MissionCard key={`mission:${m.artifactId}`} item={m} />
        ))}
        {items.map((item) => {
          if (primaryItem && item.artifactId === primaryItem.artifactId && bodyFor(primaryItem)) {
            return null;
          }
          if (!primaryItem && item.kind === "prd" && !item.missing) {
            return null;
          }
          if ((item.kind === "task" || item.kind === "mission") && !item.missing) {
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
  isRunning = false,
}: {
  trackId: string;
  /** Controlled tab, so another surface (the chain record) can reveal one. */
  active?: string | null;
  onActiveChange?: (station: string) => void;
  /** PHASE 3: Poll faster during active run to show live updates. */
  isRunning?: boolean;
}) {
  const fChain = useServerFn(getTrackChain);
  const fArtifacts = useServerFn(getTrackArtifacts);
  const q = useQuery({
    queryKey: ["spine-track-chain", trackId],
    queryFn: () => fChain({ data: { trackId } }),
    // PHASE 3: During active run, poll faster (500ms) to show live updates.
    // After run completes, poll slower (10s) to reduce DB load.
    refetchInterval: isRunning ? 500 : 10_000,
  });
  const bodies = useQuery({
    queryKey: ["track-artifacts", trackId],
    queryFn: () => fArtifacts({ data: { trackId } }),
    refetchInterval: isRunning ? 500 : 10_000,
  });

  const [activeState, setActiveState] = React.useState<string | null>(null);
  const active = activeProp ?? activeState;
  /** Marks selections that ORIGINATED inside the pane, so an external one
   *  (a chain-row click) can be told apart and given the focus move. */
  const lastInternal = React.useRef<string | null>(null);
  const onSelect = (id: string) => {
    lastInternal.current = id;
    setActiveState(id);
    onActiveChange?.(id);
  };

  /*
   * A TAB CHANGE FROM ELSEWHERE IS A CONTEXT CHANGE (D-7.2), so focus moves
   * with it -- R-19's keyboard clause. A selection made by clicking a tab
   * already holds focus where the person put it and is skipped.
   */
  React.useEffect(() => {
    if (activeProp == null) return;
    if (activeProp === lastInternal.current) {
      lastInternal.current = null;
      return;
    }
    document.getElementById(`artifact-pane-${trackId}-tab-${activeProp}`)?.focus();
  }, [activeProp, trackId]);

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
      {/* The pane polls; when the shown station's body changes (a spec saved,
          a decision recorded), the change is said politely rather than
          silently repainting. */}
      <div aria-live="polite">
        <TabPanel group={`artifact-pane-${trackId}`} active={current}>
          <StationPanel
            stop={shown}
            view={bodies.data?.stops.find((s) => s.station === shown.station)}
            decisions={bodies.data?.stops
              .find((s) => s.station === "decide")
              ?.items.filter((it) => it.kind === "decision" && !it.missing)}
            everDriven={track.drivenAt !== null}
            hold={track.hold}
            now={now}
            trackId={trackId}
          />
        </TabPanel>
      </div>
    </Region>
  );
}

export default ArtifactPane;
