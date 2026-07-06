// Brain — the product's memory, one substrate of everything it knows.
// Loom W2-BRAIN (2026-07-04): eight tabs (Insights+Impact merged, Docs+
// Changelog merged; every legacy ?tab= value still resolves), every tab panel
// lazy-loaded behind a layout-matching skeleton (the 527KB route chunk fix),
// counts scoped to the active workspace, and the v4 work-surface canvas
// (container-work, 14px base, mono floor 10.5). The "memory" tab is the
// compounding agent-recall; "learnings" the human-recorded outcome feed.
// Founder rulings 2026-06-16 (Knowledge -> Brain) and 2026-07-04 (Loom).
//
// Drill contract: detail state rides optional search params (?decision= ->
// DecisionDetail, ?learning= -> LearningDetail, ?meeting= -> the calendar
// meeting). The detail replaces ONLY the tab body; the hero, count strip and
// tab row stay. setTab navigates with a fresh search object so EVERY drill
// param (including ?meeting) clears on a tab switch.
import { lazy, Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/cadence/TopBar";
import { MonoLabel } from "@/components/obsidian/primitives";
import { FlashlightTabs } from "@/components/obsidian/flashlight-tabs";
import { MemoryUpgradeNudge } from "@/components/billing/MemoryUpgradeNudge";
import { useWorkspace } from "@/hooks/use-workspace";
import { getBrainStatus, getCompanyBrainStats } from "@/lib/brain.functions";
import { BrainStatTrio } from "@/components/knowledge/BrainStatTrio";

// Every tab panel is code-split: only the active tab's module loads.
const InsightsPanel = lazy(() =>
  import("@/components/knowledge/InsightsPanel").then((m) => ({ default: m.InsightsPanel })),
);
const ImpactLedgerPanel = lazy(() =>
  import("@/components/knowledge/ImpactLedgerPanel").then((m) => ({
    default: m.ImpactLedgerPanel,
  })),
);
const CalendarPanel = lazy(() =>
  import("@/components/knowledge/CalendarPanel").then((m) => ({ default: m.CalendarPanel })),
);
const MemoryList = lazy(() =>
  import("@/components/memory/MemoryList").then((m) => ({ default: m.MemoryList })),
);
const CompoundingPanel = lazy(() =>
  import("@/components/knowledge/CompoundingPanel").then((m) => ({
    default: m.CompoundingPanel,
  })),
);
const LearningDetail = lazy(() =>
  import("@/components/knowledge/LearningDetail").then((m) => ({ default: m.LearningDetail })),
);
const DecisionsPanel = lazy(() =>
  import("@/components/knowledge/DecisionsPanel").then((m) => ({ default: m.DecisionsPanel })),
);
const DecisionDetail = lazy(() =>
  import("@/components/knowledge/DecisionDetail").then((m) => ({ default: m.DecisionDetail })),
);
const DesignMemoryPanel = lazy(() =>
  import("@/components/knowledge/DesignMemoryPanel").then((m) => ({
    default: m.DesignMemoryPanel,
  })),
);
const GraphPanel = lazy(() =>
  import("@/components/knowledge/GraphPanel").then((m) => ({ default: m.GraphPanel })),
);
const DocsPanel = lazy(() =>
  import("@/components/knowledge/DocsPanel").then((m) => ({ default: m.DocsPanel })),
);
const AnnouncementsPanel = lazy(() =>
  import("@/components/knowledge/AnnouncementsPanel").then((m) => ({
    default: m.AnnouncementsPanel,
  })),
);
const ChangelogPanel = lazy(() =>
  import("@/components/knowledge/ChangelogPanel").then((m) => ({ default: m.ChangelogPanel })),
);
const ShipHistoryPanel = lazy(() =>
  import("@/components/knowledge/ShipHistoryPanel").then((m) => ({
    default: m.ShipHistoryPanel,
  })),
);

type Tab =
  | "insights"
  | "calendar"
  | "memory"
  | "learnings"
  | "decisions"
  | "design"
  | "graph"
  | "docs";
const TABS: Tab[] = [
  "insights",
  "calendar",
  "memory",
  "learnings",
  "decisions",
  "design",
  "graph",
  "docs",
];

// Deep-link honesty: every tab id that ever existed still lands somewhere
// true. Impact folded into Insights; Changelog folded into Docs.
const LEGACY_TABS: Record<string, Tab> = {
  impact: "insights",
  changelog: "docs",
};

const TAB_DESC: Record<Tab, string> = {
  insights:
    "What you have learned, what still stands, and the portable record of the calls you made.",
  calendar: "Events and meeting transcripts. Open a meeting to capture and extract.",
  memory: "What the loop recalls: notes agents wrote and the outcomes they distilled.",
  learnings:
    "What your team recorded: re-scored opportunities and outcome memos, each with a verdict.",
  decisions: "Every choice your team made, captured once. Sourced from missions, specs, meetings.",
  design:
    "Your workspace's design language, learned not configured: tokens, type, spacing, principles, voice, patterns. Every mockup binds to what you approve here.",
  graph:
    "The living map of how signals, specs, and decisions connect. Watch it grow; click a node to walk its history.",
  docs: "Workspace pages, plus what shipped: announcements, the changelog, and ship history.",
};

// The Obsidian tab row (OBS-08), tuned to the v4 type scale: mono floor
// 10.5px, helper description in muted (never faint) ink.
function BrainTabRow({
  tabs,
  active,
  onSet,
  desc,
}: {
  tabs: { id: Tab; label: string }[];
  active: Tab;
  onSet: (id: Tab) => void;
  desc?: Record<string, string>;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <FlashlightTabs
        tabs={tabs}
        active={active}
        onSelect={(id) => onSet(id as Tab)}
        ariaLabel="Brain sections"
      />
      {desc?.[active] ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{desc[active]}</p>
      ) : null}
    </div>
  );
}

/** v4 work surface: Brain earns the working width (container-work, 1520px). */
function BrainSurface({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: "var(--container-work, 1520px)",
        width: "100%",
        margin: "0 auto",
        padding: "36px 32px 64px",
        animation: "cadRise 260ms var(--ease) both",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Loom §2b glow field: the one ambient wash behind the hero. */}
      <div aria-hidden="true" className="loom-glow-field" />
      {children}
    </div>
  );
}

/** Real h2 headings (navigable outline), styled as the mono-caps voice. */
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

/** The Suspense fallback: shimmer rows matching a tab's list layout. */
function TabSkeleton() {
  const bar = (h: number, w?: string) => (
    <div
      style={{
        width: w ?? "100%",
        height: h,
        borderRadius: "var(--radius-card)",
        background:
          "linear-gradient(90deg, var(--raised), var(--hover), var(--raised)) 0 0 / 280% 100%",
        animation: "cadShimmer 1.6s linear infinite",
      }}
    />
  );
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {bar(64)}
      {bar(120)}
      {bar(120)}
      {bar(64, "70%")}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/brain")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab: Tab;
    meeting?: string;
    decision?: string;
    learning?: string;
    focusKind?: string;
    focusId?: string;
  } => {
    const raw = typeof search.tab === "string" ? search.tab : "";
    const tab: Tab = (TABS as string[]).includes(raw)
      ? (raw as Tab)
      : (LEGACY_TABS[raw] ?? "insights");
    return {
      tab,
      meeting: typeof search.meeting === "string" ? search.meeting : undefined,
      decision: typeof search.decision === "string" ? search.decision : undefined,
      learning: typeof search.learning === "string" ? search.learning : undefined,
      focusKind: typeof search.focusKind === "string" ? search.focusKind : undefined,
      focusId: typeof search.focusId === "string" ? search.focusId : undefined,
    };
  },
  component: BrainPage,
  head: () => ({ meta: [{ title: "Brain · Cadence" }] }),
  errorComponent: ({ error, reset }) => (
    <BrainSurface>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--top-light)",
          padding: "16px 18px",
        }}
      >
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>Brain · failed to load</MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
          {(error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="loom-press outline-none hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--glacier)",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
        >
          Retry · reloads this surface
        </button>
      </div>
    </BrainSurface>
  ),
  notFoundComponent: () => (
    <BrainSurface>
      <p style={{ fontSize: 13, color: "var(--text-subtle)" }}>Not found.</p>
    </BrainSurface>
  ),
});

/** One count in the strip; fixed line height so loading never reflows. */
function StripStat({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <span
      className="flex items-center"
      style={{
        gap: 5,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-floor)",
        color: "var(--text-muted)",
        lineHeight: "16px",
      }}
    >
      {live ? (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--glacier)",
            boxShadow: "0 0 10px rgba(132, 179, 236,0.6)",
            animation: "cadPulse 2s ease-in-out infinite",
          }}
        />
      ) : null}
      <strong
        className="tabular-nums"
        style={{ color: live ? "var(--glacier)" : "var(--text-primary)", fontWeight: 600 }}
      >
        {value}
      </strong>{" "}
      {label}
    </span>
  );
}

function StripSkeleton() {
  return (
    <>
      {[52, 44, 58, 62, 56, 40, 66].map((w, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            width: w,
            height: 16,
            borderRadius: 6,
            background:
              "linear-gradient(90deg, var(--raised), var(--hover), var(--raised)) 0 0 / 280% 100%",
            animation: "cadShimmer 1.6s linear infinite",
          }}
        />
      ))}
    </>
  );
}

function BrainPage() {
  const { tab, meeting, decision, learning, focusKind, focusId } = Route.useSearch();
  const navigate = useNavigate({ from: "/brain" });
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const fBrain = useServerFn(getBrainStatus);
  const brain = useQuery({
    // Workspace-scoped counts (Loom W2-BRAIN): the key carries the workspace
    // so a switch refetches, and the fn narrows the counts server-side.
    queryKey: ["brain-status", activeWorkspaceId],
    queryFn: () => fBrain({ data: { workspaceId: activeWorkspaceId } }),
  });
  const fStats = useServerFn(getCompanyBrainStats);
  const stats = useQuery({
    queryKey: ["company-brain-stats", activeWorkspaceId],
    queryFn: () => fStats({ data: { workspaceId: activeWorkspaceId } }),
  });

  // Fresh search object: every drill param clears on a tab switch (the old
  // version carried ?meeting across tabs).
  const setTab = (next: Tab) => navigate({ search: { tab: next } });
  const setMeeting = (m: string | undefined) => navigate({ search: { tab, meeting: m } });

  // The count strip: every number is a real head count for THIS workspace.
  const strip: { label: string; value: string; live?: boolean }[] | null =
    brain.data && stats.data
      ? [
          { label: "chat threads", value: String(stats.data.conversations) },
          { label: "signals", value: String(brain.data.counts.signals) },
          { label: "meetings", value: String(brain.data.counts.meetings) },
          { label: "decisions", value: String(brain.data.counts.decisions) },
          { label: "learnings", value: String(stats.data.learnings) },
          { label: "docs", value: String(brain.data.counts.docs) },
          { label: "live", value: String(stats.data.connectorsLive), live: true },
        ]
      : null;
  const stripFailed = brain.isError || stats.isError;

  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Brain"]} />
      <BrainSurface>
        {/* The Obsidian hero: one ember italic word, mono kicker, no icon. */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              letterSpacing: "0.14em",
              color: "var(--text-subtle)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Loop · Brain
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 430,
              fontSize: "var(--text-hero)",
              lineHeight: 1.12,
              letterSpacing: "-0.015em",
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            Your <em style={{ fontStyle: "italic", color: "var(--ember)" }}>record</em>.
          </h1>
          <p
            style={{ fontSize: "var(--text-base)", color: "var(--text-body)", margin: "0 0 18px" }}
          >
            Every call you made, what it became, and how belief moved.
          </p>
        </div>

        <BrainStatTrio />

        {/* The count strip: one consolidated substrate, queryable from Ask. */}
        <div
          className="flex flex-wrap items-center"
          style={{
            gap: 18,
            background: "var(--surface-card-deep)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--top-light)",
            padding: "12px 18px",
            marginBottom: 18,
            minHeight: 41,
          }}
        >
          <MonoLabel>Product brain</MonoLabel>
          {strip ? (
            strip.map((s) => <StripStat key={s.label} {...s} />)
          ) : stripFailed ? (
            <span
              className="flex items-center"
              style={{ gap: 8, fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-floor)" }}
            >
              <span style={{ color: "var(--text-muted)" }}>counts unavailable right now</span>
              <button
                type="button"
                className="loom-press outline-none hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                style={{
                  color: "var(--glacier)",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                }}
                onClick={() => {
                  void brain.refetch();
                  void stats.refetch();
                }}
              >
                Retry
              </button>
            </span>
          ) : (
            <StripSkeleton />
          )}
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              color: "var(--text-subtle)",
            }}
          >
            Ask reads all of this when it answers you
          </span>
        </div>

        <MemoryUpgradeNudge />

        <BrainTabRow
          tabs={[
            { id: "insights", label: "Insights & impact" },
            { id: "calendar", label: "Calendar" },
            { id: "memory", label: "Memory" },
            { id: "learnings", label: "Learnings" },
            { id: "decisions", label: "Decisions" },
            { id: "design", label: "Design" },
            { id: "graph", label: "Graph" },
            { id: "docs", label: "Docs & changelog" },
          ]}
          active={tab}
          onSet={setTab}
          desc={TAB_DESC}
        />

        <Suspense fallback={<TabSkeleton />}>
          {tab === "insights" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <section>
                <InsightsPanel />
              </section>
              <section>
                <SectionTitle>Your impact record</SectionTitle>
                <ImpactLedgerPanel />
              </section>
            </div>
          )}
          {tab === "calendar" && <CalendarPanel meetingId={meeting} onMeetingChange={setMeeting} />}
          {tab === "memory" && <MemoryList />}
          {tab === "learnings" &&
            (learning ? <LearningDetail id={learning} /> : <CompoundingPanel />)}
          {tab === "decisions" &&
            (decision ? <DecisionDetail id={decision} /> : <DecisionsPanel />)}
          {tab === "design" && <DesignMemoryPanel />}
          {tab === "graph" && <GraphPanel focusKind={focusKind} focusId={focusId} />}
          {tab === "docs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <section>
                <SectionTitle>Docs</SectionTitle>
                <DocsPanel />
              </section>
              <section>
                <SectionTitle>Announcements</SectionTitle>
                <AnnouncementsPanel />
              </section>
              <section>
                <SectionTitle>Changelog</SectionTitle>
                <ChangelogPanel />
              </section>
              <section>
                <SectionTitle>Ship history</SectionTitle>
                <ShipHistoryPanel />
              </section>
            </div>
          )}
        </Suspense>
      </BrainSurface>
    </>
  );
}
