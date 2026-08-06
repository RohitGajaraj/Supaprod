// W5b: the no-repo gate dialog. When an act that needs a repo cannot resolve
// one (canDispatchToRepo says no, or the act itself throws resolveGitHub's
// not-connected refusal), this small choice replaces the raw error toast with
// the two real paths: connect an existing repo on /sync, or provision a
// private starter repo for the spec - after which the interrupted act retries
// automatically and the created repo URL shows in the success toast. Reuses
// the stock AlertDialog primitives (same idiom as the Build list's delete
// confirm); no bespoke styling.
//
// IT NARRATES THE ACT IT INTERRUPTED, WHICH IS NO LONGER ALWAYS THE DISPATCH.
// Three callers mount this. Two of them (ReadyToBuild, /runs) are dispatches
// and always were. The spec page's `createIssue` opens the same gate, because
// it goes through the same `resolveGitHub`, and its `onRetry` opens the issue
// rather than sending a build. Every sentence in here said "dispatch" and the
// success toast said "Build dispatched on the fresh repo", so provisioning
// from the issue door told the person a build had started that nobody asked
// for and that no code had started. `act` is what fixes that. It defaults to
// "dispatch", so the two dispatch callers render exactly the words they
// rendered before, character for character.
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

/** Which act hit the gate, and therefore which act `onRetry` re-runs. */
export type RepoGateAct = "dispatch" | "issue";

export interface RepoGateDialogProps {
  open: boolean;
  /** The spec being dispatched; null hides the provision path (nothing to provision from). */
  prdId: string | null;
  /** The resolver's own words on why no repo resolved (shown as the description). */
  reason: string | null;
  onOpenChange: (open: boolean) => void;
  /** Re-run the exact act the gate interrupted (fires after provisioning succeeds). */
  onRetry: () => void;
  /**
   * What `onRetry` will actually do. The dialog's own sentences are written
   * from this, so it must match the caller's retry branch: passing "dispatch"
   * while retrying the issue door is the defect this prop exists to prevent.
   */
  act?: RepoGateAct;
}

export function RepoGateDialog({
  open,
  prdId,
  reason,
  onOpenChange,
  onRetry,
  act = "dispatch",
}: RepoGateDialogProps) {
  const navigate = useNavigate();
  const fProvision = useServerFn(provisionRepoForSpec);
  const isIssue = act === "issue";

  const provision = useMutation({
    mutationFn: () => provisionThenRetry(() => fProvision({ data: { prdId: prdId! } }), onRetry),
    onSuccess: (repo) => {
      // `provisionThenRetry` awaits `onRetry`, and both callers' retries are
      // fire-and-forget `mutate` calls, so what is true at this moment is that
      // the act has been started, not that it has landed. The issue path says
      // so; the dispatch wording is left exactly as it was.
      toast.success(
        `Starter repo created: ${repo.htmlUrl}. ${
          isIssue
            ? "The issue is being opened on the fresh repo."
            : "Build dispatched on the fresh repo."
        }`,
      );
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isIssue ? "No repo to open the issue on" : "No repo to build in"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {reason ??
              (isIssue
                ? "The issue could not resolve a repo for this workspace."
                : "Build could not resolve a repo for this workspace.")}{" "}
            {prdId
              ? isIssue
                ? "Connect an existing repo, or provision a private starter repo and the issue opens on it automatically."
                : "Connect an existing repo, or provision a private starter repo and the dispatch retries automatically."
              : isIssue
                ? "Connect an existing repo, then open the issue again."
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
