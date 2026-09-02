/**
 * P-18 (A-QUEUE.md): "The strip and the row print the same sentence for the
 * same track."
 *
 * TWO SURFACES, ONE UNDERLYING FACT. `startRowMiddle` (`tracks-feed.ts`) is
 * Start's row -- a whole-track roll-up, every kind the track ever filed,
 * counted. `whatItProduced` (`components/track/what-it-produced.ts`) is the
 * run screen's own per-STATION sentence in `ArtifactPane` -- what one stop
 * filed. Different scopes (a track can visit several stations), but for a
 * track that produced everything from exactly ONE station, the two describe
 * the identical set of artifacts and must not disagree on how many of a kind
 * is worth naming or how the list reads out loud.
 *
 * Before this packet they did: `startRowMiddle` dropped the leading count for
 * a single item ("Produced spec" for one) and joined with a bare comma
 * ("2 specs, 1 decision"), while `whatItProduced` always states the count and
 * joins with `joinPlainly` ("2 specs and 1 decision") -- the same convention
 * `describeAttachments` and the chain's own whole-run sentence already use.
 * Both now share that convention; this pins it so a future edit to either
 * cannot quietly reopen the drift.
 */
import { describe, it, expect } from "bun:test";
import { startRowMiddle, type StartRowInput } from "./tracks-feed";
import { whatItProduced, type ProducedMember } from "@/components/track/what-it-produced";
import { KIND_WORD } from "@/lib/spine/attach";

const NOW = Date.parse("2026-09-03T00:00:00Z");

const row = (produced: Array<{ kind: string; count: number }>): StartRowInput => ({
  id: "t-1",
  title: "Cut the sign-up form from nine fields to four",
  status: "done",
  stationName: "Plan",
  updatedAt: "2026-09-02T23:00:00Z",
  drivenAt: "2026-09-02T22:59:00Z",
  holdReason: null,
  holdBecause: null,
  working: null,
  needsYou: null,
  produced,
});

/** Expands `{kind,count}` pairs into individually-titled members, the shape
 *  `whatItProduced` reads -- one member per artifact, not a pre-counted map,
 *  because that map is exactly what the two implementations must agree on
 *  building the same way. */
function membersFor(produced: Array<{ kind: string; count: number }>): ProducedMember[] {
  const out: ProducedMember[] = [];
  for (const { kind, count } of produced) {
    for (let i = 0; i < count; i++) {
      out.push({ kind, missing: false, title: `${kind} ${i + 1}` });
    }
  }
  return out;
}

describe("Start's row and the run screen's strip say the same thing about what a track produced", () => {
  it("a single kind, count one: both state the number", () => {
    const produced = [{ kind: "prd", count: 1 }];
    const rowSentence = startRowMiddle(row(produced), NOW, KIND_WORD, () => null);
    const stripSentence = whatItProduced("Plan", membersFor(produced));

    expect(rowSentence).toBe("Produced 1 spec");
    expect(stripSentence).toBe("Plan filed 1 spec.");
  });

  it("two kinds: both count, name and join them the same way", () => {
    const produced = [
      { kind: "prd", count: 1 },
      { kind: "prototype", count: 2 },
    ];
    const rowSentence = startRowMiddle(row(produced), NOW, KIND_WORD, () => null);
    const stripSentence = whatItProduced("Plan", membersFor(produced));

    // Strip apart the frame ("Produced " / "Plan filed " ... ".") to compare
    // only the counted-and-joined clause both build independently -- that
    // clause, not the surrounding sentence, is what this packet unifies.
    const rowClause = rowSentence.replace(/^Produced /, "");
    const stripClause = stripSentence.replace(/^Plan filed /, "").replace(/\.$/, "");

    expect(rowClause).toBe(stripClause);
    expect(rowClause).toBe("1 spec and 2 prototypes");
  });

  it("three kinds: the join still agrees past two items", () => {
    const produced = [
      { kind: "prd", count: 1 },
      { kind: "prototype", count: 2 },
      { kind: "decision", count: 3 },
    ];
    const rowClause = startRowMiddle(row(produced), NOW, KIND_WORD, () => null).replace(
      /^Produced /,
      "",
    );
    const stripClause = whatItProduced("Plan", membersFor(produced))
      .replace(/^Plan filed /, "")
      .replace(/\.$/, "");

    expect(rowClause).toBe(stripClause);
  });
});
