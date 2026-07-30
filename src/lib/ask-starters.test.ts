/**
 * The rule under test is not "it produces three prompts". It is that it would
 * rather produce NONE than produce one it cannot source.
 *
 * Founder ruling, 2026-07-30: the suggestions must "know the knowledge about
 * the product", and the corollary that matters more, because it is the one a
 * future change will be tempted to break: two true prompts beat six invented
 * ones. Ask's whole claim is that it answers from the workspace's own record,
 * so a fabricated run title in the first thing a person reads teaches them,
 * correctly, that the citations further down are decoration too.
 */
import { describe, test, expect } from "bun:test";
import {
  contextualStarters,
  marqueeRows,
  starterPrompts,
  starterStateIsKnownEmpty,
  type Starter,
  type StarterMission,
} from "./ask-starters";

const running = (title: string): StarterMission => ({
  title,
  status: "running",
  completed_at: null,
});
const done = (title: string, at: string): StarterMission => ({
  title,
  status: "completed",
  completed_at: at,
});

describe("ask-starters: no fact, no prompt", () => {
  test("a workspace with nothing in it gets nothing, never a generic line", () => {
    expect(starterPrompts({ missions: [] })).toEqual([]);
  });

  // A read that FAILED arrives as null, and is not an absence. Both produce no
  // prompts, but only one of them entitles the surface to say "nothing here".
  test("a failed read produces nothing, and does not read as empty", () => {
    expect(starterPrompts({ missions: null })).toEqual([]);
    expect(starterStateIsKnownEmpty({ missions: null })).toBe(false);
    expect(starterStateIsKnownEmpty({ missions: [] })).toBe(true);
  });

  test("a run with no usable title contributes no prompt rather than a blank one", () => {
    expect(starterPrompts({ missions: [running("   ")] })).toEqual([]);
    expect(starterPrompts({ missions: [running("\n\n")] })).toEqual([]);
  });
});

describe("ask-starters: it names what is really there", () => {
  // TWO LINES, NOT A RUN-ON. The subject leads so the eye knows what the line
  // is about before it reads the question; `prompt` is what gets SENT, and it
  // is still a whole sentence.
  test("work in motion is named, not counted, and the subject leads", () => {
    const out = starterPrompts({ missions: [running("Ship SSO login for Beacon")] });
    expect(out).toEqual([
      {
        subject: "Ship SSO login for Beacon",
        question: "What is the crew doing on it?",
        prompt: "What is the crew doing on Ship SSO login for Beacon?",
        kind: "running",
      },
    ]);
  });

  test("the most recent finished run is the one it asks about", () => {
    const out = starterPrompts({
      missions: [
        done("Older thing", "2026-07-01T00:00:00.000Z"),
        done("The latest thing", "2026-07-29T00:00:00.000Z"),
      ],
    });
    expect(out[0].prompt).toBe("What changed when The latest thing finished?");
    expect(out[0].kind).toBe("done");
  });

  // `queued` is not motion: nobody is turning on it, so "what is the crew doing"
  // would have no answer. AppFrame's live line draws the same line.
  test("a queued run is not work in motion", () => {
    const out = starterPrompts({
      missions: [{ title: "Not started", status: "queued", completed_at: null }],
    });
    expect(out).toEqual([]);
  });

  test("what needs you first, then what is moving, then what landed", () => {
    const out = starterPrompts({
      missions: [running("In flight"), done("Landed", "2026-07-29T00:00:00.000Z")],
    });
    expect(out.map((o) => o.prompt)).toEqual([
      "What is the crew doing on In flight?",
      "What changed when Landed finished?",
    ]);
  });

  test("capped, however much is happening", () => {
    const many = Array.from({ length: 20 }, (_, i) => running(`Run ${i}`));
    expect(starterPrompts({ missions: many }).length).toBe(6);
  });

  test("one subject asks one question, however many rows carry it", () => {
    const out = starterPrompts({ missions: [running("Same run"), running("same run")] });
    expect(out.length).toBe(1);
  });

  // A title is user and model text: it can be a paragraph, and it is going into
  // a button in a 392px pane.
  test("a very long title is cut rather than allowed to break the button", () => {
    const long = "x".repeat(200);
    const out = starterPrompts({ missions: [running(long)] });
    expect(out[0].subject!.length).toBeLessThan(70);
    expect(out[0].subject).toContain("...");
  });

  test("newlines in a title never break the prompt across two lines", () => {
    const out = starterPrompts({ missions: [running("Ship the\n\nfix")] });
    expect(out[0].subject).toBe("Ship the fix");
    expect(out[0].prompt).toBe("What is the crew doing on Ship the fix?");
  });
});

/**
 * THE THREE ROWS. Founder ruling 2026-07-30: "three rows should be good
 * enough", scrolling in alternating directions.
 */
describe("marqueeRows: dealt, never duplicated", () => {
  const chip = (n: string): Starter => ({
    subject: null,
    question: n,
    prompt: n,
    kind: "use-case",
  });

  // ROUND ROBIN, so the grounded chips (which come first and are the ones worth
  // reading) land one per row instead of crowding the top row while the other
  // two carry only generic lines.
  test("deals round robin so the good ones spread across the rows", () => {
    const rows = marqueeRows([chip("a"), chip("b"), chip("c"), chip("d")]);
    expect(rows.map((r) => r.map((c) => c.prompt))).toEqual([["a", "d"], ["b"], ["c"]]);
  });

  // Each chip in exactly ONE row: the repetition a marquee needs to loop is
  // done at render time, so nothing is duplicated in the accessibility tree.
  test("every chip appears exactly once across all rows", () => {
    const items = Array.from({ length: 11 }, (_, i) => chip(String(i)));
    const flat = marqueeRows(items)
      .flat()
      .map((c) => c.prompt);
    expect(flat.length).toBe(11);
    expect(new Set(flat).size).toBe(11);
  });

  // An empty row would animate a blank strip, which reads as a rendering fault.
  test("fewer chips than rows yields fewer rows, never an empty one", () => {
    expect(marqueeRows([chip("a"), chip("b")]).length).toBe(2);
    expect(marqueeRows([]).length).toBe(0);
    expect(marqueeRows([chip("a"), chip("b")]).every((r) => r.length > 0)).toBe(true);
  });
});

/**
 * NEVER A STATIC LIST. Founder ruling 2026-07-30: "this is not a one time
 * template. It should be revising based on the context what they're working on
 * ... never going to be a static message ever."
 *
 * These assert the two halves of that: the offer CHANGES with the surface, and
 * the vocabulary stays a product manager's.
 */
describe("contextualStarters: it changes with where you stand", () => {
  const on = (scopeKind: string | null, scopeLabel: string) =>
    contextualStarters({ scopeKind, scopeLabel }).map((s) => s.prompt);

  test("a run, a spec, a decision and a workspace each get their own questions", () => {
    const run = on("mission", "this run");
    const spec = on("prd", "this spec");
    const decision = on("decision", "this decision");
    const workspace = on(null, "Helio Labs");
    const sets = [run, spec, decision, workspace];
    // No two surfaces offer the same list, which is the whole ruling.
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        expect(sets[i]).not.toEqual(sets[j]);
      }
    }
    expect(run).toContain("Where is this, and what is left?");
    expect(spec).toContain("Is this ready to build?");
    expect(decision).toContain("Did this bet pay off?");
    expect(workspace).toContain("What should we build next, and why that?");
  });

  // ONE run is a delivery question; a LIST of runs is a workspace question
  // wearing a narrower label, and asking "where is this" of a list is nonsense.
  test("one object and a list of them are not the same surface", () => {
    expect(on("mission", "this run")).not.toEqual(on("mission", "your runs"));
  });

  test("Discover is recognised by its label, since it carries no kinds", () => {
    expect(on(null, "Discover")).toContain("What are users asking for most right now?");
  });

  test("an unknown surface still gets something, never an empty strip", () => {
    expect(on("something-new", "somewhere").length).toBeGreaterThan(0);
  });
});

/**
 * THE GUARDRAIL ON PM LANGUAGE. Business FRAMING, workspace FACTS.
 *
 * PM vocabulary pulls hard toward metrics this workspace does not hold. A chip
 * promising revenue or NPS teaches a product manager, in one press, that the
 * product talks a good game and cannot answer. Every offered line has to be
 * settleable from what the record actually stores.
 */
describe("contextualStarters: it never promises a number we do not hold", () => {
  const UNHOLDABLE = [
    "revenue",
    "arr",
    "mrr",
    "nps",
    "mau",
    "dau",
    "churn rate",
    "conversion rate",
    "ltv",
    "cac",
    "market share",
  ];

  test("no surface offers a metric the workspace cannot answer", () => {
    const surfaces: [string | null, string][] = [
      ["mission", "this run"],
      ["mission", "your runs"],
      ["prd", "this spec"],
      ["decision", "this decision"],
      ["doc", "Brain"],
      [null, "Discover"],
      [null, "Helio Labs"],
    ];
    for (const [kind, label] of surfaces) {
      for (const s of contextualStarters({ scopeKind: kind, scopeLabel: label })) {
        for (const banned of UNHOLDABLE) {
          expect(s.prompt.toLowerCase()).not.toContain(banned);
        }
      }
    }
  });

  test("every offered line is short enough to read on a chip", () => {
    for (const s of contextualStarters({ scopeKind: null, scopeLabel: "Helio Labs" })) {
      expect(s.prompt.length).toBeLessThanOrEqual(60);
    }
  });
});
