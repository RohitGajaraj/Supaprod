// BRN-01: the operable brain. One-click actions on a selected graph node that
// dispatch REAL work through the existing loop, not a dead-end preview:
//   - decision: reopen it (status -> pending) + share its public receipt
//   - opportunity / prd: run the Critic against it
//   - any kind: start a mission from it
// Kept as a self-contained sibling of GraphNodeStory (own server-fn calls,
// own mutations) so the story panel stays a pure read view.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Play, RotateCcw, ShieldCheck, Share2 } from "lucide-react";
import { toast } from "@/lib/notify";
import { updateDecision } from "@/lib/decisions.functions";
import { getDecisionShareState, setDecisionShared } from "@/lib/decisions-share.functions";
import { runCriticReview } from "@/lib/discovery.functions";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import type { GraphNode } from "@/lib/knowledge-graph-view";

function copyShareLink(slug: string) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/d/${slug}`;
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Public receipt link copied"),
      () => toast.message(url),
    );
  } else {
    toast.message(url);
  }
}

function ActionButton({
  icon: Icon,
  label,
  pending,
  onClick,
}: {
  icon: typeof Play;
  label: string;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      style={{ fontSize: 10.5, justifyContent: "flex-start" }}
      disabled={pending}
      onClick={onClick}
    >
      <Icon size={11} style={{ marginRight: 5 }} /> {pending ? "working…" : label}
    </button>
  );
}

export function GraphNodeActions({ node }: { node: GraphNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fReopen = useServerFn(updateDecision);
  const reopen = useMutation({
    mutationFn: () => fReopen({ data: { id: node.id, status: "pending" as const } }),
    onSuccess: () => {
      toast.success("Decision reopened. It moves back to pending review.");
      qc.invalidateQueries({ queryKey: ["decisions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [shareLoading, setShareLoading] = useState(false);
  const fShareState = useServerFn(getDecisionShareState);
  const fSetShared = useServerFn(setDecisionShared);
  const share = useMutation({
    mutationFn: async () => {
      setShareLoading(true);
      try {
        const state = await fShareState({ data: { id: node.id } });
        if (state.is_public && state.share_slug) return state;
        return await fSetShared({ data: { id: node.id, isPublic: true } });
      } finally {
        setShareLoading(false);
      }
    },
    onSuccess: (res) => {
      if (res.share_slug) copyShareLink(res.share_slug);
      else toast.message("Sharing lands after the next sync");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fCritic = useServerFn(runCriticReview);
  const critic = useMutation({
    mutationFn: () =>
      fCritic({
        data: { target_kind: node.kind as "opportunity" | "prd", target_id: node.id },
      }),
    onSuccess: ({ review }) => {
      toast.success(`Critic verdict: ${review.verdict}. See the ${node.kind} for the full review.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fStartMission = useServerFn(startOrchestratedMission);
  const startMission = useMutation({
    mutationFn: () =>
      fStartMission({
        data: { goal: `Follow up on: ${node.title || `this ${node.kind}`}`, title: node.title },
      }),
    onSuccess: (res) => {
      toast.success("Mission started from this node.");
      qc.invalidateQueries({ queryKey: ["missions"] });
      navigate({ to: "/build", search: { mission: res.mission_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows: Array<{ key: string; el: React.ReactNode }> = [];

  if (node.kind === "decision") {
    rows.push({
      key: "reopen",
      el: (
        <ActionButton
          icon={RotateCcw}
          label="Reopen decision"
          pending={reopen.isPending}
          onClick={() => reopen.mutate()}
        />
      ),
    });
    rows.push({
      key: "share",
      el: (
        <ActionButton
          icon={Share2}
          label="Share receipt"
          pending={share.isPending || shareLoading}
          onClick={() => share.mutate()}
        />
      ),
    });
  }

  if (node.kind === "opportunity" || node.kind === "prd") {
    rows.push({
      key: "critic",
      el: (
        <ActionButton
          icon={ShieldCheck}
          label="Run the Critic"
          pending={critic.isPending}
          onClick={() => critic.mutate()}
        />
      ),
    });
  }

  rows.push({
    key: "mission",
    el: (
      <ActionButton
        icon={Play}
        label="Start a mission from this"
        pending={startMission.isPending}
        onClick={() => startMission.mutate()}
      />
    ),
  });

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: "1px solid var(--hairline, #e5e0d8)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {rows.map((r) => (
        <div key={r.key}>{r.el}</div>
      ))}
    </div>
  );
}
