/**
 * Admin layout. Gated by `has_role(auth.uid(),'admin')`. Non-admins see a
 * locked card with a one-time "claim admin" button that only succeeds when
 * the user_roles table has zero admins (the bootstrap path).
 *
 * OBS-13 - re-skinned to the room pattern (a role-gated door reached only
 * from the Settings > Workspace pane, never a nav item): the question-style
 * header, mono sub-tabs with an underline as the active signal, no lucide.
 * The 7 sub-page bodies keep their existing data/logic unchanged; only this
 * layout's chrome + labels change (Engine-Room Test: Observability -> Health,
 * AI Costs -> Spend; Pricing/People/Workspaces/Platform/Proof already read
 * as plain-words answers to "what does this room show").
 */
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Surface } from "@/components/shell/primitives";
import { Button } from "@/components/obsidian";
import { AdminErrorCard, AdminSkeleton } from "@/components/admin/admin-ui";
import { amIAdmin, bootstrapSelfAdmin } from "@/lib/pricing.functions";
import { toast } from "@/lib/notify";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin · Supaprod" }] }),
});

const TABS = [
  { id: "/admin", label: "Overview" },
  { id: "/admin/pricing", label: "Pricing" },
  { id: "/admin/people", label: "People" },
  { id: "/admin/workspaces", label: "Workspaces" },
  { id: "/admin/platform", label: "Platform" },
  { id: "/admin/routing", label: "Routing" },
  { id: "/admin/observability", label: "Health" },
  { id: "/admin/ai-costs", label: "Spend" },
  { id: "/admin/proof", label: "Proof" },
] as const;

function activeTabId(pathname: string): (typeof TABS)[number]["id"] {
  const match = TABS.find((t) => t.id !== "/admin" && pathname.startsWith(t.id));
  return match?.id ?? "/admin";
}

function AdminLayout() {
  const fAmI = useServerFn(amIAdmin);
  const me = useQuery({ queryKey: ["am-i-admin"], queryFn: () => fAmI() });
  const loc = useLocation();
  const navigate = useNavigate();
  const active = activeTabId(loc.pathname);

  return (
    // The app shell already draws the brand, the workspace scope, the live line
    // and Ask, so this surface does not draw a second header. /admin was the
    // last TopBar mount site in the product.
    <Surface wide>
      <PageHead
        title="Who runs this workspace, and what is it costing?"
        sub="Members, plans and spend. Everything here changes what other people can do."
      />
      <div>
        {me.isLoading ? (
          <AdminSkeleton rows={3} height={40} />
        ) : me.isError ? (
          // An access-check failure is an error, never a "you are not an
          // admin" verdict (register D-11: errors must not wear another
          // state's clothes).
          <AdminErrorCard
            what="your admin access"
            message={me.error instanceof Error ? me.error.message : undefined}
            onRetry={() => me.refetch()}
          />
        ) : me.data?.isAdmin ? (
          <>
            <div
              className="flex flex-wrap"
              style={{ gap: 4, borderBottom: "1px solid var(--hairline)", marginBottom: 20 }}
            >
              {TABS.map((t) => {
                const isActive = t.id === active;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate({ to: t.id })}
                    aria-current={isActive ? "page" : undefined}
                    // Color lives in classes so hover can win over the resting
                    // value (inline styles beat utilities).
                    className={`outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] ${
                      isActive
                        ? "[color:var(--text-primary)]"
                        : "[color:var(--text-subtle)] hover:[color:var(--text-primary)]"
                    }`}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-mono-label)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "8px 12px",
                      borderBottom: isActive
                        ? "2px solid var(--text-primary)"
                        : "2px solid transparent",
                      marginBottom: -1,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <Outlet />
          </>
        ) : (
          <NoAccessCard anyAdminExists={!!me.data?.anyAdminExists} />
        )}
      </div>
    </Surface>
  );
}

function NoAccessCard({ anyAdminExists }: { anyAdminExists: boolean }) {
  const qc = useQueryClient();
  const fBootstrap = useServerFn(bootstrapSelfAdmin);
  const claim = useMutation({
    mutationFn: () => fBootstrap(),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("You are now an admin.");
      qc.invalidateQueries({ queryKey: ["am-i-admin"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "20px 22px",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 20, color: "var(--text-primary)" }}>
        Admin access required
      </div>
      <p style={{ fontSize: 13, color: "var(--text-body)", margin: 0, maxWidth: 520 }}>
        The admin console manages members, roles, audit, and workspace billing. Ask a current admin
        to grant you access.
      </p>
      {!anyAdminExists ? (
        <div className="flex items-center" style={{ gap: 10 }}>
          {/* The screen's one primary CTA: the v4 top-lit ember gradient
              (DESIGN-LOOM §3), on the Button primitive so it gets the focus
              ring and press feedback (register D-40). */}
          {/* No hex overrides: the primary variant already carries the
              token-traced ember gradient (--cta-grad-top/bottom), which
              resolves in both themes. */}
          <Button variant="accent" loading={claim.isPending} onClick={() => claim.mutate()}>
            {claim.isPending ? "Claiming…" : "Claim admin · one-time setup"}
          </Button>
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-subtle)" }}
          >
            No admin exists yet. Whoever claims first becomes the first admin.
          </span>
        </div>
      ) : null}
    </div>
  );
}
