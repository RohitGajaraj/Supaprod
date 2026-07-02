/**
 * SETTINGS-SEGREGATE (v11 #13) -> OBS-13 - the pure grouping model for the
 * Settings surface. OBS-13 collapses the prior 5 groups + one recessed
 * Advanced group into exactly **four panes** (You · Workspace · Connections ·
 * Plan) per the Obsidian IA law (contract §8: Settings is a quiet list, no
 * recessed fold). Every original `SectionId` and the `?section=` deep-link
 * contract are preserved unchanged - only the grouping presentation moved.
 *
 * PURE: no React / db / network. The route imports these to drive the pane
 * index (tier 1) and, inside the active pane, that pane's member sections
 * (tier 2). The invariants (every section in exactly one pane, primary-is-
 * first, legacy ids resolve, round-trip pane derivation) are unit-verified.
 */

export type SectionId =
  | "connections"
  | "ai"
  | "staff"
  | "workspace"
  | "billing"
  | "credits"
  | "interop"
  | "profile"
  | "health"
  | "data"
  | "notifications";

export type GroupId = "you" | "workspace" | "connections" | "plan";

export type SettingsSection = { id: SectionId; label: string };

export type SettingsGroup = {
  id: GroupId;
  label: string;
  /** One-line description shown under the active pane's index entry. */
  desc: string;
  /** Member sections in display order. The FIRST is the pane's landing section. */
  sections: SettingsSection[];
};

export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  {
    id: "you",
    label: "You",
    desc: "Your profile, notifications, data, and diagnostics.",
    sections: [
      { id: "profile", label: "Profile" },
      { id: "notifications", label: "Notifications" },
      { id: "data", label: "Data" },
      { id: "health", label: "Health" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    desc: "The workspace brief, voice, staff, and AI keys.",
    sections: [
      { id: "workspace", label: "Brief & voice" },
      { id: "staff", label: "Staff" },
      { id: "ai", label: "AI & keys" },
    ],
  },
  {
    id: "connections",
    label: "Connections",
    desc: "Connect your accounts and this workspace's sources, in one place.",
    sections: [
      { id: "connections", label: "Yours" },
      { id: "interop", label: "This workspace's" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    desc: "Your plan and credits.",
    sections: [
      { id: "billing", label: "Plan" },
      { id: "credits", label: "Credits" },
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
 */
export const LEGACY_SECTION_MAP: Readonly<Record<string, SectionId>> = {
  brief: "workspace",
  calendar: "connections",
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

/** All four panes are primary - OBS-13 drops the recessed Advanced fold. */
export const PRIMARY_GROUPS: readonly SettingsGroup[] = SETTINGS_GROUPS;

/** No pane is recessed under the four-pane law. */
export const RECESSED_GROUPS: readonly SettingsGroup[] = [];
