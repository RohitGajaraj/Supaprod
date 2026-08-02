/**
 * WHAT THE GRAPH ACTUALLY SAYS, in sentences.
 *
 * Two regions that answer the two questions the canvas could draw and never
 * state, mounted UNDER whichever view is showing:
 *
 *   How the bets in view turned out, and which calls led there. The product's
 *   claim is that it remembers how things turned out, and until `learning` became
 *   a nameable kind this question had no surface at all: 146 recorded outcomes
 *   rendered blank and could not even be focused. Drawing them is not the same as
 *   being able to ask about them.
 *
 *   Where the thinking changed. A revision was a madder dash on a canvas, and a
 *   dash refuses to say what changed, when, or on whose say-so. Every field in
 *   these rows (`rationale`, `created_by_agent`, `created_at`, `valid_to`, the
 *   engine's confidence tier) was already being fetched and none had ever been
 *   rendered anywhere.
 *
 * WHY IT IS ITS OWN COMPONENT AND NOT PART OF GraphCanvasView. Reduced motion
 * makes the OUTLINE the default view (GraphPanel does this deliberately, and the
 * outline exists for exactly that reason), so anything living inside the canvas
 * container is invisible to the reader most likely to need a text answer. Sitting
 * beside both views, it is the same information whichever door you came through.
 *
 * IT COSTS NO SECOND REQUEST. It reads the same `["knowledge-graph", kind, id]`
 * key GraphCanvasView uses, so TanStack Query serves it from the one in-flight
 * fetch rather than issuing another.
 *
 * NO NEW SURFACE, NO PANE. Every row either recentres the map through the
 * existing `/brain?tab=graph&focusKind&focusId` route contract, or opens the
 * artifact's real record through the door table. Both are addresses that already
 * existed.
 */
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getKnowledgeGraph } from "@/lib/knowledge-graph-view.functions";
import {
  buildBeliefChanges,
  findOutcomeTrails,
  type GraphNodeKind,
  type OutcomeVerdict,
} from "@/lib/knowledge-graph-view";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { outcomeLabel } from "./graph-visual";
import { nodeDoor } from "./graph-doors";
import { Block, Choices, Door, Empty, Num, Row } from "@/components/shell/primitives";

const VERDICT_CHOICES: { id: OutcomeVerdict; label: string; title: string }[] = [
  { id: "missed", label: "Did not pay off", title: "Outcomes the record scored as a miss" },
  { id: "mixed", label: "Mixed", title: "Outcomes that came back partly right" },
  { id: "validated", label: "Paid off", title: "Outcomes the record scored as a win" },
];

/** "9 Jun 2026", or nothing when the stamp is unreadable. Never a guess. */
function day(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** `kind:id` back into its two halves. An id never contains a colon. */
function splitKey(key: string): [string, string] {
  const i = key.indexOf(":");
  return i < 0 ? [key, ""] : [key.slice(0, i), key.slice(i + 1)];
}

export function GraphRecordRegions({
  focusKind,
  focusId,
}: {
  focusKind?: string;
  focusId?: string;
}) {
  const navigate = useNavigate();
  const fGraph = useServerFn(getKnowledgeGraph);
  const graphQ = useQuery({
    // The SAME key GraphCanvasView uses. Changing it would double every request.
    queryKey: ["knowledge-graph", focusKind ?? null, focusId ?? null],
    queryFn: () => fGraph({ data: { focusKind: focusKind as GraphNodeKind | undefined, focusId } }),
  });

  /**
   * The verdict being traced. The miss leads because that is the question a PM
   * cannot answer anywhere else: a win explains itself, a miss is the thing you
   * are about to repeat.
   */
  const [verdict, setVerdict] = useState<OutcomeVerdict>("missed");

  const graph = graphQ.data ?? null;

  const trails = useMemo(
    () => (graph ? findOutcomeTrails(graph, { verdicts: [verdict] }) : []),
    [graph, verdict],
  );
  const changes = useMemo(() => (graph ? buildBeliefChanges(graph) : []), [graph]);
  /**
   * The honest denominator: outcomes in view whose verdict actually loaded. A
   * graph whose learnings did not resolve must read as unknown, never as a
   * workspace with nothing to answer for.
   */
  const scored = useMemo(
    () => (graph?.nodes ?? []).filter((n) => n.kind === "learning" && n.outcome).length,
    [graph],
  );

  // Silent while the graph is in flight or failed: the canvas above already says
  // both of those things, and saying them twice on one screen is noise.
  if (!graph) return null;

  const recentre = (key: string) => {
    const [kind, id] = splitKey(key);
    if (!kind || !id) return;
    navigate({ to: "/brain", search: { tab: "graph", focusKind: kind, focusId: id } });
  };

  const openRecord = (key: string) => {
    const [kind, id] = splitKey(key);
    const door = nodeDoor(kind, id);
    if (!door) return;
    // One cast, deliberate: the router's generated types cannot narrow a `to`
    // chosen from a table at runtime. Every entry in that table was verified
    // against its route file and that route's own search parser.
    navigate({ to: door.to, search: door.search, params: door.params } as never);
  };

  return (
    <>
      {scored > 0 ? (
        <Block
          title="How the bets in view turned out"
          sub={
            <>
              <Num>{scored}</Num> {scored === 1 ? "outcome" : "outcomes"} here carries a recorded
              verdict. Anything unscored is left out rather than counted as a win.
            </>
          }
        >
          <Choices
            label="Which outcomes to trace back"
            value={verdict}
            options={VERDICT_CHOICES}
            onPick={setVerdict}
          />
          {trails.length === 0 ? (
            <Empty>Nothing in view came back that way. The verdicts here say something else.</Empty>
          ) : (
            trails.slice(0, 6).map((trail) => {
              const [kind, id] = splitKey(trail.outcomeKey);
              const door = nodeDoor(kind, id);
              return (
                <div key={trail.outcomeKey}>
                  <Row
                    lead={trail.outcomeTitle || "Untitled outcome"}
                    sub={
                      <>
                        <span className={trail.verdict === "missed" ? "sp-fail" : undefined}>
                          {outcomeLabel(trail.verdict)}
                        </span>
                        {day(trail.at) ? ` · ${day(trail.at)}` : ""}
                        {trail.decisions.length === 0
                          ? " · no recorded call sits behind this one"
                          : ` · ${trail.decisions.length} ${
                              trail.decisions.length === 1 ? "call" : "calls"
                            } led here`}
                      </>
                    }
                    onClick={() => recentre(trail.outcomeKey)}
                    action={
                      door ? (
                        <Door title={door.label} onClick={() => openRecord(trail.outcomeKey)}>
                          {door.label}
                        </Door>
                      ) : undefined
                    }
                  />
                  {/* The calls behind it. Indented, because they belong to the
                      outcome above rather than standing beside it, and depth is
                      spacing in this system, never a rule down one side. */}
                  {trail.decisions.slice(0, 4).map((d) => (
                    <div key={d.key} style={{ marginLeft: 20 }}>
                      <Row
                        tight
                        lead={d.title || "Untitled call"}
                        sub={
                          d.direct
                            ? "the outcome names this call directly"
                            : `${d.hops} steps upstream`
                        }
                        onClick={() => recentre(d.key)}
                        action={
                          nodeDoor(...splitKey(d.key)) ? (
                            <Door title="Open this call" onClick={() => openRecord(d.key)}>
                              Open
                            </Door>
                          ) : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </Block>
      ) : null}

      {changes.length > 0 ? (
        <Block
          title="Where the thinking changed"
          sub={
            <>
              <Num>{changes.length}</Num> {changes.length === 1 ? "belief" : "beliefs"} in view
              stopped being current, and the record says why.
            </>
          }
        >
          {changes.slice(0, 8).map((c) => (
            <Row
              key={c.id}
              lead={
                <>
                  <span className={c.retired ? undefined : "sp-fail"}>{c.label}</span>{" "}
                  {c.revisedTitle || "Untitled"}
                  {c.revisedByTitle ? ` by ${c.revisedByTitle}` : ""}
                </>
              }
              sub={
                <>
                  {c.rationale ? c.rationale : "No reason was recorded for this revision."}
                  {c.agent ? ` · ${agentDisplayName(c.agent)}` : ""}
                  {day(c.at) ? ` · ${day(c.at)}` : ""}
                  {/* A strong claim and a weak one must not read alike. Shown only
                      where the engine actually scored it: an unscored revision
                      says nothing rather than borrowing a confidence. */}
                  {c.confidenceTier ? ` · ${c.confidenceTier} call` : ""}
                  {c.retired ? (
                    <span className="sp-fail">
                      {day(c.retiredAt)
                        ? ` · reversed again on ${day(c.retiredAt)}`
                        : " · reversed again later"}
                    </span>
                  ) : null}
                </>
              }
              onClick={() => recentre(c.revisedKey)}
              action={
                nodeDoor(...splitKey(c.revisedKey)) ? (
                  <Door
                    title="Open the belief that changed"
                    onClick={() => openRecord(c.revisedKey)}
                  >
                    Open
                  </Door>
                ) : undefined
              }
            />
          ))}
        </Block>
      ) : null}
    </>
  );
}
