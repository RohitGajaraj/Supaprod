import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ProductMasthead } from "@/components/obsidian/ProductMasthead";
import { PageHeader } from "@/components/supaprod/PageHeader";
import { PresenceChip } from "@/components/obsidian/PresenceChip";
import { FlashlightTabs } from "@/components/obsidian/flashlight-tabs";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import { RoadmapColumns } from "./RoadmapColumns";
import { SpecComposer } from "./SpecComposer";
import { SpecList } from "./SpecList";
import { SpecDetail } from "./SpecDetail";
import { StakeholderPackPanel } from "./StakeholderPackPanel";
import { GoalsPanel } from "./GoalsPanel";
import { LoopsPanel } from "./LoopsPanel";

/** PC-29 layer 2: Define's station agents, most-relevant first (the fleet is
 * already sorted attention-first, agent-fleet.ts). ux-architect moved to its
 * own "design" station (2026-07-17 repair pass) - it now has a home on
 * /design instead of showing up here under a name ("Design") that never
 * matched what Plan's page actually does. */
const DEFINE_STATION_AGENTS = ["prd-writer", "sprint-planner"];

/** The deep-linkable Plan sections (?view=), honored by scrolling the
 * section into view and moving focus to its heading (DESIGN-LOOM §9b).
 * SW-4 added "goals" (standing objectives the swarm keeps working) and
 * "loops" (hidden crons promoted to user-owned recurring missions; the
 * user-facing name is "Recurring missions", the id stays for deep links). */
export const PLAN_VIEWS = ["goals", "loops", "roadmap", "specs", "stakeholders"] as const;
export type PlanView = (typeof PLAN_VIEWS)[number];

/** Section chrome: label, one-line sub, and whether the section starts as a
 * summary card (IA SPINE 2026-07-11: Roadmap and Specs are the only sections
 * open by default; Goals, Recurring missions, and the Stakeholder pack
 * collapse to a summary and expand on demand). */
const SECTION_META: Record<PlanView, { label: string; sub: string; collapsible: boolean }> = {
  goals: {
    label: "Goals",
    sub: "Standing outcomes Supaprod keeps working",
    collapsible: true,
  },
  loops: {
    label: "Recurring missions",
    sub: "Missions Supaprod re-runs on a schedule, every run logged with its cost",
    collapsible: true,
  },
  roadmap: {
    label: "Roadmap",
    sub: "Now, Next, and Later, each with a declared outcome",
    collapsible: false,
  },
  specs: {
    label: "Specs",
    sub: "Cited, with their receipts",
    collapsible: false,
  },
  stakeholders: {
    label: "Stakeholder pack",
    sub: "Audience-tuned updates from any decision",
    collapsible: true,
  },
};

/**
 * OBS-07 §5 step 7 + LOOM W2 (2026-07-04) + IA SPINE (2026-07-11): the Plan
 * orchestrator. The standard 1240px container, the hero, a sticky
 * FlashlightTabs section switcher (the same tab pattern Engine Room and Brain
 * ship) driving PLAN_VIEWS and defaulting to Roadmap, real h2 section
 * headings, and the Now/Next/Later columns + cited spec list. Goals,
 * Recurring missions, and the Stakeholder pack render as summary cards until
 * expanded (chevron on the heading, the card itself, or their switcher tab).
 *
 * Toast feedback for every mutation here goes through `@/lib/notify` (sonner,
 * mounted once globally in `__root.tsx`).
 */
export function PlanSurface({ view }: { view?: PlanView }) {
  const [specOpen, setSpecOpen] = useState<string | null>(null);
  const { activeWorkspaceId } = useWorkspace();
  // PC-29 layer 2: shared cache with FleetView's "By Agent" tab (same
  // queryKey) - a cache read here, not a second network call, on the same
  // workspace. Scoped by workspaceId so switching workspaces doesn't show
  // another workspace's agent activity.
  const fFleet = useServerFn(getAgentFleet);
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const presenceAgent = fleet.data?.fleet.agents.find((a) =>
    DEFINE_STATION_AGENTS.includes(a.slug),
  );
  const sectionRefs = {
    goals: useRef<HTMLElement>(null),
    loops: useRef<HTMLElement>(null),
    roadmap: useRef<HTMLElement>(null),
    specs: useRef<HTMLElement>(null),
    stakeholders: useRef<HTMLElement>(null),
  };

  // The switcher's active section. Defaults to Roadmap; a ?view= deep link
  // (the /roadmap, /prds, and /stakeholder legacy redirects all carry one)
  // wins on arrival.
  const [active, setActive] = useState<PlanView>(view ?? "roadmap");
  const [expanded, setExpanded] = useState<Record<PlanView, boolean>>(() => ({
    goals: view === "goals",
    loops: view === "loops",
    roadmap: true,
    specs: true,
    stakeholders: view === "stakeholders",
  }));

  const expand = useCallback((v: PlanView) => {
    setActive(v);
    setExpanded((e) => (e[v] ? e : { ...e, [v]: true }));
  }, []);

  // Select a section from the switcher: mark it active, expand it if it was
  // a summary card, then scroll it into view and move focus to its heading
  // so keyboard/AT users land there too.
  const go = useCallback(
    (v: PlanView) => {
      expand(v);
      // Next frame: the section body may have just expanded and moved layout.
      requestAnimationFrame(() => {
        const el = sectionRefs[v].current;
        if (!el) return;
        el.scrollIntoView({ block: "start" });
        el.focus({ preventScroll: true });
      });
    },
    // sectionRefs is a stable object of stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expand],
  );

  // Honor the ?view= deep link. The sections above the target load async and
  // grow the page after the first scroll, so the scroll re-asserts once,
  // shortly after, when the layout has settled.
  useEffect(() => {
    if (!view) return;
    go(view);
    const settle = window.setTimeout(() => {
      sectionRefs[view].current?.scrollIntoView({ block: "start" });
    }, 450);
    return () => window.clearTimeout(settle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const sectionHeading = (v: PlanView) => {
    const meta = SECTION_META[v];
    const isOpen = expanded[v];
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {meta.collapsible ? (
          <button
            type="button"
            onClick={() => (isOpen ? setExpanded((e) => ({ ...e, [v]: false })) : expand(v))}
            aria-expanded={isOpen}
            aria-controls={`plan-section-${v}`}
            aria-label={isOpen ? `Collapse ${meta.label}` : `Expand ${meta.label}`}
            className="loom-press outline-none transition-colors hover:[background:var(--hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={{
              width: 32,
              height: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: -6,
              marginLeft: -8,
              color: "var(--text-subtle)",
              background: "transparent",
              border: "none",
              borderRadius: "var(--radius-control)",
              cursor: "pointer",
            }}
          >
            {isOpen ? (
              <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        ) : null}
        <div
          ref={sectionRefs[v] as RefObject<HTMLDivElement>}
          tabIndex={-1}
          // Clears the sticky TopBar (52px) + the sticky section switcher.
          style={{ outline: "none", scrollMarginTop: 116 }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.3,
            }}
          >
            {meta.label}
          </h2>
          <p style={{ margin: "3px 0 0", fontSize: "var(--text-label-13)", color: "var(--text-subtle)" }}>
            {meta.sub}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: "var(--container-standard)",
        width: "100%",
        margin: "0 auto",
        padding: "var(--page-inset-v) var(--page-inset-h) 64px",
        animation: "cadRise 260ms var(--ease) both",
        position: "relative",
      }}
    >
      {/* Loom §2b glow field: the one ambient wash behind the hero. The hero
          wrapper (not the whole surface) clips it, because an overflow:hidden
          ancestor would break the sticky section switcher below. */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          margin: "-36px -32px 0",
          padding: "var(--page-inset-v) var(--page-inset-h) 0",
        }}
        className="overflow-x-clip"
      >
        <div aria-hidden="true" className="loom-glow-field" />
        <PageHeader
          eyebrow="The Loop · 03 Plan"
          title="The bets you have"
          accent="committed to."
          subtitle="Every bet declares an outcome and a measure. Nothing hides in a backlog."
          usp="Every spec line is cited back to the signals and decision behind it, so the plan is evidence, not opinion."
        />
        <div style={{ marginBottom: 20 }}>
          {presenceAgent ? (
            <div style={{ marginTop: 14 }}>
              <PresenceChip
                agentSlug={presenceAgent.slug}
                station="define"
                state={presenceAgent.state === "working" ? "working" : "idle"}
                lastActedAt={presenceAgent.lastActiveAt}
              />
            </div>
          ) : null}
          {/* PC-29 layer 4: the inline relay, live only while Define has a run
            going (a spec being drafted, a sprint being planned). */}
          <div style={{ marginTop: 14 }}>
            <AgentRelay variant="station" station="define" workspaceId={activeWorkspaceId} />
          </div>
        </div>
      </div>

      {/* IA SPINE (2026-07-11): the sticky in-page section switcher, the same
          FlashlightTabs pattern Engine Room ships. It stays reachable while
          scrolling; selecting a tab expands (if needed) and jumps to that
          section. */}
      <div
        style={{
          // Sticks just below the 52px sticky TopBar (z 30), so it never
          // paints over the app chrome.
          position: "sticky",
          top: 60,
          zIndex: 20,
          marginBottom: 24,
          padding: "4px 10px 0",
          background: "color-mix(in srgb, var(--surface-card) 92%, transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-panel)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <FlashlightTabs
          tabs={PLAN_VIEWS.map((v) => ({ id: v, label: SECTION_META[v].label }))}
          active={active}
          onSelect={(id) => go(id as PlanView)}
          ariaLabel="Plan sections"
          size="sm"
        />
      </div>

      <div style={{ marginBottom: 14 }}>{sectionHeading("goals")}</div>
      <div id="plan-section-goals">
        <GoalsPanel collapsed={!expanded.goals} onExpand={() => expand("goals")} />
      </div>

      <div style={{ marginTop: 40, marginBottom: 14 }}>{sectionHeading("loops")}</div>
      <div id="plan-section-loops">
        <LoopsPanel collapsed={!expanded.loops} onExpand={() => expand("loops")} />
      </div>

      <div style={{ marginTop: 40, marginBottom: 14 }}>{sectionHeading("roadmap")}</div>
      <RoadmapColumns />

      <div style={{ marginTop: 40, marginBottom: 14 }}>{sectionHeading("specs")}</div>
      <SpecComposer />
      <SpecList onOpen={setSpecOpen} />

      <div style={{ marginTop: 40, marginBottom: 14 }}>{sectionHeading("stakeholders")}</div>
      <div id="plan-section-stakeholders">
        <StakeholderPackPanel
          collapsed={!expanded.stakeholders}
          onExpand={() => expand("stakeholders")}
        />
      </div>

      <SpecDetail id={specOpen} onClose={() => setSpecOpen(null)} />
    </div>
  );
}
