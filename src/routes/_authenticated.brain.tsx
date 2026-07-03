// Knowledge — screen 5 of the Ember Editorial migration, ported 1:1 from
// design-reference/cadence/loop.jsx (KnowledgeScreen): kicker "Loop · Learn",
// serif h1, the Company-brain strip (REAL counts only — getBrainStatus +
// getCompanyBrainStats), TabRow Calendar | Memory | Learnings | Decisions | Docs with
// KNOWLEDGE_DESC lines. Production contracts ride the reference layout:
// ?tab= + ?meeting= search params, panel-level server-function wiring.
// Screen-6 drill contract: detail state rides optional search params
// (?decision= → DecisionDetail, ?learning= → LearningDetail); the detail
// replaces ONLY the tab body — SurfaceHeader, Company-brain strip and TabRow
// stay. setTab navigates with a fresh search object, so drills clear on tab
// switch; DrillHeader onBack navigates to the same tab without the param.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/cadence/TopBar";
import { Surface } from "@/components/obsidian/Surface";
import { MonoLabel } from "@/components/obsidian/primitives";
import { MemoryUpgradeNudge } from "@/components/billing/MemoryUpgradeNudge";
import { useWorkspace } from "@/hooks/use-workspace";
import { getBrainStatus, getCompanyBrainStats } from "@/lib/brain.functions";
import { MemoryList } from "@/components/memory/MemoryList";
import { DecisionsPanel } from "@/components/knowledge/DecisionsPanel";
import { DesignMemoryPanel } from "@/components/knowledge/DesignMemoryPanel";
import { CompoundingPanel } from "@/components/knowledge/CompoundingPanel";
import { DecisionDetail } from "@/components/knowledge/DecisionDetail";
import { LearningDetail } from "@/components/knowledge/LearningDetail";
import { DocsPanel } from "@/components/knowledge/DocsPanel";
import { CalendarPanel } from "@/components/knowledge/CalendarPanel";
import { GraphPanel } from "@/components/knowledge/GraphPanel";
import { InsightsPanel } from "@/components/knowledge/InsightsPanel";
import { BrainStatTrio } from "@/components/knowledge/BrainStatTrio";
import { ImpactLedgerPanel } from "@/components/knowledge/ImpactLedgerPanel";
import { ChangelogPanel } from "@/components/knowledge/ChangelogPanel";
import { AnnouncementsPanel } from "@/components/knowledge/AnnouncementsPanel";
import { ShipHistoryPanel } from "@/components/knowledge/ShipHistoryPanel";

// Brain (formerly Knowledge) — the product's brain: one substrate of everything
// it knows. The "memory" tab is the compounding agent-recall (the moat, folded
// in from the old /memory surface); "learnings" is the human-recorded outcome
// feed (the tab kept id "memory" until this restructure — now re-id'd to
// "learnings" so the agent-recall tab can own "memory"). Founder ruling
// 2026-06-16: Knowledge→Brain, /chat→Ask, /memory folds in here.
type Tab =
  | "insights"
  | "calendar"
  | "memory"
  | "learnings"
  | "decisions"
  | "impact"
  | "changelog"
  | "design"
  | "graph"
  | "docs";
const TABS: Tab[] = [
  "insights",
  "calendar",
  "memory",
  "learnings",
  "decisions",
  "impact",
  "changelog",
  "design",
  "graph",
  "docs",
];

const KNOWLEDGE_DESC: Record<string, string> = {
  insights:
    "Human lenses on the brain: what still stands, what you have learned, and how it accrued.",
  calendar: "Events and meeting transcripts. Open a meeting to capture and extract.",
  memory:
    "What the loop recalls: reflections agents wrote and outcomes they distilled, the compounding product memory.",
  learnings:
    "What your team recorded: re-scored opportunities and outcome memos, each with a verdict.",
  decisions: "Every choice your team made, captured once. Sourced from missions, specs, meetings.",
  impact:
    "Your portable track record: the decisions you made, the outcomes they drove, and the beliefs you revised on evidence. Take it to a review or your next role.",
  changelog:
    "What actually shipped, newest first. Each entry is written when a build merges, with its release notes.",
  design:
    "Your workspace's design language, learned not configured: tokens, type, spacing, principles, voice, patterns. Every mockup binds to what you approve here.",
  graph:
    "Trace why anything exists: the live map of how signals, specs, and decisions connect. Click a node to walk its provenance.",
  docs: "Workspace pages. Import from Google Docs or Notion, edit inline.",
};

// OBS-08 — the Obsidian tab row (no Obsidian TabRow primitive exists yet in
// OBS-03, so this is a scoped, spec-literal replacement for the parchment
// TabRow, which painted an ember underline on every active tab). Active: bg
// --raised, text --text-primary; inactive: transparent, --text-subtle; hover
// inactive -> --hover (OBS-08.md §7 interaction states).
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
      <div className="flex flex-wrap" style={{ gap: 2, borderBottom: "1px solid var(--hairline)" }}>
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSet(t.id)}
              className={
                isActive
                  ? "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                  : "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)] hover:[background-color:var(--hover)]"
              }
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "7px 13px",
                borderRadius: "var(--radius-control) var(--radius-control) 0 0",
                background: isActive ? "var(--raised)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-subtle)",
                border: "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {desc?.[active] ? (
        <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>{desc[active]}</p>
      ) : null}
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
    const t = search.tab;
    return {
      tab: (TABS as string[]).includes(t as string) ? (t as Tab) : "insights",
      meeting: typeof search.meeting === "string" ? search.meeting : undefined,
      decision: typeof search.decision === "string" ? search.decision : undefined,
      learning: typeof search.learning === "string" ? search.learning : undefined,
      focusKind: typeof search.focusKind === "string" ? search.focusKind : undefined,
      focusId: typeof search.focusId === "string" ? search.focusId : undefined,
    };
  },
  component: KnowledgePage,
  head: () => ({ meta: [{ title: "Brain · Cadence" }] }),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          padding: "16px 18px",
        }}
      >
        <MonoLabel style={{ marginBottom: 8 }}>Brain · failed to load</MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
          {(error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="outline-none hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--glacier)",
            background: "transparent",
            border: "none",
          }}
        >
          Retry · reloads this surface
        </button>
      </div>
    </Surface>
  ),
  notFoundComponent: () => (
    <Surface>
      <p style={{ fontSize: 13, color: "var(--text-subtle)" }}>Not found.</p>
    </Surface>
  ),
});

function KnowledgePage() {
  const { tab, meeting, decision, learning, focusKind, focusId } = Route.useSearch();
  const navigate = useNavigate({ from: "/brain" });
  const { activeWorkspace } = useWorkspace();
  const fBrain = useServerFn(getBrainStatus);
  const brain = useQuery({ queryKey: ["brain-status"], queryFn: () => fBrain() });
  const fStats = useServerFn(getCompanyBrainStats);
  const stats = useQuery({ queryKey: ["company-brain-stats"], queryFn: () => fStats() });

  const setTab = (next: Tab) => navigate({ search: { tab: next, meeting } });
  const setMeeting = (m: string | undefined) => navigate({ search: { tab, meeting: m } });

  // Company brain strip — every count is a real head count; nothing renders
  // until both queries resolve (no-filler law: no placeholder numbers).
  const brainStats: [string, string][] | null =
    brain.data && stats.data
      ? [
          ["chat threads", String(stats.data.conversations)],
          ["signals", String(brain.data.counts.signals)],
          ["meetings", String(brain.data.counts.meetings)],
          ["decisions", String(brain.data.counts.decisions)],
          ["learnings", String(stats.data.learnings)],
          ["docs", String(brain.data.counts.docs)],
          ["connectors", `${stats.data.connectorsLive} live`],
        ]
      : null;

  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Brain"]} />
      <Surface>
        {/* OBS-08 — the Obsidian hero: one ember italic word, mono kicker, no icon. */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
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
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            Your <em style={{ fontStyle: "italic", color: "var(--ember)" }}>record</em>.
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-body)", margin: "0 0 18px" }}>
            Every call you made, what it became, and how belief moved.
          </p>
        </div>

        <BrainStatTrio />

        {/* Company brain strip — one consolidated substrate, queryable from Chat. */}
        <div
          className="flex flex-wrap items-center"
          style={{
            gap: 18,
            background: "var(--surface-card-deep)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            padding: "12px 18px",
            marginBottom: 18,
          }}
        >
          <MonoLabel>Product brain</MonoLabel>
          {brainStats ? (
            brainStats.map(([l, v]) => (
              <span
                key={l}
                className="flex items-center"
                style={{
                  gap: 5,
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "var(--text-muted)",
                }}
              >
                {l === "connectors" ? (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--glacier)",
                      boxShadow: "0 0 10px rgba(127,209,220,0.6)",
                      animation: "cadPulse 2s ease-in-out infinite",
                    }}
                  />
                ) : null}
                <strong
                  className="tabular-nums"
                  style={{
                    color: l === "connectors" ? "var(--glacier)" : "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  {v}
                </strong>{" "}
                {l}
              </span>
            ))
          ) : (
            <MonoLabel>LOADING</MonoLabel>
          )}
          <span style={{ flex: 1 }} />
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, color: "var(--text-faint)" }}
          >
            everything here is what Ask reasons over · one brain
          </span>
        </div>

        <MemoryUpgradeNudge />

        <BrainTabRow
          tabs={[
            { id: "insights", label: "Insights" },
            { id: "calendar", label: "Calendar" },
            { id: "memory", label: "Memory" },
            { id: "learnings", label: "Learnings" },
            { id: "decisions", label: "Decisions" },
            { id: "impact", label: "Impact" },
            { id: "changelog", label: "Changelog" },
            { id: "design", label: "Design" },
            { id: "graph", label: "Graph" },
            { id: "docs", label: "Docs" },
          ]}
          active={tab}
          onSet={(t) => setTab(t as Tab)}
          desc={KNOWLEDGE_DESC}
        />

        {tab === "insights" && <InsightsPanel />}
        {tab === "calendar" && <CalendarPanel meetingId={meeting} onMeetingChange={setMeeting} />}
        {tab === "memory" && <MemoryList />}
        {tab === "learnings" &&
          (learning ? <LearningDetail id={learning} /> : <CompoundingPanel />)}
        {tab === "decisions" && (decision ? <DecisionDetail id={decision} /> : <DecisionsPanel />)}
        {tab === "impact" && <ImpactLedgerPanel />}
        {tab === "changelog" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <section>
              <MonoLabel style={{ marginBottom: 10, display: "block" }}>Announcements</MonoLabel>
              <AnnouncementsPanel />
            </section>
            <section>
              <MonoLabel style={{ marginBottom: 10, display: "block" }}>Changelog</MonoLabel>
              <ChangelogPanel />
            </section>
            <section>
              <MonoLabel style={{ marginBottom: 10, display: "block" }}>Ship history</MonoLabel>
              <ShipHistoryPanel />
            </section>
          </div>
        )}
        {tab === "design" && <DesignMemoryPanel />}
        {tab === "graph" && <GraphPanel focusKind={focusKind} focusId={focusId} />}
        {tab === "docs" && <DocsPanel />}
      </Surface>
    </>
  );
}
