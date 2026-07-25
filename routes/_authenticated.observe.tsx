import { createFileRoute, redirect } from "@tanstack/react-router";

// /observe folded per OBS-10 (IA consolidation): analytics -> the Spend
// room's USAGE view, drift -> the Quality room, traces -> the Record room.
// LOOM W2: a bare /observe lands on the glance (the audit flagged the old
// Spend-room landing as semantically odd).
type LegacyTab = "analytics" | "traces" | "drift";
const LEGACY: LegacyTab[] = ["analytics", "traces", "drift"];

export const Route = createFileRoute("/_authenticated/observe")({
  validateSearch: (search: Record<string, unknown>): { tab?: LegacyTab } => {
    const t = search.tab;
    return { tab: LEGACY.includes(t as LegacyTab) ? (t as LegacyTab) : undefined };
  },
  beforeLoad: ({ search }) => {
    if (search.tab === "traces") {
      throw redirect({ to: "/engine-room", search: { room: "record", view: "traces" } });
    }
    if (search.tab === "drift") {
      throw redirect({ to: "/engine-room", search: { room: "quality", view: "drift" } });
    }
    if (search.tab === "analytics") {
      throw redirect({ to: "/engine-room", search: { room: "spend", view: "usage" } });
    }
    throw redirect({ to: "/engine-room" });
  },
});
