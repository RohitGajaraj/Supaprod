// Decide (2026-07-07): the ranked opportunity queue moved out of the cramped
// three-column Discover into its own destination, the decide stage of the loop
// between Discover (sense) and Plan (define).
import { createFileRoute } from "@tanstack/react-router";
import { MonoLabel } from "@/components/obsidian";
import { DecideSurface } from "@/components/discover/DecideSurface";

export const Route = createFileRoute("/_authenticated/decide")({
  component: DecideSurface,
  head: () => ({ meta: [{ title: "Decide · Cadence" }] }),
  errorComponent: () => (
    <div style={{ padding: "64px 32px", textAlign: "center" }}>
      <MonoLabel tone="madder" style={{ fontSize: "10.5px" }}>
        Could not load Decide
      </MonoLabel>
      <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
        Reload the page. Nothing here is lost.
      </p>
    </div>
  ),
});
