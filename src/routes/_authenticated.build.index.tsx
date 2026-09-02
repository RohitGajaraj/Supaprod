import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * REDIRECT STUB (P-14, A-QUEUE.md, R-34's ruling: "there are no lanes,
 * priority is Put first"). The station this page rebuilt around ("what is
 * being written, and which of it is waiting on me") is answered on Start's
 * own moving-work signal and Find anything's Runs group; a build that needs
 * a person is a gated run, reached the same way. This address stays live
 * because inbound links and bookmarks exist, the same one-week window P-10
 * and P-14a already used, then a follow-up packet deletes this stub.
 *
 * `search: true` forwards whatever the old address carried, raw -- the same
 * shorthand `_authenticated.decide.tsx`'s own stub uses and for the same
 * reason: this stub's `prev` type has no narrower shape to offer `/start`'s
 * own `validateSearch`.
 */
export const Route = createFileRoute("/_authenticated/build/")({
  beforeLoad: () => {
    throw redirect({ to: "/start", search: true });
  },
});
