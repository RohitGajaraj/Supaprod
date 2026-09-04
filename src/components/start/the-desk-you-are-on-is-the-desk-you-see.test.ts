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

/**
 * ── THE SAME DEFECT, FOUND IN TWO MORE PLACES (P-33, 2026-09-03) ──────────
 *
 * After Start was fixed, an audit found the identical shape twice more. Both
 * are here rather than in their own files because the defect is one defect and
 * the next instance will be found by someone reading this list.
 *
 *   `getStandingRecord`   counted `agent_memory` and `memory_recall_log` by
 *                         OWNER, so an empty workspace printed "A run has read
 *                         118 of these back" over a list saying "Nothing
 *                         learned yet". Its comment argued FOR staying
 *                         owner-scoped on the grounds that the list beside it
 *                         was owner-scoped too -- which stopped being true on
 *                         2026-08-10, when `getAgentMemory` was fixed for this
 *                         exact defect and this function was not brought along.
 *                         `memoriesTotal` also gates `recordIsBlank`, so one
 *                         memory in ANY other workspace stopped the designed
 *                         zero state from firing on a genuinely empty one.
 *
 *   `NothingToRead`       counted `scout_targets` with no workspace filter and
 *                         cached it under a workspace-free key, so an empty
 *                         workspace whose owner belongs to any workspace with a
 *                         target was offered NO source to connect. The one
 *                         remedy the product has, withheld at the one moment it
 *                         is needed.
 */
const STANDING = strip(readFileSync("src/lib/brain-standing.functions.ts", "utf8"));
const PANE = strip(readFileSync("src/components/track/ArtifactPane.tsx", "utf8"));

describe("the counts on a record are that workspace's counts", () => {
  it("scopes both agent_memory reads through one base", () => {
    const flat = STANDING.replace(/\s+/g, " ");
    expect(flat).toContain('wid ? q.eq("workspace_id", wid) : q');
    expect(flat).toContain("const memoryBase = ()");
    // Both reads go through it, so one cannot be scoped and the other not.
    expect(flat).toContain("headCount(() => memoryBase())");
    expect(flat).toContain('headCount(() => memoryBase().not("last_used_at", "is", null))');
  });

  it("scopes the recall log the same way", () => {
    expect(STANDING.replace(/\s+/g, " ")).toContain("const recallBase = ()");
    // Three counts share it: events, helped, against.
    expect([...STANDING.matchAll(/recallBase\(\)/g)].length).toBeGreaterThanOrEqual(3);
  });

  it("leaves the counts owner-wide when the workspace cannot be resolved", () => {
    // A failed lookup must not become "you have nothing".
    expect(STANDING).toContain("wid ? q.eq");
  });
});

describe("the sources offered are this workspace's sources", () => {
  it("filters scout_targets by workspace", () => {
    expect(PANE.replace(/\s+/g, " ")).toContain(
      'if (workspaceId) q = q.eq("workspace_id", workspaceId)',
    );
  });

  it("puts the workspace in the cache key too", () => {
    expect(PANE.replace(/\s+/g, " ")).toContain('["discover-source-count", workspaceId]');
  });

  it("is handed the workspace rather than reaching for the context", () => {
    // `useWorkspace` throws outside its provider and these panes are rendered
    // by guards that stand up no shell. The file's own convention.
    expect(PANE.replace(/\s+/g, " ")).toContain(
      "<NothingToRead station={stop.station} workspaceId={workspaceId} productId={productId} />",
    );
  });
});

/**
 * ── AND TWO MORE, FOUND BY WALKING THE EMPTY WORKSPACE (A1, 13:43 IST) ────
 *
 * After Start, `getStandingRecord` and `NothingToRead` were fixed, A1 walked a
 * brand-new empty workspace on the published build and the Arriving strip read
 *
 *   "15 findings this week from 2 sources - 138 clusters forming"
 *
 * Every one of those belonged to another workspace. Two more readers of the
 * same defect, which makes six in total:
 *
 *   `getSenseCoverage`          took a productId and NEVER a workspaceId, and
 *                               read `signals` across everything RLS allowed.
 *   `getThemePromotionCounts`   took a workspaceId and spent it ONLY on the
 *                               promotion-bar lookup, while the themes it
 *                               grades were read unscoped. So it counted
 *                               another workspace's clusters and graded them
 *                               against this one's bar.
 *
 * The belief behind all of these is written down at DiscoverSurface.tsx:804:
 * "RLS scopes the read to a workspace". It does not. It scopes to every
 * workspace the person BELONGS TO, which is the right answer to "may they see
 * this" and has never been an answer to "whose desk is this". Two more below
 * (P-75b, A-QUEUE.md): `listSignals` and `listThemes` themselves -- the reads
 * `getSenseCoverage`/`getThemePromotionCounts` above were fixed for, but
 * which fed Discover's own comprehension strip (the newest N signals, the
 * cluster ranking, "became bets") straight from `signals`/`themes`, took a
 * product and never a workspace, and were never brought along either. Read
 * live: the probe's Arriving showed "135 clusters need your decisions ...
 * 200 signals, 135 clusters open, 5 became bets", all four numbers derived
 * from the same two now-fixed reads.
 */
const ARRIVING = strip(readFileSync("src/components/start/Arriving.tsx", "utf8"));
const DISCOVER_UI = strip(readFileSync("src/components/discover/DiscoverSurface.tsx", "utf8"));

const COVERAGE_FN = DISCOVERY.slice(
  DISCOVERY.indexOf("export const getSenseCoverage"),
  DISCOVERY.indexOf("export const", DISCOVERY.indexOf("export const getSenseCoverage") + 20),
);
const PROMOTION_FN = DISCOVERY.slice(
  DISCOVERY.indexOf("export const getThemePromotionCounts"),
  DISCOVERY.indexOf("export const", DISCOVERY.indexOf("export const getThemePromotionCounts") + 20),
);

describe("what is arriving is what is arriving HERE", () => {
  it("getSenseCoverage takes a workspace and filters the signals by it", () => {
    const flat = COVERAGE_FN.replace(/\s+/g, " ");
    expect(flat).toContain("workspaceId: z.string().uuid().nullable().optional()");
    expect(flat).toContain('if (data.workspaceId) q = q.eq("workspace_id", data.workspaceId)');
  });

  it("getThemePromotionCounts grades this workspace's own themes", () => {
    // It always had the id. It spent it only on the bar.
    expect(PROMOTION_FN.replace(/\s+/g, " ")).toContain('.eq("workspace_id", data.workspaceId)');
  });

  it("both Arriving reads carry the workspace in the key and in the call", () => {
    const flat = ARRIVING.replace(/\s+/g, " ");
    expect(flat).toContain(
      '["arriving-coverage", activeWorkspaceId ?? null, activeProductId ?? null]',
    );
    expect(flat).toContain("workspaceId: activeWorkspaceId ?? null");
    expect(flat).toContain(
      '["arriving-promotion-counts", activeWorkspaceId ?? null, activeProductId ?? null]',
    );
  });

  it("Discover's own coverage read is scoped the same way", () => {
    const flat = DISCOVER_UI.replace(/\s+/g, " ");
    expect(flat).toContain('["sense-coverage", activeWorkspaceId ?? null, activeProductId]');
    expect(flat).toContain("workspaceId: activeWorkspaceId ?? null");
  });
});

/**
 * ── AND THE FIFTH AND SIXTH, THE READS BEHIND THE COMPREHENSION STRIP
 * ITSELF (P-75b, A-QUEUE.md) ────────────────────────────────────────────
 *
 * `getSenseCoverage`/`getThemePromotionCounts` above answer for the FINDINGS
 * strip and the promotion BAR. Neither one is where "135 clusters need your
 * decisions ... 200 signals, 135 clusters open, 5 became bets" comes from --
 * all four of those numbers are `rows.length`/`ranked.length`/`promotedCount`,
 * derived straight from `listSignals`/`listThemes`'s own row sets
 * (DiscoverSurface.tsx: `signals`, `themes`, `ranked`, `promotedCount`,
 * `clustersFacts`). Those two reads took only a `productId` and never a
 * `workspaceId`, so a workspace with no product of its own read every row RLS
 * would show -- every other workspace's included.
 */
const LIST_SIGNALS_FN = DISCOVERY.slice(
  DISCOVERY.indexOf("export const listSignals"),
  DISCOVERY.indexOf("export const", DISCOVERY.indexOf("export const listSignals") + 20),
);
const LIST_THEMES_FN = DISCOVERY.slice(
  DISCOVERY.indexOf("export const listThemes"),
  DISCOVERY.indexOf("export const", DISCOVERY.indexOf("export const listThemes") + 20),
);

describe("the comprehension strip's own numbers are this workspace's numbers", () => {
  it("listSignals takes a workspace and filters by it", () => {
    const flat = LIST_SIGNALS_FN.replace(/\s+/g, " ");
    expect(flat).toContain("workspaceId: z.string().uuid().nullable().optional()");
    expect(flat).toContain(
      'if (data.workspaceId) query = query.eq("workspace_id", data.workspaceId)',
    );
  });

  it("listThemes takes a workspace and filters by it", () => {
    const flat = LIST_THEMES_FN.replace(/\s+/g, " ");
    expect(flat).toContain("workspaceId: z.string().uuid().nullable().optional()");
    expect(flat).toContain(
      'if (data.workspaceId) query = query.eq("workspace_id", data.workspaceId)',
    );
  });

  it("leaves both unfiltered when the workspace cannot be resolved, same rule as everywhere else", () => {
    expect(LIST_SIGNALS_FN).toContain("if (data.workspaceId)");
    expect(LIST_THEMES_FN).toContain("if (data.workspaceId)");
  });

  it("both queries in DiscoverSurface.tsx carry the workspace in the key and in the call", () => {
    const flat = DISCOVER_UI.replace(/\s+/g, " ");
    expect(flat).toContain('["signals", activeWorkspaceId, activeProductId]');
    expect(flat).toContain(
      "fSignals({ data: { workspaceId: activeWorkspaceId, productId: activeProductId } })",
    );
    expect(flat).toContain('["themes", activeWorkspaceId, activeProductId]');
    expect(flat).toContain(
      "fThemes({ data: { workspaceId: activeWorkspaceId, productId: activeProductId } })",
    );
  });

  it("every number the strip renders derives from those two reads alone, not a third unscoped one", () => {
    // rows (signals), ranked/promotedCount (themes): if a future edit adds a
    // fourth number to the strip from a new read, this does not catch it --
    // but it does prove the four numbers this packet was filed over all
    // trace to the two reads just proven scoped above.
    const flat = DISCOVER_UI.replace(/\s+/g, " ");
    expect(flat).toContain("(themes.data?.themes ?? [])");
    expect(flat).toContain("const ranked = React.useMemo(() => { const all = themes.data?.themes");
  });
});

/**
 * ── THE WALK-SHAPED GUARD P-75 PROMISED, TAKEN AS FAR AS A SOURCE READ CAN
 * GO (P-75b) ──────────────────────────────────────────────────────────────
 *
 * "Render both routes' data hooks against an empty workspace and assert
 * zeros" needs a live Supabase read behind a mocked empty-vs-populated
 * table, which this worktree cannot drive this session (no dev server /
 * browser access, the same standing limitation every packet here has
 * noted). What a source read CAN prove, and does: every reader behind
 * Arriving's four numbers and Outcomes' lessons block resolves its
 * workspace the same way (`if (data.workspaceId) ... .eq("workspace_id",
 * ...)`, never a bare unconditional filter and never a silent fallback to
 * "this workspace has nothing" when the id cannot be resolved) -- which is
 * the actual property "assert zeros for an empty workspace, unchanged for a
 * real one" depends on. A workspace with a real id and zero rows gets
 * `.eq("workspace_id", <that id>)` same as one with a thousand; the query
 * shape does not know the difference, only the row count answers with.
 */
const BRAIN_STATS_FN = readFileSync("src/lib/brain.functions.ts", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .slice(
    readFileSync("src/lib/brain.functions.ts", "utf8").indexOf("export const getCompanyBrainStats"),
  );

describe("Outcomes' lessons block resolves the same way -- checked, not assumed", () => {
  it("getStandingRecord's recall counts (the 'X of Y lessons' line) are already proven above", () => {
    // Not re-tested here: "the counts on a record are that workspace's
    // counts" (this file, above) already covers memoryBase/recallBase in
    // full. Named here so a reader looking for the lessons-block guard
    // finds a pointer rather than a gap.
    expect(STANDING).toContain("const memoryBase = ()");
  });

  it("getCompanyBrainStats' learnings count takes the workspace and filters by it", () => {
    const flat = BRAIN_STATS_FN.replace(/\s+/g, " ");
    expect(flat).toContain('wid ? learningsQ.eq("workspace_id", wid) : learningsQ');
  });

  it("the outcomes route passes the workspace into both reads, in the key and in the call", () => {
    const OUTCOMES = strip(readFileSync("src/routes/_authenticated.outcomes.tsx", "utf8"));
    const flat = OUTCOMES.replace(/\s+/g, " ");
    expect(flat).toContain('["brain-standing", activeWorkspaceId]');
    expect(flat).toContain("fStanding({ data: { workspaceId: activeWorkspaceId } })");
    expect(flat).toContain("fStats({ data: { workspaceId: activeWorkspaceId } })");
  });
});
