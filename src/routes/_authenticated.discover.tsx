// OBS-06: the evidence desk. Additive: the legacy `/product` route (capture,
// bulk import, cluster, promote, draft-spec, lineage, delete) stays live and
// byte-untouched until OBS-10 relocates those actions and folds the routes.
import { createFileRoute } from "@tanstack/react-router";
import { MonoLabel } from "@/components/obsidian";
import { DiscoverSurface } from "@/components/discover/DiscoverSurface";

export type DiscoverTab = "signals" | "opportunities";

export const Route = createFileRoute("/_authenticated/discover")({
  // Loom W2 (audit D-24): the /discovery and /opportunities redirects and the
  // command palette all pass ?tab=; validate it here and let the surface
  // apply it (scroll + focus the named column). Anything else is dropped so a
  // mangled deep link degrades to the plain surface, never a crash.
  validateSearch: (search: Record<string, unknown>): { tab?: DiscoverTab } => ({
    tab: search.tab === "signals" || search.tab === "opportunities" ? search.tab : undefined,
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
