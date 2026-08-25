/**
 * THE FOLD REPORTS THE SURVIVING ROW (A, 2026-08-25).
 *
 * ── WHY ────────────────────────────────────────────────────────────────────
 * The restatement screen folds a signal that semantically matches evidence the
 * workspace already holds — and used to answer `ids: []`. `signals.log` then
 * returned `id: null`, `collectAttachments` filed no member row, and the driver
 * read a working sense crew as `produced-nothing`. Measured live on track
 * d1168015 (2026-08-25): visit one logged five signals, every one folded onto
 * rows another track had stored that morning, zero member rows, one attempt
 * burned — and ~46 older tracks sit dead at sense with the same shape. The only
 * ways past were rewording a fact or citing the loop's own artifacts as
 * "signals": a rule that punished honesty and rewarded theatre.
 *
 * The fix: the sink names the rows it folded onto (`restatedOnto`), and
 * `signals.log` hands back the surviving row's id when it inserted nothing.
 * Evidence this crew gathered that already exists is still evidence this work
 * rests on, so it attaches, and sense completes without anyone inventing
 * anything.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { foldTargets } from "./sink.server";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

describe("foldTargets", () => {
  it("names each stored row once, oldest fold first", () => {
    expect(
      foldTargets([
        { ofId: "aaa", rule: "vector", similarity: 0.97 },
        { ofId: "bbb", rule: "text", similarity: 1 },
        { ofId: "aaa", rule: "vector", similarity: 0.95 },
      ]),
    ).toEqual(["aaa", "bbb"]);
  });

  it("a fold onto a pending insert has no row to point at, and is excluded", () => {
    expect(foldTargets([{ ofId: null, rule: "vector", similarity: 0.98 }])).toEqual([]);
  });
});

describe("every sink answer carries the fold targets", () => {
  const SINK = read("./sink.server.ts");
  const body = SINK.slice(SINK.indexOf("export async function writeSignals("));

  it("all four return sites declare restatedOnto", () => {
    const returns = [...body.matchAll(/return \{[\s\S]*?\};/g)].map((m) => m[0]);
    expect(returns.length).toBeGreaterThanOrEqual(4);
    for (const r of returns) expect(r).toContain("restatedOnto");
  });

  it("the type demands it, so a fifth return site cannot forget", () => {
    expect(read("./kinds.ts")).toContain("restatedOnto: string[];");
  });
});

describe("signals.log points at the survivor", () => {
  const REGISTRY = read("../ai/tools/registry.server.ts");

  it("falls back to the folded-onto row when nothing was inserted", () => {
    expect(REGISTRY).toContain("result.ids[0] ?? result.restatedOnto[0] ?? null");
  });

  it("shows the agent the fold happened, instead of looking broken", () => {
    // Visit one's researcher concluded "the signals.log tool is not working" —
    // because the count that explained the empty result was dropped before the
    // agent could read it.
    expect(REGISTRY).toContain("restated: result.restated");
  });
});
