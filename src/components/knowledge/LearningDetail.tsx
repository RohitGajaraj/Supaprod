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
 * UNCHANGED: listLearnings and the ["learnings", activeWorkspaceId] cache
 * CompoundingPanel fills, so the feed and this detail cannot drift; the
 * ?learning= drill contract; the graph recentre and the spec deep link. Real
 * columns only: an absent metric or ICE pair renders nothing rather than a
 * fabricated field.
 *
 * ADDED 2026-08-24, closing three questions this screen could not answer: which
 * decision did this grade (getLearningGradeContext, one keyed fetch, rendered
 * under "Where it points"), where a verdict was overturned (the prds.outcome
 * overturn pairs, as "Reversed history"), and a per-outcome copy-as-markdown.
 */
import { useServerFn } from "@tanstack/react-start";
import { humanWriteError } from "@/lib/roles.functions";
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
import { useWorkspace } from "@/hooks/use-workspace";
import { listLearnings, type OutcomeOverturn } from "@/lib/outcome.functions";
import { getLearningGradeContext } from "@/lib/decisions.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { toast } from "@/lib/notify";
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

/**
 * The overturn pairs as sentences, in record order. applyOutcome APPENDS each
 * overturn, so array order is oldest first and rendering in order puts the
 * newest call last: the block reads forward through the argument.
 *
 * The earlier call quotes what the first settler SAID (its summary), falling
 * back to why it was allowed to settle at all; the person's note rides along
 * rather than replacing it, because deleting the agent's words to show the
 * correction would delete the training pair this row exists to keep.
 *
 * PURE AND EXPORTED for the colocated tests.
 */
export function overturnedCalls(
  overturns: OutcomeOverturn[] | null | undefined,
): { line: string; note: string | null }[] {
  const rows = Array.isArray(overturns) ? overturns : [];
  return rows.map((o) => {
    const earlier =
      (typeof o.from_summary === "string" && o.from_summary.trim()) ||
      (typeof o.from_reason === "string" && o.from_reason.trim()) ||
      "the earlier call";
    const byAgent =
      o.from_settled_by === "agent" &&
      typeof o.from_agent_slug === "string" &&
      o.from_agent_slug.trim() !== "";
    // Possessives differ by settler: an agent gets "Name's", a person gets
    // "your" — "you's" is not a sentence.
    const line = byAgent
      ? `This verdict replaced ${agentDisplayName(o.from_agent_slug!.trim())}'s earlier call: "${earlier}"`
      : `This verdict replaced your earlier call: "${earlier}"`;
    const note = typeof o.note === "string" && o.note.trim() ? o.note.trim() : null;
    return { line, note };
  });
}

/**
 * One outcome as markdown, for pasting where the record cannot follow:
 * verdict, summary, what it moved, the decision it graded, every reversal.
 * Absent pieces are omitted rather than stubbed, mirroring the screen.
 *
 * PURE AND EXPORTED for the colocated tests.
 */
export function learningMarkdown(
  l: {
    verdict: LearningRow["verdict"];
    summary: string;
    prior_ice: number | string | null;
    new_ice: number | string | null;
    metric_label: string | null;
    metric_value: string | null;
    opportunity_title?: string | null;
  },
  extras: {
    decision?: { id: string; title: string } | null;
    overturns?: OutcomeOverturn[];
  } = {},
): string {
  const blocks: string[] = [];
  const title = l.opportunity_title ?? "Recorded outcome";
  blocks.push(`# ${title}\n\nVerdict: ${OUTCOME[l.verdict].word}`);
  if (l.summary?.trim()) blocks.push(l.summary.trim());

  const priorIce = iceNum(l.prior_ice);
  const newIce = iceNum(l.new_ice);
  const facts: string[] = [];
  if (priorIce != null && newIce != null)
    facts.push(`Priority moved: ${priorIce.toFixed(1)} -> ${newIce.toFixed(1)} ICE`);
  if (l.metric_label && l.metric_value) facts.push(`${l.metric_label}: ${l.metric_value}`);
  if (facts.length) blocks.push(facts.join("\n"));

  if (extras.decision)
    blocks.push(
      `Graded the decision: ["${extras.decision.title}"](/brain?tab=decisions&decision=${extras.decision.id})`,
    );

  const reversals = overturnedCalls(extras.overturns);
  if (reversals.length)
    blocks.push(
      `Overturn history:\n${reversals
        .map((r) => `- ${r.line}${r.note ? ` You wrote instead: "${r.note}"` : ""}`)
        .join("\n")}`,
    );
  return blocks.join("\n\n");
}

export function LearningDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const fLearnings = useServerFn(listLearnings);
  const { activeWorkspaceId } = useWorkspace();
  // Same key and same fetch as CompoundingPanel, character for character, so
  // the drill reads the feed's cache entry instead of issuing a second read.
  const learnings = useQuery({
    queryKey: ["learnings", activeWorkspaceId],
    queryFn: () => fLearnings({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });

  // Found before the hooks below so their input can depend on it; hooks stay
  // unconditional across every render.
  const l = ((learnings.data?.learnings ?? []) as LearningRow[]).find((x) => x.id === id);

  /**
   * What this outcome graded, and what it replaced. One keyed fetch per opened
   * detail (getLearningGradeContext); the feed never pays for it, and neither
   * does a drill whose learning carries neither fact. A failed enrichment must
   * not fail the screen, which is why this query renders nothing on error
   * rather than swapping the whole read for ReadFailed.
   */
  const fGradeContext = useServerFn(getLearningGradeContext);
  const gradeCtx = useQuery({
    queryKey: ["learning-grade-context", id],
    queryFn: () => fGradeContext({ data: { learningId: id, prdId: l?.prd_id ?? undefined } }),
    enabled: Boolean(l),
  });
  const gradedDecision = gradeCtx.data?.decision ?? null;
  const overturns = gradeCtx.data?.overturns ?? [];

  const onBack = () => navigate({ to: "/brain", search: { tab: "learnings" } });

  if (learnings.isLoading) return <Reading>Reading the outcome.</Reading>;

  if (learnings.isError) {
    return (
      <ReadFailed error={learnings.error} onRetry={() => void learnings.refetch()}>
        The outcomes did not load, so this is not a claim that this one is gone.{" "}
        {humanWriteError(learnings.error, "")}
      </ReadFailed>
    );
  }

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

  // Copying is not a write (same ruling as DecisionDetail's share link), so a
  // toast is the honest instrument, and the markdown itself is the failure
  // fallback: if the clipboard refuses, the reader gets the text to take.
  const copyMarkdown = () => {
    const md = learningMarkdown(l, { decision: gradedDecision, overturns });
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(md).then(
        () => toast.success("Outcome copied as markdown"),
        () => toast.message(md),
      );
    } else {
      toast.message(md);
    }
  };

  return (
    <div>
      <Actions>
        <Action variant="quiet" onClick={onBack}>
          All outcomes
        </Action>
        {/* Per-verdict export: the memo, the move it made and the calls it
            replaced, in a shape that survives leaving this screen. */}
        <Action variant="quiet" onClick={copyMarkdown} title="Copy this outcome as markdown">
          Copy as markdown
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

      {/* Reversed history: the overturn pairs this verdict carries, oldest
          first so the newest call reads last. Both sides stay on the record —
          that is the whole value of the pair. */}
      {overturnedCalls(overturns).length ? (
        <Region
          title="Reversed history"
          sub="A person looked again and said otherwise. Nothing was deleted."
        >
          {overturnedCalls(overturns).map((r, i) => (
            <Line
              key={i}
              label={r.line}
              sub={r.note ? `You wrote instead: "${r.note}"` : undefined}
            />
          ))}
        </Region>
      ) : null}

      {/*
       * THE PAIRING, AND IT IS THE WHOLE PRODUCT. Added 2026-08-27.
       *
       * `getLearningGradeContext` has returned forecastClaim, its horizon and
       * its resolution since F-65, and its own header says why: "`title` alone
       * answers which decision, which is a pointer. The three forecast fields
       * answer WERE WE RIGHT, which is the only question the brain exists for."
       * Nothing rendered them. The surface showed a link to the decision and
       * made a person click through to learn what had been predicted, which is
       * one click too many for the one artifact nobody else can reconstruct.
       *
       * IT SITS ABOVE "What it measured" ON PURPOSE. The expectation was written
       * first, before anyone knew the answer, so it reads first. Putting the
       * result above the claim would let a reader learn the outcome and then be
       * shown what we said, which is how hindsight quietly rewrites a forecast.
       *
       * ABSENT IS NOW STATED, reversing what this comment used to say. The old
       * argument was that an empty "Expected" line would assert a call was made
       * and said nothing, and that the feed one level up already tells you
       * whether one exists. The first half is right, which is why this is a
       * SENTENCE and not an empty field. The second half does not survive
       * arriving here from a link, a search or a reload, where there is no feed
       * above to have read.
       *
       * And it is not the rare case. Measured on the live record: 163 learnings,
       * all graded, and 42 with a written expectation. So 121 of 163 detail
       * pages showed a measurement with nothing to grade it against and nothing
       * saying why -- which reads as an omission by the product rather than a
       * fact about the work, on the one surface whose whole subject is whether
       * we were right.
       */}
      {!gradedDecision?.forecastClaim ? (
        <Region title="What we expected">
          <p className="text-mrd-small leading-mrd-prose text-mrd-mute">
            Nothing was written down before this shipped, so the result below cannot be graded
            against a call. A forecast is written at Decide and nowhere else.
          </p>
        </Region>
      ) : null}

      {gradedDecision?.forecastClaim ? (
        <Region
          title="What we expected"
          sub="Written at Decide, before the outcome was known. This is the claim the result above is graded against."
        >
          <Line label={gradedDecision.forecastClaim}>
            {gradedDecision.forecastResolution ? (
              <Value>{gradedDecision.forecastResolution}</Value>
            ) : null}
          </Line>
          {gradedDecision.forecastHorizonDate ? (
            <Line label="Due" sub="The date the claim came up for grading">
              <Value>{new Date(gradedDecision.forecastHorizonDate).toLocaleDateString()}</Value>
            </Line>
          ) : null}
        </Region>
      ) : null}

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
          lineage view, never orphan); the spec opens in Plan; the decision it
          graded opens in Decide. */}
      {/*
       * THE REGION DRAWS WHATEVER IT FINDS, INCLUDING NOTHING, and that is the
       * change. It used to render only when one of the three links existed, so
       * an outcome with no links at all simply had no "Where it points" section
       * and a reader could not tell an unlinked outcome from one they had
       * scrolled past.
       *
       * Measured on the live database, 2026-08-27: 135 learnings, and 133 carry
       * a NULL `decision_id` -- F-65 records the same number and the reason,
       * which is that the column only started being written that day. 35 carry
       * no opportunity, spec or decision at all. So the silent case is not the
       * edge case here; it is almost every row a person opens today.
       *
       * A MISSING LINK IS NOT "THERE WAS NO CALL", and the difference is the
       * whole value of this panel. Saying nothing lets a reader conclude the
       * outcome was never measured against anything, which on this surface is
       * the reassuring reading of a gap in our own wiring.
       */}
      <Region title="Where it points">
        {!gradedDecision ? (
          <Line
            label="No call is linked to this outcome"
            sub="So there is nothing here to grade it against. The link is written when a decision is graded, and outcomes recorded before that was wired carry none even where a call existed."
          />
        ) : null}
        {gradedDecision ? (
          <Line
            // The wording names the relationship, not the mechanism: this
            // outcome is the grade on that call.
            label={`Graded the decision "${gradedDecision.title}"`}
            sub="The call this outcome was measured against"
          >
            <Action
              variant="quiet"
              onClick={() =>
                navigate({
                  to: "/brain",
                  search: { tab: "decisions", decision: gradedDecision.id },
                })
              }
            >
              Open the decision
            </Action>
          </Line>
        ) : null}
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
        {!l.opportunity_id && !l.prd_id ? (
          <Line
            label="Nothing else is linked either"
            sub="No priority and no spec, so this outcome stands on its own summary. An outcome the loop drove carries all three."
          />
        ) : null}
      </Region>

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
