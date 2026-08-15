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
        {/* `.sp-block-more` is the system's quiet action, and it already carries
            its own hover, focus-visible and disabled states. The hand-rolled
            underline this replaces carried none of them. */}
        <button type="button" className="sp-block-more">
          Rewind
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        {/* Dimmed, not blurred. The glass ban is this surface's own ruling. */}
        <AlertDialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "var(--sp-scrim)" }}
        />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none"
          style={{
            width: "440px",
            maxWidth: "92vw",
            background: "var(--sp-float)",
            border: "1px solid var(--sp-line)",
            borderRadius: "var(--sp-radius-pane)",
            boxShadow: "var(--sp-shadow-sheet)",
            padding: "var(--sp-space-6)",
          }}
        >
          <AlertDialog.Title
            style={{
              fontSize: "var(--sp-text-gate)",
              fontWeight: "var(--sp-weight-strong)",
              letterSpacing: "var(--sp-track-gate)",
              lineHeight: "var(--sp-leading-gate)",
              color: "var(--sp-ink)",
              margin: 0,
            }}
          >
            Take the crew's edit back?
          </AlertDialog.Title>
          <AlertDialog.Description
            style={{
              margin: "var(--sp-space-3) 0 0",
              fontSize: "var(--sp-text-prose)",
              lineHeight: "var(--sp-leading-body)",
              color: "var(--sp-body)",
            }}
          >
            This restores what the spec said before the last agent edit. The version on screen is
            kept too, so this is itself reversible.
          </AlertDialog.Description>
          <Actions>
            <AlertDialog.Action asChild>
              <Action
                variant="primary"
                disabled={revert.isPending}
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
              <Action variant="quiet" disabled={revert.isPending}>
                Keep it as it is
              </Action>
            </AlertDialog.Cancel>
          </Actions>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
