import { wordFor } from "@/lib/spine/chain";
import { joinPlainly } from "@/lib/spine/attach";
import { foldedCount, prepFor } from "@/components/track/versions-of-one-thing";

/**
 * WHAT A STATION PRODUCED, AS ONE SENTENCE, IN THE STRIP'S SHAPE.
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
 *
 * ── WHERE IT IS READ NOW (2026-09-08) ─────────────────────────────────────
 * The pane's own line above the cards is `what-it-made.ts`, which leads with
 * the product in the station's noun ("Released to production.") and puts what
 * was attached after it, fainter. This sentence keeps the strip's shape,
 * "Plan filed 1 spec and 2 prototypes", which Start's row is pinned to agree
 * with clause for clause (`the-row-and-the-strip-agree-on-what-was-produced`),
 * and `station-outcome.ts` hands it to the map and the strip.
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
   * COUNTED BY KIND, IN THE ORDER THEY WERE FILED, WITH REPEATS FOLDED.
   *
   * ── A COUNT THAT FLATTERS A STUCK LOOP, CAUGHT ON THE LIVE CANDIDATE ─────
   * `d2263583` reached Decide on 2026-08-31 with 8 decisions, four of them
   * sharing one title, written in pairs a minute apart across two sweeps. A
   * bare "Decide filed 8 decisions." was true and the impression was false:
   * eight distinct calls is what a person infers, and one call re-made is what
   * happened.
   *
   * ── AND THE FIRST FIX CONFESSED WHERE IT SHOULD HAVE FOLDED (2026-09-08) ─
   * The next version appended "4 of them say the same thing." That names the
   * jam as a defect, and on a healthy run it is simply wrong: four prototypes
   * of one screen are one screen drawn four times, which is a fact worth
   * reading and not a fault. So repeats are folded into the thing they repeat,
   * through the same `foldedCount` the pane's rows and sentence use:
   *
   *     Decide filed 5 decisions (4 on Do not attribute ...).
   *     Design filed 4 prototypes of Relay Checkout Tablet - Address ...
   *
   * The count is still the count, so a jam still reads as one thing re-made,
   * and nothing on screen calls the record a mistake. Titles are compared
   * trimmed and case-folded, and untitled members are counted and never
   * compared: a finding carries no title, and keying on it would report every
   * finding as a repeat of every other.
   */
  const byKind = new Map<string, ProducedMember[]>();
  for (const m of present) byKind.set(m.kind, [...(byKind.get(m.kind) ?? []), m]);
  const parts = [...byKind].map(([kind, ms]) =>
    foldedCount(ms, wordFor(kind, ms.length), prepFor(kind)),
  );

  const head = `${stationLabel} filed ${joinPlainly(parts)}.`;
  if (gone === 0) return head;

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
  return `${head} ${tail}`;
}
