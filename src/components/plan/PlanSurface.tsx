import { useEffect, useRef, useState } from "react";
import { MonoLabel } from "@/components/obsidian";
import { RoadmapColumns } from "./RoadmapColumns";
import { SpecComposer } from "./SpecComposer";
import { SpecList } from "./SpecList";
import { SpecDetail } from "./SpecDetail";
import { StakeholderPackPanel } from "./StakeholderPackPanel";

/** The three deep-linkable Plan sections (?view=), honored by scrolling the
 * section into view and moving focus to its heading (DESIGN-LOOM §9b). */
export const PLAN_VIEWS = ["roadmap", "specs", "stakeholders"] as const;
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
    roadmap: useRef<HTMLHeadingElement>(null),
    specs: useRef<HTMLHeadingElement>(null),
    stakeholders: useRef<HTMLHeadingElement>(null),
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

  const sectionHeading = (v: PlanView, label: string) => (
    <h2
      ref={sectionRefs[v]}
      tabIndex={-1}
      style={{ margin: 0, lineHeight: 1, outline: "none", scrollMarginTop: 16 }}
    >
      <MonoLabel tone="muted" style={{ fontSize: "var(--text-mono-floor)" }}>
        {label}
      </MonoLabel>
    </h2>
  );

  return (
    <div
      style={{
        maxWidth: "var(--container-standard)",
        margin: "0 auto",
        padding: "36px 32px 64px",
        animation: "cadRise 260ms var(--ease) both",
      }}
    >
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

      <div style={{ marginBottom: 12 }}>{sectionHeading("roadmap", "The roadmap.")}</div>
      <RoadmapColumns />

      <div style={{ marginTop: 40, marginBottom: 12 }}>
        {sectionHeading("specs", "Specs, with their receipts.")}
      </div>
      <SpecComposer />
      <SpecList onOpen={setSpecOpen} />

      <div style={{ marginTop: 40, marginBottom: 12 }}>
        {sectionHeading("stakeholders", "Stakeholder pack.")}
      </div>
      <StakeholderPackPanel />

      <SpecDetail id={specOpen} onClose={() => setSpecOpen(null)} />
    </div>
  );
}
