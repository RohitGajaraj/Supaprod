// Ship (05) — the stage of THE SUPAPROD LOOP between Build and Learn (Tempo
// revamp, 2026-07-13). It was invisible before: a shipped changeset's history
// lived buried in Memory's Docs tab, so the lifecycle appeared to jump from
// "agents opened a PR" straight to "outcomes." Ship is now a first-class
// destination that answers "what went to production, and what did we tell the
// world?" — preview to promote, with a receipt for every release.
//
// Composed from existing, self-contained panels (no new data layer):
//   - ShipHistoryPanel   the record of what reached production
//   - AnnouncementsPanel launch announcements / the outward story
//   - ChangelogPanel     the running changelog
import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TopBar } from "@/components/supaprod/TopBar";
import { PageHeader } from "@/components/supaprod/PageHeader";
import { PresenceChip } from "@/components/obsidian/PresenceChip";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { MonoLabel } from "@/components/obsidian/primitives";
import { useWorkspace } from "@/hooks/use-workspace";
import { getAgentFleet } from "@/lib/agent-fleet.functions";

/** PC-29 layer 2/4 (2026-07-17 repair pass): Ship's one station agent. */
const SHIP_STATION_AGENTS = ["release"];

const ShipHistoryPanel = lazy(() =>
  import("@/components/knowledge/ShipHistoryPanel").then((m) => ({
    default: m.ShipHistoryPanel,
  })),
);
const ChangelogPanel = lazy(() =>
  import("@/components/knowledge/ChangelogPanel").then((m) => ({ default: m.ChangelogPanel })),
);
const AnnouncementsPanel = lazy(() =>
  import("@/components/knowledge/AnnouncementsPanel").then((m) => ({
    default: m.AnnouncementsPanel,
  })),
);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-floor)",
        letterSpacing: "0.11em",
        textTransform: "uppercase",
        fontWeight: 500,
        color: "var(--text-body)",
        margin: "0 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function PanelFallback() {
  return <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading…</div>;
}

function ShipSurface() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  // PC-29 layer 2 (2026-07-17): shared cache with FleetView's "By Agent" tab
  // and every other station header (same queryKey pattern). Scoped by
  // workspaceId so switching workspaces doesn't show another workspace's
  // agent activity.
  const fFleet = useServerFn(getAgentFleet);
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const presenceAgent = fleet.data?.fleet.agents.find((a) => SHIP_STATION_AGENTS.includes(a.slug));
  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Ship"]} />
      <div
        style={{
          maxWidth: "var(--container-work, 1520px)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--page-inset-v) var(--page-inset-h) 64px",
          animation: "cadRise 260ms var(--ease) both",
        }}
      >
        <PageHeader
          title="From preview to"
          accent="production."
          subtitle="Every merged change gets a preview, a promote, and a receipt. This is the record of what reached your users and the story you told them about it."
          usp="Preview to production with a receipt for every release, so shipping is provable, not a claim."
        />
        {presenceAgent ? (
          <div style={{ marginBottom: 14 }}>
            <PresenceChip
              agentSlug={presenceAgent.slug}
              station="ship"
              state={presenceAgent.state === "working" ? "working" : "idle"}
              lastActedAt={presenceAgent.lastActiveAt}
            />
          </div>
        ) : null}
        {/* PC-29 layer 4: the inline relay, live only while Ship has a run going. */}
        <AgentRelay variant="station" station="ship" workspaceId={activeWorkspaceId} />

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <section>
            <SectionTitle>Ship history</SectionTitle>
            <Suspense fallback={<PanelFallback />}>
              <ShipHistoryPanel />
            </Suspense>
          </section>
          <section>
            <SectionTitle>Announcements</SectionTitle>
            <Suspense fallback={<PanelFallback />}>
              <AnnouncementsPanel />
            </Suspense>
          </section>
          <section>
            <SectionTitle>Changelog</SectionTitle>
            <Suspense fallback={<PanelFallback />}>
              <ChangelogPanel />
            </Suspense>
          </section>
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/_authenticated/ship")({
  component: ShipSurface,
  head: () => ({ meta: [{ title: "Ship · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Ship] route crashed:", error);
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <MonoLabel style={{ fontSize: "10.5px", color: "var(--madder)" }}>
          Could not load Ship
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          Reload the page. Nothing here is lost.
        </p>
      </div>
    );
  },
});
