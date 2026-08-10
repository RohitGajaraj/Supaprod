/**
 * THE MOAT SURFACE MUST READ ONE WORKSPACE.
 *
 * Brain's three reads were user-scoped or unscoped while the surface around
 * them was workspace-scoped, and nothing marked the difference:
 *
 *   getCompounding      took no workspace argument at all
 *   getAgentMemory      filtered on user_id only
 *   getKnowledgeGraph   never touched artifact_lineage.workspace_id
 *
 * RLS did not save it. `learnings` is gated on `is_workspace_member(...)` and
 * `artifact_lineage` on `auth.uid() = user_id`, which are MEMBERSHIP and not
 * the ACTIVE workspace.
 *
 * Measured against production 2026-08-10: 5 users belong to more than one
 * workspace and 4 of those are members of a seeded Helio demo workspace. One
 * real account sees 21 learnings of which 5 are demo, so the headline "Real
 * outcomes have re-scored N calls" was inflated by roughly a quarter with
 * fiction, rendered directly above a sub-line whose counts ARE
 * workspace-scoped.
 *
 * That is worse than an empty state and worse than a wrong number: it is a
 * specific, believable claim about compounding that the user cannot audit, on
 * the one surface that carries the moat.
 *
 * These guards are source-level because the defect is an ABSENT filter, and
 * absence is what a runtime test of the happy path never sees.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

/** Comments stripped: this file's own fix is documented by describing the old
 *  unscoped behaviour, and a naive scan would match the prose. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const TODAY = codeOf(read(join("lib", "today.functions.ts")));
const MEMORY = codeOf(read(join("lib", "memory.functions.ts")));
const GRAPH = codeOf(read(join("lib", "knowledge-graph-view.functions.ts")));

describe("getCompounding reads one workspace", () => {
  const fn = TODAY.slice(TODAY.indexOf("export const getCompounding"));

  it("accepts a workspaceId", () => {
    expect(fn.slice(0, 1500)).toMatch(/workspaceId/);
  });

  it("applies it to the learnings read", () => {
    expect(fn.slice(0, 2500)).toMatch(/\.eq\("workspace_id"/);
  });
});

describe("getAgentMemory reads one workspace", () => {
  const fn = MEMORY.slice(MEMORY.indexOf("export const getAgentMemory"));

  it("accepts a workspaceId", () => {
    expect(fn.slice(0, 2000)).toMatch(/workspaceId/);
  });

  it("scopes the ROWS and the COUNT, not just the rows", () => {
    // Scoping the list and not the total would put one workspace's memories
    // under another workspace's number, which is the same defect in miniature
    // and harder to spot because the list itself would look correct.
    const body = fn.slice(0, 3000);
    const applications = [...body.matchAll(/\.eq\("workspace_id"/g)];
    expect(applications.length).toBeGreaterThanOrEqual(2);
  });
});

describe("getKnowledgeGraph reads one workspace", () => {
  it("accepts a workspaceId", () => {
    const fn = GRAPH.slice(GRAPH.indexOf("export const getKnowledgeGraph"));
    expect(fn.slice(0, 1500)).toMatch(/workspaceId/);
  });

  it("scopes the focus picker, not only the edges", () => {
    // The auto-focus picks the caller's most recent decision across every
    // workspace RLS permits. Anchor the graph on another workspace's newest
    // decision and every edge walked from it belongs to that workspace, even
    // with the edge queries scoped correctly.
    const fn = GRAPH.slice(GRAPH.indexOf("async function resolveFocus"));
    expect(fn.slice(0, 900)).toMatch(/\.eq\("workspace_id"/);
  });

  it("scopes BOTH directions of the walk", () => {
    // Scoping parents and not children walks out of the workspace on every
    // second hop and drags the neighbourhood back in, which looks mostly right
    // and is therefore worse than no scoping at all.
    const fn = GRAPH.slice(GRAPH.indexOf("async function fetchSubgraph"));
    const body = fn.slice(0, 2500);
    expect(body).toMatch(/upQ = upQ\.eq\("workspace_id"/);
    expect(body).toMatch(/downQ = downQ\.eq\("workspace_id"/);
  });

  it("scopes the lineage-anchored fallback focus too", () => {
    // The fallback runs exactly when the primary focus found no edges, which
    // is the common case on a young workspace — so an unscoped fallback is the
    // path most likely to actually fire.
    const fn = GRAPH.slice(GRAPH.indexOf("async function resolveLineageFocus"));
    expect(fn.slice(0, 700)).toMatch(/\.eq\("workspace_id"/);
  });
});
