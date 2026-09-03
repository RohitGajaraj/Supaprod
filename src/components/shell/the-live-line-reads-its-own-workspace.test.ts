/**
 * Read live at 00:37 IST 2026-09-04, standing in an EMPTY probe workspace: the
 * header said "1 decision is ready for you - What we expected did not happen:
 * Decline shipping ...". Both facts belonged to Helio Labs.
 *
 * Fourth instance of one defect: RLS answers "may they see this" and has never
 * answered "whose desk is this". `listRunsForStart`, `listTopOpportunities` and
 * the Discover source count were the first three.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const TRACK = code(readFileSync("src/lib/spine/track.functions.ts", "utf8"));
const SHELL = code(readFileSync("src/components/shell/AppFrame.tsx", "utf8"));

/** The body of one server function, brace-matched from its export. */
function fnBody(src: string, name: string): string {
  const start = src.indexOf(`export const ${name} = createServerFn`);
  expect(start).toBeGreaterThan(-1);
  const next = src.indexOf("\nexport const ", start + 1);
  return src.slice(start, next === -1 ? src.length : next);
}

const READS = ["listTracks", "listMovingTracks", "listGatesOnTracks"] as const;

describe("the shell's live line reads the workspace it is standing in", () => {
  it("filters each of the three reads on a workspace", () => {
    for (const name of READS) {
      const body = fnBody(TRACK, name);
      expect(body).toContain("resolveStartWorkspaceId");
      expect(body).toContain('q.eq("workspace_id", workspaceId)');
    }
  });

  it("takes the workspace as an input rather than guessing per read", () => {
    for (const name of READS) {
      expect(fnBody(TRACK, name)).toContain("ShellScope.parse");
    }
    expect(TRACK).toContain("const ShellScope = z.object({");
  });

  it("leaves an UNRESOLVED workspace unfiltered, never narrowed to zero", () => {
    // Narrowing to a workspace we cannot name turns a failed lookup into
    // "nothing is running", which is a claim. Same rule the first three
    // instances settled on.
    for (const name of READS) {
      const body = fnBody(TRACK, name);
      expect(body).toContain("if (workspaceId)");
      expect(body).not.toContain("if (!workspaceId) return []");
    }
  });

  it("puts the workspace in the query key, or the cache re-serves the old one", () => {
    // Without this the switch shows the previous workspace's answer from cache,
    // so the borrowed fact survives the fix meant to remove it.
    for (const key of ["gated-tracks", "open-tracks", "moving-tracks"]) {
      expect(SHELL).toContain(`queryKey: ["shell", "${key}", wsKey]`);
    }
    expect(SHELL).toContain("const wsKey = activeWorkspaceId ?? null;");
  });

  it("passes the same workspace it keys on", () => {
    // Two sources for one fact is how the count and the list disagree.
    expect(SHELL).toContain(
      "const wsArg = activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {};",
    );
    for (const fn of ["fetchGatedTracks", "fetchOpenTracks", "fetchMovingTracks"]) {
      expect(SHELL).toContain(`${fn}({ data: wsArg })`);
    }
  });

  it("leaves no shell read on spine_tracks without a workspace predicate", () => {
    // Counted rather than sampled: a fourth read added unscoped is the exact
    // regression, and it would inherit the badge P-60 is about to add.
    for (const name of READS) {
      const body = fnBody(TRACK, name);
      const opens = body.split('.eq("status", "open")').length - 1;
      expect(opens).toBeGreaterThan(0);
      expect(body.split('q.eq("workspace_id", workspaceId)').length - 1).toBe(opens);
    }
  });
});
