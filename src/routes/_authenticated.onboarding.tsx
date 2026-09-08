import { createFileRoute } from "@tanstack/react-router";
import { FirstRun } from "@/components/onboarding/FirstRun";

/**
 * The first run: one screen, then the home (Lane 1, 2026-09-08). Full
 * viewport, no shell; the `_authenticated` gate routes accounts with
 * `profiles.onboarded = false` here. `ObsidianOnboarding`, the screen before
 * this one, is deleted (Lane 3, 2026-09-08): its two remaining exports had no
 * reader outside the file itself.
 */
export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Get started · Supaprod" }] }),
});

function OnboardingPage() {
  return <FirstRun />;
}
