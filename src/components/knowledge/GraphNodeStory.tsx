/**
 * One node's story, opened from the graph canvas.
 *
 * Ported to the shell primitives, 2026-07-29. This is one of the things the
 * founder's complaint names directly: clicking a node on a ported page opened a
 * card built from the retired system.
 *
 * WHAT WENT, and why:
 *   KILLED the material-large card. The canvas next to it is the one bordered
 *     container in this region (anti-slop ban 5). The story is Blocks now.
 *   KILLED the local GhostButton, which hand-rolled the focus ring three times
 *     over. Button takes the app-wide ring without being asked.
 *   KILLED every MonoLabel. Mono is for data, never for a section caption
 *     ("came from", "led to", "decision history") and never for a relation name.
 *   KILLED the AuditTag chip and the hand-built trace span beside it. The trace
 *     ref is plain mono via Num, and it reads the same for every kind rather
 *     than switching instrument depending on whether the kind has an audit id.
 *   KILLED the madder-bordered pill on every supersession link. A bordered pill
 *     per row is a bordered container per row, and the border was carrying the
 *     same meaning the word inside it already carried (hard ban 10). The label
 *     is a word, and sp-fail carries the outcome.
 *   KILLED the "Could not trace this node" paragraph with a hand-built retry.
 *     Failed is the primitive, and it refuses to be mistaken for "nothing
 *     downstream yet".
 *
 * The knowledge pass, 2026-08-02. What arrived, and why:
 *   ADDED THE DOOR OUT, and it leads. Every control on this panel acted ON the
 *     node and none of them went and read it, so the canvas was a place you
 *     could arrive at and not leave through. Absent, rather than aimed at
 *     something adjacent, for the five kinds with nowhere honest to go.
 *   ADDED the WHY section. `rationale` and `created_by_agent` are columns on
 *     every lineage row, both populated, and neither had ever been rendered
 *     here: the panel listed neighbours without ever saying why they were
 *     neighbours, which is topology with the reasoning stripped out.
 *   ADDED the recorded verdict to the header, where the record has one, and
 *     nothing at all where it does not.
 *
 * UNCHANGED: getLineage, the ["graph-node-story", kind, id] key, the
 * supersession story derivation, the recentre callback, and the retired-edge
 * de-emphasis that keeps a reversed assertion visible as history.
 */
import { useServerFn } from "@tanstack/react-start";
import { Row } from "@/components/meridian/rows";
import { Num, Actions } from "@/components/meridian/surface-parts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getLineage } from "@/lib/lineage.functions";
import {
  buildSupersessionStory,
  isSupersessionRelation,
  relationPhrase,
  type GraphEdge,
  type GraphNode,
  type LineageRowLike,
  type SupersessionStory,
} from "@/lib/knowledge-graph-view";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { kindLabel, kindTracePrefix, outcomeLabel } from "./graph-visual";
import { nodeDoor } from "./graph-doors";
import { GraphNodeActions } from "./GraphNodeActions";
import { Block, Button, Empty, Failed, Loading } from "@/components/shell/primitives";

type StoryRow = { id: string; relation: string; peer_title?: string | null };

export function GraphNodeStory({
  node,
  edges,
  titleOf,
  onFocus,
  onClose,
}: {
  node: GraphNode | null;
  /**
   * The links the CANVAS is already holding for this node. Not a second fetch:
   * `getKnowledgeGraph` already returns `rationale`, `created_by_agent` and
   * `created_at` on every edge, and nothing rendered any of the three. Passing
   * them down is what turns this panel from a list of neighbours into an account
   * of why they are neighbours.
   */
  edges?: GraphEdge[];
  /** Node key to title, for naming the other end of a link. */
  titleOf?: Map<string, string>;
  onFocus: (kind: string, id: string) => void;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const fLineage = useServerFn(getLineage);
  const story = useQuery({
    queryKey: ["graph-node-story", node?.kind ?? null, node?.id ?? null],
    queryFn: () => fLineage({ data: { kind: node!.kind, id: node!.id } }),
    enabled: !!node && !!node.id,
  });

  if (!node) return null;

  // Raw rows carry the full edge fields the revision story needs. The generic
  // came-from / led-to lists then drop those edges, so the moat mechanic reads
  // once, in its own section, not as a cryptic tag buried in the lineage.
  const ancestorsRaw = (story.data?.ancestors ?? []) as LineageRowLike[];
  const descendantsRaw = (story.data?.descendants ?? []) as LineageRowLike[];
  const supersession = buildSupersessionStory(ancestorsRaw, descendantsRaw);
  const ancestors = ancestorsRaw.filter((r) => !isSupersessionRelation(r.relation)) as StoryRow[];
  const descendants = descendantsRaw.filter(
    (r) => !isSupersessionRelation(r.relation),
  ) as StoryRow[];

  const door = nodeDoor(node.kind, node.id);
  const verdict = outcomeLabel(node.outcome);

  return (
    <div>
      <Block
        title={node.title || "Untitled"}
        // Different facts, never more of the title: what kind of thing it is,
        // how it turned out where the record knows, when it landed, and the id it
        // answers to across the record.
        sub={
          <>
            {kindLabel(node.kind)}
            {verdict ? (
              <>
                {" · "}
                <span className={node.outcome === "missed" ? "sp-fail" : "sp-pass"}>{verdict}</span>
              </>
            ) : null}
            {node.createdAt ? ` · ${relTimeCaps(node.createdAt)}` : ""}
            {" · "}
            <Num>
              {kindTracePrefix(node.kind)}
              {traceRef(node.id)}
            </Num>
          </>
        }
      >
        <Actions
          trailing={
            onClose ? (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            ) : undefined
          }
        >
          {/* THE DOOR OUT, and it leads first. Every other control here acts ON
              the node; this is the only one that goes and reads it, and until it
              existed the canvas was a place you could arrive at and not leave
              through. Absent, rather than pointed somewhere adjacent, for the
              five kinds that genuinely have nowhere to go (graph-doors.ts names
              each one and why).

              One cast, and it is deliberate: the router's generated types cannot
              narrow a `to` chosen from a table at runtime, and the alternative is
              a switch that repeats every route literal a second time and can
              drift from the table. Every entry in that table was verified against
              its route file and its own search parser. */}
          {door ? (
            <Button
              variant="primary"
              onClick={() =>
                navigate({ to: door.to, search: door.search, params: door.params } as never)
              }
            >
              {door.label}
            </Button>
          ) : null}
          <Button onClick={() => onFocus(node.kind, node.id)}>Centre the graph here</Button>
        </Actions>

        <GraphNodeActions node={node} />
      </Block>

      <WhySection node={node} edges={edges} titleOf={titleOf} />

      {story.isLoading ? (
        <Loading>Tracing what it connects to.</Loading>
      ) : story.isError ? (
        <Failed onRetry={() => void story.refetch()}>
          This node did not trace, so this is not a claim that nothing connects to it.{" "}
          {(story.error as Error)?.message ?? ""}
        </Failed>
      ) : (
        <>
          <SupersessionSection story={supersession} onFocus={onFocus} />
          <StorySection
            title="What it came from"
            rows={ancestors}
            emptyText="Nothing recorded upstream. It was written here rather than derived from something else."
          />
          <StorySection
            title="What came out of it"
            rows={descendants}
            emptyText="Nothing downstream yet. Nothing has been built on this."
          />
        </>
      )}
    </div>
  );
}

/**
 * WHY THIS NODE IS JOINED TO ANYTHING, in the record's own words.
 *
 * The defect the founder named: `artifact_lineage` carries a `rationale` and a
 * `created_by_agent` on every row, both populated, and neither had ever reached a
 * pixel on this surface. The reader could see that a decision and an outcome were
 * connected and had no way to ask why anyone thought so or who said it, which is
 * a picture of a brain rather than a brain.
 *
 * IT READS OFF THE GRAPH, not a second fetch. The canvas already holds these
 * edges. The lists below still come from `getLineage`, because they reach past
 * the canvas's node cap; this section is deliberately about the links you can
 * actually see, which is the set a reader is asking about when they open a node.
 *
 * ONE ROW PER LINK, ordered newest first, with the reversed ones kept and faded:
 * invalidate, never delete. A link with no recorded rationale says so plainly
 * rather than being hidden, because "nobody wrote down why" is itself a finding
 * on a surface that sells its reasoning.
 */
function WhySection({
  node,
  edges,
  titleOf,
}: {
  node: GraphNode;
  edges?: GraphEdge[];
  titleOf?: Map<string, string>;
}) {
  const incident = (edges ?? []).filter((e) => e.source === node.key || e.target === node.key);
  if (incident.length === 0) return null;

  const ordered = [...incident].sort(
    (a, b) =>
      Number(a.retired) - Number(b.retired) ||
      (b.validFrom ?? "").localeCompare(a.validFrom ?? "") ||
      a.id.localeCompare(b.id),
  );
  const withReason = ordered.filter((e) => e.rationale).length;

  return (
    <Block
      title="Why it is linked"
      // The different fact, and an honest one: how much of this node's own
      // lineage actually carries a reason, so a thin record reads as thin.
      sub={
        withReason === ordered.length ? (
          <>Every link here carries the reason it was drawn.</>
        ) : (
          <>
            <Num>{withReason}</Num> of <Num>{ordered.length}</Num> links carry the reason they were
            drawn.
          </>
        )
      }
    >
      {ordered.slice(0, 8).map((e) => {
        const side = e.source === node.key ? "source" : "target";
        const peerKey = side === "source" ? e.target : e.source;
        const peerTitle = titleOf?.get(peerKey) || "something no longer in view";
        const when =
          e.validFrom && !Number.isNaN(Date.parse(e.validFrom))
            ? new Date(e.validFrom).toLocaleDateString()
            : null;
        return (
          <Row
            key={e.id}
            // NOT tight. A rationale is the content here, not a detail behind a
            // click, and clamping it to one line would reinstate the exact defect
            // this section exists to fix.
            lead={
              <>
                <span className={e.revises && !e.retired ? "sp-fail" : undefined}>
                  {relationPhrase(e.family, e.inverted, side)}
                </span>{" "}
                {peerTitle}
              </>
            }
            sub={
              <>
                {e.rationale ? e.rationale : "No reason was recorded when this link was drawn."}
                {e.createdByAgent ? ` · ${agentDisplayName(e.createdByAgent)}` : ""}
                {when ? ` · ${when}` : ""}
                {e.retired ? (
                  <span className="sp-fail"> · this link was later reversed</span>
                ) : null}
              </>
            }
          />
        );
      })}
    </Block>
  );
}

function StorySection({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: StoryRow[];
  emptyText: string;
}) {
  return (
    <Block title={title}>
      {rows.length === 0 ? (
        <Empty>{emptyText}</Empty>
      ) : (
        rows
          .slice(0, 8)
          .map((r) => <Row key={r.id} tight lead={r.peer_title || "Untitled"} sub={r.relation} />)
      )}
    </Block>
  );
}

/** DBR-1.5 read side: the revision history for the selected node. Renders
 *  nothing until the engine writes a supersedes or contradicts edge. When
 *  edges exist it names, in plain words, which beliefs this node replaced and
 *  whether a later outcome replaced IT. A row recentres the graph on its
 *  counterpart. */
function SupersessionSection({
  story,
  onFocus,
}: {
  story: SupersessionStory;
  onFocus: (kind: string, id: string) => void;
}) {
  if (story.links.length === 0) return null;
  return (
    <Block
      title="What this replaced"
      // The one fact that matters most goes here rather than as a second
      // paragraph inside: a belief that was itself revised is not current.
      sub={
        story.revised ? (
          <span className="sp-fail">A later recorded outcome revised this belief.</span>
        ) : undefined
      }
    >
      {story.links.slice(0, 8).map((l) => {
        const canFocus = !!l.peerKind && !!l.peerId;
        // Guard the date so a malformed valid_to can never render "Invalid Date".
        const retiredOn =
          l.retiredAt && !Number.isNaN(Date.parse(l.retiredAt))
            ? new Date(l.retiredAt).toLocaleDateString()
            : null;
        return (
          <Row
            key={l.id}
            tight
            lead={l.peerTitle || "Untitled"}
            // The different fact: what the relation was, and whether the
            // assertion still stands. Red carries the outcome; the retired
            // edge stays visible as history rather than being hidden.
            sub={
              l.retired ? (
                <span className="sp-fail">
                  {l.label}
                  {retiredOn ? ` · no longer current since ${retiredOn}` : " · no longer current"}
                </span>
              ) : (
                l.label
              )
            }
            onClick={canFocus ? () => onFocus(l.peerKind, l.peerId) : undefined}
          />
        );
      })}
    </Block>
  );
}
