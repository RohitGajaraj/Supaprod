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

/*
 * THE REVIEW QUEUE ANCHOR AND ITS `?queue` FLAG ARE GONE (third review,
 * 2026-09-08). They dated from the fold that put the queue on the home
 * (2026-09-01); the queue moved back to Inbox (`/approvals`, its own rail
 * row), the home stopped reading the flag, and two doors kept sending people
 * to the top of the home under a label naming the retired Today. Calls are
 * settled in Inbox; a door to them says so and goes there.
 */
