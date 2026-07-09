// Plan · LOOM W2 (2026-07-04): the Plan destination, v4 "Loom". Moved from
// `_authenticated.plan.tsx` to the index position so the full spec editor can
// live at the sibling `/plan/spec/$id` (re-homed from `/prds/$id`) without a
// pass-through layout. Honors `?view=` (roadmap · specs · stakeholders) so the
// `/roadmap` and `/stakeholder` legacy redirects land on the section they
// promised (DESIGN-LOOM §9b: deep-link params are honored everywhere).
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/cadence/TopBar";
import { useWorkspace } from "@/hooks/use-workspace";
import { PlanSurface, PLAN_VIEWS, type PlanView } from "@/components/plan/PlanSurface";

export const Route = createFileRoute("/_authenticated/plan/")({
  validateSearch: (search: Record<string, unknown>): { view?: PlanView } => {
    const v = search.view;
    return {
      view: (PLAN_VIEWS as readonly string[]).includes(v as string) ? (v as PlanView) : undefined,
    };
  },
  component: PlanPage,
  head: () => ({ meta: [{ title: "Define · Cadence" }] }),
  errorComponent: ({ error, reset }) => {
    // Route-level crashes previously threw away the real error - log it so
    // any future occurrence is diagnosable from the console instead of a
    // silent "COULDN'T LOAD DEFINE" with no trace.
    console.error("[Define] route crashed:", error);
    return (
      <div style={{ padding: "30px 44px 56px", maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            padding: 24,
            maxWidth: 560,
            background: "var(--surface-card)",
            borderRadius: "var(--radius-panel)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
            COULDN'T LOAD DEFINE
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
            {(error as Error)?.message ?? "Unknown error"}
          </p>
          <button
            onClick={reset}
            className="loom-press"
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
            Retry · reloads Define
          </button>
        </div>
      </div>
    );
  },
});

function PlanPage() {
  const { activeWorkspace } = useWorkspace();
  const { view } = Route.useSearch();
  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Define"]} />
      <PlanSurface view={view} />
    </>
  );
}
