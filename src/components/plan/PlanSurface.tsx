import { useEffect, useRef, useState, type RefObject } from "react";
import { ProductMasthead } from "@/components/obsidian/ProductMasthead";
import { RoadmapColumns } from "./RoadmapColumns";
import { SpecComposer } from "./SpecComposer";
import { SpecList } from "./SpecList";
import { SpecDetail } from "./SpecDetail";
import { StakeholderPackPanel } from "./StakeholderPackPanel";
import { GoalsPanel } from "./GoalsPanel";
import { LoopsPanel } from "./LoopsPanel";

/** The deep-linkable Plan sections (?view=), honored by scrolling the
 * section into view and moving focus to its heading (DESIGN-LOOM §9b).
 * SW-4 added "goals" (standing objectives the swarm keeps working) and
 * "loops" (hidden crons promoted to user-owned recurring missions). */
export const PLAN_VIEWS = ["goals", "loops", "roadmap", "specs", "stakeholders"] as const;
export type PlanView = (typeof PLAN_VIEWS)[number];

/**
 * OBS-07 §5 step 7 + LOOM W2 (2026-07-04): the Plan orchestrator, v4. The
 * standard 1240px container (DESIGN-LOOM §4b), the hero with the thread's
 * maker's mark, real h2 section headings (the surface previously had no
 * heading structure below the h1 — quality register a11y blocker), the
 * Now/Next/Later columns, the cited spec list, the stakeholder pack, and the
 * spec-detail slide-over's open state (`specOpen`).
 *
 * Toast feedback for every mutation here goes through `@/lib/notify` (sonner,
 * mounted once globally in `__root.tsx`); see the OBS-07 note in git history
 * for why the OBS-03 Toast primitive is not used.
 */
export function PlanSurface({ view }: { view?: PlanView }) {
  const [specOpen, setSpecOpen] = useState<string | null>(null);
  const sectionRefs = {
    goals: useRef<HTMLElement>(null),
    loops: useRef<HTMLElement>(null),
    roadmap: useRef<HTMLElement>(null),
    specs: useRef<HTMLElement>(null),
    stakeholders: useRef<HTMLElement>(null),
  };

  // Honor the ?view= deep link (the /roadmap, /prds, and /stakeholder legacy
  // redirects all carry one): scroll the named section into view and move
  // focus to its heading so keyboard/AT users land there too. The sections
  // above the target load async and grow the page after the first scroll, so
  // the scroll re-asserts once, shortly after, when the layout has settled.
  useEffect(() => {
    if (!view) return;
    const el = sectionRefs[view].current;
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    el.focus({ preventScroll: true });
    const settle = window.setTimeout(() => {
      sectionRefs[view].current?.scrollIntoView({ block: "start" });
    }, 450);
    return () => window.clearTimeout(settle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const sectionHeading = (v: PlanView, label: string, sub?: string) => (
    <div
      ref={sectionRefs[v] as RefObject<HTMLDivElement>}
      tabIndex={-1}
      style={{ outline: "none", scrollMarginTop: 16 }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-ui)",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
          lineHeight: 1.3,
        }}
      >
        {label}
      </h2>
      {sub ? (
        <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-subtle)" }}>{sub}</p>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        maxWidth: "var(--container-standard)",
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
      <ProductMasthead />
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-hero)",
            fontWeight: 420,
            letterSpacing: "-0.015em",
            lineHeight: 1.12,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          The bets you have{" "}
          <em style={{ color: "var(--ember-text)", fontStyle: "italic" }}>committed</em> to.
        </h1>
        <div
          aria-hidden="true"
          style={{
            width: 24,
            height: 1,
            marginTop: 12,
            background: "var(--thread-gradient)",
            opacity: 0.4,
          }}
        />
        <p style={{ fontSize: 14, color: "var(--text-body)", margin: "10px 0 0" }}>
          Every bet declares an outcome and a measure. Nothing hides in a backlog.
        </p>
      </div>

      <div style={{ marginBottom: 14 }}>
        {sectionHeading("goals", "Goals", "Standing outcomes Cadence keeps working")}
      </div>
      <GoalsPanel />

      <div style={{ marginTop: 40, marginBottom: 14 }}>
        {sectionHeading("loops", "Loops", "Recurring missions with their run history and cost")}
      </div>
      <LoopsPanel />

      <div style={{ marginTop: 40, marginBottom: 14 }}>
        {sectionHeading("roadmap", "Roadmap", "Now, Next, and Later, each with a declared outcome")}
      </div>
      <RoadmapColumns />

      <div style={{ marginTop: 40, marginBottom: 14 }}>
        {sectionHeading("specs", "Specs", "Cited, with their receipts")}
      </div>
      <SpecComposer />
      <SpecList onOpen={setSpecOpen} />

      {/* Stakeholder pack: a visible section (founder ruling 2026-07-06 -
          important sections stay expanded; cap long lists instead of hiding a
          whole section). Its own panel caps what it shows. */}
      <div style={{ marginTop: 40, marginBottom: 14 }}>
        <div
          ref={sectionRefs.stakeholders as RefObject<HTMLDivElement>}
          tabIndex={-1}
          style={{ outline: "none", scrollMarginTop: 16 }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-ui)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.3,
            }}
          >
            Stakeholder pack
          </h2>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-subtle)" }}>
            Audience-tuned updates from any decision
          </p>
        </div>
      </div>
      <StakeholderPackPanel />

      <SpecDetail id={specOpen} onClose={() => setSpecOpen(null)} />
    </div>
  );
}
