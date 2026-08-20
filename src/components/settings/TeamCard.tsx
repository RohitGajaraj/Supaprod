import { useState } from "react";
import { Line } from "@/components/meridian/rows";
import {
  Actions,
  Action,
  NothingYet,
  Picker,
  Pre,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { inviteMember, listInvitations, revokeInvitation } from "@/lib/workspaces.functions";
import { toast } from "@/lib/notify";

// Invite teammates: the calm-front view of WM-F5 (workspace invitations). Manager-only RLS
// gates the backend; this surfaces the invite form, the join link (outbound email is a
// founder-gated no-op, so the inviter copies the link), and the pending invitations.
// Engine-Room: the workspace_invitations table + accept RPC -> shown in Settings > Workspace
// as "Invite teammates" -> the user invites by email, shares a link, and sees who is pending.
//
// Ported to the rebuild primitives 2026-07-29. It sits under the route's
// `Block title="People"` beside MembersCard, and takes the one Block of its own
// because inviting is a different act from managing who is already here. The
// fresh join link is a Pre rather than a tinted recess: it is a string a person
// copies, and Pre already holds its own whitespace and scrolls inside itself.
// FIXED, beyond styling: the invitations read had no failure state at all, so a
// failed read rendered "No invitations yet." That is a lie about the workspace.
//
// Ported to Meridian 2026-08-20. `Block` is `Region`, which draws no outer margin
// and no section rule on purpose: the SURFACE states that rhythm once, and the
// surface here is `_authenticated.settings.tsx`, still on the retired layer and
// owning that gap in its own port. Until that lands this card stacks flush
// against MembersCard above it.

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
};

const ROLES = [
  { id: "member", label: "Member" },
  { id: "admin", label: "Admin" },
  { id: "viewer", label: "Viewer" },
] as const;

export function TeamCard() {
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();
  const fInvite = useServerFn(inviteMember);
  const fList = useServerFn(listInvitations);
  const fRevoke = useServerFn(revokeInvitation);

  const invitations = useQuery({
    queryKey: ["workspace-invitations", activeWorkspaceId],
    queryFn: () => fList({ data: { workspaceId: activeWorkspaceId as string } }),
    enabled: !!activeWorkspaceId,
  });
  const pending: Invitation[] = invitations.data?.invitations ?? [];

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [lastLink, setLastLink] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () =>
      fInvite({ data: { workspaceId: activeWorkspaceId as string, email: email.trim(), role } }),
    onSuccess: (res) => {
      setLastLink(res.link);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["workspace-invitations", activeWorkspaceId] });
      toast.success(res.emailed ? "Invite sent" : "Invite created. Copy the link to share it.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => fRevoke({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-invitations", activeWorkspaceId] });
      toast.success("Invitation revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fullLink = lastLink ? `${window.location.origin}${lastLink}` : null;

  function copyLink() {
    if (!fullLink) return;
    void navigator.clipboard?.writeText(fullLink);
    toast.success("Link copied");
  }

  const canInvite = !!activeWorkspaceId && email.trim().length > 0 && !invite.isPending;

  return (
    <Region
      title="Invite teammates"
      sub="They join with the role you pick. Outbound email is off for now, so share the join link the invite gives you."
    >
      {/* The gap was `--sp-space-2`, 8px. Meridian's ramp steps 6px then 10px,
          so there is no 8: taking `--mrd-s4` because the ratchet forbids
          shrinking a surface to answer a port. */}
      <div
        style={{
          display: "flex",
          gap: "var(--mrd-s4)",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        {/* Meridian's `Field` renders its label as a SIBLING bound by `htmlFor`,
            where the retired one wrapped the control, so both ids are real and
            minted here. The `aria-label`s stay: an existing one still wins the
            accessible name, and removing it would change what a screen reader
            says while porting the paint. */}
        <Field label="Email" htmlFor="team-invite-email">
          <Input
            id="team-invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            aria-label="Invitee email"
            style={{ minWidth: 240 }}
          />
        </Field>
        <Field label="Role" htmlFor="team-invite-role">
          <Picker
            id="team-invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "member" | "viewer")}
            aria-label="Role"
            style={{ width: 140 }}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Picker>
        </Field>
        <Actions>
          <Action variant="primary" disabled={!canInvite} onClick={() => invite.mutate()}>
            {invite.isPending ? "Inviting" : "Send invite"}
          </Action>
        </Actions>
      </div>

      {fullLink ? (
        // The receipt of the invite you just made: the actual link, not a
        // confirmation that one exists. Nothing else on this surface can be
        // acted on by pasting it somewhere, so it gets the room to be selected.
        <>
          {/* Meridian's `Pre` sets no outer margin, where `.sp-pre` baked in a
              12px `margin-top`. The ramp has no 12, so the wrapper states 16px
              rather than 10px: the ratchet forbids shrinking to answer a port. */}
          <div className="mt-mrd-5">
            <Pre>{fullLink}</Pre>
          </div>
          <Actions>
            <Action onClick={copyLink}>Copy link</Action>
            <Action variant="quiet" onClick={() => setLastLink(null)}>
              Done
            </Action>
          </Actions>
        </>
      ) : null}

      {invitations.isLoading ? (
        <Reading>Reading the pending invitations.</Reading>
      ) : invitations.isError ? (
        <ReadFailedLine onRetry={() => void invitations.refetch()}>
          The pending invitations did not load.{" "}
          {(invitations.error as Error)?.message ?? "The read failed."}
        </ReadFailedLine>
      ) : pending.length === 0 ? (
        <NothingYet>Nobody is waiting on an invite.</NothingYet>
      ) : (
        pending.map((inv) => (
          <Line key={inv.id} label={inv.email} sub={`${inv.role} · ${inv.status}`}>
            {inv.status === "pending" ? (
              <Action
                variant="quiet"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(inv.id)}
                aria-label={`Revoke invitation for ${inv.email}`}
              >
                Revoke
              </Action>
            ) : null}
          </Line>
        ))
      )}
    </Region>
  );
}
