/**
 * What every tool does by default, for everyone, without anybody being seeded.
 *
 * FOUNDER RULING 2026-08-01: "shouldn't it be building at a platform level
 * holistically? Say tomorrow a new user signs up, this fix also needs to be
 * applicable to them. What happens if a seventeenth user signs up, do we need to
 * do the migration to his account? Please fix it at a holistic level, not just
 * solve for today's problem."
 *
 * THE SHAPE THAT WAS WRONG, and it was wrong even after it was made correct.
 * `agent_tools` held one row per user per tool: capability was COPIED into every
 * account at signup. Sixteen users meant 864 rows saying the same thing, a new
 * tool meant a backfill migration against every existing account, and a new user
 * got whatever the seed trigger happened to grant on the day they arrived. That
 * last part is not a hypothetical: it is exactly how eleven of sixteen accounts
 * ended up unable to draft a spec, because seeding had accumulated as six
 * one-shot migrations and only three left a trigger behind.
 *
 * Collapsing those six into one authority fixed the DRIFT and kept the SHAPE, so
 * the seventeenth user was still one un-fired trigger away from a broken loop,
 * and tool fifty-five would still need a migration to reach anyone.
 *
 * THE SHAPE THAT IS RIGHT. The registry is the platform's list of tools, and
 * this module is the platform's policy on them. A row in `agent_tools` is an
 * OVERRIDE, not a grant: absent means "the default applies", not "you may not".
 * So a newly registered tool is live for every account the moment it ships, a new
 * account needs no seeding at all, and there is no seed left that can drift.
 *
 * WHAT A STORED ROW MEANS NOW:
 *
 *   no row           -> the default below, which is the platform's policy
 *   enabled = false  -> this account turned it off, and that is obeyed
 *   mode = '...'     -> this account chose a mode, and that is obeyed
 *
 * Existing rows keep working unchanged, because a row that agrees with the
 * default is simply an override that agrees with the default. Nothing had to be
 * deleted or rewritten to move to this model.
 *
 * THE RUNTIME FLOORS STILL COMPOSE ON TOP. A default here is a starting point,
 * never a bypass: `resolveToolMode`, `toolRisk`, `HIGH_RISK_FORCE_REVIEW` and
 * `HIGH_RISK_MIN_CONFIRM` all still run afterwards, and `capToolsByRisk` still
 * drops anything past an agent's own remit. A mode set here can be tightened by
 * those and never loosened.
 *
 * Pure and dependency-free, so `defaults.test.ts` can assert against the whole
 * registry without a database or a worker.
 */

/**
 * How a call is treated before the runtime floors compose on top.
 *
 * `off` is a stored mode, not a fourth level of oversight: the settings UI has
 * always written it to mean "this account does not want this tool at all", and
 * `resolveToolAccess` drops it exactly like `enabled = false`. It is in the
 * union because the column really holds it, and a type that pretended otherwise
 * would push the check out to every caller.
 */
export type ToolMode = "auto" | "confirm" | "review" | "off";

/**
 * The one tool policy, keyed by tool name.
 *
 * `defaults.test.ts` fails the build when a registered tool is missing from
 * here, which is the same gate the seed migration used to need, moved to the
 * layer that actually decides. The difference is that this one is enforced
 * before anything ships rather than after every account is migrated.
 */
export const TOOL_DEFAULTS: Readonly<
  Record<string, { mode: ToolMode; enabled: boolean; label: string }>
> = {
  // Read and search. Auto: they observe, they never change anything.
  "workspace.search": { mode: "auto", enabled: true, label: "Search workspace" },
  "workspace.list_tasks": { mode: "auto", enabled: true, label: "List tasks" },
  "signals.list": { mode: "auto", enabled: true, label: "List signals" },
  "sense.found_nothing": {
    mode: "auto",
    enabled: true,
    label: "Report that nothing here speaks to this",
  },
  "themes.list": { mode: "auto", enabled: true, label: "List themes" },
  "sources.status": { mode: "auto", enabled: true, label: "Source status" },
  "sources.connect": { mode: "auto", enabled: true, label: "Connect a source" },
  "repo.tree": { mode: "auto", enabled: true, label: "Repo tree" },
  "repo.read": { mode: "auto", enabled: true, label: "Read a file" },
  /*
   * R-40 (P-72). `auto`, and it must be: a seat that has found the spec targets
   * something absent from the repository has to be able to SAY so without
   * waiting for a person, or the only unblocked path left to it is the one it
   * took on the tablet track -- stage something approximate and open a pull
   * request. Gating the halt would gate the honest answer and leave the
   * dishonest one free.
   */
  "build.halt": { mode: "auto", enabled: true, label: "Stop and say why" },
  "repo.search": { mode: "auto", enabled: true, label: "Search the repo" },
  "ci.logs": { mode: "auto", enabled: true, label: "CI logs" },
  "github.ci.read": { mode: "auto", enabled: true, label: "Read GitHub CI" },
  "web.search": { mode: "auto", enabled: true, label: "Search the web" },
  "web.fetch": { mode: "auto", enabled: true, label: "Fetch a page" },
  "web.map": { mode: "auto", enabled: true, label: "Map a site" },
  // Crawling pulls a whole site and costs real money, so it asks first even
  // though it only reads.
  "web.crawl": { mode: "confirm", enabled: true, label: "Crawl a site" },

  // THE SEVEN STATIONS' OWN HANDS. Every one of these writes the artifact its
  // station hands to the next, so a tool missing here stops the loop dead.
  // 01 Discover
  // F-AUTONOMOUS: signals.log changed to AUTO 2026-08-26. Rationale: logging a
  // signal is internal record-keeping (not customer-visible), reversible (signals
  // can be deleted), requires no judgment (agent found the evidence, records it),
  // and spends no money past the model call the mission cap already bounds.
  // Blocking it with "confirm" gates the autonomous loop at the first station.
  "signals.log": { mode: "auto", enabled: true, label: "Log a signal" },
  // GRADUATED TO AUTO 2026-08-03, on evidence rather than taste. Each of these had a
  // PERFECT live record at the time (7 approvals, 0 rejections, 0 expiries) and each
  // passes all four of the governance canon's tests for whether a gate belongs:
  // nothing irreversible from inside the product, no judgement without an oracle, no
  // spend past the mission cap, and no customer-visible effect. Drafting is not
  // deciding: a spec, a task and a synthesis can all be deleted, and asking a human to
  // authorise "write me a draft" is the queue-instead-of-automation the canon rejects.
  //
  // The tools DELIBERATELY left gated are the argument that this is not a blanket
  // relaxation. studio.commit and github.issue.create leave the product and touch a
  // customer's repo. studio.pr.merge stays "review" and its own record agrees: 21
  // approvals against 7 REAL rejections, the only tool here a human genuinely overrules.
  "research.synthesize": { mode: "auto", enabled: true, label: "Synthesise research" },
  // AUTO, changed from "confirm" on 2026-08-03 after an audit of the live queue.
  //
  // 24 of the 60 pending approvals in production were this one tool, accumulating at
  // about 12 a day, and EVERY ONE OF THEM WAS FUTILE: the workspace holds 152 signals
  // with 1 unclustered, so the action returns {"themes": 0, "message": "No unclustered
  // signals."} and nothing else. A human was being asked, repeatedly, to authorise an
  // action that could not do anything.
  //
  // That is the governance canon's own words made literal ("a long approvals queue is a
  // policy failure to surface, not a workload to render"), and the canon also settles
  // what the mode should be: clustering groups existing signals into themes. It is
  // reversible, invisible outside the product, spends no money past the model call the
  // cap already bounds, and requires no judgement a human is better at. It fails all
  // four tests for a gate, so the gate was the bug.
  "cluster.trigger": { mode: "auto", enabled: true, label: "Cluster signals" },
  // 02 Decide
  // F-AUTONOMOUS (2): decision.record changed to AUTO to unblock the Decide station.
  // Rationale (matching signals.log fix 2026-08-26): recording a decision is internal
  // record-keeping (not customer-visible), reversible (decisions can be revised),
  // requires no judgment (agent weighs evidence and commits), and spends no money
  // past the model call the mission cap already bounds. Blocking it with "confirm"
  // gates the autonomous loop at the Decide station, the core blocker preventing
  // the learning loop from completing sense→discover→decide→learn. Like signals.log,
  // this is an agent hand that records its own work, not a human judgment call.
  "decision.record": { mode: "auto", enabled: true, label: "Record a decision" },
  "decision.revise": { mode: "confirm", enabled: true, label: "Revise a decision" },
  // THE CREW'S READ DOOR INTO THE RECORD. Auto like every other read: an agent
  // that must ask permission to consult past verdicts will decide from memory
  // instead, and the loop stops compounding at exactly that click.
  "brain.search_decisions": { mode: "auto", enabled: true, label: "Search past decisions" },
  "brain.outcome_history": { mode: "auto", enabled: true, label: "Graded outcomes" },
  "brain.get_decision": { mode: "auto", enabled: true, label: "Read a decision" },
  "brain.contradictions": { mode: "auto", enabled: true, label: "Open contradictions" },
  "brain.due_forecasts": { mode: "auto", enabled: true, label: "Forecasts due for grading" },
  "approvals.queue": { mode: "auto", enabled: true, label: "Gates waiting on a person" },
  // THE CREW'S READ DOOR INTO THE SPECS. Auto like the brain reads above: specs
  // were the one artifact the crew could not open structurally (only fuzzy RAG
  // snippets) while external agents got search_prds/get_prd all along, and a
  // crew that cannot look drafts duplicates instead.
  "prd.search": { mode: "auto", enabled: true, label: "Search specs" },
  "prd.get": { mode: "auto", enabled: true, label: "Read a spec" },
  // 03 Plan
  "prd.draft": { mode: "auto", enabled: true, label: "Draft a spec" },
  "prd.revise": { mode: "confirm", enabled: true, label: "Revise a spec" },
  "prd.link_issue": { mode: "confirm", enabled: true, label: "Link a spec issue" },
  "tasks.create": { mode: "auto", enabled: true, label: "Create a task" },
  "tasks.update_status": { mode: "confirm", enabled: true, label: "Update task status" },
  "backlog.prioritize": { mode: "confirm", enabled: true, label: "Prioritise backlog" },
  "roadmap.move": { mode: "confirm", enabled: true, label: "Move on the roadmap" },
  // 04 Design
  "design.draft": { mode: "confirm", enabled: true, label: "Draft a design" },
  // 05 Build
  "studio.stage": { mode: "auto", enabled: true, label: "Stage a change" },
  // F-67. `auto`, at the same level as the tool it undoes, and the symmetry is
  // the argument: if staging a file needs no permission, removing one the loop
  // is not allowed to commit cannot need more. It touches no repo and no
  // credential — one delete against `studio_changes`, the platform's own table
  // — and its whole reason for existing is that a changeset carrying a
  // forbidden path had become permanently unshippable with a human's browser
  // session the only thing that could clear it. A gate here would put the
  // approval queue back in front of the escape hatch from the approval-free
  // dead end, which is the queue-instead-of-automation the canon rejects.
  "studio.unstage": { mode: "auto", enabled: true, label: "Unstage a change" },
  // BUILD VERIFICATION. Four read-only checks on the staged diff, and all four
  // are `auto` on purpose. A gate you have to ask permission to run is not a
  // gate: put any of these behind an approval and the loop's cheapest path
  // becomes skipping the check and opening the PR, which is exactly the state
  // they were written to end. They change nothing, they leave the workspace only
  // to READ GitHub, and the governance canon's own test applies directly here:
  // the human's job is to judge the small number of things that cross a
  // boundary, not to authorise the machine to look before it crosses one.
  "studio.review": { mode: "auto", enabled: true, label: "Review the staged diff" },
  "studio.secrets.scan": { mode: "auto", enabled: true, label: "Scan for credentials" },
  "studio.tests.plan": { mode: "auto", enabled: true, label: "Plan the missing tests" },
  "studio.deps.audit": { mode: "auto", enabled: true, label: "Audit dependencies" },
  // Runs code, and still "auto". The governance canon is that a gate is the
  // exception, not the loop: this creates a throwaway sandbox, reads exit codes,
  // and destroys it, changing nothing a user can see and nothing that survives the
  // call. Asking a human to approve "may I check my own work" is the queue-instead
  // -of-automation the canon rejects. The consequences it protects against
  // (studio.commit, pr.open, pr.merge) keep their gates one line below.
  "studio.checks.run": { mode: "auto", enabled: true, label: "Run the checks in a sandbox" },
  // BUILD'S READ DOOR. Auto like every other read: the station carried eleven
  // write tools and zero reads, so an agent could commit, open PRs and merge
  // but could not ask "what did previous builds change?", "did they merge?",
  // "why did they fail?" -- and a crew that cannot look at past runs repeats
  // them.
  "build.list_sessions": { mode: "auto", enabled: true, label: "List recent build runs" },
  "build.get_run": { mode: "auto", enabled: true, label: "Read a build run" },
  "build.changeset_history": { mode: "auto", enabled: true, label: "List merged changesets" },
  /*
   * ── R-30: A COMMIT ON A BRANCH IS REVERSIBLE, SO IT RUNS (2026-09-02) ────
   *
   * This read `confirm` while `studio.fix.commit` one line below read `auto`,
   * which is the same act on the same branch gated two different ways. It is
   * R-27's inverted gate one tool earlier: the REVERSIBLE act asked, and the
   * person it asked answered it 0% of the time. Four real builder commits sat
   * `pending` on the bound repo on 2026-09-02, every one of them set to
   * auto-cancel the next day by `expiry_default='cancel'` -- so the gate's only
   * effect was to throw the work away quietly a day later.
   *
   * WHAT ACTUALLY MAKES A COMMIT SAFE IS NOT THIS FLAG. It is
   * `STUDIO_FORBIDDEN_PREFIXES`, which refuses a commit that touches a forbidden
   * path whatever the mode says, and it is the branch: nothing here reaches
   * `main`. `studio.pr.merge` still asks and earns `auto` through the arc as it
   * always has; `release.publish` is still pinned under R-27 and can never
   * graduate. The irreversible acts kept their gates; the reversible one stopped
   * pretending to have one.
   *
   * Reverse by one word.
   */
  "studio.commit": { mode: "auto", enabled: true, label: "Commit a change" },
  "studio.fix.commit": { mode: "auto", enabled: true, label: "Commit a fix" },
  "studio.sync_branch": { mode: "auto", enabled: true, label: "Sync a branch" },
  "studio.pr.open": { mode: "confirm", enabled: true, label: "Open a PR" },
  "github.issue.create": { mode: "confirm", enabled: true, label: "Open an issue" },
  "github.pr.open": { mode: "confirm", enabled: true, label: "Open a GitHub PR" },
  "github.commit.append": { mode: "confirm", enabled: true, label: "Append a commit" },
  // 06 Ship. Everything irreversible sits at review, and trust-ramp.ts floors
  // these independently so an agent cannot earn its way past them.
  /*
   * R-27, AND THE SEEDED MODE IS WHERE THE RULING ACTUALLY LIVES.
   *
   * This read `review`, and that made the whole of R-27 INERT — caught by
   * reading my own change back rather than by any test. `resolveApprovalMode`
   * opens `if (toolMode === "review") return "review"`, so a seeded `review` is
   * sticky BEFORE the force-review branch runs; `strictestOf` then correctly
   * refuses to reach past it, and the tool resolved to `review` in every
   * workspace no matter what the ruling said. `agent_tools` holds **zero rows**
   * for this tool, so the seeded value was the only value there has ever been.
   *
   * R-22 AGAIN, THIRD TIME TODAY AND SECOND TIME IN MY OWN CODE: the product's
   * shipped default and a person's explicit choice shared one representation, so
   * protecting the choice killed the default. `confirm` separates them — an
   * override row still wins, because `resolveToolAccess` reads
   * `over?.mode ?? base.mode`.
   *
   * WHAT `confirm` MEANS HERE, arc by arc: `observing` review · `proving`
   * confirm · `trusted` auto · `ambient` auto. So a workspace is gated until
   * somebody deliberately dials its autonomy up, and even then the four
   * preconditions in `promoteChangeset` and `unattendedShipIsGradable` still
   * have to be proven — merged, CI green at that head sha, a live preview at
   * that exact commit, and a recorded forecast. **The gate moved from a click
   * nobody answered to proof the loop must produce.**
   */
  "release.publish": { mode: "confirm", enabled: true, label: "Publish a release" },
  /*
   * F-75. `STUDIO_AUTO_SHIP=1` WAS SET AND DID NOTHING, AND THIS LINE IS WHY.
   *
   * The founder set the secret. The code could not act on it:
   *
   *   TOOL_DEFAULTS["studio.pr.merge"].mode = "review"   (this line, as it was)
   *   resolveApprovalMode(mode, arc)  ->  `if (toolMode === "review") return "review"`
   *                                       trust.server.ts:226, BEFORE the flag is read
   *   strictestOf("review", …)        ->  "review"
   *   mode = mergeReleased ? released : "review"  ->  "review" either way
   *
   * `agent_tools` holds **zero override rows**, so the seeded value was the only
   * value there has ever been, and every run stopped at Build and filed a merge
   * approval no matter what the secret said.
   *
   * **THIS IS THE SAME DEFECT AS R-27's, IN THE ONE TOOL I LEFT ALONE.** This
   * morning I found `release.publish` inert for exactly this reason and fixed it
   * by moving its seed to `confirm` — and wrote a test asserting `studio.pr.merge`
   * stays at `review` because "the merge keeps its own switch". **The switch was
   * already broken when I wrote that sentence.**
   *
   * WHY `confirm` IS SAFE HERE, and it is safe in both directions:
   *  - **Flag OFF** — `loop.server.ts` reads
   *    `mode = mergeReleased || shipReleased ? released : "review"`, and with
   *    `AUTO_SHIP_ENABLED` false `mergeReleased` is false, so the merge is pinned
   *    to `review` regardless of this seed. Nothing changes for anyone who has
   *    not opted in.
   *  - **Flag ON** — the arc decides, which is what the flag was always meant to
   *    mean: `observing` review · `proving` confirm · `trusted` auto. And
   *    `studio.pr.merge` still proves CI green in-tool at the head sha and
   *    refuses red, so an opted-in workspace cannot merge a broken change.
   */
  "studio.pr.merge": { mode: "confirm", enabled: true, label: "Merge a PR" },
  // R-27. Moves WITH `release.publish`, and would be wrong to leave behind:
  // `AUTO_SHIP_ENABLED` had already freed the merge and not the rollback, so the
  // product could merge to a default branch by itself and could not roll back by
  // itself. An undo gated harder than the do means that when something breaks at
  // 3am the loop must page a person — the exact failure the gate exists to
  // prevent. A rollback to a known-good commit is the definition of reversible.
  "studio.revert": { mode: "confirm", enabled: true, label: "Revert a change" },
  // SHIP'S READ DOOR. Auto like every other read: release.publish was the
  // station's only tool for months, so an agent could ship but not ask "what
  // already shipped?" -- and a crew that cannot look re-proposes shipped work.
  "ship.list_releases": { mode: "auto", enabled: true, label: "List shipped releases" },
  "ship.get_release": { mode: "auto", enabled: true, label: "Read a release" },
  "ship.in_production": { mode: "auto", enabled: true, label: "What is live in production" },
  // 07 Learn
  "learning.record": { mode: "confirm", enabled: true, label: "Record a learning" },

  // Orchestration and delegation.
  "mission.plan": { mode: "auto", enabled: true, label: "Plan a mission" },
  "mission.dispatch": { mode: "auto", enabled: true, label: "Dispatch a mission" },
  "mission.observe": { mode: "auto", enabled: true, label: "Observe a mission" },
  "mission.finalize": { mode: "auto", enabled: true, label: "Finalise a mission" },
  "agent.handoff": { mode: "auto", enabled: true, label: "Hand off to an agent" },
  "agent.spawn": { mode: "confirm", enabled: true, label: "Spawn an agent" },
  "delegate.openhands": { mode: "review", enabled: true, label: "Delegate to OpenHands" },

  // Planning aids. Advisory and side-effect-free beyond their own row.
  "critic.evaluate": { mode: "auto", enabled: true, label: "Red-team this" },
  "scheduler.propose": { mode: "auto", enabled: true, label: "Propose a schedule" },
  "calendar.create": { mode: "confirm", enabled: true, label: "Create an event" },
  "notes.create": { mode: "confirm", enabled: true, label: "Create a note" },

  // Memory.
  "memory.remember": { mode: "auto", enabled: true, label: "Learn from this" },
  "memory.reflect": { mode: "auto", enabled: true, label: "Draw a lesson from a run" },
  "memory.promote": { mode: "confirm", enabled: true, label: "Share a lesson with the crew" },
};

/**
 * A tool nobody has an opinion about yet.
 *
 * Reached only when a tool is registered and not listed above, which the build
 * gate makes impossible to ship. It exists so the runtime behaves conservatively
 * rather than throwing if one ever slips through in a hotfix: the tool works,
 * and it asks first.
 */
export const UNLISTED_TOOL_DEFAULT: { mode: ToolMode; enabled: boolean; label: string } = {
  mode: "confirm",
  enabled: true,
  label: "Unlisted tool",
};

/** A stored per-user override. Absent fields mean "no opinion, use the default". */
export type ToolOverride = { tool_name: string; mode?: string | null; enabled?: boolean | null };

/**
 * The effective tool list for an account: platform defaults, then its overrides.
 *
 * `registered` is passed in rather than imported, because `registry.server.ts` is
 * worker-only and this module has to stay testable and client-safe.
 */
export function resolveToolAccess(
  registered: string[],
  overrides: ToolOverride[],
): Array<{ tool_name: string; mode: ToolMode }> {
  const byName = new Map(overrides.map((o) => [o.tool_name, o]));

  return registered.flatMap((name) => {
    const base = TOOL_DEFAULTS[name] ?? UNLISTED_TOOL_DEFAULT;
    const over = byName.get(name);

    // Only an EXPLICIT false turns a tool off. A null or missing `enabled` is an
    // override row with no opinion on availability, which must not read as a
    // denial: that reading is what made an absent row mean "you may not" and
    // cost eleven accounts their Plan station.
    if (over?.enabled === false) return [];

    const mode = (over?.mode as ToolMode | null | undefined) ?? base.mode;
    // `off` is the settings UI's word for "not at all", so it leaves the list
    // the same way `enabled = false` does. Handled here rather than at each
    // caller, because the one caller that forgot would hand an agent a tool its
    // owner had switched off.
    if (mode === "off") return [];
    return [{ tool_name: name, mode }];
  });
}
