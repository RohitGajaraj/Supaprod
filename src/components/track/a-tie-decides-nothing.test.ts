/**
 * ── AN ATTACHMENT TIME IS NOT A FILING TIME ──────────────────────────────────
 *
 * `ArtifactView.createdAt` is `spine_track_members.created_at`: when the LOOP
 * attached the artifact, not when the station filed it. The driver attaches a
 * station's whole output in one write, so siblings share it to the microsecond.
 *
 * MEASURED ON PRODUCTION 2026-09-10, before the change: 1,155 of 1,522
 * un-superseded track members share that timestamp with a sibling of the same
 * kind on the same track, across 313 groups and 55 tracks. The tie is the
 * norm, not the edge. On `6cc7a010` two drawings tie at `02:20:46.9056` and
 * were filed 29 seconds apart, one carrying a file and 827 characters, the
 * other no files and 182.
 *
 * So "the newest drawing" was decided by whichever row won a tie, and the
 * change line under each version was computed against whichever neighbour did.
 * `filedAt` is the artifact's own `created_at` and settles it.
 */
import { describe, expect, it } from "bun:test";
import { newestArtifactAt } from "./run-journey";
import type { AgentStation } from "@/lib/agent-vocabulary";

const ATTACHED = "2026-09-04T02:20:46.905600Z";

/** The three drawings of `6cc7a010`, with their real timestamps. */
const items = [
  {
    kind: "prototype",
    artifactId: "aa884e5b",
    missing: false,
    createdAt: "2026-09-04T02:21:42.926121Z",
    filedAt: "2026-09-04T02:21:17.183127Z",
  },
  {
    kind: "prototype",
    artifactId: "161e1663",
    missing: false,
    createdAt: ATTACHED,
    filedAt: "2026-09-04T02:20:37.416790Z",
  },
  {
    kind: "prototype",
    artifactId: "9de19b1a",
    missing: false,
    createdAt: ATTACHED,
    filedAt: "2026-09-04T02:20:08.417563Z",
  },
];

const stopsWith = (list: typeof items) =>
  [{ station: "design" as AgentStation, items: list }] as unknown as Parameters<
    typeof newestArtifactAt
  >[0];

describe("a tie decides nothing, so the filing time decides", () => {
  it("names the drawing that was filed last, not the one that won the tie", () => {
    expect(newestArtifactAt(stopsWith(items), "design" as AgentStation)).toBe("aa884e5b");
  });

  it("separates the two that share an attachment timestamp to the microsecond", () => {
    // Only the tied pair, in the order that would have made the older one win.
    const tied = [items[2]!, items[1]!];
    expect(items[1]!.createdAt).toBe(items[2]!.createdAt);
    expect(newestArtifactAt(stopsWith(tied), "design" as AgentStation)).toBe("161e1663");
    // And the reverse input order gives the same answer, which is the whole
    // point: with equal keys the sort was free to return either.
    expect(newestArtifactAt(stopsWith([items[1]!, items[2]!]), "design" as AgentStation)).toBe(
      "161e1663",
    );
  });

  /*
   * THE MIRROR (law 12). "It uses filedAt" would pass just as well if it used
   * ONLY filedAt, and an artifact whose row could not be read has none: it
   * would sort as NaN and drop out of the ordering entirely. The fallback is
   * asserted in the same breath.
   */
  it("falls back to the attachment time when the artifact's own row was unreadable", () => {
    /*
     * THE OLDER ONE IS FIRST IN THE LIST ON PURPOSE, and this test was wrong
     * until it was. `Date.parse(null ?? "")` is NaN, a comparator returning NaN
     * leaves `sort` free to keep the order it was given, and the assertion then
     * passed on the input order rather than on the fallback. Putting the
     * expected winner SECOND is what makes a broken fallback fail: with no
     * ordering it would return the first item.
     */
    const partial = [
      { ...items[1]!, filedAt: null },
      { ...items[0]!, filedAt: null },
    ];
    expect(newestArtifactAt(stopsWith(partial), "design" as AgentStation)).toBe("aa884e5b");
  });

  it("still ignores an artifact whose row is missing", () => {
    const withMissing = [{ ...items[0]!, missing: true }, items[1]!];
    expect(newestArtifactAt(stopsWith(withMissing), "design" as AgentStation)).toBe("161e1663");
  });
});
