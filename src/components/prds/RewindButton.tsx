/**
 * UNDO WHAT THE CREW WROTE. The one control on the spec surface that takes an
 * agent's edit back, and it sits in the context rail under "Before the crew
 * touched it".
 *
 * It renders only when `snapshot_before` is actually set: a human-authored edit
 * never gets a rewind affordance, because capture-on-write only ever fires for
 * an agent and there would be nothing to revert to.
 *
 * ============================================================================
 * 2026-08-10: THE LAST TOAST ON THE SPEC SURFACE, AND THE LAST RETIRED TOKEN.
 * ============================================================================
 *
 * Three things were wrong and all three were invisible from the route that
 * mounts it, which is how a component in a folder nobody opens keeps its own
 * design system.
 *
 *   1. IT FIRED A TOAST. The spec editor's own docblock records the ruling it
 *      was written under: "KILL every toast on this surface. Eight of them." Its
 *      eight went; this one, one import away in another file, did not. And of
 *      everything on this page it is the LEAST suited to a toast: a rewind is a
 *      judgment that undoes an agent's work, which is the exact act the receipt
 *      primitive exists for. It reports through the page's own `commit` now, so
 *      what it caused lands in "What you did here" beside every other act.
 *   2. IT SAID "PRD" TO A PERSON. "This restores what the PRD said before the
 *      last agent edit." The schema word is `prds` and stays; the user-facing
 *      word is "spec" (CLAUDE.md's rename-disclaimer pattern), and this dialog
 *      was the place the internal one leaked.
 *   3. IT WAS DRAWN IN `--ink-subtle` AND THE SHADCN ALERT DIALOG, so a confirm
 *      opened from a rail drawn in `--sp-*` arrived in a second vocabulary. It
 *      is the same Radix primitive underneath, so the semantics (focus trap,
 *      Escape, the cancel/action pair) are unchanged and only the skin moved.
 *
 * ============================================================================
 * 2026-09-10: AND THAT PORT BECAME DEBT THAT LOOKED LIKE PROGRESS.
 * ============================================================================
 *
 * The 08-10 pass above moved off `components/ui` by importing raw
 * `@radix-ui/react-alert-dialog` and hand-drawing the overlay, the panel, the
 * title stop and the pad in Meridian tokens. That was the only thing available:
 * **Meridian shipped its Dialog on 2026-08-20, ten days later.**
 *
 * WHAT MADE IT INVISIBLE. Every marker the ratchet counts names a LINEAGE --
 * `class:sp-`, `import:components/ui`, `usage:components/ui`, `raw-colour`.
 * This file carried none of them, so it read as fully migrated while being the
 * only hand-rolled modal left in the product. **A third way is invisible to
 * every guard that watches the first two.** It was found by census rather than
 * by any check: one grep for `@radix-ui` outside `components/ui` returned this
 * file and nothing else.
 *
 * Its twin, `decisions/RewindButton.tsx`, moved to Meridian's Dialog earlier
 * today, which left two files described in their own headers as twins wearing
 * different faces. That is the thing this pass closes.
 *
 * WHAT IS GIVEN UP, NAMED RATHER THAN LOST. The block below used to argue for a
 * 19px/600 title on 1.32 at 440px, tuned as a set against 14px prose. Meridian's
 * Dialog uses `mrd-title` at 420px, and four other surfaces already wear it.
 * **A face that is right once and shared nowhere is a fork**, and the reason the
 * old note gave -- that Meridian bridged neither stop -- expired with the part.
 *
 * WHAT THE SUCCESS LINE IS ALLOWED TO CLAIM, unchanged from the toast it
 * replaces because that sentence had already been corrected once and the
 * reasoning holds: `revertPrdToPrevious` ALWAYS restores `body_md` and
 * re-captures the just-current body as the next snapshot, so "you can rewind
 * back" is unconditionally true. The track-record row is NOT: the function only
 * inserts into `agent_approvals` when an `artifact_lineage` edge names a
 * `created_by_agent`, and that edge is cleared by the first rewind, so a second
 * rewind and any spec with no agent edge files nothing. Older copy promised that
 * row every time.
 */
import { useState } from "react";
import { failureLine } from "@/lib/error-copy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog } from "@/components/meridian/Dialog";
import { Action, Actions } from "@/components/meridian/surface-parts";
import { revertPrdToPrevious } from "@/lib/artifact-rewind.functions";

export interface RewindButtonProps {
  prdId: string;
  /** True once the spec actually has a snapshot to revert to. */
  hasSnapshot: boolean;
  /**
   * Where the consequence goes. Required, and required on purpose: this control
   * used to speak for itself in a toast, and a component that reports its own
   * outcome in its own idiom is how one station ends up with two. The page owns
   * the receipt stack; this hands it a verb and a consequence.
   */
  onCommit: (verb: string, consequence: string, failed?: boolean) => void;
  onReverted?: () => void;
}

export function RewindButton({ prdId, hasSnapshot, onCommit, onReverted }: RewindButtonProps) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const fRevert = useServerFn(revertPrdToPrevious);

  const revert = useMutation({
    mutationFn: () => fRevert({ data: { prd_id: prdId } }),
    onSuccess: () => {
      onCommit(
        "You took the crew's edit back",
        "The spec reads as it did before the last agent edit. The version you just replaced is kept, so this is itself reversible.",
      );
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["prd", prdId] });
      onReverted?.();
    },
    onError: (e: Error) =>
      onCommit("Nothing was taken back", failureLine("The spec is unchanged.", e), true),
  });

  if (!hasSnapshot) return null;

  return (
    <>
      {/* MERIDIAN'S `Door` PAINT ON A RAW BUTTON, AND THE RAW BUTTON IS THE
          POINT. This sits mid-sentence in the context rail, so it wants the
          door's shape -- inherited size, dotted underline going solid on hover
          -- and not `Action`'s 32px control box, which would tower over the
          12px prose around it.

          It is not the `Door` COMPONENT because `Door` accepts a closed prop
          list and spreads no rest, so it has nowhere to put an `onClick`.
          Convert it the day `Door` spreads its rest props, not before. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-mrd-xs text-mrd-prose text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        Rewind
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Take the crew's edit back?"
        actions={
          // The way out FIRST and the confirming action LAST. Meridian's Dialog
          // right-aligns this row and owns that rule, which is the other thing
          // the hand-rolled version got to decide for itself: the old markup put
          // the confirming action first in DOM order and relied on the caller to
          // keep it there.
          <Actions>
            <Action variant="quiet" onClick={() => setOpen(false)} disabled={revert.isPending}>
              Keep it as it is
            </Action>
            <Action
              variant="primary"
              // `busy` and not `disabled`, which the hand-rolled version already
              // had right on this control and wrong on its neighbour.
              busy={revert.isPending}
              // The dialog closes on its own success rather than on the press,
              // so a refused revert leaves the confirm on screen with the receipt
              // behind it rather than dismissing over a write that did not happen.
              onClick={() => revert.mutate()}
            >
              {revert.isPending ? "Taking it back" : "Take it back"}
            </Action>
          </Actions>
        }
      >
        This restores what the spec said before the last agent edit. The version on screen is kept
        too, so this is itself reversible.
      </Dialog>
    </>
  );
}
