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
 * WHY IT IS ITS OWN COMPONENT AND NOT PART OF GraphCanvasView. The OUTLINE is
 * the default view now wherever it can answer at all, and it was already the
 * default under reduced motion (GraphPanel states both rulings), so anything
 * living inside the canvas container is invisible to the reader most likely to
 * need a text answer. Sitting beside both views, it is the same information
 * whichever door you came through.
 *
 * IT COSTS NO SECOND REQUEST. It reads the same
 * `["knowledge-graph", kind, id, workspace]` key GraphCanvasView and the Brain
 * route use, so TanStack Query serves it from the one in-flight fetch rather
 * than issuing another.
 *
 * THE SILENCE PASS, 2026-08-10. THIS COMPONENT RENDERED LITERALLY NOTHING.
 * `if (!graph) return null` folded "still reading", "the read failed" and "there
 * is nothing here" into one indistinguishable void, and both regions then stood
 * down again on `scored > 0` and `changes.length > 0`. On a real account both of
 * those are zero, so the whole file was an empty fragment and a broken read
 * looked exactly like a young workspace. Now: Loading, Failed and one empty
 * state, and the empty one is written as the primary case rather than as the
 * exception, because it is the one almost every reader gets.
 *
 * NO NEW SURFACE, NO PANE. Every row either recentres the map through the
 * existing `/brain?tab=graph&focusKind&focusId` route contract, or opens the
 * artifact's real record through the door table. Both are addresses that already
 * existed.
 */
import { useMemo, useState } from "react";
import { humanWriteError } from "@/lib/roles.functions";
import { Row } from "@/components/meridian/rows";
import {
  Num,
  Door,
  Action,
  Region,
  Reading,
  ReadFailed,
  NothingHere,
  NothingYet,
} from "@/components/meridian/surface-parts";
import { Choices } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getKnowledgeGraph } from "@/lib/knowledge-graph-view.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  buildBeliefChanges,
  findOutcomeTrails,
  type GraphNodeKind,
  type OutcomeVerdict,
} from "@/lib/knowledge-graph-view";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { outcomeLabel } from "./graph-visual";
import { nodeDoor } from "./graph-doors";

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
  readStatedAbove = false,
}: {
  focusKind?: string;
  focusId?: string;
  /**
   * True when the view directly above reads THIS query key and already renders
   * its own Loading and Failed for it.
   *
   * The canvas does (GraphCanvasView returns early on both, and returns nothing
   * else). The OUTLINE does not: GraphTreeView reads ["lineage-tree", kind, id],
   * a different request, and says nothing at all about this one. The outline is
   * now the default view, so the reader most likely to need a text answer was
   * the one reader for whom a failed graph read was completely silent. This flag keeps a failure said exactly once on either path, rather
   * than twice on one and zero times on the other.
   */
  readStatedAbove?: boolean;
}) {
  const navigate = useNavigate();
  const fGraph = useServerFn(getKnowledgeGraph);
  // The SAME key GraphCanvasView and the Brain route use. Changing it would
  // double every request -- which is exactly what happened when the scoping
  // pass added the workspace to the route's key and not to the two views'. The
  // workspace travels to the server with it so the read can be narrowed there
  // without touching this side.
  const { activeWorkspaceId } = useWorkspace();
  const graphQ = useQuery({
    queryKey: ["knowledge-graph", focusKind ?? null, focusId ?? null, activeWorkspaceId],
    queryFn: () =>
      fGraph({
        data: {
          focusKind: focusKind as GraphNodeKind | undefined,
          focusId,
          workspaceId: activeWorkspaceId ?? undefined,
        },
      }),
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

  /**
   * THREE FACTS, THREE STATES, AND THIS FILE USED TO RENDER ONE SILENCE.
   *
   * `if (!graph) return null` collapsed "still reading", "the read failed" and
   * "there is nothing here" into the same nothing, and the two regions below
   * then ALSO stood down whenever `scored` and `changes.length` were both zero.
   * On a real account today both ARE zero, so the whole component returned an
   * empty fragment and the reader could not tell a broken read from a young
   * workspace. primitives.tsx states the law this violated: a read that FAILED
   * must never wear an empty state's clothes.
   *
   * The premise the old comment rested on was only half true. The canvas above
   * does say both things; the outline does not, and the outline is the default.
   * See `readStatedAbove`.
   */
  if (graphQ.isLoading) {
    return readStatedAbove ? null : <Reading>Reading what this view can answer.</Reading>;
  }
  if (graphQ.isError && !graph) {
    return readStatedAbove ? null : (
      <ReadFailed error={graphQ.error} onRetry={() => void graphQ.refetch()}>
        This did not load, so it is not a claim that nothing here has an outcome or a revision.{" "}
        {humanWriteError(graphQ.error, "")}
      </ReadFailed>
    );
  }
  if (!graph) return null;

  /**
   * Nothing is in view at all. The canvas and the outline above each say that
   * in their own words, and a third sentence saying it again is the stacked
   * empty state this pass exists to stop, not a fix for it.
   */
  if (graph.nodes.length === 0) return null;

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

  /**
   * THE MAJORITY VIEW, DESIGNED AS THE PRIMARY ONE.
   *
   * Both regions fill from the same act, so when both are empty they get ONE
   * state rather than two "nothing yet" blocks stacked under a map. It names the
   * control by the words printed on it ("Record it", on Learn) instead of
   * describing a feature, and it works one case through, because a worked
   * example is how an operator reads a thing they have never seen produce
   * output. What it must never do is apologise or count zero, which is why
   * there is no "0 outcomes" anywhere in it.
   */
  if (scored === 0 && changes.length === 0) {
    return (
      <Region title="What this view will answer, once an outcome comes back">
        <NothingYet
          action={
            <Action variant="primary" onClick={() => navigate({ to: "/learn" })}>
              Record an outcome
            </Action>
          }
        >
          Nothing drawn here carries a verdict yet, and no belief here has been revised. Both come
          from one act: open Learn, pick a bet that shipped, say how it landed, and press the{" "}
          <b>Record it</b> button.
          {/* The example is the point, not decoration. An operator reading a
              region that has never produced output needs to see one case run
              through it; a description of the feature leaves them guessing what
              they would get. It is written as a hypothetical in prose and never
              as a row, so nothing here can be mistaken for a record. */}
          <span style={{ display: "block", marginTop: "var(--mrd-s4)" }}>
            Worked through: a bet called &ldquo;Self-serve trial&rdquo; ships, and you record that
            it missed. This view then names every call that led to it, in order, and marks any
            belief that outcome overturned, with the reason and the agent that wrote it.
          </span>
        </NothingYet>
      </Region>
    );
  }

  return (
    <>
      {scored > 0 ? (
        <Region
          title="How the bets in view turned out"
          sub={
            <>
              <Num>{scored}</Num> {scored === 1 ? "outcome" : "outcomes"} here carries a recorded
              verdict. Anything unscored is left out rather than counted as a win.
            </>
          }
        >
          <Choices
            mode="one"
            label="Which outcomes to trace back"
            value={verdict}
            options={VERDICT_CHOICES}
            onChange={setVerdict}
          />
          {trails.length === 0 ? (
            <NothingHere>
              Nothing in view came back that way. The verdicts here say something else.
            </NothingHere>
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
        </Region>
      ) : null}

      {changes.length > 0 ? (
        <Region
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
        </Region>
      ) : null}
    </>
  );
}
