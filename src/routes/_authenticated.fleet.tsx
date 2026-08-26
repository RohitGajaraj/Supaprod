import { createFileRoute, redirect } from "@tanstack/react-router";

// /fleet opens the board.
//
// RE-AIMED 2026-08-27. This went to /build under OBS-10, whose premise was that
// Build had widened to list every agent-mesh mission. Checked against the file:
// build.index.tsx holds no listMissions, no listStudioSessions, and neither
// RunsGrid nor RunBoard. Build was narrowed back to a station surface and the
// doors aimed at it were never re-aimed, so this opened a page with no list of
// work on it. The fleet's question was "what is every agent doing", and the
// board answers it: three lanes by what each piece of work needs from a person,
// missions and spine tracks merged.
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
    throw redirect({ to: "/today" });
  },
});
