import { createFileRoute } from "@tanstack/react-router";
import { FirstRun } from "@/components/onboarding/FirstRun";

/**
 * The first run: one screen, then the home (Lane 1, 2026-09-08). Full
 * viewport, no shell; the `_authenticated` gate routes accounts with
 * `profiles.onboarded = false` here. `ObsidianOnboarding` is no longer
 * mounted; its two exports with other readers (`isSeededExampleTitle`,
 * `criticReviewAsShareable`) stay until they move to `src/lib`.
 */
export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Get started · Supaprod" }] }),
});

function OnboardingPage() {
  return <FirstRun />;
}
