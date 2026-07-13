// Learn (06) — the closing stage of THE CADENCE LOOP (Tempo revamp,
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
import { TopBar } from "@/components/cadence/TopBar";
import { PageHeader } from "@/components/cadence/PageHeader";
import { MonoLabel } from "@/components/obsidian/primitives";
import { useWorkspace } from "@/hooks/use-workspace";

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
  const { activeWorkspace } = useWorkspace();
  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Learn"]} />
      <div
        style={{
          maxWidth: "var(--container-work, 1520px)",
          width: "100%",
          margin: "0 auto",
          padding: "36px 32px 64px",
          animation: "cadRise 260ms var(--ease) both",
        }}
      >
        <PageHeader
          eyebrow="The Loop · 07 Learn"
          title="Did it"
          accent="work?"
          subtitle="The loop closes here. Every shipped bet comes back with an outcome, a verdict, and the impact it produced, then feeds Memory so the next call is sharper."
          usp="Outcomes close the loop and teach the system, so Cadence gets better with every release."
        />

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
  head: () => ({ meta: [{ title: "Learn · Cadence" }] }),
  errorComponent: ({ error }) => {
    console.error("[Learn] route crashed:", error);
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <MonoLabel tone="madder" style={{ fontSize: "10.5px" }}>
          Could not load Learn
        </MonoLabel>
        <p style={{ fontSize: "var(--text-base)", color: "var(--text-muted)", marginTop: "8px" }}>
          Reload the page. Nothing here is lost.
        </p>
      </div>
    );
  },
});
