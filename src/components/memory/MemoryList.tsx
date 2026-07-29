/**
 * What the crew recalls: the live contents of agent_memory. Every number here
 * is a head count, never an estimate.
 *
 * Ported to the --sp-* system. The surface (routes/_authenticated.brain.tsx)
 * already titles this region with a Block, so this file owns the INTERIOR only.
 *
 *   KILLED the "What the loop recalls" band and its MonoLabel. The surface head
 *     directly above it already says that, in the same words, one line up.
 *   KILLED the MemoryCard per row. A card per memory inside a Block is a card
 *     in a region, and the card carried five stacked lines (two chips, the
 *     content, a source line, and an italic blurb explaining what "reflection"
 *     means) for a list you scan. A memory is now one row: what was learned,
 *     with who learned it and whether the loop has reached for it since.
 *   KILLED the Sparkles icon on the empty state. It was violet, it was larger
 *     than the sentence it introduced, and it decorated a fact.
 *   KILLED the wall. The list shows the most recent few and expands on demand,
 *     the same anti-scroll cap DecisionsPanel carries beside it.
 *
 * ATTRIBUTION. Every row carries a mark and names its source. An outcome row is
 * distilled by the loop across a run (rememberOutcome writes agent_slug = null
 * by design), so it reads "the loop" rather than an invented agent name.
 *
 * UNCHANGED: getAgentMemory, the ["agent-memory"] key, and the exported
 * MemoryList signature.
 */
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAgentMemory } from "@/lib/memory.functions";
import { agentLabel, kindLabel, relativeTime } from "@/lib/memory-view";
import { AgentMark, Actions, Button, Empty, Failed, Num, Row } from "@/components/shell/primitives";

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// Anti-scroll (founder ruling 2026-07-06): Brain never becomes a long wall.
// The server already caps the window; this is the UI-side half of that cap.
const VISIBLE_MEMORIES = 8;

export function MemoryList() {
  const f = useServerFn(getAgentMemory);
  const q = useQuery({ queryKey: ["agent-memory"], queryFn: () => f({ data: {} }) });
  const [showAll, setShowAll] = useState(false);
  const now = Date.now();

  if (q.isLoading) return null;

  if (q.isError) {
    return <Failed onRetry={() => void q.refetch()}>{(q.error as Error).message}</Failed>;
  }

  const rows = q.data?.rows ?? [];
  const summary = q.data?.summary;
  const totalAll = q.data?.totalAll ?? rows.length;

  if (rows.length === 0) {
    return (
      <Empty>
        Nothing learned yet. Record an outcome on a shipped spec, or let an agent reflect on a run,
        and the takeaway lands here for the next run to recall.
      </Empty>
    );
  }

  const shown = showAll ? rows : rows.slice(0, VISIBLE_MEMORIES);

  return (
    <div>
      {/* The counts, said once, as one line. The surface head above already
          named the section, so this carries only what it does not: how much is
          in there, of what, from how many sources, and how fresh it is. */}
      <p
        style={{
          fontSize: "var(--sp-text-meta)",
          color: "var(--sp-mute)",
          marginBottom: "var(--sp-space-3)",
        }}
      >
        <Num>{totalAll}</Num> stored
        {totalAll > rows.length ? (
          <>
            {" · showing the "}
            <Num>{rows.length}</Num> most recent
          </>
        ) : null}
        {summary?.byKind.map((k) => (
          <span key={k.kind}>
            {" · "}
            <Num>{k.count}</Num> {kindLabel(k.kind).toLowerCase()}
            {k.count === 1 ? "" : "s"}
          </span>
        ))}
        {summary && summary.agents.length > 0
          ? ` · ${plural(summary.agents.length, "source")}`
          : null}
        {summary?.lastLearnedAt
          ? ` · last learned ${relativeTime(summary.lastLearnedAt, now)}`
          : null}
      </p>

      {shown.map((r) => (
        <Row
          key={r.id}
          tight
          marks={<AgentMark slug={r.agentSlug} name="the loop" state="quiet" />}
          lead={r.content}
          // A different fact from the lead, never more of it: what kind of
          // memory this is, who it came from, and whether the loop has actually
          // reached for it since. A never-recalled row says so plainly rather
          // than implying it was used.
          sub={`${kindLabel(r.kind)} · from ${agentLabel(r.agentSlug)} · ${
            r.lastUsedAt ? `recalled ${relativeTime(r.lastUsedAt, now)}` : "not recalled yet"
          }`}
          time={relativeTime(r.createdAt, now)}
        />
      ))}

      {rows.length > VISIBLE_MEMORIES ? (
        <Actions>
          <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
            {showAll ? (
              "Show fewer"
            ) : (
              <>
                Show <Num>{rows.length - VISIBLE_MEMORIES}</Num> more
              </>
            )}
          </Button>
        </Actions>
      ) : null}
    </div>
  );
}
