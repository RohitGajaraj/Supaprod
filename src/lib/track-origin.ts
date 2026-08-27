/**
 * WHAT THE ORIGIN ADDS TO THE TITLE, OR NOTHING.
 *
 * ── THE DEFECT, IN TWO LAYERS, FOUND BY S1 ─────────────────────────────────
 * A track carries a `title` and an `origin`, and two places print both. The run
 * header printed the title and then the origin one line below it; the mission
 * goal composes them into one sentence at `driver.server.ts`:
 *
 *   goal: row.origin ? `${row.title}. ${row.origin}` : row.title
 *
 * When a track's origin IS its title, that renders the sentence, a full stop,
 * and the sentence again. Live on `6199f3df`: *"The saved address dropdown shows
 * deleted addresses after a customer removes one. The saved address dropdown
 * shows deleted addresses after a customer removes one"*, stored that way in
 * `missions.goal` rather than doubled at render time.
 *
 * ── SMALL TODAY AND GROWING, WHICH IS WHY IT IS WORTH A MODULE ─────────────
 * Measured across both populations 2026-08-27: 1 of 106 tracks has an origin
 * character-identical to its title and 3 more begin with the title and add to
 * it; downstream, 2 of 397 missions with a goal repeat themselves. Those numbers
 * are low only because most existing tracks were seeded another way. **The
 * sentence a person types at `/start` becomes both the title and the origin**,
 * so exact-match is the natural result of the newest way to start work.
 *
 * ── THE RULE THIS IS MOST AT RISK OF GETTING WRONG ─────────────────────────
 * A rule written to remove duplication is one edit away from removing the thing
 * worth reading, and **nobody files a bug about a good line going missing.** So
 * an origin that carries its own fact is returned untouched, always, and the
 * test suite leads with a real one: *"This became work on its own because 9
 * signals say it, severity 4, and the cluster is 78% confident these belong
 * together"*. Only a prefix that is literally the title is removed.
 *
 * Pure and IO-free: the server composes the goal with it, the run header renders
 * with it, and both say the same thing about the same pair of strings.
 */

/**
 * Below this, what remains after the title is a scrap rather than a fact.
 *
 * Named rather than inlined because it is a judgement and should be arguable.
 * The failure it prevents is a line reading *"...one."* under the sentence it
 * came from, which is worse than showing nothing: it looks like a truncation
 * bug and it teaches the reader that the second line is noise.
 */
export const ORIGIN_REMAINDER_MIN = 15;

/**
 * Punctuation and space that only joined the title to what followed it.
 *
 * ESCAPED, NOT LITERAL, and I got this wrong an hour after being warned about
 * it. S1 hit the identical defect in RUN-67 and told me so in the same message
 * that reported the bug this file fixes: *"a matcher needs to recognise the
 * characters it strips, not contain them."* I then wrote the literal characters
 * into this class anyway.
 *
 * It is not pedantry. The founder's standing instruction is that no em or en
 * dash reaches anything user-facing, and a scanner that greps the source cannot
 * tell a dash being MATCHED from a dash being PRINTED. So a literal here spends
 * the guard's credibility: either it reports a hit nobody should act on, or
 * somebody widens the guard to allow this shape and the real ones get through.
 */
const JOINER = /^[\s.,;:\u2014\u2013-]+/;

const squash = (s: string) => s.trim().replace(/\s+/g, " ");

/**
 * What the origin adds, or null when it adds nothing.
 *
 * Returns the origin UNCHANGED unless it literally starts with the title, so a
 * merely similar origin, a paraphrase, or one that happens to share an opening
 * clause all survive whole. The comparison is case-insensitive and
 * whitespace-normalised, because a title reflowed through a model round trip is
 * the same title.
 */
export function originLine(
  title: string | null | undefined,
  origin: string | null | undefined,
): string | null {
  const o = squash(origin ?? "");
  if (!o) return null;

  const t = squash(title ?? "");
  if (!t) return o;

  if (o.toLowerCase() === t.toLowerCase()) return null;
  if (!o.toLowerCase().startsWith(t.toLowerCase())) return o;

  const rest = o.slice(t.length).replace(JOINER, "").trim();
  return rest.length >= ORIGIN_REMAINDER_MIN ? rest : null;
}

/**
 * The one sentence a mission's goal should be.
 *
 * The composition lives here rather than at the call site so the rule and its
 * use cannot drift: anywhere that wants "the title, plus whatever the origin
 * actually adds" gets the same answer.
 */
export function trackGoalSentence(
  title: string | null | undefined,
  origin: string | null | undefined,
): string {
  const t = squash(title ?? "");
  const extra = originLine(t, origin);
  if (!extra) return t;
  /*
   * A MISSING TITLE MUST NOT PRODUCE A LEADING FULL STOP, which my first version
   * did: `${""}. ${extra}` renders ". something". Caught by the empty-title test
   * in this module's own suite, and worth a line rather than a silent guard,
   * because the whole point of this file is that a composed sentence should read
   * like one a person wrote.
   */
  return t ? `${t}. ${extra}` : extra;
}
