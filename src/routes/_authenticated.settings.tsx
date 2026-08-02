/**
 * SETTINGS. Redesigned again 2026-07-29 after the founder's verdict on the
 * first pass: "On the Settings page, still there, you need to work on
 * completely." The first pass cut the file from 3433 lines to 2351 and answered
 * the five questions, but it did two things wrong. It kept every door the
 * retired IA had, including two that led nowhere. And it hand-rolled its own
 * setting line, control, label and note as local style objects, because at the
 * time the rebuild had no such primitives. It has them now (Line, Field, Input,
 * Select, Textarea, Switch, Actions, Loading, Failed), and a surface carrying
 * its own private copy of a system shape is the drift the primitives file
 * exists to stop. All of that is gone.
 *
 * The six questions (SURFACE-JUSTIFICATION.md):
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The person who owns this workspace, here to change ONE boundary the crew
 *    will obey from now on, and then leave. Not to browse. The real sentence in
 *    their head is "stop asking me before it edits code", or "cap what a top-up
 *    can cost me", or "why can Engineer not see the repo". Nobody has ever
 *    opened Settings to look at things.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Setting policy in advance so it never has to be asked for in the moment.
 *    That is the governance canon's own split: policy is set ahead and does not
 *    block, permission is asked live and does. Every element here earns its
 *    place by being a boundary that, once set, removes an interruption later. A
 *    number that only REPORTS is not a boundary, and that single test decided
 *    most of the verdicts below.
 *
 *    A consequence worth stating, because it is a decision and not an
 *    oversight: there is no Settings landing page and /settings still opens on
 *    Profile. An overview screen would be a surface whose job is "look at
 *    things", which question 1 says is the finding rather than the design.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    KEEP - profile identity and working hours (working hours ARE quiet hours,
 *      a boundary the digest obeys) · appearance and density · notifications ·
 *      the brief and the voice anchor (the policy injected into every agent's
 *      prompt, and the most load-bearing thing on this surface) · brand ·
 *      products · autonomy · models and BYO keys · sources · agent access ·
 *      your data · plan · the credit cap and buying a top-up · per-agent tool
 *      reach.
 *    KILL - the "Sync and bindings" door. It rendered the workspace bindings
 *      and then a button to /sync, which renders the same bindings. Two doors
 *      to one room, and the room is better. Sources now SHOWS what each
 *      connected source is pointed at on its own line, and carries the one door
 *      to /sync for changing it. `?section=sync` still lands, on Sources.
 *    KILL - the "Memory" door, whose entire content was a sentence saying it
 *      moved to Brain. A nav row that exists to apologise for itself is a dead
 *      door. `?section=memory` still answers, so no old link breaks; it just
 *      has no entry in the index any more.
 *    KILL - the local CONTROL / AREA / LINE / LABEL / NOTE / ACTS style objects
 *      and the local Lines, Line, Stack, Acts and Failed components. Every one
 *      of them now exists in primitives.tsx. Roughly 130 lines of private
 *      system.
 *    KILL - the seven-checkbox export picker in Your data. It passed `sections`
 *      to exportWorkspace, and that handler ignores the argument and exports
 *      everything unconditionally. A control that cannot do the thing it draws
 *      is the definition of slop, and this is the second one found on this
 *      surface.
 *    KILL - five stacked cards in Your data, four in Notifications, and the
 *      four-column notification matrix inside a sideways scroll. Rebuilt as
 *      DataSection and NotificationsSection.
 *    KILL - the mission-by-mission churn table in Diagnostics. That is a
 *      report; the count stays and the table is one click away in the engine
 *      room. Rebuilt as DiagnosticsSection.
 *    KILL (earlier pass, still true) - the per-agent on/off switch that called
 *      no server function; the workspace-bindings summary that duplicated Sync;
 *      the avatar identity header sitting above the fields holding the same
 *      name; every animate-pulse skeleton.
 *    MOVE (needs another agent to receive it) -
 *      · the agent roster and the autonomy controls -> /crew, which a parallel
 *        lane owns. They are left exactly as they are here, deliberately, so
 *        that lane can lift them without a merge fight.
 *      · the credit debit ledger and per-product attribution -> Engine room,
 *        Spend. Purchases stay, because the purchase is made here.
 *      · Members and Team duplicate /admin. Left rendering because /admin is
 *        gated behind being an admin.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    Each agent's lessons and run history (/crew) · the credit debit ledger and
 *    who spent it (Engine room, Spend) · what a source is pointed at, and any
 *    two-sided edit (/sync) · every account and scope on a source (?connector=)
 *    · members, roles and audit (/admin) · the memory ledger (/brain) · the
 *    run-by-run reliability detail (Engine room, Quality).
 *
 * 5. DELIGHT, AND CONFUSION:
 *    Every section opens by stating the boundary CURRENTLY IN FORCE, derived
 *    from real rows, before offering to change it. Agents says "9 run alone, 3
 *    ask first"; Sources says what the crew reads and what each source is
 *    pointed at; Notifications says how many of the four things that can
 *    interrupt you actually do. Nothing is invented: where a number is not
 *    stored, the line says what the section governs instead, and where a read
 *    failed it says so rather than rendering a confident default.
 *    What would confuse, and is therefore not drawn: a control with no server
 *    function behind it, the same fact in three places, and a pane that scrolls
 *    sideways.
 *
 * 6. WHERE DOES THE CREW APPEAR ON THIS SURFACE, AND WHAT DOES IT PROVE?
 *    Settings is where the crew's boundaries are set, so the crew appears as
 *    the thing every boundary is about, and each section says so in the crew's
 *    terms rather than the system's: what the crew reads before it acts (the
 *    brief), how far each one may reach (the roster), what it is allowed to
 *    read (sources), which model runs its work, and what happens when it needs
 *    you. The roster carries a real AgentMark per agent, and a disabled agent
 *    wears the quiet state rather than disappearing. No mark is drawn anywhere
 *    an agent does not actually act, because a decorative agent is exactly the
 *    overclaim the presence doctrine bans.
 *
 * LAYOUT. The founder liked the left-hand settings index, so its shape survives
 * verbatim: five named groups, every door visible at once, no numbering and no
 * fold. The pane beside it renders one section at a time, sections are Blocks,
 * and a setting is a label on the left with its control on the right, one per
 * line, divided by a rule rather than boxed in a card each.
 *
 * UNCHANGED: the ?section= / ?tab= / ?connector= / ?checkout= contract, every
 * legacy deep link, and every server function, mutation and query key still
 * rendered. Destructive actions keep their confirmation.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  agentBlurb,
  agentDisplayName,
  catalogEntry,
  SPECIALIST_CATALOG,
} from "@/lib/agent-vocabulary";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { useDensity } from "@/hooks/use-density";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { useWorkspace } from "@/hooks/use-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { useAvatarChoice } from "@/hooks/use-avatar-choice";
import { orbBackground, AVATAR_VARIANTS, defaultAvatarVariant } from "@/components/supaprod/Avatar";

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
import { getActiveBrief, upsertBrief } from "@/lib/briefs.functions";
import { getBillingState, type BillingState } from "@/lib/billing.functions";
import {
  getMySubscription,
  cancelMySubscription,
  resumeMySubscription,
  createPortalSession,
  getMyCreditsView,
} from "@/lib/payments.functions";
import { planPresentation, type PlanTier } from "@/lib/entitlements";
import { amIAdmin, getPricingCatalog } from "@/lib/pricing.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { CONNECTOR_REGISTRY, type ProviderId, type ProviderSpec } from "@/lib/connectors/registry";
import { normalizeSection, type SectionId } from "@/lib/settings-sections";

import {
  AccountConnectionsSection,
  ConnectorDetail,
} from "@/components/connections/AccountConnectionsSection";
import { StripeEmbeddedCheckout } from "@/components/billing/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/billing/PaymentTestModeBanner";
import { PlanTable } from "@/components/billing/PlanPicker";
import { CreditCapsCard } from "@/components/billing/CreditCapsCard";
import { WorkspaceClaimCard } from "@/components/billing/WorkspaceClaimCard";
import { UsageIndicator } from "@/components/billing/UsageIndicator";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { ProductsTab } from "@/components/settings/ProductsTab";
import { DataSection } from "@/components/settings/DataSection";
import { DiagnosticsSection } from "@/components/settings/DiagnosticsSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { RedeemCodeCard } from "@/components/settings/RedeemCodeCard";
import { MembersCard } from "@/components/settings/MembersCard";
import { TeamCard } from "@/components/settings/TeamCard";
import { ControlsPanel } from "@/components/governance/ControlsPanel";
import { DesignMemoryPanel } from "@/components/knowledge/DesignMemoryPanel";

import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Field,
  Input,
  Line,
  Loading,
  Num,
  PageHead,
  Row,
  Select,
  Textarea,
} from "@/components/shell/primitives";

/* ================================================================== *
 * The index
 *
 * The doors, decided here rather than read from settings-sections.ts,
 * because which doors EXIST is a design decision belonging to this
 * surface while that module owns the deep-link contract (SectionId and
 * normalizeSection, both still imported and still authoritative). Two
 * rows the retired IA carried are absent: Sync, which duplicated /sync,
 * and Memory, which was a sentence saying it moved to Brain.
 * ================================================================== */

type Door = { id: SectionId; label: string };
type DoorGroup = { id: string; label: string; doors: Door[] };

const GROUPS: DoorGroup[] = [
  {
    id: "you",
    label: "You",
    doors: [
      { id: "profile", label: "Profile" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    doors: [
      { id: "workspace", label: "Brief and voice" },
      { id: "brand", label: "Brand" },
      { id: "products", label: "Products" },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    doors: [
      { id: "staff", label: "Roster" },
      { id: "autonomy", label: "Autonomy" },
      { id: "ai", label: "Models and keys" },
    ],
  },
  {
    id: "sources",
    label: "Sources and data",
    doors: [
      { id: "connections", label: "Connectors" },
      { id: "interop", label: "Agent access" },
      { id: "data", label: "Your data" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    doors: [
      { id: "billing", label: "Plan" },
      { id: "credits", label: "Credits" },
      { id: "health", label: "Diagnostics" },
    ],
  },
];

/** Retired doors whose ADDRESS still answers, so no saved link breaks. `sync`
 *  folds into Sources, which now shows the bindings it used to duplicate.
 *  `memory` keeps its own one-line pane because sending it to Brief and voice
 *  would land a person somewhere that does not explain their click. */
const FOLDED: Partial<Record<SectionId, SectionId>> = { sync: "connections" };

/* ================================================================== *
 * Route
 * ================================================================== */

// ?connector= drill param - only registry keys for user-facing providers open
// the detail; anything else falls back to the normal list.
function normalizeConnector(raw: string | undefined): ProviderId | undefined {
  if (!raw) return undefined;
  const spec = (CONNECTOR_REGISTRY as Record<string, ProviderSpec | undefined>)[raw];
  return spec && spec.userFacing !== false ? spec.id : undefined;
}

export const Route = createFileRoute("/_authenticated/settings")({
  // The canonical param is ?section=; ?tab= is a legacy alias that older links
  // and external deep links still send. Both are accepted; section wins.
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
    <div className="sp-inner">
      <div className="sp-main">
        <PageHead
          title="Settings did not open."
          sub={(error as Error)?.message ?? "The read failed."}
        />
        <Actions>
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
        </Actions>
      </div>
    </div>
  ),
});

/** The left-hand index. The founder liked this shape, so it keeps it: named
 *  groups, every door visible at once, no numbering and no fold. */
function SettingsIndex({ active, onSet }: { active: SectionId; onSet: (id: SectionId) => void }) {
  return (
    <nav
      aria-label="Settings"
      style={{
        flex: "0 1 200px",
        maxWidth: 220,
        minWidth: 168,
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-space-5)",
        position: "sticky",
        top: 0,
      }}
    >
      {GROUPS.map((g) => (
        <div key={g.id}>
          <div className="sp-ctx-head" style={{ marginBottom: "var(--sp-space-2)" }}>
            {g.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, margin: "0 -10px" }}>
            {g.doors.map((d) => {
              const here = d.id === active;
              return (
                <button
                  key={d.id}
                  type="button"
                  // A nav, not a tablist: aria-current says where you are, so
                  // the active look is set here rather than by sp-tab's
                  // aria-selected rule.
                  className="sp-tab"
                  aria-current={here ? "page" : undefined}
                  onClick={() => onSet(d.id)}
                  style={{
                    textAlign: "left",
                    ...(here
                      ? {
                          background: "var(--sp-lift)",
                          color: "var(--sp-ink)",
                          fontWeight: "var(--sp-weight-medium)",
                        }
                      : null),
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SettingsPage() {
  const { section, tab, connector, checkout } = Route.useSearch();
  // ?section= is canonical; legacy ?tab= keeps landing.
  const rawSection = section ?? tab;
  const resolved = normalizeSection(rawSection);
  const active = FOLDED[resolved] ?? resolved;
  const activeConnector = active === "connections" ? normalizeConnector(connector) : undefined;
  const navigate = useNavigate({ from: "/settings" });
  const { activeWorkspace } = useWorkspace();
  const setTab = (id: SectionId) => navigate({ search: { section: id } });

  return (
    // The ported layout, with the index on the LEFT rather than the context
    // column on the right: the founder's own ruling on this surface. It wraps
    // rather than hides when the work region is narrow, because a nav that
    // disappears is a door that disappears.
    <div
      className="sp-inner"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: "var(--sp-space-6) var(--sp-ctx-gap)",
      }}
    >
      <SettingsIndex active={active} onSet={setTab} />
      <div className="sp-main" style={{ flex: "1 1 460px", maxWidth: "none" }}>
        {active === "profile" && <ProfileSection />}
        {active === "notifications" && <NotificationsSection />}

        {active === "workspace" && <WorkspaceSection scrollToBrief={rawSection === "brief"} />}
        {active === "brand" && (
          <>
            <PageHead
              title="Brand"
              sub="What the design crew treats as settled before it draws anything."
            />
            <DesignMemoryPanel />
          </>
        )}
        {active === "products" && (
          <>
            <PageHead title="Products" sub="What this workspace ships. Missions attach to one." />
            <ProductsTab />
          </>
        )}
        {/* No door in the index; the address still answers so old links land. */}
        {active === "memory" && <MemorySection onOpen={() => navigate({ to: "/brain" })} />}

        {active === "staff" && <RosterSection />}
        {active === "autonomy" && (
          <>
            <PageHead
              title="Autonomy and approvals"
              sub="Set the boundary once here, and the crew stops asking inside every run."
            />
            <ControlsPanel onOpenQueue={() => navigate({ to: "/approvals" })} />
          </>
        )}
        {active === "ai" && <ModelsSection />}

        {active === "connections" &&
          (activeConnector ? (
            <ConnectorDetail
              provider={activeConnector}
              onBack={() => navigate({ search: { section: "connections" } })}
            />
          ) : (
            <AccountConnectionsSection
              onOpenDetail={(p) => navigate({ search: { section: "connections", connector: p } })}
            />
          ))}
        {active === "interop" && (
          <>
            <PageHead
              title="Agent access"
              sub="What an agent outside Supaprod may read, and on whose key."
            />
            <IntegrationsTab />
          </>
        )}
        {active === "data" && <DataSection workspaceId={activeWorkspace?.id} />}

        {active === "billing" && <PlanSection checkout={checkout} />}
        {active === "credits" && <CreditsSection />}
        {active === "health" && <DiagnosticsSection />}
      </div>
    </div>
  );
}

/* ================================================================== *
 * You - profile, appearance, hours
 * ================================================================== */

const THEME_CHOICES: { id: Theme; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

const DENSITY_CHOICES = [
  { id: "comfortable" as const, label: "Comfortable" },
  { id: "compact" as const, label: "Compact" },
];

/** A choice made of two or three named options. */
function Choice<T extends string>({
  value,
  options,
  onPick,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onPick: (id: T) => void;
  label: string;
}) {
  return (
    <span role="group" aria-label={label} style={{ display: "flex", gap: "var(--sp-space-1)" }}>
      {options.map((o) => (
        <Button
          key={o.id}
          variant={o.id === value ? "default" : "ghost"}
          aria-pressed={o.id === value}
          onClick={() => onPick(o.id)}
        >
          {o.label}
        </Button>
      ))}
    </span>
  );
}

function ProfileSection() {
  const qc = useQueryClient();
  const fProfile = useServerFn(getProfile);
  const mUpdate = useServerFn(updateProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fProfile() });

  const { theme, setTheme } = useTheme();
  const [density, setDensity] = useDensity();

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
      // Also write auth user_metadata so surfaces that read the session (not
      // the profiles row) reflect the new name on the next load. Best effort;
      // the profiles row is the system of record and it is already saved.
      try {
        await supabase.auth.updateUser({
          data: { display_name: displayName || undefined, full_name: fullName || undefined },
        });
      } catch {
        /* auth metadata is a display convenience */
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

  if (profile.isLoading) {
    return (
      <>
        <PageHead title="Profile" sub="How you are named, and when you are reachable." />
        <Loading>Reading your profile.</Loading>
      </>
    );
  }

  // A failed read must not render an empty identity form whose save would
  // overwrite the real thing.
  if (profile.isError) {
    return (
      <>
        <PageHead title="Profile" sub="How you are named, and when you are reachable." />
        <Failed onRetry={() => void profile.refetch()}>
          Your profile did not load, so nothing here is safe to save yet.{" "}
          {(profile.error as Error)?.message ?? "The read failed."}
        </Failed>
      </>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <PageHead
        title="Profile"
        sub={`Anything scheduled waits for your window, ${whStart}:00 to ${whEnd}:00 in ${timezone || "your timezone"}.`}
      />

      <Block title="Identity">
        <Line label="Full name" sub="Signs documents, briefs and stakeholder updates.">
          <Input
            aria-label="Full name"
            style={{ width: 240 }}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Q. Doe"
          />
        </Line>
        <Line label="Display name" sub="What the agents call you.">
          <Input
            aria-label="Display name"
            style={{ width: 240 }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane"
          />
        </Line>
        <Line label="Role">
          <Input
            aria-label="Role"
            style={{ width: 240 }}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="AI Product Manager"
          />
        </Line>
        <Line label="Timezone" sub="Every time on every surface is read in it.">
          <Input
            aria-label="Timezone"
            style={{ width: 240 }}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/New_York"
          />
        </Line>
        <Line
          label="Mark"
          sub={name ? `Stands in for ${name} wherever you acted.` : "Stands in for you."}
        >
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 240 }}>
            {Array.from({ length: AVATAR_VARIANTS }).map((_, i) => {
              const selected = (avatarChoice ?? defaultAvatarVariant(name)) === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => chooseAvatar(i)}
                  aria-label={`Mark ${i + 1}`}
                  aria-pressed={selected}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    padding: 0,
                    background: orbBackground(i),
                    border: selected ? "1.5px solid var(--sp-ink)" : "1px solid var(--sp-line)",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </span>
        </Line>
      </Block>

      <Block title="Working hours">
        <Line
          label="Reachable from"
          sub="Outside it, a scheduled digest waits rather than pinging you."
        >
          <Input
            aria-label="Reachable from"
            type="number"
            min={0}
            max={23}
            style={{ width: 88 }}
            value={whStart}
            onChange={(e) => setWhStart(Number(e.target.value))}
          />
        </Line>
        <Line label="Until">
          <Input
            aria-label="Reachable until"
            type="number"
            min={1}
            max={24}
            style={{ width: 88 }}
            value={whEnd}
            onChange={(e) => setWhEnd(Number(e.target.value))}
          />
        </Line>
        <Actions>
          <Button variant="primary" type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving" : "Save profile"}
          </Button>
        </Actions>
      </Block>

      <Block title="Appearance">
        <Line label="Theme" sub="System follows your device. Dark is the default.">
          <Choice value={theme} options={THEME_CHOICES} onPick={setTheme} label="Theme" />
        </Line>
        <Line label="Density" sub="Compact drops a row of breathing room. Type stays the same.">
          <Choice value={density} options={DENSITY_CHOICES} onPick={setDensity} label="Density" />
        </Line>
      </Block>
    </form>
  );
}

/* ================================================================== *
 * Workspace - the brief, the voice, the people
 * ================================================================== */

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
    label: "Target user",
    hint: "Who you are building for. Every agent anchors on this.",
    placeholder: "Lead or solo PM at a 10 to 100 person B2B SaaS team. Ships weekly.",
    rows: 3,
  },
  {
    key: "current_focus",
    label: "Current focus",
    hint: "What to prioritise this quarter. Cut, do not expand.",
    placeholder: "Q3 2026: close the Discover, Plan, Build loop on real signals.",
    rows: 4,
  },
  {
    key: "anti_goals",
    label: "Anti-goals",
    hint: "What the crew refuses, even when it looks reasonable.",
    placeholder: "No new dashboards. No mocked data. No feature whose value cannot be measured.",
    rows: 3,
  },
  {
    key: "notes",
    label: "Notes",
    hint: "Constraints, decisions and references that do not fit above.",
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

function WorkspaceSection({ scrollToBrief }: { scrollToBrief: boolean }) {
  const briefRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollToBrief && briefRef.current) {
      briefRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [scrollToBrief]);

  const qc = useQueryClient();
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const getFn = useServerFn(getActiveBrief);
  const upsertFn = useServerFn(upsertBrief);
  const fProfile = useServerFn(getProfile);
  const mUpdate = useServerFn(updateProfile);

  const brief = useQuery({
    queryKey: ["workspace-brief", activeWorkspaceId],
    queryFn: () => getFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
  });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fProfile() });

  const effectiveWorkspaceId = activeWorkspaceId ?? brief.data?.workspace_id ?? null;

  const [form, setForm] = useState<Record<BriefFieldKey, string>>(EMPTY_BRIEF);
  const [voiceAnchor, setVoiceAnchor] = useState("");
  const [briefDirty, setBriefDirty] = useState(false);
  const [voiceDirty, setVoiceDirty] = useState(false);

  useEffect(() => {
    const d = brief.data;
    if (!d) return;
    setForm({
      mission: d.mission ?? "",
      target_user: d.target_user ?? "",
      current_focus: d.current_focus ?? "",
      anti_goals: d.anti_goals ?? "",
      notes: d.notes ?? "",
    });
    setBriefDirty(false);
  }, [brief.data]);

  useEffect(() => {
    const p = profile.data?.profile as { voice_anchor_text?: string | null } | null;
    if (p) {
      setVoiceAnchor(p.voice_anchor_text ?? "");
      setVoiceDirty(false);
    }
  }, [profile.data]);

  // ONE SAVE, because the brief and the voice anchor are one instrument: what
  // the crew reads before it acts. Two cards with two Save buttons meant two
  // primary actions on a surface entitled to one. Both server functions are
  // still called, and only for what actually changed.
  const save = useMutation({
    mutationFn: async () => {
      if (briefDirty) {
        const row = await upsertFn({ data: { workspaceId: effectiveWorkspaceId, ...form } });
        qc.setQueryData(["workspace-brief", activeWorkspaceId], row);
        qc.setQueryData(["workspace-brief", null], row);
        void refreshWorkspaces();
      }
      if (voiceDirty) {
        await mUpdate({ data: { voice_anchor_text: voiceAnchor } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setBriefDirty(false);
      setVoiceDirty(false);
      toast.success("Saved. The next mission reads it.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty = briefDirty || voiceDirty;
  const filled = BRIEF_FIELDS.filter((f) => form[f.key].trim().length > 0).length;

  return (
    <div ref={briefRef}>
      <PageHead
        title="Brief and voice"
        sub={
          brief.isLoading
            ? "Reading the brief."
            : brief.isError
              ? "The brief did not load, so nothing here is safe to save yet."
              : filled === 0
                ? "Nothing set. Every mission currently starts with no standing instruction."
                : `Every mission starts by reading these ${filled} of ${BRIEF_FIELDS.length} answers${activeWorkspace?.name ? `, for ${activeWorkspace.name}` : ""}.`
        }
      />

      <Block title="What the crew reads before it acts">
        {brief.isLoading ? (
          <Loading>Reading the brief.</Loading>
        ) : brief.isError ? (
          // A failed read must never render blank fields whose save would wipe
          // the real brief.
          <Failed onRetry={() => void brief.refetch()}>
            The brief did not load. {(brief.error as Error)?.message ?? "The read failed."}
          </Failed>
        ) : (
          <>
            {BRIEF_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={`brief-${f.key}`}>
                <Textarea
                  id={`brief-${f.key}`}
                  value={form[f.key]}
                  rows={f.rows}
                  placeholder={f.placeholder}
                  aria-describedby={`brief-hint-${f.key}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, [f.key]: val }));
                    setBriefDirty(true);
                  }}
                />
                <span
                  id={`brief-hint-${f.key}`}
                  style={{
                    display: "block",
                    marginTop: 5,
                    fontSize: "var(--sp-text-label)",
                    color: "var(--sp-mute)",
                  }}
                >
                  {f.hint}
                </span>
              </Field>
            ))}

            <Field label="Voice" htmlFor="voice-anchor">
              <Textarea
                id="voice-anchor"
                value={voiceAnchor}
                rows={3}
                maxLength={2000}
                placeholder="Direct, evidence first, no hype. Challenge weak assumptions. Short declarative sentences."
                aria-describedby="voice-hint"
                onChange={(e) => {
                  setVoiceAnchor(e.target.value);
                  setVoiceDirty(true);
                }}
              />
              <span
                id="voice-hint"
                style={{
                  display: "block",
                  marginTop: 5,
                  fontSize: "var(--sp-text-label)",
                  color: "var(--sp-mute)",
                }}
              >
                The tone and stance every agent writes in. Leave it empty to skip.
              </span>
            </Field>

            <Actions>
              <Button
                variant="primary"
                disabled={!dirty || save.isPending || profile.isLoading}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Saving" : dirty ? "Save the brief" : "Saved"}
              </Button>
            </Actions>
          </>
        )}
      </Block>

      {/* People. Duplicated by /admin, which is gated on being an admin, so it
          stays until it has a section of its own. */}
      <Block title="People">
        <MembersCard />
        <TeamCard />
      </Block>

      <AdminDoor />
    </div>
  );
}

// The claim-admin affordance lives here rather than in the rail: the rail shows
// the Admin console only to actual admins.
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
      <Block>
        <Line
          label="Admin console"
          sub="Members, roles, the audit trail and billing for the whole workspace."
        >
          <Button variant="ghost" onClick={() => navigate({ to: "/admin" })}>
            Open
          </Button>
        </Line>
      </Block>
    );
  }

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
      <Block>
        <Line
          label="This workspace has no admin yet"
          sub="Claiming it puts members, roles, the audit trail and billing under one person."
        >
          <Button onClick={() => navigate({ to: "/admin" })}>Claim admin</Button>
          <Button variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </Line>
      </Block>
    );
  }

  return null;
}

/** No door in the index any more. The address answers so old links land. */
function MemorySection({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <PageHead title="Memory" sub="It is not set here any more." />
      <Empty action={<Button onClick={onOpen}>Open Brain</Button>}>
        What the loop knows, what it learned, and the gate that reviews a new memory all live in
        Brain now.
      </Empty>
    </>
  );
}

/* ================================================================== *
 * Agents - roster reach, models, keys
 *
 * The Crew lane is lifting the roster and the autonomy controls onto
 * /crew. Left exactly as they are so that lift is a move rather than a
 * merge.
 * ================================================================== */

type AgentRow = {
  id: string;
  slug: string;
  name: string;
  role: string;
  enabled: boolean;
  max_tool_risk?: string | null;
};

// Per-agent blast-radius cap. Sets agents.max_tool_risk; the loop then drops
// any tool whose tier exceeds the cap. Unrestricted (null) is the default.
const TOOL_CAP_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Anything" },
  { value: "low", label: "Low reach" },
  { value: "medium", label: "Medium reach" },
  { value: "high", label: "High reach" },
];

/** The DEFAULT oversight for the role, which is real product behaviour: agents
 *  that read or analyse run alone, agents that draft an artifact ask first, and
 *  agents that change code or deploy need review. A cap of "high" forces
 *  review. Never a fabricated per-tool state: the exact runtime mode is still
 *  resolved per tool by resolveApprovalMode. */
function defaultPosture(entry: ReturnType<typeof catalogEntry>): "alone" | "asks" | "review" {
  if (!entry) return "alone";
  if (entry.conductor) return "alone";
  if (entry.face === "critic") return "alone";
  if (entry.station === "sense" || entry.station === "learn") return "alone";
  if (entry.station === "build") return "review";
  return "asks";
}

function approvalForAgent(
  agent: AgentRow,
  entry: ReturnType<typeof catalogEntry>,
): { label: string; review: boolean } {
  const posture = agent.max_tool_risk === "high" ? "review" : defaultPosture(entry);
  if (posture === "review") return { label: "needs review", review: true };
  if (posture === "asks") return { label: "asks first", review: false };
  return { label: "runs alone", review: false };
}

function AgentReach({ agent }: { agent: AgentRow }) {
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
    <Select
      value={agent.max_tool_risk ?? ""}
      disabled={m.isPending}
      onChange={(e) => m.mutate(e.target.value)}
      aria-label={`How far ${agent.name} may reach`}
      style={{ width: 150 }}
    >
      {TOOL_CAP_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

function RosterSection() {
  const fAgents = useServerFn(listAgents);
  const agentsQ = useQuery({ queryKey: ["agents"], queryFn: () => fAgents() });

  if (agentsQ.isLoading) {
    return (
      <>
        <PageHead title="Roster" sub="How far each agent's tools may reach." />
        <Loading>Reading the roster.</Loading>
      </>
    );
  }

  if (agentsQ.error) {
    return (
      <>
        <PageHead title="Roster" sub="How far each agent's tools may reach." />
        <Failed onRetry={() => void agentsQ.refetch()}>
          The roster did not load. {(agentsQ.error as Error)?.message ?? "The read failed."}
        </Failed>
      </>
    );
  }

  const rows = ((agentsQ.data?.agents ?? []) as AgentRow[]).filter(
    (a) => catalogEntry(a.slug)?.status !== "deprecated",
  );

  if (rows.length === 0) {
    return (
      <>
        <PageHead title="Roster" sub="How far each agent's tools may reach." />
        <Empty>No agents in this workspace yet. They arrive with your first mission.</Empty>
      </>
    );
  }

  // Read down the loop (station order, cast then conductor), not by insert
  // order.
  const catOrder = new Map(SPECIALIST_CATALOG.map((c, i) => [c.slug, i]));
  const ordered = [...rows].sort(
    (a, b) => (catOrder.get(a.slug) ?? 999) - (catOrder.get(b.slug) ?? 999),
  );

  // The boundary currently in force, derived from the same rule each row shows.
  const modes = ordered.map((a) => approvalForAgent(a, catalogEntry(a.slug)));
  const alone = modes.filter((m) => m.label === "runs alone").length;
  const asks = modes.filter((m) => m.label === "asks first").length;
  const review = modes.filter((m) => m.review).length;

  return (
    <>
      <PageHead
        title="Roster"
        sub={
          <>
            <Num>{alone}</Num> run alone, <Num>{asks}</Num> ask first, and <Num>{review}</Num> wait
            for you on anything risky.
          </>
        }
      />

      <Block title="How far each one may reach">
        {ordered.map((a) => {
          const entry = catalogEntry(a.slug);
          const approval = approvalForAgent(a, entry);
          const off = a.enabled === false;
          return (
            <Line
              key={a.slug}
              label={
                <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-space-3)" }}>
                  <AgentMark slug={a.slug} name={a.name} state={off ? "quiet" : "idle"} />
                  {agentDisplayName(a.slug, a.name)}
                </span>
              }
              sub={
                off ? (
                  "Off. Turning an agent back on is set in Autonomy."
                ) : (
                  <>
                    <span className={approval.review ? "sp-warn" : undefined}>
                      {approval.label}
                    </span>
                    {" · "}
                    {agentBlurb(a.slug) ?? a.role}
                  </>
                )
              }
            >
              <AgentReach agent={a} />
            </Line>
          );
        })}
      </Block>

      <Empty>
        A new tool asks for permission the moment it is first needed, inside the run. What each
        agent has learned, and every run it has taken, live on Crew.
      </Empty>
    </>
  );
}

function ModelsSection() {
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

  const defaultName = defaultModel === AUTO_MODEL ? "Auto" : (current?.label ?? defaultModel);
  const agenticName = !agenticModel ? "Auto" : (currentAgentic?.label ?? agenticModel);
  const via = (model: string | null, m: (typeof MODELS)[number] | null | undefined) =>
    !model || model === AUTO_MODEL
      ? "routed per task"
      : m
        ? m.live
          ? "our key"
          : "your key"
        : "unknown";

  // A failed profile read must not render the model rows with silent defaults.
  // BYO keys load independently, so they stay.
  if (profile.isError) {
    return (
      <>
        <PageHead title="Models and keys" sub="Which model runs your work, and whose key pays." />
        <Failed onRetry={() => void profile.refetch()}>
          Your model settings did not load.{" "}
          {(profile.error as Error)?.message ?? "The read failed."}
        </Failed>
        <ByoKeysBlock />
      </>
    );
  }

  const modelOptions = (
    <>
      <optgroup label="On our key">
        {MODELS.filter((m) => m.live).map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}: {m.desc}
          </option>
        ))}
      </optgroup>
      <optgroup label="Needs your own key">
        {MODELS.filter((m) => !m.live).map((m) => (
          <option key={m.id} value={m.id} disabled>
            {m.label}: {m.desc}
          </option>
        ))}
      </optgroup>
    </>
  );

  return (
    <>
      <PageHead
        title="Models and keys"
        sub={
          profile.isLoading
            ? "Reading your model settings."
            : `Everything you start runs on ${defaultName}. Everything the loop starts by itself runs on ${agenticName}.`
        }
      />

      <Block title="Which model runs the work">
        {profile.isLoading ? (
          <Loading>Reading your model settings.</Loading>
        ) : (
          <>
            <Line
              label="Work you start"
              sub={`Chat and any run you kick off · ${via(defaultModel, current)}`}
            >
              <span style={{ color: "var(--sp-mute)", fontSize: "var(--sp-text-meta)" }}>
                {defaultName}
              </span>
              <Button variant="ghost" aria-expanded={editing} onClick={() => setEditing((v) => !v)}>
                Change
              </Button>
            </Line>
            {editing ? (
              <Field label="Work you start" htmlFor="model-default">
                <div style={{ display: "flex", gap: "var(--sp-space-2)" }}>
                  <Select
                    id="model-default"
                    style={{ flex: 1 }}
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                  >
                    <optgroup label="Recommended">
                      <option value={AUTO_MODEL}>Auto: the best model per task</option>
                    </optgroup>
                    {modelOptions}
                  </Select>
                  <Button
                    variant="primary"
                    disabled={saveModel.isPending}
                    onClick={() => saveModel.mutate()}
                  >
                    {saveModel.isPending ? "Saving" : "Save"}
                  </Button>
                </div>
              </Field>
            ) : null}

            <Line
              label="Work the loop starts"
              sub={`Research, clustering and reflection ticks · ${via(agenticModel, currentAgentic)}`}
            >
              <span style={{ color: "var(--sp-mute)", fontSize: "var(--sp-text-meta)" }}>
                {agenticName}
              </span>
              <Button
                variant="ghost"
                aria-expanded={editingAgentic}
                onClick={() => setEditingAgentic((v) => !v)}
              >
                Change
              </Button>
            </Line>
            {editingAgentic ? (
              <Field label="Work the loop starts" htmlFor="model-agentic">
                <div style={{ display: "flex", gap: "var(--sp-space-2)" }}>
                  <Select
                    id="model-agentic"
                    style={{ flex: 1 }}
                    value={agenticModel ?? ""}
                    onChange={(e) => setAgenticModel(e.target.value || null)}
                  >
                    <option value="">Auto: the best model per task</option>
                    {modelOptions}
                  </Select>
                  <Button
                    variant="primary"
                    disabled={saveAgenticModel.isPending}
                    onClick={() => saveAgenticModel.mutate()}
                  >
                    {saveAgenticModel.isPending ? "Saving" : "Save"}
                  </Button>
                </div>
              </Field>
            ) : null}
          </>
        )}
      </Block>

      <ByoKeysBlock />
    </>
  );
}

function ByoKeysBlock() {
  const qc = useQueryClient();
  const fKeys = useServerFn(listApiKeys);
  const fSaveKey = useServerFn(saveApiKey);
  const fDelKey = useServerFn(deleteApiKey);
  const fTestKey = useServerFn(testApiKey);
  const keys = useQuery({ queryKey: ["api-keys"], queryFn: () => fKeys() });
  // Bring-your-own AI keys are enterprise only. Same ["billing"] key as the
  // Plan section, so this dedupes with it rather than firing a second fetch.
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
    <Block
      title="Your own provider keys"
      sub={
        isEnterprise
          ? "Claude, OpenAI, Qwen, DeepSeek, Groq, Mistral, Moonshot, OpenRouter and anything with a compatible endpoint. Stored encrypted, per user. A base URL is only needed for providers that host their own."
          : "An Enterprise boundary. Every other plan runs on Supaprod credits, with the same model-agnostic routing. It just uses our keys."
      }
    >
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
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "var(--sp-space-2)",
            }}
          >
            <Select
              value={keyProv}
              onChange={(e) => setKeyProv(e.target.value)}
              aria-label="Provider"
            >
              {BYO_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
            <Input
              value={keyLabel}
              onChange={(e) => setKeyLabel(e.target.value)}
              aria-label="Label"
              placeholder="Label, optional"
            />
            <Input
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              type="password"
              aria-label="API key"
              placeholder={BYO_PROVIDERS.find((p) => p.id === keyProv)?.placeholder}
            />
            <Input
              value={keyBase}
              onChange={(e) => setKeyBase(e.target.value)}
              aria-label="Base URL"
              placeholder="Base URL, self-hosted only"
            />
          </div>
          {keyProv === "custom" || keyBase.trim() ? (
            <Input
              style={{ width: "100%", marginTop: "var(--sp-space-2)" }}
              value={keyModelId}
              onChange={(e) => setKeyModelId(e.target.value)}
              aria-label="Model id"
              placeholder="Model id, exactly as the provider names it"
            />
          ) : null}
          <Actions>
            {/* Not primary: the primary on this section is the model save. */}
            <Button type="submit" disabled={mSaveKey.isPending || !keyValue.trim()}>
              {mSaveKey.isPending ? "Saving" : "Add key"}
            </Button>
            <Button
              disabled={mTestKey.isPending || !keyValue.trim()}
              onClick={() => mTestKey.mutate()}
            >
              {mTestKey.isPending ? "Testing" : "Test it first"}
            </Button>
            {testResult ? (
              <span
                className={testResult.ok ? "sp-pass" : "sp-fail"}
                style={{ fontSize: "var(--sp-text-meta)" }}
              >
                {testResult.ok ? (
                  <>
                    Answered in <Num>{testResult.latency_ms}ms</Num>
                  </>
                ) : (
                  (testResult.error ?? "Test failed").slice(0, 90)
                )}
              </span>
            ) : null}
          </Actions>
        </form>
      ) : null}

      {isEnterprise || keyList.length > 0 ? (
        <>
          {keys.isLoading ? (
            <Loading>Reading your keys.</Loading>
          ) : keys.isError ? (
            <Failed onRetry={() => void keys.refetch()}>
              Your keys did not load. {(keys.error as Error)?.message ?? "The read failed."}
            </Failed>
          ) : keyList.length === 0 ? (
            <Empty>No key of your own yet. Until there is one, runs use ours.</Empty>
          ) : (
            keyList.map((k) => (
              <Line
                key={k.id}
                label={
                  <>
                    {BYO_PROVIDERS.find((p) => p.id === k.provider)?.label ?? k.provider}
                    {k.label ? <span style={{ color: "var(--sp-mute)" }}> · {k.label}</span> : null}
                  </>
                }
                sub={
                  <Num>
                    {k.preview}
                    {k.model_id ? ` · ${k.model_id}` : ""}
                    {k.base_url ? ` · ${k.base_url}` : ""}
                  </Num>
                }
              >
                <Button
                  variant="ghost"
                  disabled={mDelKey.isPending && mDelKey.variables === k.id}
                  onClick={() => mDelKey.mutate(k.id)}
                >
                  Remove
                </Button>
              </Line>
            ))
          )}
        </>
      ) : null}
    </Block>
  );
}

/* ================================================================== *
 * Plan and usage
 * ================================================================== */

function PlanSection({ checkout }: { checkout?: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/settings" });
  const fGetBilling = useServerFn(getBillingState);
  const fGetSub = useServerFn(getMySubscription);
  const fCancelSub = useServerFn(cancelMySubscription);
  const fResumeSub = useServerFn(resumeMySubscription);
  const fPortal = useServerFn(createPortalSession);
  const confirm = useConfirm();

  const billing = useQuery({ queryKey: ["billing"], queryFn: () => fGetBilling({ data: {} }) });

  // Resolve env lazily so a missing payments token does not crash render.
  let envSafe: ReturnType<typeof getStripeEnvironment> | null = null;
  try {
    envSafe = getStripeEnvironment();
  } catch {
    envSafe = null;
  }

  // getMySubscription is a pure Supabase read, so local dev without a payments
  // token still loads it.
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
    mutationFn: () => fPortal({ data: { environment: subEnv, returnUrl: window.location.href } }),
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

  // The one irreversible confirmation this surface is allowed.
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
  const sub = mySub.data;
  const hasSub = !!sub?.hasSubscription;
  const renews = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const renewsLabel = renews
    ? renews.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  const isPastDue = sub?.status === "past_due";
  const statusWord = sub?.cancelAtPeriodEnd
    ? "Cancels at the end of this period"
    : isPastDue
      ? "The payment method failed"
      : "Active";
  const statusClass = sub?.cancelAtPeriodEnd ? "sp-warn" : isPastDue ? "sp-fail" : undefined;

  if (billing.isLoading) {
    return (
      <>
        <PageHead title="Plan" sub="What this workspace is entitled to." />
        <Loading>Reading your plan.</Loading>
      </>
    );
  }

  // An error never wears an empty state's clothes: a failed read must not
  // render as a silent "Free".
  if (billing.isError) {
    return (
      <>
        <PageHead title="Plan" sub="What this workspace is entitled to." />
        <Failed onRetry={() => void billing.refetch()}>
          Your plan did not load. {(billing.error as Error)?.message ?? "The read failed."}
        </Failed>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Plan"
        sub={
          hasSub && renewsLabel
            ? `${current.name}, ${sub?.cancelAtPeriodEnd ? "open until" : "renewing"} ${renewsLabel}.`
            : `${current.name}. ${current.tagline}`
        }
      />
      <PaymentTestModeBanner />

      <Block title="What you are on">
        <Line label={current.name} sub={current.tagline}>
          {hasSub ? (
            <span className={statusClass} style={{ fontSize: "var(--sp-text-meta)" }}>
              {statusWord}
            </span>
          ) : null}
        </Line>
        {hasSub && renewsLabel ? (
          <Line label={sub?.cancelAtPeriodEnd ? "Access until" : "Renews on"}>
            <Num>{renewsLabel}</Num>
          </Line>
        ) : null}

        {state && !state.isOwner ? (
          <Empty>Only the workspace owner can change or cancel the plan.</Empty>
        ) : (
          <Actions>
            {hasSub ? (
              <Button
                variant={isPastDue ? "primary" : "default"}
                disabled={openPortal.isPending}
                onClick={() => openPortal.mutate()}
              >
                {openPortal.isPending ? "Opening" : "Manage billing"}
              </Button>
            ) : null}
            {hasSub ? (
              sub?.cancelAtPeriodEnd ? (
                <Button disabled={resumeSub.isPending} onClick={() => resumeSub.mutate()}>
                  {resumeSub.isPending ? "Resuming" : "Resume the plan"}
                </Button>
              ) : (
                <Button variant="ghost" disabled={cancelSub.isPending} onClick={onCancelClick}>
                  {cancelSub.isPending ? "Canceling" : "Cancel the plan"}
                </Button>
              )
            ) : null}
            {currentTier !== "free" ? (
              <Button variant="ghost" onClick={() => navigate({ search: { section: "credits" } })}>
                Buy a credit top-up
              </Button>
            ) : null}
          </Actions>
        )}
      </Block>

      <Block title="What else you could be on">
        <PlanTable currentTier={currentTier} canSelect={state?.isOwner ?? false} />
      </Block>

      {/* The claim sits under the plan on purpose. A person who has worked alone
          for a year and is now joining an organisation is standing exactly here,
          looking at what their plan is and what it could be, and the question
          "what happens to everything I already built" belongs in that moment
          rather than buried in a workspace pane. It renders for every tier: the
          single-seat user needs the offer, and the Business admin needs the
          record of who handed what over. */}
      <WorkspaceClaimCard />
    </>
  );
}

function CreditsSection() {
  const fGetCredits = useServerFn(getMyCreditsView);
  const fGetCatalog = useServerFn(getPricingCatalog);

  let envSafe: ReturnType<typeof getStripeEnvironment> | null = null;
  try {
    envSafe = getStripeEnvironment();
  } catch {
    envSafe = null;
  }

  // getMyCreditsView is a pure Supabase read; `environment` only scopes the
  // recent-topups filter, so a missing Stripe token must never block the
  // balance from loading.
  const creditsEnv: "sandbox" | "live" = envSafe ?? "sandbox";
  const credits = useQuery({
    queryKey: ["my-credits", creditsEnv],
    queryFn: () => fGetCredits({ data: { environment: creditsEnv } }),
  });
  const catalog = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fGetCatalog() });

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

  // Bundles come from the admin-managed catalog ONLY: a hardcoded ladder
  // renders clickable prices no backend would honour. No catalog rows, no grid.
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

  const [selectedKey, setSelectedKey] = useState<string>("");
  const selectedBundle = BUNDLES.find((b) => b.key === selectedKey) ?? BUNDLES[0];
  const bestPerCredit = BUNDLES.reduce(
    (min, b) => Math.min(min, b.priceCents / b.credits),
    Infinity,
  );

  const balance = data ? data.balanceCredits + data.topupCredits : null;

  return (
    <>
      <PageHead
        title="Credits"
        sub={
          credits.isLoading
            ? "Reading your balance."
            : credits.isError
              ? "Your balance did not load."
              : data && !data.enabled
                ? "Metering is off while the rollout finishes. Top-ups are recorded and count once it turns on."
                : balance !== null
                  ? `${balance.toLocaleString()} credits left in this cycle.`
                  : "What the crew spends when it works."
        }
      />
      <PaymentTestModeBanner />

      <Block title="Balance">
        {credits.isError ? (
          <Failed onRetry={() => void credits.refetch()}>
            Your balance did not load. {(credits.error as Error)?.message ?? "The read failed."}
          </Failed>
        ) : credits.isLoading ? (
          <Loading>Reading your balance.</Loading>
        ) : (
          <>
            <div
              style={{
                fontFamily: "var(--sp-font-mono)",
                fontVariantNumeric: "tabular-nums",
                fontSize: "var(--sp-text-title)",
                color: "var(--sp-ink)",
              }}
            >
              {balance !== null ? balance.toLocaleString() : "--"}
            </div>
            {data ? (
              <>
                <Line
                  label="Granted this cycle"
                  sub={cycleLabel ? `Since ${cycleLabel}` : undefined}
                >
                  <Num>{data.monthlyGrantCredits.toLocaleString()}</Num>
                </Line>
                <Line label="Bought on top">
                  <Num>{data.topupCredits.toLocaleString()}</Num>
                </Line>
                {data.enabled && data.monthlyGrantCredits > 0 ? (
                  <div style={{ marginTop: "var(--sp-space-3)", maxWidth: 260 }}>
                    <UsageIndicator
                      used={Math.max(0, data.monthlyGrantCredits - data.balanceCredits)}
                      allowance={data.monthlyGrantCredits}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </Block>

      <CreditCapsCard />

      <Block title="Buy more">
        {catalog.isLoading ? (
          <Loading>Reading the price list.</Loading>
        ) : catalog.error ? (
          <Failed onRetry={() => void catalog.refetch()}>
            The price list did not load. {(catalog.error as Error)?.message ?? "The read failed."}
          </Failed>
        ) : BUNDLES.length === 0 ? (
          <Empty>
            No top-up is published yet. When one is, it appears here at the price that will actually
            be charged.
          </Empty>
        ) : (
          <>
            {/* A grid, for the same reason the source catalog is one: a ladder
                of prices is scanned across, not read down. Token-built rather
                than borrowing the crew roster's classes, which mean something
                else. Selection is a ring, never a fill: ember marks the human
                and a chosen bundle is not one. */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(196px, 1fr))",
                gap: "var(--sp-space-2)",
              }}
            >
              {BUNDLES.map((b) => {
                const wouldExceed = remainingTopupRoom !== null && b.credits > remainingTopupRoom;
                const perCredit = b.priceCents / b.credits;
                const isBest = Math.abs(perCredit - bestPerCredit) < 1e-9;
                const selected = selectedBundle?.key === b.key;
                return (
                  <button
                    key={b.key}
                    type="button"
                    disabled={wouldExceed}
                    aria-pressed={selected}
                    title={wouldExceed ? "Past your per-cycle top-up limit." : undefined}
                    onClick={() => setSelectedKey(b.key)}
                    style={{
                      display: "block",
                      width: "100%",
                      font: "inherit",
                      textAlign: "left",
                      border: 0,
                      padding: "10px 12px",
                      borderRadius: "var(--sp-radius-card)",
                      boxShadow: selected ? "inset 0 0 0 1px var(--sp-ink)" : undefined,
                      background: "var(--sp-lift)",
                      color: "var(--sp-ink)",
                      cursor: wouldExceed ? "not-allowed" : "pointer",
                      opacity: wouldExceed ? 0.45 : 1,
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "var(--sp-text-body)",
                        fontWeight: "var(--sp-weight-medium)",
                      }}
                    >
                      <Num>{b.credits.toLocaleString()}</Num> credits
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: 1,
                        fontSize: "var(--sp-text-label)",
                        color: "var(--sp-mute)",
                      }}
                    >
                      {fmtPrice(b.priceCents)} · {(perCredit / 100).toFixed(3)} each
                      {isBest ? " · best rate" : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Honest checkout: while payments are dormant there is no Buy
                button at all, because a disabled buy is still a dead promise. */}
            {selectedBundle && envSafe ? (
              <Actions>
                <Button
                  variant="primary"
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
                  Buy {selectedBundle.credits.toLocaleString()} credits ·{" "}
                  {fmtPrice(selectedBundle.priceCents)}
                </Button>
              </Actions>
            ) : selectedBundle ? (
              <Empty>
                Buying is not switched on in this build. The prices are live so you can plan against
                them.
              </Empty>
            ) : null}
          </>
        )}

        {data ? (
          <Empty>
            <Num>{data.cycleTopupCredits.toLocaleString()}</Num> of{" "}
            <Num>{data.cycleTopupCapCredits.toLocaleString()}</Num> top-up credits used this cycle.{" "}
            <a
              href="mailto:sales@supaprod.ai?subject=Enterprise%20credits"
              style={{ color: "var(--sp-ink)" }}
            >
              Ask about volume pricing
            </a>{" "}
            if you need past the cap.
          </Empty>
        ) : null}
      </Block>

      <RedeemCodeCard />

      {/* The receipts for purchases made HERE. What the credits were SPENT on
          is a report, and it lives in the Engine room's Spend view. */}
      <Block title="What you bought">
        {credits.isLoading ? (
          <Loading>Reading your purchases.</Loading>
        ) : credits.isError ? (
          <Empty>Your purchases did not load. Use the retry above.</Empty>
        ) : !data || data.topups.length === 0 ? (
          <Empty>Nothing bought yet. Your monthly grant is covering the work.</Empty>
        ) : (
          data.topups.map((t) => (
            <Row
              key={`top-${t.id}`}
              tight
              lead="Credit top-up"
              sub={
                <span className="sp-pass">+{Number(t.credits_added).toLocaleString()} credits</span>
              }
              time={new Date(t.created_at).toLocaleDateString()}
            />
          ))
        )}
      </Block>

      {checkoutKey ? (
        <StripeEmbeddedCheckout
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          priceLookupKey={checkoutKey}
          title={checkoutTitle}
          mode="topup"
        />
      ) : null}
    </>
  );
}
