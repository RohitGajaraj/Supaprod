import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * REDIRECT STUB (P-14, A-QUEUE.md, R-34's ruling: "there are no lanes,
 * priority is Put first"). The ranked queue's home is Start's *Or start one
 * of these* (top three real bets by ICE, `listTopOpportunities`) and Find
 * anything › Findings; Keep is now Start it, Challenge is the Critic already
 * running at a run's own Decide station, Drop is a decision made on the run.
 * This address stays live because inbound links from email and Slack exist,
 * the same one-week window P-10 and P-14a already used, then a follow-up
 * packet deletes this stub.
 *
 * `search: true` forwards whatever the old address carried, raw -- the same
 * shorthand `_authenticated.discover.tsx`'s own stub uses and for the same
 * reason: this stub's `prev` type has no narrower shape to offer `/start`'s
 * own `validateSearch`.
 */
export const Route = createFileRoute("/_authenticated/decide")({
  beforeLoad: () => {
    throw redirect({ to: "/start", search: true });
  },
});
