import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  listWorkspaceMembers,
  removeWorkspaceMember,
  transferWorkspaceOwnership,
  changeWorkspaceMemberRole,
} from "@/lib/workspaces.functions";
import { toast } from "@/lib/notify";
import { Button, Empty, Failed, Line, Loading, Select } from "@/components/shell/primitives";

// Members: the calm-front view of who is in the workspace (WM-F4 + RBAC). Identity (name/email)
// comes from the membership-gated workspace_members_with_identity RPC, because profiles RLS is
// own-row-only. Member management is OWNER-ONLY (the WM-F3 "owner manages members" RLS is
// owner-scoped, so admins cannot write workspace_members): the owner can change a member's role
// inline, remove a member, or hand over ownership via an inline two-step confirm (it demotes
// the owner to admin, so it is not one-click).
// Engine-Room: workspace_members + the RBAC roles + the transfer/remove/role RPCs -> shown in
// Settings > Workspace as "Members" -> see who is in the workspace and, as owner, manage them.
//
// Ported to the rebuild primitives 2026-07-29. It renders INSIDE the route's
// `Block title="People"`, so it deliberately draws no Block and no heading of
// its own: a second rule under the heading it already sits beneath is the
// nested-container defect, not a section. Each member is a Line, because a
// member's role IS a boundary and a boundary reads as a sentence with its
// control at the end. Dropped on the way: the monogram discs (decoration in
// front of the message, hard ban 8), the three-bar pulse skeleton (Loading
// states the fact instead), and the role pill (the Select is the role).
// FIXED, beyond styling: the error state said "Try again" with nothing to
// click. It now has the retry it was describing.

type Member = {
  userId: string;
  role: string;
  createdAt: string;
  displayName: string | null;
  email: string | null;
  isSelf: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

function memberName(m: Member): string {
  return m.displayName?.trim() || m.email?.trim() || "Member";
}

function joinedOn(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function MembersCard() {
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const qc = useQueryClient();
  const fList = useServerFn(listWorkspaceMembers);
  const fRemove = useServerFn(removeWorkspaceMember);
  const fTransfer = useServerFn(transferWorkspaceOwnership);
  const fChangeRole = useServerFn(changeWorkspaceMemberRole);

  const membersQ = useQuery({
    queryKey: ["workspace-members", activeWorkspaceId],
    queryFn: () => fList({ data: { id: activeWorkspaceId as string } }),
    enabled: !!activeWorkspaceId,
  });

  const members: Member[] = membersQ.data?.members ?? [];
  // Member management is owner-only (WM-F3 "owner manages members" RLS is owner-scoped).
  const isOwner = (membersQ.data?.selfRole ?? null) === "owner";
  const ownerId = activeWorkspace?.owner_id ?? null;

  const [confirmTransfer, setConfirmTransfer] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: (userId: string) =>
      fRemove({ data: { workspaceId: activeWorkspaceId as string, userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
      toast.success("Member removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const transfer = useMutation({
    mutationFn: (newOwnerId: string) =>
      fTransfer({ data: { workspaceId: activeWorkspaceId as string, newOwnerId } }),
    onSuccess: () => {
      setConfirmTransfer(null);
      qc.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
      refreshWorkspaces();
      toast.success("Ownership transferred");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "member" | "viewer" }) =>
      fChangeRole({
        data: { workspaceId: activeWorkspaceId as string, userId: vars.userId, role: vars.role },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // The boundary currently in force, stated before anything offers to change it.
  const policy = membersQ.isSuccess
    ? `${members.length} ${members.length === 1 ? "person" : "people"} can work here. ${
        isOwner
          ? "As the owner, you can change roles, remove people, or hand over ownership."
          : "Only the workspace owner can change who is here."
      }`
    : null;

  return (
    <>
      {policy ? <div className="sp-block-sub">{policy}</div> : null}

      {membersQ.isLoading ? (
        <Loading>Reading who is in this workspace.</Loading>
      ) : membersQ.isError ? (
        <Failed onRetry={() => void membersQ.refetch()}>
          The member list did not load. {(membersQ.error as Error)?.message ?? "The read failed."}
        </Failed>
      ) : members.length === 0 ? (
        <Empty>Nobody is in this workspace yet. Invite someone below.</Empty>
      ) : (
        members.map((m) => {
          const name = memberName(m);
          const isRowOwner = m.userId === ownerId || m.role === "owner";
          // All member management is owner-only (RLS). The owner cannot manage
          // their own row (the demotion trigger guards it) or the owner row.
          const manageable = isOwner && !isRowOwner && !m.isSelf;
          const joined = joinedOn(m.createdAt);
          // The second line carries what the first one does not: where to reach
          // them and how long they have been here. Never a restatement.
          const sub = [
            m.displayName && m.email ? m.email : null,
            joined ? `joined ${joined}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          const confirming = confirmTransfer === m.userId;

          return (
            <Line key={m.userId} label={m.isSelf ? `${name} (you)` : name} sub={sub || undefined}>
              {confirming ? (
                <>
                  <span style={{ color: "var(--sp-mute)", fontSize: "var(--sp-text-meta)" }}>
                    Make {name} the owner? You become an admin.
                  </span>
                  <Button
                    variant="primary"
                    disabled={transfer.isPending}
                    onClick={() => transfer.mutate(m.userId)}
                  >
                    {transfer.isPending ? "Transferring" : "Confirm"}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={transfer.isPending}
                    onClick={() => setConfirmTransfer(null)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {manageable ? (
                    <Select
                      value={m.role}
                      disabled={changeRole.isPending}
                      onChange={(e) =>
                        changeRole.mutate({
                          userId: m.userId,
                          role: e.target.value as "admin" | "member" | "viewer",
                        })
                      }
                      aria-label={`Role for ${name}`}
                      style={{ width: 130 }}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </Select>
                  ) : (
                    <span style={{ color: "var(--sp-mute)", fontSize: "var(--sp-text-meta)" }}>
                      {ROLE_LABEL[m.role] ?? m.role}
                    </span>
                  )}
                  {manageable ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => setConfirmTransfer(m.userId)}
                        aria-label={`Make ${name} the owner`}
                      >
                        Make owner
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(m.userId)}
                        aria-label={`Remove ${name}`}
                      >
                        Remove
                      </Button>
                    </>
                  ) : null}
                </>
              )}
            </Line>
          );
        })
      )}
    </>
  );
}
