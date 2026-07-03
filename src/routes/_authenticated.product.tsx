import { createFileRoute, redirect } from "@tanstack/react-router";

// /product folded per OBS-10 (IA consolidation, final closure). Every tab's
// write action now has an Obsidian home: signals/opportunities/strategy on
// Discover (lane2 + this session), roadmap/specs on Plan (this session),
// releases (Announcements + the changelog + ship history) on Brain's
// Changelog tab (this session), and product portfolio lifecycle (switch/
// archive/restore/export/delete) on Settings' Workspace pane (this session).
// The incoming ?tab= determines the target since the legacy page branched
// six ways on it; a bare /product (no tab) matches the legacy default of
// "signals".
const TAB_TARGET: Record<string, { to: string; search?: Record<string, string> }> = {
  signals: { to: "/discover" },
  opportunities: { to: "/discover" },
  strategy: { to: "/discover" },
  roadmap: { to: "/plan" },
  specs: { to: "/plan" },
  releases: { to: "/knowledge", search: { tab: "changelog" } },
};

export const Route = createFileRoute("/_authenticated/product")({
  beforeLoad: ({ search }) => {
    const tab =
      typeof (search as Record<string, unknown>).tab === "string"
        ? ((search as Record<string, unknown>).tab as string)
        : "signals";
    const target = TAB_TARGET[tab] ?? TAB_TARGET.signals;
    throw redirect(target);
  },
});
