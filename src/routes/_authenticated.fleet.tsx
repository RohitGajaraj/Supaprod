import { createFileRoute, redirect } from "@tanstack/react-router";

// /fleet folded into Build per OBS-10 (IA consolidation).
//
// THE PARAM CAME OFF BECAUSE THE LENS WAS NEVER BUILT. This used to forward
// `{view: "agent"}` and the comment above it claimed "the by-AGENT lens is now
// the 'By Agent' view-mode tab on Build". Build has no `validateSearch` and no
// view-mode tabs, and nothing anywhere reads `view` on that route, so the param
// was dropped on arrival. The redirect was telling the user a lens existed and
// then landing them on the default list.
//
// Forwarding a param nothing reads is worse than forwarding none: it looks like
// a working deep link, so nobody goes looking for the missing feature. This repo
// already holds the rule, in impact.tsx, that a link landing somewhere real and
// wrong is worse than one that fails.
//
// The by-agent lens is still worth building. It is recorded as an open gap in
// docs/planning/initiatives/audit-reports/agent-and-governance-surfaces.md
// rather than implied by a query string.
export const Route = createFileRoute("/_authenticated/fleet")({
  beforeLoad: () => {
    throw redirect({ to: "/build" });
  },
});
