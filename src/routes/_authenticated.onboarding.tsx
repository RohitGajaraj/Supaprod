import { createFileRoute } from "@tanstack/react-router";
import { ObsidianOnboarding } from "@/components/onboarding/ObsidianOnboarding";

// OBS-14 - first-run onboarding, ported to the Obsidian five-screen golden
// path. Full-viewport, no shell; the _authenticated gate routes accounts
// with profiles.onboarded=false here.

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Get started · Cadence" }] }),
});

function OnboardingPage() {
  return <ObsidianOnboarding />;
}
