import { describe, expect, it } from "bun:test";
import {
  countByTerm,
  evidenceLine,
  NO_EVIDENCE_READ,
  searchTermsFor,
} from "./what-the-evidence-already-says";

/**
 * WHAT THE WORKSPACE ALREADY HOLDS, ASKED BEFORE THE WORK STARTS (F-184).
 *
 * Measured on three real candidates on one workspace, and the discriminator is
 * one query. Single-word: **address 76 · password 1 · outage 57.** Through this
 * module's own tokeniser, which is broader: **94 · 8 · 69.** The one that scored
 * lowest
 * spent three completed runs and three attempts for all three Discover seats to
 * report, correctly, that there was nothing there.
 */
describe("what the evidence already says", () => {
  it("pulls the subject words out of a real candidate title", () => {
    const terms = searchTermsFor(
      "The red tile after an over-the-air reboot looks exactly like a real outage, so a homeowner cannot tell them apart",
    );
    expect(terms).toContain("reboot");
    expect(terms).toContain("outage");
    // "the", "after", "an", "so", "a", "cannot" are noise; "red" and "air" are
    // under four characters. None of them discriminates anything.
    expect(terms).not.toContain("the");
    expect(terms).not.toContain("after");
    expect(terms).not.toContain("cannot");
  });

  it("drops the product words that appear in almost every subject here", () => {
    // `homeowner` is in a majority of this workspace's own signal titles, so
    // matching on it would return most of the corpus for any subject — a count
    // that matches everything is worse than none, because it reads as comfort.
    expect(searchTermsFor("A homeowner cannot reset their password")).not.toContain("homeowner");
    expect(searchTermsFor("A homeowner cannot reset their password")).toContain("password");
  });

  it("never emits a character that could change the filter's shape", () => {
    // The server builds one PostgREST `.or()` from these. `%` and `,` are the
    // only characters that alter it, and the tokeniser emits [a-z0-9] only.
    for (const t of searchTermsFor('Payments, 50% failures; drop-offs & "quotes" (parens)')) {
      expect(t).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("is bounded, so one pathological title cannot build a hundred clauses", () => {
    const long = Array.from({ length: 60 }, (_, i) => `distinctword${i}`).join(" ");
    expect(searchTermsFor(long).length).toBeLessThanOrEqual(12);
  });

  it("leads with the BREAKDOWN, because the total is the number that flatters", () => {
    /*
     * MEASURED AGAINST THE THREE LIVE CANDIDATES, and this is why the shape
     * changed after it was first built. The any-term totals are
     * **address 94 · password 8 · outage 69** — it discriminates, and yet the
     * subject with NO evidence scores EIGHT, because `email`, `account`,
     * `reset` and `link` match things unrelated to password resets.
     * "8 things mention this" would reassure a person about noise.
     * Broken out it reads `password 1 · email 5 · account 2` and the truth is
     * legible at a glance. A total can flatter; a breakdown cannot.
     */
    const line = evidenceLine({
      count: 8,
      sources: ["agent"],
      byTerm: [
        { term: "email", count: 5 },
        { term: "account", count: 2 },
        { term: "password", count: 1 },
      ],
    });
    expect(line).toContain("email 5");
    expect(line).toContain("password 1");
  });

  it("counts each term exactly, over one read rather than N queries", () => {
    const rows = [
      { title: "Outage confusion", content: "the reboot looks like an outage" },
      { title: null, content: "another outage report" },
      { title: "Tile colour", content: null },
    ];
    expect(countByTerm(["outage", "reboot", "tile"], rows)).toEqual([
      { term: "outage", count: 2 },
      { term: "reboot", count: 1 },
      { term: "tile", count: 1 },
    ]);
  });

  it("says a failed read differently from zero evidence", () => {
    // The whole point. `count: 0` is a CLAIM about the workspace; a database
    // error is not that claim, and rendering one as the other would put the
    // sentence that killed 060bc5ff in front of someone with plenty of evidence.
    expect(evidenceLine(NO_EVIDENCE_READ)).toContain("could not check");
    expect(evidenceLine({ count: 0, sources: [], terms: ["password"] })).toContain(
      "Nothing in this",
    );
  });

  it("makes zero an invitation rather than a rebuke, and never a refusal", () => {
    const line = evidenceLine({ count: 0, sources: [], byTerm: [], agentAuthored: 0 });
    // A subject the evidence is silent on may be exactly what someone wants
    // investigated. The door tells; it must never block.
    expect(line).toContain("start it anyway");
    expect(line).not.toMatch(/cannot start|not allowed|blocked/i);
  });

  it("names where the evidence came from, because a bare number is not evidence", () => {
    const line = evidenceLine({
      count: 57,
      sources: ["NPS survey", "agent", "support agent report"],
      byTerm: [
        { term: "outage", count: 41 },
        { term: "reboot", count: 12 },
      ],
    });
    expect(line).toContain("outage 41");
    expect(line).toContain("NPS survey");
  });

  it("names what the loop wrote itself when that is most of it", () => {
    // 63% of the whole table is source='agent' (940 of 1,499), because the
    // 2026-08-25 description rewrite flipped the INFLOW and nothing drained the
    // POOL. A bare count flatters a subject the product has only talked to
    // itself about, so the door says so.
    const line = evidenceLine({
      count: 57,
      sources: ["agent"],
      byTerm: [{ term: "outage", count: 41 }],
      agentAuthored: 38,
    });
    expect(line).toContain("38 of 57 were written by the loop itself");
  });

  it("stays quiet about authorship when the evidence is mostly external", () => {
    const line = evidenceLine({
      count: 57,
      sources: ["NPS survey"],
      byTerm: [{ term: "outage", count: 41 }],
      agentAuthored: 3,
    });
    expect(line).not.toContain("written by the loop");
  });

  it("still says something when the terms matched loosely and none by name", () => {
    // The odd case: rows matched the OR but no single term appears in any of
    // them, which a truncated read can produce. Say the weaker thing rather than
    // printing an empty breakdown as though it were a finding.
    const line = evidenceLine({
      count: 3,
      sources: ["agent"],
      byTerm: [{ term: "x", count: 0 }],
      agentAuthored: 0,
    });
    expect(line).toContain("loosely match");
  });
});
