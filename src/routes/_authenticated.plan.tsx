// Plan · OBS-07: ported to the Obsidian v3 design system (cited specs + outcome
// roadmap). `/plan` is a new, additive route — `/product` and `/prds` keep their
// current parchment behavior and current data (shared query keys) until OBS-10
// folds the routes together. No server function is modified.
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/cadence/TopBar";
import { useWorkspace } from "@/hooks/use-workspace";
import { PlanSurface } from "@/components/plan/PlanSurface";

export const Route = createFileRoute("/_authenticated/plan")({
  component: PlanPage,
  head: () => ({ meta: [{ title: "Plan · Cadence" }] }),
  errorComponent: ({ error, reset }) => (
    <div style={{ padding: "30px 44px 56px", maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          padding: 24,
          maxWidth: 560,
          background: "var(--surface-card)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD PLAN
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          {(error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--glacier)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Retry · reloads Plan
        </button>
      </div>
    </div>
  ),
});

function PlanPage() {
  const { activeWorkspace } = useWorkspace();
  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Plan"]} />
      <PlanSurface />
    </>
  );
}
