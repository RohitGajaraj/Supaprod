/**
 * ADMIN / WORKSPACES. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the six answers. The
 * parent /admin route draws the Surface, the h1 and the tab strip, so this
 * file renders bare content and never a second head.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    An operator holding one workspace's name, because the person who owned it
 *    has left the company, or a customer asked for it to be deleted, or
 *    somebody was given the wrong role. One workspace, one change, then out.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE.
 *    Changing who controls a workspace, and whether it still exists. Handing
 *    ownership to a different person and soft deleting a workspace cannot be
 *    done anywhere else in the product, by anyone, at all. Everything else on
 *    the page is either serving that or is a candidate for removal.
 *
 * 3. KEEP / MOVE / KILL, every element that was on the page.
 *    KEEP the search, the member roster, the role change, the removal, the
 *      ownership transfer, and delete with its restore. Every one is a
 *      decision made here and unavailable elsewhere.
 *    KEEP the demo reset, and keep its gate EXACTLY as narrow as the server's.
 *      See THE DEMO GATE below: this is a live defect, and widening the client
 *      test would draw a button the database refuses.
 *    KEEP the audit trail, and it now says what changed. It rendered the raw
 *      action string and dropped the payload, so "change_member_role" was on
 *      screen and the role it was changed TO was not.
 *    KILL the Sheet drawer. A slide-over holding details, a member roster with
 *      three controls per member, a destructive delete and an audit trail is
 *      the modal abuse anti-slop ban 11 exists to stop, and primitives.tsx
 *      names the pane as deliberately absent. The workspace in focus renders
 *      in place now.
 *    KILL the six-column table and its sideways scroll. A row answers "is this
 *      the one" and nothing else: the name, and one different line carrying
 *      its owner, its plan and how many people are in it.
 *    KILL the "Deleted: no" column. A live workspace does not need to announce
 *      that it is alive on every row; a deleted one says so and wears the fail
 *      tone, which is the only time the fact matters.
 *    KILL the three buttons on every member row. Twelve members meant thirty
 *      six controls, all at equal weight, and the destructive one sat beside
 *      the routine one. Controls belong to the ONE member in focus, and the
 *      removal is separated by distance rather than by colour.
 *    KILL the local th(), td() and FieldRow helpers and the hand-rolled focus
 *      ring class. Every one is a primitive now, and real controls take the
 *      app-wide ring without being told.
 *    KILL "Find a workspace, check its plan, move ownership". It restated the
 *      three things visibly on the page underneath it (hard ban 10).
 *    KILL every success toast. See THE COMMIT below.
 *    ADDED, because it was already being read and thrown away: the workspace
 *      balance. admin_search_workspaces returns balance_credits on every row
 *      and the page never drew it, so "why did this workspace stop working"
 *      could not be answered from the surface that exists to answer it. It is
 *      a line on the workspace in focus.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE.
 *    The slug, the balance, the member roster, the audit trail and every
 *    destructive control belong to the one workspace in focus. Each member's
 *    controls are one click further again, on the member you actually mean.
 *
 * 5. DELIGHT, AND CONFUSION.
 *    The moment is transferring ownership and watching the receipt name the
 *    new owner and stay on screen, instead of a toast that is gone before you
 *    have read it. This is the single most consequential write in the admin
 *    console and it used to leave nothing behind. What would confuse, and is
 *    therefore not drawn: a failed search reading as "no workspaces", a
 *    permanent "reading workspace" line after a failed read, and a button
 *    whose server function will refuse it.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    Nowhere, and deliberately. A workspace's membership and its existence are
 *    human facts, no agent writes any of them, and admin_audit_log records the
 *    actor as a bare uuid with no email to join, so even the human actor is
 *    not claimed. The honest crew fact is stated in words where it is true:
 *    the balance line says this is what the crew has left to spend inside this
 *    workspace, which is the reason an operator is usually looking.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10). Transferring a company's
 * workspace to a different human used to produce toast.success("Ownership
 * transferred.") and nothing else. A toast confirms the click registered; a
 * receipt renders what the click CAUSED and stays. All six writes leave one,
 * carrying the real consequence, and a failed write leaves a failed receipt
 * rather than silence. No handoff arrow anywhere: nothing picks up a workspace
 * deletion, and an arrow to nowhere is worse than no arrow.
 *
 * THE DEMO GATE, now fixed in the database (migration
 * 20260730000500_demo_reset_allowlist.sql). It used to gate on
 * `_owner_email LIKE '%@redcadence.app'`, and those logins were retired on
 * 2026-07-25, so the reset matched no live workspace and threw for every
 * account it was offered on.
 *
 * The repair is an ALLOWLIST, `public.demo_account_emails()`, and deliberately
 * NOT a swap to '%@supaprod.ai'. founder@supaprod.ai and every real staff
 * account share that domain, so a domain match would have made the founder's
 * own workspace wipeable by any admin. A safety gate that widens to include
 * the thing it protects is not a gate.
 *
 * This list is kept identical to the SQL function's, so the control appears
 * exactly where the database will accept it. If the two ever drift, the SQL
 * wins and the button throws; that is the safe direction.
 *
 * UNCHANGED: every query key, every server function, every confirmation on a
 * destructive action, and the in-band {error} handling on every mutation.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingHere,
  Num,
  Picker,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { Receipt } from "@/components/meridian/Receipt";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";

import { useConfirm } from "@/hooks/use-confirm";
import { inBandError, useDebouncedValue } from "@/components/admin/admin-ui";
import {
  adminSearchWorkspaces,
  adminGetWorkspaceDetail,
  adminChangeMemberRole,
  adminRemoveWorkspaceMember,
  adminTransferWorkspaceOwnership,
  adminSoftDeleteWorkspace,
  adminRestoreWorkspace,
  type AdminWorkspaceRow,
} from "@/lib/admin-workspaces.functions";
import { adminResetDemoWorkspace } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/workspaces")({
  component: AdminWorkspaces,
});

/** The server hardcodes _lim = 100. Kept here so the surface can say when it
 *  is looking at a capped list instead of printing a count it was never
 *  given. */
const SERVER_CAP = 100;

/** How many history rows before the surface has a bottom. */
const AUDIT_CAP = 6;

/** The demo-account domain, matched EXACTLY to the SQL safety gate in
 *  admin_reset_demo_workspace. See THE DEMO GATE in the file header: an
 *  explicit list, never a domain match, and identical to the SQL function
 *  public.demo_account_emails() so the control only appears where the database
 *  will accept it. */
const DEMO_ACCOUNT_EMAILS = [
  "voyage@supaprod.ai",
  "compass@supaprod.ai",
  "meridian@supaprod.ai",
  "lantern@supaprod.ai",
  "harbor@supaprod.ai",
  "explore@supaprod.ai",
  "ember@supaprod.ai",
] as const;

const ROLES = ["owner", "admin", "member", "viewer"] as const;

/** Plain words for the action strings admin_audit writes against a workspace.
 *  An action this map does not know prints raw rather than being guessed at. */
const ACTION_WORDS: Record<string, string> = {
  add_member: "Member added",
  remove_member: "Member removed",
  change_member_role: "Role changed",
  transfer_ownership: "Ownership transferred",
  soft_delete_workspace: "Workspace deleted",
  restore_workspace: "Workspace restored",
  demo_workspace_reset: "Demo content cleared",
};

type WSDetail = {
  workspace?: {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    plan_tier: string;
    deleted_at: string | null;
    created_at: string;
  };
  members?: Array<{ user_id: string; email: string | null; role: string }>;
  audit?: Array<{
    id: string;
    action: string;
    payload?: Record<string, unknown> | null;
    created_at: string;
  }>;
};

type Settled = { id: string; verb: string; consequence: string; failed?: boolean; at: string };

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** What the stored payload actually says, in words. Bare uuids are skipped:
 *  an identifier nobody can read is not detail, it is noise. */
function auditDetail(payload: Record<string, unknown>): string | null {
  const parts: string[] = [];
  const role = str(payload.role);
  if (role) parts.push(`to ${role}`);
  const ownerEmail = str(payload.owner_email);
  if (ownerEmail) parts.push(ownerEmail);
  const reason = str(payload.reason);
  if (reason) parts.push(reason);
  return parts.length ? parts.join(" · ") : null;
}

/* ================================================================== *
 * The list
 * ================================================================== */

function AdminWorkspaces() {
  const fSearch = useServerFn(adminSearchWorkspaces);
  const [q, setQ] = useState("");
  // One query per pause, not per keystroke.
  const debouncedQ = useDebouncedValue(q);
  const [selected, setSelected] = useState<string | null>(null);

  const search = useQuery({
    queryKey: ["admin-workspaces", debouncedQ],
    queryFn: () => fSearch({ data: { q: debouncedQ } }),
  });

  // A failed search must never read as "no workspaces".
  const searchError = search.isError
    ? search.error instanceof Error
      ? search.error.message
      : "The request failed."
    : inBandError(search.data);

  const rows: AdminWorkspaceRow[] = Array.isArray(search.data)
    ? (search.data as AdminWorkspaceRow[])
    : [];
  const capped = rows.length >= SERVER_CAP;

  return (
    // THE RHYTHM BETWEEN REGIONS, STATED HERE. The retired `Block` carried its
    // own margin, padding and a rule above every section, so the page's spacing
    // lived in a stylesheet. `Region` draws neither, so the surface owns it, and
    // `gap-mrd-6` is the step every ported surface uses between regions.
    <div className="flex flex-col gap-mrd-6">
      <Region
        title="Find a workspace"
        sub={
          capped
            ? `The read stops at ${SERVER_CAP}, so this may not be all of them. Narrow the search before drawing a conclusion.`
            : "By name, by slug, or by the email of whoever owns it."
        }
      >
        <Field label="Name, slug or owner email" htmlFor="admin-ws-find">
          <Input
            id="admin-ws-find"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Helio Labs"
          />
        </Field>

        {search.isLoading ? (
          <Reading>Reading workspaces.</Reading>
        ) : searchError ? (
          <ReadFailedLine onRetry={() => void search.refetch()}>
            The read failed, so this is not a claim that nothing matches. {searchError}
          </ReadFailedLine>
        ) : rows.length === 0 ? (
          <NothingHere>
            {q.trim()
              ? "Nothing matches that name, slug or owner."
              : "Every workspace on the platform is reachable from here. Type to narrow it."}
          </NothingHere>
        ) : (
          rows.map((w) => (
            <Row
              key={w.id}
              tight
              focused={selected === w.id}
              lead={w.name}
              sub={
                <>
                  {w.deleted_at ? (
                    <>
                      <Value tone="fail">deleted {w.deleted_at.slice(0, 10)}</Value>
                      {" · "}
                    </>
                  ) : null}
                  {w.owner_email ?? "no owner email on record"}
                  {" · "}
                  {w.plan_tier}
                  {" · "}
                  <Num>{w.member_count}</Num> {w.member_count === 1 ? "member" : "members"}
                </>
              }
              time={new Date(w.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              onClick={() => setSelected(selected === w.id ? null : w.id)}
            />
          ))
        )}
      </Region>

      {/* Keyed by the workspace, so every local state in there resets when the
          subject changes. Without it the receipts from the last workspace stay
          on screen under the next one's name, which is a lie about what you
          did and to what. */}
      {selected ? (
        <WorkspaceInFocus
          key={selected}
          workspaceId={selected}
          summary={rows.find((w) => w.id === selected) ?? null}
        />
      ) : null}
    </div>
  );
}

/* ================================================================== *
 * One workspace
 * ================================================================== */

function WorkspaceInFocus({
  workspaceId,
  summary,
}: {
  workspaceId: string;
  summary: AdminWorkspaceRow | null;
}) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fDetail = useServerFn(adminGetWorkspaceDetail);
  const fRole = useServerFn(adminChangeMemberRole);
  const fRemove = useServerFn(adminRemoveWorkspaceMember);
  const fTransfer = useServerFn(adminTransferWorkspaceOwnership);
  const fSoftDel = useServerFn(adminSoftDeleteWorkspace);
  const fRestore = useServerFn(adminRestoreWorkspace);
  const fDemoReset = useServerFn(adminResetDemoWorkspace);

  const detail = useQuery({
    queryKey: ["admin-workspace-detail", workspaceId],
    queryFn: async () => {
      const r = await fDetail({ data: { workspaceId } });
      if ("error" in r) throw new Error(r.error);
      return JSON.parse(r.json) as WSDetail;
    },
  });

  const [focusedMember, setFocusedMember] = useState<string | null>(null);
  const [openAudit, setOpenAudit] = useState(false);

  // THE COMMIT. Session local: the durable record is the audit trail below.
  const [settled, setSettled] = useState<Settled[]>([]);
  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed, at: nowStamp() },
      ...prev,
    ]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-workspace-detail", workspaceId] });
    void qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
  };

  // Every one of these is destructive and every server fn returns errors in
  // band, so each checks the result shape AND the thrown path. A failed
  // transfer must never leave a success shape behind.
  const failedWrite = (verb: string) => (e: unknown) =>
    commit(verb, e instanceof Error ? e.message : "The write failed. Nothing changed.", true);

  const setRole = useMutation({
    mutationFn: (vars: { userId: string; role: string; email: string }) =>
      fRole({ data: { workspaceId, userId: vars.userId, role: vars.role } }),
    onSuccess: (r, vars) => {
      if ("error" in r) return commit("You tried to change a role", r.error, true);
      commit("You changed a role", `${vars.email} is now ${vars.role} here.`);
      invalidate();
    },
    onError: failedWrite("You tried to change a role"),
  });

  const remove = useMutation({
    mutationFn: (vars: { userId: string; email: string }) =>
      fRemove({ data: { workspaceId, userId: vars.userId } }),
    onSuccess: (r, vars) => {
      if ("error" in r) return commit("You tried to remove a member", r.error, true);
      commit("You removed a member", `${vars.email} lost access to this workspace.`);
      setFocusedMember(null);
      invalidate();
    },
    onError: failedWrite("You tried to remove a member"),
  });

  const transfer = useMutation({
    mutationFn: (vars: { userId: string; email: string }) =>
      fTransfer({ data: { workspaceId, newOwnerId: vars.userId } }),
    onSuccess: (r, vars) => {
      if ("error" in r) return commit("You tried to transfer ownership", r.error, true);
      commit("You transferred ownership", `${vars.email} owns this workspace now.`);
      invalidate();
    },
    onError: failedWrite("You tried to transfer ownership"),
  });

  const softDel = useMutation({
    mutationFn: () => fSoftDel({ data: { workspaceId } }),
    onSuccess: (r) => {
      if ("error" in r) return commit("You tried to delete this workspace", r.error, true);
      commit(
        "You deleted this workspace",
        "Hidden from everyone in it. Nothing is erased, and restoring it puts it back.",
      );
      invalidate();
    },
    onError: failedWrite("You tried to delete this workspace"),
  });

  const restore = useMutation({
    mutationFn: () => fRestore({ data: { workspaceId } }),
    onSuccess: (r) => {
      if ("error" in r) return commit("You tried to restore this workspace", r.error, true);
      commit("You restored this workspace", "Everyone in it can reach it again.");
      invalidate();
    },
    onError: failedWrite("You tried to restore this workspace"),
  });

  const demoReset = useMutation({
    mutationFn: () => fDemoReset({ data: { workspaceId } }),
    onSuccess: (r) => {
      if ("error" in r) return commit("You tried to clear the demo content", r.error, true);
      const total = Object.values(r.deleted as Record<string, number>).reduce((a, b) => a + b, 0);
      commit(
        "You cleared the demo content",
        `${total.toLocaleString()} rows gone. The workspace and its members stayed. Reseeding is a separate script.`,
      );
      invalidate();
    },
    onError: failedWrite("You tried to clear the demo content"),
  });

  if (detail.isLoading) {
    return (
      <Region title="The workspace you picked">
        <Reading>Reading the workspace.</Reading>
      </Region>
    );
  }

  // A failed read used to sit on "reading workspace" forever.
  if (detail.isError) {
    return (
      <Region title="The workspace you picked">
        <ReadFailedLine onRetry={() => void detail.refetch()}>
          The workspace did not load, so nothing here is safe to change yet.{" "}
          {(detail.error as Error)?.message ?? "The read failed."}
        </ReadFailedLine>
      </Region>
    );
  }

  const d = detail.data;
  if (!d) return null;

  const ws = d.workspace;
  const members = d.members ?? [];
  const audit = d.audit ?? [];
  const shownAudit = openAudit ? audit : audit.slice(0, AUDIT_CAP);
  const deleted = !!ws?.deleted_at;
  const isDemo = members.some(
    (m) => !!m.email && (DEMO_ACCOUNT_EMAILS as readonly string[]).includes(m.email),
  );
  const busy =
    setRole.isPending ||
    remove.isPending ||
    transfer.isPending ||
    softDel.isPending ||
    restore.isPending ||
    demoReset.isPending;

  return (
    <div className="flex flex-col gap-mrd-6">
      <Region
        title={ws?.name ?? "The workspace you picked"}
        sub={[
          ws?.slug ? `/${ws.slug}` : null,
          ws?.created_at ? `made ${ws.created_at.slice(0, 10)}` : null,
          summary?.owner_email ?? null,
        ]
          .filter(Boolean)
          .join(" · ")}
      >
        <Line
          label="Status"
          sub={
            deleted
              ? "Hidden from everyone in it. Nothing was erased, so restoring puts it back exactly."
              : "Live. Everyone in it can reach it."
          }
        >
          <Value tone={deleted ? "fail" : "pass"}>{deleted ? "deleted" : "live"}</Value>
          <Action
            busy={busy}
            onClick={() => {
              if (deleted) {
                restore.mutate();
                return;
              }
              void (async () => {
                const ok = await confirm({
                  title: "Delete this workspace?",
                  body: "Everyone in it loses sight of it immediately. Nothing is erased and you can restore it from this same line.",
                  confirmLabel: "Delete it",
                  destructive: true,
                });
                if (ok) softDel.mutate();
              })();
            }}
          >
            {deleted ? "Restore" : "Delete"}
          </Action>
        </Line>

        <Line label="Plan" sub="What this workspace is billed on.">
          <Value>{ws?.plan_tier ?? summary?.plan_tier ?? "unknown"}</Value>
        </Line>

        {summary ? (
          <Line
            label="Credits"
            sub="What the crew has left to spend inside this workspace. At zero, its runs stop."
          >
            <Value tone={summary.balance_credits <= 0 ? "fail" : "quiet"}>
              <Num>{summary.balance_credits.toLocaleString()}</Num>
            </Value>
          </Line>
        ) : null}

        {isDemo ? (
          <Line
            label="Demo content"
            sub="Clears every signal, decision and opportunity in here. The workspace and its members stay, and reseeding the sample is a separate script an engineer runs."
          >
            <Action
              busy={busy}
              onClick={() => {
                void (async () => {
                  const ok = await confirm({
                    title: "Clear this demo workspace?",
                    body: "All content is deleted. The workspace and its members stay. Reseed afterwards.",
                    confirmLabel: "Clear it",
                    destructive: true,
                  });
                  if (ok) demoReset.mutate();
                })();
              }}
            >
              {demoReset.isPending ? "Clearing" : "Clear it"}
            </Action>
          </Line>
        ) : null}
      </Region>

      <Region
        title="Who is in it"
        sub="Pick one to change what they can do here. Roles take effect the moment you set them."
      >
        {members.length === 0 ? (
          <NothingHere>
            Nobody is a member of this workspace, which usually means it was made and never opened.
          </NothingHere>
        ) : (
          members.map((m) => {
            const label = m.email ?? m.user_id.slice(0, 8);
            const isOwner = ws?.owner_id === m.user_id;
            const open = focusedMember === m.user_id;
            // Built once so the owner's row, which has no transfer, still gets
            // the same control rather than an empty action group beside it.
            const removeMember = (
              <Action
                variant="quiet"
                busy={busy}
                onClick={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: "Remove them from this workspace?",
                      body: isOwner
                        ? `${label} loses access immediately, and this workspace is left owned by somebody who is not in it. Hand ownership over first unless you mean that.`
                        : `${label} loses access immediately.`,
                      confirmLabel: "Remove them",
                      destructive: true,
                    });
                    if (ok) remove.mutate({ userId: m.user_id, email: label });
                  })();
                }}
              >
                Remove from this workspace
              </Action>
            );
            return (
              <Fragment key={m.user_id}>
                <Row
                  tight
                  focused={open}
                  lead={label}
                  sub={isOwner ? `${m.role} · owns this workspace` : m.role}
                  onClick={() => setFocusedMember(open ? null : m.user_id)}
                />
                {open ? (
                  <>
                    <Line
                      label="Role"
                      sub="Their access changes the moment you pick, with no further confirmation elsewhere."
                      htmlFor={`ws-role-${m.user_id}`}
                    >
                      <Picker
                        id={`ws-role-${m.user_id}`}
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => {
                          const role = e.target.value;
                          void (async () => {
                            const ok = await confirm({
                              title: `Make ${label} a ${role}?`,
                              body: "Their access changes immediately.",
                              confirmLabel: "Change the role",
                            });
                            if (ok) setRole.mutate({ userId: m.user_id, role, email: label });
                          })();
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Picker>
                    </Line>
                    {isOwner ? (
                      <Actions>{removeMember}</Actions>
                    ) : (
                      <Actions trailing={removeMember}>
                        <Action
                          busy={busy}
                          onClick={() => {
                            void (async () => {
                              const ok = await confirm({
                                title: "Hand this workspace over?",
                                body: `${label} becomes the owner. Whoever owns it now keeps their membership but loses the owner role.`,
                                confirmLabel: "Hand it over",
                              });
                              if (ok) transfer.mutate({ userId: m.user_id, email: label });
                            })();
                          }}
                        >
                          Hand ownership to them
                        </Action>
                      </Actions>
                    )}
                  </>
                ) : null}
              </Fragment>
            );
          })
        )}
      </Region>

      {settled.length > 0 ? (
        <Region title="What you changed">
          {settled.map((s) => (
            <Receipt
              key={s.id}
              verb={s.verb}
              consequence={s.consequence}
              failed={s.failed}
              time={s.at}
            />
          ))}
        </Region>
      ) : null}

      {/* `toggle` and not `goTo`: the control reveals the rest of the history in
          place rather than leaving for it, and `aria-expanded` is the half the
          retired `more` slot could not emit while swapping its own label. */}
      <Region
        title="What was already done here"
        sub="Every admin write against this workspace, newest first."
        toggle={
          audit.length > AUDIT_CAP
            ? openAudit
              ? "Show fewer"
              : `Show all ${audit.length}`
            : undefined
        }
        toggled={openAudit}
        onToggle={() => setOpenAudit((v) => !v)}
      >
        {audit.length === 0 ? (
          <NothingHere>
            Nothing has been done to this workspace yet. You would be the first.
          </NothingHere>
        ) : (
          shownAudit.map((r) => (
            <Row
              key={r.id}
              tight
              lead={ACTION_WORDS[r.action] ?? r.action}
              sub={auditDetail(r.payload ?? {}) ?? "No detail recorded."}
              time={r.created_at.slice(0, 16).replace("T", " ")}
            />
          ))
        )}
      </Region>
    </div>
  );
}
