import * as React from "react";
import { Num } from "@/components/meridian/surface-parts";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import {
  listWorkspaceMembers,
  removeWorkspaceMember,
  transferWorkspaceOwnership,
  changeWorkspaceMemberRole,
} from "@/lib/workspaces.functions";
import { GOVERNED_WRITES, canWriteGoverned, type Role } from "@/lib/roles.functions";
import { toast } from "@/lib/notify";
import { Button, Empty, Failed, Line, Loading, Receipt, Select } from "@/components/shell/primitives";

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
//
// ------------------------------------------------------------------------
// GOVERNANCE PASS, 2026-08-10. Three findings, all on the same theme: this is
// the surface that decides what another human may do to a fleet of agents, and
// it was the least guarded thing in Settings.
//
// 1. REMOVING A PERSON WAS ONE CLICK. `remove.mutate(userId)` fired straight
//    off the button, while handing over OWNERSHIP - a thing you can undo by
//    asking for it back - carried a two-step inline confirm. So taking away
//    somebody's access was cheaper than promoting them. The inversion nobody
//    chose, and the same one /boundary found on its own mode controls. It goes
//    through `useConfirm` now, in this repo's established destructive shape:
//    the title names the person and the workspace, the body speaks in second
//    person, and what cannot be walked back sits LAST so it is the final thing
//    read.
//
// 2. A ROLE WAS A WORD WITH NO REACH ATTACHED. The row said "Admin" and left
//    the reader to know what an admin can do. On a surface whose whole job is
//    accountability, a permission with no stated blast radius is an abstraction
//    - and this product's admins can pause every agent in the workspace and
//    move the boundary the crew runs inside. The second line now COUNTS the
//    governed surfaces the role may write and names the sharpest of them. It is
//    counted from GOVERNED_WRITES, which is the same table the database
//    enforces and the same one every refusal message is generated from, so this
//    line cannot drift away from what actually happens.
//
// 3. THREE SUCCESS TOASTS. "Member removed" confirms that a click registered
//    and then erases itself; a Receipt renders what the click CAUSED and stays
//    (agents/FINAL-agent-presence.md R10). Changing who may govern a crew is
//    exactly the judgment that should leave a trace. Error toasts stay: a
//    failure has to reach you whether or not you are still looking here.
// ------------------------------------------------------------------------

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

/** What a decided write left behind. Rendered as a Receipt, never as a toast. */
type Settled = { id: string; verb: string; consequence: string };

/** Every governed surface, in nav order. The count below is out of this. */
const GOVERNED_SURFACES = Object.keys(GOVERNED_WRITES) as Array<keyof typeof GOVERNED_WRITES>;

/**
 * WHAT THIS ROLE CAN REACH, AS A NUMBER AND THEN AS THE TWO THAT MATTER.
 *
 * Blast radius, said per person. A role name is an abstraction; "may change 8
 * of the 8 things that govern the crew, including pausing every agent" is a
 * fact somebody can act on. Both halves are derived from GOVERNED_WRITES -
 * the table the migration enforces - rather than written out here, so a role
 * that gains or loses a surface changes this sentence with it.
 *
 * The two named surfaces are chosen, not sampled: pausing the workspace and
 * moving the tool boundary are the two writes on that table whose blast radius
 * is the whole crew rather than one artifact.
 *
 * `reachSentence` is the same fact as a plain string, for the receipt, where a
 * Num inside a sentence about what just happened would be the only mono run on
 * the line and would read as an identifier rather than as a count.
 */
function reachCount(role: string): number {
  return GOVERNED_SURFACES.filter((s) => canWriteGoverned(role as Role, s)).length;
}

function reachTail(role: string): string {
  const sharp = [
    canWriteGoverned(role as Role, "kill_switches") ? "stopping every agent" : null,
    canWriteGoverned(role as Role, "agent_tools") ? "moving the boundary they run inside" : null,
  ].filter(Boolean);
  return sharp.length ? `, including ${sharp.join(" and ")}` : "";
}

function reachOf(role: string): React.ReactNode {
  const n = reachCount(role);
  if (n === 0) return "Reads everything here and changes none of it";
  return (
    <>
      Changes <Num>{n}</Num> of the <Num>{GOVERNED_SURFACES.length}</Num> things that govern the
      crew{reachTail(role)}
    </>
  );
}

function reachSentence(role: string): string {
  const n = reachCount(role);
  if (n === 0) return "reads everything here and changes none of it";
  return `changes ${n} of the ${GOVERNED_SURFACES.length} things that govern the crew${reachTail(role)}`;
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
  const confirm = useConfirm();

  // THE COMMIT. What each write CAUSED, kept on screen. Session local: the
  // durable record of a membership change is the workspace audit, and a second
  // copy of it here would be a second source of one truth.
  const [settled, setSettled] = useState<Settled[]>([]);
  const commit = (verb: string, consequence: string) =>
    setSettled((prev) => [{ id: `${Date.now()}-${prev.length}`, verb, consequence }, ...prev]);

  const remove = useMutation({
    mutationFn: (vars: { userId: string; name: string }) =>
      fRemove({ data: { workspaceId: activeWorkspaceId as string, userId: vars.userId } }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
      commit(
        "You took away their access",
        `${vars.name} cannot open this workspace any more. What they made here stayed.`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const transfer = useMutation({
    mutationFn: (vars: { userId: string; name: string }) =>
      fTransfer({ data: { workspaceId: activeWorkspaceId as string, newOwnerId: vars.userId } }),
    onSuccess: (_r, vars) => {
      setConfirmTransfer(null);
      qc.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
      refreshWorkspaces();
      commit(
        "You handed over the workspace",
        `${vars.name} owns it now, and you are an admin. Only they can change who is here.`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "member" | "viewer"; name: string }) =>
      fChangeRole({
        data: { workspaceId: activeWorkspaceId as string, userId: vars.userId, role: vars.role },
      }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["workspace-members", activeWorkspaceId] });
      // The consequence is the REACH the new role carries, in the same words
      // the row states it in. Never "Role updated", which says only that the
      // click landed.
      commit("You changed what they may do", `${vars.name} now ${reachSentence(vars.role)}.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * REMOVING SOMEBODY IS A DECISION, NOT A PREFERENCE, and it was one click.
   *
   * The repo's destructive shape, matched rather than re-invented: the object
   * is named in the TITLE, the consequence is second person and immediate, and
   * what cannot be walked back is LAST so it is the thought a person leaves
   * with. It does not claim to be irreversible, because it is not - they can be
   * invited back - and dressing a reversible act as a permanent one is how
   * people learn to click through the confirmations that do matter.
   */
  const askBeforeRemoving = async (name: string): Promise<boolean> =>
    confirm({
      title: `Remove ${name} from ${activeWorkspace?.name ?? "this workspace"}?`,
      body: `They lose access the moment you confirm, including anything they can see here now. What they made here stays, and their account is untouched. Getting them back means a new invitation.`,
      confirmLabel: "Remove them",
      destructive: true,
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
          // The second line carries what the first one does not: the REACH the
          // role actually holds, then where to reach the person and how long
          // they have been here. The reach leads, because on a governance
          // surface "what can this one do to my crew" outranks an email
          // address, and because the control at the end of the line changes
          // exactly that.
          const sub = (
            <>
              {reachOf(m.role)}
              {m.displayName && m.email ? ` · ${m.email}` : ""}
              {joined ? ` · joined ${joined}` : ""}
            </>
          );
          const confirming = confirmTransfer === m.userId;

          return (
            <Line key={m.userId} label={m.isSelf ? `${name} (you)` : name} sub={sub}>
              {confirming ? (
                <>
                  <span style={{ color: "var(--sp-mute)", fontSize: "var(--sp-text-meta)" }}>
                    Make {name} the owner? You become an admin.
                  </span>
                  <Button
                    variant="primary"
                    disabled={transfer.isPending}
                    onClick={() => transfer.mutate({ userId: m.userId, name })}
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
                          name,
                        })
                      }
                      aria-label={`What ${name} may do`}
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
                        aria-label={`Remove ${name}`}
                        onClick={() => {
                          void (async () => {
                            if (await askBeforeRemoving(name)) {
                              remove.mutate({ userId: m.userId, name });
                            }
                          })();
                        }}
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

      {/* THE COMMIT. What each decision above actually caused, kept on screen
          rather than flashed once and lost. */}
      {settled.map((r) => (
        <Receipt key={r.id} verb={r.verb} consequence={r.consequence} />
      ))}
    </>
  );
}
