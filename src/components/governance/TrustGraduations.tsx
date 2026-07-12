// SW-4 / mission 3.10 TRUST RAMP: the graduation-proposal block that renders
// above the tool-approval queue. A proposal is the system asking to loosen
// ONE (agent, tool) gate after a clean streak; accepting is the only thing
// that changes the mode (loop.server.ts overlays it next run), declining
// records the no and the streak starts over from the next decided approval.
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, TrendingUp, X } from "lucide-react";
import { toast } from "@/lib/notify";
import {
  listTrustGraduationProposals,
  decideTrustGraduation,
  type TrustGraduationProposal,
} from "@/lib/trust.functions";

export function TrustGraduationsBlock() {
  const fList = useServerFn(listTrustGraduationProposals);
  const fDecide = useServerFn(decideTrustGraduation);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["trust-graduations"], queryFn: () => fList() });

  const decide = useMutation({
    mutationFn: (v: { proposalId: string; accept: boolean }) => fDecide({ data: v }),
    onSuccess: (r) => {
      toast.success(
        r.applied
          ? `Graduated. The tool now runs on ${r.applied} for that agent.`
          : "Declined. The gate stays where it was; the streak starts over.",
      );
      qc.invalidateQueries({ queryKey: ["trust-graduations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = (q.data ?? []).filter((p) => p.status === "pending");
  // A failed read may not vanish silently: one quiet line with the retry.
  if (q.isError) {
    return (
      <div style={{ marginBottom: 18, fontSize: 12.5, color: "var(--madder)" }}>
        Trust graduations did not load.{" "}
        <button
          type="button"
          className="cursor-pointer hover:underline active:opacity-80"
          onClick={() => void q.refetch()}
          style={{ background: "none", border: "none", padding: 0, color: "var(--text-primary)", fontSize: 12.5 }}
        >
          Retry
        </button>
      </div>
    );
  }
  if (q.isLoading || pending.length === 0) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor, 10.5px)",
          letterSpacing: "0.11em",
          color: "var(--text-subtle)",
          marginBottom: 8,
        }}
      >
        Trust graduations · {pending.length} proposed
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pending.map((p) => (
          <GraduationCard
            key={p.id}
            proposal={p}
            busy={decide.isPending}
            onDecide={(accept) => decide.mutate({ proposalId: p.id, accept })}
          />
        ))}
      </div>
    </div>
  );
}

function GraduationCard({
  proposal: p,
  busy,
  onDecide,
}: {
  proposal: TrustGraduationProposal;
  busy: boolean;
  onDecide: (accept: boolean) => void;
}) {
  return (
    <div className="bento" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <TrendingUp size={14} style={{ color: "var(--text-subtle)" }} aria-hidden="true" />
        <span
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-primary)" }}
        >
          {p.agent_slug}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-body)" }}>
          has earned looser reins on
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-body)" }}>
          {p.tool_name}
        </span>
      </div>
      <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "var(--text-body)" }}>
        {p.clean_streak} clean approvals in a row. Proposal: move this one tool from{" "}
        <strong>{p.from_mode}</strong> to <strong>{p.to_mode}</strong> for this agent. Nothing
        changes unless you accept; high-risk gates keep their floors either way.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onDecide(true)}>
          <Check size={13} aria-hidden="true" /> Accept · {p.to_mode} from next run
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onDecide(false)}>
          <X size={13} aria-hidden="true" /> Decline · stays on {p.from_mode}
        </button>
      </div>
    </div>
  );
}
