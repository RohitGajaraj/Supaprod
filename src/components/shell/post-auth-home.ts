/**
 * THE ONE SEAM THE POST-AUTH HOME TURNS ON (R-15 mechanism 2).
 *
 * The founder verifies `/start` beside `/today` at their real urls, and
 * promotion is supposed to be ONE reversible line. It was not: the answer to
 * "where does a signed-in person land" was spelled as a literal in login,
 * signup, the public landing's signed-in branch, seven retired-route redirects
 * and two workspace-exit flows — ten independent literals with nothing joining
 * them, so promoting `/start` would have left every one of them opening the old
 * surface and the "one line" would really have been a sweep across files that
 * do not know about each other. This constant is the seam those files now
 * share, so the flip is what the ruling promised: edit this value, and every
 * door that means "the app's home" opens the new surface together.
 *
 * DELIBERATELY NOT HERE: `_authenticated.start.tsx`'s "Open Supaprod" link.
 * That link exists so the founder can compare the two landings side by side
 * (R-15); it names `/today` on purpose and must survive the flip.
 *
 * Nothing observable changes until the value below changes — and on
 * 2026-08-25 it changed.
 */
/*
 * ── FLIPPED 2026-08-25 ────────────────────────────────────────────────────
 *
 * `/start` is the home. `/today` is a page you can still reach.
 *
 * THE MEASUREMENT THAT DECIDED IT. An audit of the real first sixty seconds
 * found that a new account lands on `/today`, and an empty workspace opens with
 * **five negations in the first viewport**: *"Nothing is ready for your review.
 * Nothing is stuck." · "Nothing is waiting on you. Nothing stopped, no agent is
 * working and nothing went live."* Every word of that is true and well written,
 * and the dominant message of a person's first minute was **idleness**. The
 * hero band returns `null` with no data, so the featured moment of the page is
 * literally absent on day one. **No control on that screen starts a run.**
 *
 * Meanwhile `/start` — *"What needs doing? One sentence starts a run. You watch
 * it happen here, and it asks you nothing unless it must."* — is real, live,
 * auto-drives with no click, polls the transcript at 500ms, and carries the
 * character. **We built the right first screen and made it the side door**,
 * behind a rail label a new user has no reason to press.
 *
 * The comparison the mission asks for settles it: OpenAI, Anthropic, Perplexity
 * and Wispr Flow all open on ONE COMPOSER and produce visible work within
 * seconds of the first keystroke. We had that screen and hid it.
 *
 * REVERSIBLE IN ONE LINE, which is the whole point of this seam: set the value
 * back to `"/today"` and every door that means "the app's home" returns
 * together. Nothing else needs touching.
 */
export const SIGNED_IN_HOME = "/start" as const;

/**
 * THE ELEMENT ID THE REVIEW QUEUE CARRIES ON THE HOME SCREEN.
 *
 * ── THE RAIL'S ONLY COUNTED DOOR WAS A NO-OP (2026-09-01) ────────────────
 *
 * Measured signed in, on a workspace with 70 waiting calls: the rail's
 * **Approvals** row carries the hot `gates` count and points at `/today`;
 * `/today` throws a redirect to `SIGNED_IN_HOME`, which is `/start`; and the
 * board -- with the queue on it -- is already mounted on `/start`. So a person
 * looking at a badge reading **70** presses it and lands on the page they were
 * already standing on, roughly 1,400px above the thing the badge counts.
 * Nothing moves. Rail rows 1 and 2 resolve to one URL.
 *
 * THIS IS THE SAME FAULT TWICE, and the comment above the row says so about
 * its own predecessor: *"The home flip was half a change: it moved the landing
 * and left the signpost."* `/today` folding into `/start` moved the surface
 * and left the door. A fold is not finished until every door that pointed at
 * the folded surface points at the thing it folded INTO -- which for a section
 * means the section, not the top of the page.
 *
 * WHY AN ANCHOR RATHER THAN GIVING APPROVALS ITS OWN ROUTE BACK. `/approvals`
 * still exists, is 904 lines, and is unreachable from the rail. Pointing the
 * row there would restore a working door and reintroduce the defect this whole
 * phase is about: two surfaces answering one question, drifting apart. The
 * queue lives on the home now -- same filters, same j/k/a/d keys, same
 * optimistic settle -- so the honest door scrolls to it.
 */
export const REVIEW_QUEUE_ANCHOR = "review-queue" as const;

/**
 * The search flag that asks the home to bring the review queue into view.
 * Carried by `/today`'s redirect so the rail row needs no edit and keeps both
 * its `owns` highlighting and its `g o` chord.
 */
export const REVIEW_QUEUE_SEARCH = "queue" as const;
