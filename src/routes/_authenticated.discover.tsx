// OBS-06: the evidence desk. IA spine 2026-07-11: Decide is absorbed as the
// queue tab of Discover (/discover?tab=queue); the /decide route 301-redirects
// here, so the promote hand-off token (?tab=queue) keeps working everywhere.
import { createFileRoute } from "@tanstack/react-router";
import { MonoLabel } from "@/components/obsidian";
import { DiscoverSurface } from "@/components/discover/DiscoverSurface";

export type DiscoverTab = "signals" | "queue";

export const Route = createFileRoute("/_authenticated/discover")({
  // Loom W2 (audit D-24): the legacy redirects and the command palette all
  // pass ?tab=; validate it here and let the surface select the named tab.
  // The retired "opportunities" value maps to the queue tab so every old
  // deep link keeps landing; anything else is dropped so a mangled link
  // degrades to the plain surface, never a crash.
  validateSearch: (search: Record<string, unknown>): { tab?: DiscoverTab } => ({
    tab:
      search.tab === "queue" || search.tab === "opportunities"
        ? "queue"
        : search.tab === "signals"
          ? "signals"
          : undefined,
  }),
  component: DiscoverSurface,
  head: () => ({ meta: [{ title: "Discover · Cadence" }] }),
  errorComponent: () => (
    <div style={{ padding: "64px 32px", textAlign: "center" }}>
      <MonoLabel tone="madder" style={{ fontSize: "10.5px" }}>
        Could not load Discover
      </MonoLabel>
      <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
        Reload the page. Nothing here is lost.
      </p>
    </div>
  ),
});
