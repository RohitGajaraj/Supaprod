import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * REDIRECT STUB (P-14a, 2026-09-02). `/discover` is now `/arriving` -- the
 * component and every string it renders moved to that file, which is where
 * to look for both. This address stays live because inbound links from
 * email and Slack exist (the real route's own header records three separate
 * repairs for exactly this kind of deep link), then P-14's own follow-up
 * deletes this stub once the one-week window has passed.
 *
 * `search: true` forwards every existing param unchanged, raw -- `tab`,
 * `focus`, `capture` all still work on the new address, because a redirect
 * that drops the param is the same defect `_authenticated.arriving.tsx`'s
 * header describes fixing three times already. A transform function typed
 * against the wrong route's `validateSearch` was the first draft here and
 * `tsc` refused it (this stub's own `prev` has no narrower type to offer);
 * `true` is the router's own shorthand for "keep it as the URL already has
 * it", which is exactly what forwarding to `/arriving`'s real
 * `validateSearch` needs.
 */
export const Route = createFileRoute("/_authenticated/discover")({
  beforeLoad: () => {
    throw redirect({ to: "/arriving", search: true });
  },
});
