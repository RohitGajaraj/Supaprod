import { wordFor } from "@/lib/spine/chain";
import { joinPlainly } from "@/lib/spine/attach";

/**
 * WHAT A STATION PRODUCED, AS ONE SENTENCE, ABOVE THE THINGS IT PRODUCED.
 *
 * Gap #28: *"what a station produced, as one readable sentence in the run, with
 * the file behind a 'take this' control. No frontmatter, no filename, no
 * section headings on screen"* (§4.1, `RANKED-BACKLOG.md`).
 *
 * ── THE ASYMMETRY THIS CLOSES, WHICH IS WHY IT IS NOT DECORATION ──────────
 * `StationPanel` already speaks when a station produced NOTHING —
 * *"Plan ran and filed no spec."* — and says nothing at all when it produced
 * something, dropping the reader straight into cards. So the run could tell you
 * about absence and not about presence, and the person §11 describes (someone
 * accountable for an outcome who is not doing the work) had to count cards to
 * learn what a step had done. **This is the other half of a sentence that
 * already exists.**
 *
 * ── IT REUSES THE ONE VOCABULARY RATHER THAN NAMING ANYTHING ITSELF ───────
 * `wordFor` (`spine/chain.ts`) and `joinPlainly` (`spine/attach.ts`) are the
 * same two helpers the chain's own whole-run sentence is built from, so a
 * "changeset" is a **code change** here exactly as it is everywhere else. **No
 * new noun is invented in this file**, which is the rule §12 states and the
 * rule F-150 was filed for: one idea, one word, or the rename is worse than the
 * drift.
 *
 * ── AND WHY IT IS PER STATION AND NOT PER RUN ─────────────────────────────
 * `chain.ts:330-346` already composes the whole-run version. Repeating it in
 * the station panel would be the three-copies-of-one-fact defect `run-status.ts`
 * records paying for. The panel is scoped to ONE stop, so its sentence is about
 * that stop and the chain keeps the total.
 */

export type ProducedMember = {
  kind: string;
  /** True only when the lookup RAN and the row was not there. */
  missing: boolean;
  /** The artifact's own title. Null when its row could not be found. */
  title?: string | null;
};

/**
 * The sentence, or null when there is nothing honest to say.
 *
 * NULL RATHER THAN A CHEERFUL EMPTY, because `StationPanel` already owns the
 * empty case and says it better than this could: it names the noun the station
 * was supposed to file, and it defers to the hold line when the hold already
 * said it. A second sentence here would contradict or repeat it, and both are
 * worse than silence.
 */
export function whatItProduced(
  stationLabel: string,
  members: readonly ProducedMember[],
): string | null {
  const present = members.filter((m) => !m.missing);
  const gone = members.length - present.length;
  if (present.length === 0) return null;

  /*
   * COUNTED BY KIND, IN THE ORDER THEY WERE FILED. A station that drafted its
   * prototype five times filed five prototypes, and that is a fact worth
   * reading rather than a duplicate to hide -- the same call `chain.ts` makes
   * for the whole run, and the opposite of `station-file.ts`'s, which dedupes
   * because a document repeating one paragraph five times is unreadable while a
   * count is not.
   */
  const counts = new Map<string, number>();
  for (const m of present) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1);
  const parts = [...counts].map(([kind, n]) => `${n} ${wordFor(kind, n)}`);

  const head = `${stationLabel} filed ${joinPlainly(parts)}.`;

  /*
   * ── A COUNT THAT FLATTERS A STUCK LOOP, CAUGHT ON THE LIVE CANDIDATE ─────
   * RUN-128 shipped this counting repeats deliberately: *"a station that
   * drafted its prototype five times filed five, and that is a fact worth
   * reading."* That holds for a prototype. **It is wrong when the repeats are
   * the same thing**, and the acceptance candidate proved it.
   *
   * `d2263583` reached Decide on 2026-08-31 with **8 decisions: 1 approved and
   * 7 declined**, four of them sharing one title, written in pairs about a
   * minute apart at 14:00, 14:01, 15:40 and 15:41. The station is re-deciding
   * one thing across sweeps, which is why it holds `nothing-to-hand-on`.
   *
   * On screen my sentence read **"Decide filed 8 decisions."** while the same
   * decline title rendered **fifteen times** below it. **The count was true and
   * the impression was false**: eight distinct calls is what a person infers,
   * and one call re-made seven times is what happened. A sentence that makes a
   * jammed station look productive is worse than no sentence.
   *
   * So repeats are COUNTED and then NAMED. Not deduped away -- how many times a
   * station filed the same thing is the fact that reveals the jam, and hiding
   * it would swap one wrong impression for another. `station-file.ts` reached
   * the same shape from the other direction and says `(filed n times)`.
   */
  const byTitle = new Map<string, number>();
  for (const m of present) {
    const t = (m.title ?? "").trim().toLowerCase();
    if (t) byTitle.set(t, (byTitle.get(t) ?? 0) + 1);
  }
  const repeated = [...byTitle.values()].filter((n) => n > 1);
  const repeats = repeated.reduce((a, b) => a + b, 0);
  const sameAgain =
    repeats > 1
      ? repeated.length === 1
        ? ` ${repeats} of them say the same thing.`
        : ` ${repeats} of them repeat ${repeated.length} things already filed.`
      : "";

  if (gone === 0) return `${head}${sameAgain}`;

  /*
   * A MEMBER THE LOOKUP MISSED IS SAID, NOT SUBTRACTED. `missing` means the row
   * was looked for and was not there, which is a fact about this work rather
   * than about our reading, and the chain already refuses to hide those. A
   * count that quietly excluded them would report a smaller, tidier station
   * than the one that exists.
   */
  const tail =
    gone === 1
      ? "One more no longer resolves to anything we can show."
      : `${gone} more no longer resolve to anything we can show.`;
  return `${head}${sameAgain} ${tail}`;
}
