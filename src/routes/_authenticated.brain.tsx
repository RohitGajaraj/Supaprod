// Memory. The product's ledger of record: one substrate of everything it
// knows. Route stays /brain (deep-link honesty); the surface label is Memory
// (Tempo revamp, 2026-07-11).
//
// Four flat tabs: Decisions, Learnings, Docs, Graph. The PC-34 lens layer
// (front door + lens doors + within-lens sub-nav) is retired as navigation;
// the tab bar is the navigation again. Insights and the impact ledger fold
// into Decisions as the outcome record; agent recall and its review gate fold
// into Learnings; the Brief folds into Docs. Calendar left this surface
// entirely (meetings live on Today's PM Desk now).
//
// Every tab id that ever existed still resolves: LEGACY_TABS maps each old
// value onto one of the four tabs, and validateSearch normalizes at parse
// time, so old links land somewhere true. The legacy ids stay in the search
// TYPE union so out-of-surface links and redirect stubs keep compiling.
//
// Drill contract unchanged: detail state rides optional search params
// (?decision= -> DecisionDetail, ?learning= -> LearningDetail). The detail
// replaces ONLY the tab body; the hero and count strip stay in every state.
// setTab navigates with a fresh search object so every drill param clears on
// a tab switch.
import { lazy, Suspense, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/cadence/TopBar";
import { PageHeader } from "@/components/cadence/PageHeader";
import { MonoLabel } from "@/components/obsidian/primitives";
import { FlashlightTabs } from "@/components/obsidian/flashlight-tabs";
import { MemoryUpgradeNudge } from "@/components/billing/MemoryUpgradeNudge";
import { PresenceChip } from "@/components/obsidian/PresenceChip";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { getBrainStatus, getCompanyBrainStats } from "@/lib/brain.functions";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import { BrainStatTrio } from "@/components/knowledge/BrainStatTrio";

/** PC-29 layer 2: Memory's station agent. */
const MEMORY_STATION_AGENTS = ["data-analyst"];

// Every tab panel is code-split: only the active tab's module loads.
const InsightsPanel = lazy(() =>
  import("@/components/knowledge/InsightsPanel").then((m) => ({ default: m.InsightsPanel })),
);
const ImpactLedgerPanel = lazy(() =>
  import("@/components/knowledge/ImpactLedgerPanel").then((m) => ({
    default: m.ImpactLedgerPanel,
  })),
);
const MemoryList = lazy(() =>
  import("@/components/memory/MemoryList").then((m) => ({ default: m.MemoryList })),
);
// RPT-28: the write review gate sits above the recall list. Nothing enters
// agent_memory without an approval here.
const MemoryReviewQueue = lazy(() =>
  import("@/components/memory/MemoryReviewQueue").then((m) => ({ default: m.MemoryReviewQueue })),
);
const CompoundingPanel = lazy(() =>
  import("@/components/knowledge/CompoundingPanel").then((m) => ({
    default: m.CompoundingPanel,
  })),
);
const PlaybookProposalsPanel = lazy(() =>
  import("@/components/knowledge/PlaybookProposalsPanel").then((m) => ({
    default: m.PlaybookProposalsPanel,
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
const BriefPanel = lazy(() =>
  import("@/components/knowledge/BriefPanel").then((m) => ({ default: m.BriefPanel })),
);
const GraphPanel = lazy(() =>
  import("@/components/knowledge/GraphPanel").then((m) => ({ default: m.GraphPanel })),
);
const DocsPanel = lazy(() =>
  import("@/components/knowledge/DocsPanel").then((m) => ({ default: m.DocsPanel })),
);
const CapabilitiesPanel = lazy(() =>
  import("@/components/knowledge/CapabilitiesPanel").then((m) => ({
    default: m.CapabilitiesPanel,
  })),
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

type Tab = "decisions" | "learnings" | "docs" | "graph";
const TABS: Tab[] = ["decisions", "learnings", "docs", "graph"];

// Deep-link honesty: every tab id that ever existed still lands somewhere
// true. Insights, impact, judgment, recall and calendar fold into Decisions
// (calendar's meetings themselves moved to Today's PM Desk); the agent memory
// tab folds into Learnings; brief, design, changelog and capabilities fold
// into Docs.
type LegacyTab =
  | "insights"
  | "impact"
  | "judgment"
  | "recall"
  | "calendar"
  | "memory"
  | "brief"
  | "design"
  | "changelog"
  | "capabilities";
const LEGACY_TABS: Record<LegacyTab, Tab> = {
  insights: "decisions",
  impact: "decisions",
  judgment: "decisions",
  recall: "decisions",
  calendar: "decisions",
  memory: "learnings",
  brief: "docs",
  design: "docs",
  changelog: "docs",
  capabilities: "docs",
};

const TAB_LABEL: Record<Tab, string> = {
  decisions: "Decisions",
  learnings: "Learnings",
  docs: "Docs",
  graph: "Graph",
};

const TAB_DESC: Record<Tab, string> = {
  decisions:
    "The ledger of record: every call your team made, captured once, and the outcome each one produced.",
  learnings:
    "What your team recorded and what the loop recalls: outcome memos with verdicts, playbook proposals, and agent memory behind its review gate.",
  docs: "The standing record: your brief, workspace pages, announcements, the changelog, and ship history.",
  graph:
    "The living map of how signals, specs, and decisions connect. Watch it grow; click a node to walk its history.",
};

// The tab row: FlashlightTabs (the standard bar) plus the active tab's
// one-line description in muted ink.
function MemoryTabRow({ active, onSet }: { active: Tab; onSet: (id: Tab) => void }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <FlashlightTabs
        tabs={TABS.map((id) => ({ id, label: TAB_LABEL[id] }))}
        active={active}
        onSelect={(id) => onSet(id as Tab)}
        ariaLabel="Memory sections"
      />
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{TAB_DESC[active]}</p>
    </div>
  );
}

/** The recessed door. Raw substrate counts an agent cares about far more
 *  than a human does, behind one collapsed disclosure (the same idiom as
 *  EngineRoomDisclosure on Build). Never a new room, never hidden entirely.
 *  Only ever shows numbers already fetched for the count strip; never
 *  fabricates a decay or embedding figure the codebase can't back yet. */
function MemoryMachineryDisclosure({
  counts,
}: {
  counts: { label: string; value: string }[] | null;
}) {
  const [open, setOpen] = useState(false);
  if (!counts) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="memory-machinery-panel"
        className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          textAlign: "left",
          padding: "6px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        {open ? (
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{ color: "var(--text-subtle)", flexShrink: 0 }}
          />
        ) : (
          <ChevronRight
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{ color: "var(--text-subtle)", flexShrink: 0 }}
          />
        )}
        <MonoLabel>Under the hood</MonoLabel>
        {!open && (
          <span
            className="mono-label"
            style={{
              marginLeft: "auto",
              fontSize: "var(--text-mono-floor)",
              color: "var(--text-faint)",
            }}
          >
            the raw substrate
          </span>
        )}
      </button>
      {open && (
        <div
          id="memory-machinery-panel"
          className="fade-up"
          style={{
            marginTop: 8,
            borderRadius: "var(--radius-panel)",
            overflow: "hidden",
            background: "var(--surface-recessed)",
            boxShadow: "var(--top-light)",
            padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>
            The counts every agent reads before it acts. You never need these to use Memory; they
            exist so a curious eye can see the substrate is real.
          </p>
          <div className="flex flex-wrap" style={{ gap: 16 }}>
            {counts.map((c) => (
              <span
                key={c.label}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-floor)",
                  color: "var(--text-muted)",
                }}
              >
                <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {c.value}
                </strong>{" "}
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** v4 work surface: Memory earns the working width (container-work, 1520px). */
function MemorySurface({ children }: { children: React.ReactNode }) {
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
      {/* The one ambient wash behind the hero. */}
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
    <div role="status" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span className="sr-only">Loading this section…</span>
      <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {bar(64)}
        {bar(120)}
        {bar(120)}
        {bar(64, "70%")}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/brain")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    // The TYPE union keeps every legacy id so out-of-surface links and the
    // redirect stubs still compile; the RUNTIME value is always one of the
    // four tabs (or undefined, which the page reads as Decisions). `meeting`
    // stays in the type for the same reason; meetings render on Today now.
    tab?: Tab | LegacyTab;
    meeting?: string;
    decision?: string;
    learning?: string;
    focusKind?: string;
    focusId?: string;
  } => {
    const raw = typeof search.tab === "string" ? search.tab : "";
    const tab: Tab | undefined = (TABS as string[]).includes(raw)
      ? (raw as Tab)
      : LEGACY_TABS[raw as LegacyTab];
    return {
      tab,
      meeting: typeof search.meeting === "string" ? search.meeting : undefined,
      decision: typeof search.decision === "string" ? search.decision : undefined,
      learning: typeof search.learning === "string" ? search.learning : undefined,
      focusKind: typeof search.focusKind === "string" ? search.focusKind : undefined,
      focusId: typeof search.focusId === "string" ? search.focusId : undefined,
    };
  },
  component: MemoryPage,
  head: () => ({ meta: [{ title: "Brain · Cadence" }] }),
  errorComponent: ({ error, reset }) => (
    <MemorySurface>
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
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-subtle)",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
        >
          Retry · reloads this surface
        </button>
      </div>
    </MemorySurface>
  ),
  notFoundComponent: () => (
    <MemorySurface>
      <p style={{ fontSize: 13, color: "var(--text-subtle)", margin: 0 }}>
        This record doesn't exist or was removed. Everything Memory holds is on its four tabs.
      </p>
      <a
        href="/brain"
        className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          display: "inline-block",
          marginTop: 12,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--glacier)",
        }}
      >
        Go to Memory
      </a>
    </MemorySurface>
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
            // Token-traced glow (was a hardcoded rgba of the retired chalky blue).
            boxShadow: "0 0 10px color-mix(in srgb, var(--glacier) 60%, transparent)",
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

function MemoryPage() {
  const search = Route.useSearch();
  // validateSearch already normalized legacy ids at parse time, so the
  // runtime value here is always one of the four tabs (or absent).
  const tab: Tab = (search.tab as Tab | undefined) ?? "decisions";
  const { decision, learning, focusKind, focusId } = search;
  const navigate = useNavigate({ from: "/brain" });
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const fBrain = useServerFn(getBrainStatus);
  const brain = useQuery({
    // Workspace-scoped counts: the key carries the workspace so a switch
    // refetches, and the fn narrows the counts server-side.
    queryKey: ["brain-status", activeWorkspaceId],
    queryFn: () => fBrain({ data: { workspaceId: activeWorkspaceId } }),
  });
  const fStats = useServerFn(getCompanyBrainStats);
  const stats = useQuery({
    queryKey: ["company-brain-stats", activeWorkspaceId],
    queryFn: () => fStats({ data: { workspaceId: activeWorkspaceId } }),
  });
  // PC-29 layer 2: shared cache with Build's "By Agent" tab (same queryKey).
  // A cache read here, not a second network call, on the same workspace.
  const fFleet = useServerFn(getAgentFleet);
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const presenceAgent = fleet.data?.fleet.agents.find((a) =>
    MEMORY_STATION_AGENTS.includes(a.slug),
  );

  // Fresh search object: every drill param clears on a tab switch.
  const setTab = (next: Tab) => navigate({ search: { tab: next } });

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
      <MemorySurface>
        {/* The hero: Tempo PageHeader (retires the Loom serif/italic hero). */}
        <PageHeader
          eyebrow="Intelligence · Brain"
          title="Your product's"
          accent="brain."
          subtitle="Every call you made, what it became, and how belief moved, on one substrate the whole loop reads from and reasons over."
          usp="The brain compounds: every decision and outcome makes the next call faster and better-cited."
        >
          {presenceAgent ? (
            <PresenceChip
              agentSlug={presenceAgent.slug}
              station="brain"
              state={presenceAgent.state === "working" ? "working" : "idle"}
              lastActedAt={presenceAgent.lastActiveAt}
            />
          ) : null}
          {/* PC-29 layer 4: the inline relay, live only while Measure/Learn
              has a run going. */}
          <div style={{ marginTop: 12 }}>
            <AgentRelay variant="station" station="learn" workspaceId={activeWorkspaceId} />
          </div>
        </PageHeader>

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
          <MonoLabel>Product memory</MonoLabel>
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
                className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  color: "var(--text-subtle)",
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

        <MemoryTabRow active={tab} onSet={setTab} />
        <Suspense fallback={<TabSkeleton />}>
          {tab === "decisions" &&
            (decision ? (
              <DecisionDetail id={decision} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <section>
                  <DecisionsPanel />
                </section>
                {/* The outcome record: what each call produced. Folds the
                    retired Insights and Impact tabs into the ledger. */}
                <section>
                  <SectionTitle>Outcomes</SectionTitle>
                  <InsightsPanel />
                </section>
                <section>
                  <SectionTitle>Your impact record</SectionTitle>
                  <ImpactLedgerPanel />
                </section>
              </div>
            ))}
          {tab === "learnings" &&
            (learning ? (
              <LearningDetail id={learning} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <section>
                  {/* SW-3: open playbook proposals render above the feed they
                      compound from; the panel is invisible when none wait. */}
                  <PlaybookProposalsPanel />
                  <CompoundingPanel />
                </section>
                {/* The retired agent-memory tab folds in here: the write
                    review gate first, then what the loop recalls. */}
                <section>
                  <SectionTitle>Review gate</SectionTitle>
                  <MemoryReviewQueue />
                </section>
                <section>
                  <SectionTitle>What the loop recalls</SectionTitle>
                  <MemoryList />
                </section>
              </div>
            ))}
          {tab === "docs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {/* The retired Brief tab folds in as the standing record's
                  first section: versioned strategic calls, never lost. */}
              <section>
                <SectionTitle>Brief</SectionTitle>
                <BriefPanel />
              </section>
              <section>
                <SectionTitle>Capabilities</SectionTitle>
                <CapabilitiesPanel />
              </section>
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
          {tab === "graph" && <GraphPanel focusKind={focusKind} focusId={focusId} />}
        </Suspense>
        <MemoryMachineryDisclosure counts={strip} />
      </MemorySurface>
    </>
  );
}
