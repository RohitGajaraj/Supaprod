import { createFileRoute, redirect } from "@tanstack/react-router";

// /eval-health folded into Engine Room's Quality room per OBS-10 (IA
// consolidation). QualityRoom's Score view reads the same `getEvalHealth()`
// query (pass rate, trend, verdict) and its Suites view lists every suite;
// the flaky-suite breakdown this page also showed is still reachable at
// /govern?tab=evals (Quality's own drill-down target).
export const Route = createFileRoute("/_authenticated/eval-health")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room", search: { room: "quality", view: "score" } });
  },
});
