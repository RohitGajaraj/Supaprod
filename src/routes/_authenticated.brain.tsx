import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * REDIRECT STUB (P-14a, 2026-09-02). `/brain` is now `/outcomes` -- the page
 * and every string it renders moved to that file, which is where to look
 * for both. This address stays live because inbound links from email and
 * Slack exist, then P-14's own follow-up deletes this stub once the
 * one-week window has passed.
 *
 * `search: true` forwards every existing param unchanged, raw -- `tab`,
 * `meeting`, `decision`, `learning`, `focusKind`, `focusId` all still work
 * on the new address. The router's own shorthand for "keep it as the URL
 * already has it", which is what forwarding into `/outcomes`'s own
 * `validateSearch` needs.
 */
export const Route = createFileRoute("/_authenticated/brain")({
  beforeLoad: () => {
    throw redirect({ to: "/outcomes", search: true });
  },
});
