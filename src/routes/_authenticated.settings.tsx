// Settings — screen 5 wave B of the Ember Editorial migration, ported from
// design-reference/supaprod/loop.jsx (SettingsScreen, lines 966–1071): mono
// kicker "Workspace", serif h1, hairline TabRow. Production functionality
// rides the reference layout: the ?section= search-param contract (legacy
// brief→workspace, calendar→connections deep links keep landing), the
// OAuth-only AccountConnectionsSection (founder law 2026-06-12 — Connect-
// button OAuth only, no key paste for connectors), profile/brief/voice-anchor
// saves, and BYO AI keys (not connectors — they stay under Models).
// Reference Digest tab omitted: no digest-routing backend (no-filler law).
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentBlurb, agentDisplayName, catalogEntry } from "@/lib/agent-vocabulary";
import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/notify";
import { TopBar } from "@/components/supaprod/TopBar";
import { MonoLabel } from "@/components/supaprod/Primitives";
import {
  Avatar,
  orbBackground,
  AVATAR_VARIANTS,
  defaultAvatarVariant,
} from "@/components/supaprod/Avatar";
import { useAvatarChoice } from "@/hooks/use-avatar-choice";
import { MonoLabel as ObsidianMonoLabel, Button as ObsidianButton } from "@/components/obsidian";
import { useDensity } from "@/hooks/use-density";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { Sun, Moon, Monitor, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { listAgents, setAgentToolCap } from "@/lib/agents.functions";
import { MODELS, AUTO_MODEL } from "@/lib/ai/models";
import {
  listApiKeys,
  saveApiKey,
  deleteApiKey,
  testApiKey,
  BYO_PROVIDERS,
} from "@/lib/byokeys.functions";
import { getActiveBrief, upsertBrief, type WorkspaceBrief } from "@/lib/briefs.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  AccountConnectionsSection,
  ConnectorDetail,
} from "@/components/connections/AccountConnectionsSection";
import { listWorkspaceBindings } from "@/lib/connections.functions";
import { CONNECTOR_REGISTRY, type ProviderId, type ProviderSpec } from "@/lib/connectors/registry";
import { relTimeCaps } from "@/components/discover/format";
import { getBillingState, type BillingState } from "@/lib/billing.functions";
import {
  getMySubscription,
  cancelMySubscription,
  resumeMySubscription,
  createPortalSession,
  getMyCreditsView,
  getCreditAttribution,
} from "@/lib/payments.functions";
import { planPresentation, type PlanTier } from "@/lib/entitlements";
import { amIAdmin } from "@/lib/pricing.functions";
import { StripeEmbeddedCheckout } from "@/components/billing/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/billing/PaymentTestModeBanner";
import { getStripeEnvironment } from "@/lib/stripe";
import { useConfirm } from "@/hooks/use-confirm";
import { PlanTable, TIER_ICON } from "@/components/billing/PlanPicker";
import { CreditCapsCard } from "@/components/billing/CreditCapsCard";
import { UsageIndicator } from "@/components/billing/UsageIndicator";
import { getPricingCatalog } from "@/lib/pricing.functions";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { ProductsTab } from "@/components/settings/ProductsTab";
import { DataExportCard } from "@/components/settings/DataExportCard";
import { SkillsFileExportCard } from "@/components/settings/SkillsFileExportCard";
import { ValueReceiptsCard } from "@/components/settings/ValueReceiptsCard";
import { SubprocessorsCard } from "@/components/settings/SubprocessorsCard";
import { DataSubstrateCard } from "@/components/settings/DataSubstrateCard";
import { HealthCard } from "@/components/settings/HealthCard";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { MemoryView } from "@/components/settings/memory/MemoryView";
import { RedeemCodeCard } from "@/components/settings/RedeemCodeCard";
import { MembersCard } from "@/components/settings/MembersCard";
import { TeamCard } from "@/components/settings/TeamCard";
import { ControlsPanel } from "@/components/governance/ControlsPanel";
import {
  PRIMARY_GROUPS,
  RECESSED_GROUPS,
  normalizeSection,
  groupForSection,
  findGroup,
  primarySection,
  sectionLabel,
  type SectionId,
  type GroupId,
} from "@/lib/settings-sections";

// The section ids, grouping, legacy deep-link map, and normalizeSection now live
// in the pure, unit-tested @/lib/settings-sections module (SETTINGS-SEGREGATE,
// v11 #13): the 11 flat tabs are presented as 5 calm groups + a recessed
// Advanced group, while every ?section= id is preserved unchanged so existing
// deep links keep landing. "ai" stays the id behind the Models label; Workspace
// is production-only; "connections" is the account-level OAuth surface
// (deliberately not "Connectors", to not collide with the /sync surface).

// ?connector= drill param (screen 6) — only registry keys for user-facing
// providers open the detail; anything else falls back to the normal list.
function normalizeConnector(raw: string | undefined): ProviderId | undefined {
  if (!raw) return undefined;
  const spec = (CONNECTOR_REGISTRY as Record<string, ProviderSpec | undefined>)[raw];
  return spec && spec.userFacing !== false ? spec.id : undefined;
}

export const Route = createFileRoute("/_authenticated/settings")({
  // The canonical param is ?section=; ?tab= is a legacy alias that older links
  // and external deep links still send (audit D-20: ?tab=plan was silently
  // ignored). Both are accepted; section wins when both arrive.
  validateSearch: (
    search: Record<string, unknown>,
  ): { section?: string; tab?: string; connector?: string; checkout?: string } => ({
    section: typeof search.section === "string" ? search.section : undefined,
    tab: typeof search.tab === "string" ? search.tab : undefined,
    connector: typeof search.connector === "string" ? search.connector : undefined,
    checkout: typeof search.checkout === "string" ? search.checkout : undefined,
  }),
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · Supaprod" }] }),
  errorComponent: ({ error, reset }) => (
    <>
      <div style={{ padding: "30px 44px 56px", maxWidth: 980, margin: "0 auto" }}>
        <div className="bento" style={{ padding: 24 }}>
          <div className="mono-label" style={{ color: "var(--rose)" }}>
            Couldn't load Settings
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8, maxWidth: 480 }}>
            {(error as Error)?.message ?? "Unknown error"}
          </p>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={reset}>
            Retry
          </button>
        </div>
      </div>
    </>
  ),
});

// OBS-13 - the quiet left index (mono 01-04 + label), the Settings nav
// anatomy: a column inside the content area, NOT a second rail. Active row
// bg #1A1A1E + ember index, per the OBS-02 nav anatomy this mirrors.
function SettingsIndex({
  activeGroup,
  onSet,
}: {
  activeGroup: GroupId;
  onSet: (id: GroupId) => void;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 2, width: 172, flexShrink: 0 }}>
      {PRIMARY_GROUPS.map((g, i) => {
        const isActive = g.id === activeGroup;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onSet(g.id)}
            aria-current={isActive ? "true" : undefined}
            className={`loom-press flex items-center outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] hover:[background-color:var(--hover)]${isActive ? " loom-thread-active" : ""}`}
            style={{
              gap: 10,
              padding: "8px 12px",
              borderRadius: "var(--radius-control)",
              // No inline background when inactive so the hover class can win
              // (inline styles beat utility classes).
              background: isActive ? "var(--surface-active)" : undefined,
              textAlign: "left",
              transitionProperty: "background-color",
              transitionDuration: "var(--dur-press, 140ms)",
            }}
          >
            {/* v4 §3: active nav index reads ember-text; the mono floor is 10.5px */}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-floor, 10.5px)",
                letterSpacing: "0.08em",
                color: isActive ? "var(--ember-text)" : "var(--text-subtle)",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-base, 14px)",
                color: isActive ? "var(--text-primary)" : "var(--text-body)",
              }}
            >
              {g.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DensityToggle() {
  const [density, setDensity] = useDensity();
  return (
    <div style={{ marginBottom: 20 }}>
      <ObsidianMonoLabel tone="muted">Density</ObsidianMonoLabel>
      <div
        className="flex items-center"
        role="group"
        aria-label="Density"
        style={{ gap: 6, marginTop: 8 }}
      >
        {(["comfortable", "compact"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDensity(d)}
            aria-pressed={density === d}
            className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] hover:[background-color:var(--hover)]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              height: 32,
              padding: "0 12px",
              borderRadius: "var(--radius-control)",
              border: "1px solid var(--hairline)",
              background: density === d ? "var(--raised)" : undefined,
              color: density === d ? "var(--text-primary)" : "var(--text-subtle)",
              textTransform: "capitalize",
              cursor: "pointer",
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>
        Compact drops one row of breathing room · type stays the same
      </p>
    </div>
  );
}

// THEME GETS A HOME (founder ask, 2026-07-11): the Light / Dark / System choice
// finally has UI. Consumes the already-shipped useTheme() trio; dark stays the
// default (Tempo v5 law), light derives from the same tokens.
const THEME_CHOICES: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <div style={{ marginBottom: 20 }}>
      <ObsidianMonoLabel tone="muted">Appearance</ObsidianMonoLabel>
      <div
        className="flex items-center"
        role="group"
        aria-label="Theme"
        style={{ gap: 6, marginTop: 8 }}
      >
        {THEME_CHOICES.map(({ id, label, Icon }) => {
          const isActive = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-pressed={isActive}
              className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] hover:[background-color:var(--hover)]"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                height: 32,
                padding: "0 12px",
                borderRadius: "var(--radius-control)",
                border: "1px solid var(--hairline)",
                background: isActive ? "var(--raised)" : undefined,
                color: isActive ? "var(--text-primary)" : "var(--text-subtle)",
                cursor: "pointer",
                transitionProperty: "background-color, color",
                transitionDuration: "var(--dur-press, 140ms)",
              }}
            >
              <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>
        System follows your device. Dark is the default.
      </p>
    </div>
  );
}

// IA SPINE (2026-07-11): the claim-admin affordance moved OUT of the rail
// (the rail shows Admin console only to actual admins) and lives here as a
// dismissible card on Settings > Workspace.
const CLAIM_ADMIN_DISMISS_KEY = "supaprod:claim-admin-dismissed";

function AdminDoor() {
  const fAmIAdmin = useServerFn(amIAdmin);
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["am-i-admin"], queryFn: () => fAmIAdmin() });
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(CLAIM_ADMIN_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (q.data?.isAdmin) {
    return (
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--hairline)" }}>
        {/* Router navigation, not a full page reload (audit D-20). */}
        <ObsidianButton variant="quiet" onClick={() => navigate({ to: "/admin" })}>
          Admin console →
        </ObsidianButton>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>
          Members, roles, audit, and billing for the whole workspace
        </p>
      </div>
    );
  }

  // No admin exists yet: offer the claim, dismissibly.
  if (q.data && !q.data.anyAdminExists && !dismissed) {
    const dismiss = () => {
      setDismissed(true);
      try {
        localStorage.setItem(CLAIM_ADMIN_DISMISS_KEY, "1");
      } catch {
        // Storage unavailable: the dismissal holds for this session only.
      }
    };
    return (
      <div
        role="note"
        aria-label="Claim admin"
        style={{
          marginTop: 24,
          padding: "14px 16px",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card, 10px)",
          background: "var(--card)",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, fontWeight: 500 }}>
            This workspace has no admin yet
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 10px" }}>
            Claim the admin console to manage members, roles, audit, and billing.
          </p>
          <ObsidianButton variant="quiet" onClick={() => navigate({ to: "/admin" })}>
            Claim admin →
          </ObsidianButton>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss the claim admin card"
          className="loom-press outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ember)] hover:[background-color:var(--hover)] hover:[color:var(--text-primary)]"
          style={{
            flexShrink: 0,
            border: "none",
            color: "var(--text-subtle)",
            fontSize: 14,
            lineHeight: 1,
            padding: 4,
            cursor: "pointer",
            borderRadius: 6,
          }}
        >
          <X size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return null;
}

function SettingsPage() {
  const { section, tab, connector, checkout } = Route.useSearch();
  // ?section= is canonical; legacy ?tab= keeps landing (audit D-20).
  const rawSection = section ?? tab;
  const active = normalizeSection(rawSection);
  const activeConnector = active === "connections" ? normalizeConnector(connector) : undefined;
  const navigate = useNavigate({ from: "/settings" });
  const { activeWorkspace, activeProduct } = useWorkspace();
  const setTab = (id: string) => navigate({ search: { section: id } });

  // Pane grouping (SETTINGS-SEGREGATE / OBS-13): which pane owns the active
  // section, its member sections (for the tier-2 sub-row), and a pane-click
  // handler that lands on the pane's primary section. The ?section= id stays
  // the routing key.
  const activeGroup = groupForSection(active);
  const groupMembers = findGroup(activeGroup)?.sections ?? [];
  const setGroup = (gid: GroupId) => navigate({ search: { section: primarySection(gid) } });

  const workspaceName = activeWorkspace?.name;

  return (
    <>
      <TopBar crumbs={[workspaceName ?? "Workspace", "Settings"]} />
      <div
        data-screen-label="Settings"
        style={{
          padding: "var(--page-inset-v) var(--page-inset-h) 64px",
          width: "100%",
          maxWidth: "var(--container-standard, 1240px)",
          margin: "0 auto",
        }}
      >
        {/* Wayfinding fix 2026-07-19: the TopBar crumb already reads
            "[workspace] / Settings", so the visible workspace eyebrow and
            page-name heading merely repeated it. One wayfinding source per
            screen: the crumb keeps the location; the h1 stays sr-only for the
            AT-navigable outline (same pattern as Today). */}
        <h1 className="sr-only">Settings</h1>

        <div className="flex flex-col md:flex-row" style={{ gap: 44 }}>
          <div className="md:w-48">
            <SettingsIndex activeGroup={activeGroup} onSet={setGroup} />
          </div>

          <div style={{ flex: 1, minWidth: 0, maxWidth: 880 }}>
            {/* Tier 2: the active pane's member sections — only shown when the pane
              holds more than one section (single-section panes need no sub-row). */}
            {groupMembers.length > 1 ? (
              <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 20 }}>
                {groupMembers.map((s) => {
                  const isActive = s.id === active;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTab(s.id)}
                      aria-pressed={isActive}
                      className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] hover:[background-color:var(--hover)]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-mono-floor, 10.5px)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "5px 10px",
                        borderRadius: "var(--radius-control)",
                        background: isActive ? "var(--raised)" : undefined,
                        color: isActive ? "var(--text-primary)" : "var(--text-subtle)",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {active === "connections" && (
              <ConnectionsTab
                connector={activeConnector}
                onOpenDetail={(p) => navigate({ search: { section: "connections", connector: p } })}
                onCloseDetail={() => navigate({ search: { section: "connections" } })}
              />
            )}
            {active === "ai" && <ModelsTab />}
            {active === "staff" && <StaffTab />}
            {active === "autonomy" && (
              <ControlsPanel onOpenQueue={() => navigate({ to: "/approvals" })} />
            )}
            {active === "products" && <ProductsTab />}
            {active === "workspace" && (
              <>
                <WorkspaceTab scrollToBrief={rawSection === "brief"} />
                <AdminDoor />
              </>
            )}
            {active === "billing" && <BillingTab checkout={checkout} />}
            {active === "credits" && <CreditsTab />}
            {active === "interop" && <IntegrationsTab />}
            {active === "profile" && (
              <>
                <ProfileTab />
                <AppearanceSection />
                <DensityToggle />
              </>
            )}
            {active === "notifications" && <NotificationsTab />}
            {active === "memory" && <MemoryView />}
            {active === "health" && <HealthCard />}
            {active === "data" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <DataSubstrateCard />
                <ValueReceiptsCard />
                <DataExportCard workspaceId={activeWorkspace?.id} />
                <SkillsFileExportCard />
                <SubprocessorsCard />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---- Plan — M-C billing: the current plan, the three tiers, and an upgrade CTA.
   getBillingState reads workspaces.plan_tier (set only by the Stripe webhook);
   "Upgrade" starts a Stripe Checkout via createCheckoutSession. Degrades to an
   honest "billing not connected yet" until the founder wires Stripe keys, so the
   surface ships now and charges nothing. ---- */

function BillingTab({ checkout }: { checkout?: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/settings" });
  const fGetBilling = useServerFn(getBillingState);
  const fGetSub = useServerFn(getMySubscription);
  const fCancelSub = useServerFn(cancelMySubscription);
  const fResumeSub = useServerFn(resumeMySubscription);
  const fPortal = useServerFn(createPortalSession);
  const confirm = useConfirm();

  const billing = useQuery({
    queryKey: ["billing"],
    queryFn: () => fGetBilling({ data: {} }),
  });

  // Resolve env lazily so a missing payments token doesn't crash render.
  let envSafe: ReturnType<typeof getStripeEnvironment> | null = null;
  try {
    envSafe = getStripeEnvironment();
  } catch {
    envSafe = null;
  }

  // getMySubscription is a pure Supabase read — no Stripe key needed.
  // Fall back to 'sandbox' so local dev without VITE_PAYMENTS_CLIENT_TOKEN still loads sub data.
  const subEnv: "sandbox" | "live" = envSafe ?? "sandbox";
  const mySub = useQuery({
    queryKey: ["my-subscription", subEnv],
    queryFn: () => fGetSub({ data: { environment: subEnv } }),
  });

  useEffect(() => {
    if (checkout === "success") {
      toast.success("Payment received. Your plan will reflect within a minute.");
      qc.invalidateQueries({ queryKey: ["billing"] });
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
    } else if (checkout === "cancel") {
      toast("Checkout canceled. You are still on your current plan.");
    } else if (checkout === "pending") {
      toast("Still confirming with the payment provider. This usually clears in a minute.");
    }
  }, [checkout, qc]);

  const cancelSub = useMutation({
    mutationFn: () => fCancelSub({ data: { environment: subEnv } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Subscription set to cancel at the end of the current period.");
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not cancel."),
  });

  const resumeSub = useMutation({
    mutationFn: () => fResumeSub({ data: { environment: subEnv } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Subscription resumed. Renews on the next billing date.");
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not resume."),
  });

  const openPortal = useMutation({
    mutationFn: () =>
      fPortal({
        data: {
          environment: subEnv,
          returnUrl: window.location.href,
        },
      }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      if ("url" in res && res.url) {
        window.location.href = res.url;
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not open billing portal."),
  });

  async function onCancelClick() {
    const renews = mySub.data?.currentPeriodEnd
      ? new Date(mySub.data.currentPeriodEnd).toLocaleDateString()
      : "the end of the current period";
    const ok = await confirm({
      title: "Cancel subscription?",
      body: `You'll keep full access until ${renews}. After that, the plan drops to Free. You can resume anytime before then.`,
      confirmLabel: "Cancel plan",
      cancelLabel: "Keep plan",
      destructive: true,
    });
    if (ok) cancelSub.mutate();
  }

  const state: BillingState | undefined = billing.data;
  const currentTier: PlanTier = state?.planTier ?? "free";
  const current = planPresentation(currentTier);
  const TierGlyph = TIER_ICON[currentTier];
  const sub = mySub.data;
  const hasSub = !!sub?.hasSubscription;
  const renews = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const renewsLabel = renews
    ? renews.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  // Status read — same three states drive both the pill and the "Manage
  // billing" action below. Ember is reserved for the one action that is
  // genuinely required right now (a broken payment method); everything
  // else on this pane stays quiet.
  const isPastDue = sub?.status === "past_due";
  const subStatusWord = sub?.cancelAtPeriodEnd
    ? "CANCELS AT PERIOD END"
    : isPastDue
      ? "PAYMENT ISSUE"
      : "ACTIVE";
  const subStatusTone = sub?.cancelAtPeriodEnd ? "marigold" : isPastDue ? "madder" : "moss";
  const subStatusColor = sub?.cancelAtPeriodEnd
    ? "var(--marigold)"
    : isPastDue
      ? "var(--ds-red-600)"
      : "var(--ds-green-600)";
  const subStatusGlow = sub?.cancelAtPeriodEnd
    ? "0 0 8px rgba(232, 180, 76, 0.5)"
    : isPastDue
      ? "0 0 8px rgba(224, 101, 87, 0.5)"
      : "0 0 8px rgba(127, 191, 142, 0.5)";

  // Loading: a skeleton, not a misleading flash of the "Free" plan card
  // (checklist point 5).
  if (billing.isLoading) {
    return (
      <div style={{ display: "grid", gap: "var(--space-4)" }} aria-hidden="true">
        <div style={cardStyle()}>
          <div style={{ display: "grid", gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 14,
                  width: `${68 - i * 16}%`,
                  borderRadius: 4,
                  background: "var(--raised)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // An error never wears an empty state's clothes: a failed billing read must
  // not render as a silent "Free" plan (checklist point 7).
  if (billing.isError) {
    return (
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        <div style={cardStyle()}>
          <div className="mono-label" style={{ color: "var(--rose)" }}>
            Couldn't load your billing state
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-muted)", margin: "8px 0 0" }}>
            {(billing.error as Error)?.message ?? "Unknown error"}
          </p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => billing.refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <PaymentTestModeBanner />
      {/* ── Current plan card ────────────────────────────────────────── */}
      <div style={cardStyle()}>
        {/* Top row: plan identity + status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--space-3)",
          }}
        >
          <div>
            <ObsidianMonoLabel style={{ marginBottom: "var(--space-1)" }}>
              Current plan
            </ObsidianMonoLabel>
            <div
              style={{
                ...cardTitleStyle(),
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <TierGlyph size={20} />
              {current.name}
            </div>
          </div>
          {/* Status pill — only when subscription data is loaded */}
          {hasSub && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginTop: 4,
                flexShrink: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "var(--radius-pill)",
                  background: subStatusColor,
                  boxShadow: subStatusGlow,
                  flexShrink: 0,
                }}
              />
              <ObsidianMonoLabel tone={subStatusTone}>{subStatusWord}</ObsidianMonoLabel>
            </span>
          )}
        </div>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-base)",
            color: "var(--text-body)",
            margin: "var(--space-2) 0 0",
            lineHeight: "var(--leading-body)",
          }}
        >
          {current.tagline}
        </p>

        {/* Renewal date — only when available */}
        {hasSub && renewsLabel && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-label)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-subtle)",
              margin: "10px 0 0",
            }}
          >
            {sub?.cancelAtPeriodEnd ? "Access until" : "Renews on"}{" "}
            <span style={{ color: "var(--text-primary)" }}>{renewsLabel}</span>
          </p>
        )}

        {/* Non-owner notice */}
        {state && !state.isOwner && (
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-helper)",
              color: "var(--text-subtle)",
              margin: "var(--space-3) 0 0",
            }}
          >
            Only the workspace owner can change or cancel the plan.
          </p>
        )}

        {/* ── Action row — always visible for workspace owner ── */}
        {(!state || state.isOwner) && (
          <div
            style={{
              marginTop: "var(--space-4)",
              paddingTop: "var(--space-3)",
              borderTop: "1px solid var(--hairline)",
              display: "flex",
              gap: "var(--space-2)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Manage billing → Stripe portal for payment/invoice management.
                Ember only when a payment issue genuinely needs fixing now. */}
            {hasSub && (
              <ObsidianButton
                variant={isPastDue ? "primary" : "secondary"}
                disabled={openPortal.isPending}
                onClick={() => openPortal.mutate()}
              >
                {openPortal.isPending ? "Opening…" : "Manage billing"}
              </ObsidianButton>
            )}

            {/* Cancel / Resume — only when subscription exists */}
            {hasSub &&
              (sub?.cancelAtPeriodEnd ? (
                <ObsidianButton
                  variant="quiet"
                  disabled={resumeSub.isPending}
                  onClick={() => resumeSub.mutate()}
                >
                  {resumeSub.isPending ? "Resuming…" : "Resume plan"}
                </ObsidianButton>
              ) : (
                <ObsidianButton
                  variant="quiet"
                  disabled={cancelSub.isPending}
                  onClick={onCancelClick}
                >
                  {cancelSub.isPending ? "Canceling…" : "Cancel plan"}
                </ObsidianButton>
              ))}

            {/* Top-up always available (navigates in-app, no Stripe needed) */}
            {currentTier !== "free" && (
              <ObsidianButton
                variant="quiet"
                onClick={() => navigate({ search: { section: "credits" } })}
              >
                Buy a credit top-up
              </ObsidianButton>
            )}

            {/* Free tier: nudge toward upgrading */}
            {currentTier === "free" && (
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-helper)",
                  color: "var(--text-subtle)",
                }}
              >
                Pick a plan below to upgrade.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Horizontal plan table: free · 3 paid · enterprise.
          Per-card credits dropdown drives the live price. */}
      <PlanTable currentTier={currentTier} canSelect={state?.isOwner ?? false} />
    </div>
  );
}

/* ---- Credits — Phase 7 surface (G12). Isolated from Plan so subscription
   changes and credit top-ups never get visually entangled (the Anthropic
   pattern). Reads balance + cycle + last 20 ledger rows + last 10 top-ups via
   RLS; top-ups route through the cap-guarded `createTopUpCheckout`. When the
   metering engine is still dormant (`credits_enabled() = false`), the balance
   block honestly says so instead of pretending a 0 is meaningful. ---- */

function CreditsTab() {
  return <CreditsTabInner />;
}

// Shared card chrome for the Plan pane (OBS-13): var(--card) + hairline +
// radius-card, Newsreader section titles — the same pattern already shipped
// on the Admin > Spend surface (_authenticated.admin.ai-costs.tsx).
function cardStyle(): React.CSSProperties {
  return {
    background: "var(--card)",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius-card)",
    padding: "var(--space-4)",
    // v4 §2: the card catches the ambient light from above.
    boxShadow: "var(--top-light)",
  };
}

function cardTitleStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--font-sans)",
    fontWeight: 460,
    fontSize: "var(--text-card-title)",
    lineHeight: 1.3,
    color: "var(--text-primary)",
  };
}

function helperTextStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-helper)",
    color: "var(--text-subtle)",
    margin: "var(--space-3) 0 0",
  };
}

function BundleGrid({
  bundles,
  selectedKey,
  onSelect,
  remainingTopupRoom,
  bestPerCredit,
  fmtPrice,
  fmtCreditsShort,
}: {
  bundles: { key: string; credits: number; priceCents: number }[];
  selectedKey: string;
  onSelect: (key: string) => void;
  remainingTopupRoom: number | null;
  bestPerCredit: number;
  fmtPrice: (c: number) => string;
  fmtCreditsShort: (n: number) => string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--space-2)",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      }}
    >
      {bundles.map((b) => {
        const wouldExceed = remainingTopupRoom !== null && b.credits > remainingTopupRoom;
        const perCredit = b.priceCents / b.credits;
        const isBest = Math.abs(perCredit - bestPerCredit) < 1e-9;
        const selected = b.key === selectedKey;
        const vsStarter = bundles[0] ? bundles[0].priceCents / bundles[0].credits : perCredit;
        const savedVsStarter = Math.max(0, Math.round((1 - perCredit / vsStarter) * 100));
        return (
          <button
            key={b.key}
            type="button"
            disabled={wouldExceed}
            onClick={() => onSelect(b.key)}
            title={wouldExceed ? "Exceeds your per-cycle top-up limit." : undefined}
            aria-pressed={selected}
            className={`outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]${
              // Border color lives in classes (not inline) so hover can win;
              // inline styles would beat the hover utility.
              selected
                ? " border [border-color:var(--hairline-strong)]"
                : " border [border-color:var(--hairline)] enabled:hover:[border-color:var(--hairline-strong)]"
            }`}
            style={{
              textAlign: "left",
              padding: "var(--space-3)",
              borderRadius: "var(--radius-control)",
              cursor: wouldExceed ? "not-allowed" : "pointer",
              opacity: wouldExceed ? 0.5 : 1,
              // Selected reads with a neutral high-contrast border + wash,
              // never ember, which stays reserved for the Buy action below.
              background: selected ? "var(--surface-active)" : "var(--raised)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-1)",
              position: "relative",
              transitionProperty: "background-color, border-color",
              transitionDuration: "var(--dur-control)",
              transitionTimingFunction: "var(--ease)",
            }}
          >
            {isBest && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: 10,
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-micro)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: "var(--card)",
                  color: "var(--text-subtle)",
                  border: "1px solid var(--hairline-strong)",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                Best value
              </span>
            )}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                lineHeight: 1.1,
                color: "var(--text-primary)",
              }}
            >
              {fmtCreditsShort(b.credits)} credits
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-base)",
                color: "var(--text-body)",
              }}
            >
              {fmtPrice(b.priceCents)}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-micro)",
                color: "var(--text-subtle)",
              }}
            >
              {(perCredit / 100).toFixed(3)} $/credit
              {savedVsStarter > 0 ? ` · save ${savedVsStarter}%` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CreditsTabInner() {
  const fGetCredits = useServerFn(getMyCreditsView);
  const fGetCatalog = useServerFn(getPricingCatalog);
  const fGetAttribution = useServerFn(getCreditAttribution);

  // Resolve env lazily so a missing payments token doesn't crash render.
  let envSafe: ReturnType<typeof getStripeEnvironment> | null = null;
  try {
    envSafe = getStripeEnvironment();
  } catch {
    envSafe = null;
  }

  // getMyCreditsView is a pure Supabase read (balance/ledger/enabled flag) -
  // `environment` only scopes the recent-topups filter, so a missing Stripe
  // client token must never block the balance itself from loading (it used
  // to, via `enabled: !!envSafe`, which left the card stuck on an
  // unexplained "--" forever instead of the dormant-metering message below).
  // Same fallback idiom as `mySub` above.
  const creditsEnv: "sandbox" | "live" = envSafe ?? "sandbox";
  const credits = useQuery({
    queryKey: ["my-credits", creditsEnv],
    queryFn: () => fGetCredits({ data: { environment: creditsEnv } }),
  });
  const catalog = useQuery({
    queryKey: ["pricing-catalog"],
    queryFn: () => fGetCatalog(),
  });
  const attribution = useQuery({
    queryKey: ["credit-attribution"],
    queryFn: () => fGetAttribution({ data: {} }),
  });

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  const [checkoutTitle, setCheckoutTitle] = useState("Buy credits");

  function openTopUp(key: string, label: string) {
    try {
      getStripeEnvironment();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payments are not configured.");
      return;
    }
    setCheckoutKey(key);
    setCheckoutTitle(label);
    setCheckoutOpen(true);
  }

  const data = credits.data;
  const cycleLabel = data?.cycleAnchor
    ? new Date(data.cycleAnchor).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const remainingTopupRoom = data
    ? Math.max(0, data.cycleTopupCapCredits - data.cycleTopupCredits)
    : null;

  // Bundles come from the admin-managed catalog ONLY (honesty law, audit
  // D-20): the old hardcoded 9-bundle fallback ladder rendered clickable
  // prices no backend would honor. No catalog rows means no bundle grid.
  // Convention: lookup_key = "topup_<credits>" or "topup_<k>k".
  const catalogBundles = (catalog.data?.topups ?? []).filter((b) => b.active);
  type Bundle = { key: string; credits: number; priceCents: number };
  const BUNDLES: Bundle[] = [...catalogBundles]
    .sort((a, b) => a.credits - b.credits)
    .map((b) => ({
      key:
        b.credits >= 1000 && b.credits % 1000 === 0
          ? `topup_${b.credits / 1000}k`
          : `topup_${b.credits}`,
      credits: b.credits,
      priceCents: b.price_cents,
    }));
  const fmtPrice = (c: number) => `$${Math.round(c / 100).toLocaleString()}`;
  const fmtCreditsShort = (n: number) =>
    n >= 1000 && n % 1000 === 0 ? `${n / 1000}k` : n.toLocaleString();

  const STARTER_MAX = 5000;
  const starterBundles = BUNDLES.filter((b) => b.credits <= STARTER_MAX);
  const scaleBundles = BUNDLES.filter((b) => b.credits > STARTER_MAX);
  const [selectedKey, setSelectedKey] = useState<string>(
    () => BUNDLES.find((b) => b.credits === 2500)?.key ?? BUNDLES[0]?.key ?? "",
  );
  const selectedBundle = BUNDLES.find((b) => b.key === selectedKey) ?? BUNDLES[0];
  const bestPerCredit = BUNDLES.reduce(
    (min, b) => Math.min(min, b.priceCents / b.credits),
    Infinity,
  );
  // Presentational only — chooses the top-up CTA's color, never gates any
  // query/mutation: ember only when you are genuinely out of headroom now.
  const isOutOfCredits = !!data && data.enabled && data.balanceCredits + data.topupCredits <= 0;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <PaymentTestModeBanner />
      {/* Voucher redeem entry point (the user-facing caller for redeemVoucher). */}
      <RedeemCodeCard />

      <div style={cardStyle()}>
        <ObsidianMonoLabel>Balance</ObsidianMonoLabel>
        {/* Error is its own state: a failed balance read must not sit behind
            an eternal unexplained "--" (checklist point 7). */}
        {credits.isError && (
          <div style={{ marginTop: "var(--space-2)" }}>
            <p style={{ ...helperTextStyle(), margin: 0, color: "var(--ds-red-600)" }}>
              Couldn't load your balance. {(credits.error as Error)?.message ?? "Unknown error"}
            </p>
            <div style={{ marginTop: "var(--space-2)" }}>
              <ObsidianButton variant="quiet" onClick={() => credits.refetch()}>
                Retry
              </ObsidianButton>
            </div>
          </div>
        )}
        {!credits.isError && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 28,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginTop: "var(--space-1)",
            }}
          >
            {data ? (data.balanceCredits + data.topupCredits).toLocaleString() : "--"}
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                color: "var(--text-subtle)",
                marginLeft: "var(--space-2)",
              }}
            >
              credits
            </span>
          </div>
        )}
        {data && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-6)",
              marginTop: "var(--space-3)",
            }}
          >
            <div>
              <ObsidianMonoLabel>Monthly grant</ObsidianMonoLabel>
              <div
                style={{
                  marginTop: "var(--space-1)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-base)",
                  color: "var(--text-body)",
                }}
              >
                {data.monthlyGrantCredits.toLocaleString()}
              </div>
            </div>
            <div>
              <ObsidianMonoLabel>Purchased top-ups</ObsidianMonoLabel>
              <div
                style={{
                  marginTop: "var(--space-1)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-base)",
                  color: "var(--text-body)",
                }}
              >
                {data.topupCredits.toLocaleString()}
              </div>
            </div>
            {cycleLabel && (
              <div>
                <ObsidianMonoLabel>Cycle started</ObsidianMonoLabel>
                <div
                  style={{
                    marginTop: "var(--space-1)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-base)",
                    color: "var(--text-body)",
                  }}
                >
                  {cycleLabel}
                </div>
              </div>
            )}
          </div>
        )}
        {data && data.enabled && data.monthlyGrantCredits > 0 && (
          <div style={{ marginTop: "var(--space-3)", maxWidth: 260 }}>
            <UsageIndicator
              used={Math.max(0, data.monthlyGrantCredits - data.balanceCredits)}
              allowance={data.monthlyGrantCredits}
            />
          </div>
        )}
        {data && !data.enabled && (
          <p style={helperTextStyle()}>
            Metering is off while we finish the credits rollout. Top-ups are recorded and will count
            once metering turns on.
          </p>
        )}
      </div>

      {/* ===== Where your credits go (WM-M16 usage attribution) ===== */}
      <div style={cardStyle()}>
        <ObsidianMonoLabel>Where your credits go</ObsidianMonoLabel>
        {(() => {
          const a = attribution.data;
          if (attribution.isLoading) {
            return <p style={helperTextStyle()}>Loading…</p>;
          }
          // Error never wears the empty state's clothes (checklist point 7).
          if (attribution.isError) {
            return (
              <div style={{ marginTop: "var(--space-2)" }}>
                <p style={{ ...helperTextStyle(), margin: 0, color: "var(--ds-red-600)" }}>
                  Couldn't load the usage breakdown.{" "}
                  {(attribution.error as Error)?.message ?? "Unknown error"}
                </p>
                <div style={{ marginTop: "var(--space-2)" }}>
                  <ObsidianButton variant="quiet" onClick={() => attribution.refetch()}>
                    Retry
                  </ObsidianButton>
                </div>
              </div>
            );
          }
          if (!a || a.totalDebited <= 0) {
            return (
              <p style={helperTextStyle()}>
                {data && !data.enabled
                  ? "Usage breakdown appears once metering is on. You'll see which products and teammates spent credits this cycle."
                  : "No credits spent this cycle yet. Usage by product and teammate will appear here."}
              </p>
            );
          }
          const max = Math.max(...a.byProduct.map((p) => p.credits), 1);
          return (
            <div style={{ marginTop: "var(--space-3)", display: "grid", gap: "var(--space-2)" }}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-base)",
                  color: "var(--text-subtle)",
                }}
              >
                {a.totalDebited.toLocaleString()} credits spent this cycle
              </div>
              {a.byProduct.slice(0, 8).map((p) => (
                <div
                  key={p.id ?? "unattributed"}
                  style={{ display: "grid", gap: "var(--space-1)" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-base)",
                    }}
                  >
                    <span style={{ color: "var(--text-primary)" }}>{p.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-subtle)" }}>
                      {p.credits.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: "var(--radius-pill)",
                      background: "var(--raised)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round((p.credits / max) * 100)}%`,
                        height: "100%",
                        background: "var(--tangerine)",
                      }}
                    />
                  </div>
                </div>
              ))}
              {a.byMember.length > 1 && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-mono-micro)",
                    color: "var(--text-faint)",
                    marginTop: "var(--space-1)",
                  }}
                >
                  Across {a.byMember.length} teammates this cycle.
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <CreditCapsCard />

      {/* ===== Pick a bundle ===== */}
      <div style={cardStyle()}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <div>
            <ObsidianMonoLabel>One-time top-ups</ObsidianMonoLabel>
            <div style={{ ...cardTitleStyle(), marginTop: "var(--space-1)" }}>
              Buy credits without changing your plan
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                color: "var(--text-body)",
                margin: "var(--space-1) 0 0",
                lineHeight: "var(--leading-body)",
              }}
            >
              Credits land in your balance and stay until used. Higher bundles get a better
              per-credit rate.
            </p>
          </div>
          {selectedBundle && (
            <div style={{ textAlign: "right" }}>
              <ObsidianMonoLabel>Your selection</ObsidianMonoLabel>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 24,
                  lineHeight: 1,
                  marginTop: "var(--space-1)",
                  color: "var(--text-primary)",
                }}
              >
                {fmtPrice(selectedBundle.priceCents)}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-micro)",
                  color: "var(--text-subtle)",
                  marginTop: "var(--space-1)",
                }}
              >
                {selectedBundle.credits.toLocaleString()} credits &middot;{" "}
                {(selectedBundle.priceCents / selectedBundle.credits / 100).toFixed(3)} $/credit
              </div>
            </div>
          )}
        </div>

        {/* Four states (DESIGN-LOOM §9): skeleton while the catalog loads,
            error with retry (never empty-state clothes), honest instruction
            when no bundles are published, loaded grid otherwise. */}
        {catalog.isLoading ? (
          <div
            aria-hidden="true"
            style={{
              display: "grid",
              gap: "var(--space-2)",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              marginTop: "var(--space-4)",
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 84,
                  borderRadius: "var(--radius-control)",
                  background: "var(--raised)",
                }}
              />
            ))}
          </div>
        ) : catalog.error ? (
          <div style={{ marginTop: "var(--space-4)" }}>
            <p style={{ ...helperTextStyle(), margin: 0, color: "var(--ds-red-600)" }}>
              Couldn't load the top-up catalog.{" "}
              {(catalog.error as Error)?.message ?? "Unknown error"}
            </p>
            <div style={{ marginTop: "var(--space-2)" }}>
              <ObsidianButton variant="quiet" onClick={() => catalog.refetch()}>
                Retry
              </ObsidianButton>
            </div>
          </div>
        ) : BUNDLES.length === 0 ? (
          <p style={helperTextStyle()}>
            No top-up bundles are published yet. When they are, they appear here with live prices.
          </p>
        ) : (
          <>
            {/* Starter tiers */}
            {starterBundles.length > 0 && (
              <div style={{ marginTop: "var(--space-4)" }}>
                <ObsidianMonoLabel style={{ marginBottom: "var(--space-2)" }}>
                  Starter packs
                </ObsidianMonoLabel>
                <BundleGrid
                  bundles={starterBundles}
                  selectedKey={selectedKey}
                  onSelect={setSelectedKey}
                  remainingTopupRoom={remainingTopupRoom}
                  bestPerCredit={bestPerCredit}
                  fmtPrice={fmtPrice}
                  fmtCreditsShort={fmtCreditsShort}
                />
              </div>
            )}

            {/* Scale tiers */}
            {scaleBundles.length > 0 && (
              <div style={{ marginTop: "var(--space-4)" }}>
                <ObsidianMonoLabel style={{ marginBottom: "var(--space-2)" }}>
                  At scale &middot; better per-credit rate
                </ObsidianMonoLabel>
                <BundleGrid
                  bundles={scaleBundles}
                  selectedKey={selectedKey}
                  onSelect={setSelectedKey}
                  remainingTopupRoom={remainingTopupRoom}
                  bestPerCredit={bestPerCredit}
                  fmtPrice={fmtPrice}
                  fmtCreditsShort={fmtCreditsShort}
                />
              </div>
            )}

            {/* Honest checkout: while payments are dormant there is no Buy
                button at all (a disabled buy is still a dead promise). */}
            {selectedBundle && envSafe ? (
              <div
                style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}
              >
                <ObsidianButton
                  variant={isOutOfCredits ? "primary" : "secondary"}
                  disabled={
                    remainingTopupRoom !== null && selectedBundle.credits > remainingTopupRoom
                  }
                  onClick={() =>
                    openTopUp(
                      selectedBundle.key,
                      `Top-up: ${selectedBundle.credits.toLocaleString()} credits`,
                    )
                  }
                >
                  Buy {selectedBundle.credits.toLocaleString()} credits &middot;{" "}
                  {fmtPrice(selectedBundle.priceCents)}
                </ObsidianButton>
              </div>
            ) : selectedBundle ? (
              <p style={helperTextStyle()}>
                Checkout isn't switched on in this build yet. Prices are live for planning; buying
                opens once payments go live.
              </p>
            ) : null}
          </>
        )}

        {data && (
          <p style={helperTextStyle()}>
            This cycle: {data.cycleTopupCredits.toLocaleString()} of{" "}
            {data.cycleTopupCapCredits.toLocaleString()} top-up credits used. Need more?{" "}
            <a
              href="mailto:sales@supaprod.ai?subject=Enterprise%20credits"
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{ color: "var(--link)" }}
            >
              Talk to sales for volume pricing
            </a>
            .
          </p>
        )}
      </div>

      <div style={cardStyle()}>
        <ObsidianMonoLabel>Recent activity</ObsidianMonoLabel>
        {credits.isLoading ? (
          <p style={helperTextStyle()}>Loading…</p>
        ) : credits.isError ? (
          <p style={{ ...helperTextStyle(), color: "var(--ds-red-600)" }}>
            Couldn't load recent activity. Use Retry above to reload.
          </p>
        ) : data && data.ledger.length === 0 && data.topups.length === 0 ? (
          <p style={helperTextStyle()}>
            No activity yet. Your grants, debits, and top-ups will appear here.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "var(--space-3) 0 0",
              display: "grid",
              gap: "var(--space-1)",
            }}
          >
            {data?.topups.map((t) => (
              <li
                key={`top-${t.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-base)",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid var(--hairline)",
                }}
              >
                {/* Human words, not the raw price_lookup_key enum (copy audit). */}
                <span style={{ color: "var(--text-primary)" }}>Credit top-up</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ds-green-600)" }}>
                  +{Number(t.credits_added).toLocaleString()} credits
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-mono-micro)",
                    color: "var(--text-faint)",
                    minWidth: 90,
                    textAlign: "right",
                  }}
                >
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
            {data?.ledger.map((row) => (
              <li
                key={`led-${row.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-base)",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid var(--hairline)",
                }}
              >
                <span style={{ color: "var(--text-primary)" }}>
                  {/* Ledger reasons are enum slugs; read them as words. */}
                  {String(row.reason).replace(/_/g, " ")}
                  {row.surface ? ` · ${String(row.surface).replace(/_/g, " ")}` : ""}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: row.delta_credits >= 0 ? "var(--ds-green-600)" : "var(--text-body)",
                  }}
                >
                  {row.delta_credits >= 0 ? "+" : ""}
                  {Number(row.delta_credits).toLocaleString()} credits
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-mono-micro)",
                    color: "var(--text-faint)",
                    minWidth: 90,
                    textAlign: "right",
                  }}
                >
                  {new Date(row.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {checkoutKey ? (
        <StripeEmbeddedCheckout
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          priceLookupKey={checkoutKey}
          title={checkoutTitle}
          mode="topup"
        />
      ) : null}
    </div>
  );
}

/* ---- Connections — Connected accounts (OAuth-only). Screen 6 ships the
   ConnectorDetail drill-down: ?connector= (optional search param) replaces
   this whole tab body with the per-provider detail; "details →" on every
   account row opens it, DrillHeader's back link and any tab switch clear it
   (fresh search object).

   Loom W2 (2026-07-04): the old "Workspace tool sync" card grid is GONE — its
   Connect button upserted status:'connected' with no OAuth behind it (audit
   D-04, claim-outruns-wiring). Every provider row in Connected accounts is
   already honest: a real connect flow when the OAuth app is configured, a
   quiet "coming soon" disabled state when it is not. One-home rule (§9b):
   workspace bindings render fully on /sync (Connections, the bindings home);
   here they appear as a read-only summary that links there. ---- */

function ConnectionsTab({
  connector,
  onOpenDetail,
  onCloseDetail,
}: {
  connector?: ProviderId;
  onOpenDetail: (provider: ProviderId) => void;
  onCloseDetail: () => void;
}) {
  // Drill-down: the detail replaces the entire tab body (SurfaceHeader +
  // TabRow stay above us in SettingsPage).
  if (connector) {
    return <ConnectorDetail provider={connector} onBack={onCloseDetail} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ObsidianMonoLabel tone="muted">Yours</ObsidianMonoLabel>
      <AccountConnectionsSection onOpenDetail={onOpenDetail} />

      <div style={{ marginTop: 8 }}>
        <ObsidianMonoLabel tone="muted">This workspace's</ObsidianMonoLabel>
        <div style={{ marginTop: 8 }}>
          <WorkspaceBindingsSummary />
        </div>
      </div>
    </div>
  );
}

/* One-home rule: /sync is the bindings home; Settings shows the summary and
   links there. Four states: skeleton / instruction / error-with-retry /
   loaded (DESIGN-LOOM §9). */
function WorkspaceBindingsSummary() {
  const fBindings = useServerFn(listWorkspaceBindings);
  const q = useQuery({ queryKey: ["workspace-bindings"], queryFn: () => fBindings() });

  if (q.isLoading) {
    return (
      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        <div style={{ display: "grid", gap: 10 }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 14,
                width: `${72 - i * 14}%`,
                borderRadius: 4,
                background: "var(--raised)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (q.error) {
    return (
      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        <div className="mono-label" style={{ color: "var(--rose)" }}>
          Couldn't load workspace bindings
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-muted)", margin: "8px 0 0" }}>
          {(q.error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => q.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const bindings = q.data?.bindings ?? [];

  return (
    <div className="bento" style={{ padding: "var(--card-pad)" }}>
      {bindings.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-subtle)", margin: 0 }}>
          Nothing bound yet. Pick which repo, team, or database this workspace's agents act on.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {bindings.map((b) => {
            const healthy = b.connection_status === "connected";
            return (
              <li
                key={b.id}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: healthy ? "var(--ds-green-600)" : "var(--ds-red-600)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "var(--ink)", minWidth: 0 }}>
                  {CONNECTOR_REGISTRY[b.provider as ProviderId]?.label ?? b.provider}
                  <span style={{ color: "var(--ink-subtle)" }}>
                    {" "}
                    · {b.resource_label ?? b.resource_id}
                    {healthy ? "" : " · reconnect needed"}
                  </span>
                </span>
                {b.updated_at ? (
                  <span
                    className="mono-label tabular-nums"
                    style={{ fontSize: 9, color: "var(--ink-faint)", marginLeft: "auto" }}
                  >
                    {relTimeCaps(b.updated_at)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <div style={{ marginTop: 12 }}>
        <Link
          to="/sync"
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{ fontSize: 12.5, color: "var(--link)" }}
        >
          {bindings.length === 0
            ? "Set up workspace sync and bindings →"
            : "Manage workspace sync and bindings →"}
        </Link>
      </div>
    </div>
  );
}

/* ---- Models — the reference table anatomy (role · model mono · via mono ·
   Change ghost) rendered from REAL data: the profile's default model.
   "Change" is real here — it reveals the model select. BYO AI keys stay
   (they are not connectors), restyled quiet-Ember. ---- */

function ModelsTab() {
  const qc = useQueryClient();
  const fProfile = useServerFn(getProfile);
  const mUpdate = useServerFn(updateProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fProfile() });

  const [defaultModel, setDefaultModel] = useState("google/gemini-3-flash-preview");
  const [agenticModel, setAgenticModel] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingAgentic, setEditingAgentic] = useState(false);

  useEffect(() => {
    const p = profile.data?.profile as {
      default_model?: string;
      agentic_model?: string | null;
    } | null;
    if (p) {
      setDefaultModel(p.default_model ?? "google/gemini-3-flash-preview");
      setAgenticModel(p.agentic_model ?? null);
    }
  }, [profile.data]);

  const saveModel = useMutation({
    mutationFn: () => mUpdate({ data: { default_model: defaultModel } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      toast.success("Default model saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // MA-2: save agentic model for automatic/background runs
  const saveAgenticModel = useMutation({
    mutationFn: () => mUpdate({ data: { agentic_model: agenticModel } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setEditingAgentic(false);
      toast.success("Agentic model saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const current = MODELS.find((m) => m.id === defaultModel);
  const currentAgentic = agenticModel ? MODELS.find((m) => m.id === agenticModel) : null;

  // A failed profile read must not render the model rows with silent defaults
  // (checklist point 7). BYO keys load independently, so they stay.
  if (profile.isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="bento" style={{ padding: 24 }}>
          <div className="mono-label" style={{ color: "var(--rose)" }}>
            Couldn't load your model settings
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>
            {(profile.error as Error)?.message ?? "Unknown error"}
          </p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 14 }}
            onClick={() => profile.refetch()}
          >
            Retry
          </button>
        </div>
        <ByoKeysSection />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="bento" style={{ padding: 0, overflow: "hidden" }}>
        {profile.isLoading ? (
          <div style={{ padding: "13px 18px" }} aria-hidden="true">
            <div
              className="animate-pulse"
              style={{ height: 14, width: "58%", borderRadius: 4, background: "var(--raised)" }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 18px",
              borderBottom: editing ? "1px solid var(--hairline)" : "none",
              fontSize: 13,
            }}
          >
            <span style={{ flex: 1, color: "var(--ink-muted)" }}>
              Default · chat and agent runs
            </span>
            <span className="mono-label" style={{ color: "var(--ink)" }}>
              {defaultModel === AUTO_MODEL ? "Auto" : (current?.label ?? defaultModel)}
            </span>
            <span className="mono-label" style={{ fontSize: 9 }}>
              {defaultModel === AUTO_MODEL
                ? "routed"
                : current
                  ? current.live
                    ? "gateway"
                    : "byo"
                  : "unknown"}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              aria-expanded={editing}
              onClick={() => setEditing((v) => !v)}
            >
              Change
            </button>
          </div>
        )}
        {editing ? (
          <div className="fade-up" style={{ display: "flex", gap: 8, padding: "13px 18px" }}>
            <select
              className="input"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              aria-label="Default AI model"
            >
              <optgroup label="Recommended">
                <option value={AUTO_MODEL}>
                  Auto: best model per task, optimized automatically
                </option>
              </optgroup>
              <optgroup label="Live (Lovable AI Gateway)">
                {MODELS.filter((m) => m.live).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}: {m.desc}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Adapter-ready (platform / enterprise key)">
                {MODELS.filter((m) => !m.live).map((m) => (
                  <option key={m.id} value={m.id} disabled>
                    {m.label}: {m.desc}
                  </option>
                ))}
              </optgroup>
            </select>
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              disabled={saveModel.isPending}
              onClick={() => saveModel.mutate()}
            >
              {saveModel.isPending ? "Saving…" : "Save · chat and agent runs use it"}
            </button>
          </div>
        ) : null}
      </div>

      {/* MA-2: agentic model for automatic/background runs (researcher-tick, cluster-tick, etc) */}
      <div className="bento" style={{ padding: 0, overflow: "hidden" }}>
        {profile.isLoading ? (
          <div style={{ padding: "13px 18px" }} aria-hidden="true">
            <div
              className="animate-pulse"
              style={{ height: 14, width: "58%", borderRadius: 4, background: "var(--raised)" }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "13px 18px",
              borderBottom: editingAgentic ? "1px solid var(--hairline)" : "none",
              fontSize: 13,
            }}
          >
            <span style={{ flex: 1, color: "var(--ink-muted)" }}>
              Agentic · automatic runs (researcher, cluster, reflection)
            </span>
            <span className="mono-label" style={{ color: "var(--ink)" }}>
              {!agenticModel ? "Auto" : currentAgentic ? currentAgentic.label : agenticModel}
            </span>
            <span className="mono-label" style={{ fontSize: 9 }}>
              {!agenticModel
                ? "routed"
                : currentAgentic
                  ? currentAgentic.live
                    ? "gateway"
                    : "byo"
                  : "unknown"}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              aria-expanded={editingAgentic}
              onClick={() => setEditingAgentic((v) => !v)}
            >
              Change
            </button>
          </div>
        )}
        {editingAgentic ? (
          <div className="fade-up" style={{ display: "flex", gap: 8, padding: "13px 18px" }}>
            <select
              className="input"
              value={agenticModel ?? ""}
              onChange={(e) => setAgenticModel(e.target.value || null)}
              aria-label="Agentic model for automatic runs"
            >
              <option value="">Auto: best model per task</option>
              <optgroup label="Live (Lovable AI Gateway)">
                {MODELS.filter((m) => m.live).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}: {m.desc}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Adapter-ready (platform / enterprise key)">
                {MODELS.filter((m) => !m.live).map((m) => (
                  <option key={m.id} value={m.id} disabled>
                    {m.label}: {m.desc}
                  </option>
                ))}
              </optgroup>
            </select>
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              disabled={saveAgenticModel.isPending}
              onClick={() => saveAgenticModel.mutate()}
            >
              {saveAgenticModel.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        ) : null}
      </div>

      <ByoKeysSection />
    </div>
  );
}

function ByoKeysSection() {
  const qc = useQueryClient();
  const fKeys = useServerFn(listApiKeys);
  const fSaveKey = useServerFn(saveApiKey);
  const fDelKey = useServerFn(deleteApiKey);
  const fTestKey = useServerFn(testApiKey);
  const keys = useQuery({ queryKey: ["api-keys"], queryFn: () => fKeys() });
  // WM-M9: bring-your-own AI keys are enterprise-only. Same ["billing"] queryKey as
  // BillingTab, so this dedupes with it rather than firing a second fetch.
  const fGetBilling = useServerFn(getBillingState);
  const billing = useQuery({ queryKey: ["billing"], queryFn: () => fGetBilling({ data: {} }) });
  const isEnterprise = (billing.data?.planTier ?? "free") === "enterprise";

  const [keyProv, setKeyProv] = useState<string>(BYO_PROVIDERS[0].id);
  const [keyLabel, setKeyLabel] = useState<string>("");
  const [keyValue, setKeyValue] = useState<string>("");
  const [keyBase, setKeyBase] = useState<string>("");
  const [keyModelId, setKeyModelId] = useState<string>("");
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latency_ms: number;
    error?: string;
    sample?: string;
  } | null>(null);

  const mTestKey = useMutation({
    mutationFn: () =>
      fTestKey({
        data: {
          provider: keyProv,
          api_key: keyValue,
          base_url: keyBase || null,
          model: keyModelId || undefined,
        },
      }),
    onSuccess: (r) => {
      setTestResult(r);
      if (r.ok) toast.success(`Key works (${r.latency_ms}ms)`);
      else toast.error(r.error ?? "Test failed");
    },
    onError: (e: Error) => {
      setTestResult({ ok: false, latency_ms: 0, error: e.message });
      toast.error(e.message);
    },
  });
  const mSaveKey = useMutation({
    mutationFn: () =>
      fSaveKey({
        data: {
          provider: keyProv,
          label: keyLabel || null,
          api_key: keyValue,
          base_url: keyBase || null,
          model_id: keyModelId || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setKeyValue("");
      setKeyLabel("");
      setKeyBase("");
      setKeyModelId("");
      setTestResult(null);
      toast.success("Key saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelKey = useMutation({
    mutationFn: (id: string) => fDelKey({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Removed");
    },
  });

  const keyList = keys.data?.keys ?? [];

  return (
    <div className="bento" style={{ padding: "var(--card-pad)" }}>
      <MonoLabel style={{ marginBottom: 4 }}>Bring your own AI keys</MonoLabel>
      {isEnterprise ? (
        <p style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 12 }}>
          Connect any AI provider: Claude, OpenAI, Qwen, DeepSeek, Groq, Mistral, Moonshot,
          OpenRouter, and more. Stored encrypted per user. Add a Base URL for providers with custom
          endpoints (Qwen, Ollama, custom).
        </p>
      ) : (
        <p style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 12 }}>
          An Enterprise feature. Every other plan runs on Supaprod credits. Model-agnostic provider
          routing still applies, it just uses our keys instead of your own.
        </p>
      )}

      {isEnterprise ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (keyValue.trim()) mSaveKey.mutate();
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 8,
            }}
          >
            <select
              className="input"
              value={keyProv}
              onChange={(e) => setKeyProv(e.target.value)}
              aria-label="Key provider"
            >
              {BYO_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              className="input"
              value={keyLabel}
              onChange={(e) => setKeyLabel(e.target.value)}
              aria-label="Key label"
              placeholder="Label (optional)"
            />
            <input
              className="input"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              type="password"
              aria-label="API key"
              placeholder={BYO_PROVIDERS.find((p) => p.id === keyProv)?.placeholder}
            />
            <input
              className="input"
              value={keyBase}
              onChange={(e) => setKeyBase(e.target.value)}
              aria-label="Base URL"
              placeholder="Base URL (Qwen, Ollama, custom…)"
            />
          </div>
          {keyProv === "custom" || keyBase.trim() ? (
            <input
              className="input"
              style={{ marginTop: 4, width: "100%" }}
              value={keyModelId}
              onChange={(e) => setKeyModelId(e.target.value)}
              aria-label="Model ID"
              placeholder="Model ID: the exact model to use with this key (e.g. qwen/qwen-max, ollama/llama3.2, custom/my-model)"
            />
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            {testResult ? (
              <span
                className="mono-label"
                style={{
                  fontSize: 8.5,
                  color: testResult.ok ? "var(--emerald)" : "var(--rose)",
                }}
              >
                {testResult.ok ? `ok · ${testResult.latency_ms}ms` : testResult.error?.slice(0, 80)}
              </span>
            ) : null}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={mTestKey.isPending || !keyValue.trim()}
              onClick={() => mTestKey.mutate()}
            >
              {mTestKey.isPending ? (
                <>
                  <span className="spinner" style={{ width: 11, height: 11 }} />
                  Testing…
                </>
              ) : (
                "Test · calls the provider"
              )}
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={mSaveKey.isPending || !keyValue.trim()}
            >
              {mSaveKey.isPending ? "Saving…" : "Add key · stored encrypted"}
            </button>
          </div>
        </form>
      ) : null}

      {isEnterprise || keyList.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          {keys.isLoading ? (
            <div style={{ display: "grid", gap: 8 }} aria-hidden="true">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    height: 14,
                    width: `${64 - i * 14}%`,
                    borderRadius: 4,
                    background: "var(--raised)",
                  }}
                />
              ))}
            </div>
          ) : keys.isError ? (
            <div>
              <div className="mono-label" style={{ color: "var(--rose)" }}>
                Couldn't load your keys
              </div>
              <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "6px 0 0" }}>
                {(keys.error as Error)?.message ?? "Unknown error"}
              </p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => keys.refetch()}
              >
                Retry
              </button>
            </div>
          ) : keyList.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>No BYO keys saved yet.</div>
          ) : (
            keyList.map((k, i) => (
              <div
                key={k.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderTop: i === 0 ? "1px solid var(--hairline)" : undefined,
                  borderBottom: "1px solid var(--hairline)",
                  fontSize: 13,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    {BYO_PROVIDERS.find((p) => p.id === k.provider)?.label ?? k.provider}
                    {k.label ? (
                      <span style={{ color: "var(--ink-subtle)" }}> · {k.label}</span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--ink-subtle)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {k.preview}
                    {k.model_id ? ` · ${k.model_id}` : ""}
                    {k.base_url ? ` · ${k.base_url}` : ""}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  aria-label="Remove key"
                  style={{ color: "var(--rose)", fontFamily: "var(--font-mono)", fontSize: 11 }}
                  disabled={mDelKey.isPending && mDelKey.variables === k.id}
                  onClick={() => mDelKey.mutate(k.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---- Staff — the real agent registry (agents table via listAgents):
   4-col bento cards, serif 15 name + mono 8.5 role, 30×17 switch.
   Production has no disable-agent capability — the toggle states the truth
   (gated in Govern), exactly the reference's honest toast. ---- */

type AgentRow = {
  id: string;
  slug: string;
  name: string;
  role: string;
  enabled: boolean;
  max_tool_risk?: string | null;
};

// FND-0.5 per-agent blast-radius cap control. Sets agents.max_tool_risk; the agent loop then drops
// any tool whose blast-radius tier exceeds the cap. "Unrestricted" (null) is the default.
const TOOL_CAP_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Unrestricted" },
  { value: "low", label: "Low reach" },
  { value: "medium", label: "Medium reach" },
  { value: "high", label: "High reach" },
];

function AgentToolCap({ agent }: { agent: AgentRow }) {
  const qc = useQueryClient();
  const fSet = useServerFn(setAgentToolCap);
  const m = useMutation({
    mutationFn: (v: string) =>
      fSet({
        data: {
          agentId: agent.id,
          maxToolRisk: v === "" ? null : (v as "low" | "medium" | "high"),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast(`${agent.name}: tool reach updated`);
    },
    onError: (e) => toast((e as Error).message),
  });
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        className="mono-label"
        style={{ fontSize: 8.5, color: "var(--ink-faint)", flexShrink: 0 }}
      >
        Tool reach
      </span>
      <select
        value={agent.max_tool_risk ?? ""}
        disabled={m.isPending}
        onChange={(e) => m.mutate(e.target.value)}
        title="Cap the blast radius of the tools this agent can call"
        aria-label={`Tool reach for ${agent.name}`}
        className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 11,
          padding: "3px 6px",
          borderRadius: 6,
          border: "1px solid var(--hairline)",
          background: "var(--canvas)",
          color: "var(--ink)",
        }}
      >
        {TOOL_CAP_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StaffTab() {
  const fAgents = useServerFn(listAgents);
  const agentsQ = useQuery({ queryKey: ["agents"], queryFn: () => fAgents() });

  if (agentsQ.error) {
    return (
      <div className="bento" style={{ padding: 24 }}>
        <div className="mono-label" style={{ color: "var(--rose)" }}>
          Couldn't load agents
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>
          {(agentsQ.error as Error)?.message}
        </p>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => agentsQ.refetch()}
        >
          Retry · reloads agents
        </button>
      </div>
    );
  }

  if (agentsQ.isLoading) {
    // Skeleton shaped like the agent card grid, never a dead text frame
    // (checklist point 5).
    return (
      <div
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: 92,
              borderRadius: "var(--radius-card, 10px)",
              background: "var(--raised)",
            }}
          />
        ))}
      </div>
    );
  }

  // Roster ruling A8: the concrete set is the 13 catalog-active agents.
  // Deprecated alias rows (engineer/stakeholder/copilot and older) are live
  // duplicates from seeding history; they stay in the DB for run history but
  // never render as staff, so every card is one recognizable specialist.
  const agents = ((agentsQ.data?.agents ?? []) as AgentRow[]).filter(
    (a) => catalogEntry(a.slug)?.status !== "deprecated",
  );
  if (agents.length === 0) {
    return (
      <p style={{ fontSize: 12.5, color: "var(--ink-faint)", padding: "24px 0" }}>
        No agents in this workspace yet.
      </p>
    );
  }

  return (
    <div
      // auto-fit so the card grid wraps instead of crushing at 1024/768
      // (checklist point 10); 4-up at full width, fewer columns as it narrows.
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 12,
      }}
    >
      {agents.map((a) => (
        <div
          key={a.slug}
          className="bento"
          style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-display" style={{ fontSize: 15 }}>
                {agentDisplayName(a.slug, a.name)}
              </div>
              <div className="mono-label" style={{ fontSize: 8.5 }}>
                {agentBlurb(a.slug) ?? a.role}
              </div>
            </div>
            <button
              role="switch"
              aria-checked={a.enabled}
              aria-label={`${a.name} ${a.enabled ? "enabled" : "disabled"}. Changing this is gated in Govern.`}
              title={`${a.name} ${a.enabled ? "enabled" : "disabled"}`}
              onClick={() =>
                toast(
                  a.enabled
                    ? `${a.name} stays on. Disabling agents is gated in Govern.`
                    : `${a.name} stays off. Enabling agents is gated in Govern.`,
                )
              }
              // Focus ring never removed (checklist point 2); background
              // transition rides the global reduced-motion kill switch.
              className="cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                width: 30,
                height: 17,
                borderRadius: 99,
                background: a.enabled ? "var(--deep-green)" : "var(--surface-2)",
                position: "relative",
                flexShrink: 0,
                transitionProperty: "background-color",
                transitionDuration: "var(--dur-press, 140ms)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  ...(a.enabled ? { right: 2 } : { left: 2 }),
                  top: 2,
                  width: 13,
                  height: 13,
                  borderRadius: 99,
                  background: "var(--canvas)",
                }}
              ></span>
            </button>
          </div>
          <AgentToolCap agent={a} />
        </div>
      ))}
    </div>
  );
}

/* ---- Workspace (production-only tab) — strategic brief + voice anchor,
   restyled quiet-Ember. ---- */

function WorkspaceTab({ scrollToBrief }: { scrollToBrief: boolean }) {
  const qc = useQueryClient();
  const briefRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollToBrief && briefRef.current) {
      briefRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [scrollToBrief]);

  const fProfile = useServerFn(getProfile);
  const mUpdate = useServerFn(updateProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fProfile() });

  const [voiceAnchor, setVoiceAnchor] = useState("");
  useEffect(() => {
    const p = profile.data?.profile as { voice_anchor_text?: string | null } | null;
    if (p) setVoiceAnchor(p.voice_anchor_text ?? "");
  }, [profile.data]);

  const saveVoice = useMutation({
    mutationFn: () => mUpdate({ data: { voice_anchor_text: voiceAnchor } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Voice anchor saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <WorkspaceBriefSection scrollRef={briefRef} highlight={scrollToBrief} />

      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <MonoLabel style={{ marginBottom: 4 }}>Voice anchor</MonoLabel>
            <p style={{ fontSize: 12, color: "var(--ink-subtle)", maxWidth: 520 }}>
              Operator-set tone and stance, injected into every agent mission's system prompt. Leave
              empty to skip.
            </p>
          </div>
          {/* Quiet, not solid: the brief's Save is this screen's one primary
              CTA (v4 §3 ember discipline). */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0 }}
            disabled={saveVoice.isPending || profile.isLoading}
            onClick={() => saveVoice.mutate()}
          >
            {saveVoice.isPending ? "Saving…" : "Save voice anchor"}
          </button>
        </div>
        <textarea
          className="input"
          value={voiceAnchor}
          onChange={(e) => setVoiceAnchor(e.target.value)}
          rows={4}
          maxLength={2000}
          aria-label="Voice anchor"
          placeholder="Direct, evidence-first, no hype. Challenge weak assumptions. Prefer short declarative sentences."
          style={{ resize: "vertical" }}
        />
        <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 6 }}>
          How your agents should sound and what stance they should take.
        </p>
      </div>

      <MembersCard />
      <TeamCard />
    </div>
  );
}

type BriefFieldKey = "mission" | "target_user" | "current_focus" | "anti_goals" | "notes";

const BRIEF_FIELDS: {
  key: BriefFieldKey;
  label: string;
  hint: string;
  placeholder: string;
  rows: number;
}[] = [
  {
    key: "mission",
    label: "Mission",
    hint: "One paragraph. What this workspace exists to do.",
    placeholder: "We help solo PMs run the work of a 10-person product org.",
    rows: 3,
  },
  {
    key: "target_user",
    label: "Target user (ICP)",
    hint: "Who you're building for. Agents anchor on this.",
    placeholder: "Lead/solo PM at a 10 to 100 person B2B SaaS team. Ships weekly.",
    rows: 3,
  },
  {
    key: "current_focus",
    label: "Current focus",
    hint: "What Supaprod should prioritize this quarter. Cut, don't expand.",
    placeholder: "Q3 2026: close the Discover, Plan, Build loop on real signals.",
    rows: 4,
  },
  {
    key: "anti_goals",
    label: "Anti-goals",
    hint: "Things agents should refuse, even when they look reasonable.",
    placeholder: "No new dashboards. No mocked data. No features whose value can't be measured.",
    rows: 3,
  },
  {
    key: "notes",
    label: "Notes for Supaprod",
    hint: "Tone, constraints, decisions, references.",
    placeholder: "Speak in product terms. Lean concise over verbose. Always cite evidence.",
    rows: 4,
  },
];

const EMPTY_BRIEF: Record<BriefFieldKey, string> = {
  mission: "",
  target_user: "",
  current_focus: "",
  anti_goals: "",
  notes: "",
};

function WorkspaceBriefSection({
  scrollRef,
  highlight,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  highlight: boolean;
}) {
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const qc = useQueryClient();
  const getFn = useServerFn(getActiveBrief);
  const upsertFn = useServerFn(upsertBrief);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["workspace-brief", activeWorkspaceId],
    queryFn: () => getFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
  });

  const effectiveWorkspaceId = activeWorkspaceId ?? data?.workspace_id ?? null;

  const [form, setForm] = useState<Record<BriefFieldKey, string>>(EMPTY_BRIEF);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        mission: data.mission ?? "",
        target_user: data.target_user ?? "",
        current_focus: data.current_focus ?? "",
        anti_goals: data.anti_goals ?? "",
        notes: data.notes ?? "",
      });
      setDirty(false);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => upsertFn({ data: { workspaceId: effectiveWorkspaceId, ...form } }),
    onSuccess: (row: WorkspaceBrief) => {
      qc.setQueryData(["workspace-brief", activeWorkspaceId], row);
      qc.setQueryData(["workspace-brief", null], row);
      void refreshWorkspaces();
      setDirty(false);
      toast.success("Brief saved, next mission uses the new context");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function update(key: BriefFieldKey, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  }

  return (
    <div
      ref={scrollRef}
      className="bento"
      style={{
        padding: "var(--card-pad)",
        boxShadow: highlight
          ? "0 0 0 1px color-mix(in oklab, var(--ember) 35%, transparent)"
          : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <MonoLabel style={{ marginBottom: 4 }}>
            Strategic brief
            {activeWorkspace?.name ? ` · ${activeWorkspace.name}` : ""}
          </MonoLabel>
          <p style={{ fontSize: 12, color: "var(--ink-subtle)", maxWidth: 520 }}>
            This brief is injected into every agent mission's system prompt. Changing it visibly
            changes what Discovery surfaces and what the Strategist writes. Keep it tight.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0 }}
          disabled={!dirty || save.isPending || isLoading}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : dirty ? "Save brief · next mission uses it" : "Saved"}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gap: 10, padding: "16px 0" }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 14,
                width: `${76 - i * 18}%`,
                borderRadius: 4,
                background: "var(--raised)",
              }}
            />
          ))}
        </div>
      ) : isError ? (
        // A failed brief read must not render blank fields whose Save would
        // wipe the real brief (checklist point 7).
        <div style={{ padding: "8px 0" }}>
          <div className="mono-label" style={{ color: "var(--rose)" }}>
            Couldn't load the brief
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-muted)", margin: "8px 0 0" }}>
            {(error as Error)?.message ?? "Unknown error"}
          </p>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {BRIEF_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={`brief-${f.key}`} style={{ display: "block" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{f.label}</span>
                  <span
                    className="mono-label tabular-nums"
                    style={{ fontSize: 8.5, color: "var(--ink-faint)" }}
                  >
                    {form[f.key].length} chars
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>{f.hint}</p>
              </label>
              <textarea
                id={`brief-${f.key}`}
                className="input"
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                rows={f.rows}
                placeholder={f.placeholder}
                style={{ marginTop: 8, resize: "vertical" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Profile — the reference avatar header (initials chip + name +
   role · workspace) from real profile data, then the production identity
   form + working hours. The reference's notification-pref rows (gate
   alerts / daily brief / quiet hours / weekends) have no backend — omitted
   per the no-filler law. ---- */

function ProfileTab() {
  const qc = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const fProfile = useServerFn(getProfile);
  const mUpdate = useServerFn(updateProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fProfile() });

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [timezone, setTimezone] = useState("");
  const [whStart, setWhStart] = useState(9);
  const [whEnd, setWhEnd] = useState(18);
  const [avatarChoice, chooseAvatar] = useAvatarChoice();

  useEffect(() => {
    const p = profile.data?.profile as {
      full_name?: string;
      display_name?: string;
      role?: string;
      timezone?: string;
      working_hours_start?: number;
      working_hours_end?: number;
    } | null;
    if (!p) return;
    setFullName(p.full_name ?? "");
    setDisplayName(p.display_name ?? "");
    setRole(p.role ?? "AI Product Manager");
    setTimezone(p.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    setWhStart(p.working_hours_start ?? 9);
    setWhEnd(p.working_hours_end ?? 18);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      await mUpdate({
        data: {
          full_name: fullName || undefined,
          display_name: displayName || undefined,
          role: role || undefined,
          timezone: timezone || undefined,
          working_hours_start: whStart,
          working_hours_end: whEnd,
          onboarded: true,
        },
      });
      // Also write to Supabase auth user_metadata so the rail + Today greeting
      // (which read the auth session, not the profiles table) reflect the new
      // name immediately on the next load. Best-effort; the profiles row is the
      // system of record and its write above already succeeded.
      try {
        await supabase.auth.updateUser({
          data: { display_name: displayName || undefined, full_name: fullName || undefined },
        });
      } catch {
        /* auth metadata is a display convenience; the profile row is saved */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Profile saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const name = displayName || fullName;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (profile.isLoading) {
    return (
      <div
        className="bento"
        style={{ padding: "var(--card-pad)", display: "grid", gap: 10, maxWidth: 480 }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: 14,
              width: `${72 - i * 16}%`,
              borderRadius: 4,
              background: "var(--raised)",
            }}
          />
        ))}
      </div>
    );
  }

  // A failed profile read must not render an empty identity form that would
  // overwrite real data on save (checklist point 7).
  if (profile.isError) {
    return (
      <div className="bento" style={{ padding: 24 }}>
        <div className="mono-label" style={{ color: "var(--rose)" }}>
          Couldn't load your profile
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>
          {(profile.error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => profile.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}
    >
      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        {name ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <Avatar seed={name} variant={avatarChoice} initials={initials} size={38} />
            <div>
              <div style={{ fontWeight: 550 }}>{name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-subtle)" }}>
                {role || "Member"}
                {activeWorkspace?.name ? ` · ${activeWorkspace.name}` : ""}
              </div>
            </div>
          </div>
        ) : null}

        {/* Avatar library — a default is assigned; the user picks their own. */}
        <MonoLabel style={{ marginBottom: 8 }}>Avatar</MonoLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 16 }}>
          {Array.from({ length: AVATAR_VARIANTS }).map((_, i) => {
            const selected = (avatarChoice ?? defaultAvatarVariant(name)) === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => chooseAvatar(i)}
                aria-label={`Avatar option ${i + 1}`}
                aria-pressed={selected}
                title={`Avatar option ${i + 1}`}
                className="loom-press outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 99,
                  background: orbBackground(i),
                  border: selected ? "2px solid var(--ember)" : "1px solid var(--hairline-strong)",
                  boxShadow: selected
                    ? "0 0 0 3px color-mix(in oklab, var(--ember) 26%, transparent)"
                    : "inset 0 1px 0 0 color-mix(in oklab, #fff 12%, transparent)",
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>

        <MonoLabel style={{ marginBottom: 12 }}>Identity</MonoLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Full name" hint="Used on documents, briefs, and stakeholder updates.">
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Q. Doe"
            />
          </Field>
          <Field label="Preferred display name" hint="How Supaprod and your agents will greet you.">
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane"
            />
          </Field>
          <Field label="Role">
            <input
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="AI Product Manager"
            />
          </Field>
          <Field label="Timezone">
            <input
              className="input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/New_York"
            />
          </Field>
        </div>
      </div>

      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        <MonoLabel style={{ marginBottom: 12 }}>Working hours</MonoLabel>
        <p style={{ fontSize: 11, color: "var(--ink-faint)", margin: "0 0 12px" }}>
          Also your quiet hours: your scheduled digest waits until this window opens.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Start (24h)">
            <input
              className="input"
              type="number"
              min={0}
              max={23}
              value={whStart}
              onChange={(e) => setWhStart(Number(e.target.value))}
            />
          </Field>
          <Field label="End (24h)">
            <input
              className="input"
              type="number"
              min={1}
              max={24}
              value={whEnd}
              onChange={(e) => setWhEnd(Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save · agents greet you by it"}
        </button>
      </div>

      <div className="bento" style={{ padding: "var(--card-pad)" }}>
        <MonoLabel style={{ marginBottom: 12 }}>Legal & trust</MonoLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {[
            { href: "/security", label: "Security" },
            { href: "/privacy", label: "Privacy policy" },
            { href: "/terms", label: "Terms of service" },
            { href: "/updates", label: "Changelog" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="outline-none [color:var(--ink-subtle)] hover:underline hover:[color:var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{ fontSize: 12, textDecoration: "none" }}
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  // Create a stable ID for label association - use the label text as a base
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div style={{ display: "block" }}>
      <label
        htmlFor={fieldId}
        style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6, display: "block" }}
      >
        {label}
      </label>
      {isValidElement(children) ? cloneElement(children, { id: fieldId } as any) : children}
      {hint ? (
        <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-faint)" }}>{hint}</div>
      ) : null}
    </div>
  );
}
