import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test, expect } from "bun:test";
import { whatLearnIsWaitingFor, onlyAPersonCanGradeThis } from "./what-learn-is-waiting-for";
import {
  whatLearnCanMeasure,
  whatWouldMeasure,
  type SourceState,
  type MetricClause,
} from "./what-would-measure-this";

const DUE = "2026-09-09T00:00:00+00:00";

const NO_SOURCE: SourceState = { kind: "named-never-run", oracle: "eval", ref: "a653a20b" };
const HAND: SourceState = {
  kind: "hand",
  reading: { value: 71, at: "2026-09-08T10:00:00Z", by: "founder" },
};
const CONNECTED: SourceState = { kind: "connected", oracle: "eval", ref: "x" };

describe("whatLearnIsWaitingFor", () => {
  test("names the gap when nothing can produce a number", () => {
    // The live state of the shipped track on 2026-09-04.
    const line = whatLearnIsWaitingFor(DUE, [NO_SOURCE, NO_SOURCE]);
    expect(line).toContain("comes due on 2026-09-09");
    expect(line).toContain("a source is connected or a reading is recorded");
    // The clause that made the old line a dead end must be gone.
    expect(line).not.toContain("nothing here is waiting on a person");
  });

  test("keeps the old sentence when every metric has a source", () => {
    const line = whatLearnIsWaitingFor(DUE, [CONNECTED, HAND]);
    expect(line).toContain("nothing here is waiting on a person");
    expect(line).not.toContain("reading is recorded");
  });

  test("a spec with no standing metric does NOT claim it cannot be graded", () => {
    // A decision carries its own observable independently of the contract, so
    // the absence of metrics is not evidence the forecast is ungradable. The
    // line says only what it knows.
    const line = whatLearnIsWaitingFor(DUE, []);
    expect(line).toContain("nothing here is waiting on a person");
    expect(line).not.toContain("cannot");
  });

  test("some-but-not-all is its own sentence and counts honestly", () => {
    const line = whatLearnIsWaitingFor(DUE, [HAND, NO_SOURCE, NO_SOURCE]);
    expect(line).toContain("1 of 3 success metrics");
    expect(line).not.toContain("nothing here is waiting on a person");
  });

  test("one metric reads as singular", () => {
    expect(whatLearnIsWaitingFor(DUE, [NO_SOURCE])).toContain("its success metric");
  });

  test("a hand reading is enough to lift the gap sentence", () => {
    // The whole point of the press P-137 put there.
    expect(whatLearnIsWaitingFor(DUE, [HAND])).toContain("nothing here is waiting on a person");
  });
});

describe("when the contract could not be read", () => {
  test("says the date and claims nothing about who is waited on", () => {
    // A failed read is not evidence that nobody is waited on. Falling back to
    // the old sentence would assert exactly that, on no information.
    const line = whatLearnIsWaitingFor(DUE, null);
    expect(line).toBe("The forecast this work is graded against comes due on 2026-09-09.");
    expect(line).not.toContain("waiting on a person");
    expect(line).not.toContain("nothing to grade");
  });

  test("and no caller draws a press off it", () => {
    expect(onlyAPersonCanGradeThis(null)).toBe(false);
  });
});

describe("the hold line and the spec sentence cannot disagree", () => {
  /**
   * The defect this packet exists for: two sentences on one screen, composed
   * from different facts, saying opposite things. They are now built from the
   * same `SourceState[]`, and this asserts they agree in every state rather
   * than asserting either one's wording.
   */
  const clause = (over: Partial<MetricClause>): MetricClause => ({
    status: "standing",
    text: "a metric",
    ...over,
  });

  const NONE = new Set<string>();

  test("both say ungradable when nothing measures anything", () => {
    const states = [
      whatWouldMeasure(clause({ oracle_kind: "eval", oracle_ref: "a" }), NONE),
      whatWouldMeasure(clause({ oracle_kind: "eval", oracle_ref: "b" }), NONE),
    ];
    const hold = whatLearnIsWaitingFor(DUE, states);
    const spec = whatLearnCanMeasure(states);

    expect(spec).toContain("cannot be graded yet");
    expect(hold).toContain("Learn will have nothing to grade it with");
    expect(hold).not.toContain("nothing here is waiting on a person");
    expect(onlyAPersonCanGradeThis(states)).toBe(true);
  });

  test("both go quiet once a reading exists", () => {
    const states = [
      whatWouldMeasure(
        clause({ readings: [{ value: 71, at: "2026-09-08T10:00:00Z", by: "founder" }] }),
        NONE,
      ),
    ];
    expect(whatLearnCanMeasure(states)).not.toContain("cannot be graded");
    expect(whatLearnIsWaitingFor(DUE, states)).toContain("nothing here is waiting on a person");
    expect(onlyAPersonCanGradeThis(states)).toBe(false);
  });

  test("neither treats a ci clause as a source", () => {
    const states = [whatWouldMeasure(clause({ oracle_kind: "ci" }), NONE)];
    expect(whatLearnCanMeasure(states)).toContain("cannot be graded yet");
    expect(whatLearnIsWaitingFor(DUE, states)).toContain("Learn will have nothing to grade it");
  });
});

describe("onlyAPersonCanGradeThis", () => {
  test("false when there is nothing to grade against at all", () => {
    // No metrics is not "a person is the only source"; it is a different fact,
    // and a caller drawing a press on it would put one where none belongs.
    expect(onlyAPersonCanGradeThis([])).toBe(false);
  });

  test("true only when metrics exist and none can produce a number", () => {
    expect(onlyAPersonCanGradeThis([NO_SOURCE])).toBe(true);
    expect(onlyAPersonCanGradeThis([NO_SOURCE, CONNECTED])).toBe(false);
  });
});

describe("the metric press offers only the door that works", () => {
  /**
   * P-137 shipped "Nothing is connected that could measure this" with two
   * presses: Record a reading, and Connect a source pointing at `/sync`.
   * `/sync` binds a connected account to a repo, a team or a channel; its own
   * header says it answers "connected to WHICH team". No path on it produces a
   * number for a success metric, so the second press could not change what the
   * sentence said. A person followed it, found nothing that applied, and came
   * back to the same screen.
   *
   * This reads the component's source because the defect is a rendered door,
   * and the requirement is about what is NOT offered. It is deliberately
   * narrow: it pins the metric block only, and Discover's own "Connect a
   * source" door lower in the same file is CORRECT -- that one connects the
   * signal ingestion `/sync` actually does -- and must keep working.
   */
  const src = readFileSync(
    join(import.meta.dir, "../../components/track/ArtifactPane.tsx"),
    "utf8",
  ) as string;

  const recordReading = src.slice(
    src.indexOf("function RecordReading("),
    src.indexOf("function SpecPromise("),
  );

  test("the metric press block offers no source door at all", () => {
    expect(recordReading).toContain("Record a reading");
    expect(recordReading).not.toContain("Connect a source");
    expect(recordReading).not.toContain('to="/sync"');
  });

  test("and Discover's source door is untouched", () => {
    // Proves the assertion above is narrow rather than the file having lost
    // every mention, which would pass it vacuously and break a working door.
    expect(src).toContain("Connect a source");
    expect(src).toContain('to="/sync"');
  });
});
