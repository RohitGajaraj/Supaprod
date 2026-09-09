/**
 * "4 VERSIONS" IS A COUNT. WHAT CHANGED BETWEEN THEM IS THE ANSWER.
 *
 * ── WHERE THIS PICKS UP ────────────────────────────────────────────────────
 * `versions-of-one-thing.ts` closed the first half of this on 2026-09-08: four
 * rows sharing one title are ONE thing filed four times, so the pane folds them
 * and the row says "prototype · 4 versions". That was right and it stopped one
 * step short — a person opening the fold still meets four rows with the same
 * title and, on this data, often the same clock, and nothing on the screen says
 * whether any of them differ.
 *
 * ── WHAT THE ROWS ACTUALLY ARE, MEASURED 2026-09-09 ────────────────────────
 * Across every prototype filed on a track on production: 59 members, 36
 * distinct bodies. **Twenty-three of fifty-nine are byte-identical to another
 * version of the same thing.** On track `ce846e9b` the run screen counts "10
 * prototypes"; there are three designs behind them.
 *
 * The pattern is not random. Read on `ce846e9b`, one fold, four versions:
 *
 *   21:40:15  Yellow (#FFC107), circular arrow (rotating), "Updating firmware"
 *   21:40:34  identical, nineteen seconds later
 *   22:00:21  Red (#D32F2F), clock icon (static), "Scheduled firmware update"
 *   22:00:39  identical, eighteen seconds later
 *
 * Every design is filed twice, and between the pairs sits the one real event —
 * the design critic refused yellow as a violation of the standing colour
 * hierarchy and the surface was redrawn in red. **That revision is the entire
 * story of this run's Design station and no surface in the product told it.**
 * Four rows, one title, two facts between them.
 *
 * ── SO A VERSION ROW SAYS ONE OF TWO THINGS ────────────────────────────────
 * Identical to its neighbour, or what changed. The first is the high-value case
 * because it is 39% of these rows and because a product that presents ten
 * copies as ten pieces of work is inflating its own output — which is the
 * founder's "I cannot feel the value" stated precisely.
 *
 * ── AND IT COMPARES AGAINST THE VERSION AFTER IT, NOT THE NEWEST ───────────
 * A fold is a sequence, not a set. "Identical to the newest" would be false of
 * the 21:40 pair above (they differ from 22:00) while completely missing that
 * they are copies of each other. Each row is scored against its own successor,
 * so a run of duplicates reads as a run of duplicates and a revision shows up
 * exactly once, on the row where it happened.
 *
 * Pure and dependency-free; the pane holds the bodies already (`ArtifactView.
 * fields`, which `getTrackArtifacts` returns) and hands them in.
 */

/** What one version is, relative to the version filed after it. */
export type VersionChange =
  /** Byte-for-byte the same once whitespace is normalised. */
  | { kind: "same" }
  /** Different, with the size of the difference and the first line of it. */
  | { kind: "changed"; lines: number; from: string | null }
  /**
   * One or both bodies are absent, so nothing can be said.
   *
   * NOT collapsed into "changed", which would be the surface claiming a
   * revision it never saw — the same fail direction `getTrackChain` takes for
   * `missing`, where a failed lookup must never render as a deleted artifact.
   */
  | { kind: "unknown" };

/** The longest cut of a quoted fragment. Beyond this a row stops scanning. */
export const QUOTE_CAP = 64;

/**
 * The comparable lines of a body: trimmed, blanks dropped, case kept.
 *
 * Case is KEPT because these bodies are design specifications and their case is
 * load-bearing — `#FFC107` and `#ffc107` are the same colour but "PRODUCTION
 * OUTAGE TILE" and "OTA FIRMWARE REBOOT TILE" are the section headings a reader
 * navigates by. Only whitespace is normalised, which is the difference between
 * two rows being the same and merely looking it.
 */
export function bodyLines(body: string | null | undefined): string[] {
  if (!body) return [];
  return body
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** A line whose job is to introduce the lines under it, not to state a value. */
function isHeading(line: string): boolean {
  return line.endsWith(":");
}

/**
 * How one version differs from the one filed after it.
 *
 * ── LINES, NOT WORDS, AND THAT IS THE MEASUREMENT NOT THE CONVENIENCE ──────
 * A word diff over the real pair above reports about forty tokens moved, which
 * is true and tells a reader nothing they can hold. These bodies are written as
 * lists — one attribute per line, "- Color: Yellow (#FFC107)" — so a line IS
 * one design decision, and "6 lines changed" is a count of decisions revised.
 *
 * The quoted fragment is a line present in the older and absent from the newer:
 * the thing that was taken away. That is the more useful half for a reader
 * scanning a revision — what the design stopped being — and it is always
 * concrete, because it is a line somebody wrote rather than a summary of one.
 *
 * ── BUT NOT SIMPLY THE FIRST ONE, AND THE TEST CAUGHT THAT ────────────────
 * First-in-document-order was the first build and it quoted, on the real pair,
 * *"2. OTA FIRMWARE REBOOT TILE (new):"* — the section heading, which changed
 * to "(revised):" as a side effect of the revision and says nothing about it.
 * The line a reader wants is *"- Color: Yellow (#FFC107)"*, two lines down.
 *
 * A heading is recognisable without knowing anything about designs: it ENDS in
 * a colon, because its job is to introduce the lines under it rather than to
 * state a value. So a heading is passed over while any other changed line
 * remains, and taken only when it is all there is — which keeps the rule
 * general (it holds for a spec, a PRD or any list-shaped body) and keeps the
 * function honest when a heading really is the only thing that moved.
 */

export function whatChanged(
  older: string | null | undefined,
  newer: string | null | undefined,
): VersionChange {
  const a = bodyLines(older);
  const b = bodyLines(newer);
  // Nothing to compare is not "no change": one of them was never read.
  if (a.length === 0 || b.length === 0) return { kind: "unknown" };
  if (a.join("\n") === b.join("\n")) return { kind: "same" };

  const inNewer = new Set(b);
  const gone = a.filter((l) => !inNewer.has(l));
  const inOlder = new Set(a);
  const arrived = b.filter((l) => !inOlder.has(l));
  /* The size of the revision, not the sum of both sides: a line rewritten
     counts once in each list and a person reads that as one change, not two. */
  const lines = Math.max(gone.length, arrived.length);

  const first = gone.find((l) => !isHeading(l)) ?? gone[0] ?? null;
  const from =
    first && first.length > QUOTE_CAP ? `${first.slice(0, QUOTE_CAP).trimEnd()}...` : first;
  return { kind: "changed", lines, from };
}

/**
 * The change as the one line that sits under a version row, or null for a row
 * that has nothing to add.
 *
 * `unknown` returns NULL rather than a sentence. A row that cannot be compared
 * is the ordinary case for every artifact kind whose card carries no body, and
 * "we could not compare these" on a hundred rows is noise that would bury the
 * "Identical" it sits beside — the same rule the transcript's chips follow.
 */
export function changeLine(c: VersionChange): string | null {
  if (c.kind === "unknown") return null;
  if (c.kind === "same") return "Identical to the version after it.";
  const n = `${c.lines} ${c.lines === 1 ? "line" : "lines"} changed`;
  return c.from ? `${n}, from “${c.from}”` : `${n}.`;
}

/**
 * How many of a fold's versions are repeats of another, readable CLOSED.
 *
 * ── THE COUNT ON THE CLOSED ROW IS THE ONE THAT CHANGES A MIND ────────────
 * Everything above this is drawn inside the disclosure, which most people
 * never open. The row they DO see says "prototype · 4 versions", and four
 * versions sounds like four pieces of work. On `ce846e9b` it is two designs
 * filed twice each, and the run screen's own chip counts all ten copies as ten
 * prototypes. A person cannot feel the value of work that is being counted at
 * triple, and they should not have to open a fold to find that out.
 *
 * Returns null when fewer than two bodies are readable, which is the honest
 * silence: most artifact kinds carry no body, and a fold that cannot compare
 * its versions must not imply they are distinct any more than it may imply
 * they are the same.
 */
export function foldRepeats(bodies: ReadonlyArray<string | null | undefined>): number | null {
  const readable = bodies.map((b) => bodyLines(b).join("\n")).filter((b) => b.length > 0);
  if (readable.length < 2) return null;
  /* Against the WHOLE fold rather than against neighbours: two copies filed an
     hour apart with a revision between them are still two copies of one thing,
     and a person counting what was made counts things, not runs of things. */
  return readable.length - new Set(readable).size;
}

/**
 * The version count as the closed row should say it.
 *
 * The plain count when nothing repeats or nothing can be compared, so a healthy
 * fold is unchanged and gains no decoration. `repeats` is appended only when it
 * DISCRIMINATES, which is the rule the transcript's chips and the run strip
 * both follow.
 */
export function versionsLabel(word: string, versions: number, repeats: number | null): string {
  const base = `${word} · ${versions} versions`;
  if (!repeats) return base;
  return `${base}, ${repeats} the same`;
}
