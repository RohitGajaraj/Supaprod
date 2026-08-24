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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
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
      onCommit("Nothing was taken back", `The spec is unchanged. ${e.message}`, true),
  });

  if (!hasSnapshot) return null;

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        {/* MERIDIAN'S `Door` PAINT ON A RAW BUTTON, AND THE RAW BUTTON IS THE
            POINT. This sits mid-sentence in the context rail, so it wants the
            door's shape — inherited size, dotted underline going solid on hover
            — and not `Action`'s 32px control box, which would tower over the
            12px prose around it.

            It is not the `Door` COMPONENT because `AlertDialog.Trigger asChild`
            clones its child with a ref and its own props, and `Door` accepts a
            closed prop list and spreads no rest, so the ref and the dialog's
            state attributes would be dropped on the floor. A DOM element
            forwards both natively. Convert it the day `Door` spreads its rest
            props, not before. */}
        <button
          type="button"
          className="rounded-mrd-xs text-mrd-prose text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          Rewind
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        {/* Dimmed, not blurred. The glass ban is this surface's own ruling. */}
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-mrd-scrim" />
        {/* THE TITLE STOP IS THE RETIRED ONE, DELIBERATELY. 19px on 1.32 with
            the gate's tracking over 14px prose underneath, 24px of pad, 440px
            wide. Meridian bridges the weight exactly (--mrd-w-semi is 600 -
            nothing rounds) but has no 19px type stop, and this dialog's title
            was tuned as part of a set; the ratchet law makes today's design
            the floor, so the one unbridged literal stays until someone
            re-tunes the set on purpose. */}

        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-mrd-pane border border-mrd-line bg-mrd-float p-mrd-6 shadow-mrd-pane outline-none">
          <AlertDialog.Title
            className="m-0 text-[19px] leading-[1.32] font-mrd-semi text-mrd-ink"
            style={{ letterSpacing: "-0.019em" }}
          >
            Take the crew's edit back?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-[12px] mb-0 leading-[1.55] text-mrd-prose text-mrd-body">
            This restores what the spec said before the last agent edit. The version on screen is
            kept too, so this is itself reversible.
          </AlertDialog.Description>
          {/* `Actions` SETS NO OUTER MARGIN, deliberately, so the space above
              the row is stated here rather than baked into the component. */}
          <Actions className="mt-mrd-5">
            <AlertDialog.Action asChild>
              <Action
                variant="primary"
                busy={revert.isPending}
                onClick={(e) => {
                  // The dialog closes on its own success rather than on the
                  // press, so a refused revert leaves the confirm on screen with
                  // the receipt behind it rather than dismissing over a write
                  // that did not happen.
                  e.preventDefault();
                  revert.mutate();
                }}
              >
                {revert.isPending ? "Taking it back" : "Take it back"}
              </Action>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Action variant="quiet" busy={revert.isPending}>
                Keep it as it is
              </Action>
            </AlertDialog.Cancel>
          </Actions>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
