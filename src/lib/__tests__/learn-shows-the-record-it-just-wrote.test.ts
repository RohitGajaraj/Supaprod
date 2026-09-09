import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { computeImpactLedger } from "@/lib/pm-impact";

/**
 * YOU SETTLE AN OUTCOME ON LEARN AND NOTHING ON LEARN CHANGES.
 *
 * Two independent defects produced the same symptom, and closing either one
 * alone leaves the symptom standing. Both were measured live on 2026-08-06.
 *
 * ONE: THE DESK AND THE RECORD READ DIFFERENT WORKSPACES.
 * `listPendingOutcomes` applies no workspace filter at all, deliberately: RLS
 * admits every workspace the reader belongs to, so the desk is every bet
 * anywhere that needs a call. `getImpactLedger` is ONE workspace and, called
 * with no argument, resolves `current_user_default_workspace()` -- the EARLIEST
 * `workspace_members` row, which has nothing to do with where the work is.
 * Live, for both accounts, those were different workspaces: the desk's two bets
 * sit in Helio Labs and the ledger was drawn from a sample workspace. So the
 * headline said "2 shipped bets need your call", you settled one, `applyOutcome`
 * wrote `learnings.workspace_id = prds.workspace_id` (Helio Labs), and "What
 * paid off", "What the record moved", the settled-count sub and the exported
 * document were all unchanged.
 *
 * The fix is to point the RECORD at the desk, and the direction matters. The
 * one-line alternative -- scope the desk to the default workspace -- makes the
 * two agree by emptying the desk, which takes the work away rather than showing
 * it. There is a test below that refuses that fix specifically.
 *
 * TWO: A FRESHLY SETTLED OUTCOME CANNOT REACH "WHAT PAID OFF".
 * That list is `computeImpactLedger`'s `highlights`: validated learnings only,
 * ranked by ICE shift, with a null shift sorted LAST (`-Infinity`) and three
 * kept. A bet with no linked opportunity gets `prior_ice` and `new_ice` null by
 * construction, because `applyOutcome` only rescores under `if
 * (prd.opportunity_id)`. Both bets on the desk carry `opportunity_id = null`.
 * So the freshly settled verdict is ranked behind every learning that ever
 * moved a score, forever, and the default workspace already holds three of
 * those. The receipt that DOES show it lives in React state and dies on reload.
 * Net: the only surviving trace of the write was a waiting count one lower.
 *
 * The fix is a row ordered by WHEN IT WAS WRITTEN, which is a fact every
 * learning has, rather than by a number an unlinked bet can never have. The
 * ranking itself lives in `pm-impact.ts`, which belongs to no station and is
 * not touched here.
 */

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** CODE ONLY. Every assertion here is about what the surface DOES, and this
 *  file's own prose names the defects in the same words the fix uses. */
const stripComments = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");

const OUTCOME = stripComments(read(join("lib", "outcome.functions.ts")));
const PANEL = stripComments(read(join("components", "learn", "SettlePanel.tsx")));
/* The record moved from the /learn route into a component mounted on Outcomes
   (Lane 2, 2026-09-09; P-14b): the route is a redirect now, and every
   assertion below holds on the component, which carries the same reads under
   the same keys. */
const ROUTE = stripComments(read(join("components", "learn", "LearnRecord.tsx")));

const QUEUE = OUTCOME.slice(
  OUTCOME.indexOf("export const listPendingOutcomes"),
  OUTCOME.indexOf("export const listAgentSettledOutcomes"),
);

describe("the desk tells the page which workspace it is working in", () => {
  it("carries the workspace on every bet it hands over", () => {
    // One more column on a row already being read. Without it the surface has
    // nothing to point the record at and has to guess, and the guess it was
    // making was the account's oldest workspace.
    expect(QUEUE).toMatch(/const PRD_COLS = "[^"]*workspace_id/);
    expect(QUEUE).toMatch(/workspaceId: p\.workspace_id \?\? null/);
  });

  it("carries it on the agent-settled half too, which is also a target", () => {
    // Reconsidering an agent's verdict is settling a bet, and that bet may not
    // live in the workspace the page is drawing. An overturn writes into the
    // bet's workspace either way.
    const settled = OUTCOME.slice(OUTCOME.indexOf("export const listAgentSettledOutcomes"));
    expect(settled.slice(0, 1600)).toMatch(/\.select\("[^"]*workspace_id"\)/);
    expect(settled).toMatch(/workspaceId: p\.workspace_id \?\? null/);
  });

  it("does NOT narrow the desk to one workspace, which is the wrong fix", () => {
    /**
     * The founder's standing ruling: today's surface is the floor, and an
     * affordance is replaced, never removed. Filtering this query to the
     * default workspace would make the desk and the record agree by emptying
     * the desk of every bet the reader actually has waiting. The union is the
     * feature.
     */
    expect(QUEUE).not.toMatch(/\.eq\("workspace_id"/);
  });
});

describe("the panel reports the bet in focus, rather than the page guessing", () => {
  it("puts the workspace on the target, from both halves of the desk", () => {
    expect(PANEL).toMatch(/workspaceId: reconsidering\.workspaceId/);
    expect(PANEL).toMatch(/workspaceId: pendingFocus\.workspaceId/);
  });

  it("tells the page when it changes, and only when it changes", () => {
    // The panel owns which bet is in focus (the queue row you clicked, the
    // agent verdict you are reconsidering), so it is the only thing that can
    // answer this. Keyed on the workspace and not on `target`, which is a fresh
    // object every render and would fire the callback on every one of them.
    expect(PANEL).toMatch(/onDeskWorkspace\?\.\(targetWorkspaceId\)/);
    expect(PANEL).toMatch(/\}, \[targetWorkspaceId, onDeskWorkspace\]\)/);
  });
});

describe("the record on the page is the record for that workspace", () => {
  it("hands the workspace to the ledger instead of letting it default", () => {
    expect(ROUTE).toMatch(/fLedger\(\{ data: recordWorkspaceId \? \{ workspaceId/);
  });

  it("keys the cache by workspace, so one key cannot hold two answers", () => {
    // Two workspaces under one key is the cache serving one workspace's record
    // to another. Both keys still match SettlePanel's invalidations, which are
    // by prefix.
    expect(ROUTE).toMatch(/queryKey: \["impact-ledger", recordWorkspaceId\]/);
    expect(ROUTE).toMatch(/queryKey: \["learnings", recordWorkspaceId\]/);
  });

  it("subscribes to what the panel reports", () => {
    expect(ROUTE).toMatch(/<SettlePanel onDeskWorkspace=\{rememberDeskWorkspace\} \/>/);
  });

  it("keeps the last workspace it was NAMED, and a null is not a name", () => {
    /**
     * SETTLING THE LAST BET ON THE DESK REPORTS null.
     *
     * The panel reports whichever bet is in focus, and after the final settle
     * there is none. Clearing on that would hand the ledger straight back to
     * `current_user_default_workspace()` at the exact moment the reader wrote
     * into a different workspace: every count on the page changes under an
     * unchanged headline, and the last-verdict row, gated on knowing the
     * workspace, vanishes on the one write it was built to survive. Only
     * another workspace replaces a workspace.
     */
    expect(ROUTE).toMatch(/if \(workspaceId\) setFocusWorkspaceId\(workspaceId\)/);
  });

  it("falls back to the desk itself before the panel's first report", () => {
    // So the first paint is already right, rather than briefly drawing another
    // workspace's numbers and then correcting itself.
    expect(ROUTE).toMatch(/pendingQ\.data\?\.pending\[0\]\?\.workspaceId/);
    expect(ROUTE).toMatch(/settledQ\.data\?\.settled\[0\]\?\.workspaceId/);
  });
});

describe("what you just settled is on the page after a reload", () => {
  it("is read back from the learnings themselves, newest first", () => {
    // NOT from `highlights`. See the ledger test below for why that list can
    // never carry it.
    expect(ROUTE).toMatch(/listLearnings/);
    expect(ROUTE).toMatch(/lastQ\.data\?\.learnings\[0\] \?\? null/);
    expect(ROUTE).toMatch(/title="The last verdict on the record"/);
  });

  it("is scoped to the same workspace as the record beside it", () => {
    // Unfiltered, `listLearnings` returns the union across every workspace the
    // reader belongs to. A row from one workspace beside a ledger from another
    // is the first defect wearing the second one's clothes.
    expect(ROUTE).toMatch(/fLearnings\(\{ data: \{ workspaceId: recordWorkspaceId \} \}\)/);
    expect(ROUTE).toMatch(/enabled: !!recordWorkspaceId/);
  });

  it("says the verdict in the station's three words, from the shared source", () => {
    // A second private map here and the desk and the record drift into calling
    // the same verdict two things.
    expect(ROUTE).toMatch(/from "@\/components\/learn\/verdict-words"/);
    expect(PANEL).toMatch(/from "@\/components\/learn\/verdict-words"/);
  });

  it("prints no score movement over a bet that never had a score", () => {
    // The whole class of bug this station keeps paying for is a zero standing
    // in for an absence. `iceShiftOf` returns null when either end is missing.
    expect(ROUTE).toMatch(/shift === null \|\| shift === 0 \? null/);
  });
});

describe("why that row has to exist: the paid-off list cannot carry it", () => {
  it("ranks an unlinked bet's verdict behind every scored one, permanently", () => {
    /**
     * The live shape, reproduced against the real pure function: a workspace
     * whose record already holds three validated learnings that moved a score,
     * plus the one just settled on a bet with no linked opportunity. Its ICE
     * shift is null because `applyOutcome` rescored nothing, null sorts to
     * -Infinity, and `maxHighlights` is 3.
     */
    const ledger = computeImpactLedger({
      learnings: [
        {
          verdict: "validated",
          summary: "The one you just settled",
          prior_ice: null,
          new_ice: null,
        },
        {
          verdict: "validated",
          summary: "Older, and it moved a score",
          prior_ice: 5,
          new_ice: 10.4,
        },
        { verdict: "validated", summary: "Older still", prior_ice: 5, new_ice: 8.7 },
        { verdict: "validated", summary: "Older again", prior_ice: 5, new_ice: 7 },
      ],
    });
    expect(ledger.highlights.map((h) => h.summary)).not.toContain("The one you just settled");
    expect(ledger.outcomes.total).toBe(4);
  });

  it("and never carries a miss or a mixed verdict at all, by design", () => {
    // "What paid off" is honest about being wins-only and counts the misses out
    // loud above the list. That is the right call for that block and the reason
    // it cannot double as "what you last settled".
    const ledger = computeImpactLedger({
      learnings: [
        { verdict: "missed", summary: "It did not work", prior_ice: 7, new_ice: 4 },
        { verdict: "mixed", summary: "The signal was mixed", prior_ice: 7, new_ice: 6 },
      ],
    });
    expect(ledger.highlights).toEqual([]);
    expect(ledger.outcomes.missed).toBe(1);
    expect(ledger.outcomes.mixed).toBe(1);
  });
});
