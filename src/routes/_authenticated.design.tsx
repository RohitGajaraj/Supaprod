import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * REDIRECT STUB (P-14, A-QUEUE.md, R-34's ruling: "there are no lanes,
 * priority is Put first"). Brand rules move to Settings › Workspace › Brand
 * (P-23 already put them there); a rule waiting on a person is now an
 * approval row and lands on Start as *Needs you*. The drawings themselves
 * move to each run's own artifact pane (P-24) and to Find anything ›
 * Prototypes. The "Design gates Build" switch moves to Settings ›
 * Automation. This address stays live because inbound links from email and
 * Slack exist, the same one-week window P-10, P-14a and P-14's own /decide
 * and /plan stubs already used, then a follow-up packet deletes this stub.
 *
 * `search: true` forwards whatever the old address carried, raw -- the same
 * shorthand `_authenticated.discover.tsx`'s own stub uses and for the same
 * reason: this stub's `prev` type has no narrower shape to offer `/start`'s
 * own `validateSearch`.
 */
export const Route = createFileRoute("/_authenticated/design")({
  beforeLoad: () => {
    throw redirect({ to: "/start", search: true });
  },
});
