/**
 * The nine rows are the production reading; the rest are the cases that must
 * NOT fire, because a fold that fires when the column discriminates deletes
 * the fastest fact on the desk.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { everyDraftSays, theDraftEveryRowShares } from "./a-draft-on-every-row";
import { FORECAST_SAYS } from "./forecast-words";

const NINE = Array.from({ length: 9 }, () => FORECAST_SAYS.inconclusive);

describe("theDraftEveryRowShares", () => {
  it("catches the nine rows that ended in one string", () => {
    expect(theDraftEveryRowShares(NINE)).toBe("the evidence did not settle it");
  });

  it("stays quiet the moment one row drafted a different verdict", () => {
    const mixed = [...NINE.slice(0, 8), FORECAST_SAYS.hit];
    expect(theDraftEveryRowShares(mixed)).toBeNull();
  });

  it("stays quiet when one row has no draft at all", () => {
    // Presence is itself the discriminator here: "eight have been looked at
    // and one has not" is the thing a person opens the desk to see.
    expect(theDraftEveryRowShares([...NINE.slice(0, 8), null])).toBeNull();
    expect(theDraftEveryRowShares([null, ...NINE.slice(0, 8)])).toBeNull();
  });

  it("says nothing about a set that cannot repeat", () => {
    expect(theDraftEveryRowShares([])).toBeNull();
    expect(theDraftEveryRowShares([FORECAST_SAYS.miss])).toBeNull();
  });

  it("never treats a column of no drafts as a shared verdict", () => {
    expect(theDraftEveryRowShares([null, null, null])).toBeNull();
  });
});

describe("everyDraftSays", () => {
  it("carries the count, because the count is the fact", () => {
    expect(everyDraftSays(9, FORECAST_SAYS.inconclusive)).toBe(
      "An agent has drafted the same verdict on all 9: the evidence did not settle it. None is settled until you say so.",
    );
  });

  it("keeps the draft a draft", () => {
    // The desk's whole contract. A sentence that read as a verdict here would
    // make an agent's guess look like the record.
    expect(everyDraftSays(4, FORECAST_SAYS.hit)).toContain("drafted");
    expect(everyDraftSays(4, FORECAST_SAYS.hit)).toContain("None is settled until you say so.");
  });
});

describe("the desk is actually wired to it", () => {
  it("computes over the rendered set and drops the row value only then", () => {
    /*
     * Source-pinned rather than rendered: `ForecastDeskPanel` opens five
     * server functions, and this folder's neighbours already ruled that a
     * guard whose scaffolding is bigger than its subject is one nobody keeps.
     * What must not silently come apart is the PAIR: the sub says it only
     * when the rows stop saying it, and vice versa.
     */
    const src = readFileSync(
      fileURLToPath(new URL("./ForecastDeskPanel.tsx", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("const sharedDraft = theDraftEveryRowShares(");
    expect(src).toContain(
      "due.map((d) => (d.suggestion ? FORECAST_SAYS[d.suggestion.verdict] : null))",
    );
    expect(src).toContain("d.suggestion && !sharedDraft");
    expect(src).toContain("everyDraftSays(");
  });
});
