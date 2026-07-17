/**
 * Admin overview: credits engine toggle + admin user management.
 *
 * Loom W2-ADMIN pass (2026-07-04): ported off the parchment classes
 * (bento/btn/light-paper hexes) to the Obsidian tokens the sibling tabs use;
 * separated query errors from empty states (register D-11: adminListAdmins
 * errors used to read as "No admins yet."); added onError paths and a
 * confirm on the charging toggle (money-consequential). Queries, mutations,
 * and data shapes are unchanged.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { Button, MonoLabel } from "@/components/obsidian";
import { AdminErrorCard, AdminSkeleton, inBandError } from "@/components/admin/admin-ui";
import {
  getPricingCatalog,
  adminSetCreditsEnabled,
  adminListAdmins,
  adminAddAdminByEmail,
  adminRemoveAdmin,
} from "@/lib/pricing.functions";
import { getBillingGoLiveReadiness } from "@/lib/payments/go-live.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function cardStyle(): React.CSSProperties {
  return {
    background: "var(--card)",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius-card)",
    padding: "var(--space-4)",
    display: "grid",
    gap: "var(--space-3)",
  };
}

function sectionTitleStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--font-sans)",
    fontWeight: 460,
    fontSize: "var(--text-card-title)",
    lineHeight: 1.3,
    color: "var(--text-primary)",
  };
}

const focusRingClass =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]";

function AdminOverview() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fGetCatalog = useServerFn(getPricingCatalog);
  const fSetFlag = useServerFn(adminSetCreditsEnabled);
  const fListAdmins = useServerFn(adminListAdmins);
  const fAddAdmin = useServerFn(adminAddAdminByEmail);
  const fRemoveAdmin = useServerFn(adminRemoveAdmin);

  const catalog = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fGetCatalog() });
  const admins = useQuery({ queryKey: ["admin-list"], queryFn: () => fListAdmins() });
  // PC-05: the runbook's manual checks as one read; report-only (the dry run).
  const fReadiness = useServerFn(getBillingGoLiveReadiness);
  const readiness = useQuery({
    queryKey: ["billing-go-live-readiness"],
    queryFn: () => fReadiness(),
  });

  const setFlag = useMutation({
    mutationFn: (enabled: boolean) => fSetFlag({ data: { enabled } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Charging setting updated.");
      qc.invalidateQueries({ queryKey: ["pricing-catalog"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the setting."),
  });

  const [email, setEmail] = useState("");
  const addAdmin = useMutation({
    mutationFn: () => fAddAdmin({ data: { email } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Admin added.");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add the admin."),
  });

  const removeAdmin = useMutation({
    mutationFn: (user_id: string) => fRemoveAdmin({ data: { user_id } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Admin removed.");
      qc.invalidateQueries({ queryKey: ["admin-list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove the admin."),
  });

  const enabled = catalog.data?.creditsEnabled ?? false;
  const adminsError = admins.isError
    ? admins.error instanceof Error
      ? admins.error.message
      : "Request failed."
    : inBandError(admins.data);
  const adminList = Array.isArray(admins.data) ? admins.data : [];

  async function onToggleClick() {
    const next = !enabled;
    const ok = await confirm({
      title: next ? "Start charging for AI use?" : "Stop charging for AI use?",
      body: next
        ? "AI calls start debiting credits from every user's monthly grant and top-up balance."
        : "AI calls stop debiting credits. Top-ups keep being recorded.",
      confirmLabel: next ? "Turn on charging" : "Turn off charging",
      destructive: true,
    });
    if (ok) setFlag.mutate(next);
  }

  async function onRemoveClick(user_id: string, adminEmail: string) {
    const ok = await confirm({
      title: `Remove ${adminEmail} as admin?`,
      body: "They will lose access to the admin console immediately.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) removeAdmin.mutate(user_id);
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={cardStyle()}>
        <MonoLabel>Charging for AI use</MonoLabel>
        {catalog.isLoading ? (
          <AdminSkeleton rows={1} height={44} />
        ) : catalog.isError ? (
          <AdminErrorCard
            what="the charging setting"
            message={catalog.error instanceof Error ? catalog.error.message : undefined}
            onRetry={() => catalog.refetch()}
          />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={sectionTitleStyle()}>Charging is {enabled ? "ON" : "OFF"}</div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-muted)",
                  margin: "4px 0 0",
                  maxWidth: 540,
                }}
              >
                When ON, AI calls debit credits from the user's monthly grant and top-up balance.
                Top-ups are always recorded; charging only applies once this is on.
              </p>
            </div>
            <Button
              variant="secondary"
              disabled={setFlag.isPending}
              onClick={() => void onToggleClick()}
            >
              {setFlag.isPending ? "Updating…" : enabled ? "Turn OFF" : "Turn ON"}
            </Button>
          </div>
        )}
      </div>

      {/* PC-05: the go-live runbook's checks, automated and report-only.
          The flip itself stays the guarded toggle above. */}
      <div style={cardStyle()}>
        <MonoLabel>Billing go-live checklist</MonoLabel>
        {readiness.isLoading ? (
          <AdminSkeleton rows={4} height={20} />
        ) : readiness.isError || (readiness.data && "error" in readiness.data) ? (
          <AdminErrorCard
            what="the go-live checklist"
            message={
              readiness.data && "error" in readiness.data
                ? readiness.data.error
                : readiness.error instanceof Error
                  ? readiness.error.message
                  : undefined
            }
            onRetry={() => readiness.refetch()}
          />
        ) : readiness.data ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={sectionTitleStyle()}>
              {readiness.data.readyToFlip
                ? "Every gate is green. The flip is safe."
                : "Not ready to flip yet."}
            </div>
            {readiness.data.checks.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    flexShrink: 0,
                    alignSelf: "center",
                    background:
                      c.status === "pass"
                        ? "var(--moss)"
                        : c.status === "warn"
                          ? // Amber = warning (status color on status, Tempo §2)
                            "var(--marigold)"
                          : "var(--madder)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {c.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-muted)",
                    minWidth: 0,
                  }}
                >
                  {c.detail}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={cardStyle()}>
        <MonoLabel>Admins</MonoLabel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) addAdmin.mutate();
          }}
          style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}
        >
          <input
            type="email"
            placeholder="email@supaprod.app"
            aria-label="Email of the user to make admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${focusRingClass} placeholder:[color:var(--text-subtle)]`}
            style={{
              flex: "1 1 280px",
              padding: "8px 10px",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--radius-control)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-base)",
              color: "var(--text-primary)",
              background: "var(--raised)",
            }}
          />
          <Button type="submit" variant="secondary" disabled={addAdmin.isPending || !email.trim()}>
            {addAdmin.isPending ? "Adding…" : "Add admin"}
          </Button>
        </form>

        <div style={{ display: "grid", gap: 6 }}>
          {admins.isLoading ? (
            <AdminSkeleton rows={2} height={36} />
          ) : adminsError ? (
            <AdminErrorCard
              what="the admin list"
              message={adminsError}
              onRetry={() => admins.refetch()}
            />
          ) : adminList.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                color: "var(--text-subtle)",
                margin: 0,
              }}
            >
              No admins yet. Add one by email above.
            </p>
          ) : (
            adminList.map((a) => (
              <div
                key={a.user_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  borderBottom: "1px solid var(--hairline)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-base)",
                    color: "var(--text-body)",
                  }}
                >
                  {a.email}
                </div>
                <Button
                  variant="secondary"
                  style={{ fontSize: 11.5, padding: "6px 10px", color: "var(--text-subtle)" }}
                  onClick={() => void onRemoveClick(a.user_id, a.email)}
                  disabled={removeAdmin.isPending || adminList.length <= 1}
                  title={adminList.length <= 1 ? "Cannot remove the last admin" : undefined}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
