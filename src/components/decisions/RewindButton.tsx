// PC-10: the decision-side twin of src/components/prds/RewindButton.tsx.
// Kept as a separate small component (not a shared generic) since the two
// artifact types' detail views live in different, independently-owned
// surfaces and a shared abstraction would need to reach into both.
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          color: "var(--mrd-mute)",
          textDecoration: "underline",
          textUnderlineOffset: 2,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Rewind
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to the previous version?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores what the decision&apos;s rationale said before the last agent edit. The
              current version is kept too, so this is itself reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revert.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={revert.isPending} onClick={() => revert.mutate()}>
              {revert.isPending ? "Reverting…" : "Revert"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
