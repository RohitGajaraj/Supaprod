/**
 * EVERY HOP THE TRUST LEDGER WALKS MUST HAVE CODE THAT WRITES IT.
 *
 * The failure this exists to prevent is not a broken edge. It is an edge that
 * was NEVER BUILT and looked built anyway.
 *
 * `artifact_lineage` declares `changeset` and `deployment` as first-class
 * kinds. The ledger walks signal -> decision -> spec -> build -> merge ->
 * deploy -> outcome through them. The Helio demo seed fabricates 21
 * `mission -> changeset` and 14 `changeset -> deployment` edges, so in a demo
 * the walk is unbroken and the screenshots are honest.
 *
 * Measured against production on 2026-08-10: no code path in src/ had ever
 * written `child_kind: "changeset"` or `child_kind: "deployment"`. Against 228
 * real missions there were ZERO real edges of either shape. The chain stopped
 * dead at the busiest station in the product, and the only place it continued
 * was seeded data. Three separate readings of that chain came out healthy
 * because they counted the demo workspaces.
 *
 * A per-edge unit test could not have caught this: there was no code to test.
 * Only a guard that starts from the CHAIN and asks "who writes this hop" finds
 * a hop nobody writes. That is what this is, and it will fail the same way for
 * the next kind somebody declares, seeds, and forgets to produce.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ARTIFACT_KINDS } from "../lineage.functions";

const SRC = join(import.meta.dir, "..", "..");

/** Every .ts/.tsx under src/, excluding tests and generated types: the set of
 *  files that could legitimately contain a production write. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "__tests__") continue;
      sourceFiles(full, out);
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;
    if (/\.test\.tsx?$/.test(entry)) continue;
    if (entry === "types.ts" && full.includes("integrations")) continue;
    out.push(full);
  }
  return out;
}

/** Source with comments stripped. A guard that reads raw text cannot tell code
 *  from prose ABOUT code, and this repo documents fixed defects by quoting the
 *  broken line verbatim — so a comment naming a hop would satisfy a naive scan
 *  and let the hop go unwritten. Same lesson as
 *  `the-brain-does-not-rank-fiction`. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const ALL_CODE = sourceFiles(SRC)
  .map((f) => codeOf(readFileSync(f, "utf8")))
  .join("\n");

/** Kinds that are produced by a real code path rather than only consumed.
 *  A kind read from the ledger but never written by us is legitimate (an
 *  `artifact` is a generic container; `b` is a test fixture leaking into the
 *  vocabulary), so the guard names the ones that MUST have a producer rather
 *  than demanding all of them. */
const MUST_BE_WRITTEN: readonly string[] = [
  "theme",
  "opportunity",
  "decision",
  "prd",
  "mission",
  "changeset",
  "deployment",
  "learning",
  "task",
];

/**
 * THE BLIND SPOT THIS GUARD SHIPPED WITH, found 2026-08-11 by an
 * investigation into a different hop.
 *
 * Everything below asserts that SOME code writes each child KIND. That is not
 * the same question as "is this hop written", and the difference is not
 * academic: `child_kind: "decision"` has three writers, whose parents are
 * `learning`, `opportunity` and `capability_change`. So this guard was green
 * while `prd -> decision` and `mission -> decision` had no writer at all --
 * and 105 of 154 real decisions carry `source_kind='mission'` with nothing in
 * the graph saying which mission.
 *
 * A guard that passes on a technicality is the same failure it was written to
 * catch. So the specific PAIRS the ledger actually walks are asserted here, by
 * parent and child together.
 *
 * Each entry names the file that must contain the writer, because a pair
 * satisfied from an unrelated module is the same technicality one level down.
 */
const REQUIRED_PAIRS: ReadonlyArray<{ parent: string; child: string; where: string }> = [
  { parent: "mission", child: "changeset", where: "lib/ai/tools/registry.server.ts" },
  { parent: "changeset", child: "deployment", where: "lib/deployments.functions.ts" },
  { parent: "prd", child: "learning", where: "lib/outcome.functions.ts" },
  // The two hops this guard's own blind spot was hiding. They are written by
  // `recordDecisionOrigins` rather than inline, because FOUR doors create a
  // decision carrying one of these ids and four copies of the workspace rule
  // is four chances to get WM-F1 wrong. The call sites are asserted separately
  // below, so "written in one place" cannot decay into "called from nowhere".
  { parent: "mission", child: "decision", where: "lib/lineage.functions.ts" },
  { parent: "prd", child: "decision", where: "lib/lineage.functions.ts" },
];

/**
 * Every door that inserts a decision carrying `mission_id` or `prd_id` must
 * stamp its origin. Naming the files is the point: a hop written once and
 * called from three of four doors is the same silent gap one level down, and
 * that is exactly the shape the audit found.
 */
const DECISION_ORIGIN_CALLERS: readonly string[] = [
  // The human and captured door: /decide's Capture, the spec page, ask-stream.
  "lib/decisions.functions.ts",
  // The 84 auto-origin "Mission completed" receipts, the largest producer.
  "lib/ai/handoff.server.ts",
  // The spec-approval receipt, the only prd-sourced decision in the product.
  "lib/discovery.functions.ts",
  // decision.record, the Decide station's agent-facing hand.
  "lib/ai/tools/registry.server.ts",
];

describe("every door that files a decision against a parent stamps the edge", () => {
  for (const where of DECISION_ORIGIN_CALLERS) {
    it(`${where} calls recordDecisionOrigins`, () => {
      const code = codeOf(readFileSync(join(SRC, ...where.split("/")), "utf8"));
      expect(code, `${where} inserts a decision but never stamps its origin`).toContain(
        "recordDecisionOrigins(",
      );
    });
  }

  it("the writer takes a workspace as a REQUIRED argument and forwards it", () => {
    // `artifact_lineage.workspace_id` defaults to
    // `current_user_default_workspace()`, the CALLER'S default and not the
    // workspace the artifacts live in. An optional parameter can be omitted by
    // a caller who simply did not think about it; a required one cannot, which
    // is the only mechanical difference between this and the WM-F1 failure.
    const lineage = codeOf(readFileSync(join(SRC, "lib", "lineage.functions.ts"), "utf8"));
    expect(lineage).toMatch(/workspaceId: string \| null;/);
    expect(lineage).not.toMatch(/workspaceId\?:/);
    expect(lineage).toMatch(/workspace_id: input\.workspaceId/);
  });
});

describe("the hops are asserted as PAIRS, not as child kinds", () => {
  for (const { parent, child, where } of REQUIRED_PAIRS) {
    it(`${parent} -> ${child} is written in ${where}`, () => {
      const code = codeOf(readFileSync(join(SRC, ...where.split("/")), "utf8"));
      const needle = `child_kind: "${child}"`;
      // EVERY occurrence, not the first. A file that writes one child kind from
      // two different parents -- which is exactly what closing the decision-
      // origin gap needed -- would otherwise have its second hop judged against
      // the window around its first, and fail for being in the wrong place
      // rather than for being absent.
      const spots: number[] = [];
      for (let at = code.indexOf(needle); at !== -1; at = code.indexOf(needle, at + 1)) {
        spots.push(at);
      }
      expect(spots.length, `${where} does not write child_kind "${child}"`).toBeGreaterThan(0);
      // The parent must be part of the SAME edge object, not merely present
      // somewhere in the file. 400 characters covers the largest of these
      // calls and stays well inside the next statement.
      const paired = spots.some((at) =>
        code.slice(Math.max(0, at - 400), at + 400).includes(`parent_kind: "${parent}"`),
      );
      expect(paired, `${where} writes "${child}" but not from parent "${parent}"`).toBe(true);
    });
  }
});

describe("every ledger hop the product claims has code that writes it", () => {
  for (const kind of MUST_BE_WRITTEN) {
    it(`something in src/ writes child_kind: "${kind}"`, () => {
      // The exact literal a recordLineage call site uses. If the shape of that
      // call ever changes, this guard should be updated deliberately rather
      // than deleted: the question it asks stays valid.
      expect(
        ALL_CODE.includes(`child_kind: "${kind}"`),
        `No code path writes a "${kind}" lineage edge. If the demo seed writes one, ` +
          `the chain is unbroken in a demo and broken in production, which is the ` +
          `exact defect this guard exists for.`,
      ).toBe(true);
    });
  }

  it("the two hops that closed the Build->Ship gap are written where they belong", () => {
    // Named specifically because these two were missing for the product's
    // whole life and the walk depends on both.
    const registry = codeOf(
      readFileSync(join(SRC, "lib", "ai", "tools", "registry.server.ts"), "utf8"),
    );
    const deployments = codeOf(readFileSync(join(SRC, "lib", "deployments.functions.ts"), "utf8"));
    expect(registry).toContain('child_kind: "changeset"');
    expect(deployments).toContain('child_kind: "deployment"');
  });

  it("both new edges carry an explicit workspace rather than the column default", () => {
    // `artifact_lineage.workspace_id` defaults to
    // `current_user_default_workspace()`, which is the CALLER'S default and
    // not necessarily the workspace the artifacts live in. Those differ as
    // soon as a user has two workspaces, and an edge filed under the wrong one
    // is read by the wrong reader forever after — the WM-F1 failure exactly.
    const registry = codeOf(
      readFileSync(join(SRC, "lib", "ai", "tools", "registry.server.ts"), "utf8"),
    );
    const changesetEdge = registry.slice(registry.indexOf('child_kind: "changeset"'));
    expect(changesetEdge.slice(0, 400)).toMatch(/workspace_id:/);

    const deployments = codeOf(readFileSync(join(SRC, "lib", "deployments.functions.ts"), "utf8"));
    const deploymentEdge = deployments.slice(deployments.indexOf('child_kind: "deployment"'));
    expect(deploymentEdge.slice(0, 400)).toMatch(/workspace_id:/);
  });

  it("every kind this guard names is a declared artifact kind", () => {
    // Stops the list above drifting into kinds the schema does not accept,
    // which would make the guard assert something unenforceable.
    for (const kind of MUST_BE_WRITTEN) {
      expect(ARTIFACT_KINDS as readonly string[]).toContain(kind);
    }
  });
});
