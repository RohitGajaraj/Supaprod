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
 * ONE STATION AT A TIME, NO LONGER ON TABS. SPEC-ARTIFACTS §10 named Meridian's
 * `Tabs`/`TabPanel` for this pane, and that held until the founder removed the
 * pane's own tab row and then the strip that replaced it (2026-09-02, see the
 * render function's own header below) -- this pane now follows the selected
 * transcript row, with no tablist anywhere on the page. The focus target below
 * is `role="region"`, not `TabPanel`'s `role="tabpanel"`, for exactly that
 * reason (P-16): a tabpanel with no tablist is an orphaned ARIA role.
 */
import * as React from "react";
import { failureLine } from "@/lib/error-copy";
import { humanizeText } from "@/lib/ai/humanize";
import { panelSaysItFiledNothing } from "@/components/track/who-reports-an-empty-station";
import { groupByThePattern } from "@/components/track/group-by-the-pattern";
import { enterMotion } from "@/components/spine/enter-motion";
import { usePrefersReducedMotion } from "@/components/knowledge/graph-visual";
import { justGrouped } from "@/components/track/just-grouped";
import { fileNameFor, stationFile, tookItLine } from "@/components/track/station-file";
import { WhatWereSolving } from "@/components/track/WhatWereSolving";
import { OpenQuestions } from "@/components/track/OpenQuestions";
import { weWrote, whoWroteLine } from "@/components/track/how-much-of-this-we-wrote";
import { whatItProduced } from "@/components/track/what-it-produced";
import {
  offerToConnect,
  sourceLine,
  sourceVerdict,
} from "@/components/track/discover-has-no-sources";
import { AskInPlace } from "@/components/connections/AskInPlace";
import { plainProse } from "@/lib/plain-prose";
/*
 * EVERY plain-text `Prose` on this pane runs agent-written text through
 * `plainProse`, including the columns that carry no markdown today. Four of
 * them measure zero right now -- theme summary, learning summary, changeset
 * summary, task detail -- and that is a fact about this week's rows rather than
 * about the platform. The same agents write all of these, and the four that DO
 * carry markers were not special; they were just the ones that had been written
 * to more. Covering only the measured ones would be fitting the product to the
 * data sitting in the database.
 */
import { FORECAST_SAYS } from "@/components/learn/forecast-words";
import { bandReading, bandShape } from "@/components/learn/forecast-band-words";
import type { ForecastResolution } from "@/lib/brain/forecast-resolution";
import { NO_NON_GOALS, noContractLine, specContract } from "@/components/track/spec-contract";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  checkForecastObservable,
  getTrackActivity,
  getTrackArtifacts,
  getTrackChain,
  type ArtifactView,
  type StationArtifactView,
} from "@/lib/spine/track.functions";
import { getPrd, savePrd } from "@/lib/discovery.functions";
import { deleteSignal, renameTheme, setThemeStatus } from "@/lib/discovery.functions";
import { getChangesetDiff } from "@/lib/studio.functions";
import { computeHunks } from "@/lib/ai/studio-hunks";
import { CodeDiff } from "@/components/studio/CodeDiff";
import { forecastRefusal, setDecisionForecast, updateDecision } from "@/lib/decisions.functions";
import { decisionsForGrading } from "@/components/track/graded-decisions";
import { clusteredInto } from "@/components/track/clustered-into";
import { saidOnce } from "@/components/track/said-once";
import { deferForecastCheck, reopenForecast, settleForecast } from "@/lib/forecast.functions";
import type { ChainMember, ChainStop } from "@/lib/spine/chain";
import { wordFor } from "@/lib/spine/chain";
import { STATION_ARTIFACT } from "@/lib/spine/attach";
import { relativeTime } from "@/lib/memory-view";
import { useWorkspace } from "@/hooks/use-workspace";
import { releaseStanding, shortSha } from "@/components/track/release-words";
import { formatDeadlineDate } from "@/components/track/expiry-deadline";
import { agentDisplayName, type AgentStation } from "@/lib/agent-vocabulary";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { buildSrcDoc, type PrototypeFileRow } from "@/lib/prototype-srcdoc";
import {
  Action,
  Diffstat,
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
import {
  promotionBarFor,
  resolveAutonomyPolicy,
  type AutonomyPolicyRow,
} from "@/lib/autonomy-policy";
import { becameWorkOnItsOwn } from "@/lib/spine/promote";
import { Verdict } from "@/components/meridian/verdict";
import { verdictProps } from "@/components/track/verdict-reading";
import { PlaybookFilesPanel } from "@/components/track/PlaybookFiles";
import { AppFrame, RunningApp } from "@/components/track/AppFrame";

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
  /** The outcome contract. `getPrd` selects *, so this was always arriving. */
  contract?: unknown;
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
/**
 * The three clauses, with non-goals carrying the same weight as the rest.
 *
 * SESSION-1's brief asks for the spec "section by section as it is written,
 * non-goals with equal weight", and equal weight is the whole instruction: they
 * are the half that stops the wrong thing being built correctly, and the half
 * every template demotes to a footnote. Same heading, same type, same order of
 * appearance as what the spec IS for.
 */
function SpecPromise({ contract, body }: { contract: unknown; body: string | null }) {
  const c = specContract(contract);

  /*
   * THE BODY IS PASSED IN BECAUSE THE OLD SENTENCE WAS DISPROVED BY IT.
   *
   * This block used to say "nothing on the record says what it is for, how
   * anyone would know it worked, or what it is deliberately not doing" and
   * then render `prd.body_md` immediately underneath, where 94 of the 117
   * empty-contract specs set out their success metrics under a heading. See
   * `spec-contract.ts` for the measurement and for why this detects the
   * sections rather than extracting them.
   */
  if (c.empty) return <RecordSpeaks>{noContractLine(body)}</RecordSpeaks>;

  return (
    <div className="flex flex-col gap-mrd-3 rounded-mrd-chip bg-mrd-sink p-mrd-4">
      {c.intent ? (
        <div className="flex flex-col gap-mrd-1">
          <span className="mrd-eyebrow">What it is for</span>
          <p className="mrd-copy max-w-[62ch]">{c.intent}</p>
        </div>
      ) : null}

      {c.measures.length > 0 ? (
        <div className="flex flex-col gap-mrd-1">
          <span className="mrd-eyebrow">How we will know</span>
          {c.measures.map((m) => (
            <p key={m} className="mrd-copy max-w-[62ch]">
              {m}
            </p>
          ))}
        </div>
      ) : null}

      {/* EQUAL WEIGHT, and the absent case is stated rather than omitted: a
          spec that drew no edges looks identical to one that did if this
          section simply disappears. */}
      <div className="flex flex-col gap-mrd-1">
        <span className="mrd-eyebrow">What it is not doing</span>
        {c.nonGoals.length > 0 ? (
          c.nonGoals.map((g) => (
            <p key={g} className="mrd-copy max-w-[62ch]">
              {g}
            </p>
          ))
        ) : (
          <p className="mrd-meta">{NO_NON_GOALS}</p>
        )}
      </div>
    </div>
  );
}

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
      <ReadFailedLine error={q.error}>
        The spec did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-mrd-4">
        {/*
         * ── THE EDIT CONTROL CAME UP HERE (P-24) ──────────────────────────
         *
         * It sat under the whole markdown body, which on a real spec is several
         * screens down: the founder's report was *"it needs to be clickable,
         * viewable, editable"*, and an editor a person has to scroll a document
         * to find is one they will not find. The status and the save time were
         * already on this line and it had room.
         */}
        <div className="flex flex-wrap items-center justify-between gap-mrd-3">
          <span className="flex flex-wrap items-center gap-mrd-3">
            {prdTone(prd.status) ? (
              <StatusChip status={prdTone(prd.status)!}>{prd.status}</StatusChip>
            ) : null}
            <span className="mrd-meta">saved {relativeTime(prd.updated_at, Date.now())}</span>
          </span>
          {/* R-03: the person can act here, and the act is the write the row
              supports -- the whole document back, nothing more specific. */}
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
        {/*
          WHAT IT PROMISES, ABOVE WHAT IT SAYS. The contract is the part Build
          is measured against and Ship reads; the body is the prose around it.

          THE SECOND HALF OF THIS NOTE USED TO BE WRONG AND IS WORTH KEEPING AS
          A CORRECTION. It read: "113 of 115 specs carry no contract at all, so
          this block is most often the honest statement that nothing bounds this
          work." The count was right and the conclusion was not. It is now 117
          of 119, and 96 of those 117 DO bound the work, in the body rendered on
          the very next line: 94 under a success metrics or acceptance criteria
          heading, 20 under non-goals, with only 21 saying neither. So the block
          was most often a false statement standing directly on top of its own
          disproof. It now reads the body before it speaks.
        */}
        <SpecPromise contract={prd.contract} body={prd.body_md} />
        <Prose markdown>{prd.body_md}</Prose>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-mrd-4">
      {/*
       * SAVE ABOVE THE FIELDS, for the reason the Edit control moved up: the
       * body is a 16-row textarea, so a commit control under it is ~600px below
       * the fold on the pane this opens in. A person who cannot see Save does
       * not know the edit is committable.
       *
       * Discard sits beside it rather than under, because the two are one
       * decision and separating them makes the destructive one look incidental.
       */}
      <div className="flex flex-wrap items-center gap-mrd-3">
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
/**
 * THE PRODUCT'S WORD FOR A FORECAST'S RESULT, NOT THE COLUMN'S.
 *
 * `forecast-words.ts` exists, says so in its own header ("two surfaces must
 * never call one thing two things"), and had one caller: `ForecastDeskPanel` on
 * /learn. This pane printed the stored value instead, so /learn said "it went
 * the other way" and the run screen said "miss" about the same row. 91 of the
 * 176 forecasts in this database are resolved, so that is the common case and
 * not an edge.
 *
 * It matters most here of all places. §12 maps Verdict to "What actually
 * happened. Beside the expectation. That pairing is the product." The block
 * below is that pairing, and half of it was the engine talking.
 *
 * AN UNKNOWN VALUE STILL RENDERS, rather than blanking. A fourth resolution
 * would be a schema change nobody has made, and if one ever arrives a person
 * seeing the raw word is better served than a person seeing nothing.
 */
function forecastSays(resolution: string): string {
  return FORECAST_SAYS[resolution as ForecastResolution] ?? resolution;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function DecisionCard({ item }: { item: ArtifactView }) {
  const f = item.fields;
  const status = str(f.status);
  /*
   * ── A BRIDGE, AND THE CONDITION THAT ENDS IT ──────────────────────────
   * Measured on production 2026-08-27: decisions.rationale holds 1 dashed row
   * of 367, and it is the NEWEST row in the table, written at 23:10:27 UTC.
   * S0's backfill ran around 17:30 UTC and measured zero, so this row was
   * written clean-slate afterwards and came out dashed. The column's WRITE PATH
   * is not sanitised; the clean history is what hid it.
   *
   * The seven sites S0 wrapped were agent_runs.output in loop.server.ts.
   * Whatever writes a decision's rationale is a different writer and never got
   * runOutput. Filed to them with the row and the timestamp.
   *
   * Until that lands the founder would otherwise meet an em dash in the middle
   * of the most important card in the product, so the repo's own sanitiser runs
   * over it here. It is idempotent, so it no-ops the moment the write path is
   * closed. **When the writer sanitises AND the stored rows are clean, delete
   * this and render the column directly**, exactly as the transcript's bridge
   * was deleted in RUN-27 once both of its conditions were met.
   *
   * The words are untouched; humanizeText moves punctuation and strips
   * invisible characters, and leaves fenced code alone.
   */
  /* `plainProse` after `humanizeText`: the dashes are the founder's rule and
     the asterisks are the same tell one layer along. This rationale is the one
     that put "*after*" on the Decide tab with its markers showing. */
  const rationale = str(f.rationale) ? plainProse(humanizeText(str(f.rationale) as string)) : null;
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

  /*
   * THE FORECAST AS A BAND (gap #15, U8). Every judgement here is
   * `src/lib/spine/forecast-band.ts`'s, which S0 shipped today with its
   * migration; `forecast-band-words.ts` only chooses the sentences.
   *
   * ── WHY THIS IS CORRECT BEFORE THE COLUMNS ARE IN `FIELDS` ──────────────
   * `FIELDS.decision` (`track.functions.ts`, S0's) does not select the band
   * columns yet, so these read `undefined` today and `bandFor` answers
   * `unknown` -- which is **the right answer for all 182 forecasts on record**,
   * because measured the minute the columns landed, ZERO carry a predicted
   * value, a threshold, an observation count, a metric or a direction. So this
   * renders the truth now and the real band the moment S0 widens the map. Ask
   * filed; no latent wrong render either way.
   */
  const band = {
    direction: (str(f.forecast_direction) as "lower-is-better" | "higher-is-better" | null) ?? null,
    driftingAt: num(f.forecast_band_drifting_at),
    missedAt: num(f.forecast_band_missed_at),
    observations: num(f.forecast_observations),
  };
  const reading = bandReading(num(f.forecast_predicted), band);
  const shape = bandShape(band);

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
          {/*
            NOT `tight`, and this one was the most expensive of the four.
            Measured on production 2026-08-27: across 603 stored alternatives the
            MEAN length is 185 characters and the longest is 366. One clamped
            line shows perhaps seventy, so roughly two thirds of every rejected
            option was hidden on the field this card's own comment calls "the
            field that makes a decision a decision". `tight`'s contract is a row
            whose full content has a detail view to open; an alternative is a
            string on the decision row and has none, so the clip was the only
            copy a person would ever see.
          */}
          {alternatives.map((a) => (
            <Row key={a} lead={a} />
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
                  {forecastSays(resolution)}
                </StatusChip>
                {resolutionRationale ? (
                  <span className="min-w-0 text-mrd-small text-mrd-mute">
                    {resolutionRationale}
                  </span>
                ) : null}
              </span>
            ) : null}
            {/*
              HOW FAR OFF, AND WHAT THE SYSTEM DID ABOUT IT (U8). The chip above
              says hit or miss; this says the distance and the response, which
              U8 calls "the half nobody has ever seen". On every forecast on
              record today it says the honest thing instead: recorded as a
              single number, so it can only be right or wrong.
            */}
            <span className="text-mrd-small text-mrd-mute">{reading.says}</span>
            {shape ? <span className="mrd-meta">{shape}</span> : null}
            {reading.did ? (
              <span className="text-mrd-small text-mrd-mute">{reading.did}</span>
            ) : null}
            {reading.standing ? <span className="mrd-meta">{reading.standing}</span> : null}
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
 * ── IS WHAT YOU ARE ABOUT TO PROMISE CHECKABLE? ────────────────────────────
 * SPEC-BUILD-PATHS ranks this first of the five runnables, by value rather than
 * by station order, and the reason is a timing one: without it nobody discovers
 * that a forecast's observable was never readable until the horizon arrives, by
 * which point the verdict cannot land and the run has spent everything it was
 * going to spend. Asking at the moment of the promise is the only cheap moment
 * there is.
 *
 * `metric-probe.server.ts` was written for exactly this and had ZERO importers
 * repo-wide; its only reference was its own test. S0 wrapped it as a server fn
 * on request, and this is its first door.
 *
 * ── IT ANSWERS ABOUT THE WORDS, NOT ABOUT A ROW ────────────────────────────
 * The probe deliberately takes the forecast's own text rather than a decision
 * id, so it can be asked BEFORE anything is written. That is what lets the
 * answer arrive while the field is still editable, which is the entire point:
 * an answer after the record is written is a post-mortem.
 *
 * ── AND IT NEVER BLOCKS THE PRESS ──────────────────────────────────────────
 * A person may record a forecast this workspace cannot read today, and that is
 * their call to make: the source may be connected next week. What they may not
 * do is make it WITHOUT KNOWING. So this informs and never disables, and the
 * refusal is rendered in the probe's own words, which already name what to
 * connect.
 */
function ObservableProbe({ text }: { text: string }) {
  const { activeWorkspaceId } = useWorkspace();
  const fCheck = useServerFn(checkForecastObservable);
  const trimmed = text.trim();

  /*
   * Debounced so the question is asked about a SETTLED sentence rather than
   * about every keystroke. This timer schedules a read; it never asserts a
   * state, which is the line the presence rules draw.
   */
  const [settled, setSettled] = React.useState("");
  React.useEffect(() => {
    const id = setTimeout(() => setSettled(trimmed), 700);
    return () => clearTimeout(id);
  }, [trimmed]);

  const ready = settled.length > 0 && Boolean(activeWorkspaceId);
  const q = useQuery({
    queryKey: ["forecast-observable", settled, activeWorkspaceId],
    queryFn: () =>
      fCheck({ data: { howWeWillKnow: settled, workspaceId: activeWorkspaceId as string } }),
    enabled: ready,
    staleTime: 60_000,
  });

  if (!ready) return null;
  if (q.isLoading) return <span className="mrd-meta">Checking whether this can be read.</span>;
  if (q.isError) {
    return (
      <ReadFailedLine error={q.error}>
        The check did not run, so nothing here knows whether this can be read.
      </ReadFailedLine>
    );
  }
  if (!q.data) return null;

  return (
    <div className="flex flex-wrap items-center gap-mrd-3">
      <StatusChip status={q.data.checkable ? "pass" : "hold"}>
        {q.data.checkable ? "Readable now" : "Not readable yet"}
      </StatusChip>
      {/* VERBATIM. The probe writes this for the person it would have stopped,
          and it already names the next action where there is one. A second
          voice on one answer is how two copies come to disagree. */}
      <span className="mrd-meta">{q.data.because}</span>
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

  const shaped =
    claim.trim().length > 0 && know.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(day);

  /*
   * THE REFUSAL ARRIVES BEFORE THE COMMITMENT, NOT AFTER IT.
   *
   * `setDecisionForecastSchema` already refuses a horizon that has passed, so
   * this was never a hole in the write: the server said no and `onError` put
   * the sentence on screen. What it cost was the moment. This is the one place
   * the run deliberately slows down, and a person could fill three fields,
   * press Record the forecast, wait for a round trip and only then be told the
   * date was never allowed.
   *
   * `forecastRefusal` is the same pure function the schema calls and the same
   * one S3's decision detail calls, so the three cannot drift about what a
   * valid forecast is. Reused rather than restated: a second copy of this rule
   * is how a surface starts refusing something the server would have accepted.
   *
   * ONLY THE HORIZON RULE CAN FIRE HERE, because `shaped` above already
   * requires all three parts. The all-three-or-none branch stays reachable
   * through the schema for every other door.
   */
  const refusal = shaped
    ? forecastRefusal({
        forecast_claim: claim.trim(),
        forecast_how_we_will_know: know.trim(),
        forecast_horizon_date: `${day}T12:00:00Z`,
      })
    : null;

  const ready = shaped && !refusal;

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
      {/* The answer arrives while the field is still editable, which is the
          whole reason the probe takes words rather than a decision id. */}
      <ObservableProbe text={know} />
      <Field label="Due by" htmlFor={`fc-day-${decisionId}`}>
        <Input
          id={`fc-day-${decisionId}`}
          type="date"
          value={day}
          onChange={(e) => setDay(e.currentTarget.value)}
        />
      </Field>
      {/* Said under the field it is about, in the shared function's own words,
          the moment the date stops being a forecast. */}
      {refusal ? <RecordSpeaks>{refusal.message}</RecordSpeaks> : null}
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
  patternShownAbove = false,
}: {
  item: ArtifactView;
  now: number;
  trackId: string;
  /** True when a heading above this card already names its pattern. */
  patternShownAbove?: boolean;
}) {
  const f = item.fields;
  const content = str(f.content);
  const source = str(f.source);
  const sourceKind = str(f.source_kind);
  const url = str(f.url);
  const themeId = str(f.theme_id);

  const fDelete = useServerFn(deleteSignal);
  const qc = useQueryClient();
  /** Whether the person has asked to discard and not yet confirmed. Deliberately
   *  NOT cleared on failure: a discard that failed leaves both the "for good"
   *  and the "keep it" doors open, rather than resetting the card under them. */
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false);
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
      {/* 13 of the signal rows carry `**bold**`, and this renders them. Same
          tell as the rationale above; see `lib/plain-prose.ts`. */}
      {plainProse(content) ? <Prose markdown={false}>{plainProse(content)}</Prose> : null}
      <span className="mrd-meta">
        {[
          source,
          sourceKind ?? "unknown",
          relativeTime(item.createdAt, now),
          /*
           * THE PATTERN, NOT THE STATE WORD. This said "clustered", which is
           * true and withholds the only interesting part: WHICH pattern the
           * machine put this signal into. SESSION-1 asks this pane to show
           * signals "visibly grouping into themes as clustering runs" and calls
           * that the most convincing thing in the product. A name is the
           * substance of that; a state word is not.
           *
           * NOT REPEATED WHERE THE PATTERN IS ALREADY THE HEADING. RUN-116
           * groups the list by the pattern each signal names, so inside
           * `SenseBody` this would print "grouped into Checkout drop-off"
           * directly beneath a heading reading "Checkout drop-off".
           *
           * In the ungrouped section it was worse than a repeat. A signal whose
           * theme title could not be read renders this as the bare word
           * "grouped", sitting under a heading saying these do not sit with a
           * pattern yet. Two lines, touching, saying opposite things.
           *
           * A signal drawn on its own keeps it, because no heading there
           * carries the pattern.
           *
           * This comment used to say grouping the list was "ruled out" by the
           * 1,133 / 315 measurement. It was ruled out on the strength of
           * today's rows, and the founder's correction reversed that: a
           * measurement chooses what to build FIRST, never what the thing is.
           */
          patternShownAbove ? null : clusteredInto(themeId, str(f.theme_title)),
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      <div className="flex flex-col gap-mrd-2">
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
          {/*
           * ── DISCARDING EVIDENCE IS PERMANENT, SO IT TAKES TWO ACTS ────────
           *
           * `deleteSignal` is a hard `DELETE` on `signals`. There is no status
           * column, no "Bring it back", and no undo anywhere in the product. It
           * used to fire on ONE click, on a card a person is reading while an
           * agent works beside them, and a mis-click destroyed a piece of the
           * evidence the run is built on with nothing to say afterwards.
           *
           * Every other destructive control on this pane is already deliberate:
           * `ThemeCard`'s "Not a pattern" opens a panel and asks why, and that
           * one is REVERSIBLE. The irreversible control was the casual one.
           *
           * IN PLACE, NOT IN A DIALOG. Meridian's `Dialog` exists for exactly
           * this question, and its own header says to mount it from a surface's
           * root rather than deep inside a card, because a `position: fixed`
           * overlay is trapped by any transformed ancestor. A signal card is as
           * deep inside as it gets. Inline also matches what this pane already
           * does and what SESSION-1 asks for: every control that changes a thing
           * sits ON it.
           *
           * NO REASON IS ASKED FOR, deliberately. `deleteSignal` takes an id and
           * nothing else, so a reason field here would collect words the product
           * then throws away, which is the defect this pane exists not to commit.
           * If discarding should carry a reason it needs a column first.
           */}
          {confirmingDiscard ? (
            <>
              <Action
                variant="quiet"
                busy={del.isPending}
                disabled={del.isPending}
                onClick={() => del.mutate()}
              >
                {del.isPending ? "Removing it" : "Discard it for good"}
              </Action>
              <Action
                variant="quiet"
                disabled={del.isPending}
                onClick={() => setConfirmingDiscard(false)}
              >
                Keep it
              </Action>
            </>
          ) : (
            <Action variant="quiet" onClick={() => setConfirmingDiscard(true)}>
              Discard this finding
            </Action>
          )}
        </div>

        {confirmingDiscard && !del.isError ? (
          <span className="text-mrd-small text-mrd-body">
            This deletes it for good. Nothing brings it back.
          </span>
        ) : null}

        {/*
         * THE FAILURE LINE NO LONGER TAKES THE CONTROL WITH IT. This used to be
         * the `else` of the button: a discard that failed replaced the only
         * control on the card with an explanation, so the person was told it did
         * not work and left with no way to try again. That is the dead end
         * R-20 §5 forbids, arrived at through an error path.
         */}
        {del.isError ? (
          <span role="status" className="text-mrd-small text-mrd-body">
            {failureLine("It is still here, and nothing was removed.", del.error)}
          </span>
        ) : null}
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
    mutationFn: (title: string) => fRename({ data: { theme_id: item.artifactId, title } }),
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
      {plainProse(summary) ? <Prose markdown={false}>{plainProse(summary)}</Prose> : null}
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
          <Action
            variant="quiet"
            onClick={() => setOpenPanel(openPanel === "dismiss" ? null : "dismiss")}
          >
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
        <Action
          variant="quiet"
          onClick={() => setOpenPanel(openPanel === "rename" ? null : "rename")}
        >
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
          {failureLine(
            "That did not change, so it reads as it did.",
            rename.error ?? setStatus.error,
          )}
        </span>
      ) : null}
    </div>
  );
}

/**
 * THE NAME OF A PATTERN THIS TRACK DOES NOT HOLD, AND THE ONE CONTROL IT EARNS.
 *
 * 818 of the 1,133 signals on tracks name a theme that is not a member of the
 * same track (`group-by-the-pattern.ts`). `ThemeCard` draws for the other 315,
 * and it carries rename. So "rename a theme", which SESSION-1 lists as a
 * Discover control, reached the minority of the patterns on this pane, and the
 * heading over the majority was a bare span with nothing a person could do to it.
 *
 * -- WHY RENAME, AND WHY ONLY RENAME ---------------------------------------
 * Rename acts on the exact string this component is displaying. Nothing about
 * it depends on state we do not hold, and the server already decides whether it
 * is allowed: `renameTheme` updates `themes` scoped `.eq("user_id", userId)`, so
 * a theme that is not the reader's cannot be renamed from here whatever this
 * pane draws. "Not a pattern" is deliberately NOT offered. Dismissing sets a
 * status, and this surface cannot see the theme's status, frequency, severity
 * or whether it was already dismissed. `ThemeCard` shows all four BEFORE it
 * offers that control, and this has none of them. A control that changes state
 * its own screen cannot show is the thing this pane exists not to do.
 *
 * The objection that a theme is workspace level, so renaming it reaches other
 * tracks, is TRUE and is equally true of the rename already shipped on
 * `ThemeCard`. It is not a difference between the two cases, so it is not a
 * reason to withhold the control from one of them.
 *
 * -- STILL NOT A CARD -------------------------------------------------------
 * No card is drawn, for the reason the original comment gave: a card implies
 * something to open and there is no theme artifact here. This is the name plus
 * one verb. The rename lands because `theme_title` is resolved live against
 * `themes` on every read of the pane (F-129, `track.functions.ts`) rather than
 * copied onto the signal row, so invalidating the pane shows the new name.
 */
function PatternName({
  themeId,
  title,
  trackId,
}: {
  themeId: string;
  /** The pattern's name as the record gave it. Never blank: a pattern we cannot
   *  name is left ungrouped upstream rather than headed with an empty string. */
  title: string;
  trackId: string;
}) {
  const fRename = useServerFn(renameTheme);
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const rename = useMutation({
    mutationFn: (next: string) => fRename({ data: { theme_id: themeId, title: next } }),
    onSuccess: () => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["track-artifacts", trackId] });
      void qc.invalidateQueries({ queryKey: ["spine-track-chain", trackId] });
    },
  });

  return (
    <div className="flex flex-col gap-mrd-2">
      <div className="flex flex-wrap items-baseline gap-mrd-2">
        <span className="mrd-eyebrow">{title}</span>
        <Action variant="quiet" onClick={() => setOpen((o) => !o)}>
          Rename this theme
        </Action>
      </div>

      {open ? (
        <ReasonField
          id={`pattern-rename-${themeId}`}
          label="What should this theme be called?"
          hint="Your name replaces the generated one, everywhere this theme appears."
          placeholder="Checkout friction on mobile"
          commitLabel="Rename it"
          cancelLabel="Keep the current name"
          busy={rename.isPending}
          onCommit={(next) => rename.mutate(next)}
          onCancel={() => setOpen(false)}
        />
      ) : null}

      {rename.error && !open ? (
        <span role="status" className="text-mrd-small text-mrd-body">
          {failureLine("That did not change, so it reads as it did.", rename.error)}
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
  /** Every theme this track filed, by id, so a signal can name its pattern. */
  themes?: ReadonlyMap<string, string>;
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
                {forecastSays(resolution)}
              </StatusChip>
              {/*
               * THE NUMBER THE GRADER READ, BESIDE THE VERDICT IT DECIDES.
               *
               * It was rendered only under the spec-outcome chip further down.
               * That is a DIFFERENT question -- `forecast-words.ts` is emphatic
               * that "did shipping this pay off" and "was the belief correct"
               * are orthogonal -- and it left the forecast verdict as an
               * assertion with its evidence two blocks away.
               *
               * The block above states the observable the forecast named ("How
               * we will know"). This is the reading against it. A verdict on a
               * measured claim, printed without the measurement, is the thing
               * this product exists not to do.
               *
               * Only here, not in both places: one number twice on one screen
               * reads as a bug, and the outcome chip below has its own words.
               */}
              {metricLabel && metricValue ? (
                <span className="font-mrd-mono text-mrd-data tabular-nums text-mrd-mute">
                  {metricLabel}: {metricValue}
                </span>
              ) : null}
            </span>
            {rationale ? (
              <span className="min-w-0 text-mrd-small text-mrd-mute">{rationale}</span>
            ) : null}
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
          <Prose markdown={false}>{plainProse(summary)}</Prose>
          <span className="flex flex-wrap items-center gap-mrd-3">
            {verdict === "validated" ? (
              <StatusChip status="pass">Held up</StatusChip>
            ) : verdict === "missed" ? (
              <StatusChip status="fail">Did not hold</StatusChip>
            ) : verdict === "mixed" ? (
              <StatusChip status="hold">Mixed</StatusChip>
            ) : null}
            {/* The reading moved up beside the forecast verdict, which is the
                question it actually answers. Printing it twice on one screen
                reads as a bug, and this chip already says its own answer in
                words. Still shown here when there is no forecast verdict for it
                to sit beside, because then this IS its only home. */}
            {!resolution && metricLabel && metricValue ? (
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
      {/*
       * THE TURN-AROUND (RUN-15). A verdict that did not hold is the moment
       * the person most needs a next move, and until now the card ended at the
       * grade -- a dead end at exactly the payoff the whole loop exists for.
       * This hands the expectation back to /start as an opening sentence: one
       * deliberate press away from another run that starts from what the last
       * one learned. A held-up verdict offers nothing; it earned its rest.
       */}
      {resolution === "miss" || resolution === "inconclusive" ? (
        <TakeAnotherRun claim={claim ?? item.title} />
      ) : null}
    </div>
  );
}

/** The quiet bridge from a verdict to the next attempt. */
function TakeAnotherRun({ claim }: { claim: string | null }) {
  const navigate = useNavigate();
  const seed = (claim ?? "").slice(0, 300);
  return (
    <div>
      <Action
        variant="quiet"
        onClick={() => void navigate({ to: "/start", search: seed ? { about: seed } : {} })}
      >
        Take another run at this
      </Action>
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
 * ── THE BUILD CARD, AND THE VERDICT MOVED OUT OF IT ───────────────────────
 * The change the run wrote, and the verdict a seat that did not write it filed
 * against it. The verdict used to be drawn inline here, which made it a property
 * of this card. It is not: it is the one place on this surface where something
 * other than the agent that did the work reports on the work, and the strip
 * above the pane has to say the same sentence. Two renderings of one verdict is
 * how a screen ends up disagreeing with itself, so it is one component now and
 * this card mounts it. See `Verdict.tsx` for the empty case, which is the common
 * one, and for why the two absences are two sentences.
 */
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

/*
 * THE DIFF, FILE BY FILE (THE-ONE-SCREEN station 5). Read from
 * `getChangesetDiff` -- the same read the builder's own ChangesPanel renders --
 * so the run shows the change exactly as it exists, never a summary of it.
 * Per-file counts come from the same hunk engine the curation UI uses, so a
 * "+12 -3" here agrees with what opening that file elsewhere will show.
 */
function ChangesetDiffView({ changesetId }: { changesetId: string }) {
  const fDiff = useServerFn(getChangesetDiff);
  const q = useQuery({
    queryKey: ["studio-diff", changesetId],
    queryFn: () => fDiff({ data: { changesetId } }),
    staleTime: 10_000,
  });
  const [openPath, setOpenPath] = React.useState<string | null>(null);

  if (q.isLoading) return <Reading>Reading the change.</Reading>;
  if (q.isError)
    return (
      <ReadFailedLine error={q.error}>
        The change's files could not be read, so nothing is shown rather than something wrong.
      </ReadFailedLine>
    );

  const changes = (q.data?.changes ?? []) as Array<{
    id: string;
    path: string;
    op: string;
    base_content: string | null;
    new_content: string | null;
  }>;
  if (!changes.length) {
    return <RecordSpeaks>No files on this change yet.</RecordSpeaks>;
  }

  const OP_WORD: Record<string, string> = {
    create: "new file",
    update: "modified",
    delete: "deleted",
  };

  // Counted from the same alignment the diff view renders. Very large files are
  // labelled rather than measured: an O(lines²) pass on a minified bundle to
  // print two numbers is a bad trade.
  const COUNT_CHAR_CAP = 200_000;
  let addedTotal = 0;
  let removedTotal = 0;
  let oversized = 0;

  return (
    <div className="flex flex-col gap-mrd-2 rounded-mrd-chip bg-mrd-sink p-mrd-4">
      <span className="mrd-eyebrow">The change, file by file</span>
      {changes.map((c) => {
        const big = (c.base_content?.length ?? 0) + (c.new_content?.length ?? 0) > COUNT_CHAR_CAP;
        let added = 0;
        let removed = 0;
        if (!big) {
          for (const h of computeHunks(c.base_content ?? "", c.new_content ?? "")) {
            added += h.modifiedLines.length;
            removed += h.baseLines.length;
          }
          addedTotal += added;
          removedTotal += removed;
        } else {
          oversized += 1;
        }
        const open = openPath === c.path;
        return (
          <div key={c.id} className="flex flex-col">
            <button
              type="button"
              data-mrd=""
              onClick={() => setOpenPath(open ? null : c.path)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-mrd-3 rounded-mrd-chip px-mrd-2 py-mrd-1 text-left transition-colors enabled:hover:bg-mrd-hover"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              <span className="min-w-0 truncate font-mrd-mono text-mrd-data text-mrd-body">
                {c.path}
              </span>
              <span className="flex shrink-0 items-center gap-mrd-3">
                <span className="mrd-meta">{OP_WORD[c.op] ?? c.op}</span>
                {big ? (
                  <span className="mrd-meta">large file</span>
                ) : (
                  <Diffstat added={added} removed={removed} />
                )}
              </span>
            </button>
            {open ? (
              <div className="mt-mrd-2 overflow-x-auto">
                <CodeDiff base={c.base_content ?? ""} next={c.new_content ?? ""} path={c.path} />
              </div>
            ) : null}
          </div>
        );
      })}
      <span className="mrd-meta">
        {[
          `${changes.length} ${changes.length === 1 ? "file" : "files"}`,
          `+${addedTotal} −${removedTotal}`,
          ...(oversized > 0 ? [`${oversized} too large to count`] : []),
        ].join(" · ")}
      </span>
    </div>
  );
}

/*
 * ── THE SHIP CARD ──────────────────────────────────────────────────────────
 * What went out, and where. Ship was the ONLY station of the seven whose own
 * output rendered nothing: `deployment` fell through this file's switch to
 * `null` while the columns it needed were already being fetched and handed in
 * (`track.functions.ts:1184`). The data reached the component and was dropped
 * on the last line.
 *
 * THE ONE THING IT MUST NOT DO is let a `claimed` row read like a `success`
 * one. A person pasting a deploy address through the handback writes `claimed`,
 * deliberately and permanently, because `release.publish` reads `success` and a
 * typed address must never satisfy the gate that says this shipped. The chip
 * separates them and the sentence says what is missing, because a different
 * colour alone is a thing people learn to stop noticing.
 */
/**
 * ── WHAT A RELEASE IS ON THE HOOK FOR (P-03) ──────────────────────────────
 *
 * This card said where the release went and what commit it was, which is what a
 * deploy record knows. It did not say the one thing that makes shipping here
 * different from shipping anywhere else: the claim somebody made BEFORE it went
 * out, and the date it gets graded.
 *
 * That is the product's whole argument. A release with a forecast attached is a
 * bet on the record; a release without one is a deploy, and every vendor has
 * those. The forecast was already on the screen -- three tabs away, on Decide --
 * and Learn grades it later, so the moment it is least visible is the moment it
 * matters most: the thing has just gone live and nobody has looked at Decide
 * since.
 *
 * ── READ FROM THE DECISION, AND ABSENT WHEN THERE IS NONE ─────────────────
 * `decisions` is the same list `LearningCard` grades against, already threaded
 * through `StationPanel`, so the release and the verdict quote one row. A track
 * whose Decide was waived carries no forecast at all, and that is a real and
 * common shape: it says so in one line rather than leaving a gap where a claim
 * would be.
 */
function ReleaseCard({ item, decisions }: { item: ArtifactView; decisions?: ArtifactView[] }) {
  const f = item.fields;
  const standing = releaseStanding(str(f.status));
  const env = str(f.environment);
  const url = str(f.deploy_url);
  const sha = shortSha(str(f.commit_sha));
  const provider = str(f.provider);
  // `deployed_at` is null on a row that never reached the provider, so the
  // record's own creation time is the honest fallback for "when this appeared".
  const at = str(f.deployed_at) ?? item.createdAt;

  const under = [provider ? `via ${provider}` : "", sha ? `commit ${sha}` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-mrd-4">
      <div className="flex flex-wrap items-center gap-mrd-3">
        {standing.tone === "quiet" ? (
          // An unfamiliar provider word does not get an outcome chip. See
          // release-words.ts: a confident wrong colour is worse than none.
          <span className="mrd-meta">{standing.word}</span>
        ) : (
          <StatusChip status={standing.tone}>{standing.word}</StatusChip>
        )}
        {env ? <Value tone="quiet">{env}</Value> : null}
        <span className="mrd-meta">{relativeTime(at, Date.now())}</span>
      </div>

      {standing.note ? <RecordSpeaks>{standing.note}</RecordSpeaks> : null}

      {under ? <span className="mrd-meta">{under}</span> : null}

      {/*
       * -- WHAT WENT OUT, RUNNING (P-22) ------------------------------------
       *
       * Ship's half of the same claim Build makes: watching the diff is watching
       * the work, watching the app run is watching the result. Build has to go
       * and FIND a preview row; this card already holds `deploy_url`, so it
       * renders the frame directly rather than re-fetching a fact that is
       * already on screen.
       *
       * Only for a release that actually SUCCEEDED. Framing a failed or
       * in-flight deploy would put a blank iframe under a red chip, which reads
       * as the product being broken rather than the deploy being.
       */}
      {url && standing.tone === "pass" ? (
        <RunningApp
          url={url}
          sha={str(f.commit_sha)}
          label={env === "production" ? "Live" : "App"}
        />
      ) : url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-mrd-small font-medium text-mrd-you underline underline-offset-2"
        >
          Open what went out
        </a>
      ) : (
        <RecordSpeaks>No address was recorded, so there is nothing to open.</RecordSpeaks>
      )}

      <OnTheHookFor decisions={decisions} />
    </div>
  );
}

/**
 * The claim this release is answerable for, and when it gets graded.
 *
 * Every clause is dropped where its column is empty. A decision recorded before
 * the forecast field existed carries a claim and no date; one recorded through a
 * waived Decide carries neither. Printing "due unknown" would be worse than
 * printing nothing, because a horizon nobody set is not a horizon.
 */
function OnTheHookFor({ decisions }: { decisions?: ArtifactView[] }) {
  const withClaim = (decisions ?? []).find(
    (d) => !d.missing && typeof d.fields.forecast_claim === "string" && d.fields.forecast_claim,
  );
  if (!withClaim) {
    return (
      <span className="mrd-meta">
        Nothing was forecast on this one, so there is no claim for it to be graded against.
      </span>
    );
  }
  const claim = str(withClaim.fields.forecast_claim);
  const know = str(withClaim.fields.forecast_how_we_will_know);
  const dueRaw = str(withClaim.fields.forecast_horizon_date);
  const due = dueRaw ? formatDeadlineDate(Date.parse(dueRaw)) : null;

  return (
    <div className="flex flex-col gap-mrd-1 rounded-mrd-chip bg-mrd-sink p-mrd-4">
      <span className="mrd-eyebrow">What this release is on the hook for</span>
      {claim ? <RunNote>{claim}</RunNote> : null}
      {know ? <span className="mrd-meta">{`How we will know: ${know}`}</span> : null}
      {due ? <span className="mrd-meta">{`Graded on ${due}.`}</span> : null}
    </div>
  );
}

/**
 * The app and the diff, one at a time, the app first.
 *
 * TABS RATHER THAN BOTH STACKED. A diff and a running app are two answers to
 * "what did this change do" and a person reads one of them at a time; stacked,
 * the frame pushes the diff below the fold on every changeset in the product.
 *
 * The toggle keeps its own state per changeset and does not persist. A person
 * who opened the diff on one change has said nothing about the next one, and a
 * remembered preference here would quietly turn the feature off for anybody who
 * ever looked at a diff.
 */
function AppOrDiff({ changesetId }: { changesetId: string }) {
  const [showing, setShowing] = React.useState<"app" | "diff">("app");
  return (
    <div className="flex min-w-0 flex-col gap-mrd-3">
      {/*
       * `aria-pressed` ON TWO BUTTONS, NOT A TABLIST, and the guard that caught
       * this is right. `one-station-display-on-the-run-screen` forbids
       * `role="tablist"` anywhere the run screen draws, because a tab band on
       * this route once meant a seven-station display on every screen in the
       * product.
       *
       * The ARIA is also more honest for what this is. A tablist implies panels
       * a reader moves between; this is one card choosing which of two answers
       * to the same question it shows. `RunArtifact` took the same shape for the
       * same reason when it became selectable.
       */}
      <span className="flex items-center gap-mrd-2" role="group" aria-label="App or diff">
        {(["app", "diff"] as const).map((which) => (
          <button
            key={which}
            type="button"
            aria-pressed={showing === which}
            onClick={() => setShowing(which)}
            className={`mrd-focus rounded-mrd-ctl px-mrd-3 py-1 text-mrd-small transition-colors duration-[var(--mrd-d-press)] ${
              showing === which
                ? "bg-mrd-lift text-mrd-ink"
                : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-ink"
            }`}
          >
            {which === "app" ? "App" : "Diff"}
          </button>
        ))}
      </span>
      {showing === "app" ? (
        <AppFrame changesetId={changesetId} />
      ) : (
        <ChangesetDiffView changesetId={changesetId} />
      )}
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

  return (
    <div className="flex flex-col gap-mrd-4">
      <div className="flex flex-wrap items-center gap-mrd-3">
        <span className="text-mrd-label font-medium text-mrd-ink">{item.title ?? item.word}</span>
        <span className="mrd-meta">{relativeTime(item.createdAt, Date.now())}</span>
      </div>
      {plainProse(summary) ? <Prose markdown={false}>{plainProse(summary)}</Prose> : null}
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

      {/*
       * -- THE APP FIRST, THE DIFF BEHIND A TOGGLE (P-22) ------------------
       *
       * Founder, 2026-09-02: watching the diff is watching the work, watching
       * the app run is watching the result. The result leads.
       *
       * `App` is the default TAB and not the default CONTENT: when nothing is
       * running the frame says why in one line, and the diff is one press away
       * rather than replaced. A person whose preview is not wired must not lose
       * the thing that did work.
       */}
      <AppOrDiff changesetId={item.artifactId} />

      {/* THE VERDICT, OR THE TRUTH ABOUT ITS ABSENCE. The block is Meridian's;
          the reading of `code_review` and the words for each of its two
          absences are this layer's, because a primitive that knew the column
          would have exactly one possible caller. */}
      <Verdict label="The verdict on this change" {...verdictProps(f.code_review)} />
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
              {plainProse(detail) ? <Prose markdown={false}>{plainProse(detail)}</Prose> : null}
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
/**
 * ── THE GOAL AND THE ORIGIN ARE THE SAME SENTENCE, SO ONE OF THEM GOES ────
 *
 * A1, walking `2fdf93b6`: the Build row's run card printed *"Created directly by
 * S0 on 2026-09-01 as the FOURTH acceptance candidate, no press (F-164)..."* as
 * its body. That is `spine_tracks.origin`, the exact internal prose the header
 * was cut back for, arriving on the same screen through a different door.
 *
 * It is not a coincidence. `trackGoalSentence` composes a mission's goal as
 * `${title}. ${originLine(title, origin)}`, so the mission's description IS the
 * origin with the title in front of it. A1's rule: the run card shows the
 * mission title, its state and its meta line, and `origin` renders nowhere on
 * the run screen.
 *
 * ── COMPARED, NOT DELETED, AND THE DIFFERENCE MATTERS ─────────────────────
 * Dropping the body outright would satisfy the letter and lose the case worth
 * keeping: a mission whose goal is genuinely NOT the origin has something to
 * say, and today nothing else on the screen says it. So the body is suppressed
 * exactly when it is the origin wearing a title, which is the reported case and
 * every case `trackGoalSentence` produces.
 *
 * Normalised before comparing, because the goal has been through `saidOnce` and
 * `plainProse` by the time a reader sees it, and whitespace or a stripped `**`
 * must not be what decides whether internal prose reaches a customer.
 */
export function goalRepeatsOrigin(
  goal: string | null | undefined,
  origin: string | null | undefined,
): boolean {
  const norm = (v: string) =>
    v
      /* `\u0060` rather than a literal backtick, and it is not a style choice.
         `what-a-person-reads-has-no-em-dashes` reads this file with a hand-written
         scanner that tracks strings so it can skip comments, and it is not
         regex-aware: a backtick inside a character class opened a template
         literal for it and desynced everything after, so three pre-existing
         comment dashes two thousand lines below suddenly counted as prose a
         person reads. The guard is right about the code this repo writes; the
         escape costs nothing and keeps it working. */
      .replace(/[*_\u0060#]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const g = norm(goal ?? "");
  const o = norm(origin ?? "");
  /* A very short origin could be a substring of an unrelated goal by accident.
     Forty characters is longer than any title in the database and shorter than
     every composed origin measured on this table. */
  if (!g || o.length < 40) return false;
  return g.includes(o.slice(0, 120));
}

export function MissionCard({
  item,
  origin = null,
}: {
  item: ArtifactView;
  origin?: string | null;
}) {
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
        {/*
         * ── ONE STATUS PER SCREEN, AND THIS WAS THE SECOND ONE ─────────────
         * A `Completed` chip here reported the state of a run that is drawn
         * inside the artifact pane of a run screen whose header already carries
         * exactly one status chip for the whole piece of work. Two chips within
         * a few hundred pixels, about two different subjects, with nothing
         * saying which was which: on `d1168015` the header read Finished while
         * this one read Completed about a mission nested under Build, and a
         * reader has no way to tell those are different objects. The FACT is
         * kept and moves into the meta line below, where it reads as a
         * property of the mission rather than as the screen's verdict.
         */}
        {!completedAt && status ? <span className="mrd-meta">{status}</span> : null}
      </span>
      {/* Shown once even where the record holds it twice. The write path that
          doubled it is fixed at the source; two historical rows remain and one
          of them is on the most-opened track in the database. See
          `said-once.ts` for why this is a render fix rather than a bridge. */}
      {/* `saidOnce` for the doubled sentence, `plainProse` for the markers: 3
          mission goals carry `**bold**`. Two different defects on one string. */}
      {plainProse(saidOnce(goal)) && !goalRepeatsOrigin(goal, origin) ? (
        <Prose markdown={false}>{plainProse(saidOnce(goal))}</Prose>
      ) : null}
      <span className="mrd-meta">
        {[
          /* The chip's fact, kept, in the register of a property rather than of
             a verdict. It carries WHEN, which the chip could not. */
          completedAt ? `completed ${relativeTime(completedAt, Date.now())}` : "",
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

/*
 * DISCOVER'S BODY -- the grouping, visible (THE-ONE-SCREEN station 1).
 *
 * Under the primary-plus-lines rule this station rendered ONE signal card and
 * a column of bare titles, which is why the product's most convincing moment
 * -- evidence visibly becoming a pattern -- never happened on the surface that
 * exists for it. Here the themes lead, the signals filed under each one sit
 * directly beneath it, and everything not yet clustered reads as exactly that.
 * The order is derived from `fields.theme_id` on every signal; nothing is
 * inferred from timing or prose.
 *
 * MOTION REPORTS THE EVENT (R-20 §4): a theme section that was not on screen
   at first paint animates once when it arrives -- that arrival IS the
   clustering having happened. Signals do not move of their own accord; only
   the fact that a pattern now exists gets an entrance. prefers-reduced-motion
   removes it through the same inline-animation rule as everywhere else.
 */
/**
 * DISCOVER FOUND NOTHING BECAUSE NOTHING IS CONNECTED, SAID WHERE IT LANDS.
 *
 * ── IT LIVES IN THE EMPTY BRANCH, AND THE FIRST VERSION DID NOT ───────────
 * I put this inside `SenseBody` and drove it, and it never appeared.
 * `StationPanel` returns early when `stop.members.length === 0`, so `SenseBody`
 * is **unreachable for exactly the tracks this exists for** — the 47 of 82 at
 * Discover that filed nothing at all. Shipped-with-no-way-in, caught by opening
 * one of those 47 rather than by reading the file.
 *
 * The reasoning, the measurement and the honesty rule are in
 * `discover-has-no-sources.ts`. This is the render.
 */
function NothingToRead({ station }: { station: AgentStation }) {
  /*
   * `head: true` with an exact count: this needs the NUMBER and never the rows.
   * On error the count stays null and the verdict is `cannot-tell` -- a failed
   * read is not zero sources, and here that matters more than usual, because
   * the remedy sends a person to connect something they may already have.
   */
  const sources = useQuery({
    queryKey: ["discover-source-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("scout_targets")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    staleTime: 5 * 60_000,
    enabled: station === "sense",
  });

  /*
   * The station gate comes FIRST, and the order is the point. Only Discover
   * reads sources; every other station filing nothing is a different problem
   * and `StationPanel` already says which. That `null` answers no pending read
   * -- the query is `enabled` only for Discover -- so it is a component that
   * does not apply here rather than a blank under a heading.
   */
  if (station !== "sense") return null;
  /*
   * AND THE PENDING READ SAYS SO, because a guard caught me returning null
   * here and it was right to. `a-null-under-a-heading-is-a-broken-promise`:
   * "A render that answers a pending read with null shows a person an empty
   * region and lets them conclude there is nothing there." Under a line that
   * has just said Discover filed nothing, a blank would read as confirmation
   * that nothing can be done about it. I obeyed the rule rather than adding
   * this file to its tolerated list, which the guard's own header calls a debt.
   */
  if (sources.isLoading) return <Reading>Checking what is connected.</Reading>;

  const verdict = sourceVerdict({
    filedAnything: false,
    sourceCount: sources.isError ? null : (sources.data ?? null),
  });
  const line = sourceLine(verdict);
  if (!line) return null;

  return (
    <section aria-label="Nothing to read" className="flex flex-col gap-mrd-2">
      <RecordSpeaks>{line}</RecordSpeaks>
      {offerToConnect(verdict) ? (
        <AskInPlace
          need="somewhere to read what people are saying"
          why="Discover reads what customers and teammates have already said. Nothing is pointed at a source yet, so it had nothing to read."
          suggest={["intercom", "zendesk", "slack"]}
          needIsMet={false}
        />
      ) : null}
    </section>
  );
}

/**
 * ── WHERE THIS RUN CAME FROM (founder, 2026-09-02 19:12) ──────────────────
 *
 * THE HOLE THIS CLOSES. The product's claim is that evidence becomes work on
 * its own. The machinery for it is real and shipped -- `promote.server.ts` runs
 * every theme past a bar and starts a track when one clears it, `qualifies()`
 * composes the sentence saying why, and `originFor()` writes that sentence onto
 * `spine_tracks.origin` at the moment of the decision. **And no screen in this
 * product read it.** Grepped 2026-09-02: `qualifies` and `originFor` appear only
 * in `src/lib/spine/` and their tests, zero times under `src/components` or
 * `src/routes`. The most convincing thing the loop does happened, was written
 * down, and was shown to nobody.
 *
 * ── THE BAR IS READ, NOT ASSUMED ──────────────────────────────────────────
 * `DEFAULT_PROMOTION_BAR` is 8 signals, severity 4, confidence 0.75 -- and a
 * workspace can override all three (`workspaces.promotion_min_*`, resolved by
 * `resolveAutonomyPolicy`). Printing the shipped default beside a workspace that
 * set its own would be a number that looks measured and is not, which is the
 * exact defect this pane's neighbours have been repaired for. So the row is read
 * with the caller's own RLS-scoped client -- the pattern `PrototypeCard`
 * established in this file -- and until it answers, no bar is drawn.
 *
 * ── AND IT DOES NOT CLAIM THE THEME IS WHY THE RUN EXISTS ─────────────────
 * A theme filed at Discover can arrive two ways: `attachOriginTheme` writes the
 * one that STARTED the track, and a Discover seat that clustered evidence writes
 * the ones it made. Nothing on the member row separates them. `origin` does:
 * only a promoted track carries the sentence `originFor` composed. So the
 * promotion is claimed from `origin` and the numbers are shown from the theme,
 * and neither is asked to stand in for the other.
 */
function Lineage({
  themes,
  origin,
  hasSignals,
  workspaceId = null,
}: {
  themes: ArtifactView[];
  /** `spine_tracks.origin`. Carries the promotion sentence, or a typed one. */
  origin: string | null;
  hasSignals: boolean;
  /**
   * Whose bar to read, HANDED IN rather than taken from the workspace context.
   *
   * `useWorkspace` throws outside its provider, and `SenseBody` is rendered
   * directly by forty guards that stand up no shell at all. A hook that decides
   * whether a component can be tested in isolation is a coupling this file
   * should not add for one number, so the id travels as a prop and a null one
   * simply draws no bar -- which is also the right answer when nobody knows
   * whose workspace this is.
   */
  workspaceId?: string | null;
}) {
  /*
   * Cached hard: a workspace's bar is a setting, not a fact about this run, so
   * re-reading it on the pane's ten-second beat would spend a request on a value
   * that cannot change while somebody watches one track.
   */
  const bar = useQuery({
    queryKey: ["promotion-bar", workspaceId],
    enabled: Boolean(workspaceId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("promotion_min_frequency,promotion_min_severity,promotion_min_confidence")
        .eq("id", workspaceId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return promotionBarFor(resolveAutonomyPolicy(data as AutonomyPolicyRow | null));
    },
  });

  const promoted = becameWorkOnItsOwn(origin);
  const theme = themes[0] ?? null;

  /*
   * ── NO CLUSTER MEANS A PERSON STARTED IT, WHATEVER ELSE IS ON THE RECORD ─
   *
   * This used to require the station to be empty of BOTH kinds, and driving it
   * on `ce846e9b` showed the hole: that track has one finding and no theme
   * member, so the block rendered NOTHING and the run's origin went unsaid on
   * the one tab that exists to say it. Findings are evidence a Discover seat
   * gathered AFTER the run started; they are not what started it. The question
   * this answers is where the run came from, and a run with no cluster came
   * from a person however much evidence it has since collected.
   */
  if (!theme) {
    return (
      <p className="text-mrd-small text-mrd-mute">
        {promoted
          ? "This run started itself from a cluster, and the cluster it came from is no longer on the record."
          : "Nobody clustered anything into this run. It started from a sentence somebody typed, so there is no trail of evidence behind it."}
      </p>
    );
  }

  const f = theme.fields;
  const frequency = num(f.frequency);
  const severity = num(f.severity);
  const confidence = num(f.confidence);
  const b = bar.data ?? null;

  /*
   * THE COMPARISON, AND IT PRINTS ONLY WHAT IT HAS. A missing figure on the
   * theme drops its own clause; a bar that has not been read drops the whole
   * "over a bar of" half rather than falling back to the shipped default, which
   * would be a claim about this workspace that nobody made.
   */
  const measured = [
    frequency !== null ? `seen ${frequency} ${frequency === 1 ? "time" : "times"}` : "",
    severity !== null ? `severity ${severity}` : "",
    confidence !== null ? `confidence ${confidence}` : "",
  ].filter(Boolean);
  const against =
    b && measured.length > 0
      ? `, over a bar of ${b.minFrequency} \u00B7 ${b.minSeverity} \u00B7 ${b.minConfidence}`
      : "";

  return (
    <div className="flex flex-col gap-mrd-2 rounded-mrd-chip bg-mrd-sink p-mrd-4">
      <span className="mrd-eyebrow">Where this run came from</span>
      <span className="text-mrd-label font-medium text-mrd-ink">{theme.title ?? theme.word}</span>
      {measured.length > 0 ? (
        <span className="mrd-meta">{`${measured.join(" \u00B7 ")}${against}`}</span>
      ) : null}
      {/*
       * THE SENTENCE THE LOOP WROTE AT THE MOMENT IT DECIDED, verbatim.
       *
       * This is the product's own claim on one line: what it believed, recorded
       * before anyone knew the outcome. Rewriting it here would make it a
       * summary of a decision rather than the decision, so it is printed as
       * stored. It only exists on a track the sweep started; a person's own
       * sentence is not this, and saying it were would be the substitution.
       */}
      {promoted && origin ? <Prose markdown={false}>{origin}</Prose> : null}
      <span className="mrd-meta">
        {hasSignals
          ? "Everything it clustered is below, each with where it came from and when."
          : "The findings it clustered are no longer on this run's record."}
      </span>
    </div>
  );
}

export function SenseBody({
  items,
  now,
  trackId,
  origin = null,
  workspaceId = null,
}: {
  items: ArtifactView[];
  now: number;
  trackId: string;
  /** `spine_tracks.origin`, for the lineage line at the top. */
  origin?: string | null;
  /** Whose promotion bar the lineage compares against. See `Lineage`. */
  workspaceId?: string | null;
}) {
  const reducedMotion = usePrefersReducedMotion();

  const primed = React.useRef(false);
  const seenThemes = React.useRef<Set<string>>(new Set());
  /** Which theme each signal was last seen in; "" for none. */
  const seenPlacement = React.useRef<Map<string, string>>(new Map());

  const themes = items.filter((it) => it.kind === "theme" && !it.missing);
  const signals = items.filter((it) => it.kind === "signal" && !it.missing);
  const missing = items.filter((it) => it.missing);

  /*
   * GROUPED BY THE PATTERN THE SIGNAL NAMES, not by what this track happens to
   * hold. See `group-by-the-pattern.ts`: 818 of the 1,133 signals on tracks
   * name a theme that is not a member of the same track, and every one of them
   * used to be drawn under "do not sit with a pattern yet".
   */
  const themeIdsOnTrack = new Set(themes.map((t) => t.artifactId));
  const { groups, ungrouped: loose } = groupByThePattern(signals, themeIdsOnTrack);
  const themeById = new Map(themes.map((t) => [t.artifactId, t]));

  /*
   * ARRIVALS ANIMATE ONCE, THE FIRST PAINT DOES NOT -- the transcript's exact
   * pattern. A theme known at mount is history; one that shows up on a later
   * poll is the machine finding a pattern in front of you.
   *
   * ── IT PRIMES ON THE FIRST DATA, NOT ON THE FIRST THEME ──────────────────
   * This read `!primed.current && themes.length > 0`, which meant a track that
   * had signals and no theme yet stayed unprimed. The FIRST theme to arrive
   * then took the priming branch: recorded as history, drawn without motion.
   * That is the single moment SESSION-1 calls "the most convincing thing in
   * the product, because it is the machine finding a pattern in front of you",
   * and it was the one arrival guaranteed never to animate.
   *
   * Priming on the first page of data that exists at all keeps the rule the
   * transcript states -- nothing already on screen animates -- while letting
   * the first pattern be an event.
   */
  const freshThemes = new Set<string>();
  const freshlyGrouped = new Set<string>();

  /*
   * The placement an arrival is measured against is now the GROUP a signal
   * lands in, so a signal joining a pattern whose card we do not hold animates
   * exactly like one joining a pattern we do. Before, those 818 could never
   * appear to group at all.
   */
  const groupOfSignal = new Map<string, string>();
  for (const g of groups) for (const sg of g.signals) groupOfSignal.set(sg.artifactId, g.themeId);
  const placementOf = (sig: ArtifactView): string => groupOfSignal.get(sig.artifactId) ?? "";

  if (!primed.current && items.length > 0) {
    for (const t of themes) seenThemes.current.add(t.artifactId);
    for (const sig of signals) seenPlacement.current.set(sig.artifactId, placementOf(sig));
    primed.current = true;
  } else if (primed.current) {
    for (const t of themes) {
      if (!seenThemes.current.has(t.artifactId)) {
        seenThemes.current.add(t.artifactId);
        freshThemes.add(t.artifactId);
      }
    }
    /*
     * A SIGNAL JOINING A THEME IS THE GROUPING, and only a NEW theme used to
     * show it. A pattern that already existed and then gained a piece of
     * evidence moved that card out of "not yet grouped" and under the theme
     * with no motion at all, which is the same event and the commoner one.
     *
     * Keyed on the placement CHANGING rather than on it being non-empty, so a
     * signal that has always sat in its theme never animates, and one that
     * leaves a theme is not treated as arriving in one.
     */
    for (const sig of signals) {
      const now = placementOf(sig);
      const before = seenPlacement.current.get(sig.artifactId);
      if (justGrouped(before, now)) freshlyGrouped.add(sig.artifactId);
      seenPlacement.current.set(sig.artifactId, now);
    }
  }

  return (
    <div className="flex flex-col gap-mrd-5">
      {/*
       * WHERE THE RUN CAME FROM, ABOVE WHAT IT IS FOR. The two are a chain and
       * this is its first link: the cluster that crossed the bar, then the
       * problem that cluster describes, then the evidence itself. A person
       * reading top to bottom is reading the causation in order.
       */}
      <Lineage
        themes={themes}
        origin={origin}
        hasSignals={signals.length > 0}
        workspaceId={workspaceId}
      />
      {/*
       * WHAT THE WORK IS FOR COMES BEFORE THE EVIDENCE FOR IT (gap #16).
       * Discover's shape is the frame the evidence below sits inside: the
       * problem, what should be true instead, and who it touches. A person
       * opening a track reads what it is about first and the findings second,
       * and until now the run had the second and not the first.
       */}
      <WhatWereSolving trackId={trackId} hasEvidenceBelow={groups.length > 0 || loose.length > 0} />
      {/*
       * WHAT IS STILL UNSETTLED, DRAWN ALWAYS (gap #29). It reads S0's
       * `getTrackHandoffs` itself rather than taking a prop: the narrowing of
       * free-form `payload` belongs on the server, once, which is why I refused
       * to do it client-side and asked for the reader instead.
       */}
      <OpenQuestions trackId={trackId} stationLabel="Discover" stationRan />
      {groups.map((g) => {
        const t = themeById.get(g.themeId);
        const members = g.signals;
        const arrived = freshThemes.has(g.themeId);
        const heading = t?.title ?? t?.word ?? g.title ?? "This pattern";
        return (
          <section
            key={g.themeId}
            aria-label={heading}
            style={enterMotion(arrived, reducedMotion)}
            className="flex flex-col gap-mrd-2 border-b border-mrd-line-soft pb-mrd-4 last:border-0"
          >
            {t ? (
              <ThemeCard item={t} trackId={trackId} />
            ) : g.title ? (
              /*
               * NAMED BUT NOT HELD. The theme is not a member of this track, so
               * there is no artifact to open and no card to draw. The pattern's
               * NAME is on the signal row (F-129), and printing it is the whole
               * point: it is what the machine found. Nothing here pretends to
               * be a theme card, because a card implies something to open --
               * but the name it prints IS renameable, and used not to be.
               */
              <PatternName themeId={g.themeId} title={g.title} trackId={trackId} />
            ) : /* Unreachable: `groupByThePattern` sends a pattern it can
                 neither draw nor name to `ungrouped` rather than heading it
                 with a blank. Left as nothing rather than as an empty heading,
                 which is the same call made upstream. */
            null}
            {members.map((s) => (
              <div
                key={s.artifactId}
                style={
                  /*
                   * Only when the theme itself is NOT arriving: the section
                   * above is already animating, and animating both makes one
                   * event look like two.
                   */
                  enterMotion(freshlyGrouped.has(s.artifactId) && !arrived, reducedMotion)
                }
              >
                <SignalCard item={s} now={now} trackId={trackId} patternShownAbove />
              </div>
            ))}
            {/*
             * HOW MANY OF THESE WE WROTE OURSELVES (S4-183, applied to a pane
             * that was already live and had never said it). 62.7% of the whole
             * signals table is `source='agent'`, and four real tracks this pane
             * renders are at or above 93% -- one at 100%. "67 signals" reads as
             * sixty-seven things the world said. Silent when none are ours and
             * silent when the record cannot say; see the module for both.
             */}
            {(() => {
              const line = whoWroteLine(
                members.length,
                weWrote(
                  members.map((m) => ({
                    source: (m.fields as Record<string, unknown> | undefined)?.source as
                      string | null | undefined,
                  })),
                ),
              );
              return line ? <span className="mrd-meta">{line}</span> : null;
            })()}
          </section>
        );
      })}

      {loose.length > 0 ? (
        <section aria-label="Not yet grouped" className="flex flex-col gap-mrd-2">
          <span className="mrd-meta">
            {loose.length === 1
              ? "One piece of evidence does not sit with any pattern yet."
              : `${loose.length} pieces of evidence do not sit with a pattern yet.`}
          </span>
          {loose.map((s) => (
            <SignalCard key={s.artifactId} item={s} now={now} trackId={trackId} patternShownAbove />
          ))}
        </section>
      ) : null}

      {/* Members the lookup ran on and did not find: kept as titles, never
          hidden -- the chain's own rule, applied here too. */}
      {missing.map((m) => (
        <MemberLine key={`${m.kind}:${m.artifactId}`} m={toMemberLine(m)} now={now} />
      ))}
    </div>
  );
}

function StationPanel({
  stop,
  view,
  decisions,
  everDriven,
  hold,
  holdReason,
  origin = null,
  workspaceId = null,
  openArtifactId = null,
  now,
  trackId,
}: {
  stop: ChainStop;
  view?: StationArtifactView;
  /** Every decision this track filed, for the by-key learning join. */
  decisions?: ArtifactView[];
  everDriven: boolean;
  hold: string | null;
  /**
   * The RAW `last_hold`, never the prose. `panelSaysItFiledNothing` reads it to
   * decide whether this panel's own empty sentence would repeat, or contradict,
   * the hold line rendered directly beneath it.
   */
  holdReason: string | null;
  /** `spine_tracks.origin`, read by Discover's lineage line and nothing else. */
  origin?: string | null;
  /** Whose promotion bar the lineage compares against. See `Lineage`. */
  workspaceId?: string | null;
  /**
   * The artifact the person opened, which leads this panel.
   *
   * Without it the panel led with whatever the station EXPECTS -- the spec at
   * Plan, the changeset at Build -- which is right when nobody has chosen and
   * wrong the moment somebody has: pressing the third prototype and being shown
   * the first is the defect P-24 exists to close, moved one component along.
   */
  openArtifactId?: string | null;
  now: number;
  /** Routes the Discover cards' writes back to this pane's cache entries. */
  trackId: string;
}) {
  /*
   * ── WHAT JUST LANDED, AND ONLY WHAT JUST LANDED ────────────────────────
   * The founder's ask is that the agentic work be SEEN. The most convincing
   * moment this pane has is the one where a station's output APPEARS: the spec
   * that was not there a second ago, the code change, the release. Until now it
   * blinked into existence between two polls, so the single event worth
   * noticing looked identical to a re-render.
   *
   * SO THE MOTION ENCODES A FACT AND NOTHING ELSE. An item animates only when
   * its key was absent on the previous pass, which is the same primed/seen pair
   * `TrackActivity` and `SenseBody` already run on. Nothing animates on first
   * paint, because arriving at a finished run is not an arrival; nothing
   * animates on a refetch that returned the same rows; and nothing loops. A
   * surface that replayed this on every poll would be showing work that is not
   * happening, which is the one thing this product may never do.
   *
   * ── STAGGER, CAPPED ──────────────────────────────────────────────────────
   * When a station files six things at once they land in sequence rather than
   * together, which reads as a hand putting them down instead of a flash. The
   * step is capped so a burst of twenty does not turn into a second of
   * choreography: past the sixth they share the last delay. Frequency of use
   * cuts the duration, and this is a thing a person watching a run sees often.
   *
   * Inline style rather than a class, deliberately: meridian.css's
   * reduced-motion block matches on the style attribute (`[style*="mrd-fade-up"]`
   * at meridian.css:2089), so declared as a utility it would keep animating for
   * someone who asked it not to.
   *
   * THAT BLOCK ONLY ANSWERS THE OPERATING SYSTEM. It sits under
   * `@media (prefers-reduced-motion: reduce)`, and `data-motion` appears NOWHERE
   * in `src/styles/` at all, meridian.css included. So the in-product toggle
   * never reached this and the motion is gated here instead, at the source. See
   * `spine/enter-motion.ts`.
   */
  const reducedMotion = usePrefersReducedMotion();
  const primed = React.useRef(false);
  const seen = React.useRef<Set<string>>(new Set());
  const landedKeys = (view?.items ?? stop.members).map((m) => `${m.kind}:${m.artifactId}`);
  const landedSig = landedKeys.join("|");
  React.useEffect(() => {
    if (landedKeys.length === 0) return;
    if (!primed.current) {
      for (const k of landedKeys) seen.current.add(k);
      primed.current = true;
      return;
    }
    const t = window.setTimeout(() => {
      for (const k of landedKeys) seen.current.add(k);
    }, 0);
    return () => window.clearTimeout(t);
    // `landedSig` is the value that matters; the array identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landedSig]);

  let landedSoFar = 0;
  const arrival = (key: string): React.CSSProperties | undefined => {
    if (!primed.current || seen.current.has(key)) return undefined;
    const motion = enterMotion(true, reducedMotion);
    if (!motion) return undefined;
    const step = Math.min(landedSoFar++, 5) * 40;
    return { ...motion, animationDelay: `${step}ms` };
  };

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
        {/*
          WHO REPORTS AN EMPTY STATION, when both lines can. Three hold reasons
          already say what this station filed, one of them saying the opposite
          of this sentence. See `who-reports-an-empty-station.ts` for the twelve
          tracks it was doubling on and why the reason is read raw.
        */}
        {panelSaysItFiledNothing(holdReason) ? (
          <RecordSpeaks>{`${stop.label} ran and filed no ${noun}.`}</RecordSpeaks>
        ) : null}
        {/*
          NOT A `Row` AT ALL, AND THE CLIP WAS ONLY HALF OF IT.
          `tight` truncated this sentence, and `tight`'s contract is a row whose
          full content has a detail view to open, which a hold has none of. But
          `Row` also reserves a fixed 34px mark slot whether or not it carries a
          mark, so a lone sentence rendered through it sat indented from the
          prose directly above it, aligned to a rail that had nothing on it. Two
          sentences, one voice, two left edges. It is prose, so it renders as
          prose, next to the line it belongs with.
        */}
        {hold ? <RecordSpeaks>{hold}</RecordSpeaks> : null}
        {/* NO DEAD END, EVER (SESSION-1 unit 5), and this is where the 47
            tracks that filed nothing actually land. */}
        <NothingToRead station={stop.station} />
        {/* AND WHAT IS STILL UNSETTLED (gap #29). Here as well as in `SenseBody`
            because THIS is the branch a Discover stop with zero members reaches
            -- 47 tracks -- and `SenseBody` never runs for them. RUN-134 shipped
            that exact mistake with `NothingToRead` and it is the same shape. */}
        {stop.station === "sense" ? (
          <OpenQuestions trackId={trackId} stationLabel="Discover" stationRan />
        ) : null}
      </div>
    );
  }

  /*
   * WHAT THIS STEP PRODUCED, IN ONE SENTENCE, ABOVE THE THINGS IT PRODUCED
   * (gap #28). The panel already spoke when a station filed NOTHING -- "Plan
   * ran and filed no spec" -- and said nothing at all when it filed something,
   * so the run could report absence and not presence.
   *
   * DECLARED ABOVE THE DISCOVER BRANCH, not inside the general one, and that
   * was found by driving it: `SenseBody` returns early, so the first version
   * reached every station EXCEPT the one where a count helps most. Discover on
   * track `425e6887` holds 33 clusters and dozens of findings, and it was the
   * one tab with no sentence.
   *
   * Reads the chain's members rather than the artifacts read, so it is there on
   * first paint instead of arriving a poll later than the cards it introduces.
   */
  const produced = whatItProduced(stop.label, stop.members);

  /*
   * BODIES WHERE THE READ EXISTS. The artifacts read and the chain derive
   * position from the same builder, so they cannot disagree about what exists.
   * While the artifacts read is in flight the member titles render; a kind
   * with no body renderer keeps its title line rather than pretending.
   */
  const items = view?.items;
  const primaryItem =
    /* THE PERSON'S CHOICE OUTRANKS THE STATION'S EXPECTATION. */
    (openArtifactId
      ? items?.find((it) => it.artifactId === openArtifactId && !it.missing)
      : undefined) ??
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
      case "deployment":
        /* The same `decisions` list `LearningCard` grades against, so the
           release and the verdict quote one row rather than two reads. */
        return <ReleaseCard item={item} decisions={decisions} />;
      default:
        return null;
    }
  };

  if (items) {
    /*
     * DISCOVER GETS ITS OWN BODY (THE-ONE-SCREEN station 1). Signals grouped
     * under their themes, the not-yet-clustered named as such -- see
     * SenseBody. Everything else keeps the primary-plus-lines shape below.
     */
    if (stop.station === "sense") {
      return (
        <div className="flex flex-col gap-mrd-4">
          {produced ? <span className="mrd-meta">{produced}</span> : null}
          <SenseBody
            items={items.filter((it) => it.kind === "signal" || it.kind === "theme" || it.missing)}
            now={now}
            trackId={trackId}
            origin={origin}
            workspaceId={workspaceId}
          />
        </div>
      );
    }

    /*
     * TASKS AND MISSIONS NEVER GET TO BE PRIMARY — no station expects them —
     * so under the primary-plus-lines rule they rendered as bare titles
     * forever: the plan's whole breakdown as opaque rows. They render as
     * themselves instead: the tasks as ONE ordered step list, each mission as
     * its card. Everything else keeps the title line it had.
     */
    const stepItems = items.filter((it) => it.kind === "task" && !it.missing);
    const missionItems = items.filter((it) => it.kind === "mission" && !it.missing);
    /* Which titles are printed more than once in THIS list, so a row that has a
       twin can say the one thing its twin cannot. See `repeatedTitles`. */
    const repeats = repeatedTitles(items);
    return (
      <div className="flex flex-col gap-mrd-4">
        {/* Quiet, and above everything: it introduces the cards rather than
            competing with them, and a person who reads only this line has
            still been told what the step did. */}
        {produced ? <span className="mrd-meta">{produced}</span> : null}
        {primaryItem ? (
          <div style={arrival(`${primaryItem.kind}:${primaryItem.artifactId}`)}>
            {bodyFor(primaryItem)}
          </div>
        ) : null}
        {stepItems.length > 0 ? <TaskSteps items={stepItems} /> : null}
        {/* P-21. Drawn at Plan, which is the station that produces the shape the
            playbook's `spec.md` and `plan.md` describe, and where a person is
            already reading the spec above. It renders nothing until the record
            holds something to put in them. */}
        {stop.station === "define" ? <PlaybookFilesPanel trackId={trackId} /> : null}
        {missionItems.map((m) => (
          <MissionCard key={`mission:${m.artifactId}`} item={m} origin={origin} />
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
          const key = `${item.kind}:${item.artifactId}`;
          return (
            <div key={key} style={arrival(key)}>
              <MemberLine
                m={toMemberLine(item)}
                now={now}
                repeated={repeats.has((item.title ?? "").trim().toLowerCase())}
              />
            </div>
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
          <MemberLine
            key={`${m.kind}:${m.artifactId}`}
            m={m}
            now={now}
            repeated={repeatedTitles(stop.members).has((m.title ?? "").trim().toLowerCase())}
          />
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

/**
 * ── A ROW THAT REPEATS NEEDS A FACT THAT SEPARATES IT ─────────────────────
 *
 * Founder report via A1, 2026-09-02, walking `ce846e9b`: Design's list printed
 * *OTA Firmware Reboot Status Tile* four times and *...Tile Differentiation*
 * four times, and every one of the eight rows also read "1d ago", because
 * `relativeTime` rounds and all ten prototypes were filed inside the same
 * minute. Eight rows, two facts between them. A reader cannot tell which is
 * which, cannot tell whether it is one thing drawn four times or four things,
 * and has no reason to press any particular one.
 *
 * This is the discriminator rule, which this repo has already paid for twice:
 * `what-it-produced.ts` counts repeated titles and says so, and
 * `an-example-says-so` was written for the same defect on another surface. The
 * rule is that a row identical to its neighbour must carry a fact that is not.
 *
 * Returns the lower-cased titles that appear more than once, so the caller can
 * ask per row rather than re-scanning. Exported for its test.
 */
export function repeatedTitles(
  members: ReadonlyArray<{ title: string | null; missing?: boolean }>,
): Set<string> {
  const counts = new Map<string, number>();
  for (const m of members) {
    if (m.missing) continue;
    const t = (m.title ?? "").trim().toLowerCase();
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([t]) => t));
}

/**
 * The instant, to the second, in the viewer's own locale.
 *
 * Seconds are included on purpose: ten prototypes filed by one seat land inside
 * the same minute, so minute precision would produce eight identical rows again
 * with a longer string on them.
 */
function exactTime(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(ms));
}

/** First letter up, for a kind word standing in for a title it never had. */
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function MemberLine({
  m,
  now,
  repeated = false,
}: {
  m: ChainMember;
  now: number;
  /** This row's title is printed by at least one sibling. See above. */
  repeated?: boolean;
}) {
  return (
    <Row
      tight
      lead={m.missing ? `This ${m.word} is no longer there` : (m.title ?? cap(m.word))}
      /* The exact instant replaces the rounded one ONLY where the rounded one
         has stopped distinguishing anything. On a row that is already unique,
         "1d ago" is the more readable of the two and it stays. */
      time={repeated ? exactTime(m.createdAt) : relativeTime(m.createdAt, now)}
      action={
        m.missing ? <Value tone="fail">not found</Value> : <Value tone="quiet">{m.word}</Value>
      }
    />
  );
}

/**
 * ── WHAT YOU CAN ACTUALLY DO TO THE THING THAT IS OPEN ────────────────────
 *
 * P-24 asks the head to state the actions that exist and *"never an edit
 * control that does nothing"*. That is a rule about honesty rather than about
 * layout: a person who opens a prototype and reads nothing about editing has
 * learnt something true, and a person who meets a disabled Edit button has
 * learnt something false about the product.
 *
 * So this is derived from what the body BELOW it actually mounts, and every
 * line was checked against that body rather than assumed:
 *
 *   prd         `PlanSpec` saves the whole document back (`savePrd`).
 *   decision    `DecisionVerdict` approves or rejects while pending, and
 *               `ForecastForm` records the forecast ONCE. Write-once is stated,
 *               because "editable" would be wrong on the second visit.
 *   learning    `SettleControls` grades or defers; `ReopenControl` disagrees.
 *   signal      the card can be discarded, in two acts.
 *   theme       the card renames and dismisses.
 *   prototype   `PrototypeCard` reads two tables and renders an iframe. No
 *   deployment  `ReleaseCard` renders a chip, a sha and a link. No write.
 *   changeset   `ChangesetCard` renders the diff, the PR link and the verdict.
 *   task        drawn inside `TaskSteps`, which writes nothing.
 *   mission     `MissionCard` renders and writes nothing.
 *
 * An unknown kind returns null and the head says nothing, which is the honest
 * answer for a kind this build has never drawn.
 */
export function whatYouCanDo(kind: string): string | null {
  switch (kind) {
    case "prd":
      return "Edit it and save the whole document back.";
    case "decision":
      return "Approve or reject it while it is pending. The forecast is recorded once and cannot be edited after.";
    case "learning":
      return "Grade it, defer the check, or disagree with the verdict.";
    case "signal":
      return "Discard it, which takes two presses.";
    case "theme":
      return "Rename it, or say it is not a pattern.";
    case "prototype":
      return "Open it full size. There is no editor for a prototype yet.";
    case "changeset":
      return "Open the pull request. The diff and the verdict are read-only here.";
    case "deployment":
      return "Open what went out. A release is a record and is not edited.";
    case "task":
    case "mission":
      return "Read-only. Nothing here writes.";
    default:
      return null;
  }
}

/**
 * The head above whatever is open: what it is, who filed it, where, and when.
 *
 * ── WHY A HEAD AT ALL ────────────────────────────────────────────────────
 * With the station strip gone, a person arriving at this pane from a chip has
 * no other way to know WHICH of ten prototypes they are looking at, or that
 * they are looking at a pinned selection rather than at the newest thing. The
 * head answers both, and carries the way back.
 *
 * Every clause is dropped where its fact is missing. A seat the record cannot
 * name, a title that was never written: absent rather than "unknown", which is
 * the rule the rest of this file follows.
 */
function OpenHead({
  item,
  stationLabel,
  seat,
  now,
  onBack,
}: {
  item: ArtifactView;
  stationLabel: string;
  seat: string | null;
  now: number;
  onBack: () => void;
}) {
  const can = whatYouCanDo(item.kind);
  return (
    <div className="flex flex-col gap-mrd-1 border-b border-mrd-line-soft pb-mrd-3">
      <div className="flex flex-wrap items-baseline justify-between gap-mrd-3">
        <span className="min-w-0 text-mrd-label font-medium text-mrd-ink">
          {item.title ?? cap(item.word)}
        </span>
        {/*
         * THE WAY BACK, named for where it goes rather than for what it undoes.
         * "Clear" would describe the mechanism; a person wants the newest thing
         * the run made, which is where this pane opens on its own.
         */}
        <Action variant="quiet" onClick={onBack}>
          Back to the newest
        </Action>
      </div>
      <span className="mrd-meta">
        {[
          item.word,
          seat ? `filed by ${seat}` : "",
          `at ${stationLabel}`,
          relativeTime(item.createdAt, now),
        ]
          .filter(Boolean)
          .join(" \u00B7 ")}
      </span>
      {can ? <span className="mrd-meta text-mrd-faint">{can}</span> : null}
    </div>
  );
}

export function ArtifactPane({
  trackId,
  activeArtifactId = null,
  onOpenArtifact,
  isRunning = false,
}: {
  trackId: string;
  /**
   * ── AN ARTIFACT ID, NOT A STATION (P-24) ────────────────────────────────
   *
   * This was a station, and that is exactly the defect the founder reported:
   * *"When I click on the PRD the right side should open up."* A station points
   * at one thing per station, so on a Design step that filed ten prototypes the
   * third one could be seen in the transcript and not opened. An id points at
   * the thing itself, and the station is derived from it.
   *
   * Null means nobody has picked, and the pane opens on the newest thing the
   * run made.
   */
  activeArtifactId?: string | null;
  /** Null clears the selection and returns the pane to the newest artifact. */
  onOpenArtifact?: (artifactId: string | null) => void;
  /** PHASE 3: Poll faster during active run to show live updates. */
  isRunning?: boolean;
}) {
  const fChain = useServerFn(getTrackChain);
  const fArtifacts = useServerFn(getTrackArtifacts);
  /* Whose promotion bar Discover's lineage compares a cluster against. Read
     here and handed down, so `SenseBody` stays renderable without a shell. */
  const { activeWorkspaceId } = useWorkspace();
  /** What the last Take this handed over, said once and left standing. */
  const [took, setTook] = React.useState<string | null>(null);
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

  /*
   * ── WHO FILED THE THING THAT IS OPEN ─────────────────────────────────────
   *
   * `spine_track_members` records WHAT was filed and WHERE, and carries no
   * author: the seat that did it is on `agent_runs`, which the transcript
   * already reads. So the head line's "filed by" clause comes off the SAME
   * cache entry the transcript polls -- one request on one beat, which is the
   * rule this surface is built on -- rather than a second read of a third
   * table.
   *
   * A seat this map cannot name drops the clause rather than guessing. An
   * artifact filed before `agent_runs.track_id` existed has no turn to join to,
   * and "filed by somebody" is not a fact.
   */
  const fActivity = useServerFn(getTrackActivity);
  const activity = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fActivity({ data: { trackId } }),
    staleTime: 5_000,
  });
  const seatByArtifact = React.useMemo(() => {
    const book = new Map<string, string>();
    for (const t of activity.data?.turns ?? []) {
      for (const m of t.made) if (t.agentName) book.set(m.id, t.agentName);
    }
    return book;
  }, [activity.data]);

  /*
   * ── THE SELECTION IS NOT THIS COMPONENT'S ANY MORE (P-24) ────────────────
   *
   * It used to keep its own `activeState` and fall back to it when no prop
   * arrived. That made two sources of truth for one pointer, and the URL is now
   * the one that matters, because a person wants to send a colleague the spec
   * rather than the run. An uncontrolled fallback here would be a second answer
   * that only this pane can see and nobody can share.
   *
   * A CONTEXT CHANGE STILL MOVES FOCUS (D-7.2, R-19's keyboard clause). The
   * control that changed it is a chip in the other pane or above this one, so
   * the person's focus is where they put it and what they have not been given is
   * the content that changed.
   *
   * `preventScroll`, and driving it is what showed why: the chips naming what
   * the run made sit at the TOP of this pane's own scroller, and a plain
   * `focus()` scrolled the panel into view, taking them off screen the instant
   * one was pressed. The control vanished as a result of being used.
   */
  React.useEffect(() => {
    if (!activeArtifactId) return;
    document.getElementById(`artifact-pane-${trackId}-panel`)?.focus({ preventScroll: true });
  }, [activeArtifactId, trackId]);

  if (q.isLoading) return <Reading>Reading what this work has made.</Reading>;
  if (q.isError) {
    return (
      <ReadFailedLine error={q.error}>
        The record did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );
  }

  const chain = q.data?.chain;
  const track = q.data?.track;
  if (!track || !chain || chain.stops.length === 0) {
    return <ReadFailedLine>That work could not be found.</ReadFailedLine>;
  }

  /*
   * ── THE NEWEST THING THE RUN MADE WINS THE FIRST PAINT (founder, 2026-09-02)
   *
   * This used to open on where the work STANDS. That was right while a strip of
   * seven stations sat above the pane saying where that was; with the strip gone
   * it is the wrong default, because the station a run is standing at is very
   * often the one that has filed nothing -- 81 of 106 tracks are parked at
   * Discover with an empty record -- so the pane opened on a blank.
   *
   * The newest artifact is what a person arriving actually wants: the last thing
   * that happened. Where the work stands remains the fallback for a run that has
   * made nothing at all, because then there is no newer fact and the standing
   * station is the only honest answer.
   *
   * The person's own click outranks both, and always did.
   */
  const newest = (bodies.data?.stops ?? [])
    .flatMap((st) =>
      st.items
        .filter((i) => !i.missing)
        .map((i) => ({ station: st.station, at: Date.parse(i.createdAt) })),
    )
    .filter((x) => Number.isFinite(x.at))
    .sort((a, b) => b.at - a.at)[0];
  const standing =
    chain.stops.find((s) => s.state === "here") ??
    [...chain.stops].reverse().find((s) => s.state === "passed") ??
    chain.stops[0];
  const fallback =
    newest && chain.stops.some((s) => s.station === newest.station)
      ? newest.station
      : standing.station;
  /*
   * THE OPEN ARTIFACT DECIDES THE STATION, not the other way round. An id is
   * unique across the whole chain -- one `spine_track_members` row is one filing
   * event at one station -- so finding it also answers where it was filed, and
   * the pane can never show a station that does not contain the thing it claims
   * to be showing.
   *
   * A `missing` artifact is not openable: the lookup ran and the row was not
   * there, so the selection falls through to the newest rather than opening a
   * panel that has to explain itself.
   */
  const opened = activeArtifactId
    ? (bodies.data?.stops ?? [])
        .flatMap((st) => st.items.map((i) => ({ station: st.station, item: i })))
        .find((x) => x.item.artifactId === activeArtifactId && !x.item.missing)
    : undefined;

  /*
   * ── A LINK TO SOMETHING THAT IS NOT HERE MUST SAY SO ────────────────────
   *
   * `?artifact=<id>` is shareable, which means it will be shared, reloaded a
   * week later, and pasted with a typo. Three things can make it resolve to
   * nothing: the artifact belongs to a different run, its row was deleted, or
   * the id is simply wrong. In every one of those the pane would silently show
   * the newest thing instead, and the person following the link would believe
   * they were looking at what it named. That is the substitution this repo has
   * paid for repeatedly, arriving through the front door of a feature built for
   * sharing.
   *
   * Only claimed once the READ HAS ANSWERED. While `bodies` is in flight,
   * nothing is missing yet; it is merely unknown, and those are different facts.
   */
  const unresolved = Boolean(activeArtifactId) && Boolean(bodies.data) && !opened;

  const current =
    opened && chain.stops.some((s) => s.station === opened.station) ? opened.station : fallback;
  const now = Date.now();
  const shown = chain.stops.find((s) => s.station === current) ?? chain.stops[0];

  const view = bodies.data?.stops.find((s) => s.station === shown.station);

  /*
   * TAKE THIS — the one control RANKED-BACKLOG authorises on this Region, and
   * it is scoped to the tab shown rather than to the whole run. The reasoning,
   * the format and why it is a file rather than a clipboard copy are all in
   * `station-file.ts`; this is the press.
   *
   * NOT DISABLED ON AN EMPTY STATION, on purpose. A control that vanishes when
   * a station filed nothing takes the evidence of the gap with it, and 81 of
   * 106 tracks are sitting at Discover having filed nothing. The file says so
   * in words instead.
   */
  const take = () => {
    const name = fileNameFor(track.title, shown.label);
    const items = (view?.items ?? []).map((i) => ({
      kind: i.kind,
      word: i.word,
      title: i.title,
      missing: i.missing,
      fields: i.fields as Record<string, unknown>,
    }));
    const body = stationFile({
      trackTitle: track.title,
      stationLabel: shown.label,
      station: shown.station,
      expects: view?.expects?.word ?? null,
      gap: shown.gap,
      waivedReason: shown.waivedReason,
      items,
      url: `${window.location.origin}/track/${trackId}`,
    });
    /* The proven shape, `DataSection.tsx:91`. An object URL revoked in the same
       turn, so nothing is left holding the blob. */
    const url = URL.createObjectURL(new Blob([body], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    setTook(tookItLine(name, items.filter((i) => !i.missing).length));
  };

  return (
    /*
      ── THE FOURTH STATION LIST GOES (2026-09-02) ─────────────────────────
      The run screen drew the seven stations FOUR times: the shell's strip, the
      route in the left pane, this tab row, and TrackChain's own station rows
      further down -- plus a fifth statement in prose, "Now: Build. Next: Ship."
      Measured on the running page: 2 tablists, and the seven station names
      appearing between 4 and 23 times each in the rendered text.

      THIS ROW IS THE ONE THAT GOES, and it is not the biggest of the four --
      it is the one whose job the strip already does. Both were tablists over
      the same `paneStation` state, verified by clicking a strip chip and
      watching this row move with it. Two controls over one pointer is not
      redundancy in the harmless sense; it is two places a person can look for
      the same switch and two places it has to be kept working.

      THE STRIP IS THE BETTER OF THE TWO, and reachability decides it rather
      than taste. The strip sits outside both scrollers and never scrolls away.
      This row lives inside the right pane's own scroller -- at scrollTop 1200
      its top is at y=-795, which is to say a person deep in a station's output
      has no station control on screen at all.

      ── AND THEN THE STRIP WENT TOO (founder, 2026-09-02 19:25) ───────────
      The paragraph above chose between two station displays; the founder's
      question about the strip removed the category. There is no station display
      on this screen now. The pane follows the SELECTED TRANSCRIPT ROW, which is
      the same gesture with one fewer control and a truer subject: you point at
      the thing that happened rather than at the stage it happened in, and a
      station that filed nothing has no row to press, so it cannot open a blank.
    */
    <Region
      title="What it has made"
      /*
       * ── THE SENTENCE FOLLOWED THE CONTROL, TWICE ──────────────────────────
       * It read "pick a step to see its output" while the tabs were in this
       * pane, then "pick a stage on the strip above" when they moved there. The
       * strip is now gone too, and the control is a row in the transcript, so
       * the sentence says where the control actually is. A `sub` naming a
       * control that is not on the screen is worse than no `sub` at all.
       */
      sub={
        opened
          ? `Showing one thing this run made. Press any artifact in the record beside this to open it.`
          : `Showing ${shown.label}. Press an artifact in the record beside this to open it.`
      }
      act="Take this"
      onAct={take}
    >
      {/* WHAT IT TOOK, SAID. Brief unit 9: "the control says what it copied."
          A download that reports nothing is a control a person cannot tell
          worked, and this one hands over a file they then have to find. */}
      {took ? (
        <p role="status" aria-live="polite" className="mrd-meta">
          {took}
        </p>
      ) : null}
      {/* The pane polls; when the shown station's body changes (a spec saved,
          a decision recorded), the change is said politely rather than
          silently repainting. */}
      <div aria-live="polite">
        {/*
         * A LABELLED `region`, NOT MERIDIAN'S `TabPanel` (P-16, found live by
         * A1 2026-09-02 21:40). `TabPanel` renders `role="tabpanel"`, which
         * ARIA reserves for a panel a `tablist`/`tab` pair actually controls --
         * true here once, when the pane's own tab row (then its replacement
         * strip) drove this via `active`/`group`. Both are gone (see this
         * file's header), so `role="tabpanel"` is now an orphaned role: a
         * screen reader announces a tab panel with no tablist to relate it to.
         * `id`, `tabIndex={-1}` and the focus-on-selection-change effect above
         * are unchanged from what `TabPanel` gave this element -- only the
         * role and the name-source (a direct label, not a borrowed tab id)
         * move to match what actually drives the pane now.
         */}
        <div
          data-mrd=""
          id={`artifact-pane-${trackId}-panel`}
          role="region"
          aria-label={`${shown.label} output`}
          tabIndex={-1}
          className="mt-mrd-5"
        >
          {/*
           * WHAT IS OPEN, SAID ABOVE IT. With no station strip on the screen, a
           * person arriving here from a chip has no other way to know which of
           * ten prototypes they are looking at, or that they are looking at a
           * pinned selection rather than at the newest thing the run made.
           */}
          {unresolved ? (
            <div className="flex flex-wrap items-baseline justify-between gap-mrd-3 border-b border-mrd-line-soft pb-mrd-3">
              <span className="min-w-0 text-mrd-small text-mrd-mute">
                That link names something this run does not hold. It may belong to another run, or
                its record may be gone. Showing the newest thing this run made instead.
              </span>
              <Action variant="quiet" onClick={() => onOpenArtifact?.(null)}>
                Back to the newest
              </Action>
            </div>
          ) : null}
          {opened ? (
            <OpenHead
              item={opened.item}
              stationLabel={shown.label}
              seat={seatByArtifact.get(opened.item.artifactId) ?? null}
              now={now}
              onBack={() => onOpenArtifact?.(null)}
            />
          ) : null}
          <StationPanel
            stop={shown}
            view={view}
            /* The thing the person actually pressed leads the panel, rather
               than whatever the station happens to expect. See `primaryItem`. */
            openArtifactId={opened?.item.artifactId ?? null}
            /* Discover's lineage reads it; no other station does. See `Lineage`
               for why the promotion is claimed from this sentence and not from
               `theme_id`. */
            origin={track.origin}
            workspaceId={activeWorkspaceId ?? null}
            /*
             * EVERY STOP, NOT JUST DECIDE, and this was hiding the one thing
             * the product exists to show.
             *
             * `LearningCard` finds the call its verdict grades by exact id --
             * `x.artifactId === decision_id` -- and that fix is already recorded
             * in its own header, because matching "the first decision on the
             * decide stop" once put a verdict beside the wrong forecast. What
             * was never widened is the LIST it searches. A decision recorded at
             * any other station was invisible to it.
             *
             * Measured on `d1168015`, the only track in the database that has
             * walked all seven stations: its learning carries
             * `decision_id = 663c7376`, that decision is a member of the track,
             * it holds a real `forecast_claim` -- "The PRD will be approved and
             * design gate cleared within 3 business days" -- and it is filed at
             * the SHIP stop. So the lookup came back empty and the Learn tab
             * said "Nothing was recorded as expected, so there is nothing to
             * check against", directly above a graded belief reading "Did not
             * hold". Two sentences, one screen, and the first was false.
             *
             * That is the moat surface. A forecast written at decision time is
             * the one artifact this product claims nothing else has, and on the
             * single run that reached Learn it was being denied.
             *
             * Widening cannot mis-match, which is why this is the right fix
             * rather than a lookup by station: the match is an exact id, so a
             * larger haystack finds the same needle or none.
             */
            decisions={decisionsForGrading(bodies.data?.stops)}
            everDriven={track.drivenAt !== null}
            hold={track.hold}
            holdReason={track.holdReason ?? null}
            now={now}
            trackId={trackId}
          />
        </div>
      </div>
    </Region>
  );
}

export default ArtifactPane;
