// PC-10: the decision-side twin of src/components/prds/RewindButton.tsx.
// Kept as a separate small component (not a shared generic) since the two
// artifact types' detail views live in different, independently-owned
// surfaces and a shared abstraction would need to reach into both.
//
// ── ON MERIDIAN'S DIALOG SINCE 2026-09-10, AND THE TWIN IS NOT ──────────────
// The twin was ported on 2026-08-10, ten days before Meridian shipped a Dialog,
// so it did the only thing available then: raw `@radix-ui/react-alert-dialog`
// with the panel, the overlay, the title stop and the pad all drawn by hand.
// That was right in August and it is now a hand-rolled copy of a part the system
// owns -- and INVISIBLE debt, because carrying no `components/ui` import means
// the ratchet cannot count it. Named here rather than quietly widened into this
// packet; it is one file and it wants its own pass.
//
// The two are twins in FUNCTION and were never twins in appearance: this one
// reports through `toast`, the twin reports through the spec surface's `commit`
// receipts under a ruling that killed every toast on that surface and not on
// this one, and their copy differs sentence for sentence. So porting one first
// separates nothing that was joined.
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog } from "@/components/meridian/Dialog";
import { Action, Actions } from "@/components/meridian/surface-parts";
import { toast } from "@/lib/notify";
import { revertDecisionToPrevious } from "@/lib/artifact-rewind.functions";

export interface RewindButtonProps {
  decisionId: string;
  hasSnapshot: boolean;
  onReverted?: () => void;
}

export function RewindButton({ decisionId, hasSnapshot, onReverted }: RewindButtonProps) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const fRevert = useServerFn(revertDecisionToPrevious);

  const revert = useMutation({
    mutationFn: () => fRevert({ data: { decision_id: decisionId } }),
    onSuccess: () => {
      // Says only what the server definitely did, same as the PRD twin.
      // revertDecisionToPrevious always restores rationale and re-captures the
      // just-current one as the next snapshot, so "you can rewind back" holds
      // on every path. The track record row does not: it is written only when
      // decisions.decided_by_agent_slug is set, and the same update clears that
      // column — so a human-made decision and any second rewind file nothing.
      toast.success(
        "Reverted to the previous version. The current one is kept, so you can rewind back.",
      );
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["decision", decisionId] });
      onReverted?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!hasSnapshot) return null;

  return (
    <>
      {/* MERIDIAN'S DOOR PAINT ON A RAW BUTTON, which is what the twin settled
          on and for the reason it wrote down: this sits mid-sentence in prose,
          so it wants the door's inherited size and dotted underline rather than
          `Action`'s 32px control box towering over the copy around it. The
          inline style object it replaces said the same thing in five
          declarations, one of which (`var(--mrd-mute)`) was the only token in
          it; the rest were re-stating what a class already knows. */}
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
        title="Revert to the previous version?"
        actions={
          // The way out first, the confirming action last. Meridian's Dialog
          // right-aligns the row, so last is rightmost.
          <Actions>
            <Action variant="quiet" onClick={() => setOpen(false)} disabled={revert.isPending}>
              Cancel
            </Action>
            <Action
              variant="primary"
              // `busy`, not `disabled`: a screen reader hears "working on it"
              // rather than "unavailable" for the length of the write.
              busy={revert.isPending}
              // The dialog closes on its own SUCCESS and not on the press, so a
              // refused revert leaves the question on screen with the error
              // beside it rather than dismissing over a write that never landed.
              onClick={() => revert.mutate()}
            >
              {revert.isPending ? "Reverting…" : "Revert"}
            </Action>
          </Actions>
        }
      >
        This restores what the decision&apos;s rationale said before the last agent edit. The
        current version is kept too, so this is itself reversible.
      </Dialog>
    </>
  );
}
