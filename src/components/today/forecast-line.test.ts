import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { gradedLine, ungradedAlone, ungradedLine, worthDrawing } from "./forecast-line";

/**
 * THE TRACK RECORD MUST NOT HIDE ITS OWN DENOMINATOR.
 *
 * "Your forecasts came true 1 of 2 times" over a workspace with 15 forecasts
 * past their date is a record built from two of seventeen, and the reader could
 * not tell. Worse, the whole band was gated on there being a graded forecast,
 * so a workspace that had made fifteen and graded none saw nothing at all.
 */

const s = (o: Partial<Parameters<typeof gradedLine>[0]>) => ({
  resolved: null,
  hits: null,
  ungraded: null,
  ...o,
});

describe("gradedLine", () => {
  it("states raw counts, never a rate", () => {
    // "50%" from two samples is a statistical claim the data cannot carry.
    expect(gradedLine(s({ resolved: 2, hits: 1 }))).toBe("Your forecasts came true 1 of 2 times.");
  });

  it("SAYS NOTHING on zero graded, because 0 of 0 is not a track record", () => {
    expect(gradedLine(s({ resolved: 0, hits: 0 }))).toBeNull();
  });

  it("says nothing while the read has not answered", () => {
    expect(gradedLine(s({ resolved: null, hits: null }))).toBeNull();
  });
});

describe("ungradedLine", () => {
  it("names what is still waiting on a verdict", () => {
    expect(ungradedLine(s({ ungraded: 15 }))).toBe(
      "15 more are past their date and nobody has said which way.",
    );
  });

  it("agrees with itself about one", () => {
    expect(ungradedLine(s({ ungraded: 1 }))).toBe(
      "1 more is past its date and nobody has said which way.",
    );
  });

  it("SILENT ON ZERO AND ON UNKNOWN, which are different reasons for one silence", () => {
    expect(ungradedLine(s({ ungraded: 0 }))).toBeNull();
    expect(ungradedLine(s({ ungraded: null }))).toBeNull();
  });
});

describe("ungradedAlone", () => {
  it('DROPS "more" WHEN THERE IS NO FIRST SENTENCE FOR IT TO REFER TO', () => {
    // The exact case the old guard hid: forecasts made, none graded.
    expect(ungradedAlone(s({ ungraded: 15 }))).toBe(
      "15 forecasts are past their date and nobody has said which way.",
    );
    expect(ungradedAlone(s({ ungraded: 1 }))).toBe(
      "One forecast is past its date and nobody has said which way.",
    );
  });
});

describe("worthDrawing", () => {
  it("DRAWS ON THE UNGRADED BACKLOG ALONE, which the old guard did not", () => {
    // A workspace with 15 forecasts and none graded saw no forecast line at
    // all - the moat invisible exactly when it needed a person.
    expect(worthDrawing(s({ resolved: 0, hits: 0, ungraded: 15 }))).toBe(true);
  });

  it("draws on a graded record alone", () => {
    expect(worthDrawing(s({ resolved: 2, hits: 1, ungraded: 0 }))).toBe(true);
  });

  it("stays away when there is neither", () => {
    expect(worthDrawing(s({ resolved: 0, hits: 0, ungraded: 0 }))).toBe(false);
    expect(worthDrawing(s({}))).toBe(false);
  });
});

describe("the board is wired to it", () => {
  const SRC = readFileSync("src/routes/_authenticated.today.tsx", "utf8");

  it("NO LONGER GATES THE BAND ON A GRADED FORECAST", () => {
    // The old guard was `calibration?.prediction.resolved`, which hid the whole
    // band from a workspace that had made forecasts and graded none.
    expect(SRC).toContain("{worthDrawing(standing) ? (");
    expect(SRC).not.toContain("{calibration?.prediction.resolved ? (");
  });

  it("takes the POPULATION for the ungraded count, never the page", () => {
    expect(SRC).toContain("ungraded: dueForecasts.data?.total ?? null");
    expect(SRC).not.toContain("dueForecasts.data?.due.length");
  });

  it("ASKS THE WORKSPACE QUESTION, not the desk's", () => {
    /*
     * The defect this pins shut was mine and shipped for one commit.
     * `getForecastCalibration` resolves `current_user_default_workspace` and
     * counts ONE workspace. `listDueForecasts` deliberately does not filter at
     * all - the desk's scope is "every call anywhere that needs settling".
     *
     * Pairing them put two populations behind one sentence:
     *
     *     "Your forecasts came true 1 of 2 times.   <- this workspace
     *      2 more are past their date..."            <- every workspace
     *
     * Both numbers true, one sentence, no seam a reader could see.
     */
    expect(SRC).toContain("listDueForecastsHere");
    expect(SRC).not.toContain("useServerFn(listDueForecasts)");
  });

  it("KEYS IT SEPARATELY FROM THE DESK, so one cache entry cannot answer both", () => {
    // Sharing `["forecast-due"]` would let whichever surface mounted first
    // decide what the other saw.
    expect(SRC).toContain('queryKey: ["forecast-due", "workspace"]');
  });

  it("and the station strip asks the same scoped question", () => {
    // Every station on that strip counts this workspace's runs, so a
    // cross-workspace badge beside them means something else in the same words.
    const strip = readFileSync("src/components/shell/use-spine-strip.ts", "utf8");
    expect(strip).toContain("listDueForecastsHere");
    expect(strip).toContain('queryKey: ["forecast-due", "workspace"]');
  });

  it("keeps each half null until its own read answers", () => {
    // A record assembled from one answered read and one outstanding one would
    // state a denominator it does not have yet.
    expect(SRC).toContain("resolved: calibration?.prediction.resolved ?? null");
    expect(SRC).toContain("hits: calibration?.prediction.hits ?? null");
  });
});
