import { useState } from "react";
import { Line } from "@/components/meridian/rows";
import { Actions } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { inviteMember, listInvitations, revokeInvitation } from "@/lib/workspaces.functions";
import { toast } from "@/lib/notify";
import { Block, Button, Empty, Failed, Field, Input, Loading, Pre, Select } from "@/components/shell/primitives";

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
    <Block
      title="Invite teammates"
      sub="They join with the role you pick. Outbound email is off for now, so share the join link the invite gives you."
    >
      <div
        style={{
          display: "flex",
          gap: "var(--sp-space-2)",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            aria-label="Invitee email"
            style={{ minWidth: 240 }}
          />
        </Field>
        <Field label="Role">
          <Select
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
          </Select>
        </Field>
        <Actions>
          <Button variant="primary" disabled={!canInvite} onClick={() => invite.mutate()}>
            {invite.isPending ? "Inviting" : "Send invite"}
          </Button>
        </Actions>
      </div>

      {fullLink ? (
        // The receipt of the invite you just made: the actual link, not a
        // confirmation that one exists. Nothing else on this surface can be
        // acted on by pasting it somewhere, so it gets the room to be selected.
        <>
          <Pre>{fullLink}</Pre>
          <Actions>
            <Button onClick={copyLink}>Copy link</Button>
            <Button variant="ghost" onClick={() => setLastLink(null)}>
              Done
            </Button>
          </Actions>
        </>
      ) : null}

      {invitations.isLoading ? (
        <Loading>Reading the pending invitations.</Loading>
      ) : invitations.isError ? (
        <Failed onRetry={() => void invitations.refetch()}>
          The pending invitations did not load.{" "}
          {(invitations.error as Error)?.message ?? "The read failed."}
        </Failed>
      ) : pending.length === 0 ? (
        <Empty>Nobody is waiting on an invite.</Empty>
      ) : (
        pending.map((inv) => (
          <Line key={inv.id} label={inv.email} sub={`${inv.role} · ${inv.status}`}>
            {inv.status === "pending" ? (
              <Button
                variant="ghost"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(inv.id)}
                aria-label={`Revoke invitation for ${inv.email}`}
              >
                Revoke
              </Button>
            ) : null}
          </Line>
        ))
      )}
    </Block>
  );
}
