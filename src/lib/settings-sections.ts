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
 * 1. SEVEN GROUPS, NOT FOUR (P-23, A1 ruling 2026-09-02 22:25)
 * ------------------------------------------------------------------------
 *
 * A1 read Lovable's own settings signed in (2026-08-05 19:35): one searchable
 * page, groups named for the boundary they set, the ones that change what the
 * AI does drawn as a switch with a sentence rather than a page of their own.
 * `searchSections` and the four-group model already answered "one search box"
 * - what did not exist was a group called **Autonomy**, so the mandate P-17
 * built (the ceiling, the kill switch, the tool-mode list) sat one level down
 * inside "Agents" rather than being the thing this surface leads with.
 *
 * The seven, in the order they render:
 *
 *   You            profile - notifications - health (reports, draws no door)
 *   Autonomy       staff - autonomy - what they may do without asking
 *   Brief          the one editor for what every mission reads before it starts
 *   Connections    connections - ai - interop - everything outside this workspace
 *   Workspace      workspace - brand - products - memory (dead, no door)
 *   Usage          billing - credits - what this costs and what is left
 *   Security       data - what leaves, and the trail of what happened
 *
 * BRIEF IS ITS OWN GROUP NOW, split out of `workspace`'s combined pane. It used
 * to sit beside people/invites/name under "About your company" because both
 * were "things about the company" - the data model's shape, not a person's. The
 * two are different errands: one changes what an agent starts every mission by
 * reading, the other changes who is in the workspace and what it is called. A
 * person asking "why does the crew keep writing the wrong thing" was one click
 * from a headline that also covers seats and slugs.
 *
 * `ai` MOVED FROM AGENTS TO CONNECTIONS, and this is A1's own reasoning kept
 * beside the code that encodes it: "a provider key is a connection to what the
 * agents run on - one group for everything external." `interop` (outside
 * agents reading this workspace) sits beside it for the identical reason, so
 * Connections now answers one question - "what does this workspace reach, and
 * what reaches in" - for every direction at once.
 *
 * WHAT HAS NO ROW HERE, AND WHY. P-23's own acceptance forbids building behind
 * a row with no existing writer. Five rows the packet named have none today and
 * are not built: the promotion bar (waits on P-20), repo binding, MCP
 * connections with their `last_error`, preview deploys (waits on P-22), and a
 * domains pane (no such concept exists anywhere in this codebase). Excluded,
 * not guessed at - see the Report for P-23 in A-QUEUE.md for the full audit.
 *
 * ------------------------------------------------------------------------
 * 2. WHAT LEADS, AND WHY IT IS NOT AUTONOMY
 * ------------------------------------------------------------------------
 *
 * DEFAULT_SECTION is `profile`, unchanged by the regroup. A person lands on
 * `/settings` from the account menu, from `g s`, from a legacy redirect off
 * `/notifications`, and from a palette entry that says only "Settings" - none
 * of those is a request to be shown the governance surface, and a surface that
 * consequential should be somewhere you went on purpose. Autonomy loses
 * nothing: it is the second group, `?section=autonomy` still lands, and
 * `?section=crew` still lands there too.
 *
 * ------------------------------------------------------------------------
 * 3. THE ROUTING CONTRACT, UNCHANGED
 * ------------------------------------------------------------------------
 *
 * Every `SectionId` from before the regroup survives (plus the new `brief`),
 * every `?section=` value still resolves, and every legacy alias still lands.
 * Regrouping moves which HEADING a door sits under and nothing else.
 * `?section=plan` still lands on Billing, `?section=agents` still lands on the
 * Roster - and `?section=brief` now lands on the real Brief pane instead of
 * folding into Workspace, which is the alias becoming MORE correct rather than
 * breaking: a saved link that meant "take me to the brief" now does exactly
 * that instead of landing beside it.
 */

export type SectionId =
  | "connections"
  | "ai"
  | "staff"
  | "autonomy"
  | "brief"
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
  | "hosting"
  | "notifications"
  | "memory";

/**
 * SEVEN GROUPS SINCE 2026-09-02 (P-23), up from four. `plan` was retired as a
 * GROUP before that and its sections moved under `you`, which is where every
 * shipped settings surface this file already cites puts money: GitBook,
 * ClickUp and Toggl all keep billing beside the account rather than in a
 * neighbourhood of its own. That id survives in `LEGACY_SECTION_MAP` so
 * `?section=plan` still lands on Billing.
 *
 * The ids below are new strings, not a rename of the retired four - `you`
 * is the one survivor because its meaning did not move (profile,
 * notifications, and Diagnostics reporting rather than setting). `crew` and
 * `reach`, the two retired GROUP ids, still resolve as `?section=` aliases in
 * `LEGACY_SECTION_MAP` below; they are gone as group ids because "Agents" and
 * "Data and access" no longer name real groups.
 */
export type GroupId =
  "you" | "autonomy" | "brief" | "connections" | "workspace" | "usage" | "security";

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
 * Eight shipped settings surfaces were checked when this rule was set and the
 * convention is unanimous: GitBook uses Account and Organization; ClickUp uses
 * Workspace and the person's name; Toggl uses Toggl Account and Availability;
 * Lindy, Squarespace, Runway and Hume all use bare nouns. Not one uses a
 * sentence, a question or a verb phrase - a sidebar is scanned for a noun, not
 * read for a sentence. Each group's longer sentence lives in `desc`, which is
 * the slot that can afford one.
 *
 * ONE THING GETS ONE WORD, everywhere: a door and its own group heading never
 * repeat the same word (the roster door reads "Who works here" rather than
 * "Agents", because it sits inside the Autonomy group now and "Agents" would
 * be a heading naming its own neighbourhood).
 */
export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  /*
   * ── WHY ACCOUNT LEADS, 2026-08-17 (STILL TRUE UNDER SEVEN GROUPS) ─────────
   * Founder, on the shipped rail: "don't you feel the profile section, which is
   * at the bottom today, should be at the top? Sequentially, what our user uses
   * should be there." `DEFAULT_SECTION` has been `profile` since 2026-08-10, so
   * a bare /settings, the account menu, `g s` and the /notifications redirect
   * ALL land here - the group that owns the landing section has to lead, or the
   * surface opens at the bottom of its own index.
   *
   * ── THE REST OF THE ORDER, BY HOW OFTEN A PERSON COMES FOR IT ─────────────
   * Autonomy leads the rest (P-23, A3): it is the pane a security reviewer is
   * walked through and the one this session's own founder conversations have
   * returned to most. Brief sits beside it - what they may do, then what they
   * read before doing it. Connections is "the group that grows: every new
   * source, every new scope comes back here" (2026-08-17's own words, still
   * true). Workspace and Usage are the least frequent, consequential errands;
   * Security last, for the same reason Company was last under four groups:
   * written once and rarely reopened.
   */
  {
    id: "you",
    label: "You",
    desc: "Your name, your theme, and what may interrupt you.",
    sections: [
      {
        id: "profile",
        subs: [
          {
            label: "Working hours",
            anchor: "settings-hours",
            keywords: ["hours", "working hours", "schedule", "timezone", "time zone", "quiet"],
          },
          {
            label: "Appearance",
            anchor: "settings-appearance",
            keywords: ["appearance", "theme", "dark", "light", "avatar", "mark", "picture"],
          },
        ],
        label: "Profile",
        keywords: [
          "name",
          "avatar",
          "picture",
          "identity",
          "theme",
          "dark",
          "light",
          "density",
          "appearance",
          "timezone",
          "working hours",
          "quiet hours",
        ],
      },
      {
        id: "notifications",
        label: "Notifications",
        keywords: ["email", "digest", "alert", "interrupt", "quiet"],
      },
    ],
  },
  {
    id: "autonomy",
    label: "Autonomy",
    desc: "Who works here, and what they may do without you.",
    sections: [
      /*
       * WHO WORKS HERE LEADS (2026-08-17, unchanged by the regroup): a person
       * arriving here wants to see the crew before they can have an opinion
       * about anybody's rope.
       */
      {
        id: "staff",
        label: "Who works here",
        keywords: ["agents", "crew", "roster", "who", "specialist"],
      },
      {
        id: "autonomy",
        label: "What they may do without asking",
        keywords: [
          "approval",
          "approvals",
          "approve",
          "permission",
          "kill switch",
          "pause",
          "stop",
          "halt",
          "autopilot",
          "trust",
          // The spend ceiling lives on this pane (setWorkspaceSpendPolicy).
          "spend",
          "budget",
          "cap",
          "ceiling",
          "limit",
          // Per-tool modes (updateToolMode).
          "tool",
          "tools",
          // Auto-pipelines: what routes an event to an agent unasked.
          "automation",
          "automatic",
          // This file's own header calls this "the pane a security reviewer is
          // shown", and its contents are the safety contract for unattended work.
          "security",
          "safety",
        ],
      },
    ],
  },
  /*
   * SPLIT OUT OF `workspace` (P-23, 2026-09-02). It used to sit under "About
   * your company" beside people and invites because both are "things about the
   * company" - the data model's shape, not a person's. What an agent reads
   * before every mission and who is in the workspace are different errands;
   * see the file header §1 for the full argument.
   */
  {
    id: "brief",
    label: "Brief",
    desc: "The standing instruction every mission starts by reading, before it does anything.",
    sections: [
      /*
       * "BRIEF AND VOICE" REVIVED, NOT INVENTED. It was this pane's name until
       * 2026-08-27 folded it into "About your company"; splitting it back out
       * restores the name along with the content. Kept two words rather than
       * the bare "Brief" so the door reads as a phrase distinct from its own
       * group heading, the same rule "Who works here" already follows for
       * Autonomy - and it happens to keep "co" unambiguous with "Connected
       * tools" too, which "Company brief" would not have.
       */
      {
        id: "brief",
        label: "Brief and voice",
        keywords: ["brief", "voice", "tone", "constitution"],
      },
    ],
  },
  /*
   * "CONNECTIONS", NOT "DATA AND ACCESS" (P-23). The one idea underneath both
   * names has always been the boundary of what this workspace reaches, in
   * either direction; A1's ruling folded `ai` in for the identical reason data
   * and access already existed for: "a provider key is a connection to what
   * the agents run on - one group for everything external."
   */
  {
    id: "connections",
    label: "Connections",
    desc: "What this workspace reaches outside itself, and what reaches in.",
    sections: [
      {
        id: "connections",
        label: "Connected tools",
        keywords: [
          "connect",
          "connector",
          "integration",
          "integrations",
          "source",
          "sources",
          "sync",
          "binding",
          "oauth",
          "slack",
          "linear",
          "notion",
          "github",
          "calendar",
          "gmail",
        ],
      },
      // Folded into Connectors, which shows the same bindings. Address only.
      { id: "sync", label: "Sync and bindings", door: false, foldsInto: "connections" },
      {
        id: "ai",
        label: "Models",
        subs: [
          {
            label: "Your own provider keys",
            anchor: "settings-byo-keys",
            keywords: ["api key", "key", "keys", "byo", "openai", "anthropic", "provider", "token"],
          },
        ],
        keywords: ["model", "models", "api key", "byo", "openai", "anthropic", "provider"],
      },
      {
        id: "interop",
        label: "Outside access",
        keywords: [
          "mcp",
          "token",
          "api",
          "external agent",
          "outside",
          // The pane's own token-name field reads "e.g. claude-desktop, cursor,
          // my-agent", so these are words it already puts in front of a reader.
          "cursor",
          "claude desktop",
          "ide",
        ],
      },
      {
        /*
         * P-118b. Hosting lives with Connections because a preview app is a
         * thing this workspace put OUTSIDE itself -- the group's own line -- and
         * because the account it fills is the founder's rather than the
         * product's. It filled up silently once and the wall arrived as an
         * unrelated deploy failure, so it needs somewhere to be looked at.
         */
        id: "hosting",
        label: "Hosting",
        /*
         * A word may point at one door only, which the routing guard enforces
         * as a forcing function on naming. Three of the obvious ones are
         * already spoken for and rightly: "limit" is Autonomy's spend ceiling,
         * "delete" is Your data's, and "app" is what Products calls the thing
         * a customer ships. What is left is what actually distinguishes this
         * door -- the host, the artefact, and the act.
         */
        keywords: ["deploy", "deno", "preview", "slot", "reclaim"],
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    desc: "Your company: who is in it, what it looks like, and what it ships.",
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
        label: "About your company",
        // People lives on this pane (MembersCard, TeamCard); the brief moved
        // out to its own group (P-23), so "brief"/"voice" no longer belong here.
        keywords: ["people", "members", "member", "invite", "team", "roles"],
      },
      {
        id: "brand",
        label: "Brand",
        keywords: ["design", "design system", "logo", "colour", "color"],
      },
      { id: "products", label: "Products", keywords: ["product", "repo", "app", "ships"] },
      // Dead pane, live address. See the header, §1.
      {
        id: "memory",
        label: "Memory",
        door: false,
        keywords: ["memory", "remember", "recall", "forget", "what it knows"],
      },
    ],
  },
  {
    id: "usage",
    label: "Usage",
    desc: "What this workspace costs, what is left, and whether it is working.",
    sections: [
      {
        id: "billing",
        subs: [
          {
            label: "Credits and top-ups",
            anchor: "settings-credits",
            keywords: ["credit", "credits", "top-up", "topup", "balance", "buy", "refill"],
          },
        ],
        label: "Billing",
        keywords: [
          "plan",
          "tier",
          "upgrade",
          "downgrade",
          "cancel",
          "invoice",
          "payment",
          "card",
          "subscription",
          "credits",
          "credit",
          "balance",
          "top-up",
          "topup",
          "buy",
          "redeem",
        ],
      },
      // Folds into Billing (2026-08-17): one money errand, not two doors.
      { id: "credits", label: "Credits", door: false, foldsInto: "billing" },
      /*
       * DIAGNOSTICS KEEPS ITS ADDRESS AND LOSES ITS DOOR (2026-08-17, moved
       * from `you` to `usage` under P-23: its own copy is "any run that went
       * away with your credits", which is a cost fact, not a personal one).
       * Its door is drawn from the Engine Room instead.
       */
      {
        id: "health",
        label: "Diagnostics",
        door: false,
        keywords: ["health", "diagnostics", "status", "broken", "down", "outage", "failing"],
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    desc: "What leaves this workspace, and the trail of what happened.",
    sections: [
      {
        id: "data",
        label: "Your data",
        keywords: ["export", "download", "delete", "privacy", "gdpr", "retention"],
      },
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
 * is what Home reaches and the last entry is what End reaches - Security's one
 * door, `data`, under seven groups; it was `products` under four. Diagnostics
 * (`health`) can never be either end: it draws no door at all, so it is
 * unreachable by Home/End and only found by search or by typing its address.
 */
export const NAV_DOOR_IDS: readonly SectionId[] = NAV_GROUPS.flatMap((g) =>
  g.sections.map((s) => s.id),
);

/**
 * Where a bare `/settings` (no `?section=`) lands.
 *
 * `profile` and NOT `autonomy`, and the reason is worth carrying beside the
 * value rather than only in header §2: a bare `/settings` is an address people
 * ARRIVE at rather than one they ask for, and Autonomy is the governance pane -
 * the safety contract a security reviewer is walked through. Somewhere that
 * consequential is a destination you choose. Autonomy keeps the second slot in
 * the nav (the first door of the second group), so it is one Down-arrow past
 * Home rather than buried.
 */
export const DEFAULT_SECTION: SectionId = "profile";

/**
 * Legacy and shorthand `?section=` values that must keep landing.
 *   calendar -> connections (calendar accounts are a connector)
 *   plan     -> billing     (the account menu's "Plan and billing" item and the
 *                            signup checkout redirect both target this; they
 *                            must land on Plan, never on the default)
 *   agents   -> staff       (the retired Agents group id; saved links still send it)
 *   you      -> profile     (the retired You group id from BEFORE it was reused
 *                            as a real group id, 2026-08-05 - the two never
 *                            collide, this key is only ever read as a section)
 *   crew     -> autonomy    (the retired Agents group id)
 *   reach    -> connections (the retired Data and access group id)
 * `brief`, `autonomy`, `connections` and `workspace` are deliberately NOT
 * mapped here (P-23): each is now BOTH a live `GroupId` and a real
 * `SectionId` sharing the same string, so `?section=<that group>` resolves
 * straight through `isSectionId` without needing an alias - `brief` in
 * particular used to fold into `workspace`, and now landing on the real Brief
 * pane instead is the alias becoming more correct rather than breaking (see
 * the file header, §3).
 *
 * `usage` and `security` DO need an entry: neither is also a section id (no
 * pane is called exactly that), so without one `?section=usage` would fall
 * through to `DEFAULT_SECTION` and land in the wrong group entirely - the
 * group-id symmetry every other live group gets for free.
 */
export const LEGACY_SECTION_MAP: Readonly<Record<string, SectionId>> = {
  calendar: "connections",
  plan: "billing",
  agents: "staff",
  you: "profile",
  crew: "autonomy",
  reach: "connections",
  usage: "billing",
  security: "data",
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

  /*
   * SEARCHES EVERY ADDRESS, NOT EVERY DOOR, and reading NAV_GROUPS here was a
   * real defect rather than a nicety.
   *
   * NAV_GROUPS is the DRAWING list: it filters out `door: false`. Searching it
   * meant a section with no door could never be found by search -- and search
   * is the only route such a section has, because no door is drawn for it. Two
   * panes were reachable by typing the URL and by nothing else: Diagnostics,
   * which renders two real server reads, and Memory.
   *
   * That is the same shape as the bug this file's own header describes, where
   * the Diagnostics door was taken out of the rail on the belief that something
   * else drew it and nothing did. The whole point of `door: false` is "the
   * ADDRESS still answers", so the thing that finds addresses must read the
   * full list.
   */
  for (const group of SETTINGS_GROUPS) {
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

      /*
       * A RESULT NAMES THE PANE YOU WILL ACTUALLY SEE. `credits` folds into
       * Billing and renders Billing's pane, so returning `credits` would offer
       * a row whose heading is not the heading the reader arrives at. Folding
       * here rather than at the call site keeps that true for every consumer.
       */
      const landing = section.foldsInto ?? section.id;

      if (label.startsWith(needle)) tiers[0]!.push(landing);
      else if (label.includes(needle)) tiers[1]!.push(landing);
      else if (words.some((w) => w.startsWith(needle))) tiers[2]!.push(landing);
      else if (words.some((w) => w.includes(needle))) tiers[3]!.push(landing);
    }
  }

  // Two sections can now fold onto one pane, so the same door must not be
  // offered twice. Order is preserved, so the strongest tier still wins.
  return [...new Set(tiers.flat())];
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
  // Definition lookup, so it must see door-less sections too (see searchSections).
  const def = SETTINGS_GROUPS.flatMap((g) => g.sections).find((s) => s.id === section);
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
  // Definition lookup, so it must see door-less sections too (see searchSections).
  const def = SETTINGS_GROUPS.flatMap((g) => g.sections).find((sec) => sec.id === section);
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
