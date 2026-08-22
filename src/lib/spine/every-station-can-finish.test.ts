/**
 * Every station is able to finish, which is not the same as every station working.
 *
 * WHY THIS FILE EXISTS. The driver decides a station finished by one predicate:
 * `attached.length === 0` means it filed nothing. `attached` is built from the
 * run's tool steps filtered through `TOOL_PRODUCTS` (./attach.ts), so a station
 * only counts as having produced something when a seat called a tool that
 * `TOOL_PRODUCTS` maps to an artifact.
 *
 * THAT MAKES THREE SEPARATE LISTS HAVE TO AGREE, and nothing checked that they
 * did:
 *
 *   1. `CREW_ROLE.file`  - what each seat is TOLD to call, in prose.
 *   2. `TOOL_REGISTRY`   - what actually exists and can be dispatched.
 *   3. `TOOL_DEFAULTS`   - whether it reaches the agent's prompt at all.
 *   4. `TOOL_PRODUCTS`   - whether calling it counts as the station finishing.
 *
 * A brief naming a tool that is absent from 2 instructs an impossible call. A
 * brief naming a tool disabled in 3 instructs a call the agent cannot see. And a
 * station whose whole crew is told to call tools missing from 4 can do exactly as
 * instructed, succeed, and STILL be recorded as having produced nothing, three
 * times, until the correction loop freezes it.
 *
 * That last one is not hypothetical in shape. The driver's own comment records
 * the live version: Plan's agent wrote a complete spec into its final answer and
 * never called `prd.draft`, because the tool was missing from that account, so
 * the loop ran end to end and delivered nothing. The tool-seeding shape that
 * caused it has since been replaced by `TOOL_DEFAULTS`; what has never existed is
 * a check that the four lists line up.
 *
 * These are pure and need no database, which is the point: the spine's ability to
 * COMPLETE is a property of four code-side lists, so it can be proven before
 * anything ships rather than discovered by watching tracks freeze.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { stationCrew } from "./driver";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { TOOL_PRODUCTS, STATION_ARTIFACT } from "./attach";
import { ARTIFACT_SOURCE } from "./chain";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

/**
 * Tool names a brief mentions, recovered from its prose.
 *
 * The briefs are written FOR AN AGENT, so they name tools in sentences rather
 * than in a list, and that is deliberate: an agent reads the instruction, not a
 * schema. Matching `word.word` against the registry's own key set is what turns
 * that prose back into a checkable claim, and it cannot invent a name because
 * every candidate has to already be a known tool.
 */
function toolsNamedIn(text: string, known: ReadonlySet<string>): string[] {
  const candidates = text.match(/\b[a-z][a-z_]*\.[a-z][a-z_]*\b/g) ?? [];
  return [...new Set(candidates.filter((c) => known.has(c)))];
}

/** Every tool name the platform knows about, from the policy map. */
const KNOWN_TOOLS: ReadonlySet<string> = new Set(Object.keys(TOOL_DEFAULTS));

/** Every tool whose successful call the driver counts as station output. */
const FILING_TOOLS: ReadonlySet<string> = new Set(Object.keys(TOOL_PRODUCTS));

describe("the briefs name tools that exist and can be reached", () => {
  it("every station has a crew", () => {
    // A station with no crew returns `no-agent`, which is terminal in practice.
    for (const station of AGENT_STATION_ORDER) {
      expect(stationCrew(station).length, `${station} has no crew`).toBeGreaterThan(0);
    }
  });

  it("every seat is told to file something, in words naming a real tool", () => {
    for (const station of AGENT_STATION_ORDER) {
      for (const seat of stationCrew(station)) {
        expect(seat.file.length, `${station}/${seat.slug} has no filing instruction`).toBeGreaterThan(
          0,
        );
        const named = toolsNamedIn(seat.file, KNOWN_TOOLS);
        expect(
          named.length,
          `${station}/${seat.slug} names no known tool in: ${seat.file.slice(0, 120)}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("every tool a brief names is enabled by default, so it reaches the prompt", () => {
    // A DISABLED tool is dropped from the agent's tool list, so the brief
    // instructs a call the agent cannot make and cannot see. That is the exact
    // shape that made Plan write a spec into prose and file nothing.
    for (const station of AGENT_STATION_ORDER) {
      for (const seat of stationCrew(station)) {
        for (const tool of toolsNamedIn(seat.file, KNOWN_TOOLS)) {
          expect(
            TOOL_DEFAULTS[tool]?.enabled,
            `${station}/${seat.slug} is told to call ${tool}, which is not enabled by default`,
          ).toBe(true);
        }
      }
    }
  });
});

describe("every station can be RECORDED as finishing", () => {
  /**
   * THE INVARIANT THAT MATTERS MOST HERE.
   *
   * `driveTrackOnce` advances only when `attached.length > 0`, and `attached`
   * counts only tools present in `TOOL_PRODUCTS`. So a station whose entire crew
   * is told to call tools outside that set is structurally unable to finish: the
   * agents succeed, the driver records `produced-nothing`, and after three
   * attempts the correction loop takes over on a station that did its job.
   */
  it("has at least one seat whose filing tool the driver counts as output", () => {
    for (const station of AGENT_STATION_ORDER) {
      const filing = stationCrew(station).flatMap((seat) =>
        toolsNamedIn(seat.file, KNOWN_TOOLS).filter((t) => FILING_TOOLS.has(t)),
      );
      expect(
        filing.length,
        `${station} can never be recorded as finishing: no seat is told to call a tool in TOOL_PRODUCTS`,
      ).toBeGreaterThan(0);
    }
  });

  it("produces at least one artifact kind the chain reader can resolve", () => {
    // A member row whose kind is absent from ARTIFACT_SOURCE is dropped silently
    // by loadUpstream, so the station would "finish" and hand the next one
    // nothing. Advancing on an unreadable artifact is worse than not advancing.
    for (const station of AGENT_STATION_ORDER) {
      const kinds = stationCrew(station)
        .flatMap((seat) => toolsNamedIn(seat.file, KNOWN_TOOLS))
        .filter((t) => FILING_TOOLS.has(t))
        .map((t) => TOOL_PRODUCTS[t].kind);
      const resolvable = kinds.filter((k) => ARTIFACT_SOURCE[k]);
      expect(
        resolvable.length,
        `${station} files only kinds the chain cannot resolve: ${kinds.join(", ")}`,
      ).toBeGreaterThan(0);
    }
  });

  it("files the kind its own station contract expects", () => {
    // STATION_ARTIFACT states what each station is FOR. It is deliberately not a
    // filter in the driver (a waived route must still be able to move), but a
    // station whose crew cannot produce its own expected kind is a design error
    // rather than a flexible route: Design that can only file tasks has not
    // designed anything.
    for (const station of AGENT_STATION_ORDER) {
      // STATION_ARTIFACT holds a record, not a bare kind: {kind, table, createdBy, gap}.
      const expected = STATION_ARTIFACT[station]?.kind;
      if (!expected) continue;
      const kinds = new Set(
        stationCrew(station)
          .flatMap((seat) => toolsNamedIn(seat.file, KNOWN_TOOLS))
          .filter((t) => FILING_TOOLS.has(t))
          .map((t) => TOOL_PRODUCTS[t].kind),
      );
      expect(
        [...kinds],
        `${station} is expected to file ${String(expected)} and its crew cannot`,
      ).toContain(expected);
    }
  });
});

describe("a brief must name the arguments its tool actually refuses without", () => {
  /**
   * THE FIFTH AGREEMENT, and the one the other four could not catch.
   *
   * The lists above check that a brief names a tool that EXISTS, is ENABLED, and
   * COUNTS as output. All three can hold while the brief still sends the agent
   * into a guaranteed refusal, because none of them reads the tool's SCHEMA.
   *
   * That is not hypothetical. `prd-writer` once named an argument `prd.draft` did
   * not have, and the fix had to land in both the crew seat and the `FILE_IT`
   * fallback -- the comment recording it is still in `driver.ts`. On 2026-08-22
   * `decision.record` began REFUSING a decision with no forecast, on the same
   * grounds it already refuses one with no rejected alternative, and three seats
   * still described the old call.
   *
   * The cost is not a crash. `loop.server.ts` hands the refusal back and the agent
   * retries, so it self-heals while burning a turn and filing an error step on
   * every Decide run. A self-healing defect survives longest, because nothing
   * ever goes red.
   *
   * THE REQUIREMENT IS READ FROM THE SCHEMA, NOT HARDCODED. If the forecast stops
   * being required, this guard stops demanding it, on its own.
   */
  const DECISION_RECORD = "decision.record";

  /** Does the live schema refuse a decision that carries no forecast? */
  function forecastIsRequired(): boolean {
    const def = (TOOL_REGISTRY as Record<string, { argsSchema?: { safeParse: (v: unknown) => { success: boolean } } }>)[
      DECISION_RECORD
    ];
    if (!def?.argsSchema) return false;
    // Satisfies every OTHER rule the tool has, and carries no forecast.
    return !def.argsSchema.safeParse({
      title: "a title",
      rationale: "a rationale long enough that the schema accepts it on its own terms",
      alternatives_considered: ["a rejected alternative"],
    }).success;
  }

  it("refuses a forecast-less decision, or this guard is measuring nothing", () => {
    expect(forecastIsRequired()).toBe(true);
  });

  it("every crew seat that names decision.record names the forecast", () => {
    if (!forecastIsRequired()) return;
    const silent: string[] = [];
    for (const station of AGENT_STATION_ORDER) {
      for (const seat of stationCrew(station)) {
        if (!toolsNamedIn(seat.file, KNOWN_TOOLS).includes(DECISION_RECORD)) continue;
        if (!/forecast/i.test(seat.file)) silent.push(`${station}/${seat.slug}`);
      }
    }
    expect(silent).toEqual([]);
  });

  it("the FILE_IT fallback that names decision.record names the forecast", () => {
    if (!forecastIsRequired()) return;
    // Read from source: `FILE_IT` is module-private, and the `prd-writer`
    // precedent is explicit that the seat and the fallback are two places one
    // correction has to land. A guard covering only the seats would miss half.
    const src = readFileSync(join(import.meta.dir, "driver.ts"), "utf8");
    const block = src.slice(src.indexOf("const FILE_IT"));
    const entries = block.matchAll(/^\s{2}([a-z]+):\s*\n?\s*"((?:[^"\\]|\\.)*)"/gm);
    const silent: string[] = [];
    for (const m of entries) {
      const [, station, text] = m;
      if (!text.includes(DECISION_RECORD)) continue;
      if (!/forecast/i.test(text)) silent.push(`FILE_IT.${station}`);
    }
    expect(silent).toEqual([]);
  });
});

describe("the four lists cannot drift apart quietly", () => {
  it("every filing tool is a registered tool with a policy", () => {
    // TOOL_PRODUCTS naming a tool that no longer exists would make the driver
    // wait for output that can never arrive.
    for (const tool of FILING_TOOLS) {
      expect(TOOL_DEFAULTS[tool], `${tool} is in TOOL_PRODUCTS with no default policy`).toBeTruthy();
    }
  });

  it("every filing tool produces a kind the chain can read", () => {
    for (const [tool, product] of Object.entries(TOOL_PRODUCTS)) {
      expect(
        ARTIFACT_SOURCE[product.kind],
        `${tool} produces kind '${product.kind}', which ARTIFACT_SOURCE cannot resolve`,
      ).toBeTruthy();
    }
  });

  it("names each station's expected artifact as a resolvable kind", () => {
    for (const station of AGENT_STATION_ORDER) {
      const expected = STATION_ARTIFACT[station as AgentStation]?.kind;
      if (!expected) continue;
      expect(
        ARTIFACT_SOURCE[String(expected)],
        `${station} expects kind '${String(expected)}', which ARTIFACT_SOURCE cannot resolve`,
      ).toBeTruthy();
    }
  });
});

describe("a filing tool hands back the id the driver reads", () => {
  /**
   * THE OTHER HALF OF "CAN THIS STATION FINISH", and it is a runtime-fatal shape
   * that `tsc` cannot see.
   *
   * `collectAttachments` files a member row by reading `TOOL_PRODUCTS[tool].idField`
   * off the step's result. So a tool can be registered, enabled, present in
   * `TOOL_PRODUCTS`, called successfully by the agent, and STILL leave the station
   * recorded as producing nothing, purely because the shape it returns does not
   * carry the field the map expects. Nothing typechecks that: a tool's `run`
   * returns `unknown` as far as the driver is concerned.
   *
   * This nearly happened on 2026-08-15. `signals.log` was moved off a hand-rolled
   * insert onto the sink, to gain the `stage_events` trail row that
   * `loop-state.functions.ts` renders "New signals came in" from. The sink reports a
   * BATCH and originally returned only counts, so the obvious version of that change
   * would have made Discover's own evidence unattachable and frozen the first
   * station of the spine. `SinkResult.ids` exists because of it.
   *
   * A source-text check rather than an execution one, because running these tools
   * needs a database, a workspace and a live model. What it proves is narrow and
   * worth having: the field name the map reads appears in what the tool returns.
   */
  const REGISTRY = readFileSync(join(import.meta.dir, "..", "ai", "tools", "registry.server.ts"), "utf8");

  /** The `run` body of one tool, from its `name:` to the next tool's `def(`. */
  function toolBody(tool: string): string | null {
    const at = REGISTRY.indexOf(`name: "${tool}"`);
    if (at < 0) return null;
    const runAt = REGISTRY.indexOf("run:", at);
    if (runAt < 0) return null;
    // Bounded so a match cannot leak in from the next tool's body.
    return REGISTRY.slice(runAt, runAt + 4000);
  }

  it("signals.log returns the field TOOL_PRODUCTS reads off it", () => {
    // The exact regression that would refreeze Discover.
    const body = toolBody("signals.log");
    expect(body, "signals.log is no longer in the registry").toBeTruthy();
    const idField = TOOL_PRODUCTS["signals.log"].idField;
    expect(idField).toBe("id");
    expect(
      body!.includes(`${idField}:`),
      `signals.log must return a '${idField}' field or the driver cannot attach what it filed`,
    ).toBe(true);
  });

  it("signals.log goes through the sink, so the trail row is written", () => {
    // The reason it was changed at all. Without the sink there is no
    // `stage_events` row with to_stage 'sensed', and loop-state renders "New
    // signals came in" from exactly that row, so the autonomous spine's own
    // evidence was invisible to the surface reporting where the loop stands.
    const body = toolBody("signals.log");
    expect(body!.includes("writeSignals"), "signals.log must file through the sink").toBe(true);
  });

  it("every filing tool names an idField, so none is silently unattachable", () => {
    for (const [tool, product] of Object.entries(TOOL_PRODUCTS)) {
      expect(product.idField.length, `${tool} has no idField`).toBeGreaterThan(0);
    }
  });
});
