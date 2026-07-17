// RF-04: House rules — the Engine Room tab for the steward's weekly drafts.
// Pending drafts wait on a human decision (approve reaches the chokepoint,
// reject discards it); approved rules can be replaced ("Supersede"), which
// drafts a new pending rule and retires the old one once THAT is approved
// (house-rules.functions.ts). Styled to match ApprovalsPanel: mono header,
// StepDot status, quiet-Ember action buttons.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ScrollText, X } from "lucide-react";
import { toast } from "@/lib/notify";
import {
  listHouseRules,
  decideHouseRule,
  supersedeHouseRule,
  type HouseRule,
} from "@/lib/house-rules.functions";
import { MonoLabel, StepDot } from "@/components/supaprod/Primitives";

export function HouseRulesPanel() {
  const fList = useServerFn(listHouseRules);
  const fDecide = useServerFn(decideHouseRule);
  const fSupersede = useServerFn(supersedeHouseRule);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["house-rules"], queryFn: () => fList({ data: {} }) });
  const inv = () => qc.invalidateQueries({ queryKey: ["house-rules"] });

  const decide = useMutation({
    mutationFn: (v: { ruleId: string; decision: "approve" | "reject" }) => fDecide({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(
        v.decision === "approve" ? "Approved · now applies to every AI call." : "Rejected.",
      );
      inv();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const supersede = useMutation({
    mutationFn: (v: { oldRuleId: string; ruleText: string; rationale?: string }) =>
      fSupersede({ data: v }),
    onSuccess: () => {
      toast.success("Replacement drafted · approve it to retire the old rule.");
      inv();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.error) {
    return (
      <div className="bento" style={{ padding: 24 }}>
        <div className="mono-label" style={{ color: "var(--madder)" }}>
          Couldn't load house rules
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>
          {(q.error as Error)?.message}
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => void q.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <div
        style={{
          fontSize: "var(--text-label-13)",
          color: "var(--ink-faint)",
          padding: "32px 0",
          textAlign: "center",
        }}
      >
        Loading house rules…
      </div>
    );
  }

  const all = q.data?.rules ?? [];
  const pending = all.filter((r) => r.status === "pending");
  const decided = all.filter((r) => r.status !== "pending");

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <MonoLabel icon={ScrollText}>{pending.length} waiting</MonoLabel>
      </div>

      {all.length === 0 ? (
        <div
          style={{
            fontSize: "var(--text-label-13)",
            color: "var(--ink-faint)",
            padding: "32px 0",
            textAlign: "center",
          }}
        >
          No house rules yet. The weekly steward pass drafts one once there is a real pattern across
          your validated learnings.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...pending, ...decided].map((r) => (
            <HouseRuleCard
              key={r.id}
              r={r}
              busy={decide.isPending && decide.variables?.ruleId === r.id}
              supersedeBusy={supersede.isPending && supersede.variables?.oldRuleId === r.id}
              onApprove={() => decide.mutate({ ruleId: r.id, decision: "approve" })}
              onReject={() => decide.mutate({ ruleId: r.id, decision: "reject" })}
              onSupersede={(ruleText) =>
                supersede.mutate({ oldRuleId: r.id, ruleText, rationale: "Manual replacement" })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

const RESOLVED_LINE: Record<string, { text: string; color: string } | undefined> = {
  approved: { text: "approved · applies to every AI call", color: "var(--moss)" },
  rejected: { text: "rejected · discarded", color: "var(--text-muted)" },
};

function HouseRuleCard({
  r,
  busy,
  supersedeBusy,
  onApprove,
  onReject,
  onSupersede,
}: {
  r: HouseRule;
  busy: boolean;
  supersedeBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSupersede: (ruleText: string) => void;
}) {
  const [replacing, setReplacing] = useState(false);
  const [draft, setDraft] = useState(r.rule_text);
  const resolved = r.status !== "pending";
  const resolvedLine = resolved ? RESOLVED_LINE[r.status] : undefined;
  const dot = resolved ? (r.status === "approved" ? "completed" : "failed") : "gate";

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
        opacity: r.status === "rejected" ? 0.45 : 1,
        transition: "opacity var(--dur-slow)",
        background: "var(--canvas)",
      }}
    >
      <span style={{ marginTop: 5 }}>
        <StepDot status={dot} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "var(--text-label-14)", color: "var(--ink)", margin: "0 0 6px", lineHeight: 1.5 }}>
          {r.rule_text}
        </p>
        {r.rationale ? (
          <p
            style={{ fontSize: 12, color: "var(--ink-muted)", margin: "0 0 8px", lineHeight: 1.5 }}
          >
            {r.rationale}
          </p>
        ) : null}
        <span className="mono-label" style={{ color: "var(--ink-faint)", fontSize: 9.5 }}>
          {r.source_learning_ids.length} learning{r.source_learning_ids.length === 1 ? "" : "s"}{" "}
          distilled
        </span>

        {resolvedLine ? (
          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span className="mono-label" style={{ color: resolvedLine.color }}>
              {resolvedLine.text}
            </span>
            {r.status === "approved" && !replacing ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setReplacing(true)}
              >
                Supersede · draft a replacement
              </button>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="btn btn-approve btn-sm"
              disabled={busy}
              onClick={onApprove}
            >
              <Check size={16} />
              Approve · applies to every AI call
            </button>
            <button
              type="button"
              className="btn btn-reject btn-sm"
              disabled={busy}
              onClick={onReject}
            >
              <X size={16} />
              Reject
            </button>
          </div>
        )}

        {replacing ? (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Replacement rule text"
              rows={2}
              style={{
                fontSize: 13,
                padding: 8,
                border: "1px solid var(--hairline)",
                borderRadius: 6,
                background: "var(--surface-1)",
                color: "var(--ink)",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-approve btn-sm"
                disabled={supersedeBusy || !draft.trim()}
                title={!draft.trim() ? "Write the replacement rule first" : undefined}
                onClick={() => {
                  onSupersede(draft.trim());
                  setReplacing(false);
                }}
              >
                Draft replacement
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setReplacing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
