// OBS-06: the evidence desk. Additive: the legacy `/product` route (capture,
// bulk import, cluster, promote, draft-spec, lineage, delete) stays live and
// byte-untouched until OBS-10 relocates those actions and folds the routes.
import { createFileRoute } from "@tanstack/react-router";
import { MonoLabel } from "@/components/obsidian";
import { DiscoverSurface } from "@/components/discover/DiscoverSurface";

export const Route = createFileRoute("/_authenticated/discover")({
  component: DiscoverSurface,
  head: () => ({ meta: [{ title: "Discover · Cadence" }] }),
  errorComponent: () => (
    <div style={{ padding: "64px 32px", textAlign: "center" }}>
      <MonoLabel tone="madder" style={{ fontSize: "9px" }}>
        Could not load Discover
      </MonoLabel>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>
        Reload the page. Nothing here is lost.
      </p>
    </div>
  ),
});
