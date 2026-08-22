import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";
import { parseSseLine } from "./ask-sse";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import { toolActionLabel } from "@/lib/agent-vocabulary";

describe("ask-sse - parseSseLine", () => {
  it("returns null for a non-data line", () => {
    expect(parseSseLine("event: ping")).toBeNull();
    expect(parseSseLine("")).toBeNull();
  });

  it("returns done for [DONE]", () => {
    expect(parseSseLine("data: [DONE]")).toEqual({ kind: "done" });
  });

  it("routes a status payload", () => {
    const line = `data: ${JSON.stringify({ status: { phase: "search", label: "reading 48 tickets" } })}`;
    const event = parseSseLine(line);
    expect(event).toEqual({
      kind: "status",
      status: { phase: "search", label: "reading 48 tickets" },
    });
  });

  it("routes a meta payload", () => {
    const meta = {
      model: "google/gemini-3-flash-preview",
      via: "gateway",
      latency_ms: 1400,
      tokens_in: 10,
      tokens_out: 20,
      cost_usd: 0.02,
      sources: [],
      web_used: false,
      workspace_chunks: 0,
    };
    const line = `data: ${JSON.stringify({ meta })}`;
    const event = parseSseLine(line);
    expect(event?.kind).toBe("meta");
    if (event?.kind === "meta") {
      expect(event.meta.model).toBe("google/gemini-3-flash-preview");
      expect(event.meta.cost_usd).toBe(0.02);
    }
  });

  it("accumulates a delta.content piece", () => {
    const line = `data: ${JSON.stringify({ choices: [{ delta: { content: "hel" } }] })}`;
    expect(parseSseLine(line)).toEqual({ kind: "delta", piece: "hel", missionId: undefined });
  });

  it("routes a delta.mission_id", () => {
    const line = `data: ${JSON.stringify({ choices: [{ delta: { mission_id: "m-1" } }] })}`;
    expect(parseSseLine(line)).toEqual({ kind: "delta", piece: undefined, missionId: "m-1" });
  });

  it("routes a typed answer block (PC-36 C)", () => {
    const block = {
      kind: "decision",
      id: "d-1",
      title: "Ship the beta",
      status: "approved",
      rationale: null,
      decidedBy: null,
      sourceKind: "manual",
      createdAt: "2026-07-16T00:00:00Z",
    };
    const event = parseSseLine(`data: ${JSON.stringify({ block })}`);
    expect(event).toEqual({ kind: "block", block });
  });

  it("ignores a block payload with an unknown kind", () => {
    const line = `data: ${JSON.stringify({ block: { kind: "widget", id: "x" } })}`;
    expect(parseSseLine(line)).toEqual({ kind: "ignored" });
  });

  it("returns ignored for a data line with no recognizable shape", () => {
    const line = `data: ${JSON.stringify({ unrelated: true })}`;
    expect(parseSseLine(line)).toEqual({ kind: "ignored" });
  });

  it("returns parse-error (not null) for malformed JSON, so the caller re-buffers instead of dropping it", () => {
    const line = `data: {"choices":[{"delta":{"content":"unterminated`;
    expect(parseSseLine(line)).toEqual({ kind: "parse-error" });
  });
});

/**
 * THE PROTOCOL GAINS A WORD FOR WORK.
 *
 * The five original frames all describe an ANSWER: status, meta, block,
 * persisted, delta. That is why the pane goes blind the moment a message
 * dispatches work rather than answering it: the server emits one delta carrying
 * a mission id, then [DONE], and a four-second poll takes over. A surface whose
 * promise is showing the work cannot be built on a protocol with no word for it.
 *
 * These three are ADDITIVE and nothing emits them yet. That is the point: the
 * vocabulary ships ahead of the emitters, because everything else in the
 * conversational workspace is blocked on it and nothing before it is. The
 * consumer in use-ask-stream already tolerates unknown kinds (its branch chain
 * ends in `if (event.kind !== "delta") continue`), so this changes no behaviour
 * at all today.
 */
describe("parseSseLine - the work frames", () => {
  it("reads a station frame as one of the seven", () => {
    expect(parseSseLine(`data: ${JSON.stringify({ station: "decide" })}`)).toEqual({
      kind: "station",
      station: "decide",
    });
  });

  it("refuses a station that is not one of the seven, rather than guessing", () => {
    // A server naming an eighth station is one this client does not understand.
    // Degrading to `ignored` is what every unknown frame has always done.
    expect(parseSseLine(`data: ${JSON.stringify({ station: "triage" })}`)).toEqual({
      kind: "ignored",
    });
    expect(parseSseLine(`data: ${JSON.stringify({ station: 3 })}`)).toEqual({ kind: "ignored" });
  });

  it("reads a tool frame as a registry name, never a sentence", () => {
    // The client names it (toolActionLabel turns this into "drafting a spec"),
    // so the server never ships rendered copy down the wire.
    expect(parseSseLine(`data: ${JSON.stringify({ tool: "prd.draft" })}`)).toEqual({
      kind: "tool",
      tool: "prd.draft",
    });
  });

  it("ignores an empty or non-string tool", () => {
    expect(parseSseLine(`data: ${JSON.stringify({ tool: "   " })}`)).toEqual({ kind: "ignored" });
    expect(parseSseLine(`data: ${JSON.stringify({ tool: 7 })}`)).toEqual({ kind: "ignored" });
  });

  it("reads a landing frame, so a result can hand back to the station that owns it", () => {
    const line = `data: ${JSON.stringify({ landing: { kind: "prd", id: "abc", station: "define" } })}`;
    expect(parseSseLine(line)).toEqual({
      kind: "landing",
      artifact: { kind: "prd", id: "abc", station: "define" },
    });
  });

  it("accepts a landing with no station, and omits the key rather than inventing one", () => {
    const line = `data: ${JSON.stringify({ landing: { kind: "decision", id: "d1" } })}`;
    expect(parseSseLine(line)).toEqual({
      kind: "landing",
      artifact: { kind: "decision", id: "d1" },
    });
  });

  it("ignores a landing missing its kind or its id", () => {
    expect(parseSseLine(`data: ${JSON.stringify({ landing: { id: "x" } })}`)).toEqual({
      kind: "ignored",
    });
    expect(parseSseLine(`data: ${JSON.stringify({ landing: { kind: "prd" } })}`)).toEqual({
      kind: "ignored",
    });
  });

  it("leaves the five original frames untouched, which is the whole safety claim", () => {
    // If adding a frame changed how an answer parses, this would be a rewrite
    // rather than an addition, and it could not ship ahead of its emitters.
    const delta = `data: ${JSON.stringify({ choices: [{ delta: { content: "hi" } }] })}`;
    expect(parseSseLine(delta)).toEqual({ kind: "delta", piece: "hi", missionId: undefined });
    expect(parseSseLine("data: [DONE]")).toEqual({ kind: "done" });
    expect(parseSseLine(`data: ${JSON.stringify({ unrelated: true })}`)).toEqual({
      kind: "ignored",
    });
    expect(parseSseLine("event: ping")).toBeNull();
  });
});

/**
 * ── THE EMITTER AND THE PARSER, WALKED END TO END (K-15) ────────────────
 *
 * ADDED 2026-08-20, and it is outside K-15's stated `Owns` deliberately. The item
 * lists no test file, and the acceptance criterion it cannot check without one is
 * "the client's existing accumulators receive them with no client change".
 *
 * THE DEFECT THIS SHAPE OF TEST ALREADY CAUGHT ONCE, recorded in `api/chat.ts`:
 * the first `landing` emitter sent `{kind:"landing", artifact:{…}}`, which is the
 * parser's RETURN type rather than its INPUT, and `parseSseLine` read it as
 * `ignored` and dropped it in silence. Both ends were internally consistent and
 * only disagreed about the wire, so no type could see it. The only thing that
 * catches it is walking a real emitted line through the real parser.
 */
describe("the lines api/chat.ts actually writes, through the real parser", () => {
  /** Exactly the shape the route enqueues, including the framing. */
  const line = (obj: unknown) => `data: ${JSON.stringify(obj)}`;

  it("reads a station frame as a station", () => {
    // Emitted on the mention branch, from `agentStation(mentionedAgent.slug)`.
    expect(parseSseLine(line({ station: "build" }))).toEqual({
      kind: "station",
      station: "build",
    });
  });

  it("reads each of the three research tool frames as a tool", () => {
    /*
     * The three phases that are genuinely tool calls. `plan` and `synthesize` emit
     * no tool frame at all, because no tool runs in either, and a frame for them
     * would name work nothing did.
     */
    for (const tool of ["web.search", "web.fetch", "workspace.search"]) {
      expect(parseSseLine(line({ tool })), tool).toEqual({ kind: "tool", tool });
    }
  });

  it("reads the landing frame the mission branch writes", () => {
    expect(parseSseLine(line({ landing: { kind: "mission", id: "abc", station: "build" } }))).toEqual(
      { kind: "landing", artifact: { kind: "mission", id: "abc", station: "build" } },
    );
  });

  it("does not read a status frame as a tool, or the reverse", () => {
    // Both are sent for the same phase, one after the other, and they must land in
    // two different accumulators. A parser that read either as the other would put
    // a sentence in the tool list or a tool name in the status line.
    const status = parseSseLine(line({ status: { phase: "search", label: "Searching: x" } }));
    expect(status?.kind).toBe("status");
    expect(parseSseLine(line({ tool: "web.search" })).kind).toBe("tool");
  });

  it("refuses a station the client does not know, rather than lighting a wrong one", () => {
    // `parseStation` is strict on purpose: the seven are a closed set and a frame
    // naming an eighth is a server this client does not understand yet.
    expect(parseSseLine(line({ station: "quarry" })).kind).toBe("ignored");
  });

  it("refuses an empty tool name", () => {
    // `toolActionLabel("")` is null, so an empty name would render as a blank row
    // in the tool list rather than as nothing.
    expect(parseSseLine(line({ tool: "" })).kind).toBe("ignored");
    expect(parseSseLine(line({ tool: "   " })).kind).toBe("ignored");
  });
});

describe("the emitter sends the parser's INPUT shape, not its output", () => {
  const source = readFileSync(new URL("../routes/api/chat.ts", import.meta.url), "utf8");

  it("writes a bare `station` key", () => {
    /*
     * The specific mistake the landing frame made. `{kind:"station", station:…}`
     * would parse as `ignored`, because `parseSseLine` looks for the KEY.
     */
    expect(source).toContain('JSON.stringify({ station: dispatchedStation })');
    expect(source).not.toContain('kind: "station"');
  });

  it("writes a bare `tool` key", () => {
    expect(source).toContain("send({ tool })");
    expect(source).not.toContain('kind: "tool"');
  });

  it("still sends the status alongside, rather than replacing it", () => {
    // The two answer different questions and the client accumulates them into two
    // different fields. Dropping the status to add the tool would trade a sentence
    // a reader can act on for a name they cannot.
    expect(source).toContain("send({ status });");
  });

  it("emits no tool frame for the two phases that call no tool", () => {
    /*
     * Asserted against the map rather than the emitter, because the emitter is a
     * lookup and the decision lives in the table. `plan` is the model deciding what
     * to ask and `synthesize` is the model writing; a tool name for either would be
     * this file's own withdrawn-claim defect, one frame down.
     */
    const at = source.indexOf("const RESEARCH_PHASE_TOOL");
    const table = source.slice(at, source.indexOf("};", at));
    expect(table).toContain("search:");
    expect(table).toContain("read:");
    expect(table).toContain("workspace:");
    expect(table, "a tool name was put on a phase where no tool runs").not.toContain("plan:");
    expect(table, "a tool name was put on a phase where no tool runs").not.toContain("synthesize:");
  });

  /** The framing the route enqueues, so a line can be walked through the parser. */
  const line = (obj: unknown) => `data: ${JSON.stringify(obj)}`;

  it("puts the chat branch's own constant on the wire, and the parser reads it", () => {
    /*
     * NOT A DUPLICATE of the three-name loop above. That loop hard-codes the
     * names; this reads the string the route will ACTUALLY write out of the
     * route and walks that through the real parser, which is the only check
     * that catches a typo in `WORKSPACE_SEARCH` before it ships as a frame the
     * client silently drops.
     *
     * Two further assertions, because a tool frame has two ways to be useless.
     * A name outside `TOOL_DEFAULTS` is not a registry name at all, which the
     * frame's contract requires. A name `toolActionLabel` cannot translate
     * returns null, and `AskWorkLine` then renders NOTHING rather than leak a
     * raw id — indistinguishable, to a reader, from never having sent it.
     */
    const m = source.match(/const WORKSPACE_SEARCH = "([^"]+)"/);
    expect(m, "WORKSPACE_SEARCH was renamed or removed").not.toBeNull();
    const tool = (m as RegExpMatchArray)[1];
    expect(parseSseLine(line({ tool }))).toEqual({ kind: "tool", tool });
    expect(TOOL_DEFAULTS[tool], "not a registered tool").toBeDefined();
    expect(toolActionLabel(tool), "the client could not name this to a person").toBeTruthy();
  });

  it("sends that frame BEFORE the retrieval, not after it", () => {
    /*
     * The frame says "an agent STARTED this tool". Moved below the await it
     * becomes a report on a finished call, and a name that arrives only once the
     * work is done is the poll this frame exists to replace.
     */
    const at = source.indexOf("F-CHAT-V2 lightweight chat path");
    expect(at, "the chat branch moved or was renamed").toBeGreaterThan(-1);
    const branch = source.slice(at, source.indexOf("workspaceChunks = chunks.length", at));
    const emit = branch.indexOf("send({ tool: WORKSPACE_SEARCH })");
    expect(emit, "the chat branch emits no tool frame for the search it runs").toBeGreaterThan(-1);
    expect(emit).toBeLessThan(branch.indexOf("await retrieve("));
  });

  it("one name, shared with the research map, so a rename cannot half-land", () => {
    // The research `workspace` phase and the chat branch call the same function
    // with the same arguments. Two literals would let one drift off the registry.
    const at = source.indexOf("const RESEARCH_PHASE_TOOL");
    const table = source.slice(at, source.indexOf("};", at));
    expect(table).toContain("workspace: WORKSPACE_SEARCH");
  });

  it("puts no tool frame on the mission stream, where nothing has called one yet", () => {
    /*
     * THE FRAME THAT CANNOT HONESTLY EXIST. The mission branch dispatches
     * fire-and-forget and then writes delta, station, landing, meta, [DONE] and
     * closes the controller. At every one of those lines the agent loop has
     * called nothing, so any tool name between them is a forecast dressed as an
     * observation. Asserted here because the tempting repair is exactly that, or
     * a timer in the client, and this repo deleted a component for the second.
     *
     * Matched on the EMISSION, not the word: the branch's own comments name the
     * frame while arguing against sending it, and a guard that could not tell
     * those apart would forbid writing the argument down.
     */
    const at = source.indexOf("const dispatchedStation");
    expect(at, "the mission branch moved").toBeGreaterThan(-1);
    const missionBranch = source.slice(at, source.indexOf("[DONE]", at));
    expect(
      missionBranch,
      "a tool name was put on the mission stream, where no tool has run yet",
    ).not.toMatch(/JSON\.stringify\(\s*\{\s*tool/);
  });

  it("leaves the classifier's guessed station off the wire", () => {
    /*
     * THE ONE PLACE THIS ITEM WAS NOT FOLLOWED, and the reason is in the route: the
     * classifier's entry station is a guess, nothing on that branch routes by it,
     * and the same file already withdrew a sentence for saying it. So the frame
     * comes from `agentStation(mentionedAgent.slug)`, a property of a dispatch that
     * has happened, and `routed` stays unsent.
     *
     * If a chat dispatch ever starts a track carrying that route, this assertion is
     * the one to delete, and the paragraph above `const routed` says what else has
     * to change with it.
     */
    expect(source).toContain("void routed;");
    expect(source).not.toContain("station: routed");
    expect(source).not.toContain("routed.station");
  });
});
