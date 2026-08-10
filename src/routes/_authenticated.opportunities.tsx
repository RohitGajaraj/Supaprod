import { createFileRoute, redirect } from "@tanstack/react-router";

// /opportunities folded into Discover per OBS-10 (IA consolidation).
//
// COLLAPSED 2026-08-10. The comment above described the world of 2026-07-11,
// when the ranked queue WAS Discover's queue tab. It moved to /decide on
// 2026-07-13, and /discover's own beforeLoad has redirected `?tab=queue`
// straight there ever since. So this route sent every visitor through
// /discover only to be bounced again, one line later, to the place it could
// have named itself.
//
// It now goes to /decide directly. `/discover?tab=queue` keeps working for
// anything else that still links it, which is the point of leaving that
// redirect in place rather than collapsing both ends.
//
// `replace: true` so the intermediate URL never enters history: a reader who
// arrives here and presses back should return to where they came from, not to
// a hop the router chose for them.
export const Route = createFileRoute("/_authenticated/opportunities")({
  beforeLoad: () => {
    throw redirect({ to: "/decide", replace: true });
  },
});
