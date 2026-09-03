/**
 * THE THREE FILES, RENDERED FROM WHAT THE RECORD ACTUALLY HOLDS.
 *
 * P-21's acceptance: a test renders them from a fixture decision and spec and
 * checks every heading, and `intent.md` carries the five fields and the forecast
 * verbatim. Both are here, and the fixtures are shaped like the live rows rather
 * than like ideal ones — most of this product's decisions have no intent fields
 * at all, and 117 of 119 specs have an empty contract.
 */
import { describe, expect, it } from "bun:test";
import {
  INTENT_FIELDS,
  intentMd,
  planMd,
  playbookPath,
  PLAYBOOK_FILES,
  specMd,
} from "@/lib/spine/playbook-files";

const FULL = {
  title: "Checkout asks a homeowner to re-enter the delivery address it already has on file",
  intent: {
    problem_statement: "A returning customer retypes an address we already store.",
    proposed_outcome: "The saved address is offered and accepted without retyping.",
    affected_users_and_systems: "Returning homeowners; checkout; the address book service.",
    constraints: "No change to the payment step. Tablet layout must not regress.",
    open_questions: "Do we show every saved address, or only the most recent?",
  },
  forecast: {
    claim: "Checkout completion for returning customers rises above 82 percent.",
    observable: "Weekly completion rate for sessions with a saved address.",
    horizon: "2026-10-07T00:00:00Z",
  },
};

describe("intent.md carries the playbook's five, and carries them verbatim", () => {
  it("writes every field under its own heading", () => {
    const md = intentMd(FULL);
    for (const { heading } of INTENT_FIELDS) {
      expect(md, `${heading} is missing`).toContain(`## ${heading}`);
    }
  });

  it("quotes each field's words rather than summarising them", () => {
    const md = intentMd(FULL);
    for (const value of Object.values(FULL.intent)) {
      expect(md).toContain(value);
    }
  });

  it("keeps the playbook's order, because it is an argument and not a list", () => {
    /*
     * Problem, then outcome, then who it touches, then what bounds it, then what
     * is still unknown. Reordered it reads as a form; in order it reads as
     * somebody thinking.
     */
    const md = intentMd(FULL);
    const at = INTENT_FIELDS.map((f) => md.indexOf(`## ${f.heading}`));
    expect(at).toEqual([...at].sort((a, b) => a - b));
  });

  it("includes `Open questions`, which the paraphrase in the packet dropped", () => {
    /*
     * The spec singles this out: "the field we would never have thought of, the
     * one that makes a handoff honest rather than confident". P-21's scope line
     * replaced it with `non-goals`; A1 withdrew that on 2026-09-03. This
     * assertion is why the file cannot quietly lose it again.
     */
    expect(INTENT_FIELDS.map((f) => f.key)).toContain("open_questions");
    expect(intentMd(FULL)).toContain("## Open questions");
  });

  it("does NOT carry non-goals, which belong to the Outcome Contract", () => {
    expect(intentMd(FULL)).not.toContain("Non-goals");
  });

  it("carries the forecast verbatim, as one statement rather than three facts", () => {
    const md = intentMd(FULL);
    expect(md).toContain("## Forecast");
    expect(md).toContain(FULL.forecast.claim);
    expect(md).toContain(FULL.forecast.observable);
    // The horizon as the day it names; the schema wants an instant, a reader
    // wants a date.
    expect(md).toContain("**Due:** 2026-10-07");
    expect(md).not.toContain("T00:00:00Z");
  });

  it("keeps an empty field's heading and says it is empty", () => {
    /*
     * THE ONE THAT MATTERS FOR EVERY DECISION ON THE DATABASE TODAY. Dropping
     * empty headings produces a file that looks complete and is not, and a team
     * reading it in their own repo has no way back to us to find out which field
     * is missing. It is also the only form that tells the agent what is left.
     */
    const md = intentMd({ title: "A thing", intent: {}, forecast: null });
    for (const { heading } of INTENT_FIELDS) expect(md).toContain(`## ${heading}`);
    expect(md).toContain("## Forecast");
    expect([...md.matchAll(/_Not recorded yet\._/g)]).toHaveLength(INTENT_FIELDS.length + 1);
  });

  it("renders a partial forecast without inventing the rest", () => {
    const md = intentMd({ title: "x", intent: {}, forecast: { claim: "It goes up." } });
    expect(md).toContain("**What we expect:** It goes up.");
    expect(md).not.toContain("**How we will know:**");
    expect(md).not.toContain("**Due:**");
  });

  it("survives a row with nothing on it", () => {
    const md = intentMd({ title: "" });
    expect(md).toContain("# Untitled");
    expect(md).not.toContain("undefined");
    expect(md).not.toContain("null");
  });
});

describe("spec.md wraps the author's document rather than rewriting it", () => {
  it("passes the body through untouched", () => {
    const body = "## Their own heading\n\nTheir own words, with `code` and a [link](x).";
    expect(specMd({ title: "A spec", body })).toContain(body);
  });

  it("draws the contract sections only when the row has them", () => {
    /*
     * 117 of 119 specs carry an empty contract. A "How we will know" heading
     * over "not recorded yet" on every one of them tells a reader the product
     * failed, when the truth is the spec predates the contract.
     */
    const bare = specMd({ title: "A spec", body: "words" });
    expect(bare).not.toContain("## How we will know");
    expect(bare).not.toContain("## Non-goals");

    const full = specMd({
      title: "A spec",
      body: "words",
      measures: ["Completion above 82 percent"],
      nonGoals: ["The payment step"],
    });
    expect(full).toContain("## How we will know");
    expect(full).toContain("- Completion above 82 percent");
    expect(full).toContain("## Non-goals");
    expect(full).toContain("- The payment step");
  });

  it("says so when there is no body at all", () => {
    expect(specMd({ title: "A spec" })).toContain("_Not recorded yet._");
  });
});

describe("plan.md is a checklist, because that is what it is used as", () => {
  const tasks = [
    { title: "Read the saved address", status: "done" },
    { title: "Offer it at checkout", detail: "Behind the existing flag.", status: "open" },
  ];

  it("marks work already done with markdown's own state", () => {
    const md = planMd({ title: "Plan", tasks });
    expect(md).toContain("- [x] Read the saved address");
    expect(md).toContain("- [ ] Offer it at checkout");
  });

  it("indents a task's detail under its own item, so the list survives pasting", () => {
    expect(planMd({ title: "Plan", tasks })).toContain("\n  Behind the existing flag.");
  });

  it("says there are no steps rather than drawing an empty list", () => {
    expect(planMd({ title: "Plan", tasks: [] })).toContain("_Not recorded yet._");
  });
});

describe("where they land in somebody else's repo", () => {
  it("is namespaced, so dropping them in cannot collide", () => {
    expect(playbookPath("intent.md")).toBe(".supaprod/intent.md");
    expect(PLAYBOOK_FILES).toEqual(["intent.md", "spec.md", "plan.md"]);
  });
});
