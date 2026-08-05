import { describe, expect, it } from "bun:test";
import { parseSseLine } from "./ask-sse";

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
