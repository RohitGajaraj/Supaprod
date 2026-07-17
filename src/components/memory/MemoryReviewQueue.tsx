// RPT-28: the memory write review gate, rendered in Brain > Memory beside the
// MemoryList (which shows what already landed in agent_memory). This is the
// consent gate at the write: nothing enters the brain until you approve it.
//
// Two halves: a "Save to brain" composer (proposeMemoryCandidate — the human
// affordance) and the pending queue with Approve / Reject per row. A candidate
// that conflicts with an existing memory shows a "supersedes: ..." indicator;
// approving it retires that memory (supersede-on-conflict). Styling follows
// DesignMemoryPanel — the same pending-review idiom already living in Brain.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  listMemoryCandidates,
  proposeMemoryCandidate,
  decideMemoryCandidate,
  type MemoryCandidateView,
} from "@/lib/memory-candidates.functions";
import { sourceLabel, statusTone, supersedesPreview, willSupersede } from "@/lib/memory-candidates";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { VerdictChip } from "@/components/obsidian/verdict";
import { StepDot } from "@/components/cadence/Primitives";

const CARD_STYLE: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
};

export function MemoryReviewQueue() {
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

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
    onSuccess: (res) => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["memory-candidates"] });
      toast.success(
        res.supersedesMemoryId
          ? "Saved for review. It looks like it replaces an existing memory."
          : "Saved for review. Approve it below to add it to Memory.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approve" | "reject" }) => fDecide({ data: v }),
    onSuccess: (res, v) => {
      qc.invalidateQueries({ queryKey: ["memory-candidates"] });
      // A committed memory now lives in agent_memory; refresh the list beside us.
      if (v.decision === "approve") qc.invalidateQueries({ queryKey: ["agent-memory"] });
      if (v.decision === "reject") toast.success("Rejected. It never entered Memory.");
      else if (res.superseded)
        toast.success("Added to Memory. The memory it replaced was retired.");
      else toast.success("Added to Memory.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = queue.data?.items ?? [];
  const canSave = draft.trim().length >= 3 && !propose.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Composer: the "save this to the brain" affordance. */}
      <div style={{ ...CARD_STYLE, padding: "14px 16px" }}>
        <MonoLabel style={{ marginBottom: 8 }}>Save to brain</MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 10px" }}>
          Add something you want every future agent run to remember. It lands here for review first.
          Nothing enters the brain until you approve it.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Our ICP is seed-stage B2B founders, not enterprise buyers."
          rows={3}
          maxLength={2000}
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            width: "100%",
            resize: "vertical",
            minHeight: 64,
            background: "var(--surface-raised)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "8px 10px",
            fontSize: 13,
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
          }}
        />
        <div className="flex items-center" style={{ gap: 10, marginTop: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!canSave}
            loading={propose.isPending}
            onClick={() => propose.mutate(draft.trim())}
          >
            Save to brain
          </Button>
          <span style={{ fontSize: 11.5, color: "var(--text-subtle)" }}>
            Saved as a proposal, not a live memory.
          </span>
        </div>
      </div>

      {/* Pending queue. */}
      {queue.isLoading ? (
        <div style={{ ...CARD_STYLE, padding: "16px 18px" }}>
          <MonoLabel>Loading the review queue…</MonoLabel>
        </div>
      ) : queue.isError ? (
        <div style={{ ...CARD_STYLE, padding: "16px 18px" }}>
          <MonoLabel style={{ marginBottom: 8 }}>Review queue · failed to load</MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
            {(queue.error as Error).message}
          </p>
          <Button variant="secondary" size="sm" onClick={() => void queue.refetch()}>
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            ...CARD_STYLE,
            padding: "20px 18px",
            borderStyle: "dashed",
          }}
        >
          <MonoLabel style={{ marginBottom: 6 }}>Review queue is clear</MonoLabel>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>
            Nothing is waiting for your approval. Memories the loop proposes, and anything you save
            above, will appear here before they enter Memory.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <MonoLabel>{items.length} awaiting your review</MonoLabel>
          {items.map((c) => (
            <CandidateRow
              key={c.id}
              row={c}
              deciding={decide.isPending}
              onApprove={() => decide.mutate({ id: c.id, decision: "approve" })}
              onReject={() => decide.mutate({ id: c.id, decision: "reject" })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateRow({
  row,
  deciding,
  onApprove,
  onReject,
}: {
  row: MemoryCandidateView;
  deciding: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const supersedes = willSupersede(row.supersedes_memory_id);
  const preview = supersedesPreview(row.supersedes_content);
  return (
    <div style={{ ...CARD_STYLE, padding: "13px 16px" }}>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        {/* RPT-09 (needs-human leads in ember): a pending consent decision leads with
            the ember gate dot, matching the Approvals queue, so "your call" reads in
            ember rather than the Supersedes caveat below (which is demoted to neutral). */}
        {row.status === "pending" ? <StepDot status="gate" /> : null}
        <VerdictChip tone={statusTone(row.status)} />
        <span
          className="mono-label"
          style={{ fontSize: "var(--text-mono-label)", color: "var(--text-subtle)" }}
        >
          {sourceLabel(row.source_kind)}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.5 }}>
        {row.content}
      </p>

      {supersedes ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            flexWrap: "wrap",
            padding: "7px 9px",
            marginBottom: 10,
            borderRadius: "var(--radius-control)",
            background: "var(--surface-recessed)",
            border: "1px solid var(--hairline)",
          }}
        >
          <span
            className="mono-label"
            style={{ fontSize: "var(--text-mono-micro)", color: "var(--text-muted)" }}
          >
            Supersedes
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {preview
              ? `Approving retires an existing memory: "${preview}"`
              : "Approving retires the existing memory it conflicts with."}
          </span>
        </div>
      ) : null}

      <div className="flex items-center" style={{ gap: 8 }}>
        <Button variant="secondary" size="sm" disabled={deciding} onClick={onApprove}>
          Approve
        </Button>
        <Button variant="tertiary" size="sm" disabled={deciding} onClick={onReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}
