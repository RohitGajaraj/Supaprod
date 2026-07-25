// W5b: the new-build dispatch gate dialog. When a Build dispatch cannot
// resolve a repo (canDispatchToRepo says no, or the dispatch itself throws
// resolveGitHub's not-connected refusal), this small choice replaces the raw
// error toast with the two real paths: connect an existing repo on /sync, or
// provision a private starter repo for the spec - after which the interrupted
// dispatch retries automatically and the created repo URL shows in the
// success toast. Reuses the stock AlertDialog primitives (same idiom as the
// Build list's delete confirm); no bespoke styling.
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
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
import { buttonVariants } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import { provisionRepoForSpec } from "@/lib/new-build.functions";
import { provisionThenRetry } from "@/lib/build/repo-gate";

export interface RepoGateDialogProps {
  open: boolean;
  /** The spec being dispatched; null hides the provision path (nothing to provision from). */
  prdId: string | null;
  /** The resolver's own words on why no repo resolved (shown as the description). */
  reason: string | null;
  onOpenChange: (open: boolean) => void;
  /** Re-run the exact dispatch the gate interrupted (fires after provisioning succeeds). */
  onRetry: () => void;
}

export function RepoGateDialog({
  open,
  prdId,
  reason,
  onOpenChange,
  onRetry,
}: RepoGateDialogProps) {
  const navigate = useNavigate();
  const fProvision = useServerFn(provisionRepoForSpec);

  const provision = useMutation({
    mutationFn: () => provisionThenRetry(() => fProvision({ data: { prdId: prdId! } }), onRetry),
    onSuccess: (repo) => {
      toast.success(`Starter repo created: ${repo.htmlUrl}. Build dispatched on the fresh repo.`);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>No repo to build in</AlertDialogTitle>
          <AlertDialogDescription>
            {reason ?? "Build could not resolve a repo for this workspace."}{" "}
            {prdId
              ? "Connect an existing repo, or provision a private starter repo and the dispatch retries automatically."
              : "Connect an existing repo, then dispatch again."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={provision.isPending}>Not now</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/sync" });
            }}
            disabled={provision.isPending}
            // One primary CTA per view: when the provision path is also
            // offered it is the primary (it auto-retries the dispatch), so
            // Connect steps down to the outline treatment.
            className={prdId ? buttonVariants({ variant: "outline" }) : undefined}
          >
            Connect a repo
          </AlertDialogAction>
          {prdId ? (
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog open while provisioning runs; it closes
                // itself (or errors in place) when the mutation settles.
                e.preventDefault();
                provision.mutate();
              }}
              disabled={provision.isPending}
            >
              {provision.isPending ? "Provisioning…" : "Provision a starter repo"}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
