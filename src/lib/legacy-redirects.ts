/**
 * THE ROUTE CANON TWO TESTS DERIVE "KNOWN ROUTE" FROM. Pure data: no JSX, no
 * side effects, nothing at runtime imports it.
 *
 * WHAT IT WAS UNTIL 2026-09-09, and why that half is gone. This file also held
 * `LEGACY_REDIRECTS`, a map of thirty old addresses onto fold targets, written
 * when each of those addresses had a redirect stub behind it. P-10 (2026-09-02)
 * deleted the 49 redirect-only routes, so by the fifth review not one of the
 * thirty keys was a route, `/tasks` and `/chat` pointed at `/today` (deleted in
 * the same commit), a comment asserted `/inbox` "is a real route now
 * (_authenticated.inbox.tsx)" for a file that no longer exists, and `/product`
 * -- the one key that still resolves -- is the live public marketing page, so
 * the map labelled a shipped page as a legacy fold.
 *
 * Nothing in src, supabase/ or public/ emits any of those addresses, and a
 * stale bookmark already gets the honest answer: the root `NotFoundComponent`
 * draws "There is no page at this address" with a "Go home" door. The map was
 * documentation, read by the next builder rather than by a person, and every
 * sentence in it had been false for a week. Deleted rather than repaired,
 * because a redirect table with no redirects behind it is a claim the repo
 * cannot show. Do not add stubs back for these addresses: the 404 with a door
 * is the correct landing.
 *
 * What stays is the pair of lists below, which `nav-model.test.ts` and
 * `palette-catalog.test.ts` read to answer "is this a real destination".
 */

/**
 * The primary destinations still standing. `/today` left this list on
 * 2026-09-09: P-10 deleted its route and the signed-in home is `/start`
 * (`SIGNED_IN_HOME`, src/components/shell/post-auth-home.ts), so every entry
 * here now resolves to a file on disk.
 */
export const CANONICAL_PATHS = [
  "/start",
  "/evidence",
  "/ship",
  "/learn",
  "/outcomes",
  "/inbox",
  "/threads",
  "/engine-room",
] as const;

/**
 * Paths that are reached from a destination or a door but are not themselves
 * one of the primary entries - Settings, Admin, onboarding, and the standing
 * door-links. These are live pages other live pages depend on.
 *
 * `/traces` and `/traces/$traceId` are architectural rather than pending work:
 * the Engine Room's own record room navigates there for trace detail, one level
 * deeper than the room itself.
 */
export const DOOR_INTERNAL_PATHS = [
  "/settings",
  "/onboarding",
  "/admin",
  "/sources",
  "/traces",
  "/traces/$traceId",
] as const;
