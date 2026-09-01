import { createFileRoute, redirect } from "@tanstack/react-router";

import { REVIEW_QUEUE_SEARCH, SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

/**
 * `/inbox` HAS FOLDED INTO THE HOME. THE URL SURVIVES AS AN ALIAS.
 *
 * ── THE RULING PREDATES THIS COMMIT ──────────────────────────────────────
 * `SURFACE-MAP.md:70` marks this route **DELETE -- fold anything real into
 * *Waiting for you***, and `:196` assigns the fold. It had not happened, so the
 * board carried a door to it and the duplication stayed.
 *
 * ── WHAT WAS ACTUALLY DUPLICATED, MEASURED RATHER THAN ASSUMED ───────────
 * `InboxSurface` reads `getApprovalsQueue`, `listMissions` and
 * `listDueForecasts`. The board on the home reads all three. Same rows, same
 * workspace, two components, two cadences -- which is exactly how the strip and
 * the desk once came to count differently.
 *
 * The one honest difference was the CAP: the board shows three rows per lane
 * and the inbox showed everything. The board's own door said so in as many
 * words -- *"this card shows three rows per section and opens the rest in
 * place; the inbox is the same triage with no cap"*. But "opens the rest in
 * place" is the point: every lane already carries its own "53 more" expander,
 * so the uncapped view is one press away on the surface a person is already
 * standing on. The inbox was a second address for a control the board had.
 *
 * ── WHY A STUB AND NOT A DELETION ────────────────────────────────────────
 * The pattern `/today` and `/runs` set: an alias keeps every bookmark, pasted
 * link and test path working with no sweep. `src/server.test.ts:22` smoke-tests
 * this exact path, and a 404 there is a worse outcome than eleven lines.
 *
 * It lands on the REVIEW QUEUE rather than the top of the home, for the reason
 * `/today`'s own stub records: a fold is not finished until the doors point at
 * the SECTION, not at the page that now contains it. Somebody who typed
 * `/inbox` wanted the queue.
 *
 * `InboxSurface.tsx` stays in the tree unmounted rather than deleted (Addendum
 * 1.1 rule 8), so the uncapped composition is recoverable if the founder wants
 * it back inside a region.
 */
export const Route = createFileRoute("/_authenticated/inbox")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME, search: { [REVIEW_QUEUE_SEARCH]: true } });
  },
});
