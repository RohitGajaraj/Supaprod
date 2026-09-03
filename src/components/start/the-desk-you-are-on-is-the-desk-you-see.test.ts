/**
 * ── START SHOWED EVERY WORKSPACE'S WORK UNDER ONE WORKSPACE'S NAME ────────
 *
 * Found by making the first second workspace ever created on production
 * (P-33, 2026-09-03) and opening Start. The switcher said "A2 arrival check",
 * a workspace seconds old with nothing in it, and the page listed Helio Labs'
 * three ranked bets and its whole run list underneath, as that workspace's
 * own.
 *
 * Two separate omissions, each sufficient on its own:
 *
 *   the server   `listRunsForStart` filtered on nothing but `status`, and
 *                `listTopOpportunities` ordered every `opportunities` row by
 *                ICE and took twenty. Both leaned on RLS, which scopes to
 *                every workspace a person BELONGS TO. That is the right
 *                answer to "may they see this" and the wrong answer to
 *                "whose desk is this".
 *
 *   the client   both `useQuery` keys named the page and not the workspace,
 *                so switching served the previous workspace's rows from cache
 *                under the new name until something happened to refetch.
 *
 * Nobody could reach it before: `workspaces` had no INSERT policy, so no
 * account could hold two workspaces at all (20260907010000, 20260908010000).
 * Fixing that wall is what uncovered this, and it is the reason the guard
 * exists rather than the fix alone. The next surface that starts reading
 * per-workspace data will be written by someone who never saw the wall.
 *
 * WHY UNRESOLVED STAYS UNFILTERED. Both reads narrow only when the workspace
 * id is known. An id we cannot resolve must not become an empty desk: "you
 * have nothing" is a claim, and making it on the strength of a failed lookup
 * is the substitution this repo keeps paying for.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const START = strip(readFileSync("src/routes/_authenticated.start.tsx", "utf8"));
const RUNS_UI = strip(readFileSync("src/components/start/YourRuns.tsx", "utf8"));
const TRACKS = strip(readFileSync("src/lib/spine/track.functions.ts", "utf8"));
const DISCOVERY = strip(readFileSync("src/lib/discovery.functions.ts", "utf8"));

/** `listRunsForStart`'s handler only, bounded at the next export. */
const RUNS_FN = TRACKS.slice(
  TRACKS.indexOf("export const listRunsForStart"),
  TRACKS.indexOf("export const", TRACKS.indexOf("export const listRunsForStart") + 20),
);
/** `listTopOpportunities`' handler only. */
const BETS_FN = DISCOVERY.slice(
  DISCOVERY.indexOf("export const listTopOpportunities"),
  DISCOVERY.indexOf("export const", DISCOVERY.indexOf("export const listTopOpportunities") + 20),
);

describe("the server reads name the workspace", () => {
  it("scopes the run list", () => {
    expect(RUNS_FN.replace(/\s+/g, " ")).toContain('tracksQuery.eq("workspace_id", workspaceId)');
  });

  it("scopes the ranked bets", () => {
    expect(BETS_FN.replace(/\s+/g, " ")).toContain('betsQuery.eq("workspace_id", workspaceId)');
  });

  it("takes the workspace as an input rather than assuming one", () => {
    expect(RUNS_FN).toContain("workspaceId");
    expect(BETS_FN).toContain("workspaceId");
  });

  it("leaves the read unfiltered when the workspace cannot be resolved", () => {
    // `if (workspaceId)` and not a bare `.eq(...)`: an unresolved id must not
    // silently become "this workspace has nothing".
    expect(RUNS_FN.replace(/\s+/g, " ")).toContain("if (workspaceId) tracksQuery");
    expect(BETS_FN.replace(/\s+/g, " ")).toContain("if (workspaceId) betsQuery");
  });
});

describe("the cache keys name the workspace too", () => {
  it("keys the run list by workspace on both surfaces that share it", () => {
    // They share ONE entry on purpose, so they must key it identically.
    expect(START.replace(/\s+/g, " ")).toContain('["start-runs", activeWorkspaceId ?? null]');
    expect(RUNS_UI.replace(/\s+/g, " ")).toContain('["start-runs", activeWorkspaceId ?? null]');
  });

  it("keys the ranked bets by workspace", () => {
    expect(START.replace(/\s+/g, " ")).toContain(
      '["start-top-opportunities", activeWorkspaceId ?? null]',
    );
  });

  it("passes the workspace to the server, not just into the key", () => {
    // A key alone would still let one workspace's rows answer another's read
    // on the first fetch after a switch.
    const flat = START.replace(/\s+/g, " ");
    expect(flat).toContain("fRuns({ data: { workspaceId: activeWorkspaceId ?? null } })");
    expect(flat).toContain("fBets({ data: { workspaceId: activeWorkspaceId ?? null } })");
  });
});
