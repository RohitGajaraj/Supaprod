/**
 * The memory write gate (RPT-28), rendered on Brain behind the "Add to the
 * record" disclosure. Nothing reaches agent_memory without a human approving it
 * here, which makes this one of the few genuine gates in the product.
 *
 * Ported to the --sp-* system. The surface already labels this region, so this
 * file owns the INTERIOR only.
 *
 *   KILLED the three bordered cards (composer, queue state, per-candidate row).
 *     The surface puts this panel inside a Block inside a disclosure; a bordered
 *     box in there is a card inside a card inside a region.
 *   KILLED the "Save to brain" MonoLabel masthead, its paragraph, and the
 *     "Saved as a proposal, not a live memory" helper. Four sentences said one
 *     thing. The field label says what to write, the button says what happens,
 *     and the queue below says it waits for you. Once each.
 *   KILLED the per-row Approve/Reject pair. Twenty rows carrying two buttons is
 *     twenty primary actions and nothing to look at first. The queue is worked
 *     one call at a time, so the call in front of you is the Gate and the rest
 *     are one-line rows; clicking one brings it to the front.
 *   KILLED the VerdictChip and the StepDot. Every row in a PENDING queue is
 *     pending, so a chip saying so on each one is chrome. Ember now lands where
 *     it belongs: on the single mark of the call actually waiting on you.
 *   KILLED the success toasts. An approval that vanishes into a toast teaches
 *     you your judgment left no trace (agents/FINAL-agent-presence.md R10), and
 *     judgment is the whole product here. It leaves a Receipt instead, saying
 *     what the click CAUSED, including when the write failed.
 *
 * ATTRIBUTION. memory_candidates carries no agent slug, only source_kind, so a
 * row says exactly what the record knows: you saved it, the loop distilled it,
 * or an agent proposed it "though not which one". Never an invented name.
 *
 * UNCHANGED: listMemoryCandidates / proposeMemoryCandidate / decideMemoryCandidate,
 * the ["memory-candidates", "pending", workspaceId] key, the ["agent-memory"]
 * invalidation on approve, and the exported MemoryReviewQueue signature.
 */
import { useMemo, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  listMemoryCandidates,
  proposeMemoryCandidate,
  decideMemoryCandidate,
  type MemoryCandidateView,
} from "@/lib/memory-candidates.functions";
import { sourceLabel, supersedesPreview, willSupersede } from "@/lib/memory-candidates";
import { relativeTime } from "@/lib/memory-view";
import { Actions, Block, Button, Empty, Failed, Field, Gate, Loading, Receipt, Row, Textarea } from "@/components/shell/primitives";
import { AgentMark, YouMark } from "@/components/meridian/marks";

/** Who put this in front of you. The table has a source_kind and nothing else,
 *  so an agent-proposed candidate says the agent is not named rather than
 *  borrowing a name from somewhere it does not belong. */
function whoLine(source: string): string {
  if (source === "user") return "You saved it";
  if (source === "outcome") return "The loop distilled it from a shipped outcome";
  if (source === "agent") return "An agent proposed it, though not which one";
  return `${sourceLabel(source)}, unattributed`;
}

/** You are a different KIND of actor from the crew, not a different colour of
 *  one, so a candidate you typed wears the solid disc. The list stays quiet:
 *  ember belongs to the one call in front of you, which is the Gate. */
function markFor(source: string, initials: string) {
  if (source === "user") return <YouMark initials={initials} />;
  if (source === "outcome") return <AgentMark slug={null} name="the loop" state="quiet" />;
  return <AgentMark slug={null} name="An agent" state="quiet" />;
}

function initialsFrom(email: string | null, name: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const stamp = () =>
  new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function MemoryReviewQueue() {
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // Session-local on purpose. The durable record is agent_memory itself;
  // duplicating it here would be a second source of the same truth.
  const [receipts, setReceipts] = useState<
    { id: string; verb: string; consequence: string; at: string; failed?: boolean }[]
  >([]);

  // You act in this queue, so you get a mark like every other actor. Read the
  // same way the shell and the other ported panels read it.
  const [initials, setInitials] = useState("?");
  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setInitials(
        initialsFrom(
          data.user?.email ?? null,
          (data.user?.user_metadata?.full_name as string | undefined) ?? null,
        ),
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  const fList = useServerFn(listMemoryCandidates);
  const fPropose = useServerFn(proposeMemoryCandidate);
  const fDecide = useServerFn(decideMemoryCandidate);

  const queue = useQuery({
    queryKey: ["memory-candidates", "pending", activeWorkspaceId],
    queryFn: () => fList({ data: { workspaceId: activeWorkspaceId, status: "pending" } }),
  });

  const propose = useMutation({
    mutationFn: (content: string) =>
      fPropose({ data: { content, sourceKind: "user", workspaceId: activeWorkspaceId } }),
    onSuccess: () => {
      // No toast: the candidate appears in the queue below, which is the true
      // confirmation and also says what happens to it next.
      setDraft("");
      qc.invalidateQueries({ queryKey: ["memory-candidates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: (v: { row: MemoryCandidateView; decision: "approve" | "reject" }) =>
      fDecide({ data: { id: v.row.id, decision: v.decision } }),
    onSuccess: (res, v) => {
      qc.invalidateQueries({ queryKey: ["memory-candidates"] });
      // A committed memory now lives in agent_memory; refresh the list beside us.
      if (v.decision === "approve") qc.invalidateQueries({ queryKey: ["agent-memory"] });
      setReceipts((r) => [
        {
          id: v.row.id,
          verb: v.decision === "approve" ? "You let it in" : "You kept it out",
          consequence:
            v.decision === "reject"
              ? "It never entered the record."
              : res.superseded
                ? "It is in the record, and what it contradicts was retired."
                : "It is in the record. Every run from here reads it.",
          at: stamp(),
        },
        ...r,
      ]);
    },
    // A write that failed still writes a receipt, and the receipt goes honest
    // immediately. Never a success shape over a failed write.
    onError: (e: Error, v) => {
      setReceipts((r) => [
        {
          id: v.row.id,
          verb: "Nothing was recorded",
          consequence: e.message,
          at: stamp(),
          failed: true,
        },
        ...r,
      ]);
    },
  });

  const items = useMemo(() => queue.data?.items ?? [], [queue.data]);
  // The queue is worked in order, so one call is always in front of you. No
  // effect needed to keep this true: when the focused row is settled and
  // leaves the list, the lookup falls through to the next one.
  const focused = items.find((i) => i.id === focusedId) ?? items[0] ?? null;
  const rest = focused ? items.filter((i) => i.id !== focused.id) : [];
  const now = Date.now();

  const canSave = draft.trim().length >= 3 && !propose.isPending;

  return (
    <div>
      <Field label="Something every future run should know">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Our ICP is seed-stage B2B founders, not enterprise buyers."
          rows={3}
          maxLength={2000}
        />
      </Field>
      <Actions>
        <Button disabled={!canSave} onClick={() => propose.mutate(draft.trim())}>
          {propose.isPending ? "Saving" : "Save for review"}
        </Button>
      </Actions>

      {/* A READ IN FLIGHT IS NOT AN EMPTY QUEUE, and this rendered `null` for
          both. The composer above stays on screen while the read runs, so the
          reader saw a working panel with nothing under it and no way to tell
          whether they had an empty queue or a slow one -- and the difference
          matters here, because an empty queue means they are done and a slow
          one means they are not. Loading is the third fact and it says so. */}
      {queue.isLoading ? (
        <Loading>Reading what is waiting on you.</Loading>
      ) : queue.isError ? (
        <Failed onRetry={() => void queue.refetch()}>{(queue.error as Error).message}</Failed>
      ) : focused ? (
        <Gate
          question={focused.content}
          lines={[
            <span key="who">{whoLine(focused.source_kind)}</span>,
            ...(willSupersede(focused.supersedes_memory_id)
              ? [
                  <span key="sup">
                    <b>Letting it in retires</b>{" "}
                    {supersedesPreview(focused.supersedes_content)
                      ? `what it contradicts: "${supersedesPreview(focused.supersedes_content)}"`
                      : "what it contradicts."}
                  </span>,
                ]
              : []),
          ]}
        >
          <Button
            variant="primary"
            disabled={decide.isPending}
            onClick={() => decide.mutate({ row: focused, decision: "approve" })}
          >
            Let it in
          </Button>
          <Button
            disabled={decide.isPending}
            onClick={() => decide.mutate({ row: focused, decision: "reject" })}
          >
            Keep it out
          </Button>
        </Gate>
      ) : (
        <Empty>
          Nothing is waiting on you. Anything you save above, and anything the crew proposes from a
          run, lands here before it reaches the record.
        </Empty>
      )}

      {receipts.length > 0 ? (
        <Block title="What you settled">
          {receipts.map((r, i) => (
            <Receipt
              key={`${r.id}-${i}`}
              verb={r.verb}
              consequence={r.consequence}
              time={r.at}
              failed={r.failed}
              initials={initials}
            />
          ))}
        </Block>
      ) : null}

      {rest.length > 0 ? (
        <Block title="Also waiting">
          {rest.map((c) => (
            <Row
              key={c.id}
              tight
              marks={markFor(c.source_kind, initials)}
              lead={c.content}
              // A different fact from the lead, never more of it: who put it
              // there, and whether letting it in costs an existing memory.
              sub={
                willSupersede(c.supersedes_memory_id)
                  ? `${whoLine(c.source_kind)} · replaces an earlier one`
                  : whoLine(c.source_kind)
              }
              time={relativeTime(c.created_at, now)}
              onClick={() => setFocusedId(c.id)}
            />
          ))}
        </Block>
      ) : null}
    </div>
  );
}
