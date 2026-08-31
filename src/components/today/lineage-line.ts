/**
 * WHAT PRODUCED THIS, AND WHAT IT FED — as one line a person can read.
 *
 * §0.5: *"Every object shows, in place: what produced it, and what it feeds.
 * That is one line on each, clickable."* I shipped the **clickable** half
 * (`CameFrom`) and stopped, because `getLineageGraph` resolves one entity per
 * call and a line on 34 rows meant 34 round trips.
 *
 * ── TWO CORRECTIONS SINCE, AND BOTH CHANGE THE ANSWER ─────────────────────
 * **S0 built the batch reader** — `getLineageCounts`, `{kind, ids[]}` in, a
 * count per id out, one call.
 *
 * **And S4 corrected the premise I stopped on: there is no live N+1 today.**
 * `AuditTag` does not fetch at all. So the reason I gave for shipping half was
 * true of a design nobody had built. **The open item was never performance — it
 * was that the line is missing.**
 *
 * ── THE LINE GOES INTO THE CONTROL THAT IS ALREADY THERE ──────────────────
 * Not a second element beside it. The row's under-line already carries one
 * quiet control, and §0.5 asks for *one line, clickable* rather than a line and
 * a link. So the same control says more when the data is there and keeps its
 * plain invitation when it is not.
 */
import type { LineageCounts } from "@/lib/lineage-graph";

/** The words on the control, given what the batch read said about this row. */
export function lineageLine(counts: LineageCounts | undefined | null): string {
  /*
   * UNKNOWN AND ZERO ARE DIFFERENT AND THIS IS WHERE THEY DIVERGE.
   *
   * `undefined`/`null` means the read failed or has not answered — the batch
   * result's own contract says `counts: null` is a FAILED read and never a
   * board with no lineage (F-76). So the control falls back to its plain
   * invitation, which asks a question rather than answering one. **It must
   * never say "came from 0", because that is a claim we cannot support.**
   */
  if (!counts) return "Where this came from";

  const { producedBy, fed, seededExcluded } = counts;

  if (producedBy > 0 && fed > 0) return `Came from ${producedBy} · led to ${fed}`;
  if (producedBy > 0) return `Came from ${producedBy}`;
  if (fed > 0) return `Led to ${fed}`;

  /*
   * NOTHING LIVE, BUT SOMETHING SEEDED. S4 named this and the reader keeps the
   * two apart on purpose: `producedBy 0, fed 0, seededExcluded 4` and a flat
   * `0, 0, 0` are different facts and **only one of them is a gap in the
   * product.** A row whose only links are demo fixtures should say so rather
   * than read as unconnected work.
   */
  if (seededExcluded > 0) return "Only demo links";

  /*
   * Genuinely nothing, and the control still invites. Saying "came from 0" here
   * would be true and useless; the question is the more useful sentence and it
   * is the one this control shipped with.
   */
  return "Where this came from";
}

/**
 * The ids worth asking about, deduplicated and bounded.
 *
 * **`getLineageCounts` caps at 200** and a board can hold more rows than that
 * across three lanes. Slicing here rather than letting the server reject the
 * whole call means a long board still gets counts on the rows a person is
 * actually looking at, instead of none at all — the same choice the board's own
 * lanes already make when they show the first rows and name the overflow.
 */
export function lineageIds(ids: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const id of ids) {
    if (typeof id === "string" && id.length > 0) seen.add(id);
    if (seen.size >= 200) break;
  }
  return [...seen];
}
