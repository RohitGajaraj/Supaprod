/**
 * THE CEREMONY. The one moment in the product where a commitment becomes a
 * promise, and the only place a bet can enter Now.
 *
 * ============================================================================
 * 2026-08-10: THE GLASS CAME OFF. 2026-08-20: REDRAWN ON MERIDIAN.
 * ============================================================================
 *
 * It was the last dialog on this station in the retired kit: `material-modal`
 * with `backdropFilter: blur(20px)` on the content AND `blur(3px)` on the
 * overlay, with `MonoLabel` shouting "OUTCOME" and "MEASURE" in letter-spaced
 * caps and a `variant="accent"` button.
 *
 * The blur is the point. The spec editor's own docblock records the ruling in as
 * many words: "The retired action bar was sticky and blurred, which is the glass
 * ban." A dialog is the one thing on screen and it does not need to prove it by
 * dissolving what is behind it; `--mrd-float` is the token for something
 * genuinely floating and `--mrd-scrim` is the token for dimming what it covers,
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
 *
 * ── WHY IT IS STILL RADIX AND NOT MERIDIAN'S `Dialog` ───────────────────
 * Meridian has a `Dialog` now, and this is deliberately not it yet. `Dialog.tsx`
 * makes the argument itself about the confirm 32 surfaces share: "swapping the
 * drawing under live surfaces is not a thing to do in the same commit as
 * introducing the part." Two things here are load bearing and would have to be
 * re-established rather than carried. Radix PORTALS, and Meridian's `Dialog`
 * deliberately does not, so adopting it makes this pane's position depend on
 * whether any ancestor of the plan board has a transform or a `container-type`
 * -- and `/plan` mounts this from two files. And `Dialog` right-aligns its
 * actions with the confirming control last, where this ceremony leads with
 * "Commit to Now"; flipping that is a composition decision, not a paint one.
 * So the vocabulary below is Meridian and the mount is unchanged.
 */
import { useId, useState } from "react";
import { Action, Actions } from "@/components/meridian/surface-parts";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Field, Input } from "@/components/meridian/forms";

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
            reasoning `--mrd-scrim` was defined under. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-mrd-scrim" />
        <DialogPrimitive.Content
          data-mrd=""
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 w-[480px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-mrd-pane border border-mrd-line bg-mrd-float p-mrd-6 font-mrd outline-none"
          style={{
            /* The deepest shadow in the system, which is what a pane floating
               over a dimmed page was measured for. `--sp-shadow-sheet` was the
               retired name for the same role. */
            boxShadow: "var(--mrd-shadow-pane)",
          }}
        >
          {/* NO LETTER-SPACING, and that is the one thing this title lost rather
              than carried. The retired kit set `--sp-track-gate` at -0.019em;
              Meridian has no negative tracking token at any size, and its own
              `PageHeading` sets none at 25px, so tightening this by hand would
              be inventing a value outside the system to keep a retired one. */}
          <DialogPrimitive.Title className="m-0 text-[20px] leading-mrd-tight font-semibold text-mrd-ink">
            {hasBoth ? "Commit this to Now" : "Name the promise first"}
          </DialogPrimitive.Title>

          {/* WHICH BET, ALWAYS. The dialog is opened from four places now (a
              card, the board's unplaced line, the board's empty state and the
              station's Gate) and only one of them had the title in view when it
              opened. A ceremony that does not name what it is about is a
              confirmation, which is the thing this is not. */}
          <p className="mt-mrd-4 mb-0 text-[13px] text-mrd-mute">{bet.title}</p>

          <div className="mt-mrd-5">
            {hasBoth ? (
              <p className="m-0 leading-mrd-prose text-mrd-prose text-mrd-body">
                You are promising: {bet.outcome}. Measured by {bet.measure}.
              </p>
            ) : (
              <div className="flex flex-col gap-mrd-5">
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

          <p className="mt-mrd-5 mb-0 text-[13px] text-mrd-mute">
            {hasBoth
              ? "Now is the one thing the team builds next. Everything else waits."
              : "Without both halves this is a task rather than a promise, and nothing can tell you later whether it worked."}
          </p>

          {/* `mt-mrd-5` IS REQUIRED HERE AND WAS MISSING. Meridian's `Actions`
              sets no outer margin on purpose, and its own docblock says the call
              sites that relied on the retired container's baked-in `mt-mrd-4`
              have to say it themselves. This one never did, so the buttons sat
              flush against the sentence above them.

              `Action variant="primary"` AND NOT `Approve`. Approve is the one
              control that RELEASES something held, and nothing is held here: the
              person opened this dialog in order to declare a promise, so the
              accent that means "a person is required" has nothing to mark. */}
          <Actions className="mt-mrd-5">
            <Action
              variant="primary"
              disabled={!canConfirm || pending}
              title={!canConfirm ? "Both the outcome and the measure are required" : undefined}
              onClick={() => onConfirm({ outcome: outcome.trim(), measure: measure.trim() })}
            >
              {pending ? "Committing" : "Commit to Now"}
            </Action>
            <Action variant="quiet" onClick={onCancel} busy={pending}>
              Not yet
            </Action>
          </Actions>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
