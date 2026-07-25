// Shared design-memory vocabulary — single source for DesignMemoryPanel.
// Mirrors decisions-shared.ts's role (non-component exports so the panel
// component file keeps Vite fast-refresh happy). ageOf is generic enough to
// reuse directly from decisions-shared.ts rather than duplicating it.
import type {
  DesignMemoryCategory,
  DesignMemorySourceKind,
  DesignMemoryStatus,
} from "@/lib/design-memory.functions";
import type { VerdictTone } from "@/components/obsidian/verdict";

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

export const STATUS_TONE: Record<DesignMemoryStatus, VerdictTone> = {
  approved: "KEPT",
  rejected: "KILL",
  pending: "PENDING",
};
