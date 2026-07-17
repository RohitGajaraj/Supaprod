/**
 * Admin Console v2 — People tab.
 * Step 2 ships the Users panel: search, drawer with identity + plan + credits
 * + workspaces + audit, and the core mutations (grant credits, reset cycle,
 * override plan, suspend/unsuspend). Invitations & Vouchers panels land in
 * subsequent steps of `docs/planning/admin-console-v2-plan.md`.
 *
 * OBS-13 chrome pass: re-skinned from parchment to Obsidian v3 (dark cockpit,
 * mono metadata, no icon set). Every query, mutation, and data shape below
 * is unchanged — only the markup, tokens, and copy-that-was-jargon changed.
 *
 * Loom W2-ADMIN pass (2026-07-04): search errors no longer read as "No users
 * match." (register D-11), the drawer shows a real error with retry instead
 * of going blank, the search is debounced (D-22), and every mutation
 * surfaces thrown failures via onError.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { MonoLabel, Button } from "@/components/obsidian";
import {
  AdminErrorCard,
  AdminSkeleton,
  inBandError,
  useDebouncedValue,
} from "@/components/admin/admin-ui";
import {
  adminSearchUsers,
  adminGetUserDetail,
  adminGrantCredits,
  adminResetCreditCycle,
  adminOverrideUserPlan,
  adminClearUserPlanOverride,
  adminSuspendUser,
  type AdminUserRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/people")({
  component: AdminPeople,
});

// Shared focus treatment: 2px ember ring, offset 2. every interactive
// element in this file uses this exact class pattern (Tempo contract SS2).
const FOCUS_RING =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]";

const SUB_TABS = [
  { id: "users", label: "Users" },
  { id: "invitations", label: "Invitations" },
  { id: "vouchers", label: "Vouchers" },
] as const;
type SubTab = (typeof SUB_TABS)[number]["id"];

function AdminPeople() {
  const [sub, setSub] = useState<SubTab>("users");
  return (
    <div style={{ marginTop: "var(--space-3)", display: "grid", gap: "var(--space-4)" }}>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-helper)",
          color: "var(--text-subtle)",
          margin: 0,
        }}
      >
        Manage who can use Cadence · grant credits · run promo campaigns
      </p>
      <div
        style={{
          display: "inline-flex",
          gap: 2,
          padding: 3,
          background: "var(--raised)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-control)",
          width: "fit-content",
        }}
      >
        {SUB_TABS.map((t) => {
          const isActive = sub === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSub(t.id)}
              aria-pressed={isActive}
              className={`${FOCUS_RING}${isActive ? "" : " [color:var(--text-subtle)] hover:[background-color:var(--hover)] hover:[color:var(--text-primary)]"}`}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-label)",
                textTransform: "uppercase",
                letterSpacing: "0.11em",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "6px",
                border: "none",
                // Inactive background lives in the hover class above; an
                // inline value would beat the utility and kill hover.
                background: isActive ? "var(--hover)" : undefined,
                color: isActive ? "var(--text-primary)" : undefined,
                cursor: "pointer",
                transitionProperty: "background-color, color",
                transitionDuration: "var(--dur-control)",
                transitionTimingFunction: "var(--ease)",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {sub === "users" ? (
        <UsersPanel />
      ) : sub === "invitations" ? (
        <InvitationsPanel />
      ) : (
        <VouchersPanel />
      )}
    </div>
  );
}

import { InvitationsPanel } from "@/components/admin/InvitationsPanel";
import { VouchersPanel } from "@/components/admin/VouchersPanel";

function UsersPanel() {
  const fSearch = useServerFn(adminSearchUsers);
  const [q, setQ] = useState("");
  // One query per pause, not per keystroke (register D-22).
  const debouncedQ = useDebouncedValue(q);
  const [selected, setSelected] = useState<string | null>(null);
  const search = useQuery({
    queryKey: ["admin-users", debouncedQ],
    queryFn: () => fSearch({ data: { q: debouncedQ, limit: 50, offset: 0 } }),
  });

  // A failed search must never wear the empty state's clothes (D-11): the
  // server fn returns errors in-band, so check both the thrown and the
  // in-band shape before deciding "no users match".
  const searchError = search.isError
    ? search.error instanceof Error
      ? search.error.message
      : "Request failed."
    : inBandError(search.data);

  const rows = useMemo<AdminUserRow[]>(() => {
    const d = search.data;
    if (!d || "error" in (d as object)) return [];
    return d as AdminUserRow[];
  }, [search.data]);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "var(--space-4)",
        display: "grid",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or display name…"
          aria-label="Search users by email or display name"
          className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
          style={{
            flex: 1,
            padding: "var(--space-2) var(--space-3)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            background: "var(--raised)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-base)",
          }}
        />
        <MonoLabel tone="muted">
          {search.isLoading ? "Loading…" : searchError ? "search failed" : `${rows.length} users`}
        </MonoLabel>
      </div>
      {search.isLoading ? (
        <AdminSkeleton rows={5} height={44} />
      ) : searchError ? (
        <AdminErrorCard what="users" message={searchError} onRetry={() => search.refetch()} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hairline-strong)" }}>
                <th style={th()}>Email</th>
                <th style={th()}>Name</th>
                <th style={th()}>Plan</th>
                <th style={th()}>Credits</th>
                <th style={th()}>Suspended</th>
                <th style={th()}>Joined</th>
                <th style={th()}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.user_id}
                  className="hover:[background-color:var(--hover)]"
                  style={{
                    borderTop: "1px solid var(--hairline)",
                    transitionProperty: "background-color",
                    transitionDuration: "var(--dur-control)",
                    transitionTimingFunction: "var(--ease)",
                  }}
                >
                  <td style={{ ...td(), color: "var(--text-primary)" }}>{r.email}</td>
                  <td style={td()}>{r.display_name ?? "-"}</td>
                  <td style={{ ...td(), textTransform: "capitalize" }}>{r.plan_tier}</td>
                  <td
                    style={{
                      ...td(),
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {r.balance_credits.toLocaleString()}
                  </td>
                  <td
                    style={{
                      ...td(),
                      color: r.suspended ? "var(--madder)" : "var(--text-body)",
                    }}
                  >
                    {r.suspended ? "yes" : "no"}
                  </td>
                  <td
                    style={{
                      ...td(),
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-helper)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td style={td()}>
                    <Button variant="quiet" onClick={() => setSelected(r.user_id)}>
                      Open →
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "var(--space-4)",
                      textAlign: "center",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-base)",
                      color: "var(--text-subtle)",
                    }}
                  >
                    No users match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      <UserDrawer userId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function th(): React.CSSProperties {
  return {
    padding: "var(--space-2) var(--space-3)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-mono-label)",
    letterSpacing: "0.11em",
    textTransform: "uppercase",
    textAlign: "left",
    fontWeight: 500,
    color: "var(--text-subtle)",
  };
}
function td(): React.CSSProperties {
  return {
    padding: "var(--space-3)",
    verticalAlign: "middle",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-base)",
    color: "var(--text-body)",
  };
}

type UserDetail = {
  user?: { id: string; email: string; created_at: string; last_sign_in_at: string | null };
  profile?: { suspended?: boolean; display_name?: string };
  accounts?: Array<{
    id: string;
    plan_tier: string;
    balance_credits: number;
    monthly_grant_credits: number;
    topup_credits: number;
  }>;
  workspaces?: Array<{ id: string; name: string; role: string }>;
  subscription?: {
    plan_tier?: string;
    plan_override_tier?: string | null;
    plan_override_expires_at?: string | null;
    plan_override_reason?: string | null;
  };
  audit?: Array<{
    id: string;
    action: string;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
};

function UserDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fDetail = useServerFn(adminGetUserDetail);
  const fGrant = useServerFn(adminGrantCredits);
  const fReset = useServerFn(adminResetCreditCycle);
  const fOverride = useServerFn(adminOverrideUserPlan);
  const fClear = useServerFn(adminClearUserPlanOverride);
  const fSuspend = useServerFn(adminSuspendUser);

  const detail = useQuery({
    queryKey: ["admin-user-detail", userId],
    enabled: !!userId,
    queryFn: async () => {
      const r = await fDetail({ data: { userId: userId! } });
      if ("error" in r) throw new Error(r.error);
      return JSON.parse(r.json) as UserDetail;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  // Every mutation also handles the thrown (network/transport) failure path:
  // a failed admin action must never end in silence (register D-11).
  const mutationFailed = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "The action failed. Nothing was changed.");

  const grant = useMutation({
    mutationFn: (vars: { delta: number; reason: string }) =>
      fGrant({ data: { userId: userId!, delta: vars.delta, reason: vars.reason } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success(`Balance now ${r.balance.toLocaleString()}`);
      invalidate();
    },
    onError: mutationFailed,
  });
  const reset = useMutation({
    mutationFn: () => fReset({ data: { userId: userId! } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Monthly cycle reset.");
      invalidate();
    },
    onError: mutationFailed,
  });
  const override = useMutation({
    mutationFn: (vars: { planTier: string; expiresAt: string | null; reason: string }) =>
      fOverride({ data: { userId: userId!, ...vars } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Plan override saved.");
      invalidate();
    },
    onError: mutationFailed,
  });
  const clearOverride = useMutation({
    mutationFn: () => fClear({ data: { userId: userId! } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Override cleared.");
      invalidate();
    },
    onError: mutationFailed,
  });
  const suspend = useMutation({
    mutationFn: (vars: { suspend: boolean; reason: string }) =>
      fSuspend({ data: { userId: userId!, ...vars } }),
    onSuccess: (r, vars) => {
      if ("error" in r) return toast.error(r.error);
      toast.success(vars.suspend ? "Account suspended." : "Account restored.");
      invalidate();
    },
    onError: mutationFailed,
  });

  const d = detail.data;

  return (
    <Sheet open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        style={{
          width: "min(560px, 100vw)",
          overflow: "auto",
          backgroundColor: "var(--card)",
        }}
      >
        <SheetHeader>
          <SheetTitle
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 460,
              fontSize: "var(--text-card-title)",
              lineHeight: 1.3,
              color: "var(--text-primary)",
            }}
          >
            {d?.user?.email ?? "User"}
          </SheetTitle>
        </SheetHeader>
        {detail.isLoading ? (
          <div style={{ marginTop: "var(--space-4)" }}>
            <AdminSkeleton rows={5} height={40} />
          </div>
        ) : detail.isError ? (
          // A failed detail read used to leave the drawer blank (D-11).
          <div style={{ marginTop: "var(--space-4)" }}>
            <AdminErrorCard
              what="this user"
              message={detail.error instanceof Error ? detail.error.message : undefined}
              onRetry={() => detail.refetch()}
            />
          </div>
        ) : !d ? null : (
          <div style={{ marginTop: "var(--space-4)", display: "grid", gap: "var(--space-6)" }}>
            <section>
              <MonoLabel style={{ display: "block", marginBottom: "var(--space-2)" }}>
                Identity
              </MonoLabel>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-base)",
                  color: "var(--text-body)",
                  display: "grid",
                  gap: "var(--space-1)",
                }}
              >
                <div>Name · {d.profile?.display_name ?? "-"}</div>
                <div>Joined · {d.user?.created_at?.slice(0, 10)}</div>
                <div>Last sign-in · {d.user?.last_sign_in_at?.slice(0, 10) ?? "never"}</div>
                <div>
                  Suspended ·{" "}
                  <span
                    style={{ color: d.profile?.suspended ? "var(--madder)" : "var(--text-body)" }}
                  >
                    {d.profile?.suspended ? "yes" : "no"}
                  </span>
                </div>
              </div>
            </section>

            <section>
              <MonoLabel style={{ display: "block", marginBottom: "var(--space-2)" }}>
                Plan & override
              </MonoLabel>
              {d.subscription ? (
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-base)",
                    color: "var(--text-body)",
                    display: "grid",
                    gap: "var(--space-1)",
                  }}
                >
                  <div>Base plan · {d.subscription.plan_tier ?? "-"}</div>
                  <div>Override tier · {d.subscription.plan_override_tier ?? "-"}</div>
                  <div>
                    Override expires ·{" "}
                    {d.subscription.plan_override_expires_at?.slice(0, 10) ?? "-"}
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-subtle)",
                  }}
                >
                  No subscription row.
                </p>
              )}
              <PlanOverrideForm
                pending={override.isPending}
                onSubmit={(planTier, days, reason) => {
                  const expiresAt =
                    days > 0 ? new Date(Date.now() + days * 86400_000).toISOString() : null;
                  override.mutate({ planTier, expiresAt, reason });
                }}
                onClear={() => clearOverride.mutate()}
                clearPending={clearOverride.isPending}
              />
            </section>

            <section>
              <MonoLabel style={{ display: "block", marginBottom: "var(--space-2)" }}>
                Credits
              </MonoLabel>
              {(d.accounts ?? []).map((a) => (
                <div
                  key={a.id}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-helper)",
                    color: "var(--text-muted)",
                  }}
                >
                  Account {a.id.slice(0, 8)} · balance{" "}
                  <span style={{ color: "var(--text-primary)" }}>
                    {a.balance_credits.toLocaleString()}
                  </span>{" "}
                  · cycle {a.monthly_grant_credits.toLocaleString()} · topup{" "}
                  {a.topup_credits.toLocaleString()}
                </div>
              ))}
              <GrantCreditsForm
                pending={grant.isPending}
                onSubmit={(delta, reason) => grant.mutate({ delta, reason })}
              />
              <Button
                variant="secondary"
                style={{ marginTop: "var(--space-2)" }}
                disabled={reset.isPending}
                onClick={async () => {
                  const ok = await confirm({
                    title: "Reset monthly cycle?",
                    body: "Clears this month's grant counter. One-time top-ups are preserved.",
                    confirmLabel: "Reset cycle",
                  });
                  if (ok) reset.mutate();
                }}
              >
                Reset monthly cycle
              </Button>
            </section>

            <section>
              <MonoLabel style={{ display: "block", marginBottom: "var(--space-2)" }}>
                Workspaces
              </MonoLabel>
              {(d.workspaces ?? []).length === 0 ? (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-subtle)",
                  }}
                >
                  Not in any workspaces.
                </p>
              ) : (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "var(--space-4)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-base)",
                    color: "var(--text-body)",
                    display: "grid",
                    gap: "var(--space-1)",
                  }}
                >
                  {(d.workspaces ?? []).map((w) => (
                    <li key={w.id}>
                      {w.name} ·{" "}
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-mono-label)",
                          letterSpacing: "0.11em",
                          textTransform: "uppercase",
                          color: "var(--text-subtle)",
                        }}
                      >
                        {w.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <MonoLabel style={{ display: "block", marginBottom: "var(--space-2)" }}>
                Access
              </MonoLabel>
              <Button
                variant="secondary"
                disabled={suspend.isPending}
                onClick={async () => {
                  const isSuspended = d.profile?.suspended;
                  const ok = await confirm({
                    title: isSuspended ? "Restore sign-in?" : "Suspend sign-in?",
                    body: isSuspended
                      ? "User regains the ability to sign in."
                      : "User is blocked from new sign-ins. Existing sessions stay until they expire.",
                    confirmLabel: isSuspended
                      ? "Restore · allows sign-in"
                      : "Suspend · blocks sign-in",
                    destructive: !isSuspended,
                  });
                  if (ok) suspend.mutate({ suspend: !isSuspended, reason: "" });
                }}
              >
                {d.profile?.suspended ? "Restore · allows sign-in" : "Suspend · blocks sign-in"}
              </Button>
            </section>

            <section>
              <MonoLabel style={{ display: "block", marginBottom: "var(--space-2)" }}>
                Recent audit
              </MonoLabel>
              {(d.audit ?? []).length === 0 ? (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-subtle)",
                  }}
                >
                  No prior admin actions.
                </p>
              ) : (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "var(--space-4)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-helper)",
                    color: "var(--text-faint)",
                    display: "grid",
                    gap: "var(--space-1)",
                  }}
                >
                  {(d.audit ?? []).slice(0, 10).map((row) => (
                    <li key={row.id}>
                      <span style={{ color: "var(--text-primary)" }}>{row.action}</span> ·{" "}
                      {row.created_at.slice(0, 16).replace("T", " ")}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function GrantCreditsForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (delta: number, reason: string) => void;
}) {
  const [delta, setDelta] = useState(100);
  const [reason, setReason] = useState("Admin grant");
  const fieldStyle: React.CSSProperties = {
    padding: "6px 10px",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius-control)",
    background: "var(--raised)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-sm)",
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!Number.isFinite(delta) || delta === 0) return;
        onSubmit(Math.trunc(delta), reason || "Admin grant");
      }}
      style={{
        display: "flex",
        gap: "var(--space-2)",
        marginTop: "var(--space-2)",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <input
        type="number"
        value={delta}
        onChange={(e) => setDelta(Number(e.target.value))}
        aria-label="Credits to grant"
        className={FOCUS_RING}
        style={{ ...fieldStyle, width: 100 }}
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        aria-label="Reason for the credit grant"
        className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
        style={{ ...fieldStyle, flex: 1, minWidth: 160 }}
      />
      {/*
        Native submit button (kept out of the Button primitive on purpose):
        this form relies on the browser's implicit type="submit" behavior to
        fire onSubmit above. The Button primitive hardcodes type="button",
        which would silently break the grant action. Hand-styled to match
        Button's "secondary" look exactly.
      */}
      <button
        disabled={pending}
        className={`relative inline-flex items-center justify-center gap-2 ${FOCUS_RING} hover:[background-color:var(--surface-2)] active:scale-[0.985] disabled:cursor-default disabled:opacity-45`}
        style={{
          fontFamily: "var(--font-sans)",
          borderRadius: "var(--radius-control)",
          backgroundColor: "var(--hover)",
          color: "var(--text-primary)",
          fontSize: "13px",
          fontWeight: 500,
          padding: "8px 18px",
          border: "1px solid var(--hairline-strong)",
          transitionProperty: "background-color, color, transform, opacity",
          transitionDuration: "var(--dur-control)",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        {pending ? "Granting…" : `Grant ${delta} · adds to balance`}
      </button>
    </form>
  );
}

function PlanOverrideForm({
  pending,
  onSubmit,
  onClear,
  clearPending,
}: {
  pending: boolean;
  onSubmit: (planTier: string, days: number, reason: string) => void;
  onClear: () => void;
  clearPending: boolean;
}) {
  const [tier, setTier] = useState("max");
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const fieldStyle: React.CSSProperties = {
    padding: "6px 10px",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius-control)",
    background: "var(--raised)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-sm)",
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(tier, days, reason);
      }}
      style={{
        display: "flex",
        gap: "var(--space-2)",
        marginTop: "var(--space-2)",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <select
        value={tier}
        onChange={(e) => setTier(e.target.value)}
        aria-label="Override plan tier"
        className={FOCUS_RING}
        style={fieldStyle}
      >
        <option value="free">free</option>
        <option value="pro">pro</option>
        <option value="max">max</option>
        <option value="team">team</option>
        <option value="enterprise">enterprise</option>
      </select>
      <input
        type="number"
        value={days}
        min={0}
        onChange={(e) => setDays(Number(e.target.value))}
        aria-label="Override duration in days"
        className={FOCUS_RING}
        style={{ ...fieldStyle, width: 80 }}
      />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-helper)",
          color: "var(--text-subtle)",
        }}
      >
        days (0 = no expiry)
      </span>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        aria-label="Reason for the plan override"
        className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
        style={{ ...fieldStyle, flex: 1, minWidth: 160 }}
      />
      {/* Native submit button — see the comment in GrantCreditsForm above;
          same reasoning applies (this form's onSubmit relies on it). */}
      <button
        disabled={pending}
        className={`relative inline-flex items-center justify-center gap-2 ${FOCUS_RING} hover:[background-color:var(--surface-2)] active:scale-[0.985] disabled:cursor-default disabled:opacity-45`}
        style={{
          fontFamily: "var(--font-sans)",
          borderRadius: "var(--radius-control)",
          backgroundColor: "var(--hover)",
          color: "var(--text-primary)",
          fontSize: "13px",
          fontWeight: 500,
          padding: "8px 18px",
          border: "1px solid var(--hairline-strong)",
          transitionProperty: "background-color, color, transform, opacity",
          transitionDuration: "var(--dur-control)",
          transitionTimingFunction: "var(--ease)",
        }}
      >
        {pending ? "Saving…" : "Override · temporary plan"}
      </button>
      <Button variant="quiet" onClick={onClear} disabled={clearPending}>
        Clear override
      </Button>
    </form>
  );
}
