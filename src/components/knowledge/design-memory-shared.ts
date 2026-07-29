// Shared design-memory vocabulary — single source for DesignMemoryPanel.
// Mirrors decisions-shared.ts's role (non-component exports so the panel
// component file keeps Vite fast-refresh happy). ageOf is generic enough to
// reuse directly from decisions-shared.ts rather than duplicating it.
import type {
  DesignMemoryCategory,
  DesignMemorySourceKind,
  DesignMemoryStatus,
} from "@/lib/design-memory.functions";
export const CATEGORY_LABEL: Record<DesignMemoryCategory, string> = {
  token: "Token",
  type: "Type",
  spacing: "Spacing",
  principle: "Principle",
  voice: "Voice",
  pattern: "Pattern",
};

export const SOURCE_LABEL: Record<DesignMemorySourceKind, string> = {
  url_import: "URL import",
  pasted: "Pasted",
  default: "Default",
  learned: "Learned",
};

/** The outcome in plain words, and the one class that carries it. Replaces the
 *  retired VerdictTone map: green and red carry outcomes, and a rule nobody has
 *  settled yet is not an outcome, so it stays monochrome. */
export const STATUS_WORD: Record<DesignMemoryStatus, { word: string; tone: string }> = {
  approved: { word: "In force", tone: "sp-pass" },
  rejected: { word: "Dropped", tone: "sp-fail" },
  pending: { word: "Not settled", tone: "" },
};
