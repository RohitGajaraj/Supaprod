/**
 * THE TWO FACTS A SUGGESTION ROW PRINTS, AND THE RULE THAT NEITHER MAY BE
 * INVENTED.
 *
 * A row under "Handed to the crew" says pressing it will spend credits, and a
 * row wearing a station tag says which of the seven it comes out of. Both are
 * derived (ask-suggestions.ts), and the failure mode worth guarding is not that
 * the derivation is wrong today: it is that `ask-starters.ts` gains or renames a
 * prompt six weeks from now and the tag quietly goes blank, or worse, disagrees
 * with the composer the row feeds.
 *
 * So the coverage test below walks EVERY scope `contextualStarters` switches on
 * and asserts every prompt it can emit resolves to a station. Drift is a red
 * test rather than a silent gap.
 */
import { describe, test, expect } from "bun:test";
import { contextualStarters, type Starter } from "@/lib/ask-starters";
import { defaultIntent } from "@/lib/ask-intent";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { groupSuggestions, stationForStarter, stationForScope } from "../ask-suggestions";

/** The scopes `resolveScope` can hand the pane, with the label each wears. The
 *  label matters: `contextualStarters` reads "this " to tell ONE object from a
 *  list of them, and `stationForScope` has to make the same distinction. */
const SCOPES: { kind: string | null; label: string }[] = [
  { kind: "mission", label: "this run" },
  { kind: "mission", label: "your runs" },
  { kind: "prd", label: "this spec" },
  { kind: "prd", label: "your specs" },
  { kind: "decision", label: "this decision" },
  { kind: "doc", label: "this doc" },
  { kind: "note", label: "this note" },
  { kind: "finding", label: "this finding" },
  { kind: null, label: "Discover" },
  { kind: null, label: "Helio Labs" },
];

const grounded = (over: Partial<Starter> = {}): Starter => ({
  subject: "Ship SSO login for Beacon",
  question: "What is the crew doing on it?",
  prompt: "What is the crew doing on Ship SSO login for Beacon?",
  kind: "running",
  ...over,
});

describe("every offered suggestion knows which station it came out of", () => {
  test("no scope emits a prompt with no station", () => {
    const orphans: string[] = [];
    for (const scope of SCOPES) {
      for (const s of contextualStarters({ scopeKind: scope.kind, scopeLabel: scope.label })) {
        if (!stationForStarter(s, scope.kind, scope.label)) {
          orphans.push(`${scope.kind ?? "none"}/${scope.label}: ${s.prompt}`);
        }
      }
    }
    // Named rather than counted, so a failure says WHICH prompt drifted.
    expect(orphans).toEqual([]);
  });

  test("every station it can name is one of the seven the product has", () => {
    for (const scope of SCOPES) {
      for (const s of contextualStarters({ scopeKind: scope.kind, scopeLabel: scope.label })) {
        const station = stationForStarter(s, scope.kind, scope.label);
        expect(AGENT_STATIONS[station!]).toBeTruthy();
      }
    }
  });

  test("the scope decides it wherever the scope can, and a run is Build", () => {
    expect(stationForScope("prd", "this spec")).toBe("define");
    expect(stationForScope("decision", "this decision")).toBe("decide");
    expect(stationForScope("finding", "this finding")).toBe("learn");
    expect(stationForScope("mission", "this run")).toBe("build");
    expect(stationForScope(null, "Discover")).toBe("sense");
  });

  /**
   * A LIST OF RUNS IS A WORKSPACE QUESTION WEARING A NARROWER LABEL, which is
   * `contextualStarters`'s own behaviour: it falls through to the workspace set.
   * If this function claimed Build there, every row on `/runs` would be tagged
   * Build while asking about the quarter and the roadmap.
   */
  test("a LIST of runs falls through exactly as the prompts do", () => {
    expect(stationForScope("mission", "your runs")).toBe(null);
    const listed = contextualStarters({ scopeKind: "mission", scopeLabel: "your runs" });
    const single = contextualStarters({ scopeKind: "mission", scopeLabel: "this run" });
    expect(listed.map((s) => s.prompt)).not.toEqual(single.map((s) => s.prompt));
  });

  // An unknown prompt gets NOTHING. The same rule ask-starters applies to a
  // failed read: an absence is honest, an invention is not.
  test("an unrecognised prompt gets no station rather than a guessed one", () => {
    const invented: Starter = {
      subject: null,
      question: "Something nobody has written yet",
      prompt: "Something nobody has written yet",
      kind: "use-case",
    };
    expect(stationForStarter(invented, null, "Helio Labs")).toBe(null);
  });
});

describe("the groups say what pressing a row will do", () => {
  test("a group heading never disagrees with the composer's own fork", () => {
    // This is the whole reason the split is `defaultIntent` and not a hand
    // list: the composer sets its fork with the same call, so a row filed under
    // "Handed to the crew" is one the composer will offer to hand over.
    for (const scope of SCOPES) {
      const groups = groupSuggestions(
        contextualStarters({ scopeKind: scope.kind, scopeLabel: scope.label }),
      );
      for (const g of groups) {
        for (const item of g.items) {
          const willHandOver = defaultIntent(item.prompt) === "instruction";
          expect({ prompt: item.prompt, filedUnderHand: g.id === "hand" }).toEqual({
            prompt: item.prompt,
            filedUnderHand: willHandOver,
          });
        }
      }
    }
  });

  test("the group that spends money says so before anything is pressed", () => {
    const groups = groupSuggestions(contextualStarters({ scopeKind: null, scopeLabel: "Helio" }));
    const hand = groups.find((g) => g.id === "hand");
    expect(hand).toBeTruthy();
    expect(hand!.note).toContain("spend credits");
  });

  test("work in motion leads, and a finished run is a different question", () => {
    const groups = groupSuggestions([
      { ...grounded({ kind: "done", question: "What changed when it finished?" }) },
      grounded(),
      { subject: null, question: "What is at risk?", prompt: "What is at risk?", kind: "use-case" },
    ]);
    expect(groups.map((g) => g.id)).toEqual(["running", "landed", "ask"]);
  });

  // An empty heading is a claim that there is something under it.
  test("a group with nothing in it does not render at all", () => {
    const groups = groupSuggestions([grounded()]);
    expect(groups.map((g) => g.id)).toEqual(["running"]);
  });

  test("nothing offered means nothing drawn", () => {
    expect(groupSuggestions([])).toEqual([]);
  });

  /**
   * EVERY OFFER SURVIVES THE GROUPING. The marquee this replaced could show one
   * suggestion twice (its loop copies) and hide others behind an edge mask.
   * Grouping must neither duplicate nor drop.
   */
  test("every offer appears exactly once across the groups", () => {
    for (const scope of SCOPES) {
      const offers = contextualStarters({ scopeKind: scope.kind, scopeLabel: scope.label });
      const out = groupSuggestions(offers).flatMap((g) => g.items.map((i) => i.prompt));
      expect(out.slice().sort()).toEqual(offers.map((o) => o.prompt).sort());
    }
  });
});
