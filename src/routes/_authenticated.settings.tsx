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
 *    oversight: there is no Settings landing page. An overview screen would be a
 *    surface whose job is "look at things", which question 1 says is the finding
 *    rather than the design.
 *
 *    WHAT LEADS, settled 2026-08-10 after a pass at the opposite: /settings
 *    opens on Profile. The 2026-08-06 change led on Autonomy and approvals,
 *    because question 1 says the sentence in the visitor's head is "stop asking
 *    me before it edits code". True, and still the wrong default. A bare
 *    /settings is an address people ARRIVE at - the account menu, `g s`, the
 *    /notifications redirect, a palette entry saying only "Settings" - and
 *    Autonomy is the governance pane, the one a security reviewer is walked
 *    through. Somewhere that consequential is a destination you choose. Autonomy
 *    also stopped being an editor in the same pass that gave /boundary the one
 *    home, so leading on it now means leading on a read-only restatement of
 *    another surface. It keeps the FIRST door in the nav, so Home reaches it in
 *    one keypress. The defence in full, with the grouping it belongs to, is the
 *    header of lib/settings-sections.ts, which is the only place the IA is
 *    written.
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
 *    MOVED, 2026-08-10, and this is the receipt for the line that used to sit
 *      here saying it was pending:
 *      · the per-agent tool-reach control -> /crew, which already had it. What
 *        stays is a READ of the same rows under /crew's own query key, and a
 *        door per agent. See the RosterSection header for the second thing that
 *        went with it, which was worse than the duplication: a posture this
 *        page GUESSED at from the agent catalog rather than read from the
 *        stored dial.
 *      · every tool boundary -> /boundary, the one home for it by founder
 *        ruling. Autonomy states what that boundary currently allows and links
 *        to it; it no longer offers a second set of levers in a second
 *        vocabulary over the same stored value.
 *    STILL PENDING, unmoved and honestly flagged -
 *      · the credit debit ledger and per-product attribution -> Engine room,
 *        Spend. Purchases stay, because the purchase is made here.
 *      · Members and Team duplicate /admin. Left rendering because /admin is
 *        gated behind being an admin, so a workspace owner who is not a
 *        platform admin would otherwise have nowhere to manage their own people.
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
 * WHAT THE GROUPS ARE NAMED, changed 2026-08-06. The five headings used to be
 * You / Workspace / Agents / Sources and data / Plan, which group by whose thing
 * it is - the data model's shape, not a person's. They are now named by which
 * boundary you came to move: What the crew may do · What the crew reads · What
 * it can reach · What reaches you · What it costs, and whether it works. No door
 * was removed and no pane moved file; only which heading a door sits under.
 *
 * THE KEYBOARD, added 2026-08-06. The index was fourteen unmanaged tab stops
 * with no arrow keys and no skip link, so Diagnostics was a fourteen-press
 * crawl. It is one tab stop now, with Up/Down/Home/End, typeahead and a skip
 * link. See SettingsIndex.
 *
 * UNCHANGED: the ?section= / ?tab= / ?connector= / ?checkout= contract, every
 * legacy deep link, and every server function, mutation and query key still
 * rendered. Destructive actions keep their confirmation.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import { Num, Actions } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  agentDisplayName,
  agentStation,
  AGENT_STATION_ORDER,
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
import {
  matchReason,
  NAV_GROUPS,
  normalizeSection,
  paneForSection,
  searchSections,
  subTargetFor,
  type SectionId,
} from "@/lib/settings-sections";
import { SidebarNav, type RailItem } from "@/components/meridian/SidebarNav";
import { AgentCards } from "@/components/meridian/AgentCards";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { STAGE_LABEL } from "@/components/shell/run-strip";

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
import { ARC_CHOICE, MODE_CHOICE } from "@/components/crew/crew-words";
import { stationCrew } from "@/lib/spine/driver";
import { listCrew, type CrewMember } from "@/lib/crew.functions";

import { Block, Button, Empty, Failed, Field, Input, Loading, PageHead, Select, Textarea } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";

/* ================================================================== *
 * The index
 *
 * The doors are READ FROM settings-sections.ts now, and are no longer
 * declared here.
 *
 * THE DEFECT THAT CHANGE PREVENTS, which this file shipped for a month:
 * there were two lists of what Settings contains. This route carried a
 * private GROUPS array of five groups and fourteen doors, and
 * settings-sections.ts carried a DIFFERENT five groups holding sixteen
 * sections, and nothing anywhere compared them. They had already drifted
 * - the module still filed Memory under Workspace and Sync under
 * Connections while this file had dropped both doors, and the module
 * called the same pane "Models & keys" while the nav drew "Models and
 * keys". The unit tests passed the whole time, because they only ever
 * read the module, and the module was the copy nobody rendered. One
 * list, asserted by those tests, is the fix.
 *
 * The fold (`sync` -> Connectors) moved with it, for the same reason:
 * it is part of the address contract, and a second private copy of an
 * address contract is how a saved link quietly starts 404ing.
 * ================================================================== */

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

/** Where the skip link lands, and what the nav's Tab exit reaches. */
const PANE_ID = "settings-pane";

/**
/**
 * The left-hand index, now Meridian's own rail.
 *
 * ── WHAT THIS REPLACED, AND WHY IT WAS NOT A LOSS ───────────────────────────
 * A hand-rolled nav on retired Cadence/ink tokens (`--sp-lift`, `--sp-mute`,
 * `sp-tab`) that had built, correctly and alone, the three things the design
 * system's rail was missing: a roving tabindex, arrow keys and typeahead. Its own
 * header recorded why -- "Diagnostics was a fourteen-press crawl".
 *
 * So the rail was taught those first (see `stepRail`, `railTypeahead`,
 * `isRailKey`), because swapping onto a rail without them would have taken this
 * surface's one tab stop back to twelve. One implementation now, shared with every
 * other nav in the product, which is the whole point of the exercise.
 *
 * ── WHAT IS DELIBERATELY GONE ───────────────────────────────────────────────
 * The group DESCRIPTION paragraph. It rendered under whichever heading was active,
 * so a 200px column carried a sentence of prose above a list of twelve rows. The
 * founder's complaint about these surfaces was "just a dump of the content", and a
 * paragraph explaining a heading is the shape that complaint takes in a sidebar. The
 * descriptions still exist in `settings-sections.ts` and are still the right words;
 * they are simply not chrome the reader has to scroll past to reach a door.
 *
 * The keyboard HINT line is gone for the same reason, and replaced by something
 * better rather than deleted: the rail carries a search field with a `/` keycap on
 * it, which is a visible affordance instead of a sentence describing invisible ones.
 *
 * ── THE SKIP LINK STAYS OUTSIDE THE RAIL ────────────────────────────────────
 * It is this surface's own concern, not the rail's: it targets THIS page's pane.
 * Pushing it into Meridian would put a Settings-shaped hole in a shared component.
 */
function SettingsIndex({ active, onSet }: { active: SectionId; onSet: (id: SectionId) => void }) {
  const [skipFocused, setSkipFocused] = useState(false);
  const [query, setQuery] = useState("");
  const { activeWorkspace } = useWorkspace();

  /*
   * The doors, as rail rows. Read from NAV_GROUPS so there is still exactly one list
   * of what Settings contains -- the defect this file's header describes at length is
   * two lists drifting apart, and a private copy here would restore it.
   */
  const allItems: RailItem[] = NAV_GROUPS.flatMap((g) =>
    g.sections.map((sec) => ({ key: sec.id, label: sec.label, section: g.label })),
  );

  /*
   * SEARCH GOES INSIDE THE PANES, not across the twelve headings.
   *
   * THE FIRST VERSION OF THIS WAS `label.includes(query)` AND THE FOUNDER BROKE IT IN
   * A MINUTE: typing "credits" found nothing and "invite" found nothing, though this
   * surface does both. Credits is inside Billing since the fold; inviting somebody is
   * a People block on the Brief and voice pane. A search over door names answers
   * "which door is called this", and nobody asks that.
   *
   * `searchSections` owns the matching and the ranking so the rule is testable
   * without a DOM and cannot drift from the IA it searches. The reason a door matched
   * is drawn on the row when the label alone does not explain it -- being offered
   * "Billing" for "credits" is correct and baffling without the word that caught it.
   *
   * A query matching nothing keeps the FULL list. A nav that can empty itself is a
   * set of doors that can vanish, and a mistype must not strand somebody on the
   * surface they are standing on.
   */
  const hits = searchSections(query);
  const items = query.trim()
    ? hits.length > 0
      ? hits.map((id) => {
          const found = allItems.find((i) => i.key === id)!;
          /*
           * NAME THE BLOCK WHEN THERE IS ONE. Founder: typing "invite" should offer
           * "Invite teammates", not the pane that happens to contain it. A sub-target
           * is a better answer than a keyword reason, so it wins: the row shows the
           * heading the reader will actually arrive at, and `section` stays underneath
           * it so the crumb still says which pane that is.
           */
          const target = subTargetFor(id, query);
          if (target) return { ...found, label: target.label, section: found.label };
          const why = matchReason(id, query);
          return why ? { ...found, label: `${found.label}  ${why}` } : found;
        })
      : allItems
    : allItems;

  return (
    <div
      style={{
        flex: "0 1 240px",
        minWidth: 200,
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        gap: "var(--mrd-s3)",
      }}
    >
      {/* Announced and reachable, drawn only while it holds focus. */}
      <a
        href={`#${PANE_ID}`}
        onFocus={() => setSkipFocused(true)}
        onBlur={() => setSkipFocused(false)}
        style={
          skipFocused
            ? {
                fontSize: "var(--mrd-t-micro)",
                color: "var(--mrd-ink)",
                padding: "4px 8px",
                borderRadius: "var(--mrd-r-chip)",
                background: "var(--mrd-lift)",
                boxShadow: "inset 0 0 0 1px var(--mrd-line)",
              }
            : {
                position: "absolute",
                width: 1,
                height: 1,
                overflow: "hidden",
                clipPath: "inset(50%)",
                whiteSpace: "nowrap",
              }
        }
      >
        Skip to the settings
      </a>

      <SidebarNav
        items={items}
        activeKey={active}
        onNavigate={(key) => {
          onSet(key as SectionId);
          /*
           * THEN LAND ON THE BLOCK. Founder: "when I click on that, it would literally
           * point me to this section."
           *
           * Deferred one frame because the pane it is on has not mounted yet at the
           * moment the door is chosen -- `getElementById` on this tick finds nothing
           * and the reader arrives at the top of a long pane, which is the bug this
           * exists to fix. Two frames, because the first commits the pane and the
           * second lets layout settle before a smooth scroll is measured.
           *
           * `scrollMarginTop` on the anchor keeps the heading clear of the sticky head.
           */
          const target = subTargetFor(key as SectionId, query);
          if (!target) return;
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              document
                .getElementById(target.anchor)
                ?.scrollIntoView({ behavior: "smooth", block: "start" }),
            ),
          );
        }}
        workspaceName={activeWorkspace?.name ?? "Workspace"}
        /*
         * NO `onWorkspaceClick`, on purpose, so the row states the workspace rather
         * than pretending to switch it. Switching lives in the app shell's own scope
         * menu, and a second switcher here would be two controls over one value.
         */
        onSearch={setQuery}
        /* Never collapsed: this rail is already inside a page whose shell has its own
           rail, and a collapse control on the inner one is a second, conflicting way
           to narrow the same column. */
        collapsed={false}
      />
    </div>
  );
}


function SettingsPage() {
  const { section, tab, connector, checkout } = Route.useSearch();
  // ?section= is canonical; legacy ?tab= keeps landing.
  const rawSection = section ?? tab;
  const resolved = normalizeSection(rawSection);
  const active = paneForSection(resolved);
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
      {/* tabIndex -1 so the skip link can actually land focus here. Without it
          the anchor scrolls the pane into view and leaves focus in the nav, so
          the next Tab goes back to where it already was - a skip link that does
          not move focus is a skip link that does not work. */}
      <div
        id={PANE_ID}
        tabIndex={-1}
        className="sp-main"
        /* NO `outline: none`. The pane takes focus when the nav moves between
           sections, so suppressing its ring left a keyboard user with nothing
           on screen saying where focus went -- on the one surface whose whole
           point was to become a single tab stop with arrow keys. The ring is
           drawn only for keyboard focus, so a mouse click still shows nothing. */
        style={{ flex: "1 1 460px", maxWidth: "none" }}
      >
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

        {active === "staff" && (
          <RosterSection
            onOpenCrew={(slug) => navigate({ to: "/crew", search: slug ? { agent: slug } : {} })}
          />
        )}
        {active === "autonomy" && (
          <>
            <PageHead
              title="Autonomy and approvals"
              // It no longer says "set the boundary here". The boundary has one
              // home and this is not it; what this pane does is state what that
              // boundary currently allows, beside the two things that ARE set
              // here and nowhere else: the kill switch and the auto-pipelines.
              sub="What the crew may do without you, what routes itself, and the switch that stops all of it."
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

        {/*
         * ONE PANE ANSWERS BOTH MONEY QUESTIONS, 2026-08-17.
         *
         * `credits` now folds into `billing` (settings-sections.ts), so
         * `paneForSection` resolves both addresses to `billing` and there is no
         * longer an `active === "credits"` branch to render. Dropping the second
         * branch WITHOUT mounting CreditsSection here would have made the whole
         * credits surface unreachable while every test still passed -- this repo's
         * single most common defect, a capability built correctly with no door.
         *
         * The order is the reading order: what you are on, then what is left on it.
         */}
        {active === "billing" && (
          <>
            <PlanSection checkout={checkout} />
            <CreditsSection />
          </>
        )}
        {active === "health" && (
          <DiagnosticsMoved
            onOpen={() =>
              navigate({ to: "/engine-room", search: { room: "quality", view: "diagnostics" } })
            }
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================== *
 * You - profile, appearance, hours
 * ================================================================== */

// Two grounds only. "System" was removed on 2026-08-14: it let the product open
// in a ground nobody picked, and it made the toggle a three-stop control for a
// two-state choice. Dark is the ground the product is designed on.
const THEME_CHOICES: { id: Theme; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
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
        {/*
         * ROLE IS GONE, 2026-08-17, and it was collected for nothing.
         *
         * A free-text job title, defaulted to "AI Product Manager", written to the
         * profiles row on every save -- and read by NOTHING. Grepped: `role` appears
         * in profile.functions.ts only in the input schema and the type. Every other
         * `role` in the product is a WORKSPACE role (owner, admin, member), which is a
         * different fact entirely.
         *
         * data-minimalism.md: no field exists unless a named consumer needs it, and
         * "collect now, use later" is not a reason. Asking a person for their job
         * title and then never using it is worse than a wasted row: it is personal
         * data held for no purpose, which is exactly the lens the founder applied.
         *
         * The column is not dropped here. Stopping the capture is this surface's
         * decision; removing stored data is a migration and a separate one.
         */}
        <Line label="Timezone" sub="Every time on every surface is read in it.">
          <Input
            aria-label="Timezone"
            style={{ width: 240 }}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/New_York"
          />
        </Line>
        {/*
         * THE CHOSEN MARK IS DRAWN AT SIZE, which is the bug the founder reported:
         * "if you check and select some icon out of the available ones, it still gets
         * selected, but it does not display on the profile".
         *
         * He was right, and the cause is worse than a missing preview. The picker
         * saves to localStorage and `src/components/supaprod/Avatar.tsx` -- the only
         * thing that renders an orb -- IS MOUNTED NOWHERE IN THE PRODUCT. The shell
         * draws initials instead (`initialsFrom` in `src/lib/initials.ts`). This route's own header
         * records killing "the avatar identity header sitting above the fields", and
         * that header was the one place the choice was ever shown. So a person could
         * pick from twelve marks and never see one anywhere.
         *
         * Drawing the current mark beside the swatches gives the choice its first real
         * consumer, and gives the reader the before/after a picker needs to be usable
         * at all. The shell adopting it is the follow-up; this makes the control honest
         * today rather than leaving it decorative for another pass.
         */}
        <Line
          label="Mark"
          sub={name ? `Stands in for ${name} wherever you acted.` : "Stands in for you."}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s4)" }}>
            <span
              aria-hidden
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                flexShrink: 0,
                background: orbBackground(avatarChoice ?? defaultAvatarVariant(name)),
                boxShadow: "inset 0 1px 0 var(--mrd-sheen), var(--mrd-shadow-card)",
              }}
            />
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
          </span>
        </Line>
      </Block>

      <div id={HOURS_ANCHOR} style={{ scrollMarginTop: "var(--mrd-s7)" }}>
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
      </div>

      <div id={APPEARANCE_ANCHOR} style={{ scrollMarginTop: "var(--mrd-s7)" }}>
        <Block title="Appearance">
          <Line label="Theme" sub="System follows your device. Dark is the default.">
            <Choice value={theme} options={THEME_CHOICES} onPick={setTheme} label="Theme" />
          </Line>
          <Line label="Density" sub="Compact drops a row of breathing room. Type stays the same.">
            <Choice value={density} options={DENSITY_CHOICES} onPick={setDensity} label="Density" />
          </Line>
        </Block>
      </div>
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

      {/*
       * ── THE NESTED BLOCK IS GONE, 2026-08-17 ──────────────────────────────────
       * Founder, twice: "in Brief and voice, if you go to the bottom, there is an
       * Invite teammates button, so that is not at all working and opening."
       *
       * There is no broken button. TeamCard is fully wired -- email, role, a real
       * `invite.mutate()`, the join link and the pending list. What was broken is what
       * the surface LOOKED like: `TeamCard` draws its own `Block title="Invite
       * teammates"`, and it sat inside `Block title="People"`. A Block renders card
       * chrome and a heading, so nesting one produced a bordered, titled row inside
       * another bordered, titled row -- which is the shape this product uses for a
       * pressable thing everywhere else. He pressed a heading, correctly expecting it
       * to open something, and nothing happened.
       *
       * A control that is not a control is still a defect, and this is the honest fix:
       * the two cards are siblings at the same rung, each owning its own Block, so the
       * invite form is visibly a form rather than a closed door.
       *
       * `id` so search can land on it: typing "invite" should arrive at this heading.
       * Duplicated by /admin, which is gated on being an admin, so it stays here until
       * it has a section of its own.
       */}
      <div id={PEOPLE_ANCHOR} style={{ scrollMarginTop: "var(--mrd-s7)" }}>
        {/* MembersCard draws no Block of its own, so it keeps this one. TeamCard does
            draw one, which is exactly why it must not be inside this. */}
        <Block title="People">
          <MembersCard />
        </Block>
      </div>
      <TeamCard />

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
/**
 * DIAGNOSTICS MOVED, AND THIS IS WHY THE ADDRESS STILL ANSWERS.
 *
 * Founder: "certain features are kept doorless, and there is no option to reach that."
 *
 * He was right, and the cause was mine. I removed the Diagnostics door from the Settings
 * rail with a comment claiming "the door is drawn from the Engine Room instead". Nothing
 * drew it. A live report making two real server reads was reachable only by typing a URL.
 *
 * The reasoning for moving it was sound and is unchanged: Settings is where a person
 * states what they want, and Diagnostics reports whether the machine is achieving it,
 * which is the engine-room doctrine's own dividing line. So the fix is to FINISH the move
 * rather than put the door back where the reasoning says it does not belong.
 * `DiagnosticsSection` is now mounted as the Quality room's leading tab -- mounted, not
 * copied, so the two cannot disagree about the platform's health.
 *
 * That makes this pane a duplicate, and a duplicate is the one thing the founder said may
 * be removed. What may NOT happen is the address going dark: `?section=health` is in saved
 * links and in the search index. So it forwards, exactly as `memory` forwards to Brain,
 * and it names where the thing went rather than saying it is gone.
 */
function DiagnosticsMoved({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      {/*
       * Meridian's NeedsSetup rather than the retired PageHead/Empty/Button trio: the
       * ratchet refused this file at 134 -> 137 and was right, new code may not carry a
       * retired component. Fixed the code, never the baseline.
       */}
      <NeedsSetup
        title="Diagnostics is read in the Engine Room now"
        body="Whether the platform is having a bad day, the reliability window, and any run that went away with your credits all sit under Quality."
        action={
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-mrd-line bg-mrd-sink px-3 py-1.5 text-[12px] text-mrd-body transition-colors hover:border-mrd-edge hover:bg-mrd-lift hover:text-mrd-ink"
          >
            Open Diagnostics
          </button>
        }
      />
    </>
  );
}

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
 * Agents - the roster, models, keys
 *
 * THE ROSTER STOPPED BEING A SECOND EDITOR, 2026-08-10.
 *
 * It rendered a per-agent tool-reach Select writing `setAgentToolCap` - the
 * same column /crew writes, from a page whose own header already conceded the
 * move was pending and never made. Worse, the POSTURE beside each name was
 * invented here: `defaultPosture` derived "runs alone / asks first / needs
 * review" from the agent's station in the catalog, so a workspace that had
 * actually pulled an agent back to "everything waits for you" was told by this
 * page that it ran alone. A governance surface guessing at a boundary is a
 * worse defect than a duplicated control, because a guess is unfalsifiable
 * from the screen.
 *
 * Both are gone. This pane now reads `listCrew` - the same server function
 * under the same query key /crew uses, so the two share one cache entry - and
 * states the real stored dial per agent, in the shared vocabulary. Every row
 * is a door to the one page that can change it.
 *
 * WHAT IT KEEPS, deliberately: the census, and one line per agent. A VP
 * standing in Settings still has to be able to answer "how much of my crew
 * runs unattended" without leaving the surface they are on. Removing the
 * duplicate control is the fix; removing the ANSWER would have been a
 * different bug wearing the fix's clothes.
 * ================================================================== */

function RosterSection({ onOpenCrew }: { onOpenCrew: (slug: string | null) => void }) {
  /*
   * WHICH AGENT IS OPEN, HELD HERE RATHER THAN IN THE URL. Opening a colleague to read
   * them is not a navigation: it does not deserve a history entry, and a Back press
   * after reading three of them should leave Settings, not walk back up the roster.
   */
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspace();
  const fList = useServerFn(listCrew);
  // Same key, same function, same cache entry as /crew. Not "a read that
  // agrees with it" - the identical one.
  const crew = useQuery({
    queryKey: ["crew", "roster", activeWorkspace?.id ?? null],
    queryFn: () => fList({ data: { workspaceId: activeWorkspace?.id ?? null } }),
    staleTime: 30_000,
  });

  const head = (sub: React.ReactNode) => <PageHead title="Roster" sub={sub} />;

  if (crew.isLoading) {
    return (
      <>
        {head("Reading the boundary in force.")}
        <Loading>Reading the roster.</Loading>
      </>
    );
  }

  if (crew.isError) {
    return (
      <>
        {head("The roster did not load.")}
        <Failed onRetry={() => void crew.refetch()}>
          Nothing below would be the real boundary.{" "}
          {(crew.error as Error)?.message ?? "The read failed."}
        </Failed>
      </>
    );
  }

  // Read down the loop (station order, cast then conductor), not by insert
  // order. An agent the catalog has never heard of still renders, at the end.
  /*
   * ── THE WHOLE CREW, NOT ONLY THE ONES WITH A ROW ──────────────────────────
   *
   * Founder: "It just shows three cards ... clicking on Roster itself, it should land
   * on the full set of agents here itself."
   *
   * He was looking at a real under-report, not a layout problem. This listed
   * `crew.members`, which is STORED agent rows, and rows are written lazily -- the
   * empty state below says so in its own words: "They arrive with the first mission
   * that needs one, already running on the default policy." So a workspace with three
   * rows saw three agents, while eighteen active agents in the catalog were doing the
   * work. The roster was answering "who has a database row" and calling it the crew.
   *
   * It is worse than a miscount, because the missing ones are not idle. An agent with
   * no row runs on the DEFAULT policy -- `loadAgentArc` returns `trusted` when no row
   * exists -- so the fifteen a person could not see were the fifteen running with the
   * most rope. A boundary surface that hides the agents operating unsupervised is
   * telling the reader the opposite of the truth.
   *
   * So the CATALOG is the spine of this list and stored rows are merged onto it. An
   * agent with no row is shown as running on the default, which is what it is doing.
   */
  const catOrder = new Map(SPECIALIST_CATALOG.map((c, i) => [c.slug, i]));
  const stored = new Map((crew.data?.members ?? []).map((m) => [m.slug, m]));
  /*
   * CAST ONLY, AND THIS CORRECTS MY OWN OVERREACH. Spanning the catalog fixed the
   * three-card under-report and introduced the opposite error: it began listing tier
   * `crew` agents, which the catalog itself labels "engine-only mechanisms, never
   * user-facing (not seeded as loop agents)". Reactor and Archivist are plumbing.
   * Presenting plumbing as a colleague is the Engine-Room doctrine's exact failure --
   * the user meets the output of the machine, never the machine.
   */
  const members = SPECIALIST_CATALOG.filter((c) => c.status === "active" && c.tier === "cast")
    .map((c) => {
      const row = stored.get(c.slug);
      return (
        row ?? {
          slug: c.slug,
          name: c.name,
          /* No row means nothing has been switched off, and the default arc is
             `trusted` (loadAgentArc). Stating that is the honest default; showing it
             as absent or disabled would invent a boundary nobody set. */
          enabled: true,
          arc: "trusted" as const,
          /* The REAL shape, not `string[]`. The synthetic row claimed a type the
             stored row does not have, and it compiled only because nothing read
             `asking` off the union. The moment the detail panel did, it broke. */
          asking: [] as CrewMember["asking"],
        }
      );
    })
    /* Anything stored that the catalog has never heard of still renders, at the end,
       so a custom or renamed agent is never silently dropped. */
    .concat(
      (crew.data?.members ?? []).filter(
        (m) => !SPECIALIST_CATALOG.some((c) => c.slug === m.slug),
      ),
    )
    .filter((m) => catalogEntry(m.slug)?.status !== "deprecated")
    .sort((a, b) => (catOrder.get(a.slug) ?? 999) - (catOrder.get(b.slug) ?? 999));

  if (members.length === 0) {
    return (
      <>
        {head("Nobody has a row here yet.")}
        <Empty action={<Button onClick={() => onOpenCrew(null)}>Open Crew</Button>}>
          This account has no agent rows, so there is no boundary to read. They arrive with the
          first mission that needs one, already running on the default policy.
        </Empty>
      </>
    );
  }

  // The boundary in force, counted off the STORED dial rather than off the
  // station a catalog file happens to file each agent under.
  const on = members.filter((m) => m.enabled);
  const alone = on.filter((m) => m.arc === "trusted" || m.arc === "ambient").length;
  const asks = on.filter((m) => m.arc === "proving" || m.arc === "observing").length;
  const off = members.length - on.length;
  const asking = members.filter((m) => m.asking.length > 0).length;
  // Exactly one mark on a screen may blink, and it belongs to the first thing
  // actually waiting on a person.
  const blinkSlug = members.find((m) => m.asking.length > 0)?.slug ?? null;

  return (
    <>
      {head(
        <>
          <Num>{alone}</Num> run without asking you, <Num>{asks}</Num> ask first
          {off > 0 ? (
            <>
              , <Num>{off}</Num> are switched off
            </>
          ) : null}
          .
        </>,
      )}

      <Block
        title="Who works here"
        // The different fact, not the census again: where this is changed, and
        // what is currently waiting on a person.
        sub={
          asking > 0 ? (
            <>
              <Num>{asking}</Num> {asking === 1 ? "is asking" : "are asking"} for more room. Open
              one to rule on it.
            </>
          ) : (
            "How much rope each one gets is set on Crew, one agent at a time."
          )
        }
        /*
         * NO "OPEN CREW" DOOR ANY MORE. Founder: "why are there multiple steps, like
         * click on Roster and see only three cards, and then click on Open Crew?"
         *
         * Everything that door was opened for -- what an agent is, what it may do
         * without you, what it can touch, whether it has been any good -- is now one
         * click away on this pane. What /crew still owns is CHANGING a tool boundary,
         * and that is reached from the agent you are already reading, not from a
         * general-purpose escape hatch at the top of the list.
         */
      >
        {/*
         * ONE CARD PER AGENT, replacing a list of tight rows.
         *
         * Founder: "for each agent, it needs to be each agent card", the crew shown
         * first, each opening onto that agent. A row cannot give a colleague any
         * presence, and presence is the point: this product's claim is that these do
         * the work. The grid also uses the width it is given rather than capping
         * itself, which is his separate complaint about these surfaces.
         *
         * `blurb` is the catalog's own one-liner, so no copy is invented here.
         */}
        <AgentCards
          cards={members.map((m) => ({
            slug: m.slug,
            name: m.name,
            role: catalogEntry(m.slug)?.blurb,
            enabled: m.enabled,
            runsAlone: m.arc === "trusted" || m.arc === "ambient",
            waiting: m.asking.length,
            /* The station, in the product's own words for it. Reading the roster down
               the spine answers "who works on the part I am looking at", which an
               eighteen-card alphabetical grid cannot. */
            group: (() => {
              const st = agentStation(m.slug);
              /* STAGE_LABEL is the product's existing station-to-name map (Discover,
                 Decide, Plan...). Reused rather than retyped: a second list of the
                 seven names is how a rename lands in one place and not the other. */
              /*
               * THE CONDUCTOR IS NOT AT A STATION, and the founder called this out:
               * "Reactor and Chief of Staff ... work across all surfaces and all
               * stations, why is that gated". He is right about Chief of Staff.
               *
               * The catalog files it at `decide` and that is a filing artifact, not a
               * design: it carries `conductor: true`, its blurb is "Runs the loop and
               * brings you the calls that need you", and `driver.test.ts` EXCLUDES
               * conductors from station-crew coverage on purpose. It is dispatched
               * through orchestrator.functions.ts, never as a station's crew. Showing
               * it under Decide told a reader it works one seventh of the loop.
               *
               * Grouped separately rather than restationed: `station` is stored and the
               * driver reads it, so changing the DATA would change dispatch. This
               * changes only what the roster says, which is the thing that was wrong.
               */
              const entry = catalogEntry(m.slug);
              if (entry?.conductor) return "Across the whole loop";
              return st ? STAGE_LABEL[st] : "Across the whole loop";
            })(),
          }))}
          activeSlug={openSlug}
          /* A second press on the open card closes it. The card is the control, so it
             has to work both ways, or the only way to dismiss is to open another one. */
          onOpen={(slug) => setOpenSlug((cur) => (cur === slug ? null : slug))}
          renderDetail={(slug) => {
            const m = members.find((x) => x.slug === slug);
            return m ? <AgentDetail member={m} onOpenRecord={onOpenCrew} /> : null;
          }}
        />
      </Block>

      <Empty>
        A new tool asks for permission the moment it is first needed, inside the run. Every tool
        boundary across the whole crew at once lives on the boundary, not here.
      </Empty>
    </>
  );
}

/**
 * ── WHAT THIS AGENT IS, INLINE ────────────────────────────────────────────────
 * Founder: "when I click on a particular agent, let's say I'm clicking on Verify, what
 * is Verify all about? It needs to show there itself ... what is a system prompt, and
 * what are the activities that are involved in that? That needs to be inline after
 * clicking." And on the old shape: "where is the patience for a human?"
 *
 * ── THERE IS NO SYSTEM PROMPT COLUMN, SO NONE IS DRAWN ────────────────────────
 * He asked for the system prompt. Nothing in this product stores a per-agent prompt a
 * person may edit, and rendering an empty box labelled "System prompt" would be a
 * control that writes nowhere -- the exact defect this repo has paid for nine times.
 *
 * What DOES exist is the thing a prompt would have said, and it is better than a
 * prompt because the driver actually runs on it: `stationCrew` carries each role's
 * `job` (what this one is asked to do, in its own terms) and `file` (what it must hand
 * on). That is the brief, it is real, and it is what briefs the agent at run time.
 *
 * ── THE FOUR BLOCKS ARE THE FOUR QUESTIONS, IN ORDER ──────────────────────────
 * What it is asked to do · what it may do without you · what it can actually touch ·
 * whether it has been any good at it. His complaint about the old two loose panels was
 * that they were "all like a card, but it needs to be really even and have a proper
 * structure": one grid, one row shape, one label style, every block the same.
 */
/**
 * What the roster actually holds, which is NOT uniformly a CrewMember.
 *
 * Agent rows are written lazily, so the roster is the catalog with stored rows merged
 * onto it: an agent nobody has governed yet has a name and a default arc and no row at
 * all. Typing this prop as CrewMember would have been a lie the compiler happily
 * accepted for the stored half and crashed on for the other.
 *
 * The optional fields are exactly the ones that only exist once a row does, and the
 * panel says so in words rather than drawing an empty section.
 */
type RosterEntry = {
  slug: string;
  name: string;
  enabled: boolean;
  arc: CrewMember["arc"];
  /** What this one is waiting on a person for. A gate action, so it is never hidden. */
  asking?: CrewMember["asking"];
  arcIsDefault?: boolean;
  tools?: CrewMember["tools"];
  trust?: CrewMember["trust"];
  noToolsEnabled?: boolean;
};

/**
 * A figure inside a sentence, on Meridian's own tokens.
 *
 * The retired shell primitive `Num` was the reflex here and the ratchet refused it:
 * new code may not carry a retired component, and Meridian has no Figure of its own
 * yet. Tabular numerals so a count that ticks does not reflow the line around it.
 */
function Fig({ children }: { children: ReactNode }) {
  return (
    <span className="font-medium text-mrd-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
      {children}
    </span>
  );
}

function AgentDetail({
  member,
  onOpenRecord,
}: {
  member: RosterEntry;
  /** Opens this agent's full record, deep-linked to the agent being read. */
  onOpenRecord: (slug: string) => void;
}) {
  const entry = catalogEntry(member.slug);
  const role = AGENT_STATION_ORDER.flatMap((st) => stationCrew(st)).find(
    (r) => r.slug === member.slug,
  );
  /* No filter: `resolvedMode` is documented as "what resolveToolMode returns today,
     floors included", so every row here is a thing this agent can genuinely reach, and
     the mode beside it is the truth about how. There is no off state to exclude. */
  const tools = member.tools ?? null;
  const asking = member.asking?.length ?? 0;
  const trust = member.trust;

  /* Named Facet, not Row: this file imports a RETIRED `Row` from shell/primitives, and a
     local shadowing it reads as that component to every human and every scanner. */
  const Facet = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1 pt-2.5 first:pt-0">
      <div className="text-[10.5px] font-medium tracking-[0.08em] text-mrd-mute uppercase">
        {label}
      </div>
      <div className="text-[12.5px] leading-relaxed text-mrd-body">{children}</div>
    </div>
  );

  return (
    <div
      className="mt-1 flex flex-col rounded-mrd-card border border-mrd-edge bg-mrd-sheet p-3.5"
      style={{
        boxShadow: "var(--mrd-shadow-card)",
        gap: "var(--mrd-s4)",
        animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both",
      }}
    >
      <Facet label={`What ${member.name} is asked to do`}>
        {role?.job ?? entry?.blurb ?? "No brief is filed for this one yet."}
        {role?.file ? (
          <>
            {" "}
            It hands on <span className="text-mrd-ink">{role.file}</span>, which is what the
            next station reads.
          </>
        ) : entry?.conductor ? (
          <> It runs the loop itself rather than working one station of it.</>
        ) : null}
      </Facet>

      <Facet label="What it may do without you">
        {(member.arcIsDefault ?? true) ? (
          <>
            {ARC_CHOICE[member.arc]}. This is our default, not a rule you set, so it is
            yours to change.
          </>
        ) : (
          <>{ARC_CHOICE[member.arc]}. You set this.</>
        )}
      </Facet>

      <Facet
        label={
          tools && tools.length > 0 ? `What it can touch (${tools.length})` : "What it can touch"
        }
      >
        {tools === null ? (
          /* No stored row, so there is no tool policy to read. Saying that is the whole
             truth; an empty list here would read as "may touch nothing", which is the
             opposite of what an ungoverned agent on the default arc is doing. */
          `Nothing is stored for ${member.name} yet. It arrives with the first mission that needs it, already running on the default above.`
        ) : member.noToolsEnabled ? (
          "No tools are switched on for this workspace at all, so nobody here can touch anything yet."
        ) : tools.length === 0 ? (
          `${member.name} has no tools it may use, so it can read and reason but cannot act.`
        ) : (
          <span className="flex flex-wrap gap-1.5 pt-0.5">
            {tools.map((t) => (
              <span
                key={t.toolName}
                className="flex items-center gap-1.5 rounded-full border border-mrd-line bg-mrd-sink px-2 py-1 text-[11.5px]"
              >
                <span className="text-mrd-ink">{t.label}</span>
                <span className="text-mrd-mute">{MODE_CHOICE[t.resolvedMode]}</span>
              </span>
            ))}
          </span>
        )}
      </Facet>

      <Facet label="What it has learned">
        {/*
         * ── THIS FACET EXISTS BECAUSE I HAD ORPHANED IT ───────────────────────────
         * Founder: "you have eliminated all the sections that were underneath ... I do
         * not want you to eliminate any of the features without thinking twice ... you
         * should not be removing anything or making a feature homeless."
         *
         * He is right, and the panel was worse than he could see. It answered four
         * questions and had ZERO actions -- no button, no link. So removing the Open
         * Crew door left a reader able to READ an agent from Settings and unable to
         * change one thing about it, or to reach the place that can. My own commit
         * message claimed the tweak path was "reached from the agent you are already
         * reading". It was not. I wrote the intent and did not build it.
         *
         * What the agent's record owns and this pane does not: its lessons, its run
         * history, the tool boundary you can actually edit, and its requests for more
         * room. Lessons are named here rather than fetched, because inventing a second
         * read of them would duplicate the record rather than point at it -- and a
         * duplicate is the one thing he did say may be removed.
         */}
        Every verdict that came back on {member.name}'s work is written against the call
        that caused it, on its record. That is what re-ranks its next run.
      </Facet>

      <Facet label="Track record">
        {/*
         * The honest form of a score. `samples` is how much this is standing on, and
         * with nothing to stand on the number is not reported at all -- a track record
         * built from zero runs is the claim this repo is least allowed to make.
         */}
        {!trust || trust.samples === 0 ? (
          `${member.name} has not finished anything here yet, so there is nothing to judge it on.`
        ) : (
          <>
            <Fig>{trust.missionsCompleted}</Fig> of <Fig>{trust.missionsTotal}</Fig> missions
            finished
            {trust.outcomesTotal > 0 ? (
              <>
                , and <Fig>{trust.outcomesValidated}</Fig> of <Fig>{trust.outcomesTotal}</Fig>{" "}
                calls held up afterwards
              </>
            ) : null}
            .
            {trust.suggestedArc !== member.arc ? (
              <>
                {" "}
                On that record it could run at{" "}
                <span className="text-mrd-ink">
                  {ARC_CHOICE[trust.suggestedArc].toLowerCase()}
                </span>
                .
              </>
            ) : null}
          </>
        )}
      </Facet>
      {/*
       * ONE DOOR, AT THE FOOT, DEEP-LINKED TO THE AGENT BEING READ.
       *
       * Not the general "Open Crew" escape hatch that used to sit at the top of the
       * list -- that was the three-click complaint. This opens THIS agent, and it is
       * labelled with what is actually behind it rather than with the page's name, so
       * nothing that lives there is homeless and nobody has to guess.
       */}
      <div className="flex flex-wrap items-center gap-2 border-t border-mrd-line pt-2.5">
        {asking > 0 && (
          /* A person is required. The one place `you` is spent in this panel, and it
             leads straight to the thing that is waiting. */
          <button
            type="button"
            onClick={() => onOpenRecord(member.slug)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors"
            style={{ color: "var(--mrd-you)", background: "var(--mrd-select)" }}
          >
            <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--mrd-you)" }} />
            {asking === 1
              ? `${member.name} is asking for more room`
              : `${member.name} is asking for more room on ${asking} tools`}
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenRecord(member.slug)}
          className="rounded-full border border-mrd-line bg-mrd-sink px-2.5 py-1 text-[11.5px] text-mrd-body transition-colors hover:border-mrd-edge hover:bg-mrd-lift hover:text-mrd-ink"
        >
          Change what {member.name} may touch, and read its history
        </button>
      </div>
    </div>
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
    <div id={BYO_KEYS_ANCHOR} style={{ scrollMarginTop: "var(--mrd-s7)" }}>
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
    </div>
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
            {/*
             * SCROLLS RATHER THAN NAVIGATES, since the fold. This used to send a
             * person to `?section=credits`; that address now renders THIS pane, so
             * the button would have looked like it did nothing -- the worst kind of
             * broken control, because the reader blames themselves and stops
             * trusting the others. The top-up is on this page now, further down.
             */}
            {currentTier !== "free" ? (
              <Button
                variant="ghost"
                onClick={() =>
                  document
                    .getElementById(CREDITS_ANCHOR)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
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

/**
 * Where "Buy a credit top-up" lands now that both live on one pane.
 *
 * A constant rather than a literal in two places, because the button and the
 * target being spelled the same is the entire mechanism: a typo in either makes
 * the control silently do nothing, which is exactly the failure the fold was
 * supposed to remove.
 */
const CREDITS_ANCHOR = "settings-credits";
/*
 * WHERE SEARCH LANDS INSIDE A PANE. Founder: "that's how the search should work, not
 * just for this entire thing, so that a user can just type whatever I want."
 *
 * Each of these is a real block on a real pane, and `settings-search.test.ts` asserts
 * every one is actually rendered here -- an anchor nothing draws is a door to nowhere.
 */
const HOURS_ANCHOR = "settings-hours";
const APPEARANCE_ANCHOR = "settings-appearance";
const BYO_KEYS_ANCHOR = "settings-byo-keys";
/** Where "invite", "team" and "member" land on the Brief and voice pane. */
const PEOPLE_ANCHOR = "settings-people";

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

      {/* The target of "Buy a credit top-up" up in the plan block. A wrapper rather
          than an id on Block, which takes no id prop and should not grow one for a
          single caller's anchor. `scroll-mt` keeps the heading clear of the sticky
          header instead of landing it underneath. */}
      <div id={CREDITS_ANCHOR} style={{ scrollMarginTop: "var(--mrd-s7)" }}>
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
      </div>

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
