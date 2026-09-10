import { describe, expect, it } from "bun:test";
import { absencesLead, absencesSub, foldAbsences } from "./four-absences-are-one-line";

type Line = {
  key: string;
  lead: string;
  sub: string;
  door?: "outcomes";
  absent?: { noun: string; act: string };
};

const make = (lead: string, sub: string, folded: readonly Line[]): Line => ({
  key: "not-yet",
  lead,
  sub,
  door: folded.find((f) => f.door)?.door,
});

/** The four lines `/outcomes` composed on production, in order. */
const PRODUCTION: Line[] = [
  {
    key: "read-back",
    lead: "118 of 137 lessons on the record have gone back into a later run.",
    sub: "Each one is written into the agent's prompt before it acts, not looked up afterwards.",
  },
  {
    key: "rated",
    lead: "None of that has been rated yet.",
    sub: "Rate one run and every lesson it leaned on moves up or down in what the crew reads next.",
    absent: { noun: "rated", act: "Rate one run." },
  },
  {
    key: "rescored",
    lead: "No outcome has moved a decision's priority yet.",
    sub: "Record what a shipped bet actually did, and the ranking it came from moves with it.",
    door: "outcomes",
    absent: { noun: "re-ranked", act: "Record what a shipped bet actually did." },
  },
  {
    key: "forecast",
    lead: "No forecast has been graded yet.",
    sub: "When a forecast on the record passes its date, the outcome marks it true or false, and the score starts here.",
    absent: { noun: "graded", act: "A forecast grades itself once its date passes." },
  },
];

describe("absencesLead", () => {
  it("reads as one English sentence at three", () => {
    expect(absencesLead(["rated", "re-ranked", "graded"])).toBe(
      "Nothing has been rated, re-ranked or graded yet.",
    );
  });

  it("and at two, and at one", () => {
    expect(absencesLead(["rated", "graded"])).toBe("Nothing has been rated or graded yet.");
    expect(absencesLead(["graded"])).toBe("Nothing has been graded yet.");
  });

  it("joins the acts with a space and nothing else", () => {
    // They are already sentences. A separator between them would be a second
    // punctuation system inside one line.
    expect(absencesSub(["Rate one run.", "A forecast grades itself."])).toBe(
      "Rate one run. A forecast grades itself.",
    );
  });
});

describe("foldAbsences on the four lines production drew", () => {
  const out = foldAbsences(PRODUCTION, make);

  it("spends one line where three were spent", () => {
    expect(out).toHaveLength(2);
    expect(out.map((l) => l.key)).toEqual(["read-back", "not-yet"]);
  });

  it("leaves what HAPPENED untouched and first", () => {
    expect(out[0]!.key).toBe("read-back");
    expect(out[0]!.lead).toBe("118 of 137 lessons on the record have gone back into a later run.");
  });

  it("loses no noun and no act", () => {
    expect(out[1]!.lead).toBe("Nothing has been rated, re-ranked or graded yet.");
    for (const act of [
      "Rate one run.",
      "Record what a shipped bet actually did.",
      "A forecast grades itself once its date passes.",
    ]) {
      expect(out[1]!.sub).toContain(act);
    }
  });

  it("carries the one door through, because it is the region's only control", () => {
    expect(out[1]!.door).toBe("outcomes");
  });

  it("is shorter than what it replaced, which is the whole point", () => {
    /* The four strings are verbatim from `guidanceLines`. 381 characters of
       admission became 149, and the assertion is against a third rather than
       against 149 so that rewording the acts does not fail a test about
       length. Anything approaching the old total means the fold has stopped
       folding. */
    const before = PRODUCTION.filter((l) => l.absent)
      .map((l) => `${l.lead} ${l.sub}`)
      .join(" ").length;
    const after = `${out[1]!.lead} ${out[1]!.sub}`.length;
    expect(before).toBeGreaterThan(380);
    expect(after).toBeLessThan(before / 2);
  });
});

describe("and it refuses to fire where folding would lose", () => {
  it("leaves a single admission exactly as it was", () => {
    const one = [PRODUCTION[0]!, PRODUCTION[2]!];
    expect(foldAbsences(one, make)).toEqual(one);
  });

  it("leaves a region with no admission at all alone", () => {
    expect(foldAbsences([PRODUCTION[0]!], make)).toEqual([PRODUCTION[0]!]);
    expect(foldAbsences([], make)).toEqual([]);
  });

  it("does not mutate what it was given", () => {
    const input = [...PRODUCTION];
    foldAbsences(input, make);
    expect(input).toHaveLength(4);
    expect(input.map((l) => l.key)).toEqual(["read-back", "rated", "rescored", "forecast"]);
  });

  it("can never collapse a line reporting something that happened", () => {
    /*
     * The safety property, and the reason the partition moved off a regex on
     * the lead: only a line carrying `absent` is foldable, and only a branch
     * that is admitting an absence sets it. A positive line whose sentence
     * happened to start "No" was previously folded to the bottom by
     * `/^(No |None )/`, and would now have been folded away entirely.
     */
    const trap: Line[] = [
      { key: "a", lead: "No fewer than 4 outcomes re-scored a decision.", sub: "..." },
      { key: "b", lead: "None of the lessons went stale.", sub: "..." },
      PRODUCTION[1]!,
      PRODUCTION[2]!,
    ];
    const out = foldAbsences(trap, make);
    expect(out.map((l) => l.key)).toEqual(["a", "b", "not-yet"]);
  });
});
