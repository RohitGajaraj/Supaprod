import { createFileRoute, redirect } from "@tanstack/react-router";

// /governance absorbed into /govern per F-IA-V4 Phase 1b; LOOM W2 folded
// /govern into the Engine Room's four rooms, so the old tabs land on their
// room views directly (one hop, no double redirect).
type LegacyTab = "controls" | "approvals" | "guardrails" | "budgets";
const LEGACY: LegacyTab[] = ["controls", "approvals", "guardrails", "budgets"];

const TARGET: Record<LegacyTab, { room: "spend" | "safety" | "record"; view: string }> = {
  controls: { room: "safety", view: "controls" },
  approvals: { room: "record", view: "approvals" },
  guardrails: { room: "safety", view: "rules" },
  budgets: { room: "spend", view: "caps" },
};

export const Route = createFileRoute("/_authenticated/governance")({
  validateSearch: (search: Record<string, unknown>): { tab?: LegacyTab } => {
    const t = search.tab;
    return { tab: LEGACY.includes(t as LegacyTab) ? (t as LegacyTab) : undefined };
  },
  beforeLoad: ({ search }) => {
    const target = TARGET[search.tab ?? "controls"];
    throw redirect({ to: "/engine-room", search: target });
  },
});
