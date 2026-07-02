import { createFileRoute, redirect } from "@tanstack/react-router";

// /prompts folded into the Engine Room glance per OBS-10 (IA consolidation);
// no dedicated room exists for it yet (rare, machine-internal - a ⌘K
// candidate once OBS-11 ships).
export const Route = createFileRoute("/_authenticated/prompts")({
  beforeLoad: () => {
    throw redirect({ to: "/engine-room" });
  },
});
