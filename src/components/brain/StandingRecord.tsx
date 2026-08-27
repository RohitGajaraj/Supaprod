/**
 * The two things on Brain that prove the record COMPOUNDS, rather than
 * reporting how much of it there is.
 *
 * StandingRules answers "next time it tells you what is right": the rules the
 * steward distilled out of validated outcomes, that a human approved, and that
 * every agent now reads before it acts. The wiring is real and this file claims
 * nothing beyond it: getActiveHouseRulesForWorkspace feeds renderHouseRulesBlock
 * at src/lib/ai/loop.server.ts:387-388, the same chokepoint the Strategic Brief
 * goes through. Remove every agent from the product and a house rule means
 * nothing, which is the point.
 *
 * CrewCarries answers "and does the crew reach for what it stored": how many
 * memories a run has actually recalled, and how many a human's later rating
 * marked as having helped or as contradicted. It wraps the memory list, so a
 * list of stored rows reads as evidence instead of as inventory. It never
 * repeats the total, because the list underneath already carries it.
 *
 * Deciding a pending rule is NOT here. One-home law: the Safety room owns rule
 * management (HouseRulesPanel), so this reads the record and sends you to the
 * one place that changes it.
 *
 * Both read one server function on one query key, so mounting both costs one
 * request.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PORTED TO MERIDIAN, 2026-08-15. Nothing about what these two regions CLAIM
 * has changed; the parts they are drawn with have.
 *
 * The shell primitives this file used are the `--sp-*` layer, which meridian.css
 * calls life support: "no new surface may use it, every migrated surface drops
 * it." So Block, Row, Empty, Failed, Loading, Num, Button and Actions are gone,
 * replaced by the Meridian parts in `./record-parts`, and the two hue classes
 * `sp-pass` / `sp-fail` are now `text-mrd-pass` / `text-mrd-fail`. Those two
 * were the only colour this file ever spent and they still mean exactly what
 * they meant: an OUTCOME, which is the one thing green and red are allowed to
 * report in this system.
 *
 * The agent mark also changed, and that is a real design decision rather than a
 * repaint. The shell's `AgentMark` encodes the agent as a shape AND its loop
 * stage as one of seven hues, so a column of standing rules drew a stage
 * rainbow down its left edge. Meridian spends colour on one distinction only,
 * and `CrewMark` keeps the shape while dropping the hue. See its own note.
 */
import { useState, type ReactNode } from "react";
import { humanWriteError } from "@/lib/roles.functions";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { getStandingRecord, type StandingRule } from "@/lib/brain-standing.functions";
import { CrewMark, RecordLine } from "@/components/brain/record-parts";
import {
  Action,
  Actions,
  Figure,
  NothingYet,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";

/** Anti-scroll: three rules, then a click. The full set is never a wall. */
const VISIBLE_RULES = 3;

function useStandingRecord() {
  const { activeWorkspaceId } = useWorkspace();
  const f = useServerFn(getStandingRecord);
  return useQuery({
    queryKey: ["brain-standing", activeWorkspaceId],
    queryFn: () => f({ data: { workspaceId: activeWorkspaceId } }),
  });
}

/** "9 Jun", or absent rather than guessed. */
function day(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** The second line is a different fact from the rule itself: where it came
 *  from, and who it binds. A rule with no recorded sources says nothing about
 *  sources rather than claiming zero. */
function provenance(rule: StandingRule): ReactNode {
  const binds = rule.agentSlug
    ? `only ${agentDisplayName(rule.agentSlug)} reads it`
    : "every agent reads it before it acts";
  if (rule.fromOutcomes === 0) return binds;
  return (
    <>
      from <Figure>{rule.fromOutcomes}</Figure> recorded{" "}
      {rule.fromOutcomes === 1 ? "outcome" : "outcomes"}
      {" · "}
      {binds}
    </>
  );
}

/** What the record now tells the crew. Owns its own Block, because whether the
 *  section wants a second line depends on whether it has anything to say. */
export function StandingRules() {
  const q = useStandingRecord();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const rules = q.data?.rules ?? [];
  const pending = q.data?.pendingRules ?? 0;
  const openDrafts = () =>
    navigate({ to: "/engine-room", search: { room: "safety", view: "house-rules" } });

  const title = "What the record now tells the crew";

  if (q.isLoading) {
    return (
      <Region title={title} lead>
        <Reading>Reading the standing rules.</Reading>
      </Region>
    );
  }

  if (q.isError) {
    return (
      <Region title={title} lead>
        {/* THE WHOLE VISIBLE COPY USED TO BE THE EXCEPTION STRING. This was
            `<Failed>{humanWriteError(q.error, "The read failed.")}</Failed>` and nothing else, on
            the FIRST region a reader meets on this surface. Against a backend
            returning 503, which is the state it was found in, every word on
            screen here was a fetch-error string.

            Every other failure arm on Brain leads with a sentence and appends
            the message -- DocsPanel, GraphCanvasView, LearningDetail,
            BriefPanel, GraphTreeView, GraphRecordRegions, CompoundingPanel --
            and they all lead with the same shape for the same reason: a region
            that goes quiet after a failed read is indistinguishable from one
            that read successfully and found nothing, and on THIS region that
            mistaken reading is "the record tells the crew nothing". Naming what
            did not load is what stops a dead read being heard as a verdict. */}
        <ReadFailedLine error={q.error} onRetry={() => void q.refetch()}>
          The standing rules did not load, so this is not a claim that nothing is standing.{" "}
          {humanWriteError(q.error, "The read failed.")}
        </ReadFailedLine>
      </Region>
    );
  }

  if (rules.length === 0) {
    return (
      <Region title={title} lead>
        <NothingYet
          action={
            pending > 0 ? (
              <Action variant="primary" onClick={openDrafts}>
                Read {pending === 1 ? "the draft" : `the ${pending} drafts`}
              </Action>
            ) : undefined
          }
        >
          {pending > 0
            ? "Nothing standing yet. The steward has written a rule out of what shipped, and it is waiting on a human."
            : "Nothing standing yet. The steward reads validated outcomes each week and proposes a rule when the same lesson turns up twice."}
        </NothingYet>
      </Region>
    );
  }

  const shown = showAll ? rules : rules.slice(0, VISIBLE_RULES);

  return (
    <Region title={title} lead sub="Every one of these goes into an agent's prompt before it acts.">
      {shown.map((rule) => (
        <RecordLine
          key={rule.id}
          mark={
            <CrewMark slug={rule.agentSlug} name={agentDisplayName(rule.agentSlug, "the crew")} />
          }
          lead={rule.text}
          sub={provenance(rule)}
          time={day(rule.decidedAt ?? rule.createdAt)}
        />
      ))}

      {rules.length > VISIBLE_RULES || pending > 0 ? (
        <Actions className="mt-mrd-4">
          {rules.length > VISIBLE_RULES ? (
            <Action variant="quiet" onClick={() => setShowAll((v) => !v)}>
              {showAll ? (
                "Show fewer"
              ) : (
                <>
                  Show <Figure>{rules.length - VISIBLE_RULES}</Figure> more
                </>
              )}
            </Action>
          ) : null}
          {pending > 0 ? (
            <Action variant="quiet" onClick={openDrafts}>
              Decide <Figure>{pending}</Figure> the steward wrote
            </Action>
          ) : null}
        </Actions>
      ) : null}
    </Region>
  );
}

/** Whether the crew reaches for what it stored, or null when nothing can be
 *  said honestly. Never repeats the total: the list below carries that. */
function recallLine(
  r:
    | {
        memoriesTotal: number;
        memoriesReached: number;
        events: number;
        helped: number;
        contradicted: number;
        logReady: boolean;
      }
    | undefined,
): ReactNode {
  if (!r || r.memoriesTotal === 0) return null;

  // "Reached for" comes from agent_memory.last_used_at, which is written at
  // recall time and is independent of the recall log. So this sentence stays
  // true whether or not the log is readable.
  if (r.memoriesReached === 0) return "No run has reached for one of these yet.";

  // The counts below come from memory_recall_log, a separate table. When it
  // cannot be read every count is 0, and a 0 draws no clause rather than a
  // claim that nothing helped.
  const rated = r.helped > 0 || r.contradicted > 0;
  return (
    <>
      A run has read <Figure>{r.memoriesReached}</Figure> of these back
      {r.events > 0 ? (
        <>
          {" · "}
          <Figure>{r.events}</Figure> {r.events === 1 ? "recall" : "recalls"} on the record
        </>
      ) : null}
      {rated ? (
        <>
          {" · "}
          {/* The only colour on this line, and both halves report an OUTCOME:
              what a rating said actually happened. Green and red are never a
              need in this system, and nothing here asks for a person. */}
          {r.helped > 0 ? (
            <span className="text-mrd-pass">
              <Figure>{r.helped}</Figure> helped
            </span>
          ) : null}
          {r.helped > 0 && r.contradicted > 0 ? ", " : null}
          {r.contradicted > 0 ? (
            <span className="text-mrd-fail">
              <Figure>{r.contradicted}</Figure> contradicted by what happened
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/** The memory list's region, with the one fact the list itself cannot carry. */
export function CrewCarries({ children }: { children: ReactNode }) {
  const q = useStandingRecord();
  const sub = recallLine(q.data?.recall);
  return (
    <Region title="What the crew carries" sub={sub ?? undefined}>
      {children}
    </Region>
  );
}
