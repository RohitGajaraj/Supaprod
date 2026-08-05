// /start (front-end reimagining Phase 5): the reimagined one-question first run.
// Parallel to the live /onboarding (which stays the default until Gate 2); at
// the merge the authenticated gate points first-run users here.
//
// GATED FOR LAUNCH: This route is experimental and incomplete. Users who somehow
// land here are redirected to the stable /onboarding flow. The component stays in
// place for Phase 5 implementation. Remove this gate when /start becomes the
// primary flow.
import { createFileRoute, redirect } from "@tanstack/react-router";
import { MissionOnboarding } from "@/components/mission/MissionOnboarding";

export const Route = createFileRoute("/_authenticated/start")({
  beforeLoad: () => {
    // Redirect to stable onboarding flow for launch
    throw redirect({ to: "/onboarding" });
  },
  component: MissionOnboarding,
  head: () => ({ meta: [{ title: "Get started · Supaprod" }] }),
});
