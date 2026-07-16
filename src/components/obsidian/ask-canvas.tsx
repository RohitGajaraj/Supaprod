import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAskMissionCanvas, type AskMemoryRecall } from "@/lib/ask-canvas.functions";
import { decideApproval, listApprovals } from "@/lib/agent_loop.functions";
import { useApprovalPush } from "@/hooks/use-approval-push";
import { toast } from "@/lib/notify";
import type { LoopStep } from "@/lib/ai/loop.server";
import type { StudioApproval } from "@/lib/studio.functions";
import type { CriticReview } from "@/lib/ai/critic.server";
import { MonoLabel } from "./primitives";
import { StatusDot, STATUS_WORD } from "./status";
import { VerdictChip, type VerdictTone } from "./verdict";
import { Citation } from "./citation";
import { stepDotState, stepDescription } from "./build-status";

// CMD-0 (H2 Command Canvas, first increment). The blocks Ask's thread
// renders in place of the old dead-end "Track the mission" link while a
// dispatched mission runs: loop progress, the memories it drew on, and the
// Critic's verdict, as outcome-named, Warp-style blocks (command-canvas.md).
// Read-only: no write, no `/api/chat` change (that SSE contract is locked
// per OBS-12 §3). Polls `getAskMissionCanvas` every 4s, the same interval
// `MissionSlideOver` already uses for the same class of data.

const BLOCK_STYLE: React.CSSProperties = {
  background: "var(--surface-recessed)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "10px 12px",
};

const RUN_STATUS_LABEL: Record<string, string> = {
  running: "BUILDING",
  queued: "QUEUED",
  waiting_approval: "WAITING ON YOU",
  blocked: "WAITING ON YOU",
  // RPT-09 (amplifier voice): a loop that merely COMPLETED is not shipped -- run
  // status here is agent_runs.status, not a merged changeset. "SHIPPED" asserted
  // an autonomous ship the operator never called (the same false-ship class
  // build-status.ts was hardened against). The legwork is done and prepared for
  // your call; "SHIPPED" is reserved for a confirmed merge.
  completed: "READY FOR YOU",
  done: "READY FOR YOU",
  failed: "BLOCKED",
  halted: "BLOCKED",
  cancelled: "BLOCKED",
  completed_with_failures: "BLOCKED",
};

/** PURE. Outcome-named label for a run's status (never the raw DB word). */
export function runStatusLabel(status: string): string {
  return RUN_STATUS_LABEL[status] ?? status.toUpperCase();
}

/** PURE. Whether the canvas has anything real to show, gating the whole
 * block area so a mission with no steps/citations/verdict yet renders
 * nothing rather than an empty shell (the no-filler law). A pending
 * approval counts (PC-36 D): a gate waiting on the user must surface even
 * before the run has recorded a single step. */
export function hasCanvasContent(data: {
  run: { steps: LoopStep[] } | null;
  memoryRecalls: AskMemoryRecall[];
  criticVerdict: CriticReview | null;
  approvals?: Array<{ status: string }>;
}): boolean {
  return !!(
    (data.run && data.run.steps.length > 0) ||
    data.memoryRecalls.length > 0 ||
    data.criticVerdict ||
    (data.approvals ?? []).some((a) => a.status === "pending")
  );
}

export function ProgressBlock({
  run,
  approvals,
}: {
  run: { runId: string; status: string; steps: LoopStep[] };
  approvals: StudioApproval[];
}) {
  if (run.steps.length === 0) return null;
  // The last 5 steps: this is a live-progress glance, not the full trace
  // (the full trace is one "Track the mission" click away).
  const recent = run.steps.slice(-5);
  return (
    <div style={BLOCK_STYLE}>
      <MonoLabel tone="muted">{runStatusLabel(run.status)}</MonoLabel>
      <div className="flex flex-col" style={{ gap: 5, marginTop: 8 }}>
        {recent.map((step, i) => {
          const dotState = stepDotState(step, approvals);
          return (
            <div key={i} className="flex items-center gap-2">
              <StatusDot state={dotState} word={STATUS_WORD[dotState]} style={{ flexShrink: 0 }} />
              <span
                className="min-w-0 flex-1 truncate"
                style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-body)" }}
              >
                {stepDescription(step)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The gate fields both approval surfaces share (mission canvas + panel strip). */
type GateRowData = {
  id: string;
  tool_name: string;
  rationale: string | null;
  agent_slug?: string | null;
};

function ApprovalGateRow({
  approval,
  deciding,
  onDecide,
}: {
  approval: GateRowData;
  deciding: boolean;
  onDecide: (approvalId: string, decision: "approve" | "reject") => void;
}) {
  const buttonBase: React.CSSProperties = {
    fontFamily: "var(--font-ui)",
    fontSize: 11.5,
    fontWeight: 600,
    padding: "5px 12px",
    borderRadius: 999,
    cursor: "pointer",
  };
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "0.04em",
          color: "var(--text-subtle)",
        }}
      >
        {approval.agent_slug ? `${approval.agent_slug} · ` : ""}
        {approval.tool_name}
      </span>
      {approval.rationale ? (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--text-body)",
          }}
        >
          {approval.rationale}
        </span>
      ) : null}
      <div className="flex items-center" style={{ gap: 8 }}>
        <button
          type="button"
          disabled={deciding}
          onClick={() => onDecide(approval.id, "approve")}
          className="transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            ...buttonBase,
            background: "var(--text-primary)",
            color: "var(--canvas)",
            border: "1px solid var(--text-primary)",
          }}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={deciding}
          onClick={() => onDecide(approval.id, "reject")}
          className="transition-colors hover:[background:var(--hover)] disabled:opacity-50"
          style={{
            ...buttonBase,
            background: "transparent",
            color: "var(--text-muted)",
            border: "1px solid var(--hairline)",
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

/**
 * PC-36 D - act-from-Ask honors the per-tool approval modes. A confirm or
 * review tool the loop queued becomes a decidable gate right here in the
 * thread, through the SAME decideApproval seam the Build surface and Engine
 * Room use (gate signals, execute-on-approve, trust arcs all apply). The
 * panel never executes a tool itself.
 */
export function ApprovalGateBlock({
  approvals,
  missionId,
}: {
  approvals: StudioApproval[];
  missionId: string;
}) {
  const fDecide = useServerFn(decideApproval);
  const queryClient = useQueryClient();
  const decide = useMutation({
    mutationFn: (vars: { approvalId: string; decision: "approve" | "reject" }) =>
      fDecide({ data: vars }),
    onSuccess: (_r, vars) => {
      toast(vars.decision === "approve" ? "Approved. Running it now." : "Rejected.");
      queryClient.invalidateQueries({ queryKey: ["ask-mission-canvas", missionId] });
      queryClient.invalidateQueries({ queryKey: ["ask-pending-approvals"] });
    },
    // Honest failure copy (review fix 2026-07-16): an approve that throws
    // may have SAVED the decision and failed executing the tool, so "did
    // not save" would lie. Refetch shows the row's true state either way.
    onError: () => {
      toast("That did not go through cleanly. Check Pulse for its state.");
      queryClient.invalidateQueries({ queryKey: ["ask-mission-canvas", missionId] });
      queryClient.invalidateQueries({ queryKey: ["ask-pending-approvals"] });
    },
  });

  const pending = approvals.filter((a) => a.status === "pending");
  if (pending.length === 0) return null;

  return (
    <div style={BLOCK_STYLE}>
      <MonoLabel tone="muted">WAITING ON YOU</MonoLabel>
      <div className="flex flex-col" style={{ gap: 10, marginTop: 8 }}>
        {pending.map((a) => (
          <ApprovalGateRow
            key={a.id}
            approval={a}
            deciding={decide.isPending}
            onDecide={(approvalId, decision) => decide.mutate({ approvalId, decision })}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * PC-36 D2 (founder directive 2026-07-16): the standing inline strip. Any
 * gate pending anywhere - not just a mission this thread dispatched -
 * surfaces at the top of the Ask panel as an actionable card, so acting
 * never requires leaving the conversation. Same decideApproval seam; the
 * strip is a second window onto the same queue Today and the Engine Room
 * count, never a separate approval path.
 */
export function PendingApprovalsStrip() {
  const fList = useServerFn(listApprovals);
  const fDecide = useServerFn(decideApproval);
  const queryClient = useQueryClient();

  // Push-first (PC-36 gap fix): realtime pokes the queries the moment a
  // gate lands or resolves anywhere; the interval is only the safety net
  // for silently-dropped sockets.
  useApprovalPush(true);
  const q = useQuery({
    queryKey: ["ask-pending-approvals"],
    queryFn: () => fList({ data: { status: "pending" } }),
    refetchInterval: 30000,
  });

  const decide = useMutation({
    mutationFn: (vars: { approvalId: string; decision: "approve" | "reject" }) =>
      fDecide({ data: vars }),
    onSuccess: (_r, vars) => {
      toast(vars.decision === "approve" ? "Approved. Running it now." : "Rejected.");
      queryClient.invalidateQueries({ queryKey: ["ask-pending-approvals"] });
    },
    // Same honest-failure treatment as ApprovalGateBlock above.
    onError: () => {
      toast("That did not go through cleanly. Check Pulse for its state.");
      queryClient.invalidateQueries({ queryKey: ["ask-pending-approvals"] });
    },
  });

  const pending = (q.data?.approvals ?? []) as Array<GateRowData & { status: string }>;
  if (pending.length === 0) return null;
  const visible = pending.slice(0, 3);
  const overflow = pending.length - visible.length;

  return (
    <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--hairline)" }}>
      <div style={BLOCK_STYLE}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <MonoLabel tone="muted">WAITING ON YOU</MonoLabel>
          <MonoLabel tone="faint">{String(pending.length)}</MonoLabel>
        </div>
        <div className="flex flex-col" style={{ gap: 10, marginTop: 8 }}>
          {visible.map((a) => (
            <ApprovalGateRow
              key={a.id}
              approval={a}
              deciding={decide.isPending}
              onDecide={(approvalId, decision) => decide.mutate({ approvalId, decision })}
            />
          ))}
        </div>
        {overflow > 0 ? (
          <a
            href="/engine-room?room=record"
            style={{
              display: "inline-block",
              marginTop: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.11em",
              color: "var(--glacier)",
            }}
          >
            {overflow} more in Pulse →
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function MemoryBlock({ recalls }: { recalls: AskMemoryRecall[] }) {
  if (recalls.length === 0) return null;
  // Citation's own anatomy is an inline superscript marker threaded into
  // prose; there is no surrounding sentence here to thread it into, so each
  // chip carries a visible mono-caps kind label alongside it rather than
  // relying on the hover/focus popover alone to say anything at all.
  return (
    <div style={BLOCK_STYLE}>
      <MonoLabel tone="muted">DREW ON</MonoLabel>
      <div className="flex flex-col" style={{ gap: 5, marginTop: 8 }}>
        {recalls.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2">
            <Citation index={i + 1} source={m.kind || "past session"} quote={m.content} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-subtle)",
              }}
            >
              {m.kind || "past session"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CriticBlock({ verdict }: { verdict: CriticReview }) {
  const tone = verdict.verdict.toUpperCase() as VerdictTone;
  // Ask's own rule (obsidian-extensions.md §2) reserves the panel's one
  // ember for a CTA the answer proposes; a Critic verdict is advisory, never
  // a click-here action, so REVISE (VerdictChip's ember-family tone) would
  // read as a second, misleading "you have something to do" signal here.
  // SHIP/KILL (moss/madder) carry no such conflict and use the canonical
  // chip unchanged; REVISE alone gets a neutral mono-caps word instead.
  return (
    <div style={BLOCK_STYLE}>
      <div className="flex items-center gap-2">
        <MonoLabel tone="muted">CRITIC</MonoLabel>
        {tone === "REVISE" ? (
          <MonoLabel tone="faint">REVISE</MonoLabel>
        ) : (
          <VerdictChip tone={tone} />
        )}
      </div>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 12.5,
          lineHeight: 1.55,
          color: "var(--text-body)",
          marginTop: 8,
        }}
      >
        {verdict.summary}
      </p>
    </div>
  );
}

export function MissionCanvasBlocks({ missionId }: { missionId: string }) {
  const fGet = useServerFn(getAskMissionCanvas);
  const q = useQuery({
    queryKey: ["ask-mission-canvas", missionId],
    queryFn: () => fGet({ data: { missionId } }),
    refetchInterval: 4000,
  });

  const data = q.data;
  if (!data || !hasCanvasContent(data)) return null;

  return (
    <div className="flex flex-col" style={{ gap: 8, marginTop: 8 }}>
      {data.run ? <ProgressBlock run={data.run} approvals={data.approvals} /> : null}
      <ApprovalGateBlock approvals={data.approvals} missionId={missionId} />
      <MemoryBlock recalls={data.memoryRecalls} />
      {data.criticVerdict ? <CriticBlock verdict={data.criticVerdict} /> : null}
    </div>
  );
}
