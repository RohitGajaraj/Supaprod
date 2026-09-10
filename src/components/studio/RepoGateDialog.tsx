// W5b: the no-repo gate dialog. When an act that needs a repo cannot resolve
// one (canDispatchToRepo says no, or the act itself throws resolveGitHub's
// not-connected refusal), this small choice replaces the raw error toast with
// the two real paths: connect an existing repo on /sources, or provision a
// private starter repo for the spec - after which the interrupted act retries
// automatically and the created repo URL shows in the success toast.
//
// IT NARRATES THE ACT IT INTERRUPTED, WHICH IS NO LONGER ALWAYS THE DISPATCH.
// The spec page's `createIssue` opens the same gate, because it goes through
// the same `resolveGitHub`, and its `onRetry` opens the issue rather than
// sending a build. Every sentence in here said "dispatch" and the success toast
// said "Build dispatched on the fresh repo", so provisioning from the issue
// door told the person a build had started that nobody asked for and that no
// code had started. `act` is what fixes that. It defaults to "dispatch", so the
// dispatch wording is exactly what it was, character for character.
//
// ══════════════════════════════════════════════════════════════════════════
// PORTED TO MERIDIAN ON 2026-09-10, REVERSING THIS FILE'S OWN WRITTEN REFUSAL,
// AND THE REFUSAL IS QUOTED HERE RATHER THAN DELETED BECAUSE IT WAS RIGHT WHEN
// IT WAS WRITTEN AND THE THING THAT CHANGED IS A FACT, NOT AN OPINION.
//
// The 2026-08-18 block said, in capitals: "MERIDIAN HAS NO DIALOG", and refused
// the port on the strength of it. Rebuilding this one modal by hand -- on a
// native `<dialog>` with `showModal`, the only honest way to get an overlay
// without an overlay primitive -- would have given it focus behaviour that
// matched nothing else in the product, and "re-implementing a focus trap badly
// is an accessibility regression wearing a primitive's name" is `use-confirm`'s
// ruling and it still holds.
//
// TWO DAYS LATER MERIDIAN SHIPPED A DIALOG, and it ships the exact contract the
// refusal was protecting: focus moves in on open, cannot leave while it is
// open, and RETURNS TO WHATEVER OPENED IT on close, plus Escape, the scrim and
// the body-scroll lock. So the port is no longer a hand-roll, and the refusal's
// own stated expiry -- "the debt stays whole and legible until Meridian ships a
// dialog" -- has arrived. `ConnectTrustDialog`, `CreateRepoModal` and
// `RailPhoneBar` are already on it; this is the fourth, not the first.
//
// TWO CORRECTIONS TO WHAT THE OLD BLOCK ASSERTED, both measured today:
//
//   1. IT IS MOUNTED ONCE, NOT THREE TIMES. The block named ReadyToBuild, /runs
//      and the spec page. Only `_authenticated.plan.spec.$id.tsx` mounts it now;
//      the other two stopped and nobody came back to the comment. The argument
//      that moving it alone would strand a widely-shared modal was already
//      resting on a count that had stopped being true.
//
//   2. THE OTHER HALF OF THE EXIT CONDITION IS NOT DONE AND I AM NOT CLAIMING
//      IT. The block said this file and `hooks/use-confirm.tsx` "move together
//      in one commit". `use-confirm` is the confirm that 32 surfaces share, and
//      swapping the drawing under 32 live surfaces is not a components pass --
//      Meridian's own Dialog says so in its header. So that stays open, and it
//      stays open in the queue rather than only here.
//
// WHAT CHANGED BEHAVIOURALLY, stated because a port that claims to change
// nothing should be checked against the one place it does. Radix's AlertDialog
// blocks dismissal by clicking outside; Meridian's Dialog closes on the scrim.
// Clicking the scrim mid-provision therefore closes this where it used to not.
// Nothing is lost when it does: `provisionThenRetry` is already running, the
// retry still fires, and the toast still reports the repo URL and the act -- the
// dialog was never the thing carrying the result. Escape behaved this way under
// Radix too.
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog } from "@/components/meridian/Dialog";
import { Action, Actions } from "@/components/meridian/surface-parts";
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
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={isIssue ? "No repo to open the issue on" : "No repo to build in"}
      actions={
        // The way out first and the confirming action last: Meridian's Dialog
        // right-aligns this row, and the provision path is the one that finishes
        // what the person came to do.
        <Actions>
          {/* Radix's Cancel closed the dialog for us; Meridian's Dialog never
              closes itself on a decision, so the way out says so out loud. */}
          <Action
            variant="quiet"
            onClick={() => onOpenChange(false)}
            disabled={provision.isPending}
          >
            Not now
          </Action>
          <Action
            // One primary CTA per view: when the provision path is also offered
            // it is the primary (it auto-retries the act), so Connect steps down.
            // With nothing to provision from, Connect IS the way forward.
            variant={prdId ? "default" : "primary"}
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/sources" });
            }}
            disabled={provision.isPending}
          >
            Connect a repo
          </Action>
          {prdId ? (
            <Action
              variant="primary"
              // `busy` rather than `disabled`: the old control was disabled for
              // the whole round trip, so a screen reader heard "unavailable"
              // where the truth was "working on it".
              busy={provision.isPending}
              // No `preventDefault` any more. It existed only to stop Radix
              // closing the dialog on click; nothing closes it here but the
              // mutation settling.
              onClick={() => provision.mutate()}
            >
              {provision.isPending ? "Provisioning…" : "Provision a starter repo"}
            </Action>
          ) : null}
        </Actions>
      }
    >
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
    </Dialog>
  );
}
