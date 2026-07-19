// Decide (02) — the judgment gate of THE SUPAPROD LOOP, promoted to a
// first-class stage (founder ruling, Option B, 2026-07-13). This is the
// product's whole thesis made visible: everything else runs autonomously; the
// human appears here, to keep or kill each ranked bet. The ranked queue
// (OpportunityQueue) previously lived only as a tab on Discover; it now has a
// named home so the lifecycle spine states the differentiator outright.
import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/supaprod/TopBar";
import { PageHeader } from "@/components/supaprod/PageHeader";
import { MonoLabel } from "@/components/obsidian/primitives";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";

const OpportunityQueue = lazy(() =>
  import("@/components/discover/OpportunityQueue").then((m) => ({ default: m.OpportunityQueue })),
);

function DecideSurface() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Decide"]} />
      <div
        style={{
          maxWidth: "var(--container-standard)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--page-inset-v) var(--page-inset-h) 64px",
          animation: "cadRise 260ms var(--ease) both",
        }}
      >
        <PageHeader
          title="Keep it, or"
          accent="kill it."
          subtitle="Every ranked bet Supaprod surfaced, waiting on the one thing it will never do for you: the call. Approve to move it into Plan, send it back, or drop it."
          usp="You make the judgment calls; Supaprod runs everything else. This is the gate that is yours alone."
        />
        <div style={{ marginBottom: 18 }}>
          <AgentRelay variant="station" station="decide" workspaceId={activeWorkspaceId} />
        </div>
        <Suspense
          fallback={
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading the queue…</div>
          }
        >
          <OpportunityQueue />
        </Suspense>
      </div>
    </>
  );
}

export const Route = createFileRoute("/_authenticated/decide")({
  component: DecideSurface,
  head: () => ({ meta: [{ title: "Decide · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Decide] route crashed:", error);
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <MonoLabel style={{ fontSize: "10.5px", color: "var(--madder)" }}>
          Could not load Decide
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          Reload the page. Nothing here is lost.
        </p>
      </div>
    );
  },
});
