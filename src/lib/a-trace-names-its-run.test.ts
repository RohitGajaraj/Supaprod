import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * A person reaches /traces/$traceId from "Open the full trace" on a transcript
 * turn and must not land with the run gone (Lane 2, 2026-09-08). getTrace
 * returns `run`, read off agent_runs by trace_id under RLS, with its track's
 * title and station, or null for a trace with no run behind it.
 */
describe("a trace names the run it belongs to", () => {
  const src = readFileSync("src/lib/traces.functions.ts", "utf8");
  const body = src.slice(src.indexOf("export const getTrace"));

  it("reads the run by the trace id the run row carries, newest first", () => {
    expect(body).toContain('.select("id,agent_slug,agent_name,track_id")');
    expect(body).toContain('.eq("trace_id", data.traceId)');
  });

  it("carries the track's title and station beside it, and returns it as `run`", () => {
    expect(body).toContain('.select("title,station")');
    expect(body).toMatch(/return \{\s*traceId: data\.traceId,[\s\S]*?\n\s*run,\n/);
  });

  it("a seat with no display name is named by its slug, never blank", () => {
    expect(body).toContain("agentName: run.agent_name?.trim() || run.agent_slug,");
  });
});
