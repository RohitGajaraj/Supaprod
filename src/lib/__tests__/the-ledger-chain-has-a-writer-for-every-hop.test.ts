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
    const deployments = codeOf(
      readFileSync(join(SRC, "lib", "deployments.functions.ts"), "utf8"),
    );
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

    const deployments = codeOf(
      readFileSync(join(SRC, "lib", "deployments.functions.ts"), "utf8"),
    );
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
