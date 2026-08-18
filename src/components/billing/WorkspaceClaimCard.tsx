/**
 * Bring your work with you: the claim surface.
 *
 * TWO HALVES, and both are required for the feature to mean anything.
 *
 * The person's half answers "I have a year of work in my own account and my
 * company just bought Business. How do I make it the company's?" It shows the
 * inventory FIRST, because a person cannot consent to handing over something
 * that has not been named, then takes one deliberate acknowledgement, then
 * offers. Nothing moves at that point: an offer is an intention with a deadline.
 *
 * The organisation's half answers "prove what they knew and why they chose it".
 * An owner or admin sees offers waiting on them, what each one contains, what
 * the organisation already holds and on whose act, and the trail of everything
 * that was ever declined or released. Without this the claim would move data and
 * leave no institutional trace, which is the invisibility problem it exists to
 * fix.
 *
 * Engine-Room: workspace_audit_log claim events + the account re-parent ->
 * shown in Settings > Plan as "Bring your work with you" -> a person hands their
 * accumulated workspace to their organisation, and an admin can see it happen.
 */
import { useState } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";
import { Actions, Block, Button, Checkbox, Empty, Failed, Line, Loading, Value } from "@/components/shell/primitives";
import {
  CLAIM_OFFER_TTL_DAYS,
  CLAIM_RELEASE_GRACE_DAYS,
  daysLeft,
  inventoryLines,
  inventoryTotal,
  type ClaimInventory,
} from "@/lib/workspace-claim";
import {
  getWorkspaceClaimState,
  listAccountClaims,
  listClaimDestinations,
  offerWorkspaceClaim,
  previewWorkspaceClaim,
  releaseWorkspaceClaim,
  respondToWorkspaceClaim,
  withdrawWorkspaceClaim,
  type AccountClaimRow,
} from "@/lib/workspace-claim.functions";

const PLAN_NAME: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  max: "Max",
  team: "Business",
  enterprise: "Enterprise",
};

function planName(tier: string): string {
  return PLAN_NAME[tier] ?? tier;
}

function onDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function personLabel(name: string | null, email: string | null, id: string | null): string {
  return name?.trim() || email?.trim() || (id ? `${id.slice(0, 8)}` : "Someone");
}

const ACTION_WORD: Record<string, string> = {
  workspace_claim_offered: "Offered",
  workspace_claim_withdrawn: "Withdrawn",
  workspace_claim_declined: "Declined",
  workspace_claim_accepted: "Accepted",
  workspace_claim_released: "Released",
};

/** The inventory, said out loud. Never collapsed to a single number on its own:
 *  "309 things" is not something a person can weigh, and the split between what
 *  becomes readable and what stays private is the whole consent question. */
function Inventory({ inv }: { inv: ClaimInventory }) {
  return (
    <>
      {inventoryLines(inv).map((l) => (
        <Line key={l.label} label={l.label}>
          <Num>{l.count}</Num>
        </Line>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The person's half
 * ------------------------------------------------------------------ */

function YourClaim({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const nowIso = new Date().toISOString();

  const fState = useServerFn(getWorkspaceClaimState);
  const fDestinations = useServerFn(listClaimDestinations);
  const fPreview = useServerFn(previewWorkspaceClaim);
  const fOffer = useServerFn(offerWorkspaceClaim);
  const fWithdraw = useServerFn(withdrawWorkspaceClaim);
  const fRelease = useServerFn(releaseWorkspaceClaim);

  const [destinationId, setDestinationId] = useState<string>("");
  const [acknowledged, setAcknowledged] = useState(false);

  const state = useQuery({
    queryKey: ["workspace-claim", workspaceId],
    queryFn: () => fState({ data: { workspaceId } }),
  });
  const destinations = useQuery({
    queryKey: ["workspace-claim-destinations", workspaceId],
    queryFn: () => fDestinations({ data: { workspaceId } }),
  });
  const preview = useQuery({
    queryKey: ["workspace-claim-preview", workspaceId, destinationId],
    queryFn: () =>
      fPreview({ data: { workspaceId, destinationWorkspaceId: destinationId || null } }),
  });

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["workspace-claim"] });
    void qc.invalidateQueries({ queryKey: ["workspace-claim-preview"] });
    void qc.invalidateQueries({ queryKey: ["account-claims"] });
    void qc.invalidateQueries({ queryKey: ["billing"] });
    void qc.invalidateQueries({ queryKey: ["workspaces"] });
  }

  const offer = useMutation({
    mutationFn: () =>
      fOffer({
        data: { workspaceId, destinationWorkspaceId: destinationId, acknowledged: true },
      }),
    onSuccess: () => {
      setAcknowledged(false);
      refresh();
      toast.success("Offered. Nothing has moved yet: an admin there has to accept it.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const withdraw = useMutation({
    mutationFn: () => fWithdraw({ data: { workspaceId } }),
    onSuccess: () => {
      refresh();
      toast.success("Offer withdrawn.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const release = useMutation({
    mutationFn: () => fRelease({ data: { workspaceId } }),
    onSuccess: () => {
      refresh();
      toast.success("Released. The workspace is back on your own plan.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (state.isLoading) return <Loading>Reading where this workspace belongs.</Loading>;
  if (state.isError) {
    return (
      <Failed onRetry={() => void state.refetch()}>
        We could not read whether this workspace has been claimed.{" "}
        {(state.error as Error)?.message ?? ""}
      </Failed>
    );
  }

  const view = state.data;
  if (!view) return null;
  const phase = view.state.phase;

  // Already claimed: say who holds it, when, and what can still be undone.
  if (phase === "claimed" && view.state.claim) {
    const claim = view.state.claim;
    const graceLeft = daysLeft(claim.graceUntil, nowIso);
    return (
      <>
        <Line
          label="This workspace belongs to the organisation"
          sub={`Claimed on ${onDate(view.state.claimedAt)}. It is on the ${planName(view.planTier)} plan now, and its record and shared memory travel with it.`}
        >
          <Value tone="pass">Claimed</Value>
        </Line>
        <Line
          label="What changed hands"
          sub="Counted at the moment it was accepted, and kept on the record."
        >
          <Num>{inventoryTotal(claim.inventory)}</Num>
        </Line>
        {view.canReleaseBlocker ? (
          <Empty>{view.canReleaseBlocker}</Empty>
        ) : (
          <>
            <Line
              label="If this went to the wrong place"
              sub={
                graceLeft > 0
                  ? `You can take it back on your own for ${graceLeft} more ${graceLeft === 1 ? "day" : "days"}. After that an owner or admin there can still release it.`
                  : "Releasing it puts the workspace back on the plan it came from. Nothing is deleted."
              }
            />
            <Actions>
              <Button
                variant="ghost"
                disabled={release.isPending}
                onClick={async () => {
                  const ok = await confirm({
                    title: "Release this workspace?",
                    body: "It goes back to the account it came from, on that plan and that bill. Nothing is deleted, and the whole claim stays on the record.",
                    confirmLabel: "Release it",
                    cancelLabel: "Leave it",
                    destructive: true,
                  });
                  if (ok) release.mutate();
                }}
              >
                {release.isPending ? "Releasing" : "Release it back to me"}
              </Button>
            </Actions>
          </>
        )}
      </>
    );
  }

  // Offered: waiting on the other side. Withdrawable by its author, always.
  if ((phase === "offered" || phase === "expired") && view.state.offer) {
    const offered = view.state.offer;
    const left = daysLeft(offered.expiresAt, nowIso);
    return (
      <>
        <Line
          label={`Offered to ${offered.toWorkspaceName ?? "an organisation"}`}
          sub={
            phase === "expired"
              ? "Nobody answered in time, so the offer lapsed. Nothing moved. You can offer it again."
              : `Waiting on an owner or admin there to accept. It lapses in ${left} ${left === 1 ? "day" : "days"} if nobody does. Nothing has moved.`
          }
        >
          <Value tone={phase === "expired" ? "warn" : "live"}>
            {phase === "expired" ? "Lapsed" : "Waiting"}
          </Value>
        </Line>
        <Inventory inv={offered.inventory} />
        {view.canWithdrawBlocker ? (
          <Empty>{view.canWithdrawBlocker}</Empty>
        ) : (
          <Actions>
            <Button variant="ghost" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
              {withdraw.isPending ? "Withdrawing" : "Withdraw the offer"}
            </Button>
          </Actions>
        )}
      </>
    );
  }

  // Nothing pending. Offer it, if this person owns it and has somewhere to send it.
  if (!view.isOwner) {
    return (
      <Empty>
        Only the person who owns this workspace can hand it to an organisation. Nobody can claim it
        for them.
      </Empty>
    );
  }

  const options = destinations.data?.destinations ?? [];
  const chosen = options.find((d) => d.viaWorkspaceId === destinationId) ?? null;
  const inv = preview.data?.inventory;
  const blocker = destinationId ? (preview.data?.blocker ?? null) : null;

  return (
    <>
      {destinations.isError ? (
        <Failed onRetry={() => void destinations.refetch()}>
          We could not read where this could go. {(destinations.error as Error)?.message ?? ""}
        </Failed>
      ) : options.length === 0 ? (
        <Empty>
          There is nowhere to bring this yet. Once you are a member of an organisation on Business
          or Enterprise, it appears here.
        </Empty>
      ) : (
        <>
          <Line
            label="Bring it into"
            sub="Only organisations that already invited you appear here, so this can never point at a stranger."
            htmlFor="claim-destination"
          >
            <select
              id="claim-destination"
              className="sp-select"
              value={destinationId}
              onChange={(e) => {
                setDestinationId(e.target.value);
                setAcknowledged(false);
              }}
            >
              <option value="">Pick an organisation</option>
              {options.map((d) => (
                <option key={d.viaWorkspaceId} value={d.viaWorkspaceId} disabled={!d.eligible}>
                  {d.viaWorkspaceName}
                  {d.eligible ? "" : ` (on ${planName(d.planTier)}, one seat)`}
                </option>
              ))}
            </select>
          </Line>

          {chosen && !chosen.eligible ? (
            <Empty>
              {chosen.viaWorkspaceName} is on {planName(chosen.planTier)}, which is a single seat.
              It needs Business or Enterprise before it can hold a second person's workspace.
            </Empty>
          ) : null}

          {destinationId && preview.isLoading ? <Loading>Counting what would move.</Loading> : null}
          {destinationId && preview.isError ? (
            <Failed onRetry={() => void preview.refetch()}>
              We could not count what would move, so nothing is being offered.{" "}
              {(preview.error as Error)?.message ?? ""}
            </Failed>
          ) : null}

          {destinationId && inv ? (
            <>
              <Inventory inv={inv} />
              <Line
                label="What actually happens"
                sub={`The workspace moves onto ${chosen?.viaWorkspaceName ?? "their"} plan and bill. You stay its owner. The admin who accepts joins it so they can read it. Your shared memory becomes readable by the people they add; anything you marked private moves with it and stays yours alone. The offer lapses after ${CLAIM_OFFER_TTL_DAYS} days if nobody accepts, and you can take it back on your own for ${CLAIM_RELEASE_GRACE_DAYS} days after they do.`}
              />
              <Line
                label="I want this workspace to become my organisation's"
                htmlFor="claim-ack"
                sub="This is the deliberate act. Nothing about a claim ever happens on its own."
              >
                <Checkbox
                  id="claim-ack"
                  checked={acknowledged}
                  onChange={setAcknowledged}
                  label="Confirm the claim"
                />
              </Line>
              {blocker ? <Empty>{blocker}</Empty> : null}
              <Actions>
                <Button
                  variant="primary"
                  disabled={!acknowledged || !!blocker || offer.isPending}
                  onClick={() => offer.mutate()}
                >
                  {offer.isPending ? "Offering" : "Offer it to them"}
                </Button>
              </Actions>
            </>
          ) : null}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The organisation's half
 * ------------------------------------------------------------------ */

function ClaimRow({ row, children }: { row: AccountClaimRow; children?: React.ReactNode }) {
  const who = personLabel(row.claimantName, row.claimantEmail, row.claimantId);
  const when = row.claimedAt ?? row.offeredAt;
  return (
    <>
      <Line
        label={row.workspaceName}
        sub={`${who}${when ? `, ${onDate(when)}` : ""}. ${inventoryTotal(row.inventory)} things on the record, ${row.inventory.decisions} of them decisions.`}
      >
        {row.phase === "claimed" ? (
          <Value tone="pass">Held</Value>
        ) : row.phase === "offered" ? (
          <Value tone="live">Waiting</Value>
        ) : (
          <Value tone="quiet">{row.phase === "expired" ? "Lapsed" : "Closed"}</Value>
        )}
      </Line>
      {children}
    </>
  );
}

function AccountClaims({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const fClaims = useServerFn(listAccountClaims);
  const fRespond = useServerFn(respondToWorkspaceClaim);
  const fRelease = useServerFn(releaseWorkspaceClaim);

  const claims = useQuery({
    queryKey: ["account-claims", workspaceId],
    queryFn: () => fClaims({ data: { workspaceId } }),
  });

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["account-claims"] });
    void qc.invalidateQueries({ queryKey: ["workspace-claim"] });
    void qc.invalidateQueries({ queryKey: ["workspaces"] });
  }

  const respond = useMutation({
    mutationFn: (args: { workspaceId: string; decision: "accept" | "decline" }) =>
      fRespond({
        data: {
          workspaceId: args.workspaceId,
          decision: args.decision,
          acknowledged: args.decision === "accept",
        },
      }),
    onSuccess: (res) => {
      refresh();
      toast.success(
        res.decision === "accept"
          ? "Claimed. The workspace is on your plan and you can open it."
          : "Declined. Nothing moved.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const release = useMutation({
    mutationFn: (id: string) => fRelease({ data: { workspaceId: id } }),
    onSuccess: () => {
      refresh();
      toast.success("Released. The workspace went back to the account it came from.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (claims.isLoading)
    return <Loading>Reading what has been claimed into this organisation.</Loading>;
  if (claims.isError) {
    return (
      <Failed onRetry={() => void claims.refetch()}>
        We could not read the claim record. {(claims.error as Error)?.message ?? ""}
      </Failed>
    );
  }

  const view = claims.data;
  if (!view || !view.canView) return null;

  const nothing = view.pending.length === 0 && view.held.length === 0 && view.past.length === 0;

  return (
    <Block
      title="Work claimed into this organisation"
      sub="Who handed their accumulated work over, what it contained, and when. This is the record you would show in a review."
    >
      {nothing ? (
        <Empty>
          Nobody has offered a workspace to this organisation yet. When someone who has been working
          alone offers theirs, it lands here for you to accept.
        </Empty>
      ) : null}

      {view.pending.map((row) => (
        <ClaimRow key={row.workspaceId} row={row}>
          <Line
            label="What you would be taking on"
            sub={`It moves onto your plan and your bill. You join it as an admin so you can read it. Shared memory becomes readable by the people you add; anything the author marked private stays theirs. They can take it back on their own for ${CLAIM_RELEASE_GRACE_DAYS} days, and you can release it at any time.${row.expiresAt ? ` This offer lapses on ${onDate(row.expiresAt)}.` : ""}`}
          />
          <Line
            label="This organisation is taking this on"
            htmlFor={`accept-ack-${row.workspaceId}`}
            sub="Your yes goes on the record next to theirs."
          >
            <Checkbox
              id={`accept-ack-${row.workspaceId}`}
              checked={!!acknowledged[row.workspaceId]}
              onChange={(next) => setAcknowledged((prev) => ({ ...prev, [row.workspaceId]: next }))}
              label="Confirm taking this workspace on"
            />
          </Line>
          <Actions>
            <Button
              variant="primary"
              disabled={!acknowledged[row.workspaceId] || respond.isPending}
              onClick={() => respond.mutate({ workspaceId: row.workspaceId, decision: "accept" })}
            >
              {respond.isPending ? "Working" : "Accept it"}
            </Button>
            <Button
              variant="ghost"
              disabled={respond.isPending}
              onClick={() => respond.mutate({ workspaceId: row.workspaceId, decision: "decline" })}
            >
              Decline
            </Button>
          </Actions>
        </ClaimRow>
      ))}

      {view.held.map((row) => (
        <ClaimRow key={row.workspaceId} row={row}>
          <Line
            label="Accepted by"
            sub={row.claimedAt ? `On ${onDate(row.claimedAt)}.` : undefined}
          >
            <Value>{personLabel(row.acceptedByName, null, row.acceptedBy)}</Value>
          </Line>
          <Actions>
            <Button
              variant="ghost"
              disabled={release.isPending}
              onClick={async () => {
                const ok = await confirm({
                  title: `Release ${row.workspaceName}?`,
                  body: "It goes back to the account it came from, on that plan and that bill. Nothing is deleted, and the whole claim stays on the record.",
                  confirmLabel: "Release it",
                  cancelLabel: "Keep it",
                  destructive: true,
                });
                if (ok) release.mutate(row.workspaceId);
              }}
            >
              {release.isPending ? "Releasing" : "Release it"}
            </Button>
          </Actions>
        </ClaimRow>
      ))}

      {view.past.length > 0 ? (
        <>
          <Line
            label="Closed"
            sub="Offers this organisation declined or let lapse, and workspaces it released. Kept because a claim that was refused is also a fact worth being able to show."
          />
          {view.past.map((row) => (
            <ClaimRow key={row.workspaceId} row={row}>
              {row.history.map((e) => (
                <Line
                  key={`${row.workspaceId}-${e.at}-${e.action}`}
                  label={ACTION_WORD[e.action] ?? e.action}
                  sub={`${personLabel(e.actorName, null, e.actorId)}, ${onDate(e.at)}`}
                />
              ))}
            </ClaimRow>
          ))}
        </>
      ) : null}
    </Block>
  );
}

/* ------------------------------------------------------------------ */

export function WorkspaceClaimCard() {
  const { activeWorkspaceId } = useWorkspace();
  if (!activeWorkspaceId) return null;

  return (
    <>
      <Block
        title="Bring your work with you"
        sub="Hand this workspace, and everything it learned, to an organisation you belong to. It is one deliberate act, it needs an admin there to accept, and it can be undone."
      >
        <YourClaim workspaceId={activeWorkspaceId} />
      </Block>
      <AccountClaims workspaceId={activeWorkspaceId} />
    </>
  );
}
