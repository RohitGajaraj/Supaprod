import { useId, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button, MonoLabel } from "@/components/obsidian";

export interface CommitCeremonyBet {
  id: string;
  title: string;
  outcome: string | null;
  measure: string | null;
}

export interface CommitCeremonyProps {
  bet: CommitCeremonyBet;
  onConfirm: (values: { outcome: string; measure: string }) => void;
  onCancel: () => void;
  pending?: boolean;
}

/**
 * OBS-07 §5 step 3 / §7 "Commit ceremony dialog": states the promise (outcome
 * already declared) or collects it (outcome/measure missing) before a bet
 * lands in Now — commitRoadmapItem's own governance contract, made visible.
 */
export function CommitCeremony({ bet, onConfirm, onCancel, pending = false }: CommitCeremonyProps) {
  const hasBoth = Boolean(bet.outcome?.trim()) && Boolean(bet.measure?.trim());
  const [outcome, setOutcome] = useState(bet.outcome ?? "");
  const [measure, setMeasure] = useState(bet.measure ?? "");
  const canConfirm = hasBoth || (outcome.trim().length > 0 && measure.trim().length > 0);
  const outcomeId = useId();
  const measureId = useId();

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && onCancel()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "var(--overlay-modal)", backdropFilter: "blur(3px)" }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="material-modal fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none"
          style={{
            width: "480px",
            maxWidth: "92vw",
            backdropFilter: "blur(20px)",
            padding: "24px",
            animation: "cadRise var(--dur-panel) var(--ease)",
          }}
        >
          <DialogPrimitive.Title
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 460,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {hasBoth ? "Commit this to Now" : "Name the promise first"}
          </DialogPrimitive.Title>

          <div style={{ marginTop: 14 }}>
            {hasBoth ? (
              <p style={{ color: "var(--text-body)", lineHeight: 1.5, margin: 0 }}>
                You are promising: {bet.outcome}. Measured by {bet.measure}.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label htmlFor={outcomeId}>
                    <MonoLabel tone="muted">Outcome</MonoLabel>
                  </label>
                  <input
                    id={outcomeId}
                    autoFocus
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="What changes for the user"
                    maxLength={500}
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--hairline)",
                      borderRadius: "var(--radius-control)",
                      padding: "9px 12px",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label htmlFor={measureId}>
                    <MonoLabel tone="muted">Measure</MonoLabel>
                  </label>
                  <input
                    id={measureId}
                    value={measure}
                    onChange={(e) => setMeasure(e.target.value)}
                    placeholder="How you will know"
                    maxLength={500}
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--hairline)",
                      borderRadius: "var(--radius-control)",
                      padding: "9px 12px",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <p style={{ marginTop: 12, color: "var(--text-subtle)" }}>
            {hasBoth
              ? "Now is the one thing the team builds next · everything else waits."
              : "A bet in Now needs a promise and a number · that is the whole point."}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--geist-space-2x)", marginTop: 18 }}>
            <Button variant="secondary" onClick={onCancel} disabled={pending}>
              Not yet
            </Button>
            <Button
              variant="accent"
              disabled={!canConfirm || pending}
              loading={pending}
              onClick={() => onConfirm({ outcome: outcome.trim(), measure: measure.trim() })}
            >
              Commit to Now
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
