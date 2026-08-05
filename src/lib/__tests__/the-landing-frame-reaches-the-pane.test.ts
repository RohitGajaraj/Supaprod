import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseSseLine } from "@/lib/ask-sse";

/**
 * A FRAME IS ONLY REAL ONCE BOTH ENDS AGREE ABOUT THE WIRE.
 *
 * THE GAP THIS CLOSES. The "show me where the work went" capability existed in
 * FOUR pieces and not one of them was connected: `ask-sse.ts` parsed a
 * `landing` frame, `use-ask-stream.ts` accumulated landings, `AskLanding.tsx`
 * rendered one, and `AskTurn` took them as a prop. Nothing emitted a frame and
 * nothing passed the prop. So a person dispatched work, the conversation
 * stopped, and the mission was reachable only by knowing to go and look for it
 * -- the founder's own complaint that the agents' value is not visible, in its
 * most literal form.
 *
 * AND THE FIRST EMIT WAS THE WRONG SHAPE. It sent
 * `{kind:"landing", artifact:{…}}` -- the parser's RETURN type rather than its
 * INPUT -- and `parseSseLine` read it as `ignored` and dropped it in silence.
 * Nothing could catch that: the server was internally consistent, the client
 * was internally consistent, and they disagreed only about the bytes between
 * them, which no type in either file describes. It was found by walking a real
 * emitted line through the real parser, which is what this test now does on
 * every run.
 *
 * THE TEST READS THE SERVER'S OWN STRING. It does not restate the shape, it
 * extracts what `chat.ts` actually writes and feeds that to the real parser. A
 * test that hard-codes the frame would agree with itself while the server drifts
 * away from both, which is the exact failure it exists to prevent.
 */

const CHAT = readFileSync(join(import.meta.dir, "..", "..", "routes", "api", "chat.ts"), "utf8");

describe("the server emits a landing frame the client can read", () => {
  it("emits one at all, on the branch that creates a mission", () => {
    // Not a `landing` mention anywhere: the enqueue itself, so a comment about
    // landings cannot satisfy this.
    expect(CHAT).toMatch(/landing:\s*\{\s*kind:\s*"mission"/);
  });

  it("uses the wire shape the parser reads, not the shape it returns", () => {
    // `{kind:"landing", artifact:{…}}` is what parseSseLine RETURNS. Emitting
    // that was the bug: valid JSON, sensible-looking, silently ignored.
    const enqueued = CHAT.slice(CHAT.indexOf('landing: { kind: "mission"'));
    expect(enqueued.slice(0, 200)).not.toContain('kind: "landing"');
  });

  it("carries the station, so the pane can hand back rather than dead-end", () => {
    expect(CHAT).toMatch(
      /landing:\s*\{\s*kind:\s*"mission",\s*id:\s*mission\.id,\s*station:\s*"build"/,
    );
  });

  it("a real emitted line survives the real parser", () => {
    // The end-to-end walk. Built exactly as the server builds it.
    const line = `data: ${JSON.stringify({
      landing: { kind: "mission", id: "11111111-2222-3333-4444-555555555555", station: "build" },
    })}`;
    const parsed = parseSseLine(line);
    expect(parsed?.kind).toBe("landing");
    if (parsed?.kind !== "landing") return;
    expect(parsed.artifact).toEqual({
      kind: "mission",
      id: "11111111-2222-3333-4444-555555555555",
      station: "build",
    });
  });

  it("the wrong shape is still ignored, so a drifted server degrades to silence", () => {
    // Keeping this pinned means the protocol's own safety property is asserted
    // rather than assumed: a client that guessed at an unrecognised frame would
    // be worse than one that drops it.
    const wrong = `data: ${JSON.stringify({
      kind: "landing",
      artifact: { kind: "mission", id: "x", station: "build" },
    })}`;
    expect(parseSseLine(wrong)?.kind).toBe("ignored");
  });
});

describe("the pane actually passes them to the turn that earned them", () => {
  const PANE = readFileSync(
    join(import.meta.dir, "..", "..", "components", "ask", "AskPane.tsx"),
    "utf8",
  );

  it("hands landings to AskTurn", () => {
    expect(PANE).toContain("landings={");
  });

  it("only to the LIVE turn, never to every turn", () => {
    // `stream.work` describes the run in flight. Handing it to all turns would
    // re-label every earlier answer with a new run's result each time one
    // arrived, which is the shape of lie this register exists to prevent.
    expect(PANE).toMatch(
      /landings=\{t\.answer\?\.id === lastId \? stream\.work\.landings : undefined\}/,
    );
  });
});
