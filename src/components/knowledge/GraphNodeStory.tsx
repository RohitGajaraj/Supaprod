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
 * UNCHANGED: getLineage, the ["graph-node-story", kind, id] key, the
 * supersession story derivation, the recentre callback, and the retired-edge
 * de-emphasis that keeps a reversed assertion visible as history.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getLineage } from "@/lib/lineage.functions";
import {
  buildSupersessionStory,
  isSupersessionRelation,
  type GraphNode,
  type LineageRowLike,
  type SupersessionStory,
} from "@/lib/knowledge-graph-view";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { kindLabel, kindTracePrefix } from "./graph-visual";
import { GraphNodeActions } from "./GraphNodeActions";
import {
  Actions,
  Block,
  Button,
  Empty,
  Failed,
  Loading,
  Num,
  Row,
} from "@/components/shell/primitives";

type StoryRow = { id: string; relation: string; peer_title?: string | null };

export function GraphNodeStory({
  node,
  onFocus,
  onClose,
}: {
  node: GraphNode | null;
  onFocus: (kind: string, id: string) => void;
  onClose?: () => void;
}) {
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

  return (
    <div>
      <Block
        title={node.title || "Untitled"}
        // Three DIFFERENT facts, never more of the title: what kind of thing it
        // is, when it landed, and the id it answers to across the record.
        sub={
          <>
            {kindLabel(node.kind)}
            {node.createdAt ? ` · ${relTimeCaps(node.createdAt)}` : ""}
            {" · "}
            <Num>
              {kindTracePrefix(node.kind)}
              {traceRef(node.id)}
            </Num>
          </>
        }
      >
        <Actions trailing={onClose ? <Button variant="ghost" onClick={onClose}>Close</Button> : undefined}>
          <Button onClick={() => onFocus(node.kind, node.id)}>Centre the graph here</Button>
        </Actions>

        <GraphNodeActions node={node} />
      </Block>

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
        rows.slice(0, 8).map((r) => (
          <Row key={r.id} tight lead={r.peer_title || "Untitled"} sub={r.relation} />
        ))
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
