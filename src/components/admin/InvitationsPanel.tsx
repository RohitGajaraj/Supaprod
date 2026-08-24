/**
 * People · Invitations panel: single + bulk invitations, revoke,
 * auto-approve domain rules, and the pending signup-approvals queue.
 *
 * Loom W2-ADMIN pass (2026-07-04): ported off the parchment classes
 * (bento/btn/--ink-* hexes) to the Obsidian tokens the parent People tab
 * uses; list errors render as errors with retry, never as "No invitations
 * yet." (register D-11); every mutation checks the in-band `{error}` result
 * and surfaces thrown failures. Queries, mutations, and data shapes are
 * unchanged.
 *
 * MERIDIAN COLOUR PORT, 2026-08-22. The Obsidian tokens that Loom pass moved
 * this file ONTO are themselves retired now, so the paragraph above is a record
 * of a migration that has since been superseded rather than a description of
 * what this file draws. 18 occurrences are gone and it carries none.
 *
 * Straight mapping throughout, because this panel has no status colour in it:
 * ink, mute and edge. Two calls were not the table:
 *   - the text input's border is `--mrd-field`, not `--mrd-edge`. Meridian has
 *     a token for a form control at rest, measured against that control's own
 *     fill, and `forms.tsx` draws every Meridian input with it. Using the
 *     generic edge here would have been a near-match that the system already
 *     has a better word for.
 *   - "Reject" stays `--mrd-mute` and does not become `--mrd-stop`. It is a
 *     verdict on a queued request, not a control that halts work in progress,
 *     and it was a quiet secondary control before this change.
 *
 * Spacing was deliberately left alone: `--space-*` is not retired vocabulary,
 * and nobody can look at an authenticated admin surface in the session this was
 * ported in, so nothing here was allowed to move.
 */
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { MonoLabel } from "@/components/supaprod/Primitives";
import { Action, Approve } from "@/components/meridian/surface-parts";
import { AdminErrorCard, AdminSkeleton, inBandError } from "@/components/admin/admin-ui";
import {
  adminListInvitations,
  adminCreateInvitation,
  adminBulkCreateInvitations,
  adminRevokeInvitation,
  adminListAutoApproveDomains,
  adminUpsertAutoApproveDomain,
  adminDeleteAutoApproveDomain,
  adminListSignupApprovals,
  adminReviewSignupApproval,
  type AdminInvitation,
  type AutoApproveDomain,
  type SignupApproval,
} from "@/lib/admin-invitations.functions";

const FOCUS_RING =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]";

const mutationFailed = (e: unknown) =>
  toast.error(e instanceof Error ? e.message : "The action failed. Nothing was changed.");

function queryError(q: { isError: boolean; error: unknown; data: unknown }): string | null {
  if (q.isError) return q.error instanceof Error ? q.error.message : "Request failed.";
  return inBandError(q.data);
}

export function InvitationsPanel() {
  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <InviteCreator />
      <InviteList />
      <DomainList />
      <SignupApprovalsList />
    </div>
  );
}

function InviteCreator() {
  const qc = useQueryClient();
  const fCreate = useServerFn(adminCreateInvitation);
  const fBulk = useServerFn(adminBulkCreateInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [csv, setCsv] = useState("");

  const single = useMutation({
    mutationFn: () => fCreate({ data: { email, workspaceId: null, role, expiresDays: 14 } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success(`Invitation sent · ${r.email}`);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
    onError: mutationFailed,
  });
  const bulk = useMutation({
    mutationFn: () => {
      const rows = csv
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((email) => ({ email, role }));
      return fBulk({ data: { rows } });
    },
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success(`${r.created} invitations created`);
      setCsv("");
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
    onError: mutationFailed,
  });

  return (
    <div className="material-medium" style={card()}>
      <MonoLabel>New invitation</MonoLabel>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          aria-label="Email address"
          className={`${FOCUS_RING} placeholder:[color:var(--mrd-mute)]`}
          style={input(220)}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Role for this invitation"
          className={FOCUS_RING}
          style={input(120)}
        >
          <option value="member">member</option>
          <option value="admin">admin</option>
          <option value="owner">owner</option>
        </select>
        {/* TIER: Action, primary face. Creates the invitation - the card's whole point. */}
        <Action
          variant="primary"
          disabled={!email}
          busy={single.isPending}
          onClick={() => single.mutate()}
        >
          {single.isPending ? "Sending…" : "Create invitation · emails link"}
        </Action>
      </div>
      <MonoLabel style={{ marginTop: 6 }}>Bulk CSV (one email per line)</MonoLabel>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={4}
        placeholder={"alice@co.com\nbob@co.com"}
        aria-label="Email addresses, one per line"
        className={`${FOCUS_RING} placeholder:[color:var(--mrd-mute)]`}
        style={{ ...input(), width: "100%", fontFamily: "var(--mrd-mono)" }}
      />
      {/* TIER: Action, default face. Bulk write - a secondary path beside the
          single create above. */}
      <Action
        variant="default"
        disabled={!csv.trim()}
        busy={bulk.isPending}
        style={{ justifySelf: "start" }}
        onClick={() => bulk.mutate()}
      >
        {bulk.isPending ? "Creating…" : "Create from CSV"}
      </Action>
    </div>
  );
}

function InviteList() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fList = useServerFn(adminListInvitations);
  const fRevoke = useServerFn(adminRevokeInvitation);
  const list = useQuery({
    queryKey: ["admin-invitations"],
    queryFn: () => fList({ data: { state: null, limit: 100, offset: 0 } }),
  });
  const listError = queryError(list);
  const rows: AdminInvitation[] = Array.isArray(list.data) ? (list.data as AdminInvitation[]) : [];
  const revoke = useMutation({
    mutationFn: (id: string) => fRevoke({ data: { id } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Invitation revoked");
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
    onError: mutationFailed,
  });

  return (
    <div className="material-medium" style={card()}>
      <MonoLabel>Invitations · {list.isLoading ? "…" : rows.length}</MonoLabel>
      {list.isLoading ? (
        <AdminSkeleton rows={3} height={38} />
      ) : listError ? (
        <AdminErrorCard what="invitations" message={listError} onRetry={() => list.refetch()} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th()}>Email</th>
                <th style={th()}>Role</th>
                <th style={th()}>State</th>
                <th style={th()}>Expires</th>
                <th style={th()}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--mrd-edge)" }}>
                  <td style={{ ...td(), color: "var(--mrd-ink)" }}>{r.email}</td>
                  <td style={td()}>{r.role}</td>
                  <td style={td()}>{r.state}</td>
                  <td style={td()}>{r.expires_at?.slice(0, 10)}</td>
                  <td style={td()}>
                    {r.state === "pending" ? (
                      // TIER: Action, destructive face. Revokes the link - a removal.
                      <Action
                        variant="destructive"
                        busy={revoke.isPending}
                        style={{ padding: "6px 10px" }}
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Revoke invitation?",
                            body: `${r.email} will no longer be able to accept.`,
                            confirmLabel: "Revoke · invalidates link",
                            destructive: true,
                          });
                          if (ok) revoke.mutate(r.id);
                        }}
                      >
                        Revoke
                      </Action>
                    ) : null}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "var(--space-3)",
                      textAlign: "center",
                      fontFamily: "var(--mrd-font)",
                      color: "var(--mrd-mute)",
                    }}
                  >
                    No invitations yet. Create one above to bring someone in.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DomainList() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fList = useServerFn(adminListAutoApproveDomains);
  const fUpsert = useServerFn(adminUpsertAutoApproveDomain);
  const fDelete = useServerFn(adminDeleteAutoApproveDomain);
  const list = useQuery({ queryKey: ["admin-domains"], queryFn: () => fList() });
  const listError = queryError(list);
  const rows: AutoApproveDomain[] = Array.isArray(list.data)
    ? (list.data as AutoApproveDomain[])
    : [];

  const [domain, setDomain] = useState("");
  const [role, setRole] = useState("member");
  const upsert = useMutation({
    mutationFn: () => fUpsert({ data: { domain, workspaceId: null, role } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success(`Auto-approve added · ${r.domain}`);
      setDomain("");
      qc.invalidateQueries({ queryKey: ["admin-domains"] });
    },
    onError: mutationFailed,
  });
  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Domain removed");
      qc.invalidateQueries({ queryKey: ["admin-domains"] });
    },
    onError: mutationFailed,
  });

  return (
    <div className="material-medium" style={card()}>
      <MonoLabel>Auto-approve email domains</MonoLabel>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="acme.com"
          aria-label="Email domain"
          className={`${FOCUS_RING} placeholder:[color:var(--mrd-mute)]`}
          style={input(200)}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Default role for this domain"
          className={FOCUS_RING}
          style={input(120)}
        >
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>
        {/* TIER: Action, primary face. Upserts the auto-approve rule - the card's
            whole point. */}
        <Action
          variant="primary"
          disabled={!domain}
          busy={upsert.isPending}
          onClick={() => upsert.mutate()}
        >
          {upsert.isPending ? "Saving…" : "Add domain · auto-accepts signups"}
        </Action>
      </div>
      {list.isLoading ? (
        <AdminSkeleton rows={2} height={30} />
      ) : listError ? (
        <AdminErrorCard
          what="the domain rules"
          message={listError}
          onRetry={() => list.refetch()}
        />
      ) : rows.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--mrd-font)",
            color: "var(--mrd-mute)",
            margin: 0,
          }}
        >
          No domains configured. All signups go to manual review.
        </p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 4 }}>
          {rows.map((d) => (
            <li
              key={d.id}
              style={{
                fontFamily: "var(--mrd-font)",
                color: "var(--mrd-ink)",
                display: "flex",
                gap: "var(--space-2)",
                alignItems: "center",
              }}
            >
              <code style={{ fontFamily: "var(--mrd-mono)", color: "var(--mrd-ink)" }}>
                {d.domain}
              </code>{" "}
              · {d.default_role}
              {/* TIER: Action, destructive face. Deletes the domain rule. */}
              <Action
                variant="destructive"
                busy={del.isPending}
                style={{ marginLeft: "auto", padding: "6px 10px" }}
                onClick={async () => {
                  const ok = await confirm({
                    title: "Remove domain?",
                    body: `Future signups from @${d.domain} go back to manual review.`,
                    confirmLabel: "Remove",
                    destructive: true,
                  });
                  if (ok) del.mutate(d.id);
                }}
              >
                Remove
              </Action>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SignupApprovalsList() {
  const qc = useQueryClient();
  const fList = useServerFn(adminListSignupApprovals);
  const fReview = useServerFn(adminReviewSignupApproval);
  const list = useQuery({
    queryKey: ["admin-signup-approvals"],
    queryFn: () => fList({ data: { state: "pending" } }),
  });
  const listError = queryError(list);
  const rows: SignupApproval[] = Array.isArray(list.data) ? (list.data as SignupApproval[]) : [];

  const review = useMutation({
    mutationFn: (vars: { id: string; approve: boolean }) =>
      fReview({ data: { id: vars.id, approve: vars.approve, note: "" } }),
    onSuccess: (r, vars) => {
      if ("error" in r) return toast.error(r.error);
      toast.success(vars.approve ? "Signup approved." : "Signup rejected.");
      qc.invalidateQueries({ queryKey: ["admin-signup-approvals"] });
    },
    onError: mutationFailed,
  });

  return (
    <div className="material-medium" style={card()}>
      <MonoLabel>Pending signup approvals · {list.isLoading ? "…" : rows.length}</MonoLabel>
      {list.isLoading ? (
        <AdminSkeleton rows={2} height={34} />
      ) : listError ? (
        <AdminErrorCard what="pending signups" message={listError} onRetry={() => list.refetch()} />
      ) : rows.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--mrd-font)",
            color: "var(--mrd-mute)",
            margin: 0,
          }}
        >
          Nothing waiting.
        </p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 6 }}>
          {rows.map((s) => (
            <li
              key={s.id}
              style={{
                display: "flex",
                gap: "var(--space-2)",
                alignItems: "center",
                fontFamily: "var(--mrd-font)",
                color: "var(--mrd-ink)",
              }}
            >
              {s.email} · {new Date(s.created_at).toLocaleDateString()}
              {/* TIER: Approve. Releases a signup held in review - access stays
                  blocked until it lands. */}
              <Approve
                busy={review.isPending}
                style={{ marginLeft: "auto", padding: "6px 10px" }}
                onClick={() => review.mutate({ id: s.id, approve: true })}
              >
                Approve · grants access
              </Approve>
              {/* TIER: Action, default face. The negative verdict settles the
                  request; one release control per row stays orchid. */}
              <Action
                busy={review.isPending}
                style={{ padding: "6px 10px", color: "var(--mrd-mute)" }}
                onClick={() => review.mutate({ id: s.id, approve: false })}
              >
                Reject
              </Action>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Radius/border/shadow come from the material-medium preset class applied at each
// call site; this helper now supplies layout only (Tempo materials law).
function card(): React.CSSProperties {
  return {
    padding: "var(--space-4)",
    display: "grid",
    gap: "var(--space-3)",
  };
}
function input(width?: number): React.CSSProperties {
  return {
    padding: "8px 10px",
    border: "1px solid var(--mrd-field)",
    borderRadius: "var(--radius-control)",
    background: "var(--mrd-lift)",
    color: "var(--mrd-ink)",
    fontFamily: "var(--mrd-font)",
    width,
  };
}
function th(): React.CSSProperties {
  return {
    padding: "8px 10px",
    fontFamily: "var(--mrd-mono)",
    letterSpacing: "0.11em",
    textTransform: "uppercase",
    textAlign: "left",
    fontWeight: 400,
    color: "var(--mrd-mute)",
    borderBottom: "1px solid var(--mrd-edge)",
  };
}
function td(): React.CSSProperties {
  return {
    padding: "10px",
    verticalAlign: "middle",
    fontFamily: "var(--mrd-font)",
    color: "var(--mrd-ink)",
  };
}
