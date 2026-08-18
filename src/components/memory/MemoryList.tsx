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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A MEMORY YOU CANNOT CORRECT IS NOT MEMORY, 2026-08-10.
 *
 * `forgetMemory` has existed in src/lib/agent_loop.functions.ts since the loop
 * was written. It is a real, RLS-scoped, single-row delete, and it had ZERO
 * callers anywhere in the product. So every row on this list was permanent: a
 * wrong lesson, distilled once from a run that misread what happened, went into
 * every future run's prompt forever and the person it was wrong about could
 * read it here and do nothing.
 *
 * That is worse than a missing feature on this particular surface. The claim
 * this page exists to make is that the record GUIDES the next call. A record
 * that guides and cannot be corrected does not compound, it entrenches, and the
 * first time it entrenches something false the reader learns to stop trusting
 * the whole page.
 *
 * THE ACT IS A CORRECTION, NOT A TIDY-UP, and the words say so. The person is
 * not clearing space; they are telling the crew it got something wrong. So the
 * control is "This is wrong", the confirm names the consequence in the crew's
 * behaviour rather than in the database's, and the receipt says what the next
 * run will now do differently.
 *
 * WHAT IT DOES NOT CLAIM. The delete keeps no copy and writes no note about
 * why, so nothing here says the record learned from being corrected. It says
 * exactly what happens: the line comes out, the next run does not carry it, and
 * nothing puts it back. Stating a one-way door plainly is the same rule
 * BriefPanel's retire confirm already follows.
 */
import { useState } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAgentMemory } from "@/lib/memory.functions";
import { forgetMemory } from "@/lib/agent_loop.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { agentLabel, kindLabel, relativeTime, type MemoryRow } from "@/lib/memory-view";
import { Actions, Button, Empty, Failed, Loading, Receipt, Row } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";
import { Provenance, type EvidenceSource } from "@/components/knowledge/EvidenceQuality";

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** The first clause of a memory, for a confirm title and a receipt. Long enough
 *  to be recognisable, short enough that the sentence around it still reads. */
function preview(content: string): string {
  const one = content.replace(/\s+/g, " ").trim();
  return one.length <= 72 ? one : `${one.slice(0, 71)}…`;
}

/**
 * WHERE ONE LINE OF MEMORY CAME FROM. The three kinds this table writes are not
 * the same grade of evidence and the list drew them identically:
 *
 *   outcome     the loop distilled it from a bet that actually shipped and was
 *               scored. That is the workspace's own lived record.
 *   note        a human typed it into the composer on this page. Also theirs.
 *   reflection  an agent's read of its own run. Nothing confirmed it.
 *
 * A reader deciding whether to correct a line needs that distinction more than
 * anywhere else on Brain, because the two grades fail differently: a wrong
 * outcome means the record is wrong, a wrong reflection means an agent guessed.
 * Unknown kinds fall to `inferred` rather than claiming the strongest of the
 * three for something this file has never seen.
 */
function sourceOf(kind: string): EvidenceSource {
  if (kind === "outcome" || kind === "note") return "mine";
  return "inferred";
}

// Anti-scroll (founder ruling 2026-07-06): Brain never becomes a long wall.
// The server already caps the window; this is the UI-side half of that cap.
const VISIBLE_MEMORIES = 8;

export function MemoryList() {
  const f = useServerFn(getAgentMemory);
  /* SCOPED TO THE ACTIVE WORKSPACE, 2026-08-10. `getAgentMemory` filtered on
   * `user_id` alone, and this key named no workspace, so a person who belongs to
   * a seeded demo workspace read its memories while standing in their real one --
   * under the heading "what the crew carries", which is a claim about THIS
   * workspace's accumulated judgement.
   *
   * The count is scoped along with the rows, deliberately. Scoping the list and
   * not the total is the worse bug of the two: the rows would look right while
   * the number above them lied, and nothing on screen would betray it. */
  const { activeWorkspaceId } = useWorkspace();
  const q = useQuery({
    queryKey: ["agent-memory", activeWorkspaceId],
    queryFn: () => f({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  const [showAll, setShowAll] = useState(false);
  const now = Date.now();

  const qc = useQueryClient();
  const confirm = useConfirm();
  const fForget = useServerFn(forgetMemory);

  /* THE COMMIT, session-local (agents/FINAL-agent-presence.md R10). Taking a
   * line out of what every future run reads is not a four-second fact, so it
   * leaves a Receipt rather than a toast. The durable record is the absence of
   * the row itself: this delete keeps no copy, which the confirm says out loud
   * rather than letting the receipt imply otherwise. */
  const [settled, setSettled] = useState<
    { id: string; verb: string; consequence: string; failed?: boolean }[]
  >([]);
  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed },
      ...prev,
    ]);

  const forget = useMutation({
    mutationFn: (vars: { id: string; content: string }) => fForget({ data: { memoryId: vars.id } }),
    onSuccess: (_res, vars) => {
      /* BOTH READERS OF THIS TABLE, or the page contradicts itself on screen.
       * The list re-reads under ["agent-memory", ws]; the region wrapped AROUND
       * this list is CrewCarries, which counts the same rows under
       * ["brain-standing", ws] and would otherwise keep claiming a total that
       * is one higher than the rows underneath it. */
      void qc.invalidateQueries({ queryKey: ["agent-memory", activeWorkspaceId] });
      void qc.invalidateQueries({ queryKey: ["brain-standing", activeWorkspaceId] });
      commit(
        "You told the crew this was wrong",
        `"${preview(vars.content)}" comes out of what the crew reads. The next run will not carry it.`,
      );
    },
    onError: (e: Error, vars) =>
      commit(
        "You tried to correct the record",
        `"${preview(vars.content)}" is still in what the crew reads. ${
          e.message || "The write failed."
        }`,
        true,
      ),
  });

  /* THE CONFIRM IS THE HONEST HALF OF THE ACT. It states the consequence in the
   * crew's behaviour, which is what the person actually cares about, and then
   * the one-way door, which is what they cannot find out any other way: nothing
   * in this product writes a row back into agent_memory, so there is no undo and
   * promising a softer one would be the lie. */
  async function confirmAndForget(row: MemoryRow) {
    const ok = await confirm({
      title: "Tell the crew this is wrong?",
      body: `"${preview(row.content)}" stops going into any future run's prompt. Nothing keeps a copy and nothing here puts it back, so if it was only partly wrong, write the corrected version into the record first.`,
      confirmLabel: "Take it out",
      cancelLabel: "Leave it",
      destructive: true,
    });
    if (ok) forget.mutate({ id: row.id, content: row.content });
  }

  /**
   * Same defect as CompoundingPanel beside it: this was `return null`, inside
   * the "What the crew carries" Block the surface has already drawn, so a cold
   * load painted a titled bordered box with nothing in it. A read in flight is
   * not an absence of rows, and the reader cannot tell the difference from a
   * blank box.
   */
  if (q.isLoading) return <Loading>Reading what the crew carries.</Loading>;

  if (q.isError) {
    return <Failed onRetry={() => void q.refetch()}>{(q.error as Error).message}</Failed>;
  }

  const rows = q.data?.rows ?? [];
  const summary = q.data?.summary;
  const totalAll = q.data?.totalAll ?? rows.length;

  if (rows.length === 0) {
    return (
      <>
        <Empty>
          Nothing learned yet. Record an outcome on a shipped spec, or let an agent reflect on a
          run, and the takeaway lands here for the next run to recall.
        </Empty>
        {/* Correcting the LAST line on the list empties it, and the receipt has
            to survive that: without this the person presses the control, the
            list they were reading becomes an empty state, and nothing on screen
            confirms that what they meant to happen happened. */}
        {settled.map((s) => (
          <Receipt key={s.id} verb={s.verb} consequence={s.consequence} failed={s.failed} />
        ))}
      </>
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
        <Num>{totalAll}</Num> learned
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
          //
          // The mark leads the line because it grades everything after it: a
          // reflection and a scored outcome read identically in words and are
          // not the same evidence, and this is the list where that difference
          // decides whether somebody corrects the row.
          sub={
            <>
              <Provenance source={sourceOf(r.kind)} />
              {`${kindLabel(r.kind)} · from ${agentLabel(r.agentSlug)} · ${
                r.lastUsedAt ? `recalled ${relativeTime(r.lastUsedAt, now)}` : "not recalled yet"
              }`}
            </>
          }
          time={relativeTime(r.createdAt, now)}
          // THE CORRECTION, on the row it is about. It sits in the action slot
          // rather than behind a drill because there is no drill: this list is
          // the only place in the product a memory is ever rendered, so a
          // control anywhere else would be a control nobody finds.
          //
          // Ghost, and named for what the person is asserting rather than for
          // what the database does. It is not tinted red: the interface is
          // monochrome and red carries OUTCOMES here, never intent. The weight
          // of the act is carried by the confirm, which is where it belongs.
          action={
            <Button
              variant="ghost"
              disabled={forget.isPending}
              onClick={() => void confirmAndForget(r)}
              title="Take this out of what the crew reads"
            >
              This is wrong
            </Button>
          }
        />
      ))}

      {/* What you settled, under the list it changed. */}
      {settled.map((s) => (
        <Receipt key={s.id} verb={s.verb} consequence={s.consequence} failed={s.failed} />
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
