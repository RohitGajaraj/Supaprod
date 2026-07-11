// O1 / DBR-1 - the "story" side panel for a graph node, opened by
// double-click on the canvas. Reuses getLineage (immediate parents/children
// with hydrated titles), so the graph stays a thin read surface over the
// lineage we already record. W3 (Loom): ported to v4 tokens, no icon set
// (text affordances only), close affordance, plain-word revision labels.
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getLineage } from "@/lib/lineage.functions";
import { MonoLabel } from "@/components/obsidian/primitives";
import {
  buildSupersessionStory,
  isSupersessionRelation,
  type GraphNode,
  type LineageRowLike,
  type SupersessionStory,
} from "@/lib/knowledge-graph-view";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { kindCssColor, kindLabel, kindTracePrefix } from "./graph-visual";
import { GraphNodeActions } from "./GraphNodeActions";

type StoryRow = { id: string; relation: string; peer_title?: string | null };

function GhostButton({
  onClick,
  children,
  style,
}: {
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: "0.06em",
        color: "var(--text-subtle)",
        background: "transparent",
        border: "none",
        padding: 0,
        textAlign: "left",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

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
    <div
      className="material-large"
      style={{
        background: "var(--card)",
        padding: "16px 18px",
      }}
    >
      <div className="flex items-center" style={{ gap: 7, marginBottom: 4 }}>
        <span
          aria-hidden="true"
          style={{
            width: 9,
            height: 9,
            borderRadius: 3,
            background: kindCssColor(node.kind),
            flexShrink: 0,
          }}
        />
        <MonoLabel style={{ fontSize: "var(--text-mono-floor)" }}>{kindLabel(node.kind)}</MonoLabel>
        <span style={{ flex: 1 }} />
        {onClose ? <GhostButton onClick={onClose}>Close · Esc</GhostButton> : null}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--text-primary)",
          marginBottom: 6,
          lineHeight: 1.35,
        }}
      >
        {node.title || "(untitled)"}
      </div>
      {/* dim 17: the timestamp (present) + the quiet trace ref, so a graph node
          is a first-class, auditable, citable object like every other detail. */}
      <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 10 }}>
        {node.createdAt ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              letterSpacing: "0.06em",
              color: "var(--text-subtle)",
            }}
          >
            {relTimeCaps(node.createdAt)}
          </span>
        ) : null}
        <span
          title={node.id}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.06em",
            color: "var(--text-faint)",
          }}
        >
          {kindTracePrefix(node.kind)}·{traceRef(node.id)}
        </span>
      </div>
      <GhostButton onClick={() => onFocus(node.kind, node.id)} style={{ marginBottom: 4 }}>
        Center the graph here
      </GhostButton>

      <GraphNodeActions node={node} />

      {story.isLoading ? (
        <MonoLabel style={{ fontSize: "var(--text-mono-floor)", marginTop: 10, display: "block" }}>
          tracing…
        </MonoLabel>
      ) : story.isError ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
          Could not trace this node: {(story.error as Error)?.message ?? "unknown error"}
        </p>
      ) : (
        <>
          <SupersessionSection story={supersession} onFocus={onFocus} />
          <StorySection label="came from" rows={ancestors} emptyText="no recorded source" />
          <StorySection label="led to" rows={descendants} emptyText="nothing downstream yet" />
        </>
      )}
    </div>
  );
}

function StorySection({
  label,
  rows,
  emptyText,
}: {
  label: string;
  rows: StoryRow[];
  emptyText: string;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <MonoLabel style={{ fontSize: "var(--text-mono-floor)", marginBottom: 6, display: "block" }}>
        {label}
      </MonoLabel>
      {rows.length === 0 ? (
        <p style={{ fontSize: 11.5, color: "var(--text-subtle)" }}>{emptyText}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.slice(0, 8).map((r) => (
            <div
              key={r.id}
              className="flex items-baseline"
              style={{ fontSize: 12, color: "var(--text-body)", gap: 6 }}
            >
              <MonoLabel
                style={{
                  fontSize: "var(--text-mono-floor)",
                  color: "var(--text-subtle)",
                  flexShrink: 0,
                }}
              >
                {r.relation}
              </MonoLabel>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.peer_title || "(untitled)"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// DBR-1.5 read-side: the revision history for the selected node. Renders
// nothing until the engine writes a supersedes/contradicts edge. When edges
// exist it names, in plain language (madder-accented to match the canvas),
// which beliefs this node replaced, and whether a later outcome replaced IT.
// Links recenter the graph on the counterpart artifact.
function SupersessionSection({
  story,
  onFocus,
}: {
  story: SupersessionStory;
  onFocus: (kind: string, id: string) => void;
}) {
  if (story.links.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <MonoLabel
        style={{
          fontSize: "var(--text-mono-floor)",
          marginBottom: 6,
          display: "block",
          color: "var(--madder)",
        }}
      >
        decision history
      </MonoLabel>
      {story.revised && (
        <p style={{ fontSize: 11.5, color: "var(--madder)", marginBottom: 8, lineHeight: 1.4 }}>
          A later recorded outcome revised this belief.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {story.links.slice(0, 8).map((l) => {
          const canFocus = !!l.peerKind && !!l.peerId;
          // Guard the date so a malformed valid_to can never render "Invalid Date".
          const retiredOn =
            l.retiredAt && !Number.isNaN(Date.parse(l.retiredAt))
              ? new Date(l.retiredAt).toLocaleDateString()
              : null;
          return (
            <button
              key={l.id}
              type="button"
              disabled={!canFocus}
              onClick={() => canFocus && onFocus(l.peerKind, l.peerId)}
              aria-label={`${l.label} ${l.peerTitle || "untitled"}${
                l.retired ? " (no longer current)" : ""
              }`}
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                background: "none",
                border: "none",
                borderRadius: 4,
                padding: 0,
                margin: 0,
                font: "inherit",
                textAlign: "left",
                width: "100%",
                cursor: canFocus ? "pointer" : "default",
                display: "flex",
                gap: 6,
                alignItems: "baseline",
                fontSize: 12,
                color: "var(--text-body)",
                // Retired (reversed) assertions stay visible as history, de-emphasized.
                opacity: l.retired ? 0.5 : 1,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--madder)",
                  flexShrink: 0,
                  border: "1px solid var(--madder)",
                  borderRadius: 4,
                  padding: "1px 4px",
                  opacity: 0.85,
                  textDecoration: l.retired ? "line-through" : undefined,
                }}
              >
                {l.label}
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                  flexShrink: 1,
                }}
              >
                {l.peerTitle || "(untitled)"}
              </span>
              {l.retired && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--text-subtle)",
                    flexShrink: 0,
                  }}
                >
                  {retiredOn ? `· no longer current · ${retiredOn}` : "· no longer current"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
