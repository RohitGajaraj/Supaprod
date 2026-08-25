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
 * Nothing observable changes until the value below changes.
 */
export const SIGNED_IN_HOME = "/today" as const;
