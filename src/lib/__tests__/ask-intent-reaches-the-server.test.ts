import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE CHOICE A PERSON MAKES MUST REACH THE SERVER THAT ACTS ON IT.
 *
 * THE DEFECT THIS PREVENTS, found 2026-08-05. Ask renders a visible two-option
 * fork: answer my question, or hand the work over. Both ends of the wire were
 * built for it. `use-ask-stream.ts` `send()` accepted an `intent` and forwarded
 * it in the request body; `api/chat.ts` read `body.intent` into `forcedAsk` and
 * `forcedDo`. Between them sat the exported wrapper:
 *
 *     const sendIntent = (content: string) => { void send(content); };
 *
 * One argument in, one argument out. The field was never emitted by anything,
 * so both server flags were permanently false and the classifier went on
 * guessing while the pane showed a control implying it did not have to.
 *
 * WHY THE BROKEN HALF WAS THE ONE THAT MATTERS. "Hand it over" survived the gap
 * by accident: `contentForIntent` prefixed `@cos`, and `api/chat.ts` skips its
 * classifier for a resolved mention. ASK had no such fallback. So the failure
 * mode was a question being misread as work and dispatching a mission the
 * person never asked for, spending their money -- which is, verbatim, what the
 * field's own comment in chat.ts says it exists to prevent.
 *
 * THE ACCIDENTAL HALF WAS RETIRED ON 2026-08-22 and this guard got MORE
 * important, not less. "Hand it over" no longer has a fallback either: with the
 * prefix gone, `intent: "do"` is the only thing that promotes a stated
 * instruction, so the wrapper regression this file exists to catch would now
 * break BOTH forks instead of one. Everything asserted below is unchanged.
 *
 * NOTHING COULD SEE IT. Every file typechecked. The narrower wrapper type was
 * itself valid TypeScript, and no test asserted the shape of the request body.
 * A field is only real once something puts it on the wire.
 */

const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("Ask's visible fork travels to the server", () => {
  const hook = stripComments(read(join("hooks", "use-ask-stream.ts")));
  const pane = stripComments(read(join("components", "ask", "AskPane.tsx")));
  const server = stripComments(read(join("routes", "api", "chat.ts")));

  it("the server still reads the field, so this guard is protecting something live", () => {
    expect(server).toMatch(/body\.intent\s*===\s*["']ask["']/);
    expect(server).toMatch(/body\.intent\s*===\s*["']do["']/);
  });

  it("the exported sendIntent accepts an intent, not just content", () => {
    // The declared type and the implementation, both. The bug was a wrapper
    // narrower than the function it wrapped.
    expect(hook).toMatch(/sendIntent:\s*\(content:\s*string,\s*intent\?/);
    expect(hook).toMatch(/const sendIntent = React\.useCallback\(\s*\(content: string, intent\?/);
  });

  it("sendIntent forwards the intent rather than dropping it", () => {
    const flat = hook.replace(/\s+/g, " ");
    expect(flat).toMatch(/void send\(content, intent\)/);
    // The exact shape of the old defect, so it cannot come back quietly.
    expect(flat).not.toMatch(/const sendIntent = React\.useCallback\( \(content: string\) =>/);
  });

  it("the request body carries the field when an intent was chosen", () => {
    const flat = hook.replace(/\s+/g, " ");
    expect(flat).toMatch(/\.\.\.\(intent \? \{ intent \} : \{\}\)/);
  });

  it("the field is the ONLY thing promoting a handover now", () => {
    /*
     * WHAT THIS BECAME ON 2026-08-22. Until today "Hand it over" had a second,
     * accidental route: `contentForIntent` prefixed `@cos`, `api/chat.ts`
     * resolved it to the conductor, and a resolved mention dispatches without
     * consulting the classifier at all. The field could have been broken the
     * whole time and the button would still have started runs.
     *
     * That prefix is gone, for four reasons `ask-intent.ts` sets out, and the
     * consequence for THIS file is that the guard above got teeth it did not
     * have: break the wrapper now and both forks break, not one.
     */
    const flat = pane.replace(/\s+/g, " ");
    // The pane writes no mention of its own. `@` in a sent string would mean
    // the accident had come back under a different alias.
    expect(flat).not.toMatch(/sendIntent\(\s*[`"']@/);
    expect(stripComments(read(join("lib", "ask-intent.ts")))).not.toMatch(/@(cos|chief)/);
  });

  it("a handover now reaches the classifier, which the prefix used to skip", () => {
    /*
     * THE THING THAT WAS BEING THROWN AWAY, and it was not being thrown away —
     * it was never computed. `api/chat.ts` gates its classifier on
     * `!mentionedAgent && !forcedAsk`. A resolved `@cos` set `mentionedAgent`,
     * so on every handover the classifier did not run: no mission title, no
     * goal, no research mode, and no `station`/`shape` for `routeIntent`. With
     * the prefix gone a forced "do" carries no mention, so the gate opens.
     *
     * Asserted on the GATE rather than on the outcome, because the outcome is a
     * live model call. If someone re-adds `|| forcedDo` to this condition the
     * classifier stops running on handovers again and this fails.
     */
    const flat = server.replace(/\s+/g, " ");
    expect(flat).toContain("if (!mentionedAgent && !forcedAsk) {");
    // The fields that gate only exists to produce, still read into the route.
    expect(flat).toContain("classifiedStation = asStation(parsed.station);");
    expect(flat).toContain("classifiedShape = asWorkShape(parsed.shape);");
  });

  it("the pane passes what the person pressed, mapped to the API's words", () => {
    const flat = pane.replace(/\s+/g, " ");
    // The pane thinks in question/instruction (what the control says); the API
    // speaks ask/do. The mapping must be present, not just the call.
    // `[^)]*` will not do here: the first argument is itself a call, so the
    // pattern has to be allowed to cross its closing paren.
    expect(flat).toMatch(
      /stream\.sendIntent\(\s*contentForIntent\(text, intent\),\s*intent === "question" \? "ask" : "do"/,
    );
  });
});

/**
 * THE CLAIM IS THE MOAT, SO IT BINDS THE COPY.
 *
 * CLAUDE.md:7 and README.md, "The claim, and why it compounds": the product
 * learns and then guides, the last outcome changes the next call, and that
 * compounding is what no vendor can copy. Storage is the thing it is NOT:
 * anyone can store your decisions, and a frontier release can absorb search
 * over them next quarter. So a public surface that says the brain remembers,
 * stores or logs your work has not broken a style rule -- it has swapped the
 * defensible claim for the undefendable one, and claimed less than the product
 * actually delivers.
 *
 * It had drifted where it mattered most. The landing hero -- the single
 * most-read sentence the product owns -- read "Agents that know what to build,
 * ship it, remember, and guide", while ThreeLayers.tsx one screen below printed
 * "It learns, and it guides." A visitor scrolling from the hero to the
 * mechanism met two different claims about the same layer.
 *
 * Scoped to PUBLIC marketing surfaces and to rendered copy only. Comments and
 * server code are deliberately out of scope: the founder's 2026-08-02 ruling is
 * that this cleanup is consumer-facing, never backend source, comments, .md or
 * .sql -- and the comments explaining this rule necessarily quote the word.
 */
describe("public copy keeps the claim the moat is built on", () => {
  const PUBLIC_SURFACES = [
    join("components", "landing", "Hero.tsx"),
    join("components", "landing", "ThreeLayers.tsx"),
    join("components", "landing", "Receipts.tsx"),
    join("components", "landing", "LandingFooter.tsx"),
    join("components", "landing", "LandingNav.tsx"),
  ];

  /**
   * WHAT IS BANNED IS THE CLAIM, NOT THE LETTERS, and the difference decides
   * whether this guard survives contact with real copy.
   *
   * "Remembers" is always the claim in rendered text, so it stands alone.
   * "Store" and "log" are ordinary English -- Receipts.tsx ships "dated
   * shipping log", an app-store link is legitimate, a variable named `store`
   * breaks nothing -- so they are caught only in the shape that makes the
   * claim: storing or logging YOUR (or every / each / all) work. Plus the one
   * framing README bans by name, "where the record lives".
   *
   * A wider pattern would fail on correct copy, and a guard that fails on
   * correct copy gets deleted by the next person in a hurry, taking the real
   * rule with it.
   */
  const CLAIMS_STORAGE: Array<[RegExp, string]> = [
    [/\b(remembers?|remembering)\b/i, "claims the product remembers"],
    [
      /\b(stores?|stored|storing|logs|logged|logging)\s+(your|their|every|each|all)\b/i,
      "frames the brain as storage of your work",
    ],
    [/where the record lives/i, "the framing README bans by name"],
  ];

  for (const rel of PUBLIC_SURFACES) {
    it(`${rel} never trades the claim for storage`, () => {
      const code = stripComments(read(rel));
      const offenders = code
        .split("\n")
        .flatMap((line, i) =>
          CLAIMS_STORAGE.filter(([re]) => re.test(line)).map(
            ([, why]) => `${i + 1}: ${why} -- ${line.trim()}`,
          ),
        );
      expect(offenders).toEqual([]);
    });
  }

  /**
   * THE DOCTRINE LEADS WITH A CLAIM, NOT A SCRIPT, and the first version of
   * this test confused the two.
   *
   * It required the hero to CONTAIN "learn" and "guide". That is stronger than
   * the rule, which asks only that no surface swap the claim for storage. The
   * hero was later rewritten to "Agents that own outcomes. Not just output."
   * -- which breaks no rule, says the same thing harder, and failed this test
   * anyway. README now names that hero as compliant, in writing.
   *
   * So rewording any surface is free. The one exception is ThreeLayers.tsx,
   * whose entire job on the page is explaining layer 03: it has to say the
   * mechanism in the doctrine's own two verbs, or the page explains the moat
   * without ever stating it. Punctuation and connectives are left free there
   * too, so "It learns, then it guides." would pass.
   */
  it("the surface that explains layer 03 still says learns, then guides", () => {
    const three = stripComments(read(join("components", "landing", "ThreeLayers.tsx")));
    expect(three).toMatch(/\blearns\b[^\n]{0,40}\bguides\b/i);
  });
});
