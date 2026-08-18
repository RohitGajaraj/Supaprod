/**
 * The lineage OUTLINE: the downstream provenance tree of whatever node the
 * canvas last centred on. Kept alongside the visual graph (founder ruling
 * 2026-06-20: keep both), and it leads when reduced motion is on, so this is
 * the accessible path through the same data rather than a lesser copy of it.
 *
 * Ported to the shell primitives, 2026-07-29. What went, and why:
 *   KILLED the `bento` card, `--card-pad`, `--surface-2`, `--ink`,
 *     `--ink-muted`, `--ink-subtle`, `--geist-space-*`, `mono-label`,
 *     `btn btn-ghost btn-sm` and `spinner`. None of them resolve against this
 *     shell, which is exactly the founder's complaint: a ported page whose
 *     inner view still carried the previous system.
 *   KILLED the `borderLeft` on the children container. A coloured or ruled
 *     border down one side of a nested block is the single most recognisable
 *     tell on the ban list (ban 4), and indentation was already carrying the
 *     depth. Depth is spacing now.
 *   KILLED the three-stat header row ("N nodes / N depth / N avg branching").
 *     Average branching factor is a graph-theory statistic, not a fact a PM
 *     acts on, and the count and depth were competing with the tree that says
 *     the same thing by being drawn. One honest line, in words.
 *   KILLED the hand-built retry paragraph. Failed is the primitive, and it
 *     refuses to be mistaken for "this node has no lineage".
 *
 * UNCHANGED: getLineageTree, the ["lineage-tree", kind, id] key, the retired
 * de-emphasis that keeps a reversed supersession visible as history, and the
 * default-expanded root.
 */
import { useState } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getLineageTree, computeTreeStats } from "@/lib/knowledge-graph-explorer.functions";
import { type ArtifactKind } from "@/lib/lineage.functions";
import type { LineageNode } from "@/lib/knowledge-graph-explorer";
import { Block, Button, Empty, Failed, Loading, Row } from "@/components/shell/primitives";
import { kindLabel } from "./graph-visual";

function TreeNodeRenderer({ node }: { node: LineageNode }) {
  const [expanded, setExpanded] = useState(node.depth === 0);
  const hasChildren = node.children.length > 0;
  const superseding = node.relation === "supersedes" || node.relation === "contradicts";

  // What the second line says, and it is never a restatement of the title:
  // what kind of thing this is, how it got here, and whether the assertion
  // still stands. Red carries the outcome; a retired revision stays visible as
  // history rather than being hidden (invalidate, never delete).
  const revision = superseding
    ? `${node.relation === "contradicts" ? "contradicted" : "replaced"} what came before${
        node.retired ? ", then was itself reversed" : ""
      }`
    : null;

  const sub = (
    <>
      {kindLabel(node.kind)}
      {revision ? (
        <>
          {" · "}
          <span className="sp-fail">{revision}</span>
        </>
      ) : null}
      {hasChildren ? ` · ${node.children.length} below` : null}
      {node.rationale ? ` · ${node.rationale}` : null}
    </>
  );

  return (
    <>
      {/* Indentation carries depth. Never a border down one side. */}
      <div style={{ marginLeft: node.depth * 20, opacity: node.retired ? 0.55 : 1 }}>
        <Row
          tight
          lead={node.title || "Untitled"}
          sub={sub}
          focused={expanded && hasChildren}
          onClick={hasChildren ? () => setExpanded((v) => !v) : undefined}
        />
      </div>
      {expanded && hasChildren
        ? node.children.map((child) => (
            <TreeNodeRenderer key={`${child.kind}:${child.id}`} node={child} />
          ))
        : null}
    </>
  );
}

export function GraphTreeView({
  focusKind,
  focusId,
  /**
   * Hands the reader to the canvas when there is nothing centred yet.
   *
   * This view is now the DEFAULT rather than the reduced-motion fallback (see
   * GraphPanel), and it is the one view that cannot start from nothing:
   * getLineageTree needs a kind and an id. So its one unanswerable state has to
   * carry a way out, or being promoted makes it a dead end. Optional, so any
   * other mount keeps working and simply describes the act instead.
   */
  onOpenCanvas,
}: {
  focusKind?: string;
  focusId?: string;
  onOpenCanvas?: () => void;
}) {
  const fTree = useServerFn(getLineageTree);
  const enabled = !!focusKind && !!focusId;
  const tree = useQuery({
    queryKey: ["lineage-tree", focusKind ?? null, focusId ?? null],
    queryFn: () => fTree({ data: { kind: focusKind as ArtifactKind, id: focusId! } }),
    enabled,
  });

  if (!enabled) {
    return (
      <Empty
        action={
          onOpenCanvas ? (
            <Button variant="primary" onClick={onOpenCanvas}>
              Pick a starting point
            </Button>
          ) : undefined
        }
      >
        Nothing is centred yet. Choose one piece of work and this outlines everything that came out
        of it, in order, with the reason each step was drawn and who drew it.
      </Empty>
    );
  }
  if (tree.isLoading) return <Loading>Tracing what came out of it.</Loading>;
  if (tree.isError) {
    return (
      <Failed onRetry={() => void tree.refetch()}>
        The lineage did not load, so this is not a claim that nothing came out of this node.{" "}
        {(tree.error as Error).message}
      </Failed>
    );
  }
  if (!tree.data) return null;

  const stats = computeTreeStats(tree.data);
  return (
    <Block
      title="Everything downstream"
      // One honest line rather than three competing statistics. The tree below
      // already shows the shape; this says how far it reaches.
      sub={
        <>
          <Num>{stats.nodeCount}</Num> {stats.nodeCount === 1 ? "thing" : "things"} came out of
          this, <Num>{stats.maxDepth}</Num> {stats.maxDepth === 1 ? "step" : "steps"} deep.
        </>
      }
    >
      <TreeNodeRenderer node={tree.data} />
    </Block>
  );
}
