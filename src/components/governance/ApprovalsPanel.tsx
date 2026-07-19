// Approvals tab — ported 1:1 from design-reference/supaprod/loop.jsx
// (GovernScreen tab "Approvals" + ApprovalCard + RiskTag): "{n} waiting"
// mono header with the real median response time, "Approve all low-risk"
// ghost, and the detailed approval card — StepDot, "{agent} wants {tool}"
// (agent mono ink, tool mono ink-body), RiskChip, "in {mission}", expiry
// clock, summary, consequence-labeled approve/reject, Mission link. Resolved
// cards dim to 0.45 with the resolved mono line. Production functionality
// kept: decideApproval (approve EXECUTES the tool), extendApprovalTtl,
// the exact-args payload and execution errors. W4 Obsidian reskin: semantic
// tokens only (moss/madder/marigold, --text-*), calm mono-caps loading +
// designed empty slate; no functional or server change. Tempo v5 color
// audit (2026-07-11): glacier retired to neutral gray outside literal
// status/link uses per the machine-voice narrowing.
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Clock, ExternalLink, Shield, X } from "lucide-react";
import { toast } from "@/lib/notify";
import { decideApproval } from "@/lib/agent_loop.functions";
import { listGovernApprovals, extendApprovalTtl } from "@/lib/governance.functions";
import {
  formatTrackRecord,
  type AgentTrackRecord,
  formatOutcomeRecord,
  type AgentOutcomeRecord,
} from "@/lib/agent-track-record";
import { rejectionCountFor } from "@/lib/rejection-learning";
import { MonoLabel, StepDot } from "@/components/supaprod/Primitives";
import { TrustGraduationsBlock } from "./TrustGraduations";
import { relExpiry, fmtMedian, RESOLVED_LINE, toneForRisk } from "./governance-shared";

type GovernApproval = Awaited<ReturnType<typeof listGovernApprovals>>["approvals"][number];

function RiskChip({ risk }: { risk: string }) {
  const tone = toneForRisk(risk);
  return (
    <span
      className="uppercase"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 8.5,
        letterSpacing: "0.1em",
        color: tone,
        border: `1px solid color-mix(in srgb, ${tone} 45%, transparent)`,
        borderRadius: 99,
        padding: "1px 7px",
      }}
    >
      {risk} risk
    </span>
  );
}

export function ApprovalsPanel() {
  const fList = useServerFn(listGovernApprovals);
  const fDecide = useServerFn(decideApproval);
  const fExtend = useServerFn(extendApprovalTtl);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["govern-approvals"], queryFn: () => fList() });

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["govern-approvals"] });
    qc.invalidateQueries({ queryKey: ["governance"] });
  };

  const decide = useMutation({
    mutationFn: (v: { approvalId: string; decision: "approve" | "reject"; tool: string }) =>
      fDecide({ data: { approvalId: v.approvalId, decision: v.decision } }),
    onSuccess: (r, v) => {
      toast.success(
        v.decision === "approve"
          ? r.executed
            ? `Approved · ${v.tool} ran.`
            : "Approved."
          : "Rejected · nothing ran.",
      );
      inv();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      inv();
    },
  });

  const approveAll = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await fDecide({ data: { approvalId: id, decision: "approve" } });
      return ids.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} low-risk approvals ran.`);
      inv();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      inv();
    },
  });

  const extend = useMutation({
    mutationFn: (approvalId: string) => fExtend({ data: { approvalId, additionalHours: 24 } }),
    onSuccess: () => {
      toast.success("Extended · 24h more on the clock.");
      inv();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.error) {
    return (
      <div className="bento" style={{ padding: 24 }}>
        <div className="mono-label" style={{ color: "var(--madder)" }}>
          Couldn't load approvals
        </div>
        <p style={{ fontSize: 13, color: "var(--text-body)", marginTop: 8 }}>
          {(q.error as Error)?.message}
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => q.refetch()}
        >
          Retry · reloads the queue
        </button>
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <p
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor, 10.5px)",
          letterSpacing: "0.11em",
          color: "var(--text-subtle)",
          padding: "24px 0",
        }}
      >
        Reading the queue
      </p>
    );
  }

  const all = q.data?.approvals ?? [];
  // Pending first (soonest expiry on top), resolved history below.
  const pending = all
    .filter((a) => a.status === "pending")
    .sort((x, y) => (x.expires_at ?? "9999").localeCompare(y.expires_at ?? "9999"));
  const resolved = all.filter((a) => a.status !== "pending");
  const rows = [...pending, ...resolved];
  const lowRisk = pending.filter((a) => a.risk === "low");
  const median = q.data?.medianResponseMs;

  return (
    <div>
      {/* SW-4 trust ramp: graduation proposals ride the same judgment surface
          as tool approvals: the system asking, the human deciding. */}
      <TrustGraduationsBlock />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <MonoLabel icon={Shield}>
          {pending.length} waiting
          {median != null ? ` · median response ${fmtMedian(median)}` : ""}
        </MonoLabel>
        {lowRisk.length > 1 ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={approveAll.isPending}
            onClick={() => approveAll.mutate(lowRisk.map((a) => a.id))}
          >
            <Check size={16} />
            Approve all low-risk ({lowRisk.length})
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            padding: "32px 24px",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            background: "var(--card)",
            textAlign: "center",
          }}
        >
          <span
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor, 10.5px)",
              letterSpacing: "0.11em",
              color: "var(--moss-bright)",
            }}
          >
            Nothing waiting
          </span>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-subtle)",
              marginTop: 8,
              maxWidth: 440,
              marginInline: "auto",
              lineHeight: 1.5,
            }}
          >
            The agents are running inside their lanes. When one needs a decision to run a tool, it
            lands here, soonest to expire on top.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((a) => (
            <ApprovalCard
              key={a.id}
              a={a}
              track={q.data?.trackByAgent?.[a.agent_slug ?? ""] ?? null}
              outcome={q.data?.outcomeByAgent?.[a.agent_slug ?? ""] ?? null}
              declines={rejectionCountFor(q.data?.rejectionsByKey, a.agent_slug, a.tool_name)}
              busy={decide.isPending && decide.variables?.approvalId === a.id}
              extending={extend.isPending && extend.variables === a.id}
              onApprove={() =>
                decide.mutate({ approvalId: a.id, decision: "approve", tool: a.tool_name })
              }
              onReject={() =>
                decide.mutate({ approvalId: a.id, decision: "reject", tool: a.tool_name })
              }
              onExtend={() => extend.mutate(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Detailed approval card — the richer layout from the reference, fed by
   production agent_approvals rows. */
function ApprovalCard({
  a,
  track,
  outcome,
  declines,
  busy,
  extending,
  onApprove,
  onReject,
  onExtend,
}: {
  a: GovernApproval;
  track: AgentTrackRecord | null;
  outcome: AgentOutcomeRecord | null;
  declines: number;
  busy: boolean;
  extending: boolean;
  onApprove: () => void;
  onReject: () => void;
  onExtend: () => void;
}) {
  const trackLabel = formatTrackRecord(track);
  const outcomeLabel = formatOutcomeRecord(outcome);
  const resolvedLine = a.status === "pending" ? undefined : RESOLVED_LINE[a.status];
  const resolved = a.status !== "pending";
  const expiry = a.status === "pending" ? relExpiry(a.expires_at) : null;
  const dot = resolved
    ? a.status === "approved" || a.status === "executed"
      ? "completed"
      : "failed"
    : "gate";
  return (
    <div
      className="fade-up lift"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        border: "1px solid var(--hairline)",
        borderRadius: 8,
        opacity: resolved ? 0.45 : 1,
        transition: "opacity var(--dur-slow)",
        background: "var(--card)",
      }}
    >
      <span style={{ marginTop: 5 }}>
        <StepDot status={dot} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span className="mono-label" style={{ color: "var(--text-primary)" }}>
            {a.agent_slug ?? "agent"}
          </span>
          {trackLabel && (
            <span
              className="mono-label"
              style={{ color: "var(--text-faint)", fontSize: 9.5 }}
              title="This agent's decided-approval record across your past gates"
            >
              {trackLabel}
            </span>
          )}
          {outcomeLabel && (
            <span
              className="mono-label"
              style={{ color: "var(--text-faint)", fontSize: 9.5 }}
              title="This agent's recorded outcome record: did the decided-on work actually turn out well, not just whether the gate was approved"
            >
              {outcomeLabel}
            </span>
          )}
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>wants</span>
          <span className="mono-label" style={{ color: "var(--text-body)" }}>
            {a.tool_name}
          </span>
          <RiskChip risk={a.risk} />
          {!resolved && declines > 0 && (
            <span
              className="mono-label"
              style={{ color: "var(--marigold)", fontSize: 9.5 }}
              title="You have declined this agent + tool before. Supaprod has registered it."
            >
              declined {declines}&times; before
            </span>
          )}
          {a.mission_title ? (
            <>
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>in</span>
              <span style={{ fontSize: 12, color: "var(--text-body)" }}>{a.mission_title}</span>
            </>
          ) : null}
          <span style={{ flex: 1 }}></span>
          {expiry ? (
            <span
              className="mono-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: expiry.expired ? "var(--marigold)" : undefined,
              }}
            >
              <Clock size={16} />
              {expiry.text}
            </span>
          ) : null}
        </div>
        {a.rationale ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-body)",
              margin: "4px 0 10px",
              lineHeight: 1.5,
            }}
          >
            {a.rationale}
          </p>
        ) : (
          <div style={{ height: 6 }} />
        )}
        {resolvedLine ? (
          <span className="mono-label" style={{ color: resolvedLine.color }}>
            {resolvedLine.text}
          </span>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-approve btn-sm"
              disabled={busy}
              onClick={onApprove}
            >
              <Check size={16} />
              Approve · runs {a.tool_name}
            </button>
            <button
              type="button"
              className="btn btn-reject btn-sm"
              disabled={busy}
              onClick={onReject}
            >
              <X size={16} />
              Reject · nothing runs
            </button>
            {a.mission_id ? (
              <Link
                className="btn btn-sm hover:underline"
                style={{ color: "var(--link)" }}
                to="/build/$missionId"
                params={{ missionId: a.mission_id }}
              >
                Mission
                <ExternalLink size={16} />
              </Link>
            ) : null}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={extending}
              onClick={onExtend}
            >
              Extend · 24h more
            </button>
          </div>
        )}
        {a.error ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--madder)" }}>{a.error}</div>
        ) : null}
        <details style={{ marginTop: 8 }}>
          <summary
            className="mono-label transition hover:brightness-125"
            style={{ cursor: "pointer", color: "var(--text-faint)", listStylePosition: "inside" }}
          >
            args · the exact payload
          </summary>
          <pre
            className="scrollbar-thin"
            style={{
              marginTop: 6,
              maxHeight: 200,
              overflow: "auto",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              background: "var(--surface-recessed)",
              padding: 10,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(a.args, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
