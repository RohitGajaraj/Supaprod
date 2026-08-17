/**
 * SETTINGS: THE INFORMATION ARCHITECTURE, AND THE ONLY PLACE IT IS WRITTEN DOWN.
 *
 * Founder verdict, 2026-08-05: "Especially the engine room and settings, we
 * have NEVER GAVE A THOUGHT ABOUT IT. It is just randomly designed and a little
 * layer and tweaks." This file is the thought. It is pure - no React, no db, no
 * network - so the IA can be asserted by a unit test rather than eyeballed in a
 * browser, and so there is exactly ONE list of what Settings contains.
 *
 * ------------------------------------------------------------------------
 * 1. THE FIFTEEN, AND WHAT A PERSON IS ACTUALLY LOOKING FOR
 * ------------------------------------------------------------------------
 *
 * Fifteen panes render on /settings. Nobody has ever opened Settings to look at
 * things; they arrive mid-sentence, with one of these in their head:
 *
 *   "stop asking me before it edits code"        -> autonomy
 *   "why did that agent touch production"        -> staff (reach)
 *   "which model is burning my credit"           -> ai
 *   "the crew keeps writing the wrong thing"     -> workspace (brief and voice)
 *   "it drew the wrong colours again"            -> brand
 *   "attach this mission to the right product"   -> products
 *   "where did the memory settings go"           -> memory
 *   "connect my GitHub"                          -> connections
 *   "which repo is this workspace pointed at"    -> sync
 *   "let Cursor read my workspace"               -> interop
 *   "export everything and delete me"            -> data
 *   "stop emailing me at midnight"               -> notifications
 *   "call me Jane, and I am asleep at 22:00"     -> profile
 *   "cancel my plan"                             -> billing
 *   "how much is left, and cap the top-ups"      -> credits
 *   "why is everything failing"                  -> health
 *
 * Every one of those is a BOUNDARY: something set once so it never has to be
 * asked in the moment. That is the surface's whole job, so the groups are named
 * by which boundary they set, in the product's own words. Not "General" and
 * "Advanced", which name nothing and are where settings go to be lost.
 *
 * ------------------------------------------------------------------------
 * 2. THE FIVE GROUPS
 * ------------------------------------------------------------------------
 *
 *   What the crew may do                  autonomy · staff · ai
 *   What the crew reads                   workspace · brand · products · memory
 *   What it can reach                     connections · sync · interop · data
 *   What reaches you                      profile · notifications
 *   What it costs, and whether it works   billing · credits · health
 *
 * The retired cut (You · Workspace · Agents · Connections & Data · Plan & Usage)
 * grouped by WHOSE THING IT IS. That is the data model's shape, not a person's:
 * "Agents" and "Connections" are both places a person looks when the crew did
 * something they did not want, and no label told them which. These five group by
 * WHAT YOU ARE STOPPING OR STARTING, which is the sentence people actually
 * arrive with.
 *
 * ------------------------------------------------------------------------
 * 3. WHAT LEADS, AND WHY IT IS NOT AUTONOMY
 * ------------------------------------------------------------------------
 *
 * DEFAULT_SECTION is `profile`, reverted from `autonomy` on 2026-08-10.
 *
 * The 2026-08-06 argument for leading on Autonomy was about USEFULNESS, and it
 * was right about the facts: of 16 profiles, ZERO have moved working hours off
 * the 9-18 default and ZERO have written a voice anchor, while "stop asking me
 * before it does X" is the most common sentence in the head of someone opening
 * this surface. It was still the wrong ruling, for two reasons it did not
 * weigh.
 *
 * FIRST, ARRIVING SOMEWHERE IS NOT CHOOSING IT. Autonomy is the pane a
 * security reviewer is shown, and the one whose contents are the safety
 * contract for unattended work. A person lands on `/settings` from the account
 * menu, from `g s`, from a legacy redirect off `/notifications`, and from a
 * palette entry that says only "Settings". None of those is a request to be
 * shown the governance surface, and a surface that consequential should be
 * somewhere you went on purpose. Every product that gets this right opens
 * settings on the ordinary and personal, and keeps the governance scope one
 * deliberate click away.
 *
 * SECOND, THE PANE STOPPED BEING AN EDITOR. Autonomy no longer sets a tool
 * boundary at all: the founder ruled /boundary the one home, so what renders
 * there now is a read plus a door. Landing every visitor on a read-only
 * restatement of another surface is the worst of both - it is neither the
 * thing they came for nor the place to change it.
 *
 * Autonomy loses nothing. It is still the FIRST door in the nav, so Home
 * reaches it in one keypress from anywhere in the index, `?section=autonomy`
 * still lands, and `?section=crew` still lands there too.
 *
 * ------------------------------------------------------------------------
 * 4. WHAT BELONGS ELSEWHERE, AND WHAT IS DEAD
 * ------------------------------------------------------------------------
 *
 * DEAD, reported not removed (removing it would break saved links, and the
 * fix belongs to whoever owns the redirect table):
 *   · `memory` renders a pane whose entire content is a sentence saying memory
 *     moved to Brain. A pane that exists to apologise for itself is dead weight;
 *     it should be a redirect to /brain, not a section. It keeps its address so
 *     old links land, and it draws no door.
 *
 * BELONGS ELSEWHERE (all left rendering - see the route header for the
 * hand-off notes, since moving them needs the receiving lane):
 *   · `staff` and `autonomy` -> /crew.
 *   · the credit debit ledger inside `credits` -> Engine room, Spend.
 *   · Members and Team inside `workspace` -> /admin.
 *   · `sync` -> /sync, which renders the same bindings. It already folds: the
 *     address answers on Connectors and draws no door of its own.
 *
 * ------------------------------------------------------------------------
 * 5. THE ROUTING CONTRACT, UNCHANGED
 * ------------------------------------------------------------------------
 *
 * Every `SectionId` survives, every `?section=` value still resolves, and every
 * legacy alias still lands. Regrouping moved which HEADING a door sits under and
 * nothing else. `?section=plan` still lands on Plan (the signup checkout
 * redirect and the account menu depend on it), `?section=brief` still lands on
 * Brief and voice, `?section=agents` still lands on the Roster.
 */

export type SectionId =
  | "connections"
  | "ai"
  | "staff"
  | "autonomy"
  | "workspace"
  | "brand"
  | "products"
  | "billing"
  | "credits"
  | "interop"
  | "sync"
  | "profile"
  | "health"
  | "data"
  | "notifications"
  | "memory";

/**
 * FOUR GROUPS SINCE 2026-08-17, down from five. `plan` was retired as a GROUP and
 * its sections moved under `you`, which is where every shipped settings surface
 * this file already cites puts money: GitBook, ClickUp and Toggl all keep billing
 * beside the account rather than in a neighbourhood of its own.
 *
 * The id survives in `LEGACY_SECTION_MAP` so `?section=plan` still lands on
 * Billing, which the signup checkout redirect and the account menu both depend on.
 */
export type GroupId = "crew" | "brief" | "reach" | "you";

/**
 * A named block INSIDE a pane, which search can name and land on.
 *
 * Founder: "if someone types invite in the search bar, it should open up the section
 * where it is exactly ... it would literally point me to this section. That's how the
 * search should work, not just for this entire thing."
 *
 * Before this, "invite" resolved to the pane that contains the invite form and said
 * "Brief and voice", leaving the reader to find it among five blocks. The pane was
 * right and the answer was useless.
 *
 * `anchor` is a real element id on that pane, so landing is a scroll rather than a
 * promise. An anchor nothing renders is a door to nowhere, which is this repo's
 * most-paid-for defect, so the search test asserts every anchor here exists in the
 * route source.
 */
export type SettingsSubTarget = {
  /** The heading a reader will actually see when they arrive. */
  label: string;
  /** The `id` of the element to scroll to. */
  anchor: string;
  keywords: readonly string[];
};

export type SettingsSection = {
  id: SectionId;
  label: string;
  /**
   * Omitted means a door is drawn in the nav. `false` means the ADDRESS still
   * answers but no door is drawn, which is how a folded or apologising section
   * keeps every saved link alive without spending a row of the index on itself.
   */
  door?: false;
  /**
   * This address renders another section's pane. `sync` folds into Connectors,
   * which shows the bindings /sync used to duplicate.
   */
  foldsInto?: SectionId;
  /**
   * What a person might TYPE to look for something on this pane.
   *
   * ── WHY A DOOR LABEL IS NOT ENOUGH ──────────────────────────────────────
   * Founder, testing the new rail: typing "credits" found nothing, and "invite"
   * found nothing. Both are real things this surface can do. Credits is inside
   * Billing since the fold, and inviting somebody is inside a People block on the
   * Brief and voice pane. Searching twelve door labels could never have found
   * either, so the search box was answering a question nobody asked -- "which door
   * is called this" -- instead of the one everybody asks, "where is the thing I
   * want".
   *
   * ── THE RULE FOR WHAT GOES IN HERE ──────────────────────────────────────
   * Only words for things the pane ACTUALLY CONTAINS, taken from its own block and
   * field labels. Not synonyms nobody types, and never an aspiration: a keyword for
   * a control that is not there sends a person to a pane to hunt for something that
   * does not exist, which is worse than finding nothing. `settings-search.test.ts`
   * pins each one against the pane it claims.
   */
  keywords?: readonly string[];
  /** Named blocks inside this pane that search can land on. */
  subs?: readonly SettingsSubTarget[];
};

export type SettingsGroup = {
  id: GroupId;
  label: string;
  /** One line saying what this group of boundaries governs. Rendered in the nav
   *  under the active group's heading, so a person can tell whether they are in
   *  the right neighbourhood before they read four door labels. */
  desc: string;
  /** Member sections in display order. The FIRST is the group's landing section
   *  and must be one that draws a door - `primaryIsADoor` in the tests. */
  sections: SettingsSection[];
};

/**
 * GROUP LABELS ARE NOUNS THAT NAME A SCOPE (2026-08-11).
 *
 * All five used to be sentence fragments: "What the crew may do", "What the
 * crew reads", "What it can reach", "What reaches you", "What it costs, and
 * whether it works". They read well in a document and badly in a sidebar,
 * because a sidebar is scanned for a noun, not read for a sentence. Someone
 * looking for their notification settings has to parse "What reaches you";
 * someone looking for API keys has to work out that keys live under a clause
 * about permission.
 *
 * One of them was also plainly wrong rather than merely indirect. "What
 * reaches you" contained Profile, and your own name does not reach you: the
 * group was named after one of its two items.
 *
 * Eight shipped settings surfaces were checked and the convention is
 * unanimous. GitBook uses Account and Organization; ClickUp uses Workspace and
 * the person's name; Toggl uses Toggl Account and Availability; Lindy,
 * Squarespace, Runway and Hume all use bare nouns. Not one uses a sentence, a
 * question or a verb phrase.
 *
 * The sentences were not wasted, they were just in the wrong slot: each one is
 * now the group's `desc`, which is where a sidebar can afford a sentence.
 *
 * "Agents", not "Crew", since 2026-08-15 — and the paragraph that used to sit
 * here argued the opposite, on a premise that has since stopped being true. It
 * said Crew was kept BECAUSE THE RAIL ALREADY CARRIED CREW, so a second word
 * would be the very confusion this file exists to remove. That reasoning was
 * sound and its premise is gone: the rail no longer carries Crew at all. The
 * row was renamed Agents and then moved in here.
 *
 * The rule it was applying still holds, which is why the conclusion flipped
 * rather than the rule: ONE THING GETS ONE WORD. That word is now Agents,
 * everywhere, because it is what the substrate has always said. Kept here
 * verbatim rather than deleted, because a reader who finds only the new answer
 * cannot tell whether the old one was considered.
 */
export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  /*
   * ── WHY ACCOUNT LEADS, 2026-08-17 ─────────────────────────────────────────
   * Founder, on the shipped rail: "don't you feel the profile section, which is at
   * the bottom today, should be at the top? Sequentially, what our user uses should
   * be there."
   *
   * That is an incoherence being reported, not a preference. `DEFAULT_SECTION` has
   * been `profile` since 2026-08-10, so a bare /settings, the account menu, `g s`
   * and the /notifications redirect ALL land on Profile -- and Profile was the
   * eleventh row of twelve. The surface opened at the bottom of its own index, which
   * is a large part of the "randomly dumped" feeling he described.
   *
   * ── THE WHOLE ORDER, BY HOW OFTEN A PERSON COMES FOR IT ───────────────────
   * Founder ruling, same conversation: order the groups by frequency of use, "not
   * just randomly moving around the things".
   *
   *   1. Account          your name, your theme, your hours, what this costs. Where a
   *                       bare /settings already lands, and the shallowest errands.
   *   2. Data and access  connectors, what an outside agent may read, what we hold.
   *                       The group that grows: every new source, every new scope,
   *                       every export request comes back here.
   *   3. Agents           autonomy, the roster, the models. Set deliberately and
   *                       revisited when a boundary turns out to be wrong.
   *   4. Company          the brief, the brand, the products. The most consequential
   *                       and the least frequent: written once and rarely reopened.
   *
   * Governance sits BELOW plumbing on purpose, which reads backwards until you count
   * visits rather than importance. Autonomy is the pane a security reviewer is walked
   * through; it is not the pane anybody opens on a Tuesday. The same argument made
   * Profile the landing rather than Autonomy on 2026-08-10.
   */
  {
    id: "you",
    label: "Account",
    desc: "Your name, what may interrupt you, and what this workspace costs.",
    sections: [
      {
        id: "profile",
        label: "Profile",
        keywords: ["name", "avatar", "picture", "identity", "theme", "dark", "light", "density", "appearance", "timezone", "working hours", "quiet hours"],
      },
      { id: "notifications", label: "Notifications", keywords: ["email", "digest", "alert", "interrupt", "quiet"] },
      /*
       * "BILLING", NOT "PLAN", AND THIS IS A COLLISION FIX RATHER THAN A TIDY-UP.
       *
       * The product has a STATION called Plan -- the spine's third stop, at
       * /plan, where specs are written -- and this door was also called Plan,
       * meaning the subscription tier. Two unrelated things, one word, both
       * reachable from the same shell. A person hunting for their spec and a
       * person hunting for their invoice were being offered the same label.
       *
       * The id has always been `billing`, so only the label was ever wrong, and
       * `?section=plan` still lands here through LEGACY_SECTION_MAP.
       *
       * ONE THING GETS ONE WORD is the rule this file already applies to Agents.
       * This is the same rule catching a second offender.
       */
      {
        id: "billing",
        label: "Billing",
        // Credits folded in here, so every word for the balance and the top-up has to
        // reach this door or the fold made them unfindable.
        keywords: ["plan", "tier", "upgrade", "downgrade", "cancel", "invoice", "payment", "card", "subscription", "credits", "credit", "balance", "top-up", "topup", "buy", "redeem"],
      },
      /*
       * CREDITS FOLDS INTO BILLING, 2026-08-17 (founder agreed on the same read).
       *
       * A person does not arrive at Settings knowing whether their question is
       * about the tier they pay for or the credit left on it. They arrive wanting
       * to know what this costs and how much is left, which is ONE errand. Two
       * doors made them guess, and guessing wrong is a wasted click on the surface
       * where friction is least forgivable.
       *
       * The address survives, so `?section=credits` still answers and every saved
       * link lands: it renders the Billing pane, which now carries the balance, the
       * top-up and the debit history under one heading.
       *
       * Same mechanism `sync` uses to fold into Connectors, and for the same
       * reason: two addresses that answer one question should render one pane
       * rather than two that can disagree.
       */
      { id: "credits", label: "Credits", door: false, foldsInto: "billing" },
      /*
       * DIAGNOSTICS KEEPS ITS ADDRESS AND LOSES ITS DOOR, 2026-08-17.
       *
       * It never belonged in Settings. Settings is where a person states what they
       * want; Diagnostics reports whether the machine is achieving it, which is
       * the engine-room doctrine's own dividing line -- complexity lives in the
       * engine, and the user meets the output of the machine rather than the
       * machine. Every other reading of that kind already lives behind that door.
       *
       * The door is drawn from the Engine Room instead. The pane stays here, so
       * `?section=health` and every saved link still answer, and nothing was
       * rebuilt to move a heading.
       */
      { id: "health", label: "Diagnostics", door: false },
    ],
  },
  {
    id: "reach",
    /* "DATA AND ACCESS", 2026-08-17. "Connections and data" was two nouns joined
     * by an "and", which is the shape a group takes when nobody could name the
     * one idea underneath it. The one idea is the BOUNDARY OF YOUR DATA: what
     * comes in, what an outside agent may read, and what we hold. Naming that
     * lets a person decide from the heading whether their errand is in here. */
    label: "Data and access",
    desc: "What flows in, what an agent outside Supaprod may read, and what we keep of yours.",
    sections: [
      {
        id: "connections",
        label: "Connectors",
        keywords: ["connect", "integration", "integrations", "source", "sources", "sync", "binding", "oauth", "slack", "linear", "notion", "github", "calendar", "gmail"],
      },
      // Folded into Connectors, which shows the same bindings. Address only.
      { id: "sync", label: "Sync and bindings", door: false, foldsInto: "connections" },
      { id: "interop", label: "Agent access", keywords: ["mcp", "token", "api", "external agent", "outside"] },
      { id: "data", label: "Your data", keywords: ["export", "download", "delete", "privacy", "gdpr", "retention"] },
      /*
       * ── MODELS MOVED HERE, 2026-08-17 ─────────────────────────────────────
       * Founder: "Models and keys would come in data and access only, right? Why is it
       * under agent? It is not the right thing."
       *
       * Correct, and the group descriptions make it obvious once said out loud. Agents
       * is about WHO works here and how much rope each has. A model is not an agent and
       * a key is not a boundary: they are an outside service this workspace reaches and
       * a credential it reaches with, which is precisely what this group governs -- the
       * same shape as a connector, one rung further in.
       *
       * It also removes a genuine confusion the old placement created: a reader looking
       * for "which model runs my work" was being sent to a group about permissions, and
       * a reader auditing what leaves the workspace never looked in Agents for an API
       * key.
       */
      {
        id: "ai",
        label: "Models and keys",
        keywords: ["model", "models", "api key", "byo", "openai", "anthropic", "provider"],
      },
    ],
  },
  {
    id: "crew",
    /* "AGENTS", NOT "CREW", 2026-08-15. The substrate says agent everywhere —
     * `agents`, `agent_runs`, `agent_tools`, `agent_autonomy`,
     * `agent-vocabulary.ts` — and only the label said crew, which is a costume
     * over the real word and the register split the 2026-08-11 vocabulary
     * ruling retired. The group also became the HOME of the roster on the same
     * day: the Crew row came off the rail and its surface now lives behind
     * Settings, which is why the group carries the product's name for it
     * rather than a house word. Ids are untouched; `?section=agents` already
     * aliased to `staff` and still does. */
    label: "Agents",
    desc: "Who works here, and how much each one may do without you.",
    sections: [
      /*
       * ── WHO WORKS HERE LEADS, 2026-08-17 ──────────────────────────────────
       * Founder: "under the agent, I want this roaster thing to be on top, and
       * whatever name you give, autonomy and approvals could be at the bottom one."
       *
       * Right on the reading order. A person arriving at Agents wants to see the crew
       * before they can have an opinion about anybody's rope, and Autonomy was leading
       * with a governance dial for agents the reader had not met yet.
       *
       * ── AND IT IS NOT CALLED "ROSTER" ANY MORE ────────────────────────────
       * He asked whether "Roster" is right, and whether "Agents" would collide with the
       * group heading. Both concerns are real and they pull opposite ways: "Roster" is
       * a house word nobody types (the vocabulary rules retire exactly this kind), and
       * "Agents" under a group called Agents is a door named after its own neighbourhood.
       *
       * "Who works here" answers it: it is the plainest English for the thing, it is
       * what the pane's own first Block was already called, and it cannot collide with
       * a heading because it is a phrase rather than a category. Nothing types "roster"
       * to find their crew; the keywords carry that word so the search still lands.
       */
      {
        id: "staff",
        label: "Who works here",
        keywords: ["agents", "crew", "roster", "who", "specialist"],
      },
      {
        id: "autonomy",
        label: "Autonomy and approvals",
        keywords: ["approval", "approvals", "permission", "kill switch", "pause", "autopilot", "trust"],
      },
    ],
  },
  {
    id: "brief",
    label: "Company",
    desc: "The standing instruction every mission starts by reading, before it does anything.",
    sections: [
      {
        id: "workspace",
        subs: [
          {
            label: "Invite teammates",
            anchor: "settings-people",
            keywords: ["invite", "invitation", "teammate", "team", "member", "people", "seat"],
          },
        ],
        label: "Brief and voice",
        // People lives on this pane (MembersCard, TeamCard), which is why "invite"
        // and "member" belong here and nowhere else.
        keywords: ["brief", "voice", "tone", "constitution", "people", "members", "member", "invite", "team", "roles"],
      },
      { id: "brand", label: "Brand", keywords: ["design", "design system", "logo", "colour", "color"] },
      { id: "products", label: "Products", keywords: ["product", "repo", "app", "ships"] },
      // Dead pane, live address. See section 4 of the header.
      { id: "memory", label: "Memory", door: false },
    ],
  },
];

/** Every section id, derived from the group model (the single source of truth). */
export const ALL_SECTION_IDS: readonly SectionId[] = SETTINGS_GROUPS.flatMap((g) =>
  g.sections.map((s) => s.id),
);

/**
 * The groups as the NAV draws them: same order, same headings, only the sections
 * that draw a door. A group whose every member is doorless would draw a heading
 * over nothing, so it is dropped rather than rendered empty.
 */
export const NAV_GROUPS: readonly SettingsGroup[] = SETTINGS_GROUPS.map((g) => ({
  ...g,
  sections: g.sections.filter((s) => s.door !== false),
})).filter((g) => g.sections.length > 0);

/**
 * Every door, flattened in nav order. This is the roving-tabindex ring: index 0
 * is what Home reaches and the last entry is what End reaches. End is
 * Diagnostics on purpose - it was the fourteen-stop Tab crawl the founder
 * named, and it is now one keypress from anywhere in the nav.
 */
export const NAV_DOOR_IDS: readonly SectionId[] = NAV_GROUPS.flatMap((g) =>
  g.sections.map((s) => s.id),
);

/**
 * Where a bare `/settings` (no `?section=`) lands.
 *
 * `profile` and NOT `autonomy`, and the reason is worth carrying beside the
 * value rather than only in header §3: a bare `/settings` is an address people
 * ARRIVE at rather than one they ask for, and Autonomy is the governance pane -
 * the safety contract a security reviewer is walked through. Somewhere that
 * consequential is a destination you choose. Autonomy keeps the first slot in
 * the nav, so it is still one Home keypress away.
 */
export const DEFAULT_SECTION: SectionId = "profile";

/**
 * Legacy and shorthand `?section=` values that must keep landing.
 *   brief    -> workspace   (the strategic brief lives in the Brief and voice pane)
 *   calendar -> connections (calendar accounts are a connector)
 *   plan     -> billing     (the account menu's "Plan and billing" item and the
 *                            signup checkout redirect both target this; they
 *                            must land on Plan, never on the default)
 *   agents   -> staff       (the retired Agents group id; saved links still send it)
 *   you      -> profile     (the retired You group id)
 * Plus group-id symmetry for the live groups, so `?section=<GroupId>` always
 * lands inside that group rather than falling back to the default.
 */
export const LEGACY_SECTION_MAP: Readonly<Record<string, SectionId>> = {
  brief: "workspace",
  calendar: "connections",
  plan: "billing",
  agents: "staff",
  you: "profile",
  crew: "autonomy",
  reach: "connections",
};

function isSectionId(raw: string): raw is SectionId {
  return (ALL_SECTION_IDS as readonly string[]).includes(raw);
}

/** Resolve a raw `?section=` value (incl. legacy aliases) to a real section id. */
export function normalizeSection(raw: string | undefined | null): SectionId {
  if (!raw) return DEFAULT_SECTION;
  const mapped = LEGACY_SECTION_MAP[raw];
  if (mapped) return mapped;
  return isSectionId(raw) ? raw : DEFAULT_SECTION;
}

const SECTION_TO_GROUP = Object.fromEntries(
  SETTINGS_GROUPS.flatMap((g) => g.sections.map((s) => [s.id, g.id] as const)),
) as Record<SectionId, GroupId>;

const FOLDS: Readonly<Partial<Record<SectionId, SectionId>>> = Object.fromEntries(
  SETTINGS_GROUPS.flatMap((g) =>
    g.sections.filter((s) => s.foldsInto).map((s) => [s.id, s.foldsInto!] as const),
  ),
);

/**
 * Which PANE a resolved section renders. `sync` renders Connectors; everything
 * else renders itself. Kept here rather than in the route because the fold is
 * part of the address contract, and the route used to carry a second private
 * copy of it that nothing compared against this file.
 */
export function paneForSection(section: SectionId): SectionId {
  return FOLDS[section] ?? section;
}

/** The group a section belongs to. */
export function groupForSection(section: SectionId): GroupId {
  return SECTION_TO_GROUP[section];
}

/** The group definition by id (returns undefined if unknown - never throws). */
export function findGroup(groupId: GroupId): SettingsGroup | undefined {
  return SETTINGS_GROUPS.find((g) => g.id === groupId);
}

/** The landing section for a group (its first member, which always has a door). */
export function primarySection(groupId: GroupId): SectionId {
  return findGroup(groupId)?.sections[0]?.id ?? DEFAULT_SECTION;
}

/** Human label for a section id (falls back to the id if somehow unknown). */
export function sectionLabel(section: SectionId): string {
  for (const g of SETTINGS_GROUPS) {
    const found = g.sections.find((s) => s.id === section);
    if (found) return found.label;
  }
  return section;
}

/**
 * Which door carries `tabIndex={0}` - the nav's single tab stop.
 *
 * THE DEFECT THIS PREVENTS, which the old nav shipped: with a roving tabindex,
 * the naive rule is "the active door gets 0, every other gets -1". Two of the
 * fifteen sections draw NO door (`memory`, and `sync` before it folds), so on
 * `?section=memory` no door matches the active section, every door gets -1, and
 * the entire settings nav drops out of the tab order. A keyboard-only person
 * arriving on that address could not reach ANY other section without a mouse.
 * Nothing caught it because the old nav had no roving tabindex at all - it had
 * fourteen unmanaged tab stops, which is a different bug that happens to hide
 * this one. Falling back to the first door keeps the nav always reachable.
 */
export function navTabStop(active: SectionId): SectionId {
  const pane = paneForSection(active);
  const first = NAV_DOOR_IDS[0] ?? DEFAULT_SECTION;
  return NAV_DOOR_IDS.includes(pane) ? pane : first;
}

/** The arrow/Home/End keys the settings nav answers. */
const NAV_KEYS = ["ArrowDown", "ArrowUp", "Home", "End"] as const;
export type NavKey = (typeof NAV_KEYS)[number];

export function isNavKey(key: string): key is NavKey {
  return (NAV_KEYS as readonly string[]).includes(key);
}

/**
 * Where Up/Down/Home/End move focus from a given door. Pure so the keyboard
 * contract is unit-tested rather than trusted: the nav is a vertical list, so
 * Down/Up wrap around the ring and Home/End jump to the ends.
 *
 * Returns null for a key the nav does not own, so the caller knows not to
 * swallow the event - preventDefault on an unowned key is how a nav quietly
 * breaks page scrolling and browser find.
 */
export function stepDoor(from: SectionId, key: string): SectionId | null {
  if (!isNavKey(key)) return null;
  const ids = NAV_DOOR_IDS;
  if (ids.length === 0) return null;
  const at = ids.indexOf(from);
  const cur = at >= 0 ? at : 0;
  if (key === "Home") return ids[0]!;
  if (key === "End") return ids[ids.length - 1]!;
  const delta = key === "ArrowDown" ? 1 : -1;
  return ids[(cur + delta + ids.length) % ids.length]!;
}

const DOOR_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  NAV_DOOR_IDS.map((id) => [id, sectionLabel(id).toLowerCase()] as const),
);

/**
 * Typeahead: the shortcut INTO any of the fifteen that the surface never had.
 * Type "d" in the nav and focus goes to Diagnostics; type "cr" and it goes to
 * Credits. Repeating one letter cycles through every door starting with it,
 * which is why a single-character buffer starts its search AFTER the current
 * door while a longer buffer starts AT it - a refining buffer must be allowed
 * to keep matching the door you are already on.
 *
 * Returns null when nothing matches, so the caller leaves focus where it is
 * rather than jumping somewhere arbitrary on a typo.
 */
export function doorByTypeahead(buffer: string, from: SectionId): SectionId | null {
  const needle = buffer.trim().toLowerCase();
  if (!needle) return null;
  const ids = NAV_DOOR_IDS;
  if (ids.length === 0) return null;
  const at = ids.indexOf(from);
  const cur = at >= 0 ? at : 0;
  const offset = needle.length === 1 ? 1 : 0;
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[(cur + offset + i) % ids.length]!;
    if (DOOR_LABELS[id]?.startsWith(needle)) return id;
  }
  return null;
}

/** All five groups are primary - this IA keeps no recessed fold. */
export const PRIMARY_GROUPS: readonly SettingsGroup[] = SETTINGS_GROUPS;

/** No group is recessed under the five-group model. */
export const RECESSED_GROUPS: readonly SettingsGroup[] = [];

/**
 * WHICH DOORS A TYPED QUERY SHOULD OFFER, in the order they should be offered.
 *
 * ── WHY THIS IS NOT A `filter` AT THE CALL SITE ─────────────────────────────
 * The rail's first version filtered on `label.includes(query)`, which is a search
 * over twelve headings. The founder tested it in the obvious way and it failed in
 * the obvious way: "credits" found nothing, "invite" found nothing, and both are
 * real things this surface does. Credits is inside Billing since the fold, and
 * inviting somebody is a People block on the Brief and voice pane.
 *
 * A search that only knows door names answers "which door is called this". Nobody
 * asks that. They ask "where is the thing I want", which needs the search to know
 * what is INSIDE each pane -- hence `keywords`.
 *
 * ── THE RANKING, AND WHY IT IS NOT ALPHABETICAL ─────────────────────────────
 * Four tiers, strongest first, because a person typing three letters is usually
 * partway through a word they can already see:
 *
 *   1. label starts with the query      "bil" -> Billing
 *   2. label contains it                "voice" -> Brief and voice
 *   3. a keyword starts with it         "cred" -> Billing
 *   4. a keyword contains it            "invit" -> Brief and voice
 *
 * Nav order breaks every tie, so the answer is stable and a repeated query never
 * reshuffles under the reader.
 *
 * Returns [] for a query that matches nothing, and the CALLER decides what that
 * means. This function will not quietly hand back everything: "no match" and
 * "everything matches" are different facts and a search that conflates them is how
 * a nav silently stops filtering.
 */
export function searchSections(query: string): readonly SectionId[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const tiers: SectionId[][] = [[], [], [], []];

  for (const group of NAV_GROUPS) {
    for (const section of group.sections) {
      const label = section.label.toLowerCase();
      /*
       * SUB-TARGET WORDS COUNT AS THIS PANE'S WORDS, and leaving them out was a real
       * bug: "teammate" and "seat" matched nothing at all, because they live only on
       * the Invite teammates block. Founder: "when I type in invite ... Brief and voice
       * should display Invite teammates."
       *
       * A block's own heading counts too, so the heading a reader is shown is also one
       * they can find by typing it.
       */
      const words = [
        ...(section.keywords ?? []),
        ...(section.subs ?? []).flatMap((t) => [t.label, ...t.keywords]),
      ].map((k) => k.toLowerCase());

      if (label.startsWith(needle)) tiers[0]!.push(section.id);
      else if (label.includes(needle)) tiers[1]!.push(section.id);
      else if (words.some((w) => w.startsWith(needle))) tiers[2]!.push(section.id);
      else if (words.some((w) => w.includes(needle))) tiers[3]!.push(section.id);
    }
  }

  return tiers.flat();
}

/**
 * Why a door matched, for the row that shows it.
 *
 * A result whose LABEL does not contain what was typed looks like a mistake unless
 * the surface says which word caught it: typing "credits" and being offered
 * "Billing" is correct and unexplained. Returns null when the label itself matched,
 * because restating it under itself is noise.
 */
export function matchReason(section: SectionId, query: string): string | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const def = NAV_GROUPS.flatMap((g) => g.sections).find((s) => s.id === section);
  if (!def) return null;
  if (def.label.toLowerCase().includes(needle)) return null;
  return (
    (def.keywords ?? []).find((k) => k.toLowerCase().startsWith(needle)) ??
    (def.keywords ?? []).find((k) => k.toLowerCase().includes(needle)) ??
    null
  );
}

/**
 * The block inside a pane that best answers this query, or null for the pane itself.
 *
 * Startswith beats contains, exactly as the section ranking does, so "inv" lands on
 * Invite teammates rather than on whatever merely mentions it.
 */
export function subTargetFor(section: SectionId, query: string): SettingsSubTarget | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const def = NAV_GROUPS.flatMap((g) => g.sections).find((sec) => sec.id === section);
  const subs = def?.subs ?? [];
  if (subs.length === 0) return null;
  return (
    subs.find((t) => t.label.toLowerCase().startsWith(needle)) ??
    subs.find((t) => t.keywords.some((k) => k.toLowerCase().startsWith(needle))) ??
    subs.find((t) => t.label.toLowerCase().includes(needle)) ??
    subs.find((t) => t.keywords.some((k) => k.toLowerCase().includes(needle))) ??
    null
  );
}

/** Every anchor any sub-target points at, for the reachability test. */
export const ALL_SUB_ANCHORS: readonly string[] = NAV_GROUPS.flatMap((g) =>
  g.sections.flatMap((sec) => (sec.subs ?? []).map((t) => t.anchor)),
);
