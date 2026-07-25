// PC-12: ONE review item carrying all three fan-out sections (draft, eval,
// risks) plus a one-line synthesis, instead of three separate
// notifications. Lives in the judgment lane next to ordinary approvals.
// PC-15: Pulse feedback wired into composite reviews.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { decideFanoutBatch, type FanoutBatch } from "@/lib/fanout.functions";
import { PulsePrompt } from "@/components/supaprod/PulsePrompt";

const SECTION_LABELS: { key: "draft" | "eval" | "risks"; label: string }[] = [
  { key: "draft", label: "Draft path" },
  { key: "eval", label: "Honest eval" },
  { key: "risks", label: "Real risks" },
];

export function CompositeReviewCard({ batch }: { batch: FanoutBatch }) {
  const qc = useQueryClient();
  const fDecide = useServerFn(decideFanoutBatch);
  const decide = useMutation({
    mutationFn: (decision: "accepted" | "dismissed") =>
      fDecide({ data: { batchId: batch.id, decision } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["fanout-batches"] }),
  });

  if (batch.status !== "ready" || !batch.composite) return null;
  const composite = batch.composite;

  return (
    <div
      className="material-medium"
      style={{
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
          margin: "0 0 6px",
        }}
      >
        Explored from all sides
      </p>
      <h3
        style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}
      >
        {batch.targetTitle}
      </h3>
      {composite.synthesis ? (
        <p
          style={{
            color: "var(--text-body)",
            fontStyle: "italic",
            margin: "0 0 14px",
          }}
        >
          {composite.synthesis}
        </p>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {SECTION_LABELS.map((s) => (
          <div key={s.key}>
            <p
              style={{
                fontWeight: 600,
                color: "var(--text-subtle)",
                margin: "0 0 3px",
              }}
            >
              {s.label}
            </p>
            <p style={{ color: "var(--text-body)", margin: 0, lineHeight: 1.55 }}>
              {composite[s.key] ?? "No response from this angle."}
            </p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => decide.mutate("accepted")}
          disabled={decide.isPending}
          className="btn btn-secondary btn-sm"
        >
          Useful, thanks
        </button>
        <button
          type="button"
          onClick={() => decide.mutate("dismissed")}
          disabled={decide.isPending}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid var(--hairline)",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          Dismiss
        </button>
      </div>
      <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 12 }}>
        <PulsePrompt surface="composite_review" targetId={batch.id} />
      </div>
    </div>
  );
}
