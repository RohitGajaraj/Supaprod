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
  // Bounded at both ends (a-guards-subject-is-bounded): the handler, not the
  // rest of the file.
  const from = src.indexOf("export const getTrace ");
  const end = src.indexOf("\nexport ", from + 1);
  const body = src.slice(from, end === -1 ? undefined : end);
  it("the guard's subject is the handler", () => {
    expect(from).toBeGreaterThan(-1);
  });

  it("reads the run by the trace id the run row carries, newest first", () => {
    expect(body).toContain('.select("id,agent_slug,agent_name,track_id")');
    expect(body).toContain('.eq("trace_id", data.traceId)');
  });

  it("carries the track's title, the seat's own station, and returns it as `run`", () => {
    expect(body).toContain('.select("title")');
    // The turn's station is the seat's, fixed in the catalog: a Discover turn
    // is a Discover turn whatever station the track stands at today.
    expect(body).toContain("SPECIALIST_CATALOG.find((e) => e.slug === run.agent_slug)?.station");
    expect(body).toMatch(/return \{\s*traceId: data\.traceId,[\s\S]*?\n\s*run,\n/);
  });

  /*
   * ONE SEAT, ONE NAME (Lane 1 ruling, 2026-09-08). The trace heading and
   * the transcript named the same seat two ways ("Discovery Scout" here,
   * "Watch" on the home), and `presenceColour` hashes the name, so the seat
   * wore two colours. Both now resolve through `agentDisplayName(slug,
   * stored)`: the catalog role where the slug is known, the stored name
   * otherwise, the slug only when there is nothing else. Still never blank.
   */
  it("a seat is named by the same resolver the transcript uses, never blank", () => {
    expect(body).toContain("agentName: agentDisplayName(run.agent_slug, run.agent_name),");
    expect(body).not.toContain("run.agent_name?.trim() || run.agent_slug");
  });
});
