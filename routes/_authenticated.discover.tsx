// OBS-06: the evidence desk. IA spine 2026-07-11: Decide is absorbed as the
// queue tab of Discover (/discover?tab=queue); the /decide route 301-redirects
// here, so the promote hand-off token (?tab=queue) keeps working everywhere.
import { createFileRoute } from "@tanstack/react-router";
import { MonoLabel } from "@/components/obsidian";
import { TopBar } from "@/components/supaprod/TopBar";
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
  head: () => ({ meta: [{ title: "Discover · Supaprod" }] }),
  errorComponent: () => (
    <>
      <TopBar crumbs={["Workspace", "Discover"]} />
      <div
        style={{
          maxWidth: "var(--container-standard)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--page-inset-v) var(--page-inset-h) 64px",
        }}
      >
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--top-light)",
            padding: "16px 16px",
            maxWidth: 560,
          }}
        >
          <MonoLabel style={{ marginBottom: 8, display: "block" }}>
            Discover · failed to load
          </MonoLabel>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, margin: 0 }}>
            Reload the page. Nothing here is lost.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={{
              marginTop: 12,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-subtle)",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Reload the page
          </button>
        </div>
      </div>
    </>
  ),
});
