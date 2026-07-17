import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { toast } from "@/lib/notify";
import { decideApproval } from "@/lib/agent_loop.functions";
import type { StudioApproval } from "@/lib/studio.functions";
import { MonoLabel } from "@/components/cadence/Primitives";
import { summarizeArgs } from "./studio-format";

/** Consequence-first approve label — name what really happens per tool. */
function approveLabel(toolName: string): string {
  if (toolName === "studio.pr.merge") return "Approve · merges the PR";
  if (toolName === "delegate.openhands") return "Approve · send to OpenHands";
  return `Approve · runs ${toolName}`;
}

/** Human-readable description shown below the tool name for high-context tools. */
function toolDescription(toolName: string): string | null {
  if (toolName === "delegate.openhands")
    return "This will hand the build task off to an external coding agent (OpenHands). It will clone the repo, implement the changes, and return the result for review. This cannot be undone once sent.";
  return null;
}

/**
 * Inline governance gate for a Build session — the screen-3 GatePanel
 * contract: neutral material-medium panel (Tempo reserves ember for the
 * Approve CTA only, per patterns/ai-interfaces.md §4 Do/Don't), tool name,
 * args summary, rationale, consequence-first approve/reject.
 */
export function ApprovalCard({
  approval,
  onDecided,
}: {
  approval: StudioApproval;
  onDecided: () => void;
}) {
  const fDecide = useServerFn(decideApproval);
  const decide = useMutation({
    mutationFn: (decision: "approve" | "reject") =>
      fDecide({ data: { approvalId: approval.id, decision } }),
    onSuccess: (r, decision) => {
      toast.success(
        decision === "approve"
          ? r.executed
            ? "Approved. Tool executed."
            : "Approved."
          : "Rejected. Nothing runs.",
      );
      onDecided();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div
      className="fade-up material-medium"
      style={{
        padding: 14,
      }}
    >
      <MonoLabel icon={ShieldAlert} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
        Waiting on you
      </MonoLabel>
      <div style={{ marginTop: 8 }}>
        <code
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-label-12)",
            background: "var(--surface-raised)",
            border: "1px solid var(--hairline)",
            borderRadius: 6,
            padding: "1px 6px",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {approval.tool_name}
        </code>
      </div>
      {toolDescription(approval.tool_name) ? (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 11.5,
            lineHeight: 1.55,
            color: "var(--text-body)",
          }}
        >
          {toolDescription(approval.tool_name)}
        </p>
      ) : null}
      <div
        style={{
          marginTop: 6,
          fontSize: 11.5,
          lineHeight: 1.55,
          color: "var(--text-body)",
          wordBreak: "break-word",
        }}
      >
        {summarizeArgs(approval.args)}
      </div>
      {approval.rationale ? (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 11.5,
            lineHeight: 1.55,
            fontStyle: "italic",
            color: "var(--text-subtle)",
          }}
        >
          "{approval.rationale}"
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button
          type="button"
          className="btn btn-sm loom-press"
          style={{
            background: "linear-gradient(180deg, var(--cta-grad-top), var(--cta-grad-bottom))",
            color: "var(--cta-ink)",
            fontWeight: 600,
          }}
          disabled={decide.isPending}
          onClick={() => decide.mutate("approve")}
        >
          {decide.isPending ? "Deciding…" : approveLabel(approval.tool_name)}
        </button>
        <button
          type="button"
          className="btn btn-reject btn-sm"
          disabled={decide.isPending}
          onClick={() => decide.mutate("reject")}
        >
          Reject · nothing runs
        </button>
      </div>
    </div>
  );
}
