// RPT-25: the contradiction auditor, mounted inside a decision's detail. On
// demand it re-reads the workspace's prior decisions and shows how many
// disagree with this call, with a per-item rationale, then lets the operator
// record a real supersession edge (decision -> decision "contradicts") that the
// knowledge graph reasons over.
//
// Ported to the rebuild primitives 2026-07-29, because the founder opened a
// ported page and the legacy design came back the moment a decision was opened.
// What went, and why:
//
//   KILLED the DetailKit DetailSection and the material-medium cards. A card
//     per disagreeing decision, inside a card, inside the detail's own card, is
//     three levels of the cardocalypse (anti-slop ban 5, one bordered container
//     per region). Each one is a Row now, which is the shape a list of things
//     you act on already has.
//   KILLED MonoLabel and the obsidian Button. Mono is for data, never for a
//     status word.
//   KILLED the "Supersession proposed" success TOAST. Recording that one call
//     supersedes another rewrites what the graph reasons over, which is not a
//     four-second fact (agents/FINAL-agent-presence.md R10). It leaves a
//     Receipt naming the decision it superseded.
//   KILLED the audit error toast. A failed read renders Failed with a retry,
//     never silence and never an empty state.
//
// UNCHANGED: auditDecision / proposeSupersession, and the
// ["lineage","decision",id] invalidation that keeps the detail's Evidence
// section true the moment an edge is recorded.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditDecision, proposeSupersession } from "@/lib/contradiction-auditor.functions";
import { Block, Button, Failed, Loading, Num, Receipt, Row } from "@/components/shell/primitives";

export function ContradictionAuditSection({ decisionId }: { decisionId: string }) {
  const qc = useQueryClient();
  const fAudit = useServerFn(auditDecision);
  const fPropose = useServerFn(proposeSupersession);
  const [proposed, setProposed] = useState<Set<string>>(new Set());
  const [settled, setSettled] = useState<
    { id: string; verb: string; consequence: string; failed?: boolean }[]
  >([]);

  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed },
      ...prev,
    ]);

  const audit = useMutation({
    mutationFn: () => fAudit({ data: { id: decisionId } }),
  });

  const propose = useMutation({
    mutationFn: (vars: { supersededId: string; title: string }) =>
      fPropose({ data: { supersedingId: decisionId, supersededId: vars.supersededId } }),
    onSuccess: (_res, vars) => {
      setProposed((prev) => new Set(prev).add(vars.supersededId));
      // The graph reads this decision's lineage under this key (DecisionDetail).
      qc.invalidateQueries({ queryKey: ["lineage", "decision", decisionId] });
      commit(
        "You superseded an earlier call",
        `"${vars.title}" no longer stands. The graph reads this call in its place.`,
      );
    },
    onError: (e: Error, vars) =>
      commit(
        "You tried to supersede an earlier call",
        `"${vars.title}" still stands. ${e.message || "The write failed."}`,
        true,
      ),
  });

  const report = audit.data;

  return (
    <Block
      title="Contradiction audit"
      more={audit.isPending ? undefined : report ? "Read them again" : "Read the prior decisions"}
      onMore={() => audit.mutate()}
    >
      {audit.isPending ? (
        <Loading>Re-reading the workspace&apos;s decisions.</Loading>
      ) : audit.isError ? (
        <Failed onRetry={() => audit.mutate()}>
          The audit did not run, so this is not a claim that nothing disagrees.{" "}
          {(audit.error as Error)?.message ?? ""}
        </Failed>
      ) : !report ? (
        <p className="sp-loading">
          A standing auditor re-reads the workspace&apos;s decisions and flags the ones that
          disagree with this call, so a stale decision never quietly outlives the one that replaced
          it.
        </p>
      ) : report.count === 0 ? (
        <p className="sp-loading">
          Nothing disagrees. Read <Num>{report.scanned}</Num> prior{" "}
          {report.scanned === 1 ? "decision" : "decisions"}, all consistent with this call.
        </p>
      ) : (
        <>
          <p className="sp-loading">
            <Num>{report.count}</Num> of <Num>{report.scanned}</Num> disagree with what you just
            decided.
          </p>
          {report.items.map((item) => {
            const done = proposed.has(item.decisionId);
            const pending =
              propose.isPending && propose.variables?.supersededId === item.decisionId;
            return (
              <Row
                key={item.decisionId}
                lead={item.title}
                // The different fact, never a restatement: WHY it disagrees.
                sub={item.rationale}
                action={
                  done ? (
                    <span className="sp-value" data-tone="pass">
                      Superseded
                    </span>
                  ) : (
                    <Button
                      disabled={pending}
                      onClick={() =>
                        propose.mutate({ supersededId: item.decisionId, title: item.title })
                      }
                      title="Record that this decision supersedes the earlier one"
                    >
                      {pending ? "Recording" : "Supersede it"}
                    </Button>
                  )
                }
              />
            );
          })}
        </>
      )}

      {settled.map((s) => (
        <Receipt key={s.id} verb={s.verb} consequence={s.consequence} failed={s.failed} />
      ))}
    </Block>
  );
}
