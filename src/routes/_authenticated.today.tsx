import { createFileRoute, redirect } from "@tanstack/react-router";

import { REVIEW_QUEUE_SEARCH, SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

/**
 * `/today` HAS FOLDED INTO THE HOME. THE URL SURVIVES AS AN ALIAS.
 *
 * ── THE RULING, AND IT TOOK THREE ANSWERS TO GET RIGHT ────────────────────
 * F-144/145/146 is the founder's own report: he lands on `/start`, reads
 * **Today** at the top of the rail as the place he is supposed to be, presses
 * it, and arrives at the surface the 2026-08-25 home flip existed to get him
 * out of. `RANKED-BACKLOG` §T1-S2 rules one primary door with the board folded
 * into it — *"a rename leaves two doors and moves the confusion"* — and
 * `SURFACE-MAP` now marks this route **FOLD → the home**.
 *
 * **I read that fold the other way round first** and proposed making `/today`
 * the home. S0's ruling A01 corrected it, precisely: `/today` is NAMED in the
 * list of routes that fold, and **a route cannot be both the thing folded and
 * the thing folded into.** The *"'Today' becomes an honest name for it"* line
 * is about the WORD on the door, which the same ruling hands to the founder in
 * the next sentence. `SIGNED_IN_HOME` stays `/start`.
 *
 * ── WHY THE BODY IS GONE BUT THE FILE IS NOT ─────────────────────────────
 * The surface itself is `src/components/today/Board.tsx`, lifted out whole on
 * 2026-08-31 and now rendered by S1 on `/start` under the composer. **Nothing
 * about the board changed in either move** — the lift was not a rewrite and
 * this is not a deletion.
 *
 * **The URL stays**, on the pattern A-005 and A-006 set for `/runs`: an alias
 * keeps every caller, bookmark and pasted link working with no edit, which is
 * the whole reason the ten earlier folds could ship without a sweep. A stub IS
 * the fold; deleting it would trade eleven lines for a 404.
 *
 * ── THE ORDER THIS SHIPPED IN, BECAUSE IT IS THE RULING'S OWN ACCEPTANCE ──
 * A07: **the mount and the flip land together or not at all.** A `/today` that
 * redirects to a home not yet drawing the board sends a person wanting the
 * review queue to a composer with nothing under it; a board mounted while this
 * route still served the old one gives two live boards reading the same
 * queries. **Either half alone is a regression.** S1's mount and this flip are
 * two commits on two branches taken to `main` in one merge, so `main` never
 * holds a half-state.
 */
/*
 * ── THE REDIRECT NOW CARRIES THE PERSON TO THE QUEUE, NOT TO THE TOP ──────
 *
 * WHAT THIS ROUTE ACTUALLY DID FOR A WEEK. The rail's **Approvals** row -- the
 * only row in the rail carrying a count -- points here, and this threw the
 * person at `/start`. The board is mounted on `/start`, so the surface was
 * right and the position was not: measured signed in with 70 waiting calls,
 * the queue sits ~1,400px below the fold. A person pressed a badge reading
 * **70** and arrived at a page they were already on, with nothing moved and no
 * indication anything had happened.
 *
 * `_authenticated.tsx`'s own comment names this exact failure mode about the
 * previous flip: *"The home flip was half a change: it moved the landing and
 * left the signpost."* This is the same half-change one level down. A fold is
 * finished when the doors point at the SECTION, not at the page that now
 * contains it.
 *
 * The flag is carried here rather than on the rail row deliberately: the row
 * keeps `to: "/today"`, so its `owns` highlighting and its `g o` chord are
 * untouched and no second literal has to agree with this one.
 */
export const Route = createFileRoute("/_authenticated/today")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME, search: { [REVIEW_QUEUE_SEARCH]: true } });
  },
});
