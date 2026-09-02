import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseSseLine } from "@/lib/ask-sse";
import {
  DISPATCH_BLOCKS,
  asDispatchBlock,
  dispatchBlockRoute,
  dispatchBlockedMessage,
} from "@/lib/chat-dispatch";

/**
 * A REQUEST FOR WORK THAT DID NOT START MUST NOT COME BACK LOOKING LIKE A REPLY.
 *
 * THE DEFECT, AND IT HAS NOW BEEN FIXED TWICE IN THE SAME PLACE. Pressing "Hand
 * it over" can fail five ways. Version one spliced the raw Postgres error into
 * the answer prompt under "explain this problem to the user", so the person read
 * a model's paraphrase of a database fault, differently worded on every run.
 * Version two (2026-08-20) replaced that with `dispatchBlockedMessage`: our own
 * sentence, deterministic, correct. It went out on the DELTA channel, which is
 * the answer channel, so it rendered inside `Answer` in the same type in the
 * same place as a reply. Right words, wrong container. Nothing in the pane,
 * nothing in a surface test and nothing in the stored transcript could tell a
 * refusal from a reply.
 *
 * SO THE ID TRAVELS ON ITS OWN FRAME, and this file guards the whole path:
 * the server writes it, the real parser reads it, the sentence and the button
 * are derived from the same id, and the pane draws the state INSTEAD of the
 * prose rather than as well as it.
 *
 * IT WALKS A REAL LINE THROUGH THE REAL PARSER, on the rule this repo learned
 * the hard way when the first `landing` emit sent the parser's RETURN type
 * instead of its INPUT and was dropped in silence: both ends were internally
 * consistent and disagreed only about the bytes between them, which no type in
 * either file describes.
 */

const SRC = join(import.meta.dir, "..", "..");
const read = (...rel: string[]) => readFileSync(join(SRC, ...rel), "utf8");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const CHAT = read("routes", "api", "chat.ts");
const TURN = read("components", "ask", "AskTurn.tsx");
const PANE = read("components", "ask", "AskPane.tsx");
const HOOK = read("hooks", "use-ask-stream.ts");

describe("the wire carries the refusal, not only a sentence about it", () => {
  it("the server enqueues the frame, on the block path and nowhere else", () => {
    const code = stripComments(CHAT);
    const emits = code.match(/dispatch_blocked/g) ?? [];
    // One in `streamFriendly`'s enqueue. A second would mean a caller invented
    // its own reason string beside the typed one.
    expect(emits.length).toBe(1);
    expect(code).toMatch(
      /JSON\.stringify\(\{\s*dispatch_blocked:\s*\{\s*reason:\s*blocked\s*\}\s*\}\)/,
    );
  });

  it("the block path passes its reason, so the frame is never a guess", () => {
    expect(stripComments(CHAT)).toContain(
      "return streamFriendly(dispatchBlockedMessage(preflightBlock), baseMeta(), preflightBlock);",
    );
  });

  it("every reason the server can send survives the real parser", () => {
    // Built exactly as `streamFriendly` builds it, for all five, because a
    // vocabulary is only proven by its whole membership.
    for (const reason of DISPATCH_BLOCKS) {
      const line = `data: ${JSON.stringify({ dispatch_blocked: { reason } })}`;
      expect(parseSseLine(line), reason).toEqual({ kind: "dispatch-blocked", reason });
    }
  });

  it("a reason this client does not know degrades to silence, never to a guess", () => {
    // The same rule `station` follows: an unknown value is a server this client
    // does not understand yet, and the prose still streams behind the frame.
    const line = `data: ${JSON.stringify({ dispatch_blocked: { reason: "credits-exhausted" } })}`;
    expect(parseSseLine(line)).toEqual({ kind: "ignored" });
    expect(asDispatchBlock("credits-exhausted")).toBeNull();
    expect(asDispatchBlock(null)).toBeNull();
    expect(asDispatchBlock({ reason: "no-specialists" })).toBeNull();
  });

  it("the frame does not collide with the answer-card frame one letter away", () => {
    // `block` is an AnswerBlock. `dispatch_blocked` is a refusal. A payload of
    // either kind must parse as exactly one thing.
    const card = `data: ${JSON.stringify({ block: { kind: "mission", id: "m1", title: "t", status: "running", goal: null, createdAt: "x" } })}`;
    expect(parseSseLine(card)?.kind).toBe("block");
    const refusal = `data: ${JSON.stringify({ dispatch_blocked: { reason: "no-specialists" } })}`;
    expect(parseSseLine(refusal)?.kind).toBe("dispatch-blocked");
  });

  it("the frame goes out BEFORE the sentence it names", () => {
    /*
     * `AskTurn` draws the state INSTEAD of the prose, so a delta that arrived
     * first would paint the refusal as an ordinary answer for one frame and then
     * swap it. Half a second of "the product answered you" before "the product
     * refused you" is the worst flicker this pane could ship.
     */
    const code = stripComments(CHAT);
    const at = code.indexOf("const streamFriendly");
    expect(at).toBeGreaterThan(-1);
    const body = code.slice(at, code.indexOf("return new Response(s,", at));
    expect(body.indexOf("dispatch_blocked")).toBeLessThan(body.indexOf("delta: { content: text }"));
  });

  it("the sentence still streams, because the transcript is all a later reader gets", () => {
    // A frame lives for one request. `messages.content` is what a reopened
    // conversation shows, so removing the delta would erase the refusal from
    // history and from any client that does not know the frame.
    const code = stripComments(CHAT);
    const at = code.indexOf("const streamFriendly");
    const body = code.slice(at, code.indexOf("return new Response(s,", at));
    expect(body).toContain("delta: { content: text }");
    expect(body).toContain('role: "assistant"');
  });
});

describe("the pane draws a state, and only one of them", () => {
  it("the hook keeps the reason on the turn's work", () => {
    const code = stripComments(HOOK);
    expect(code).toMatch(/event\.kind === "dispatch-blocked"/);
    expect(code).toMatch(/blocked: event\.reason/);
    // First wins. A second refusal on one turn would describe a retry this
    // stream never made.
    expect(code).toMatch(/w\.blocked \? w :/);
  });

  it("it belongs to the turn that asked, never to an older one", () => {
    // Same rule as `landings`, and the same failure if it is broken: an answer
    // from ten minutes ago would relabel itself as a refusal.
    expect(stripComments(PANE).replace(/\s+/g, " ")).toContain(
      "blocked={t.answer?.id === lastId ? stream.work.blocked : null}",
    );
  });

  it("the state REPLACES the answer register rather than sitting under it", () => {
    /*
     * The load-bearing assertion in this file. The sentence arrives twice by
     * design — once as `answer.content`, once derived from the id — so a version
     * that renders both prints it under a heading that says "Answer", which is
     * the confusion the frame exists to end.
     *
     * Matched on the structure: the blocked branch has to sit between the error
     * branch and the ordinary one in the SAME conditional, so there is no
     * arrangement of props that draws two.
     */
    const flat = stripComments(TURN).replace(/\s+/g, " ");

    // The whole chain, in order, as ONE match: error, then blocked, then the
    // ordinary answer. `indexOf` will not do here -- the error branch renders a
    // `<Register name="Answer">` of its own, so a position check finds that one
    // and passes while the real branch sits in the wrong place.
    expect(flat).toMatch(
      /answer\.error \? \(.{0,600}?\) : blocked \? \( <Register name="Why it did not start"> <AskBlocked reason=\{blocked\} \/> <\/Register> \) : \( <Register name="Answer">/,
    );

    // And exactly one place draws it, so there is no second copy under the prose.
    expect((flat.match(/<AskBlocked /g) ?? []).length).toBe(1);
  });

  it("a refusal does not also claim the record was empty", () => {
    /*
     * A DEFECT CAUGHT WHILE WIRING THIS, and the reason the guard is here
     * rather than in a comment. `baseMeta()` reports `workspace_chunks: 0` on
     * a refused dispatch, because no retrieval ran — so every clause of
     * `recordWasEmpty` was satisfied and the turn rendered "The record has
     * nothing on this yet. That answer stands on the model alone." directly
     * under a state saying nothing started. True about the meta, nonsense about
     * the turn: there is no answer for the record to be missing from.
     */
    const flat = stripComments(TURN).replace(/\s+/g, " ");
    expect(flat).toMatch(/const recordWasEmpty = .{0,120}?!blocked/);
  });
});

describe("the words and the button cannot name two different places", () => {
  it("every reason has a sentence, and it says whether anything started", () => {
    for (const reason of DISPATCH_BLOCKS) {
      const said = dispatchBlockedMessage(reason);
      expect(said.length, reason).toBeGreaterThan(40);
      // The one fact a person cannot afford to guess, in the first clause.
      expect(said, reason).toMatch(/^(Nothing started\.|The run did not start,)/);
    }
  });

  it("a destination is only offered where the sentence already names it", () => {
    /*
     * The check that keeps a button honest. `no-specialists` says "under
     * Agents" and its button offers to open it; `dispatch-failed` says "under
     * Runs" and its button offers to open it. The other three say no
     * destination and offer no button, because a wrong one costs a
     * navigation, a search, and the reader's belief in every button like it.
     *
     * THE NOUN COMES FROM THE LABEL, NOT THE URL SEGMENT (P-10, A-QUEUE.md,
     * 2026-09-02). `/agents` and `/runs` were themselves redirect stubs --
     * `/agents` forwarded to `/crew`, `/runs` to SIGNED_IN_HOME -- deleted
     * along with the other 47 the packet's census found, so `dispatchBlockRoute`
     * now points straight at the live destination. The route slug and the
     * user-facing word are already allowed to differ elsewhere in this repo
     * (nav-model.ts's Agents/`/crew` split, ruled 2026-08-15): what this test
     * actually protects is that the button's OWN label is the word the
     * message already used, not that a URL segment spells it.
     */
    for (const reason of DISPATCH_BLOCKS) {
      const route = dispatchBlockRoute(reason);
      if (!route) continue;
      const noun = route.label.replace(/^Open /, "").toLowerCase();
      expect(dispatchBlockedMessage(reason).toLowerCase(), reason).toContain(noun);
    }
  });

  it("the two that point somewhere point at routes that exist", () => {
    // Read off the generated route tree rather than trusted: a destination that
    // 404s is the wrong-destination failure with extra steps.
    const tree = readFileSync(join(SRC, "routeTree.gen.ts"), "utf8");
    for (const reason of DISPATCH_BLOCKS) {
      const route = dispatchBlockRoute(reason);
      if (!route) continue;
      expect(tree, `${reason} -> ${route.to}`).toContain(`'${route.to}': typeof`);
    }
  });
});
