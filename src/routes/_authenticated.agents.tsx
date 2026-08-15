import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /agents -> /crew, THE ROSTER.
 *
 * WHAT THIS USED TO DO, AND WHY IT STOPPED BEING RIGHT. It threw to
 * `/engine-room?room=safety&view=team`, on the v5 ruling that "AGENT-EXP
 * relocated the roster to Engine Room > Team" and that "the user meets agents
 * in motion (the relay), not as a managed roster". That ruling has been
 * overtaken by events twice over:
 *
 *   · `/crew` is now a live 1,435-line roster surface. The managed roster the
 *     old comment said we would not build is built and shipped.
 *   · The nav door above it is labelled AGENTS as of 2026-08-15, so `/agents`
 *     is now the obvious URL for the thing the product names on screen — and it
 *     was landing somewhere else entirely.
 *
 * A stale redirect is worse than a dead link: a 404 tells you to look
 * elsewhere, and this quietly delivered a different surface and let you believe
 * it was the one you asked for.
 *
 * The history is kept rather than deleted because the reasoning is what dates,
 * not the address, and the next person to move this should be able to see that
 * it has moved before.
 */
export const Route = createFileRoute("/_authenticated/agents")({
  beforeLoad: () => {
    throw redirect({ to: "/crew" });
  },
});
