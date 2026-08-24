/**
 * One decision, opened. Brain > Decisions > ?decision=.
 *
 * REBUILT on the shell primitives, 2026-07-29. The founder's complaint was
 * exactly this file: "If something I click that opens up, let's say PRD it
 * opens up, approval pin it opens up or something of similar sort, that also
 * needs to be of same theme." The route was ported; this, the thing the route
 * opens, was not, so clicking a row put the legacy design back on screen.
 *
 * WHAT WENT, and why:
 *   KILLED the DetailKit anatomy (DetailHeader, DetailSection, StatStrip,
 *     StatCell). It is the retired system's detail grammar and it does not
 *     resolve against this shell. Block is the ported equivalent, and it
 *     already draws a rule wherever the content changes register.
 *   KILLED the material-medium card wrapping the whole detail, and the tinted
 *     "summary band" card inside it. Two bordered containers in one region is
 *     one more than the standard allows (anti-slop ban 5), and the band was a
 *     card in a card in a card.
 *   KILLED the summary band entirely for a second reason: it printed the
 *     rationale, and then the "Why" section printed the same rationale again
 *     eleven lines later. The same paragraph twice on one screen is hard ban 10
 *     in its purest form. The rationale is said once, under Why.
 *   KILLED VerdictChip, StatusPill, MonoLabel, AuditTag and AutoChip. A chip is
 *     a coloured box saying a word; the word is enough, and green and red
 *     already carry the outcome through sp-pass / sp-fail. The trace id lives
 *     in the head as plain mono via Num.
 *   KILLED the hand-rolled StateCard error and not-found boxes. A failed read
 *     is Failed with a retry, and it must never wear an empty state's clothes.
 *   KILLED the VERDICT PICKER'S three-chip row. Three chips at 50% opacity with
 *     aria-pressed is a radio group wearing a costume; Choices is the primitive,
 *     it is one tab stop, and the arrow keys move within it.
 *   KILLED every toast on a consequential write. Settling a call rewrites what
 *     every agent reads before it touches the same surface again, and sharing
 *     one puts it on the public internet. Both leave a Receipt carrying the real
 *     consequence (agents/FINAL-agent-presence.md R10). The clipboard copy keeps
 *     a toast: copying is not a write, it changes nothing, and there is nothing
 *     for a receipt to record.
 *
 * UNCHANGED: listDecisions / updateDecision / getDecisionJudgment / getLineage
 * / getDecisionShareState / setDecisionShared, every query key including the
 * shared ["decisions", ...] cache, the ?decision= drill contract, the
 * ShareDecisionButton export, and the ContradictionAuditSection mount.
 *
 * STILL LEGACY, and named rather than hidden: StageTimeline lives in
 * components/shared and RewindButton in components/decisions, neither of which
 * this lane owns. They are mounted as they were and will re-skin with their own
 * files.
 */
import { useState } from "react";
import { Row, Line } from "@/components/meridian/rows";
import {
  Num,
  Actions,
  Action,
  Region,
  Reading,
  ReadFailed,
  NothingHere,
  Value,
} from "@/components/meridian/surface-parts";
import { Choices, Field, Input, Textarea } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/lib/notify";
import {
  listDecisions,
  updateDecision,
  setDecisionForecast,
  forecastRefusal,
  type DecisionSource,
} from "@/lib/decisions.functions";
import { getDecisionShareState, setDecisionShared } from "@/lib/decisions-share.functions";
import { getDecisionJudgment } from "@/lib/decision-judgment.functions";
import { getLineage } from "@/lib/lineage.functions";
import { StageTimeline } from "@/components/shared/StageTimeline";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { Receipt } from "@/components/meridian/Receipt";
import { Prose } from "@/components/meridian/Prose";
import { SourceLink } from "./DecisionsPanel";
import { ageOf, displayWho, hasSource, OUTCOME_WORD, SOURCE_LABEL } from "./decisions-shared";
import { ContradictionAuditSection } from "./ContradictionAuditSection";
import { RewindButton } from "@/components/decisions/RewindButton";

type Status = "approved" | "rejected" | "pending";

/** What a write left behind. Session local: the durable record is the ledger. */
type Settled = { id: string; verb: string; consequence: string; failed?: boolean; at: string };

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function copyDecisionLink(slug: string) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/d/${slug}`;
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    // Copying is not a write. Nothing changed, so there is nothing for a
    // receipt to record and a toast is the honest instrument.
    navigator.clipboard.writeText(url).then(
      () => toast.success("Public link copied"),
      () => toast.message(url),
    );
  } else {
    toast.message(url);
  }
}

/** Share or unshare a decision, and copy its public /d/<slug> link.
 *
 *  Pre-migration tolerant: before the share columns land it says so in words
 *  rather than offering a control that would fail.
 *
 *  Exported (RPT-01) so Brain's recall card can offer the same real share
 *  action on a matched decision without duplicating this logic. */
export function ShareDecisionButton({
  id,
  onCommit,
}: {
  id: string;
  /** Where the consequence goes. A caller that has no receipt surface passes
   *  nothing, and the write still happens; it just leaves no local trace. */
  onCommit?: (verb: string, consequence: string, failed?: boolean) => void;
}) {
  const qc = useQueryClient();
  const fState = useServerFn(getDecisionShareState);
  const fSet = useServerFn(setDecisionShared);

  const state = useQuery({
    queryKey: ["decision-share", id],
    queryFn: () => fState({ data: { id } }),
  });
  const toggle = useMutation({
    mutationFn: (isPublic: boolean) => fSet({ data: { id, isPublic } }),
    onSuccess: (res, isPublic) => {
      qc.setQueryData(["decision-share", id], res);
      if (res.is_public && res.share_slug) copyDecisionLink(res.share_slug);
      onCommit?.(
        isPublic ? "You published this call" : "You made this call private",
        isPublic
          ? "Anyone with the link can read it and its rationale. The link is on your clipboard."
          : "The public link is dead. Anyone holding it now gets nothing.",
      );
    },
    onError: (e: Error, isPublic) =>
      onCommit?.(
        isPublic ? "You tried to publish this call" : "You tried to make this call private",
        e.message || "The write failed. Nothing changed.",
        true,
      ),
  });

  const s = state.data;
  if (!s) return null;
  if (!s.available) {
    return <Value>Sharing lights up after the next sync applies the share columns.</Value>;
  }
  if (!s.is_public) {
    return (
      <Action
        busy={toggle.isPending}
        onClick={() => toggle.mutate(true)}
        title="Make this decision public and copy a shareable link"
      >
        {/* "Share this decision", not "Publish the receipt": the button makes
            the decision PUBLIC and copies a link, which is what the title
            attribute already says. "Receipt" also named the wrong object —
            the thing being shared is the decision itself. */}
        {toggle.isPending ? "Publishing" : "Share this decision"}
      </Action>
    );
  }
  return (
    <>
      <Action
        onClick={() => s.share_slug && copyDecisionLink(s.share_slug)}
        title="Copy the public link"
      >
        Copy the link
      </Action>
      <Action variant="quiet" busy={toggle.isPending} onClick={() => toggle.mutate(false)}>
        {toggle.isPending ? "Working" : "Make it private"}
      </Action>
    </>
  );
}

/** What the status MEANS, in the crew's terms. One fact, said once. */
const STATUS_LEAD: Record<Status, string> = {
  approved: "Every agent reads this before it touches the same surface again.",
  rejected: "The path not taken, on the record so nobody re-proposes it blind.",
  pending: "Nobody has settled this yet. It is decided on Today.",
};

const VERDICT_OPTIONS: { id: Status; label: string; title: string }[] = [
  { id: "approved", label: "Keep it", title: "Agents read this before acting on the same surface" },
  { id: "rejected", label: "Drop it", title: "On the record as the path not taken" },
  { id: "pending", label: "Not settled", title: "Send it back to nobody having decided" },
];

/**
 * THE FORECAST, IN THE DRILL-DOWN. Three states, honestly:
 *  recorded   claim, observable, horizon, and the resolution when it exists.
 *  attachable The call is still pending and no forecast exists - the set-once
 *             door, so "a person who wants to record what they expect" finally
 *             has the surface the server was written for.
 *  absent     decided without one. Said as a fact, not an error: the practice
 *             is newer than most of the record.
 */
function ForecastBlock({
  d,
  onChanged,
}: {
  d: {
    id: string;
    status: string;
    forecast_claim?: string | null;
    forecast_how_we_will_know?: string | null;
    forecast_horizon_date?: string | null;
    forecast_resolution?: string | null;
    forecast_resolved_at?: string | null;
  };
  onChanged: () => void;
}) {
  const fForecast = useServerFn(setDecisionForecast);
  const [open, setOpen] = useState(false);
  const [claim, setClaim] = useState("");
  const [know, setKnow] = useState("");
  const [horizon, setHorizon] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const iso = new Date(`${horizon}T12:00:00Z`).toISOString();
      const refusal = forecastRefusal({
        forecast_claim: claim,
        forecast_how_we_will_know: know,
        forecast_horizon_date: iso,
      });
      if (refusal) throw new Error(refusal.message);
      return fForecast({
        data: {
          decisionId: d.id,
          forecast_claim: claim.trim(),
          forecast_how_we_will_know: know.trim(),
          forecast_horizon_date: iso,
        },
      });
    },
    onSuccess: () => {
      setOpen(false);
      onChanged();
    },
    onError: (e: Error) => setProblem(e.message),
  });

  const recorded = d.forecast_claim != null;
  const resolutionWord =
    d.forecast_resolution === "hit"
      ? "It held"
      : d.forecast_resolution === "miss"
        ? "It did not hold"
        : d.forecast_resolution === "inconclusive"
          ? "It could not be graded"
          : null;

  return (
    <Region title="What we expected to happen">
      {recorded ? (
        <>
          <Prose>
            <p>{d.forecast_claim}</p>
          </Prose>
          {d.forecast_how_we_will_know ? (
            <p className="text-mrd-base text-mrd-mute">How we will know: {d.forecast_how_we_will_know}</p>
          ) : null}
          <p className="text-mrd-base text-mrd-mute">
            {resolutionWord ? (
              <>
                <span
                  className={
                    d.forecast_resolution === "hit"
                      ? "text-mrd-pass"
                      : d.forecast_resolution === "miss"
                        ? "text-mrd-fail"
                        : undefined
                  }
                >
                  {resolutionWord}
                </span>
                {d.forecast_resolved_at ? `, graded ${ageOf(d.forecast_resolved_at)}` : ""}
                {" · "}
              </>
            ) : null}
            By{" "}
            {d.forecast_horizon_date
              ? new Date(d.forecast_horizon_date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "an unset date"}
          </p>
        </>
      ) : d.status === "pending" && !open ? (
        <>
          <p className="text-mrd-base text-mrd-mute">
            Nothing is written down yet about what this call expects to happen.
          </p>
          <Actions>
            <Action variant="quiet" onClick={() => setOpen(true)}>
              Record the forecast
            </Action>
          </Actions>
        </>
      ) : d.status === "pending" ? (
        <form
          className="flex flex-col gap-mrd-2"
          onSubmit={(e) => {
            e.preventDefault();
            setProblem(null);
            save.mutate();
          }}
        >
          <Field label="What do you expect to happen?" htmlFor="fc-claim">
            <Textarea
              id="fc-claim"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </Field>
          <Field label="How will we know?" htmlFor="fc-know">
            <Input
              id="fc-know"
              value={know}
              onChange={(e) => setKnow(e.target.value)}
              maxLength={500}
            />
          </Field>
          <Field label="Check back by" htmlFor="fc-horizon">
            <Input
              id="fc-horizon"
              type="date"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
            />
          </Field>
          {problem ? <p className="text-mrd-fail text-mrd-base">{problem}</p> : null}
          <Actions>
            <Action type="submit" disabled={save.isPending || !claim.trim() || !know.trim() || !horizon}>
              {save.isPending ? "Recording" : "Record it"}
            </Action>
            <Action
              variant="quiet"
              onClick={() => {
                setOpen(false);
                setProblem(null);
              }}
            >
              Cancel
            </Action>
          </Actions>
        </form>
      ) : (
        <p className="text-mrd-base text-mrd-mute">
          No forecast was recorded. The practice is newer than this call, so the record carries the
          decision and its outcome without the belief that came first.
        </p>
      )}
    </Region>
  );
}

export function DecisionDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fList = useServerFn(listDecisions);
  const fUpdate = useServerFn(updateDecision);
  const fJudgment = useServerFn(getDecisionJudgment);
  const fLineage = useServerFn(getLineage);

  const decisions = useQuery({
    queryKey: ["decisions", "all"],
    queryFn: () => fList({ data: {} }),
  });

  // SW-3 mission 3.2: the judgment loop behind the call. Real rows only:
  // alternatives_considered, the linked spec's Critic verdict, the Ambient
  // Precedent recall (which also writes the citation receipts server-side),
  // and cited_by_count.
  const judgment = useQuery({
    queryKey: ["decision-judgment", id],
    queryFn: () => fJudgment({ data: { id } }),
  });
  const lineage = useQuery({
    queryKey: ["lineage", "decision", id],
    queryFn: () => fLineage({ data: { kind: "decision", id } }),
  });

  const [settled, setSettled] = useState<Settled[]>([]);
  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed, at: nowStamp() },
      ...prev,
    ]);

  const update = useMutation({
    mutationFn: (vars: { status: Status; title: string }) =>
      fUpdate({ data: { id, status: vars.status } }),
    onSuccess: (_res, vars) => {
      // Prefix invalidation covers ["decisions", "all"] and every panel filter key.
      qc.invalidateQueries({ queryKey: ["decisions"] });
      commit(
        vars.status === "approved"
          ? "You kept this call"
          : vars.status === "rejected"
            ? "You dropped this call"
            : "You sent this call back",
        vars.status === "approved"
          ? `"${vars.title}" now binds. Every agent reads it before it touches the same surface.`
          : vars.status === "rejected"
            ? `"${vars.title}" is on the record as the path not taken.`
            : `"${vars.title}" is unsettled again. It goes back to Today to be decided.`,
      );
    },
    onError: (e: Error, vars) =>
      commit(
        "You tried to settle this call",
        `"${vars.title}" is unchanged. ${e.message || "The write failed."}`,
        true,
      ),
  });

  const onBack = () => navigate({ to: "/brain", search: { tab: "decisions" } });

  if (decisions.isLoading) return <Reading>Reading the call.</Reading>;

  if (decisions.isError) {
    return (
      <ReadFailed onRetry={() => void decisions.refetch()}>
        The record did not load, so this is not a claim that the call is gone.{" "}
        {(decisions.error as Error)?.message ?? ""}
      </ReadFailed>
    );
  }

  const d = decisions.data?.decisions.find((x) => x.id === id);
  if (!d) {
    return (
      <NothingHere action={<Action onClick={onBack}>Back to all decisions</Action>}>
        That call is not on the record. It may have been removed since the link was made.
      </NothingHere>
    );
  }

  const sourceKind = (d.source_kind ?? "manual") as DecisionSource;
  const sourceNoun = d.mission_id ? "mission" : d.prd_id ? "spec" : d.meeting_id ? "meeting" : null;
  const outcome = OUTCOME_WORD[d.status];
  const decidedBy = displayWho(d.decided_by_agent_slug);

  // The judgment loop, from real rows; each block renders only when it has data.
  const alternatives = judgment.data?.alternatives ?? [];
  const critic = judgment.data?.critic ?? null;
  const precedents = judgment.data?.precedents ?? [];
  const citedByCount = judgment.data?.citedByCount ?? 0;
  const evidenceIn = lineage.data?.ancestors ?? [];
  const evidenceOut = lineage.data?.descendants ?? [];
  const title = stripAutoPrefix(d.title);

  return (
    <div>
      <Actions>
        <Action variant="quiet" onClick={onBack}>
          All decisions
        </Action>
      </Actions>

      <Region
        title={title}
        // Three DIFFERENT facts, never more of the title: where it stands, who
        // put it there, and where it came from.
        sub={
          <>
            <span className={outcome.tone || undefined}>{outcome.word}</span>
            {" · "}
            {decidedBy} {d.status === "pending" ? "raised it" : "settled it"}
            {" · from "}
            {SOURCE_LABEL[sourceKind]}
            {d.source_label ? ` (${d.source_label})` : ""}
            {" · "}
            {ageOf(d.created_at)}
            {/* Column first, title second. The marker is gone from every stored
                title (migration 20260805120000) AND stripAutoPrefix now runs at
                the read boundary, so isAutoTitle alone would report "no" for
                every row and this provenance would silently disappear. The title
                test survives only for a row restored from an older backup. */}
            {(d.auto_origin ?? isAutoTitle(d.title)) ? " · raised by the crew" : ""}
          </>
        }
      >
        <p className="sp-loading">{STATUS_LEAD[d.status]}</p>
        {citedByCount > 0 ? (
          <p className="sp-loading">
            Cited as precedent <Num>{citedByCount}</Num> {citedByCount === 1 ? "time" : "times"} by
            later decision contexts.
          </p>
        ) : null}
      </Region>

      <Region title="Why">
        {d.rationale ? (
          <Prose>
            <p>{d.rationale}</p>
          </Prose>
        ) : (
          <NothingHere>
            Nobody wrote down why. Decisions are working memory, not minutes, so an unexplained call
            is a real state rather than a missing field.
          </NothingHere>
        )}
      </Region>

      {/* WHAT WE EXPECTED TO HAPPEN, recorded before the outcome was known.
          The columns have been selected since the moat round; this is the
          drill-down that renders them, and the set-once door for the calls
          that never got one. */}
      <ForecastBlock d={d} onChanged={() => qc.invalidateQueries({ queryKey: ["decisions"] })} />

      {/* The paths not taken, rendered only when the row actually recorded any
          (decisions.alternatives_considered). */}
      {alternatives.length > 0 ? (
        <Region title="What else was on the table">
          {alternatives.map((a, i) => (
            <Row key={i} lead={a.title} sub={`Rejected: ${a.reason_rejected}`} />
          ))}
        </Region>
      ) : null}

      <Region
        title="Where it came from"
        goTo="Trace it in the graph"
        onGoTo={() =>
          navigate({
            to: "/brain",
            search: { tab: "graph", focusKind: "decision", focusId: d.id },
          })
        }
      >
        <Line label={SOURCE_LABEL[sourceKind]} sub={d.source_label ?? undefined}>
          {hasSource(d) && sourceNoun ? (
            <SourceLink d={d} className="sp-block-more">
              Open the {sourceNoun}
            </SourceLink>
          ) : (
            <Value>Nothing to open. The call was entered by hand.</Value>
          )}
        </Line>
      </Region>

      {/* The real lineage edges in and out of this decision. */}
      {evidenceIn.length > 0 || evidenceOut.length > 0 ? (
        <Region title="What it rests on, and what rests on it">
          {evidenceIn.map((e) => (
            <Row
              key={e.id}
              tight
              lead={`From the ${e.parent_kind.replace(/_/g, " ")}${e.peer_title ? ` "${e.peer_title}"` : ""}`}
              sub={e.relation}
            />
          ))}
          {evidenceOut.map((e) => (
            <Row
              key={e.id}
              tight
              lead={`Fed the ${e.child_kind.replace(/_/g, " ")}${e.peer_title ? ` "${e.peer_title}"` : ""}`}
              sub={e.relation}
            />
          ))}
        </Region>
      ) : null}

      {/* The red-team review persisted on the linked spec. */}
      {critic ? (
        <Region title="What the Critic said about the linked spec">
          <Line
            label={critic.verdict}
            sub={critic.reviewed_at ? ageOf(critic.reviewed_at) : undefined}
          >
            <Value>
              <Num>{Math.round(critic.confidence * 100)}%</Num> confident
            </Value>
          </Line>
          {critic.summary ? (
            <Prose>
              <p>{critic.summary}</p>
            </Prose>
          ) : null}
        </Region>
      ) : null}

      {/* RPT-25: the contradiction auditor. Drift pointed inward. */}
      <ContradictionAuditSection decisionId={d.id} decisionTitle={d.title} />

      {/* Outcome-weighted learnings via the Ambient Precedent recall; serving
          one also writes its citation receipt server-side. */}
      {precedents.length > 0 ? (
        <Region
          title="Last time we reasoned this way"
          sub="What actually happened, weighted by how the outcome landed."
        >
          {precedents.map((p) => (
            <Row key={p.memoryId} lead={p.title || p.verdict} sub={p.summary} />
          ))}
        </Region>
      ) : null}

      <Region
        title="The call"
        sub="Yours, and it is the one the crew reads. Settling it here settles it everywhere."
      >
        <Choices
          mode="one"
          label="What happens to this call"
          value={d.status as Status}
          options={VERDICT_OPTIONS.map((o) => ({ ...o, disabled: update.isPending }))}
          onChange={(status) => update.mutate({ status, title })}
        />
      </Region>

      {settled.map((s) => (
        <Receipt
          key={s.id}
          verb={s.verb}
          consequence={s.consequence}
          time={s.at}
          failed={s.failed}
        />
      ))}

      {/* Real per-transition rows; renders nothing until the first lands. */}
      <StageTimeline entityType="decision" entityId={d.id} />

      <Region title="Elsewhere">
        <Line label="Trace id" sub="The id this call answers to across the record">
          <Value>
            <Num>{d.id}</Num>
          </Value>
        </Line>
        <Line label="Decided" sub={new Date(d.created_at).toLocaleString()}>
          <Value>{ageOf(d.created_at)}</Value>
        </Line>
        <Actions>
          <ShareDecisionButton id={d.id} onCommit={commit} />
          {/* PC-10: one-key rewind of a revised decision. Self-hides when there
              is no prior snapshot, so it appears only once a revision exists. */}
          <RewindButton
            decisionId={d.id}
            hasSnapshot={!!d.snapshot_before}
            onReverted={() => qc.invalidateQueries({ queryKey: ["decisions"] })}
          />
        </Actions>
      </Region>
    </div>
  );
}
