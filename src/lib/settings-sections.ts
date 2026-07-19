/**
 * SETTINGS-SEGREGATE (v11 #13) -> OBS-13 -> front-end reimagining Phase 4 - the
 * pure grouping model for the Settings surface. The reimagining recluster
 * (founder-approved 2026-07-19) presents Settings as **five named groups**
 * (You · Workspace · Agents · Connections & Data · Plan & Usage), promoting
 * Agents to its own group per charter requirement 9. Every original `SectionId`
 * and the `?section=` deep-link contract are preserved unchanged - only the
 * grouping presentation moved, so no renderer moves and no deep link breaks.
 *
 * PURE: no React / db / network. The route imports these to drive the group
 * index (tier 1) and, inside the active group, that group's member sections
 * (tier 2). The invariants (every section in exactly one group, primary-is-
 * first, legacy ids resolve, round-trip group derivation) are unit-verified.
 */

export type SectionId =
  | "connections"
  | "ai"
  | "staff"
  | "autonomy"
  | "workspace"
  | "products"
  | "billing"
  | "credits"
  | "interop"
  | "profile"
  | "health"
  | "data"
  | "notifications"
  | "memory";

export type GroupId = "you" | "workspace" | "agents" | "connections" | "plan";

export type SettingsSection = { id: SectionId; label: string };

export type SettingsGroup = {
  id: GroupId;
  label: string;
  /** One-line description shown under the active pane's index entry. */
  desc: string;
  /** Member sections in display order. The FIRST is the pane's landing section. */
  sections: SettingsSection[];
};

// FRONT-END REIMAGINING Phase 4 (founder-approved recluster, 2026-07-19): the
// four OBS-13 panes (You / Workspace / Connections / Billing) become the FIVE
// approved groups (You / Workspace / Agents / Connections & Data / Plan & Usage),
// with Agents promoted to its own group (charter requirement 9: a deliberate
// agent home). This is a pure REGROUPING - every `SectionId` and the `?section=`
// deep-link contract are unchanged, so no renderer moves and no link breaks;
// only which group each section sits under changed. Source: the reclustering
// spec (research/ia-reclustering.md §2). The larger relocations it also
// proposes (a Brand feed item, moving Memory to Brain, folding /sync in, and a
// dedicated Autonomy & approvals panel) are the follow-on; those touch working
// cross-surface components or new backend and are tracked separately.
export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  {
    id: "you",
    label: "You",
    desc: "Your profile, look, and alerts.",
    sections: [
      { id: "profile", label: "Profile" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    desc: "What you are building, your brand, and your team.",
    sections: [
      { id: "workspace", label: "Brief & voice" },
      { id: "products", label: "Products" },
      { id: "memory", label: "Memory" },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    desc: "Your AI staff: what they may do, on whose approval, and which models.",
    sections: [
      { id: "staff", label: "Roster" },
      { id: "autonomy", label: "Autonomy & approvals" },
      { id: "ai", label: "Models & keys" },
    ],
  },
  {
    id: "connections",
    label: "Connections & Data",
    desc: "What flows in, what external agents can read, and what we store.",
    sections: [
      { id: "connections", label: "Sources" },
      { id: "interop", label: "Agent access" },
      { id: "data", label: "Your data" },
    ],
  },
  {
    id: "plan",
    label: "Plan & Usage",
    desc: "Your plan, credits, and whether the agents are healthy.",
    sections: [
      { id: "billing", label: "Plan" },
      { id: "credits", label: "Credits" },
      { id: "health", label: "Diagnostics" },
    ],
  },
];

/** Every section id, derived from the group model (the single source of truth). */
export const ALL_SECTION_IDS: readonly SectionId[] = SETTINGS_GROUPS.flatMap((g) =>
  g.sections.map((s) => s.id),
);

/** Where a bare `/settings` (no `?section=`) lands. */
export const DEFAULT_SECTION: SectionId = "profile";

/**
 * Legacy deep links still arrive with old `?section=` values; keep them landing.
 *   brief    -> workspace   (the strategic brief lives in the Workspace pane)
 *   calendar -> connections (calendar accounts live under Yours)
 *   plan     -> billing     (the user-chip "Plan & billing" entry and the
 *                            signup checkout redirect target the PANE id;
 *                            they must land on the Plan pane, never Profile)
 *   you      -> profile     (pane-id symmetry: every GroupId resolves)
 */
export const LEGACY_SECTION_MAP: Readonly<Record<string, SectionId>> = {
  brief: "workspace",
  calendar: "connections",
  plan: "billing",
  you: "profile",
  // Group-id symmetry: the Agents group id resolves to its landing section, so
  // `?section=agents` (and the SettingsIndex round-trip) lands inside Agents.
  agents: "staff",
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

/** The pane a section belongs to. */
export function groupForSection(section: SectionId): GroupId {
  return SECTION_TO_GROUP[section];
}

/** The pane definition by id (returns undefined if unknown - never throws). */
export function findGroup(groupId: GroupId): SettingsGroup | undefined {
  return SETTINGS_GROUPS.find((g) => g.id === groupId);
}

/** The landing section for a pane (its first member). */
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

/** All five groups are primary - the reimagining keeps no recessed fold. */
export const PRIMARY_GROUPS: readonly SettingsGroup[] = SETTINGS_GROUPS;

/** No group is recessed under the five-group model. */
export const RECESSED_GROUPS: readonly SettingsGroup[] = [];
