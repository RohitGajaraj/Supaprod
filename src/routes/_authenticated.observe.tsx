import { createFileRoute, redirect } from "@tanstack/react-router";

// /observe folded per OBS-10 (IA consolidation): analytics -> Engine Room's
// Spend room, drift -> its Quality room, traces -> the live /traces detail
// surface (Record's own drill target, kept live - see legacy-redirects.ts).
type LegacyTab = "analytics" | "traces" | "drift";
const LEGACY: LegacyTab[] = ["analytics", "traces", "drift"];

export const Route = createFileRoute("/_authenticated/observe")({
  validateSearch: (search: Record<string, unknown>): { tab?: LegacyTab } => {
    const t = search.tab;
    return { tab: LEGACY.includes(t as LegacyTab) ? (t as LegacyTab) : undefined };
  },
  beforeLoad: ({ search }) => {
    if (search.tab === "traces") throw redirect({ to: "/traces" });
    if (search.tab === "drift") {
      throw redirect({ to: "/engine-room", search: { room: "quality", view: "drift" } });
    }
    throw redirect({ to: "/engine-room", search: { room: "spend" } });
  },
});
