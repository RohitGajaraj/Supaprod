/**
 * HOSTING. What this product has put in your Deno account, and what it is for.
 *
 * ── WHY THIS SURFACE EXISTS (P-118, P-118b) ──────────────────────────────
 * On 2026-09-04 a merged release could not get a preview: ten of ten app slots
 * used, every one a July preview shell for a changeset that had long since
 * merged. Nothing had ever reclaimed one, and nothing had ever SHOWN one. The
 * account filled up silently and the wall it produced arrived as an unrelated
 * deploy failure.
 *
 * ── NOTHING HERE RUNS ON ITS OWN, AND THAT IS THE DESIGN ─────────────────
 * A sweep could compute these verdicts and act on them. It should not. A slot
 * is cheap, a deleted preview is not recoverable, and the account is the
 * founder's rather than the product's. So the product does the reading -- which
 * of these are certainly finished with, and what holds each of the rest -- and
 * a person does the deleting, one row at a time, having seen the reason.
 *
 * ── AND IT SAYS WHAT IT CANNOT SEE ───────────────────────────────────────
 * The list is built from our own record, so it covers every app this product
 * created and nothing else. An account may hold apps somebody else made, and
 * this must never offer to delete one -- listing the org would put those on the
 * same screen behind the same button, told apart only by a rule this code wrote
 * about somebody else's names. The limit is stated on the surface rather than
 * left for a person to discover by not finding something.
 */
import { Row } from "@/components/meridian/rows";
import {
  Action,
  NothingYet,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";
import { listHostedApps, reclaimOneApp } from "@/lib/hosting/hosting.functions";

export function HostingSection({ workspaceId }: { workspaceId?: string | null }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fList = useServerFn(listHostedApps);
  const fReclaim = useServerFn(reclaimOneApp);

  const house = useQuery({
    queryKey: ["hosted-apps", workspaceId],
    queryFn: () => fList({ data: { workspaceId: workspaceId ?? null } }),
    enabled: !!workspaceId,
  });

  const reclaim = useMutation({
    mutationFn: (changesetId: string) =>
      fReclaim({ data: { workspaceId: workspaceId as string, changesetId } }),
    onSuccess: (res) => {
      /*
       * THE SERVER'S ANSWER IS THE ONE REPORTED, including when it refused.
       * It re-derives the verdict rather than trusting the row this button was
       * drawn from, so a refusal here is the product declining to delete
       * something and a person is owed the reason it gave.
       */
      if (res.ok) toast.success(res.reason);
      else toast.error(res.reason);
      void qc.invalidateQueries({ queryKey: ["hosted-apps", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apps = house.data?.apps ?? [];
  const reclaimable = apps.filter((a) => a.verdict.reclaim);

  /* The repo's destructive shape: the object is named in the title, the
     consequence is second person and immediate, and what cannot be walked back
     is last. It IS irreversible here, and says so, unlike removing a member. */
  const askFirst = async (slug: string): Promise<boolean> =>
    confirm({
      title: `Delete the preview app ${slug}?`,
      body: "Its address stops answering the moment you confirm, and the app cannot be brought back. The change itself, its pull request and its release notes are untouched. A new preview for this change would get a new app.",
      confirmLabel: "Delete it",
      destructive: true,
    });

  return (
    <Region
      title="Hosting"
      sub={
        house.isSuccess && house.data.known
          ? /* `houseLine` says whose count this is and where the account's own
               lives (P-118c). It said it here too, and two sentences agreeing a
               line apart is the defect this repo keeps paying for -- a reader
               cannot tell which one is the surface's own claim. One writer. */
            `${house.data.line} Each preview holds a slot.`
          : undefined
      }
    >
      {house.isLoading ? (
        <Reading>Reading what this workspace has hosted.</Reading>
      ) : house.isError ? (
        <ReadFailedLine onRetry={() => void house.refetch()} error={house.error}>
          The hosted previews did not load.
        </ReadFailedLine>
      ) : !house.data?.known ? (
        <ReadFailedLine onRetry={() => void house.refetch()}>
          What this workspace has hosted could not be read, so nothing is listed. Nothing has been
          changed.
        </ReadFailedLine>
      ) : apps.length === 0 ? (
        <NothingYet>
          Nothing has been hosted for this workspace yet. A preview app is created the first time a
          change is built here.
        </NothingYet>
      ) : (
        apps.map((a) => (
          <Row
            key={a.slug}
            tight
            lead={a.title?.trim() || a.slug}
            /* The holding reason, always. "9 apps, all in use" is not something
               a person can act on; "its change is still open" is. */
            sub={`${a.slug} · ${a.verdict.because}`}
            action={
              a.verdict.reclaim ? (
                <Action
                  variant="quiet"
                  busy={reclaim.isPending}
                  disabled={reclaim.isPending}
                  onClick={() => {
                    void (async () => {
                      if (await askFirst(a.slug)) reclaim.mutate(a.changesetId as string);
                    })();
                  }}
                >
                  Reclaim it
                </Action>
              ) : undefined
            }
          />
        ))
      )}

      {reclaimable.length === 0 && apps.length > 0 ? (
        <Row lead="Nothing here can be reclaimed. Every app is holding something." />
      ) : null}
    </Region>
  );
}

export default HostingSection;
