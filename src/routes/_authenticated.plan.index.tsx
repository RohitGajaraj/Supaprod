import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * REDIRECT STUB (P-14, A-QUEUE.md, R-34's ruling: "there are no lanes,
 * priority is Put first"). The Now/Next/Later board is retired, same as
 * `/decide`'s. The undeclared-outcome gate is the forecast (R-31, P-04): the
 * seat writes it and the run holds until it exists, and Start's rows already
 * print the due date. "Work in flight" is Start; "who works the plan" is the
 * run. This address stays live because inbound links from email and Slack
 * exist, the same one-week window P-10, P-14a and P-14's own `/decide` stub
 * already used, then a follow-up packet deletes this stub.
 *
 * `search: true` forwards whatever the old address carried, raw -- the same
 * shorthand `_authenticated.discover.tsx`'s own stub uses and for the same
 * reason: this stub's `prev` type has no narrower shape to offer `/start`'s
 * own `validateSearch`.
 */
export const Route = createFileRoute("/_authenticated/plan/")({
  beforeLoad: () => {
    throw redirect({ to: "/start", search: true });
  },
});
