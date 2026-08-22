import { describe, it, expect } from "bun:test";
import {
  findRestatement,
  isFoldable,
  observationFingerprint,
  RESTATEMENT_THRESHOLD,
  type StoredObservation,
} from "./restatement";
import { THEME_ATTACH_THRESHOLD } from "@/lib/ai/theme-growth";

const MODEL = "cohere/embed-v4.0";

/**
 * A unit vector pair with an EXACT cosine similarity.
 *
 * The similarities asserted below are not invented: they were measured on the live
 * database with pgvector, over the thirteen rows of the 2026-08-22 incident and their
 * neighbours. Reproducing them exactly in two dimensions tests the decision this file
 * actually makes - where the threshold falls relative to real distances - without
 * pinning 1536 floats into a test file, where nobody could check them and any drift in
 * the embedding model would turn them into confident nonsense.
 */
function pairAtSimilarity(s: number): { a: number[]; b: number[] } {
  return { a: [1, 0], b: [s, Math.sqrt(1 - s * s)] };
}

function stored(over: Partial<StoredObservation> = {}): StoredObservation {
  return {
    id: "sig-1",
    title: "Pro users want CSV export",
    content: "Several Pro customers asked for a CSV export of their invoices.",
    embedding: null,
    embeddingModel: MODEL,
    ...over,
  };
}

// ── The incident's own text, copied from public.signals ──────────────────────
// Each sentence was stored BOTH in full and as the 120-character truncation
// `signals.log` derives when the caller supplies no title. Four distinct texts,
// thirteen rows.
const A_FULL =
  "Users, particularly those in EU timezones, experience significant delays (4-12 hours) in getting responses to simple Tier-1 support requests. This leads to poor customer satisfaction and high time-to-resolution.";
const A_TRUNC = A_FULL.slice(0, 120);
const B_FULL =
  "Users in EU regions face critical delays of up to 12 hours for Tier-1 support, indicating a lack of follow-the-sun coverage and driving negative sentiment regarding resolution times.";
const B_TRUNC = B_FULL.slice(0, 120);

describe("observationFingerprint", () => {
  it("treats re-wrapped and re-cased text as the same observation", () => {
    expect(observationFingerprint("Slow  Support", "Users\nwait 12 hours.")).toBe(
      observationFingerprint("slow support", "Users wait 12 hours"),
    );
  });

  it("keys on title AND content, so two truncations that share an opening stay apart", () => {
    // These titles are auto-derived truncations, so a title-only key would collide
    // them and destroy one. That would be worse than the bug being fixed.
    const shared = "Users in EU regions face critical delays";
    expect(observationFingerprint(shared, "Support is slow.")).not.toBe(
      observationFingerprint(shared, "Billing is broken."),
    );
  });

  it("does not merge texts that differ only in interior punctuation", () => {
    // Normalization stops at case, whitespace and terminal punctuation. Anything
    // beyond a literal match is the vector rule's job.
    expect(observationFingerprint("t", "we cannot, ship")).not.toBe(
      observationFingerprint("t", "we cannot ship"),
    );
  });
});

describe("findRestatement - the text rule", () => {
  it("folds a byte-identical copy without needing a vector at all", () => {
    const window = [stored({ id: "a1", title: A_TRUNC, content: A_FULL, embedding: null })];
    const match = findRestatement({ title: A_TRUNC, content: A_FULL }, window);
    expect(match).toEqual({ ofId: "a1", rule: "text", similarity: 1 });
  });

  it("catches 9 of the incident's 13 rows on text alone", () => {
    // A-full x3, A-trunc x4, B-full x3, B-trunc x3 = 13 rows, 4 distinct texts.
    const thirteen = [
      [A_TRUNC, A_FULL],
      [A_TRUNC, A_FULL],
      [A_TRUNC, A_FULL],
      [A_TRUNC, A_TRUNC],
      [A_TRUNC, A_TRUNC],
      [A_TRUNC, A_TRUNC],
      [A_TRUNC, A_TRUNC],
      [B_TRUNC, B_FULL],
      [B_TRUNC, B_FULL],
      [B_TRUNC, B_FULL],
      [B_TRUNC, B_TRUNC],
      [B_TRUNC, B_TRUNC],
      [B_TRUNC, B_TRUNC],
    ];
    const kept: StoredObservation[] = [];
    let folded = 0;
    for (const [title, content] of thirteen) {
      if (findRestatement({ title, content }, kept)) folded++;
      else kept.push(stored({ id: `k${kept.length}`, title, content, embedding: null }));
    }
    expect(folded).toBe(9);
    expect(kept).toHaveLength(4);
  });
});

describe("findRestatement - the vector rule, against measured distances", () => {
  it("folds the truncation pair the text rule cannot see (measured 0.8682)", () => {
    const { a, b } = pairAtSimilarity(0.8682);
    const window = [stored({ id: "a-full", title: A_TRUNC, content: A_FULL, embedding: b })];
    const match = findRestatement(
      { title: A_TRUNC, content: A_TRUNC, embedding: a, embeddingModel: MODEL },
      window,
    );
    expect(match?.ofId).toBe("a-full");
    expect(match?.rule).toBe("vector");
  });

  it("folds the other truncation pair (measured 0.9359)", () => {
    const { a, b } = pairAtSimilarity(0.9359);
    const window = [stored({ id: "b-full", title: B_TRUNC, content: B_FULL, embedding: b })];
    expect(
      findRestatement(
        { title: B_TRUNC, content: B_TRUNC, embedding: a, embeddingModel: MODEL },
        window,
      )?.ofId,
    ).toBe("b-full");
  });

  it("does NOT fold the two sentences into each other (measured 0.7300)", () => {
    // They describe one problem in different words and each carries a fact the other
    // does not. Deciding whether that is one subject is the theme layer's job, and
    // the sink must not pre-empt it by deleting a row.
    const { a, b } = pairAtSimilarity(0.73);
    const window = [stored({ id: "b", title: B_TRUNC, content: B_FULL, embedding: b })];
    expect(
      findRestatement(
        { title: A_TRUNC, content: A_FULL, embedding: a, embeddingModel: MODEL },
        window,
      ),
    ).toBeNull();
  });

  it("does NOT fold the nearest genuinely different signal (measured 0.6525)", () => {
    const { a, b } = pairAtSimilarity(0.6525);
    const window = [stored({ id: "other", embedding: b })];
    expect(
      findRestatement(
        { title: A_TRUNC, content: A_FULL, embedding: a, embeddingModel: MODEL },
        window,
      ),
    ).toBeNull();
  });

  it("returns the CLOSEST match, not the first one over the line", () => {
    const near = pairAtSimilarity(0.87);
    const nearer = pairAtSimilarity(0.97);
    const window = [
      stored({ id: "further", title: "x", content: "x", embedding: near.b }),
      stored({ id: "closer", title: "y", content: "y", embedding: nearer.b }),
    ];
    expect(
      findRestatement(
        { title: "z", content: "z", embedding: near.a, embeddingModel: MODEL },
        window,
      )?.ofId,
    ).toBe("closer");
  });

  it("an exact text match outranks a closer vector match", () => {
    const nearer = pairAtSimilarity(0.99);
    const window = [
      stored({ id: "vector-hit", title: "y", content: "y", embedding: nearer.b }),
      stored({ id: "text-hit", title: "z", content: "z", embedding: null }),
    ];
    const match = findRestatement(
      { title: "z", content: "z", embedding: nearer.a, embeddingModel: MODEL },
      window,
    );
    expect(match?.ofId).toBe("text-hit");
    expect(match?.rule).toBe("text");
  });
});

describe("findRestatement - the guards that stop it destroying evidence", () => {
  it("refuses to compare across embedding models", () => {
    // Two vector spaces in one column make cosine arithmetic without meaning. A
    // mismatch must yield nothing rather than confident nonsense.
    const { a, b } = pairAtSimilarity(0.99);
    const window = [stored({ id: "other-space", embedding: b, embeddingModel: "openai/other" })];
    expect(
      findRestatement({ title: "t", content: "c", embedding: a, embeddingModel: MODEL }, window),
    ).toBeNull();
  });

  it("degrades to the text rule when the candidate has no vector", () => {
    // attachEmbeddings is fail-open, so this is a real state, not a corner case.
    const { b } = pairAtSimilarity(0.99);
    const window = [stored({ id: "s", title: "x", content: "y", embedding: b })];
    expect(findRestatement({ title: "t", content: "c" }, window)).toBeNull();
    expect(findRestatement({ title: "x", content: "y" }, window)?.rule).toBe("text");
  });

  it("skips a stored row whose vector is missing or malformed rather than treating it as distance zero", () => {
    const { a } = pairAtSimilarity(0.99);
    const window = [
      stored({ id: "no-vec", title: "x", content: "x", embedding: null }),
      stored({ id: "bad-vec", title: "y", content: "y", embedding: "not-a-vector" }),
    ];
    expect(
      findRestatement({ title: "t", content: "c", embedding: a, embeddingModel: MODEL }, window),
    ).toBeNull();
  });

  it("returns nothing against an empty window", () => {
    const { a } = pairAtSimilarity(0.99);
    expect(
      findRestatement({ title: "t", content: "c", embedding: a, embeddingModel: MODEL }, []),
    ).toBeNull();
  });
});

describe("isFoldable - corroboration versus self-repetition", () => {
  it("never folds a candidate that names a distinct real-world item", () => {
    // Two Intercom conversations saying the same words are two customers. The
    // producer's assertion outranks any similarity score.
    expect(isFoldable({ externalId: "intercom:conv:1" })).toBe(false);
  });

  it("folds a candidate that cannot name where it came from", () => {
    expect(isFoldable({ externalId: null })).toBe(true);
    expect(isFoldable({})).toBe(true);
  });
});

describe("the threshold itself", () => {
  it("is strictly above the theme-attach bar", () => {
    // The sink decides "same statement" and destroys a row; the theme layer decides
    // "same subject" and a human can undo it. A sink bar at or below the theme bar
    // would silently pre-empt the clustering decisions themes exist to make.
    expect(RESTATEMENT_THRESHOLD).toBeGreaterThan(THEME_ATTACH_THRESHOLD);
  });

  it("sits between the closest restatement and the furthest thing that is not one", () => {
    expect(RESTATEMENT_THRESHOLD).toBeLessThanOrEqual(0.8682); // must catch
    expect(RESTATEMENT_THRESHOLD).toBeGreaterThan(0.73); // must not catch
  });
});
