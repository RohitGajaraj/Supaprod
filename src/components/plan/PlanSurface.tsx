import { useState } from "react";
import { MonoLabel } from "@/components/obsidian";
import { Surface } from "@/components/obsidian/Surface";
import { RoadmapColumns } from "./RoadmapColumns";
import { SpecList } from "./SpecList";
import { SpecDetail } from "./SpecDetail";
import { StakeholderPackPanel } from "./StakeholderPackPanel";

/**
 * OBS-07 §5 step 7: the Plan orchestrator. 1160px container, the outcome-roadmap
 * hero, the Now/Next/Later columns, the cited spec list, and the spec-detail
 * slide-over's open state (`specOpen`).
 *
 * Toast feedback for every mutation here goes through `@/lib/notify` (sonner,
 * mounted once globally in `__root.tsx`) rather than the OBS-03 Toast/ToastHost
 * primitive: the sibling OBS-05 build mounts a local `ToastProvider`/`ToastHost`
 * that no code in that file's own top-level mutations ever calls (they use
 * `@/lib/notify` too), so that wiring renders nothing. Reusing the primitive
 * here would repeat the same dead mount rather than fix it; this surface
 * deliberately follows the one toast pipe that is verified to actually render.
 */
export function PlanSurface() {
  const [specOpen, setSpecOpen] = useState<string | null>(null);

  return (
    <Surface wide>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-hero)",
            fontWeight: 420,
            letterSpacing: "-0.015em",
            lineHeight: 1.15,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          The bets you have{" "}
          <em style={{ color: "var(--ember)", fontStyle: "italic" }}>committed</em> to.
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-body)", marginTop: 6 }}>
          Every bet declares an outcome and a measure. Nothing hides in a backlog.
        </p>
      </div>

      <RoadmapColumns />

      <div style={{ marginTop: 40, marginBottom: 12 }}>
        <MonoLabel>Specs, with their receipts.</MonoLabel>
      </div>
      <SpecList onOpen={setSpecOpen} />

      <div style={{ marginTop: 40, marginBottom: 12 }}>
        <MonoLabel>Stakeholder Pack.</MonoLabel>
      </div>
      <StakeholderPackPanel />

      <SpecDetail id={specOpen} onClose={() => setSpecOpen(null)} />
    </Surface>
  );
}
