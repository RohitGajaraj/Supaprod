// Learn (06) — the closing stage of THE SUPAPROD LOOP (Tempo revamp,
// 2026-07-13). Previously /learn was a redirect into Brain's Learnings tab,
// which hid the loop's most important stage: what actually happened after you
// shipped, and what the system learned from it. It is now a first-class
// destination so the lifecycle reads end to end (signal → shipped → learned).
//
// Composed entirely from existing, self-contained panels (no new data layer):
//   - OutcomesPanel   what each release announced / sent out
//   - LearningsPanel  outcome memos with verdicts that close the loop
//   - ImpactLedgerPanel  the value record: what the work was worth
//   - SupportPanel    post-ship support signals
// These same panels also render inside Memory; here they are framed as the
// live "did it work?" stage, feeding Memory (the compounding record).
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

/** PC-29 layer 2/4 (2026-07-17 repair pass): Learn's one station agent. */
const LEARN_STATION_AGENTS = ["data-analyst"];

const OutcomesPanel = lazy(() =>
  import("@/components/learn/OutcomesPanel").then((m) => ({ default: m.OutcomesPanel })),
);
const LearningsPanel = lazy(() =>
  import("@/components/learn/LearningsPanel").then((m) => ({ default: m.LearningsPanel })),
);
const SupportPanel = lazy(() =>
  import("@/components/learn/SupportPanel").then((m) => ({ default: m.SupportPanel })),
);
const ImpactLedgerPanel = lazy(() =>
  import("@/components/knowledge/ImpactLedgerPanel").then((m) => ({
    default: m.ImpactLedgerPanel,
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

function LearnSurface() {
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
  const presenceAgent = fleet.data?.fleet.agents.find((a) => LEARN_STATION_AGENTS.includes(a.slug));
  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Learn"]} />
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
          eyebrow="The Loop · 07 Learn"
          title="Did it"
          accent="work?"
          subtitle="The loop closes here. Every shipped bet comes back with an outcome, a verdict, and the impact it produced, then feeds Memory so the next call is sharper."
          usp="Outcomes close the loop and teach the system, so Supaprod gets better with every release."
        />
        {presenceAgent ? (
          <div style={{ marginBottom: 14 }}>
            <PresenceChip
              agentSlug={presenceAgent.slug}
              station="learn"
              state={presenceAgent.state === "working" ? "working" : "idle"}
              lastActedAt={presenceAgent.lastActiveAt}
            />
          </div>
        ) : null}
        {/* PC-29 layer 4: the inline relay, live only while Learn has a run going. */}
        <AgentRelay variant="station" station="learn" workspaceId={activeWorkspaceId} />

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <section>
            <SectionTitle>Learnings</SectionTitle>
            <Suspense fallback={<PanelFallback />}>
              <LearningsPanel />
            </Suspense>
          </section>
          <section>
            <SectionTitle>Impact record</SectionTitle>
            <Suspense fallback={<PanelFallback />}>
              <ImpactLedgerPanel />
            </Suspense>
          </section>
          <section>
            <SectionTitle>What each release sent out</SectionTitle>
            <Suspense fallback={<PanelFallback />}>
              <OutcomesPanel />
            </Suspense>
          </section>
          <section>
            <SectionTitle>Support signals</SectionTitle>
            <Suspense fallback={<PanelFallback />}>
              <SupportPanel />
            </Suspense>
          </section>
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/_authenticated/learn")({
  component: LearnSurface,
  head: () => ({ meta: [{ title: "Learn · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Learn] route crashed:", error);
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <MonoLabel style={{ fontSize: "10.5px", color: "var(--madder)" }}>
          Could not load Learn
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          Reload the page. Nothing here is lost.
        </p>
      </div>
    );
  },
});
