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
 *      and then a button to /sources, which renders the same bindings. Two doors
 *      to one room, and the room is better. Sources now SHOWS what each
 *      connected source is pointed at on its own line, and carries the one door
 *      to /sources for changing it. `?section=sync` still lands, on Sources.
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
 *      · the per-agent tool-reach control -> /team, which already had it.
 *    MOVED, 2026-09-09 (fifth review), and this finishes that one:
 *      · the roster and the boundary -> Team, whole. What stayed in 2026-08-10
 *        was a READ of /team's own rows and a door per agent, which is a
 *        mirror, and a mirror one rail row from the page it reflects is a
 *        second answer to a question the rail says Team owns. Settings is
 *        where you configure an application; Team is where you decide how much
 *        rope your workforce gets. `?section=agents`, `staff`, `crew` and
 *        `autonomy` redirect there in `beforeLoad`, so no saved link went
 *        dark, and no editor moved with them because there were none left
 *        here to move.
 *    STILL PENDING, unmoved and honestly flagged -
 *      · the credit debit ledger and per-product attribution -> Engine room,
 *        Spend. Purchases stay, because the purchase is made here.
 *      · Members and Team duplicate /admin. Left rendering because /admin is
 *        gated behind being an admin, so a workspace owner who is not a
 *        platform admin would otherwise have nowhere to manage their own people.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    Each agent's lessons and run history (/team) · the credit debit ledger and
 *    who spent it (Engine room, Spend) · what a source is pointed at, and any
 *    two-sided edit (/sources) · every account and scope on a source (?connector=)
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
 * fold. The pane beside it renders one section at a time, sections are Meridian
 * `Region`s, and a setting is a label on the left with its control on the right,
 * one per line, divided by a rule rather than boxed in a card each.
 *
 * MERIDIAN, 2026-08-21. The last retired import went with it: every `Block`,
 * `Button`, `PageHead`, `Empty`, `Failed`, `Loading`, `Field`, `Input`, `Select`
 * and `Textarea` on this surface came from `components/shell/primitives`, which is
 * the retired Cadence/ink component layer, and the 34 `--sp-*` tokens beside them
 * came from the same system. What is worth knowing rather than only recording:
 * `.sp-block` carried the vertical rhythm between sections, Meridian's `Region`
 * deliberately carries none, and the seven panels this pane mounts were ported
 * first -- so THE PANE NOW STATES THE RHYTHM, once, at 40px. See the comment on
 * the pane div. The two `.sp-inner`/`.sp-main` class names that remain are the app
 * shell's own layout from `shell.css`, not the retired layer; Meridian's `Surface`
 * renders the same two and says why.
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

import { redirect, createFileRoute, useNavigate } from "@tanstack/react-router";
import { readFailureMessage, sessionEndedMessage } from "@/lib/roles.functions";
/*
 * THE WRITE PATHS ON THIS SURFACE NEVER GOT THE TREATMENT THE READ PATHS DID.
 *
 * Every read here already routes its failure through `readFailureMessage`, which
 * keeps a sentence the server wrote for a person and drops anything else. The
 * fourteen WRITES did not: they were `toast.error(e.message)`, so whatever came
 * back went on screen verbatim. Measured worst case on this pane -- renaming a
 * workspace to an empty name -- was the toast
 * *"null value in column "name" violates not-null constraint"*, which is a
 * sentence addressed to whoever wrote the migration.
 *
 * `failureLine(ownSentence, err)` states what is STILL TRUE and appends the
 * server's own sentence only when the server wrote one for a person. The own
 * sentence must never offer an action, because the appended half may be "Your
 * session ended. Sign in again and this will load." and would contradict it;
 * `lib/__tests__/a-failure-line-never-argues-with-itself.test.ts` enforces that
 * on every literal below.
 */
import { failureLine } from "@/lib/error-copy";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  Cell,
  Door,
  NothingHere,
  NothingYet,
  Num,
  PageHeading,
  Picker,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { Surface } from "@/components/meridian/Surface";
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
import { authErrorMessage } from "@/lib/auth-errors";
import { supabase } from "@/integrations/supabase/client";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useDensity } from "@/hooks/use-density";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { useWorkspace } from "@/hooks/use-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { useAvatarChoice } from "@/hooks/use-avatar-choice";
import { orbBackground, AVATAR_VARIANTS, defaultAvatarVariant } from "@/components/supaprod/Avatar";

import { getProfile, updateProfile } from "@/lib/profile.functions";
import {
  deleteWorkspace,
  ensureDefaultProduct,
  leaveWorkspace,
  listWorkspaceMembers,
  renameWorkspace,
  createWorkspace,
} from "@/lib/workspaces.functions";
import { MODELS, AUTO_MODEL } from "@/lib/ai/models";
import {
  listApiKeys,
  saveApiKey,
  deleteApiKey,
  testApiKey,
  listPlatformProviders,
  BYO_PROVIDERS,
} from "@/lib/byokeys.functions";
import { platformCoverageLine } from "@/lib/byokeys-words";
import { getBillingState, getCreditRunway, type BillingState } from "@/lib/billing.functions";
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
  SETTINGS_GROUPS,
  normalizeSection,
  OFF_PAGE_SECTIONS,
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
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { ProductsTab } from "@/components/settings/ProductsTab";
import { DataSection } from "@/components/settings/DataSection";
import { HostingSection } from "@/components/settings/HostingSection";
import { BriefSection } from "@/components/settings/BriefSection";
import { DiagnosticsSection } from "@/components/settings/DiagnosticsSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { RedeemCodeCard } from "@/components/settings/RedeemCodeCard";
import { MembersCard } from "@/components/settings/MembersCard";
import { TeamCard } from "@/components/settings/TeamCard";
import { DesignMemoryPanel } from "@/components/knowledge/DesignMemoryPanel";
import { ARC_CHOICE, MODE_CHOICE } from "@/components/crew/crew-words";
import { stationCrew } from "@/lib/spine/driver";
import { listCrew, type CrewMember } from "@/lib/crew.functions";

import { AgentMark } from "@/components/meridian/marks";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

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
  /**
   * `?section=memory` LANDS ON BRAIN INSTEAD OF ON AN APOLOGY.
   *
   * That pane's entire content was a heading reading "It is not set here any
   * more" and a button to Brain. This file's own IA header has called it dead
   * weight since the fold -- "a pane that exists to apologise for itself ...
   * should be a redirect to /brain, not a section" -- and nothing had made it
   * one.
   *
   * It got WORSE before it got better, and that was mine: U-039 gave the
   * section keywords so search could finally find it, because a door-less
   * pane search cannot reach is unreachable by anything. That fix was right
   * and its effect was to make an apology easier to arrive at.
   *
   * A redirect keeps every saved link and every search hit working and spends
   * no click on a dead end. Done in `beforeLoad` so the pane never paints:
   * rendering the apology and then navigating away would show the reader the
   * dead end on the way past it.
   *
   * AND THE SAME MECHANISM CARRIES THE AUTONOMY FOLD, 2026-09-09 (fifth
   * review). `?section=agents`, `staff`, `crew` and `autonomy` used to open a
   * roster and a boundary pane that Team already owned. The group is gone and
   * the four addresses are not, so they land on Team here rather than falling
   * through to Profile. `OFF_PAGE_SECTIONS` is the one list of them, beside
   * the section model it was carved out of.
   */
  beforeLoad: ({ search }) => {
    const asked =
      (search as { section?: string; tab?: string }).section ??
      (search as { section?: string; tab?: string }).tab;
    if (asked === "memory") throw redirect({ to: "/outcomes" });
    const offPage = asked ? OFF_PAGE_SECTIONS[asked] : undefined;
    if (offPage) throw redirect({ to: offPage.to, search: offPage.search });
  },
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · Supaprod" }] }),
  /*
   * MERIDIAN'S `Surface`, because this pair genuinely is the plain work region:
   * one column, no context, no id and no focus target. The page body below is
   * the pair that CANNOT take it -- it carries `id={PANE_ID}`, `tabIndex={-1}`
   * and the two-column flex the founder's left-hand index needs, and `Surface`
   * passes none of that through. The rhythm is stated here for the same reason
   * it is stated on the pane: `Region` and `PageHeading` set no outer margin.
   */
  errorComponent: ({ error, reset }) => (
    <Surface>
      <div className="flex flex-col gap-mrd-7">
        <PageHeading title="Settings did not open." sub={readFailureMessage(error)} />
        <Actions>
          <Action variant="primary" onClick={reset}>
            Try again
          </Action>
        </Actions>
      </div>
    </Surface>
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
   * SEARCH CAN NOW RETURN A SECTION THAT DRAWS NO DOOR, so the row it lands on
   * has to be findable in a list that includes those. `allItems` above is the
   * rail's DEFAULT list and is doors-only, which is correct for what it draws;
   * looking a search hit up in it would have missed Diagnostics and Memory and
   * then dereferenced undefined, turning a fixed search into a crash.
   */
  const everySection: RailItem[] = SETTINGS_GROUPS.flatMap((g) =>
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
      ? hits.flatMap((id) => {
          /* Every id searchSections returns is a real section, so this cannot
             drop a hit today; it is a guard against a future id, never a
             silent filter, which is why it flatMaps rather than asserting. */
          const found = everySection.find((i) => i.key === id);
          if (!found) return [];
          /*
           * NAME THE BLOCK WHEN THERE IS ONE. Founder: typing "invite" should offer
           * "Invite teammates", not the pane that happens to contain it. A sub-target
           * is a better answer than a keyword reason, so it wins: the row shows the
           * heading the reader will actually arrive at, and `section` stays underneath
           * it so the crumb still says which pane that is.
           */
          const target = subTargetFor(id, query);
          if (target) return [{ ...found, label: target.label, section: found.label }];
          const why = matchReason(id, query);
          return [why ? { ...found, label: `${found.label}  ${why}` } : found];
        })
      : allItems
    : allItems;

  return (
    <div
      /*
       * `data-shell-index` IS THE WHOLE LAYOUT NOW, and what it replaced never ran.
       * `.sp-inner` is `display: grid`, so the `flex: 0 1 240px` that stood
       * here was inert and this nav rendered as a full-width row above the
       * pane -- with `position: sticky` on it, which is what dragged it down
       * over the pane on scroll. Measured on the served build 2026-09-10;
       * the reasoning and the numbers are in shell.css beside the class.
       *
       * The 240px it asked for is now `--shell-index-w`, and sticky is
       * granted only where two columns exist.
       */
      data-shell-index=""
      style={{
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
      /* NO `flex flex-wrap items-start` HERE ANY MORE: `.sp-inner` is a grid
         and every one of those was inert (measured on the served build,
         2026-09-10). The two columns come from
         `.sp-inner:has(> [data-shell-index])`,
         which is the same idiom `.sp-ctx` uses for a column on the right. */
      className="sp-inner gap-y-mrd-6"
      /*
       * `rowGap` ALONE, and the column gap is deliberately not restated. It was
       * `gap: var(--sp-space-6) var(--sp-ctx-gap)`, and `--sp-ctx-gap` (52px) has
       * no Meridian stop: the ramp goes 40px then 64px, so mapping it would move
       * a shipped gutter 12px either way to say the same thing. It does not have
       * to be said here at all. `.sp-inner` in `shell.css` already declares
       * `gap: 0 var(--sp-ctx-gap)` and shell.css is the app shell's own sheet
       * rather than a retired layer, so leaving the column gap to it renders the
       * identical 52px and takes the token out of this file. Only the row gap was
       * ever this surface's own, because `.sp-inner` is a grid upstream and this
       * one wraps.
       */
    >
      <SettingsIndex active={active} onSet={setTab} />
      {/* tabIndex -1 so the skip link can actually land focus here. Without it
          the anchor scrolls the pane into view and leaves focus in the nav, so
          the next Tab goes back to where it already was - a skip link that does
          not move focus is a skip link that does not work. */}
      {/*
       * ── THE SURFACE STATES THE RHYTHM, ONCE, AND THAT IS A REGRESSION CLOSED
       * RATHER THAN A PORT DETAIL ─────────────────────────────────────────────
       *
       * Every pane here is a `PageHeading` followed by loose `Region`s, and
       * Meridian's `Region` carries NO outer margin and no border on purpose --
       * the retired `.sp-block` it replaced carried `margin-top: 36px`,
       * `padding-top: 28px` and a `border-top`, and that sheet's own retirement
       * note records the founder overruling all three: "the caller states the
       * rhythm once per surface, and no hairline, divider or section border comes
       * back". The seven panels under `components/settings/` were ported onto
       * `Region` before this route was, so until this line existed /settings
       * stacked its sections flush against each other.
       *
       * 40px (`--mrd-s7`), not 24px, and the figure is the founder's rather than
       * a preference: the same note names "Meridian's plain 40px gap" as what
       * replaces the 36 + 28 + hairline, and every other ported station on this
       * shape uses `gap-mrd-7`. The 24px stop belongs to the admin tabs, which
       * stack dense tables rather than settings sections.
       *
       * `flex flex-col` over `.sp-main`, which only sets `min-width: 0` and a
       * measure this element already overrides, so nothing collides.
       *
       * tabIndex -1 so the skip link can actually land focus here. Without it
       * the anchor scrolls the pane into view and leaves focus in the nav, so
       * the next Tab goes back to where it already was - a skip link that does
       * not move focus is a skip link that does not work.
       */}
      <div
        id={PANE_ID}
        tabIndex={-1}
        className="sp-main flex flex-col gap-mrd-7"
        /* NO `outline: none`. The pane takes focus when the nav moves between
           sections, so suppressing its ring left a keyboard user with nothing
           on screen saying where focus went -- on the one surface whose whole
           point was to become a single tab stop with arrow keys. The ring is
           drawn only for keyboard focus, so a mouse click still shows nothing. */
        style={{ flex: "1 1 460px", maxWidth: "none" }}
      >
        {active === "profile" && (
          <>
            <ProfileSection />
            {/* A sibling form, not one nested inside ProfileSection's: a form
                inside a form is invalid HTML and React warns on it. Both
                flatten into the pane's own 40px column. */}
            <PasswordRegion />
          </>
        )}
        {active === "notifications" && <NotificationsSection />}

        {active === "workspace" && (
          <>
            {/* THE PANE SAYS WHAT IT IS. It landed on "This workspace", a
                region heading about the workspace record, with the brief, the
                people and the admin door under it and nothing naming the pane.
                Title is the rail's own label, per the-door-and-the-page-share-
                a-name, which only sees a heading written in the branch. */}
            <PageHeading
              title="About your company"
              /* THE BRIEF MOVED OUT (P-23): it had its own sentence here
                 ("the standing instruction every mission reads before it
                 acts") because it rendered fused with this pane. It is a
                 separate door now, `brief`, so this sub states only what is
                 actually on this one. */
              sub="The workspace itself, and who else is in it."
            />
            <WorkspaceSection />
          </>
        )}
        {/* Self-headed, unlike the branch above: its `PageHeading` sub is
            derived from the read (loading / empty / N-of-M answers), which a
            wrapper here has no way to compute without lifting that state up
            for no other reason than to draw one line. */}
        {active === "brief" && <BriefSection />}
        {active === "brand" && (
          <>
            <PageHeading
              title="Brand"
              sub="What the design crew treats as settled before it draws anything."
            />
            <DesignMemoryPanel />
          </>
        )}
        {active === "products" && (
          <>
            {/*
             * SCOPE STATED TRUTHFULLY, 2026-08-24. The old sub claimed missions
             * attach to a product; the missions table carries no product column
             * (types.ts Row). What does carry product_id: signals, opportunities,
             * specs (prds), decisions, docs and tasks.
             */}
            <PageHeading
              title="Products"
              sub="What this workspace ships. Signals, opportunities and specs are scoped to a product; missions stay workspace-wide."
            />
            <ProductsTab />
          </>
        )}
        {/* `staff` and `autonomy` had branches here until 2026-09-09. They are
            Team's now and their addresses redirect in `beforeLoad` above, so
            there is nothing left to render and nothing left to reach. */}
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
            {/* THE SAME NAME AS THE DOOR. The rail row has read "Outside
                access" since the plain-words rename; this heading still said
                "Agent access", so the row a person clicked and the page they
                landed on named the same thing differently, side by side on one
                screen. The rename moved the index and not the destination. */}
            <PageHeading
              title="Outside access"
              sub="What an agent outside Supaprod may read, and on whose key."
            />
            <IntegrationsTab />
          </>
        )}
        {active === "data" && <DataSection workspaceId={activeWorkspace?.id} />}
        {active === "hosting" && <HostingSection workspaceId={activeWorkspace?.id} />}

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
            <RunwaySection />
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

/*
 * "On" and "Off" rather than "Reduce motion", because the control says what it
 * DOES to the product rather than naming a preference in the abstract, and
 * because it cannot force motion ON: the OS preference always wins toward less.
 */
const MOTION_CHOICES = [
  { id: "on" as const, label: "On" },
  { id: "off" as const, label: "Off" },
];

/*
 * Suggestions for the timezone field, not a gate: free typing still wins, so a
 * zone outside this list keeps working. The list exists because a free-text
 * field alone invites garbage ("PST", "GMT+2") that every consumer then has
 * to parse.
 */
const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
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
    <span role="group" aria-label={label} className="flex gap-mrd-2">
      {options.map((o) => (
        <Action
          key={o.id}
          variant={o.id === value ? "default" : "quiet"}
          aria-pressed={o.id === value}
          onClick={() => onPick(o.id)}
        >
          {o.label}
        </Action>
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
  const [motion, setMotion] = useMotionPreference();

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
    // The form keeps every character the person typed, so the honest fact is
    // that the stored profile is the one they arrived with -- not that they
    // should press again, which an ended session would refuse.
    onError: (e: Error) => toast.error(failureLine("Your profile is unchanged.", e)),
  });

  const name = displayName || fullName;

  if (profile.isLoading) {
    return (
      <>
        <PageHeading title="Profile" sub="How you are named, and when you are reachable." />
        <Reading>Reading your profile.</Reading>
      </>
    );
  }

  // A failed read must not render an empty identity form whose save would
  // overwrite the real thing.
  if (profile.isError) {
    return (
      <>
        <PageHeading title="Profile" sub="How you are named, and when you are reachable." />
        {/*
         * SAYS WHAT DID NOT LOAD, NOT "NOTHING HERE".
         *
         * This read "nothing here is safe to save yet", and directly beneath
         * it PasswordRegion renders a working form -- a sibling, not a child,
         * so the early return above never reaches it. A reader was told
         * nothing on the page could be saved while looking at a control that
         * could.
         *
         * THE CONTROL IS RIGHT AND THE SENTENCE WAS WRONG, which is worth
         * stating because the tempting fix is the dangerous one. Changing a
         * password goes through supabase.auth and never touches the profile
         * row, so a failed profile read tells you nothing about whether it
         * will work. Disabling it here would lock somebody out of a security
         * action at precisely the moment the product looks broken to them,
         * which is when they are most likely to want it.
         *
         * EXCEPT WHEN THE SESSION IS WHAT ENDED, and the first version of this
         * sentence got that wrong. Looking at the rendered page caught it: it
         * read "Your password can still be changed below. Your session ended."
         * Those contradict, and the second one wins -- changing a password
         * re-authenticates, so an ended session breaks that too. When the read
         * failed for THAT reason the line says the one true thing and stops.
         */}
        <ReadFailedLine onRetry={() => void profile.refetch()}>
          {sessionEndedMessage(profile.error) ?? (
            <>
              Your profile did not load, so your name, role and hours cannot be saved yet. Your
              password can still be changed below. {readFailureMessage(profile.error)}
            </>
          )}
        </ReadFailedLine>
      </>
    );
  }

  return (
    /*
     * THE FORM RESTATES THE PANE'S RHYTHM, because it is one flex child of it.
     * Every other pane returns a fragment, which flattens into the pane's own
     * 40px column; this one and `WorkspaceSection` return a single element, so
     * the gap has to be stated again inside or their regions stack flush.
     */
    <form
      className="flex flex-col gap-mrd-7"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <PageHeading
        title="Profile"
        sub={`Anything scheduled waits for your window, ${whStart}:00 to ${whEnd}:00 in ${timezone || "your timezone"}.`}
      />

      <Region title="Identity">
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
          <span style={{ display: "flex", width: 240 }}>
            <Input
              aria-label="Timezone"
              list="tz-list"
              style={{ width: 240 }}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/New_York"
            />
            {/* Invisible suggestions; the binding above is unchanged. */}
            <datalist id="tz-list">
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
          </span>
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
          <span className="flex items-center gap-mrd-4">
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
                      border: selected ? "1.5px solid var(--mrd-ink)" : "1px solid var(--mrd-line)",
                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </span>
          </span>
        </Line>
      </Region>

      <div id={HOURS_ANCHOR} className="scroll-mt-mrd-7">
        {/*
          ── A NUMBER IN A BOX THAT NEVER SAID WHAT IT WAS (2026-09-01) ───────
          Photographed on the rendered page: two bare fields containing `9` and
          `18`, `type="number"`, no placeholder, no suffix, no unit anywhere
          beside them. A person had to infer that these are hours, on a
          24-hour clock, in the timezone set by a different field further up.

          The page subtitle does say "9:00 to 18:00 in UTC" -- 420px above,
          under a different heading, which is not where someone typing in a box
          is looking. And the second field carried no `sub` at all while the
          first did, so the pair did not even explain itself symmetrically.

          `:00` AS A SUFFIX RATHER THAN A HINT LINE. The value IS an hour, so
          showing the minutes it implies turns the box into a clock reading
          rather than a quantity -- it answers the question in the place the
          question is asked, and costs no vertical space on a settings page that
          already scrolls. `aria-hidden` because the accessible name on each
          input already says what it is; a screen reader hearing ":00" after
          "Reachable from" would be reading punctuation.

          The 24-hour convention is stated once on the `from` row, where a
          reader meets it first, rather than twice.
        */}
        <Region title="Working hours">
          <Line
            label="Reachable from"
            sub="On a 24-hour clock, in the timezone above. Outside this window a scheduled digest waits rather than pinging you."
          >
            <span className="flex items-center gap-mrd-2">
              <Input
                aria-label="Reachable from"
                type="number"
                min={0}
                max={23}
                style={{ width: 88 }}
                value={whStart}
                onChange={(e) => setWhStart(Number(e.target.value))}
              />
              <span aria-hidden="true" className="mrd-meta">
                :00
              </span>
            </span>
          </Line>
          <Line label="Until">
            <span className="flex items-center gap-mrd-2">
              <Input
                aria-label="Reachable until"
                type="number"
                min={1}
                max={24}
                style={{ width: 88 }}
                value={whEnd}
                onChange={(e) => setWhEnd(Number(e.target.value))}
              />
              <span aria-hidden="true" className="mrd-meta">
                :00
              </span>
            </span>
          </Line>
          <Actions>
            <Action variant="primary" type="submit" busy={save.isPending}>
              {save.isPending ? "Saving" : "Save profile"}
            </Action>
          </Actions>
        </Region>
      </div>

      <div id={APPEARANCE_ANCHOR} className="scroll-mt-mrd-7">
        <Region title="Appearance">
          <Line label="Theme" sub="System follows your device. Dark is the default.">
            <Choice value={theme} options={THEME_CHOICES} onPick={setTheme} label="Theme" />
          </Line>
          <Line label="Density" sub="Compact drops a row of breathing room. Type stays the same.">
            <Choice value={density} options={DENSITY_CHOICES} onPick={setDensity} label="Density" />
          </Line>
          {/*
           * THE SWITCH THE WHOLE PRODUCT ALREADY OBEYED AND NOBODY COULD SET.
           *
           * `html[data-motion="off"]` gates motion in eight rules across
           * styles.css and ink.css, and `usePrefersReducedMotion` watches the
           * attribute live so a change lands without a reload. Nothing in src/
           * ever wrote it: the only non-CSS reference was the observer's own
           * `attributeFilter`. The CSS, the hook and the watcher were all
           * written; the switch was not.
           *
           * So a person who wanted motion stopped had exactly one route --
           * change an operating-system preference -- and that is not a setting
           * this product is entitled to make somebody leave to find. R-19:
           * accessibility is not deferred.
           *
           * The sub names the asymmetry rather than hiding it: this can only
           * agree with the OS toward less motion, never override it toward
           * more.
           */}
          <Line
            label="Motion"
            sub="Turning it off stops the live pulses, shimmers and draw-ins everywhere. If your device already asks for reduced motion, that wins whatever this says."
          >
            <Choice value={motion} options={MOTION_CHOICES} onPick={setMotion} label="Motion" />
          </Line>
        </Region>
      </div>
    </form>
  );
}

/* ================================================================== *
 * Password
 *
 * Changed while signed in, which this product had nowhere to do. Supabase
 * will set a new password for ANY live session, so the current one is
 * proven with a fresh sign-in before updateUser runs; without that step,
 * whoever holds an open tab owns the account. All client-side auth calls,
 * the same APIs login.tsx and reset-password.tsx use.
 * ================================================================== */
function PasswordRegion() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  /*
   * DELIBERATELY INDEPENDENT OF EVERY OTHER READ ON THIS PAGE. Changing a
   * password re-authenticates and calls supabase.auth.updateUser; it does not
   * read the profile row, so no failure elsewhere on this pane is evidence that
   * it will not work. Do not gate this on the profile query: that would take a
   * security action away from somebody exactly when the product looks broken to
   * them. The Profile failure line says so in words.
   */
  const canSubmit = current.length > 0 && next.length >= 8 && !mismatch && !tooShort;

  const changePassword = useMutation({
    mutationFn: async () => {
      // The signed-in user's email comes from the session, the way login.tsx
      // and the create-workspace flow in this file already read it.
      // (`getCurrentUser` does not exist on the installed auth-js; `getUser`
      // is its equivalent here.)
      const { data: auth, error: whoError } = await supabase.auth.getUser();
      const email = whoError ? null : (auth.user?.email ?? null);
      if (!email) throw new Error("Your session ended. Sign in again, then retry.");
      // Re-authentication first. A wrong current password surfaces through
      // the signin mapping, which says so plainly.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signInError) throw new Error(authErrorMessage(signInError, "signin"));
      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw new Error(authErrorMessage(updateError, "reset-update"));
    },
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      toast.success("Password changed");
    },
    /*
     * THIS ONE IS READ ALOUD, which is why it is not just a toast's problem.
     * `#pw-error` below carries `role="alert"`, so whatever lands in this state
     * is announced by a screen reader the moment it is set. Both throw sites in
     * the mutation above already go through `authErrorMessage`, so the mapped
     * cases were fine; the gap is an UNMAPPED rejection -- `signInWithPassword`
     * failing on the network rather than returning an error -- which arrives as
     * "Failed to fetch" or a TypeError and was being read out as-is.
     *
     * `failureLine` keeps every `authErrorMessage` sentence (each is four-plus
     * words ending in a stop, which is what `messageForPerson` looks for) and
     * drops the transport strings, leaving the state on its own.
     */
    onError: (e: Error) => setError(failureLine("Your password is unchanged.", e)),
  });

  return (
    <Region title="Password">
      <form
        className="flex flex-col gap-mrd-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit && !changePassword.isPending) changePassword.mutate();
        }}
      >
        <Field label="Current password" htmlFor="pw-current">
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            disabled={changePassword.isPending}
            onChange={(e) => {
              setCurrent(e.target.value);
              setError(null);
            }}
          />
        </Field>
        <Field label="New password" hint="At least 8 characters." htmlFor="pw-new">
          <Input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={next}
            aria-invalid={tooShort || undefined}
            disabled={changePassword.isPending}
            onChange={(e) => {
              setNext(e.target.value);
              setError(null);
            }}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="pw-confirm">
          <Input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            aria-invalid={mismatch || undefined}
            aria-describedby={mismatch ? "pw-mismatch" : undefined}
            disabled={changePassword.isPending}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError(null);
            }}
          />
        </Field>

        {tooShort ? (
          <p role="alert" className="text-mrd-small text-mrd-fail">
            The new password needs at least 8 characters.
          </p>
        ) : null}
        {mismatch ? (
          <p id="pw-mismatch" role="alert" className="text-mrd-small text-mrd-fail">
            The two new passwords do not match.
          </p>
        ) : null}
        {error ? (
          <p id="pw-error" role="alert" className="text-mrd-small text-mrd-fail">
            {error}
          </p>
        ) : null}

        <Actions>
          <Action
            variant="primary"
            type="submit"
            busy={changePassword.isPending}
            disabled={!canSubmit || changePassword.isPending}
          >
            {changePassword.isPending ? "Changing" : "Change password"}
          </Action>
        </Actions>
      </form>
    </Region>
  );
}

/* ================================================================== *
 * This workspace
 *
 * The management verbs the ScopeMenu link "Manage this workspace" promises
 * and this pane never delivered. Rename, leave, delete and create, each one
 * wired end to end: rename refreshes the workspaces list every surface
 * reads, leave hands resolution back to the provider, delete ends the
 * session when nothing remains (the sign-out precedent from ScopeMenu),
 * create inserts against the same table the provider reads and switches to
 * what it made.
 * ================================================================== */
function ThisWorkspaceRegion() {
  const navigate = useNavigate({ from: "/settings" });
  const confirm = useConfirm();
  const qc = useQueryClient();
  const { activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, refreshWorkspaces } =
    useWorkspace();

  const fRename = useServerFn(renameWorkspace);
  const fLeave = useServerFn(leaveWorkspace);
  const fDelete = useServerFn(deleteWorkspace);
  const fEnsureProduct = useServerFn(ensureDefaultProduct);
  const fMembers = useServerFn(listWorkspaceMembers);

  // Leave renders only once membership has loaded and says this user is not
  // the owner; guessing while it loads would offer an action that fails.
  // Same query key MembersCard uses, so both share one read.
  const membersQ = useQuery({
    queryKey: ["workspace-members", activeWorkspaceId],
    queryFn: () => fMembers({ data: { id: activeWorkspaceId! } }),
    enabled: !!activeWorkspaceId,
  });
  const selfRole = membersQ.data?.selfRole ?? null;
  const canLeave = !!activeWorkspaceId && selfRole !== null && selfRole !== "owner";
  /*
   * A REFUSED MEMBERSHIP READ IS NOT "YOU ARE THE OWNER", and `canLeave` cannot
   * tell the two apart because it only ever sees `selfRole === null`. Three
   * different states collapse into the same drawn result -- no Leave row:
   *
   *   still reading      -> correct, and the row appears a moment later
   *   you ARE the owner  -> correct, an owner genuinely cannot leave
   *   the read refused   -> WRONG, and it is the state with a member in it who
   *                         came here to get out
   *
   * So the one person who most needs the door and the one person who must not
   * have it are rendered identically, with nothing on the surface separating
   * them. Reading stays silent on purpose; only the refusal is now spoken.
   */
  const membershipRefused = membersQ.isError;

  // Rename is seeded from the live name; empty or unchanged stays disabled,
  // so a stray click cannot write the name it already has.
  const [nameDraft, setNameDraft] = useState("");
  const [nameDirty, setNameDirty] = useState(false);
  useEffect(() => {
    if (!nameDirty) setNameDraft(activeWorkspace?.name ?? "");
  }, [activeWorkspace?.name, nameDirty]);
  const trimmedName = nameDraft.trim();
  const renameChanged =
    !!activeWorkspace && trimmedName.length > 0 && trimmedName !== activeWorkspace.name;

  const mRename = useMutation({
    mutationFn: () => fRename({ data: { id: activeWorkspaceId!, name: trimmedName } }),
    onSuccess: () => {
      setNameDirty(false);
      void refreshWorkspaces();
      toast.success("Renamed.");
    },
    /*
     * THE MEASURED WORST CASE ON THIS SURFACE went out of here. A rename the
     * server refuses answers with the Postgres sentence
     * *"null value in column "name" violates not-null constraint"*, and
     * `toast.error(e.message)` printed it. `messageForPerson` drops that on
     * three separate tests -- "violates", "constraint", and the lowercase
     * snake_case identifier -- so what remains is the state on its own.
     */
    onError: (e: Error) => toast.error(failureLine("The workspace still has the name it had.", e)),
  });

  const mLeave = useMutation({
    mutationFn: () => fLeave({ data: { id: activeWorkspaceId! } }),
    onSuccess: async () => {
      setActiveWorkspaceId(null);
      await refreshWorkspaces();
      navigate({ to: SIGNED_IN_HOME });
      toast.success(`You left ${activeWorkspace?.name ?? "the workspace"}.`);
    },
    // The confirmation already said access ends immediately, so the one fact
    // worth stating on a failure is that it did not: they are still in, and
    // still see everything they saw before pressing.
    onError: (e: Error) => toast.error(failureLine("You are still in this workspace.", e)),
  });

  const askLeave = async () => {
    if (!activeWorkspace) return;
    const ok = await confirm({
      title: `Leave ${activeWorkspace.name}?`,
      body: "You lose access immediately, including everything in it. Coming back needs an invitation from someone still inside.",
      confirmLabel: "Leave workspace",
      cancelLabel: "Stay",
      destructive: true,
    });
    if (ok) mLeave.mutate();
  };

  // Delete is a hard delete on the server and the cascade takes everything,
  // so neither the copy nor the typed confirm softens that. When no workspace
  // remains the session ends the way sign-out does: a hard navigation leaves
  // no cached workspace state behind for the next person.
  const mDelete = useMutation({
    mutationFn: () => fDelete({ data: { id: activeWorkspaceId! } }),
    onSuccess: async () => {
      setActiveWorkspaceId(null);
      void refreshWorkspaces();
      // The provider types its refresh as void, so what remains is read
      // straight from the table the provider itself reads.
      const { data: remaining } = await supabase.from("workspaces").select("id");
      const next = remaining?.[0]?.id;
      if (next) {
        setActiveWorkspaceId(next);
        navigate({ to: SIGNED_IN_HOME });
        toast.success(`${activeWorkspace?.name ?? "The workspace"} was deleted.`);
      } else {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }
    },
    /*
     * THE ONE FAILURE WHERE THE READER'S FEAR IS THE OPPOSITE OF EVERY OTHER.
     * Elsewhere on this pane a failure means the thing they wanted did not
     * happen; here it means the thing they wanted did not happen and that is a
     * relief, provided they are told. A bare Postgres string after typing a
     * workspace name to confirm a permanent delete leaves it genuinely unclear
     * whether the cascade ran halfway. It did not: the delete is one server
     * call, so a rejection is a rejection.
     */
    onError: (e: Error) =>
      toast.error(failureLine("The workspace and everything in it are still here.", e)),
  });

  const askDelete = async () => {
    if (!activeWorkspace) return;
    const ok = await confirm({
      title: `Delete ${activeWorkspace.name}?`,
      body: `${activeWorkspace.name} and everything in it will be permanently deleted: products, missions, decisions and history. Nothing is kept and this cannot be undone.`,
      typedConfirm: activeWorkspace.name,
      confirmLabel: "Delete forever",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (ok) mDelete.mutate();
  };

  // Create inserts client-side in the shape onboarding uses, adds the owner
  // membership row RLS keys on, then seeds the default product so the new
  // workspace opens somewhere workable. The plan cap arrives as a Postgres
  // error whose message names the upgrade; that becomes the billing door
  // instead of raw SQL text.
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [planBlocked, setPlanBlocked] = useState(false);

  const openCreate = () => {
    setPlanBlocked(false);
    setNewName("");
    setCreateOpen(true);
  };
  const closeCreate = () => {
    setCreateOpen(false);
    setPlanBlocked(false);
  };

  const mCreate = useMutation({
    mutationFn: async () => {
      // Through the chokepoint, not a raw insert: the structured refusal is
      // the point - a plan boundary is guidance, not a malfunction string.
      const result = await createWorkspace({ data: { name: newName.trim() } });
      if (!result.ok) {
        const err = new Error(result.message) as Error & {
          reason?: string;
          limit?: number;
        };
        err.reason = result.reason;
        err.limit = result.limit ?? undefined;
        throw err;
      }
      return result.workspace;
    },
    onSuccess: async (workspace) => {
      closeCreate();
      setNewName("");
      await refreshWorkspaces();
      setActiveWorkspaceId(workspace.id);
      toast.success(`${workspace.name} is ready.`);
    },
    onError: (e: Error & { reason?: string }) => {
      if (e.reason === "plan-limit") {
        setPlanBlocked(true);
      } else {
        // THE STRUCTURED REFUSAL IS HANDLED ABOVE AND EVERYTHING ELSE FALLS HERE,
        // which is exactly the branch nobody wrote copy for. `createWorkspace`
        // builds this Error from `result.message` when the chokepoint said no for a
        // reason that is not the plan cap, and the insert underneath it can also
        // fail on RLS -- so this arm carried both a sentence written for a person
        // and a Postgres refusal, with only the raw message to tell them apart.
        // `failureLine` keeps the first and drops the second.
        //
        // LINE COMMENTS, NOT A BLOCK, AND THAT IS LOAD-BEARING. Several guards on
        // this route strip comments with `/\{\s*\/\*[\s\S]*?\*\/\s*\}/` first, to
        // remove JSX comments WITH their braces. A block comment written as the
        // first token after ANY `{` -- an else arm, a catch, a function body --
        // matches that as an opening brace and the strip then runs to the next
        // `*/ }` anywhere below, deleting every line between. Written as a block
        // here it swallowed 13,110 characters and
        // `the-usage-bar-cannot-be-rebuilt-on-a-subtraction.test.ts` failed on a
        // `title="Balance"` this file still contains.
        toast.error(failureLine("No new workspace was created.", e));
      }
    },
  });

  /*
   * A MISSING WORKSPACE AND AN UNREADABLE ONE ARE NOT THE SAME FACT, and a bare
   * `return null` gave both the same answer: rename, leave and delete were
   * simply not on the page, with no word about why. `useWorkspace` reports the
   * list and whether it is still reading and nothing else, so a refused
   * ["workspaces"] read leaves behind precisely what belonging to no workspace
   * leaves behind -- an empty list and `activeWorkspace === null`. Three
   * controls, including the destructive one, vanish into a state the reader
   * cannot name.
   *
   * `today/Board.tsx` already solved this and this is its pattern, unchanged:
   * read the refusal off the cache the hook itself fills, which costs no extra
   * fetch and no new wiring. STILL READING KEEPS RETURNING NULL, because a
   * region that appears a moment later is not a wrong answer and a flash of a
   * failure line during a normal load would be one.
   */
  const workspacesState = qc.getQueryState(["workspaces"]);
  if (!activeWorkspace || !activeWorkspaceId) {
    if (workspacesState?.status !== "error") return null;
    return (
      <Region title="This workspace">
        <ReadFailedLine onRetry={() => refreshWorkspaces()}>
          Which workspace you are in did not load, so renaming, leaving and deleting it are not
          offered here. Nothing about it has changed. {readFailureMessage(workspacesState.error)}
        </ReadFailedLine>
      </Region>
    );
  }

  return (
    <Region title="This workspace">
      <div className="flex flex-col gap-mrd-5">
        <Field label="Name" htmlFor="workspace-rename">
          <Input
            id="workspace-rename"
            value={nameDraft}
            disabled={mRename.isPending}
            onChange={(e) => {
              setNameDraft(e.target.value);
              setNameDirty(true);
            }}
          />
        </Field>
        <Actions>
          <Action
            variant="primary"
            busy={mRename.isPending}
            disabled={!renameChanged || mRename.isPending}
            onClick={() => mRename.mutate()}
          >
            {mRename.isPending ? "Saving" : "Save name"}
          </Action>
        </Actions>

        {membershipRefused ? (
          /* NAMES THE ONE READ THAT FAILED rather than the whole region, because
             everything else here -- rename, delete, starting another -- is still
             live and still correct. See `membershipRefused` above for the three
             states this row was collapsing into one. */
          <ReadFailedLine onRetry={() => void membersQ.refetch()}>
            Your role in this workspace did not load, so whether you are able to leave it is not
            settled here. Your membership is unchanged. {readFailureMessage(membersQ.error)}
          </ReadFailedLine>
        ) : canLeave ? (
          <Line
            label="Leave this workspace"
            sub="You keep no access here until someone invites you back."
          >
            <Action
              variant="quiet"
              disabled={mLeave.isPending}
              busy={mLeave.isPending}
              onClick={() => void askLeave()}
            >
              {mLeave.isPending ? "Leaving" : "Leave"}
            </Action>
          </Line>
        ) : null}

        <div className="flex flex-col gap-2 rounded-mrd-xs border border-mrd-line bg-mrd-sink p-3.5">
          <p className="text-mrd-base text-mrd-ink">Delete this workspace</p>
          <p className="text-mrd-small text-mrd-mute">
            Deleting {activeWorkspace.name} permanently removes it and everything in it: products,
            missions, decisions and history. Nothing is kept.
          </p>
          <Actions>
            <Action
              variant="destructive"
              disabled={mDelete.isPending}
              busy={mDelete.isPending}
              onClick={() => void askDelete()}
            >
              {mDelete.isPending ? "Deleting" : "Delete workspace"}
            </Action>
          </Actions>
        </div>

        {!createOpen ? (
          <Line label="Another workspace" sub="Keep a second product line separate from this one.">
            <Action onClick={openCreate}>Start another workspace</Action>
          </Line>
        ) : (
          <div className="flex items-end gap-2">
            <Field label="New workspace name" htmlFor="workspace-create-name">
              <Input
                id="workspace-create-name"
                value={newName}
                autoFocus
                placeholder="Name it after the product line"
                onChange={(e) => setNewName(e.target.value)}
              />
            </Field>
            <Actions>
              <Action
                variant="primary"
                disabled={!newName.trim() || mCreate.isPending}
                onClick={() => mCreate.mutate()}
              >
                {mCreate.isPending ? "Creating" : "Create"}
              </Action>
              <Action
                variant="quiet"
                disabled={mCreate.isPending}
                busy={mCreate.isPending}
                onClick={closeCreate}
              >
                Cancel
              </Action>
            </Actions>
          </div>
        )}
        {planBlocked && (
          <p className="text-mrd-small text-mrd-mute">
            Your current plan does not cover another workspace. A plan change happens on the Billing
            page.{" "}
            <Door onClick={() => navigate({ search: { section: "billing" } })}>Open billing</Door>
          </p>
        )}
      </div>
    </Region>
  );
}

/**
 * THE COMPANY RECORD: who is in it, and what it is called (P-23). The brief
 * moved to its own pane above; this is everything else that was fused with
 * it under "About your company" - the workspace record, People, the invite
 * form and the admin door.
 */
function WorkspaceSection() {
  return (
    <div className="flex flex-col gap-mrd-7">
      <ThisWorkspaceRegion />
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
      <div id={PEOPLE_ANCHOR} className="scroll-mt-mrd-7">
        {/* MembersCard draws no Block of its own, so it keeps this one. TeamCard does
          draw one, which is exactly why it must not be inside this. */}
        <Region title="People">
          <MembersCard />
        </Region>
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
      <Region>
        <Line
          label="Admin console"
          sub="Members, roles, the audit trail and billing for the whole workspace."
        >
          <Action variant="quiet" onClick={() => navigate({ to: "/admin" })}>
            Open
          </Action>
        </Line>
      </Region>
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
      <Region>
        <Line
          label="This workspace has no admin yet"
          sub="Claiming it puts members, roles, the audit trail and billing under one person."
        >
          <Action onClick={() => navigate({ to: "/admin" })}>Claim admin</Action>
          <Action variant="quiet" onClick={dismiss}>
            Not now
          </Action>
        </Line>
      </Region>
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
        action={<Action onClick={onOpen}>Open Diagnostics</Action>}
      />
    </>
  );
}

/* ================================================================== *
 * THE ROSTER LEFT THIS SURFACE, 2026-09-09 (fifth review).
 *
 * `RosterSection` and `AgentDetail` read `listCrew` under /team's own query
 * key and drew a census, one line per agent, and a read-only panel per agent
 * whose every action was a door to /team. So Settings answered "who works
 * here" a second time, one rail row away from the Team page that owns it, and
 * the rail's claim about how a person thinks - Team owns the crew and their
 * limits, Settings owns the account and the plumbing - was contradicted by
 * this file.
 *
 * NOTHING A PERSON COULD CHANGE WENT WITH IT: the panel had no editor at all.
 * The arc dial, the tool-reach cap, the on/off switch, the per-tool policy,
 * the lessons and the track record are `/team?agent=<slug>`'s, and were
 * already the only writeable copies. `?section=agents` and `?section=staff`
 * redirect there now (`OFF_PAGE_SECTIONS`, settings-sections.ts), so the
 * addresses land on the surface that can act rather than on a mirror.
 * ================================================================== */

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
    /*
     * `setEditing(false)` RUNS ONLY ON SUCCESS, so on a failure the picker is
     * still open showing the model the person chose while the stored default is
     * the old one. That gap is the whole reason this sentence has to name what
     * RUNS rather than what was saved: the screen already looks like the choice
     * took.
     */
    onError: (e: Error) => toast.error(failureLine("Your work still runs on the old model.", e)),
  });

  const saveAgenticModel = useMutation({
    mutationFn: () => mUpdate({ data: { agentic_model: agenticModel } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setEditingAgentic(false);
      toast.success("Agentic model saved");
    },
    // Same open-picker gap as the default above, on the dial that decides which
    // model does the agentic work.
    onError: (e: Error) => toast.error(failureLine("Agentic work still runs on the old model.", e)),
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
        <PageHeading
          title="Models and keys"
          sub="Which model runs your work, and whose key pays."
        />
        <ReadFailedLine onRetry={() => void profile.refetch()}>
          Your model settings did not load. {readFailureMessage(profile.error)}
        </ReadFailedLine>
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
      <PageHeading
        title="Models and keys"
        /*
          ── ONE NAME, FOUR TIMES (2026-09-01) ──────────────────────────────
          The default on both settings is Auto, so this printed "Everything you
          start runs on Auto. Everything the loop starts by itself runs on
          Auto." -- two clauses of near-identical shape saying one thing -- and
          the two rows immediately beneath then showed Auto again, each with its
          own Change button. Four renders of one word before the reader reaches
          a control.

          It collapses when the two agree and names both when they differ,
          which is the only case where naming them separately tells anybody
          anything. Same rule the roster and `crew.tsx` already follow.
        */
        sub={
          profile.isLoading
            ? "Reading your model settings."
            : defaultName === agenticName
              ? `Everything runs on ${defaultName}, whether you start it or the loop does.`
              : `Work you start runs on ${defaultName}. Work the loop starts runs on ${agenticName}.`
        }
      />

      <Region title="Which model runs the work">
        {profile.isLoading ? (
          <Reading>Reading your model settings.</Reading>
        ) : (
          <>
            <Line
              label="Work you start"
              sub={`Chat and any run you kick off · ${via(defaultModel, current)}`}
            >
              <span className="text-mrd-base text-mrd-mute">{defaultName}</span>
              <Action variant="quiet" aria-expanded={editing} onClick={() => setEditing((v) => !v)}>
                Change
              </Action>
            </Line>
            {editing ? (
              /* `mt-mrd-5` is `.sp-field`'s own `margin-top` restated where it can
                 be seen. Without it the revealed editor butts against the divider
                 under the Line that opened it, reading as part of that row rather
                 than as the thing it disclosed. 16px is the nearest stop at or
                 above the retired 12px. */
              <div className="mt-mrd-5">
                <Field label="Work you start" htmlFor="model-default">
                  <div className="flex gap-mrd-4">
                    <Picker
                      id="model-default"
                      style={{ flex: 1 }}
                      value={defaultModel}
                      onChange={(e) => setDefaultModel(e.target.value)}
                    >
                      <optgroup label="Recommended">
                        <option value={AUTO_MODEL}>Auto: the best model per task</option>
                      </optgroup>
                      {modelOptions}
                    </Picker>
                    <Action
                      variant="primary"
                      busy={saveModel.isPending}
                      onClick={() => saveModel.mutate()}
                    >
                      {saveModel.isPending ? "Saving" : "Save"}
                    </Action>
                  </div>
                </Field>
              </div>
            ) : null}

            <Line
              label="Work the loop starts"
              sub={`Research, clustering and reflection ticks · ${via(agenticModel, currentAgentic)}`}
            >
              <span className="text-mrd-base text-mrd-mute">{agenticName}</span>
              <Action
                variant="quiet"
                aria-expanded={editingAgentic}
                onClick={() => setEditingAgentic((v) => !v)}
              >
                Change
              </Action>
            </Line>
            {editingAgentic ? (
              /* Same restatement as the editor above, for the same reason. */
              <div className="mt-mrd-5">
                <Field label="Work the loop starts" htmlFor="model-agentic">
                  <div className="flex gap-mrd-4">
                    <Picker
                      id="model-agentic"
                      style={{ flex: 1 }}
                      value={agenticModel ?? ""}
                      onChange={(e) => setAgenticModel(e.target.value || null)}
                    >
                      <option value="">Auto: the best model per task</option>
                      {modelOptions}
                    </Picker>
                    <Action
                      variant="primary"
                      busy={saveAgenticModel.isPending}
                      onClick={() => saveAgenticModel.mutate()}
                    >
                      {saveAgenticModel.isPending ? "Saving" : "Save"}
                    </Action>
                  </div>
                </Field>
              </div>
            ) : null}
          </>
        )}
      </Region>

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
  /*
   * WHICH PROVIDERS SUPAPROD'S OWN KEYS COVER (P-155). The subtitle below
   * said "it just uses our keys" and never said which, while the read that
   * knows had no reader. One line, under the heading, on every plan: the
   * providers by name and the model agents run on when a run names none.
   */
  const fPlatform = useServerFn(listPlatformProviders);
  const platform = useQuery({ queryKey: ["platform-providers"], queryFn: () => fPlatform() });
  // Bring-your-own AI keys are enterprise only. Same ["billing"] key as the
  // Plan section, so this dedupes with it rather than firing a second fetch.
  const fGetBilling = useServerFn(getBillingState);
  const billing = useQuery({ queryKey: ["billing"], queryFn: () => fGetBilling({ data: {} }) });
  /*
   * A FAILED BILLING READ IS NOT "FREE", and `?? "free"` was answering it as if
   * it were. Three states arrive on this line -- reading, read, and could not be
   * read -- and the default folded the third into the cheapest of the second,
   * which is the one with a paying customer standing behind it.
   *
   * TWO CONFIDENT WRONG ANSWERS CAME OUT OF THAT ONE MISSING CHECK, because both
   * of the branches below key on this flag alone. An Enterprise customer whose
   * ["billing"] read refuses was told *"An Enterprise boundary. Every other plan
   * runs on Supaprod credits"* -- a sentence about a plan they are not on -- and
   * the key form they came here to use vanished, with the disappearance itself
   * standing as the evidence for the claim.
   *
   * `PlanSection` on this same surface has always read `billing.isError` and
   * returned a ReadFailedLine rather than rendering a silent "Free". This is the
   * same server function under the same query key, so it now gives the same
   * answer. Note the ORDER: refused has to be checked before the tier, or the
   * default reasserts itself.
   */
  const billingRefused = billing.isError;
  const isEnterprise = !billingRefused && (billing.data?.planTier ?? "free") === "enterprise";

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
    /*
     * ONE ANSWER, IN THE PLACE THE PERSON PRESSED. Both arms below used to write
     * the same raw provider string to TWO places at once -- `testResult.error`,
     * which renders beside the buttons, and a toast -- so a failed test put the
     * identical machine sentence on screen twice. The toast is the copy that
     * goes: the inline one sits next to the control that caused it and stays
     * there while the key is edited, which a toast cannot do.
     *
     * BOTH ARMS CARRY THE SAME KIND OF STRING, which is why neither is trusted.
     * `testApiKey` catches its own provider exception and RETURNS
     * `e.message` as `error`, so `ok: false` is a thrown provider error that
     * merely travelled home as data -- the same class as the rejection below,
     * not a sentence written for anyone. Its one genuinely human answer, the
     * Enterprise entitlement refusal, survives `messageForPerson`; the transport
     * failures do not. Composing happens once, at the render site.
     */
    onSuccess: (r) => {
      setTestResult(r);
      if (r.ok) toast.success(`Key works (${r.latency_ms}ms)`);
    },
    onError: (e: Error) => {
      setTestResult({ ok: false, latency_ms: 0, error: e.message });
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
    // The four `setKey*("")` calls are in `onSuccess` only, so on a failure the
    // pasted secret is still in the field and nothing was written. Saying "not
    // stored" is the fact that matters: this is a credential, and a person who
    // thinks it saved will not paste it again.
    onError: (e: Error) => toast.error(failureLine("The key was not stored.", e)),
  });
  const mDelKey = useMutation({
    mutationFn: (id: string) => fDelKey({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Removed");
    },
    /*
     * A DELETE WITH NO `onError` AT ALL, which is the only write on this surface
     * that said nothing whatsoever. react-query holds the rejection, `onSuccess`
     * never runs, so nothing invalidates and nothing is drawn: the Remove button
     * un-busies itself and the row stays exactly where it was. The only evidence
     * a reader has is a row that did not disappear, which is indistinguishable
     * from a list that has not refreshed yet -- and the thing they believe they
     * revoked is a live provider credential that still bills them.
     */
    onError: (e: Error) => toast.error(failureLine("The key is still stored and still in use.", e)),
  });

  const keyList = keys.data?.keys ?? [];

  return (
    <div id={BYO_KEYS_ANCHOR} className="scroll-mt-mrd-7">
      <Region
        title="Your own provider keys"
        sub={
          billingRefused
            ? "Which plan this workspace is on could not be read, so this cannot say whether your own keys are available on it."
            : isEnterprise
              ? "Claude, OpenAI, Qwen, DeepSeek, Groq, Mistral, Moonshot, OpenRouter and anything with a compatible endpoint. Stored encrypted, per user. A base URL is only needed for providers that host their own."
              : "An Enterprise boundary. Every other plan runs on Supaprod credits, with the same model-agnostic routing. It just uses our keys."
        }
      >
        {platform.isLoading ? (
          <Reading>Reading which providers Supaprod's own keys cover.</Reading>
        ) : platform.isError ? (
          <ReadFailedLine onRetry={() => void platform.refetch()} error={platform.error}>
            Which providers Supaprod's own keys cover could not be read.
          </ReadFailedLine>
        ) : platform.data ? (
          <p className="text-mrd-base text-mrd-mute">
            {platformCoverageLine({
              providers: platform.data.providers,
              recommendedModel: platform.data.recommendedModel,
              labels: BYO_PROVIDERS,
              canAddOwn: isEnterprise,
            })}
          </p>
        ) : null}

        {billingRefused ? (
          /* THE SUBTITLE STATES THE GAP AND THIS STATES THE WAY BACK, which is the
             split `ReadFailedLine` exists for: it is the half that carries the
             retry, and `wayOut` turns that into a sign-in door when the refusal
             was an ended session. Any key already saved is listed below and stays
             removable, because `["api-keys"]` is a separate read that did not
             fail. */
          <ReadFailedLine onRetry={() => void billing.refetch()}>
            Your plan did not load, so this cannot tell whether your own provider keys are
            available. Nothing about your keys has changed. {readFailureMessage(billing.error)}
          </ReadFailedLine>
        ) : null}

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
                gap: "var(--mrd-s4)",
              }}
            >
              <Picker
                value={keyProv}
                onChange={(e) => setKeyProv(e.target.value)}
                aria-label="Provider"
              >
                {BYO_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Picker>
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
                style={{ width: "100%", marginTop: "var(--mrd-s4)" }}
                value={keyModelId}
                onChange={(e) => setKeyModelId(e.target.value)}
                aria-label="Model id"
                placeholder="Model id, exactly as the provider names it"
              />
            ) : null}
            <Actions>
              {/* Not primary: the primary on this section is the model save. */}
              <Action type="submit" disabled={mSaveKey.isPending || !keyValue.trim()}>
                {mSaveKey.isPending ? "Saving" : "Add key"}
              </Action>
              <Action
                disabled={mTestKey.isPending || !keyValue.trim()}
                onClick={() => mTestKey.mutate()}
              >
                {mTestKey.isPending ? "Testing" : "Test it first"}
              </Action>
              {testResult ? (
                /* An OUTCOME that has already happened -- the key answered, or it
                   did not -- which is the one thing Meridian's pass and fail are
                   allowed to mean. `Value` rather than a hand-rolled span so the
                   tone is declared in `data-tone` and not only painted.

                   THE VERDICT ONLY. The reason moved out below, because
                   `.slice(0, 90)` was cutting a provider message mid-word inside
                   a wrapping flex row, and it will now cut a composed sentence
                   the same way. A verdict fits a pill; a reason does not. */
                <Value tone={testResult.ok ? "pass" : "fail"}>
                  {testResult.ok ? (
                    <>
                      Answered in <Num>{testResult.latency_ms}ms</Num>
                    </>
                  ) : (
                    "Did not answer"
                  )}
                </Value>
              ) : null}
            </Actions>
            {testResult && !testResult.ok ? (
              /* WHERE THE ONE SURVIVING COPY OF THE REASON IS DRAWN. `role="alert"`
                 because it replaces a toast, and losing the toast without it
                 would leave a screen-reader user pressing Test and hearing
                 nothing at all. Same shape as the password errors above, which
                 is the file's existing form for a failure paragraph. */
              <p role="alert" className="mt-mrd-4 text-mrd-small text-mrd-fail">
                {failureLine("The key was not confirmed, and nothing was saved.", testResult.error)}
              </p>
            ) : null}
          </form>
        ) : null}

        {isEnterprise || keyList.length > 0 ? (
          <>
            {keys.isLoading ? (
              <Reading>Reading your keys.</Reading>
            ) : keys.isError ? (
              <ReadFailedLine onRetry={() => void keys.refetch()}>
                Your keys did not load. {readFailureMessage(keys.error)}
              </ReadFailedLine>
            ) : keyList.length === 0 ? (
              <NothingYet>No key of your own yet. Until there is one, runs use ours.</NothingYet>
            ) : (
              keyList.map((k) => (
                <Line
                  key={k.id}
                  label={
                    <>
                      {BYO_PROVIDERS.find((p) => p.id === k.provider)?.label ?? k.provider}
                      {k.label ? <span className="text-mrd-mute"> · {k.label}</span> : null}
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
                  <Action
                    variant="quiet"
                    disabled={mDelKey.isPending && mDelKey.variables === k.id}
                    onClick={() => mDelKey.mutate(k.id)}
                  >
                    Remove
                  </Action>
                </Line>
              ))
            )}
          </>
        ) : null}
      </Region>
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

  /*
   * BOTH EXITS OF ALL THREE BILLING MUTATIONS, not just the `onError` ones.
   *
   * The `e instanceof Error ? e.message : "..."` idiom is the exact shape
   * `components/settings/no-raw-server-error-reaches-a-person.test.ts` bans
   * across this lane's component prefix -- that guard walks `src/components`
   * only, so these three sat outside it in `src/routes` and kept the idiom the
   * rest of the lane removed. Its own header names the trap: the decent fallback
   * sentence is reachable ONLY when the error carried no message at all.
   *
   * AND THE `res.error` ARM IS THE SAME LEAK WEARING A RETURN TYPE. `payments.functions`
   * answers with `getStripeErrorMessage(error)`, which appends Stripe's `type`,
   * `code`, `decline_code`, `param` and `requestId` in parentheses -- so the
   * string a person read was *"No such subscription: sub_1A... (invalid_request_error,
   * resource_missing, subscription, req_xyz)"*. Fixing the throw and leaving the
   * return would be a fix in one field, which is the trap this lane has already
   * paid for twice. `messageForPerson` drops those on the snake_case test and
   * keeps the hand-written ones ("No active subscription found.").
   */
  const cancelSub = useMutation({
    mutationFn: () => fCancelSub({ data: { environment: subEnv } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(failureLine("Your subscription is unchanged.", res.error));
        return;
      }
      toast.success("Subscription set to cancel at the end of the current period.");
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
    // The confirmation said access continues to the period end and then drops to
    // Free. On a failure none of that was scheduled: the plan renews as it did.
    onError: (e) => toast.error(failureLine("Your subscription is unchanged.", e)),
  });

  const resumeSub = useMutation({
    mutationFn: () => fResumeSub({ data: { environment: subEnv } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(failureLine("Your subscription is still set to end.", res.error));
        return;
      }
      toast.success("Subscription resumed. Renews on the next billing date.");
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
    // Resume is drawn only while `cancelAtPeriodEnd` is set, so the standing
    // state on a failure is the cancellation still being in place -- which is
    // the fact a person pressing Resume is trying to get rid of.
    onError: (e) => toast.error(failureLine("Your subscription is still set to end.", e)),
  });

  const openPortal = useMutation({
    mutationFn: () => fPortal({ data: { environment: subEnv, returnUrl: window.location.href } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(
          failureLine("The billing portal did not open, and nothing changed.", res.error),
        );
        return;
      }
      if ("url" in res && res.url) {
        window.location.href = res.url;
      }
    },
    // A portal session is a redirect, so a failure leaves the person exactly
    // here with the plan they had. Worth saying, because the button goes quiet
    // and there is no page change to read as an outcome either way.
    onError: (e) =>
      toast.error(failureLine("The billing portal did not open, and nothing changed.", e)),
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
  /*
   * `hold`, NOT a sixth status word. The retired sheet had `sp-warn` and Meridian
   * has five words and no warn: a subscription set to cancel is WAITING ON A
   * CONDITION -- the period ending -- which is exactly what amber says here.
   * Orchid would be the reflex and it is wrong, because it promises a control on
   * this line that releases something, and there is none. `fail` stays where it
   * already reported an outcome that happened: the payment method failed.
   * `quiet` for Active, which is a fact you read rather than an outcome.
   */
  const statusTone: "hold" | "fail" | "quiet" = sub?.cancelAtPeriodEnd
    ? "hold"
    : isPastDue
      ? "fail"
      : "quiet";

  if (billing.isLoading) {
    return (
      <>
        <PageHeading title="Plan" sub="What this workspace is entitled to." />
        <Reading>Reading your plan.</Reading>
      </>
    );
  }

  // An error never wears an empty state's clothes: a failed read must not
  // render as a silent "Free".
  if (billing.isError) {
    return (
      <>
        <PageHeading title="Plan" sub="What this workspace is entitled to." />
        <ReadFailedLine onRetry={() => void billing.refetch()}>
          Your plan did not load. {readFailureMessage(billing.error)}
        </ReadFailedLine>
      </>
    );
  }

  return (
    <>
      {/*
        ── ONE SENTENCE, PRINTED THREE TIMES, ON ONE SCREEN (2026-09-01) ──────
        Photographed on the free tier: *"The full product loop, free. It guides
        for 30 days. Upgrade when your work outgrows it."* appeared as the page
        subtitle, again under "What you are on", and a third time inside the
        Free card in the comparison grid -- all three visible without
        scrolling. The word "Free" landed four times in the same view.

        Each render came from a different author solving a different problem,
        which is why nobody caught it: the subtitle wanted to say what you are
        on, the region wanted to describe the row it owns, and the card has to
        carry a tagline because it sits next to three other cards being
        compared. Only the CARD genuinely needs it -- a tagline is a
        comparison device, and there is nothing to compare against in the other
        two places.

        THE SUBTITLE NOW HOLDS A FACT OR IT HOLDS THE PAGE'S PURPOSE.
        On a paid plan it already carried the renewal date, which is the one
        thing on this page a person cannot work out for themselves. On free
        there is no such date, so it falls back to the same line the loading
        and error states already print -- which has the second effect of
        stopping the subtitle from CHANGING as the query lands. It used to
        rewrite itself from "What this workspace is entitled to." to the
        tagline the moment data arrived, moving everything under it.
      */}
      <PageHeading
        title="Plan"
        sub={
          hasSub && renewsLabel
            ? `${current.name}, ${sub?.cancelAtPeriodEnd ? "open until" : "renewing"} ${renewsLabel}.`
            : "What this workspace is entitled to."
        }
      />
      <PaymentTestModeBanner />

      <Region title="What you are on">
        {/* No `sub`: the tagline is the comparison card's job, and that card is
            300px below this row wearing a "Your plan" mark. */}
        <Line label={current.name}>
          {hasSub ? <Value tone={statusTone}>{statusWord}</Value> : null}
        </Line>
        {hasSub && renewsLabel ? (
          <Line label={sub?.cancelAtPeriodEnd ? "Access until" : "Renews on"}>
            <Num>{renewsLabel}</Num>
          </Line>
        ) : null}

        {state && !state.isOwner ? (
          <NothingYet>Only the workspace owner can change or cancel the plan.</NothingYet>
        ) : (
          <Actions>
            {hasSub ? (
              <Action
                variant={isPastDue ? "primary" : "default"}
                busy={openPortal.isPending}
                onClick={() => openPortal.mutate()}
              >
                {openPortal.isPending ? "Opening" : "Manage billing"}
              </Action>
            ) : null}
            {hasSub ? (
              sub?.cancelAtPeriodEnd ? (
                <Action busy={resumeSub.isPending} onClick={() => resumeSub.mutate()}>
                  {resumeSub.isPending ? "Resuming" : "Resume the plan"}
                </Action>
              ) : (
                <Action variant="quiet" busy={cancelSub.isPending} onClick={onCancelClick}>
                  {cancelSub.isPending ? "Canceling" : "Cancel the plan"}
                </Action>
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
              <Action
                variant="quiet"
                onClick={() =>
                  document
                    .getElementById(CREDITS_ANCHOR)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Buy a credit top-up
              </Action>
            ) : null}
          </Actions>
        )}
      </Region>

      <Region title="What else you could be on">
        <PlanTable currentTier={currentTier} canSelect={state?.isOwner ?? false} />
      </Region>

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

/*
 * SPEND AND RUNWAY (item 26), read from MAIN's `credit_runway` RPC through
 * `getCreditRunway`. Every number is one the RPC vouched for; the two honest
 * absences are rendered as sentences, never as zeros -- `runsLeft` is null when
 * the window holds no runs (no rate can exist), and a failed read claims
 * nothing rather than showing a confident 0. The window is named beside the
 * burn so the figure can be argued with.
 */
function RunwaySection() {
  const { activeWorkspaceId } = useWorkspace();
  const fRunway = useServerFn(getCreditRunway);
  const q = useQuery({
    queryKey: ["runway", activeWorkspaceId],
    queryFn: () => fRunway({ data: { workspaceId: activeWorkspaceId as string } }),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 60_000,
  });
  if (!activeWorkspaceId) return null;
  const r = q.data;
  return (
    <Region title="Spend and runway">
      {q.isLoading ? (
        <Reading>Reading this cycle's spend.</Reading>
      ) : q.isError || r == null ? (
        <ReadFailedLine onRetry={() => void q.refetch()}>
          The runway could not be read just now, so nothing here shows a number. Retry before
          treating spend as zero.
        </ReadFailedLine>
      ) : (
        <>
          <Row
            tight
            lead={
              <>
                Spent <Num>{r.creditsSpentInWindow}</Num> credits in the last{" "}
                <Num>{r.windowDays}</Num> days.
              </>
            }
            sub={
              <>
                {/* In the data face like the other three. It was the one bare
                    figure in the sentence, so it sat in prose type beside
                    tabular ones and the row did not line up. */}
                <Num>{r.runsInWindow}</Num> runs · <Num>{r.spendableCredits}</Num> credits available
                now.
              </>
            }
          />
          <Row
            tight
            lead={
              r.runsLeft === null ? (
                "Not enough runs in this window to estimate what is left."
              ) : (
                <>
                  About <Num>{Math.floor(r.runsLeft)}</Num> more runs at this pace.
                </>
              )
            }
            sub="Estimated from this window's pace; it moves as the work moves."
          />
        </>
      )}
    </Region>
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
      // THE ONE FAILURE ON THIS PANE THAT NAMES OUR OWN SECRETS.
      // `getStripeEnvironment` throws a CONFIGURATION error, and `error-copy.ts`
      // has a whole clause about this exact shape: a config error is written as a
      // sentence -- for an operator -- and defeats every other test in
      // `messageForPerson`, so it reached a customer as *"Missing Supabase
      // environment variable(s): SUPABASE_SERVICE_ROLE_KEY. Connect Supabase in
      // Lovable Cloud."* on the public /proof page. The SCREAMING_SNAKE rule added
      // for that catches it here too, and what a person is left with is the state,
      // which is all they can act on anyway.
      //
      // Line comments for the same reason as the `else` arm in `mCreate`: a block
      // comment opening a `{` body defeats this route's guards' comment stripper.
      toast.error(failureLine("No purchase was started, and you were not charged.", e));
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
      <PageHeading
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

      <Region title="Balance">
        {credits.isError ? (
          <ReadFailedLine onRetry={() => void credits.refetch()}>
            Your balance did not load. {readFailureMessage(credits.error)}
          </ReadFailedLine>
        ) : credits.isLoading ? (
          <Reading>Reading your balance.</Reading>
        ) : (
          <>
            <div
              style={{
                fontFamily: "var(--mrd-mono)",
                fontVariantNumeric: "tabular-nums",
                fontSize: "var(--mrd-t-h2)",
                color: "var(--mrd-ink)",
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
                  <Num>{data.monthlyGrantCredits}</Num>
                </Line>
                <Line label="Bought on top">
                  <Num>{data.topupCredits}</Num>
                </Line>
                {/*
                  THE CONSUMPTION BAR IS GONE, AND IT WAS WRONG ON EVERY ACCOUNT
                  THAT HAD SPENT ANYTHING.

                  It read `used = max(0, monthlyGrantCredits - balanceCredits)`.
                  That subtraction describes the CURRENT DIP BELOW A NOMINAL
                  GRANT, not consumption: a grant landing mid-cycle, or a reset,
                  lifts the balance back up and the subtraction forgets every
                  credit already spent.

                  Measured live, 2026-08-31, over all 16 accounts. Four have
                  spent anything, and the bar understated all four:

                    account   bar said   debited since cycle_anchor
                    5731ab6f         0                      23,218
                    164e0692     3,508                      16,020
                    5d5cc377         0                       4,250
                    1a8da78c         6                       4,247

                  Two of the four read a flat ZERO after thousands of credits of
                  real work, because their balance had been re-granted to at or
                  above the nominal figure and `Math.max(0, ...)` absorbed the
                  negative. The other twelve accounts agreed only because they
                  have never spent a credit -- F-159's rule exactly: it was
                  right for environmental reasons, not because it computed
                  anything.

                  This is the page where a company decides what Supaprod costs,
                  and the error ran in the direction that flatters us. Craft bar
                  standard #7 deletes the claim rather than softening it.

                  THE HONEST NUMBER IS NOT REACHABLE FROM HERE. It is
                  `sum(delta_credits) where delta_credits < 0 and created_at >=
                  cycle_anchor`, a server-side sum over `credit_ledger`. The
                  `ledger` on this view CANNOT stand in for it: it is
                  `.limit(20)` for display, and this account has 6,461 rows, so
                  summing it would replace one wrong number with a smaller wrong
                  number. Filed to S0 for a `cycleSpentCredits` field.

                  UsageIndicator WENT WITH THE MOUNT rather than being left
                  unimported. It was this component's only caller, and the
                  orphan ratchet exists to stop exactly that -- something
                  exported that reaches no screen. Its logic was never the
                  defect and it is intact in git history; restore it if a true
                  per-cycle spend number ever makes the bar worth drawing. That
                  is a product call nobody has made: this page already answers
                  "what has this cost me" correctly one region below, and the
                  bar was a second, worse answer to the same question.

                  Nothing is hidden in the meantime. The balance above is
                  authoritative, and real measured spend is one region below,
                  which is where this now points -- rather than contradicting it,
                  which is what the bar was doing 400px apart on one screen.
                */}
                {data.enabled && data.monthlyGrantCredits > 0 ? (
                  <Line
                    label="Used this cycle"
                    sub="Spend is measured under Spend and runway, below."
                  >
                    <span className="text-mrd-mute">Not shown here</span>
                  </Line>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </Region>

      <CreditCapsCard />

      {/* The target of "Buy a credit top-up" up in the plan block. A wrapper rather
          than an id on Block, which takes no id prop and should not grow one for a
          single caller's anchor. `scroll-mt` keeps the heading clear of the sticky
          header instead of landing it underneath. */}
      <div id={CREDITS_ANCHOR} className="scroll-mt-mrd-7">
        <Region title="Buy more">
          {catalog.isLoading ? (
            <Reading>Reading the price list.</Reading>
          ) : catalog.error ? (
            <ReadFailedLine onRetry={() => void catalog.refetch()}>
              The price list did not load. {readFailureMessage(catalog.error)}
            </ReadFailedLine>
          ) : BUNDLES.length === 0 ? (
            <NothingYet>
              No top-up is published yet. When one is, it appears here at the price that will
              actually be charged.
            </NothingYet>
          ) : (
            <>
              {/* A grid, for the same reason the source catalog is one: a ladder
                of prices is scanned across, not read down. Token-built rather
                than borrowing the crew roster's classes, which mean something
                else. R005 §2: these are CARDS you pick from, so each is a `Cell`
                with `selected` -- the chosen ring and the toggle aria are the
                primitive's, and the disabled/title wiring below is unchanged. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(196px, 1fr))",
                  gap: "var(--mrd-s4)",
                }}
              >
                {BUNDLES.map((b) => {
                  const wouldExceed = remainingTopupRoom !== null && b.credits > remainingTopupRoom;
                  const perCredit = b.priceCents / b.credits;
                  const isBest = Math.abs(perCredit - bestPerCredit) < 1e-9;
                  const selected = selectedBundle?.key === b.key;
                  return (
                    <Cell
                      key={b.key}
                      lead={
                        <>
                          <Num>{b.credits}</Num> credits
                        </>
                      }
                      sub={`${fmtPrice(b.priceCents)} · ${(perCredit / 100).toFixed(3)} each${
                        isBest ? " · best rate" : ""
                      }`}
                      selected={selected}
                      disabled={wouldExceed}
                      title={wouldExceed ? "Past your per-cycle top-up limit." : undefined}
                      onClick={() => setSelectedKey(b.key)}
                    />
                  );
                })}
              </div>

              {/* Honest checkout: while payments are dormant there is no Buy
                button at all, because a disabled buy is still a dead promise. */}
              {selectedBundle && envSafe ? (
                <Actions>
                  <Action
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
                  </Action>
                </Actions>
              ) : selectedBundle ? (
                <NothingYet>
                  Buying is not switched on in this build. The prices are live so you can plan
                  against them.
                </NothingYet>
              ) : null}
            </>
          )}

          {data ? (
            <NothingYet>
              <Num>{data.cycleTopupCredits}</Num> of <Num>{data.cycleTopupCapCredits}</Num> top-up
              credits used this cycle.{" "}
              <a
                href="mailto:sales@supaprod.ai?subject=Enterprise%20credits"
                className="text-mrd-ink"
              >
                Ask about volume pricing
              </a>{" "}
              if you need past the cap.
            </NothingYet>
          ) : null}
        </Region>
      </div>

      <RedeemCodeCard />

      {/* The receipts for purchases made HERE. What the credits were SPENT on
          is a report, and it lives in the Engine room's Spend view. */}
      <Region title="What you bought">
        {credits.isLoading ? (
          <Reading>Reading your purchases.</Reading>
        ) : credits.isError ? (
          <NothingYet>Your purchases did not load. Use the retry above.</NothingYet>
        ) : !data || data.topups.length === 0 ? (
          <NothingYet>Nothing bought yet. Your monthly grant is covering the work.</NothingYet>
        ) : (
          data.topups.map((t) => (
            <Row
              key={`top-${t.id}`}
              tight
              lead="Credit top-up"
              sub={
                /* The purchase went through, which is an outcome. */
                <Value tone="pass">+{Number(t.credits_added).toLocaleString()} credits</Value>
              }
              time={new Date(t.created_at).toLocaleDateString()}
            />
          ))
        )}
      </Region>

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
