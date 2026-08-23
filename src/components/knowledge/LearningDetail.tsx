/**
 * One outcome, opened. Brain > Outcomes > ?learning=.
 *
 * REBUILT on the shell primitives, 2026-07-29, for the same reason as
 * DecisionDetail: the route was ported, this was not, so clicking a row in the
 * feed put the legacy design back on screen.
 *
 * WHAT WENT, and why:
 *   KILLED the DetailKit anatomy (DetailHeader, DetailSection, StatStrip,
 *     StatCell, toneForScore). Retired system, and Block is the equivalent.
 *   KILLED the material-medium card and the tinted summary band inside it.
 *     Two bordered containers in one region, and the inner one was a card in a
 *     card (anti-slop ban 5).
 *   PROMOTED the headline into a Record. What the outcome moved is the single
 *     most differentiated claim the product makes, and the record recess is the
 *     one lit surface in the system. It was in a grey box under a mono label.
 *   KILLED VerdictChip, MonoLabel and AuditTag. The verdict is a WORD carried
 *     by sp-pass / sp-fail; a mixed result is not an outcome so it stays
 *     monochrome. The trace id is plain mono via Num.
 *   KILLED the three-cell ICE strip. Prior, new and change is the same number
 *     said three ways, and the change is the only one that means anything. It
 *     is one Line, and the before and after ride the second line as evidence.
 *   KILLED the hand-rolled StateCard error and not-found boxes. A failed read
 *     is Failed with a retry, never an empty state.
 *   KILLED the two hand-built link buttons and the actions footer, which
 *     duplicated the spec link the "Where it points" section already carried
 *     (hard ban 10, the same door twice).
 *
 * UNCHANGED: listLearnings and the ["learnings"] cache CompoundingPanel fills,
 * so the feed and this detail cannot drift; the ?learning= drill contract; the
 * graph recentre and the spec deep link. Real columns only: an absent metric or
 * ICE pair renders nothing rather than a fabricated field.
 */
import { useServerFn } from "@tanstack/react-start";
import { Line } from "@/components/meridian/rows";
import {
  Num,
  Actions,
  Action,
  Region,
  Reading,
  ReadFailed,
  NothingHere,
  RecordSpeaks,
  Value,
} from "@/components/meridian/surface-parts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { listLearnings } from "@/lib/outcome.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { Prose } from "@/components/meridian/Prose";
import { whenOf } from "./CompoundingPanel";

type LearningRow = {
  id: string;
  prd_id: string | null;
  opportunity_id: string | null;
  verdict: "validated" | "missed" | "mixed";
  summary: string;
  metric_label: string | null;
  metric_value: string | null;
  prior_ice: number | string | null;
  new_ice: number | string | null;
  created_at: string;
  opportunity_title: string | null;
  /** PC-29 layer 3: which agent recorded this learning (the Historian). */
  recorded_by_agent_slug: string | null;
};

/** How it landed, in plain words. Green and red carry outcomes and own those
 *  two; a mixed result is not one, so it stays monochrome. Same map as the
 *  feed, so a row and its drill can never disagree. */
const OUTCOME: Record<LearningRow["verdict"], { word: string; tone: string }> = {
  validated: { word: "It worked", tone: "sp-pass" },
  missed: { word: "It missed", tone: "sp-fail" },
  mixed: { word: "Mixed", tone: "" },
};

/** Coerce a PostgREST numeric (which arrives as a string) to a finite number,
 *  or null. Mirrors CompoundingPanel and moat-vis so the ICE read never
 *  differs between the feed and this drill. */
function iceNum(v: number | string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function LearningDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const fLearnings = useServerFn(listLearnings);
  const learnings = useQuery({ queryKey: ["learnings"], queryFn: () => fLearnings() });

  const onBack = () => navigate({ to: "/brain", search: { tab: "learnings" } });

  if (learnings.isLoading) return <Reading>Reading the outcome.</Reading>;

  if (learnings.isError) {
    return (
      <ReadFailed onRetry={() => void learnings.refetch()}>
        The outcomes did not load, so this is not a claim that this one is gone.{" "}
        {(learnings.error as Error)?.message ?? ""}
      </ReadFailed>
    );
  }

  const l = ((learnings.data?.learnings ?? []) as LearningRow[]).find((x) => x.id === id);
  if (!l) {
    return (
      <NothingHere action={<Action onClick={onBack}>Back to all outcomes</Action>}>
        That outcome is not on the record. It may have been removed since the link was made.
      </NothingHere>
    );
  }

  const priorIce = iceNum(l.prior_ice);
  const newIce = iceNum(l.new_ice);
  const delta =
    priorIce != null && newIce != null ? Math.round((newIce - priorIce) * 10) / 10 : null;
  const moved = delta != null && delta !== 0;
  const outcome = OUTCOME[l.verdict];
  const title = l.opportunity_title ?? "Recorded outcome";
  const recordedBy = l.recorded_by_agent_slug
    ? `${agentDisplayName(l.recorded_by_agent_slug)} recorded it`
    : "unattributed";

  return (
    <div>
      <Actions>
        <Action variant="quiet" onClick={onBack}>
          All outcomes
        </Action>
      </Actions>

      {/* The record speaking. What the outcome MOVED is the product's claim
          made literal, so it gets the one lit surface rather than a grey box. */}
      <RecordSpeaks
        evidence={
          priorIce != null && newIce != null ? (
            <>
              <Num>{priorIce.toFixed(1)}</Num> to <Num>{newIce.toFixed(1)}</Num> ICE
            </>
          ) : null
        }
      >
        {moved
          ? `Memory re-ranked ${l.opportunity_title ? `"${l.opportunity_title}"` : "a priority"} by ${
              delta! > 0 ? "+" : ""
            }${delta!.toFixed(1)} ICE from the real outcome.`
          : "Recorded from the real outcome. It did not move a ranking, and that is the honest result."}
      </RecordSpeaks>

      <Region
        title={title}
        // Three DIFFERENT facts, never more of the title: how it landed, who
        // wrote it down, and when.
        sub={
          <>
            <span className={outcome.tone || undefined}>{outcome.word}</span>
            {" · "}
            {recordedBy}
            {" · "}
            {whenOf(l.created_at)}
          </>
        }
      >
        {l.summary ? (
          <Prose>
            <p>{l.summary}</p>
          </Prose>
        ) : (
          <NothingHere>
            Nobody wrote a memo. The verdict is on the record without the story behind it.
          </NothingHere>
        )}
      </Region>

      {/* Rendered only when the outcome actually carried a measurement or a
          scored before-and-after pair. Never a fabricated field. */}
      {(l.metric_label && l.metric_value) || delta != null ? (
        <Region title="What it measured">
          {l.metric_label && l.metric_value ? (
            <Line label={l.metric_label}>
              <Value>
                <Num>{l.metric_value}</Num>
              </Value>
            </Line>
          ) : null}
          {delta != null ? (
            <Line
              label="Change in priority"
              sub={
                priorIce != null && newIce != null
                  ? `${priorIce.toFixed(1)} before, ${newIce.toFixed(1)} after`
                  : undefined
              }
            >
              <Value tone={delta === 0 ? "quiet" : delta > 0 ? "pass" : "fail"}>
                <Num>
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}
                </Num>{" "}
                ICE
              </Value>
            </Line>
          ) : null}
        </Region>
      ) : null}

      {/* Link back up the loop. The priority recentres the graph (reuse the
          lineage view, never orphan); the spec opens in Plan. */}
      {l.opportunity_id || l.prd_id ? (
        <Region title="Where it points">
          {l.opportunity_id ? (
            <Line
              label={l.opportunity_title ? `"${l.opportunity_title}"` : "The priority it re-ranked"}
              sub="Its whole history, and everything it connects to"
            >
              <Action
                variant="quiet"
                onClick={() =>
                  navigate({
                    to: "/brain",
                    search: {
                      tab: "graph",
                      focusKind: "opportunity",
                      focusId: l.opportunity_id!,
                    },
                  })
                }
              >
                Trace it in the graph
              </Action>
            </Line>
          ) : null}
          {l.prd_id ? (
            <Line label="The spec it graded" sub="What was actually built, and what it promised">
              <Action
                variant="quiet"
                onClick={() => navigate({ to: "/plan/spec/$id", params: { id: l.prd_id! } })}
              >
                Open the spec
              </Action>
            </Line>
          ) : null}
        </Region>
      ) : null}

      <Region title="Elsewhere">
        <Line label="Trace id" sub="The id this outcome answers to across the record">
          <Value>
            <Num>{l.id}</Num>
          </Value>
        </Line>
        <Line label="Recorded" sub={new Date(l.created_at).toLocaleString()}>
          <Value>{whenOf(l.created_at)}</Value>
        </Line>
      </Region>
    </div>
  );
}
