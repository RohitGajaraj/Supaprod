// PC-10: the byline + confirm sheet for reverting an agent-touched PRD to
// its previous body. Only renders when snapshot_before is actually set --
// a human-authored edit never gets a rewind affordance, since there is
// nothing to revert to (capture-on-write only ever fires for an agent).
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
import { revertPrdToPrevious } from "@/lib/artifact-rewind.functions";

export interface RewindButtonProps {
  prdId: string;
  /** True once the PRD actually has a snapshot to revert to. */
  hasSnapshot: boolean;
  onReverted?: () => void;
}

export function RewindButton({ prdId, hasSnapshot, onReverted }: RewindButtonProps) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const fRevert = useServerFn(revertPrdToPrevious);

  const revert = useMutation({
    mutationFn: () => fRevert({ data: { prd_id: prdId } }),
    onSuccess: () => {
      // Says only what the server definitely did. revertPrdToPrevious always
      // restores body_md and re-captures the just-current body as the next
      // snapshot, so "you can rewind back" is unconditionally true. The track
      // record row is NOT: artifact-rewind.functions.ts only inserts into
      // agent_approvals when an artifact_lineage edge names a created_by_agent,
      // and that edge is cleared by the first rewind — so a second rewind, and
      // any PRD with no agent edge, files nothing. The old copy promised that
      // row every time.
      toast.success(
        "Reverted to the previous version. The current one is kept, so you can rewind back.",
      );
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["prd", prdId] });
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
          color: "var(--ink-subtle)",
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
              This restores what the PRD said before the last agent edit. The current version is
              kept too, so this is itself reversible.
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
