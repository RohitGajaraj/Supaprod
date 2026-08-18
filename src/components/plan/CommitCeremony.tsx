/**
 * THE CEREMONY. The one moment in the product where a commitment becomes a
 * promise, and the only place a bet can enter Now.
 *
 * ============================================================================
 * 2026-08-10: REDRAWN ON THE INK TOKENS, AND THE GLASS CAME OFF.
 * ============================================================================
 *
 * It was the last dialog on this station in the retired kit: `material-modal`
 * with `backdropFilter: blur(20px)` on the content AND `blur(3px)` on the
 * overlay, drawn in `--text-primary`, `--surface-raised`, `--hairline`,
 * `--radius-control` and `--overlay-modal`, with `MonoLabel` shouting "OUTCOME"
 * and "MEASURE" in letter-spaced caps and a `variant="accent"` button.
 *
 * The blur is the point. The spec editor's own docblock records the ruling in as
 * many words: "The retired action bar was sticky and blurred, which is the glass
 * ban." A dialog is the one thing on screen and it does not need to prove it by
 * dissolving what is behind it; `--sp-float` is the token for something
 * genuinely floating and `--sp-scrim` is the token for dimming what it covers,
 * and both exist precisely so no surface has to invent a blur.
 *
 * NOTHING ABOUT THE CONTRACT MOVED. Same props, same `canConfirm` rule (both
 * fields, or a bet that already carries both), same two buttons, same Radix
 * dialog with the same `onOpenChange`. What changed is the palette, the labels
 * and one sentence.
 *
 * THE SENTENCE. The footer read "A bet in Now needs a promise and a number ·
 * that is the whole point." The middle dot was doing the work of a full stop and
 * "that is the whole point" is the product congratulating itself rather than
 * telling the person what happens. It says what the promise BUYS now, which is
 * the only reason a person should be asked to write one: it is what Learn grades
 * the work against later.
 */
import { useId, useState } from "react";
import { Actions } from "@/components/meridian/surface-parts";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button, Field, Input } from "@/components/shell/primitives";

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
 * States the promise (outcome already declared) or collects it (outcome or
 * measure missing) before a bet lands in Now. This is `commitRoadmapItem`'s own
 * governance contract, made visible: the server refuses a lane change that
 * leaves a bet in Now without both halves, and rather than surfacing that as an
 * error after the fact, the dialog asks first.
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
        {/* The scrim dims what it covers. It does not blur it: pure black over a
            warm ground reads as a hole rather than as a dimming, which is the
            reasoning `--sp-scrim` was defined under. */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "var(--sp-scrim)" }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none"
          style={{
            width: "480px",
            maxWidth: "92vw",
            background: "var(--sp-float)",
            border: "1px solid var(--sp-line)",
            borderRadius: "var(--sp-radius-pane)",
            boxShadow: "var(--sp-shadow-sheet)",
            padding: "var(--sp-space-6)",
          }}
        >
          <DialogPrimitive.Title
            style={{
              fontSize: "var(--sp-text-gate)",
              fontWeight: "var(--sp-weight-strong)",
              letterSpacing: "var(--sp-track-gate)",
              lineHeight: "var(--sp-leading-gate)",
              color: "var(--sp-ink)",
              margin: 0,
            }}
          >
            {hasBoth ? "Commit this to Now" : "Name the promise first"}
          </DialogPrimitive.Title>

          {/* WHICH BET, ALWAYS. The dialog is opened from four places now (a
              card, the board's unplaced line, the board's empty state and the
              station's Gate) and only one of them had the title in view when it
              opened. A ceremony that does not name what it is about is a
              confirmation, which is the thing this is not. */}
          <p
            style={{
              margin: "var(--sp-space-2) 0 0",
              fontSize: "var(--sp-text-meta)",
              color: "var(--sp-mute)",
            }}
          >
            {bet.title}
          </p>

          <div style={{ marginTop: "var(--sp-space-4)" }}>
            {hasBoth ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--sp-text-prose)",
                  lineHeight: "var(--sp-leading-body)",
                  color: "var(--sp-body)",
                }}
              >
                You are promising: {bet.outcome}. Measured by {bet.measure}.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-space-3)" }}>
                <Field label="Outcome" htmlFor={outcomeId}>
                  <Input
                    id={outcomeId}
                    autoFocus
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="What changes for the user"
                    maxLength={500}
                  />
                </Field>
                <Field label="Measure" htmlFor={measureId}>
                  <Input
                    id={measureId}
                    value={measure}
                    onChange={(e) => setMeasure(e.target.value)}
                    placeholder="How you will know"
                    maxLength={500}
                  />
                </Field>
              </div>
            )}
          </div>

          <p
            style={{
              marginTop: "var(--sp-space-3)",
              marginBottom: 0,
              fontSize: "var(--sp-text-meta)",
              color: "var(--sp-mute)",
            }}
          >
            {hasBoth
              ? "Now is the one thing the team builds next. Everything else waits."
              : "Without both halves this is a task rather than a promise, and nothing can tell you later whether it worked."}
          </p>

          <Actions>
            <Button
              variant="primary"
              disabled={!canConfirm || pending}
              title={!canConfirm ? "Both the outcome and the measure are required" : undefined}
              onClick={() => onConfirm({ outcome: outcome.trim(), measure: measure.trim() })}
            >
              {pending ? "Committing" : "Commit to Now"}
            </Button>
            <Button variant="ghost" onClick={onCancel} disabled={pending}>
              Not yet
            </Button>
          </Actions>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
