import { describe, expect, test } from "bun:test";
import type { CriticReview } from "@/lib/discovery.functions";
import { verdictFor, type VerdictWord } from "./format";
import {
  nextActionFor,
  rankOpportunities,
  verdictRankOf,
  type RankableOpportunity,
} from "./ranking";

/**
 * discover/format x discover/ranking: the SEAM, not the two sides of it.
 *
 * format.test.ts pins what `verdictFor` returns. ranking.test.ts pins what
 * `verdictRankOf` does with a word it is handed directly. Neither pins the
 * COMPOSITION, and the composition is the Discover queue: a row's position comes
 * from `verdictRankOf(verdictFor(row))`, a value no unit case on either side ever
 * computes. So a `verdictFor` change can move a row from the top of the queue to
 * the bottom while both suites stay green.
 *
 * The specific hole those two suites leave, and the reason this file exists:
 * `verdictFor` decides the Critic's word BEFORE it looks at the lane status, and
 * format.test.ts only ever pins that precedence for combinations that agree with
 * it (`next` + kill, `now` + revise). The combinations where the two genuinely
 * FIGHT are pinned nowhere: a `dropped` row the Critic endorsed, and a `shipped`
 * row the Critic sent back. Those are exactly the rows whose queue position
 * flips if someone decides a lane status should win, and today nothing notices.
 *
 * Every fixture below is named so the id tie-break (the comparator's last
 * resort) would produce the OPPOSITE of the expected order. A test whose ids
 * happen to sort the right way passes even when the verdict layer is dead;
 * these fail.
 */

/** A full, valid CriticReview. Only `verdict` matters to the seam. */
function critic(verdict: "ship" | "revise" | "kill"): CriticReview {
  return {
    verdict,
    summary: "",
    risks: [],
    kill_criteria: [],
    missing_evidence: [],
    confidence: 0,
    reviewer_model: "test",
    reviewed_at: "2026-01-01T00:00:00Z",
  };
}

/**
 * A rankable row tied to every other row on every discriminator EXCEPT the two
 * the verdict is derived from. Whatever order comes out is therefore the
 * format-to-ranking seam's doing and nothing else's.
 */
function row(
  id: string,
  status: string,
  critic_review: CriticReview | null = null,
): RankableOpportunity {
  return {
    id,
    status,
    critic_review,
    ice_score: 5,
    confidence: 5,
    impact: 5,
    ease: 5,
    created_at: "2026-01-01T00:00:00Z",
  };
}

const noCorr = () => 0;

/** The queue as a person reads it, top first. */
function queue(rows: RankableOpportunity[]): string[] {
  return rankOpportunities(rows, noCorr).map((r) => r.opp.id);
}

/** The six values `opportunities.status` can actually hold (discovery.functions.ts). */
const REAL_STATUSES = ["backlog", "now", "next", "later", "shipped", "dropped"] as const;

describe("format -> ranking: the verdict a row is given decides where it sits", () => {
  test("the whole real status set orders by verdict, against the id tie-break", () => {
    // Ids ascend a..g while the expected order does not, so this cannot pass on
    // the finalizer alone: if the verdict layer stopped discriminating, the
    // output would be a,b,c,d,e,f,g.
    const rows = [
      row("a-dropped", "dropped"), // KILL
      row("b-revise", "backlog", critic("revise")), // REVISE
      row("c-backlog", "backlog"), // PENDING
      row("d-later", "later"), // WATCH
      row("e-next", "next"), // WATCH
      row("f-shipped", "shipped"), // SHIP
      row("g-now", "now"), // SHIP
    ];
    expect(queue(rows)).toEqual([
      "f-shipped",
      "g-now", // SHIP tier, then id asc within it
      "d-later",
      "e-next", // WATCH tier
      "c-backlog", // PENDING
      "b-revise", // REVISE
      "a-dropped", // KILL
    ]);
  });

  test("a dropped row the Critic ENDORSED still leads the queue", () => {
    // The Critic's word beats the lane status in `verdictFor`, so this row is a
    // SHIP and outranks an unreviewed one. Decide the lane wins instead and it
    // becomes a KILL and falls to the bottom: a queue reorder from a two-line
    // change in format.ts. Neither unit suite covers this pair.
    const rows = [
      row("a-backlog-unreviewed", "backlog"), // PENDING
      row("z-dropped-but-endorsed", "dropped", critic("ship")), // SHIP
    ];
    expect(queue(rows)).toEqual(["z-dropped-but-endorsed", "a-backlog-unreviewed"]);
  });

  test("a shipped row the Critic SENT BACK sinks below an unreviewed one", () => {
    // The same precedence read from the other direction. `shipped` alone is a
    // SHIP; a revise verdict on it makes it a REVISE, which ranks below even a
    // bet nobody has looked at.
    const rows = [
      row("a-shipped-but-revise", "shipped", critic("revise")), // REVISE
      row("z-backlog-plain", "backlog"), // PENDING
    ];
    expect(queue(rows)).toEqual(["z-backlog-plain", "a-shipped-but-revise"]);
  });

  test("two rows reaching the same verdict by different routes rank as one tier", () => {
    // `now` reaches SHIP through the status branch, `backlog` + critic ship
    // through the Critic branch. The queue must not be able to tell them apart:
    // they are one tier, and the unreviewed row sits below both.
    const rows = [
      row("m-unreviewed", "backlog"), // PENDING
      row("a-ship-via-status", "now"), // SHIP
      row("z-ship-via-critic", "backlog", critic("ship")), // SHIP
    ];
    expect(queue(rows)).toEqual(["a-ship-via-status", "z-ship-via-critic", "m-unreviewed"]);
  });
});

describe("format -> ranking: the words on a row agree with its position", () => {
  test("the recommended action follows the format verdict, not the raw status", () => {
    // Same verdict by two different routes must produce the same advice. If
    // `verdictFor` ever routes one of these elsewhere, the row keeps its place
    // in the queue but is told to do something different, which is the version
    // of this bug a person actually notices.
    expect(nextActionFor(row("via-status", "now"))).toBe(
      nextActionFor(row("via-critic", "backlog", critic("ship"))),
    );
    expect(nextActionFor(row("via-status", "dropped"))).toBe(
      nextActionFor(row("via-critic", "backlog", critic("kill"))),
    );
  });

  test("the rationale names the verdict the ranking actually used", () => {
    // rationaleFor and the sort read `verdictFor` separately. A row placed in
    // the KILL tier that reads as endorsed (or the reverse) is the two calls
    // having disagreed.
    const ranked = rankOpportunities(
      [row("endorsed", "backlog", critic("ship")), row("rejected", "backlog", critic("kill"))],
      noCorr,
    );
    expect(ranked[0].opp.id).toBe("endorsed");
    expect(ranked[0].rationale).toContain("endorsed");
    expect(ranked[1].opp.id).toBe("rejected");
    expect(ranked[1].rationale).toContain("kill");
  });
});

describe("format -> ranking: every word format can emit is a word ranking can score", () => {
  test("no real row scores undefined (an unrankable word poisons the sort silently)", () => {
    // `verdictRankOf` is an exhaustive switch with no default, so a word it does
    // not know returns undefined, every comparison becomes NaN, and the queue
    // quietly falls back to input order instead of throwing. Walk the whole
    // real input space and prove the two domains still meet.
    const criticValues: (CriticReview | null)[] = [
      null,
      critic("ship"),
      critic("revise"),
      critic("kill"),
    ];
    for (const status of REAL_STATUSES) {
      for (const review of criticValues) {
        const word: VerdictWord = verdictFor(row("x", status, review));
        const rank = verdictRankOf(word);
        expect(Number.isFinite(rank)).toBe(true);
      }
    }
  });

  test("the ladder over the real statuses is strictly SHIP > WATCH > PENDING > KILL", () => {
    // The composed value, computed the way the sort computes it. Collapsing two
    // of these tiers in format.ts merges two lanes of the queue into one.
    const rank = (status: string) => verdictRankOf(verdictFor(row("x", status)));
    expect(rank("now")).toBe(rank("shipped"));
    expect(rank("next")).toBe(rank("later"));
    expect(rank("now")).toBeGreaterThan(rank("next"));
    expect(rank("next")).toBeGreaterThan(rank("backlog"));
    expect(rank("backlog")).toBeGreaterThan(rank("dropped"));
  });
});
