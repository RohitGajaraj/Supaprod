// /start (front-end reimagining Phase 5): the reimagined one-question first run.
// Parallel to the live /onboarding (which stays the default until Gate 2); at
// the merge the authenticated gate points first-run users here.
import { createFileRoute } from "@tanstack/react-router";
import { MissionOnboarding } from "@/components/mission/MissionOnboarding";

export const Route = createFileRoute("/_authenticated/start")({
  component: MissionOnboarding,
  head: () => ({ meta: [{ title: "Get started · Supaprod" }] }),
});
