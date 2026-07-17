// RPT-25: the contradiction auditor, mounted on a decision detail view. On
// demand it re-reads the workspace's prior decisions and shows "N of M
// disagree" with a per-item rationale, then lets the operator propose a real
// supersession edge (decision -> decision "contradicts") that the knowledge
// graph reasons over. Matches the DecisionDetail anatomy: a DetailSection with a
// right-aligned action, quiet monotone bodies, one accent on the count. No
// em/en dashes in any string.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { auditDecision, proposeSupersession } from "@/lib/contradiction-auditor.functions";
import { Button, MonoLabel } from "@/components/obsidian";
import { DetailSection } from "@/components/discover/DetailKit";

export function ContradictionAuditSection({ decisionId }: { decisionId: string }) {
  const qc = useQueryClient();
  const fAudit = useServerFn(auditDecision);
  const fPropose = useServerFn(proposeSupersession);
  const [proposed, setProposed] = useState<Set<string>>(new Set());

  const audit = useMutation({
    mutationFn: () => fAudit({ data: { id: decisionId } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const propose = useMutation({
    mutationFn: (supersededId: string) =>
      fPropose({ data: { supersedingId: decisionId, supersededId } }),
    onSuccess: (_res, supersededId) => {
      setProposed((prev) => new Set(prev).add(supersededId));
      // The graph reads this decision's lineage under this key (DecisionDetail).
      qc.invalidateQueries({ queryKey: ["lineage", "decision", decisionId] });
      toast.success("Supersession proposed. It now reads on the graph.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const report = audit.data;

  return (
    <DetailSection
      heading="Contradiction audit"
      action={
        <Button
          variant="secondary"
          size="sm"
          disabled={audit.isPending}
          onClick={() => audit.mutate()}
          title="Re-read the workspace's decisions and flag the ones that disagree with this call"
        >
          {audit.isPending ? "Reading..." : report ? "Re-read" : "Re-read decisions"}
        </Button>
      }
    >
      {audit.isError ? (
        <p style={{ fontSize: "12px", color: "var(--madder)", lineHeight: 1.55, margin: 0 }}>
          {(audit.error as Error)?.message ?? "The audit could not run."}
        </p>
      ) : !report ? (
        <p style={{ fontSize: "12px", color: "var(--text-subtle)", lineHeight: 1.55, margin: 0 }}>
          A standing auditor re-reads the workspace's decisions and flags the ones that disagree
          with this call, so a stale decision never quietly outlives the one that replaced it.
        </p>
      ) : report.count === 0 ? (
        <p style={{ fontSize: "12.5px", color: "var(--text-body)", lineHeight: 1.55, margin: 0 }}>
          Nothing disagrees. Read {report.scanned} prior{" "}
          {report.scanned === 1 ? "decision" : "decisions"}, all consistent with this call.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 550,
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}
          >
            {report.count} of {report.scanned} disagree with what you just decided.
          </span>
          {report.items.map((item) => {
            const done = proposed.has(item.decisionId);
            const pending = propose.isPending && propose.variables === item.decisionId;
            return (
              <div
                key={item.decisionId}
                className="material-medium"
                style={{
                  background: "var(--card)",
                  padding: "11px 13px",
                  display: "grid",
                  gap: "7px",
                }}
              >
                <span style={{ fontSize: "12.5px", fontWeight: 550, color: "var(--text-body)" }}>
                  {item.title}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-subtle)", lineHeight: 1.55 }}>
                  {item.rationale}
                </span>
                <div className="flex items-center" style={{ gap: "8px" }}>
                  {done ? (
                    <MonoLabel style={{ fontSize: "var(--text-mono-floor)", color: "var(--moss)" }}>
                      Supersession recorded
                    </MonoLabel>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() => propose.mutate(item.decisionId)}
                      title="Record that this decision supersedes the earlier one"
                    >
                      {pending ? "Recording..." : "Propose supersession"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DetailSection>
  );
}
