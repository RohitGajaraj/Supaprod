import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
import { Button, MonoLabel } from "@/components/obsidian";
import { draftContractFromIntent } from "@/lib/discovery.functions";

/**
 * OBS-10: the legacy SpecsPanel intent composer, ported into Plan. One line
 * in, a full agent-authored Outcome Contract out — lands on the Contract tab
 * to judge deltas, not a blank page (matches the legacy behavior exactly).
 */
export function SpecComposer() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fDraft = useServerFn(draftContractFromIntent);
  const [intent, setIntent] = useState("");

  const draft = useMutation({
    mutationFn: (value: string) => fDraft({ data: { intent: value } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["prds"] });
      toast.success(
        r.clarifying_questions.length > 0
          ? `Contract drafted. ${r.clarifying_questions.length} open question${r.clarifying_questions.length === 1 ? "" : "s"} for you.`
          : "Contract drafted. Critic reviewed it.",
      );
      if (r.prd?.id) {
        navigate({ to: "/prds/$id", params: { id: r.prd.id }, search: { tab: "contract" } });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    const value = intent.trim();
    if (!value || draft.isPending) return;
    draft.mutate(value);
    setIntent("");
  };

  return (
    <div
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-panel)",
        border: "1px solid var(--hairline)",
        padding: "14px 16px",
        marginBottom: 16,
      }}
    >
      <MonoLabel tone="muted">What do you want to build?</MonoLabel>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="One line is enough. The agent drafts the full contract from it."
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          style={{
            flex: 1,
            padding: "9px 12px",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            fontSize: 13,
            color: "var(--text-primary)",
            background: "var(--surface-raised)",
          }}
        />
        <Button
          variant="primary"
          disabled={draft.isPending || !intent.trim()}
          loading={draft.isPending}
          onClick={submit}
        >
          Draft the contract
        </Button>
      </div>
    </div>
  );
}
