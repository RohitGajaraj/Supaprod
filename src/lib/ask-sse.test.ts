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
