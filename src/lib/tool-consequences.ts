// v6 Phase 0 / W3 — the honest blast-radius + reversibility of each agent tool.
//
// The decision-first card shows "what happens if you approve" and whether the
// action can be undone. These are STATIC properties of each tool (not model
// output), so they are safe to state plainly — the claim never outruns the
// wiring. Unknown tools get a conservative, non-overclaiming default.
//
// Tool names match TOOL_REGISTRY (src/lib/ai/tools/registry.server.ts); keep
// this map in sync when a side-effecting tool is added. Client-safe.

export type Reversibility = "reversible" | "irreversible" | "partial";

export interface ToolConsequence {
  /** Plain-language "what happens if you approve" (one sentence). */
  effect: string;
  reversible: Reversibility;
  /** How to undo it — or why you can't. */
  undo: string;
}

const CONSEQUENCES: Record<string, ToolConsequence> = {
  "github.pr.open": {
    effect: "Opens a draft pull request on the repo.",
    reversible: "reversible",
    undo: "Close the PR. Nothing merges.",
  },
  "studio.pr.open": {
    effect: "Opens a draft pull request on the repo.",
    reversible: "reversible",
    undo: "Close the PR. Nothing merges.",
  },
  "studio.pr.merge": {
    effect: "Merges the pull request into the branch.",
    reversible: "irreversible",
    undo: "Already merged. Undoing means a revert PR.",
  },
  "delegate.openhands": {
    effect:
      "Hands a build task to an external coding agent (OpenHands), which works against the repo on its own.",
    reversible: "irreversible",
    undo: "The external agent has started; you cannot recall it. Review its result before merging anything.",
  },
  "github.issue.create": {
    effect: "Creates an issue in the repo.",
    reversible: "reversible",
    undo: "Close or delete the issue.",
  },
  "github.commit.append": {
    effect: "Appends a commit to the branch.",
    reversible: "partial",
    undo: "Stays in history. Revert with a follow-up commit.",
  },
  "studio.commit": {
    effect: "Writes a commit to the working branch.",
    reversible: "partial",
    undo: "Stays in history. Revert with a follow-up commit.",
  },
  "studio.sync_branch": {
    effect: "Merges the default branch into the working branch to re-trigger a stale CI check.",
    reversible: "partial",
    undo: "Stays in history. Revert with a follow-up commit.",
  },
  "studio.fix.commit": {
    effect: "Appends a CI-fix commit to the changeset's existing, human-opened PR branch.",
    reversible: "partial",
    undo: "Stays in branch history. The merge gate still holds; close the PR to discard the branch.",
  },
  "ci.logs": {
    effect: "Reads the failing check runs and log tails on a PR. Changes nothing.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  // Build's pre-pull-request verification checks. Catalogued for the reason the
  // comment further down states: toolRisk returns "high" for anything it has
  // never heard of, so an uncatalogued check would be demoted to confirm on
  // every call and dropped entirely from any agent carrying a max_tool_risk cap.
  // A verification gate that has to ask permission to run does not get run. All
  // four read only, and none of them writes anything anywhere, so they follow
  // ci.logs exactly: reversible, and not in EXTERNAL_TOOLS.
  "studio.review": {
    effect: "Reads the staged diff and reports findings. Writes no code and opens nothing.",
    reversible: "reversible",
    undo: "Nothing to undo; the verdict is advisory.",
  },
  "studio.secrets.scan": {
    effect: "Scans the staged changes for credentials. Changes nothing.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "studio.tests.plan": {
    effect: "Lists the test files this changeset still owes. Writes none of them.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "studio.deps.audit": {
    effect: "Reads GitHub's open dependency advisories for the repo. Changes nothing.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "studio.stage": {
    effect: "Stages file changes on the working branch.",
    reversible: "reversible",
    undo: "Unstage before the commit lands.",
  },
  "calendar.create": {
    effect: "Creates a calendar event.",
    reversible: "reversible",
    undo: "Delete the event.",
  },
  "scheduler.propose": {
    effect: "Proposes a schedule slot. Nothing books yet.",
    reversible: "reversible",
    undo: "Dismiss the proposal.",
  },
  "prd.draft": {
    effect: "Drafts a spec document.",
    reversible: "reversible",
    undo: "Delete the draft.",
  },
  // The four stations that had no hands. Three are reversible internal writes
  // and classify low, so they run autonomously by default rather than queueing
  // a person behind every step. An entry is REQUIRED, not optional: toolRisk
  // returns "high" for any tool it has never heard of, so a tool registered
  // without one would be gated on every call and the loop would stop at four
  // stations for a different reason than before.
  "decision.record": {
    effect: "Records a decision, with the alternatives that were rejected.",
    reversible: "reversible",
    undo: "Delete the decision, or supersede it with a newer one.",
  },
  "design.draft": {
    effect: "Registers a prototype against the spec.",
    reversible: "reversible",
    undo: "Delete the prototype.",
  },
  "learning.record": {
    effect: "Records what a shipped piece of work taught us.",
    reversible: "reversible",
    undo: "Delete the learning.",
  },
  // The exception, and the reason the other three can be autonomous. A
  // production deploy is irreversible from inside the product and customers see
  // it, which is two of the four floors at once.
  "release.publish": {
    effect: "Ships a merged changeset to production, where customers see it.",
    reversible: "irreversible",
    undo: "It is live. Undoing means shipping a revert.",
  },
  "prd.link_issue": {
    effect: "Links the spec to a tracker issue.",
    reversible: "reversible",
    undo: "Unlink it.",
  },
  "tasks.create": {
    effect: "Adds a task to the workspace.",
    reversible: "reversible",
    undo: "Delete the task.",
  },
  "notes.create": {
    effect: "Adds a note to Knowledge.",
    reversible: "reversible",
    undo: "Delete the note.",
  },
  "signals.log": {
    effect: "Adds a signal to the feed.",
    reversible: "reversible",
    undo: "Delete the signal.",
  },
  "memory.remember": {
    effect: "Every run after this one is guided by it.",
    reversible: "reversible",
    undo: "Forget it in the agent's memory.",
  },
  "memory.promote": {
    effect: "Raises a memory's importance.",
    reversible: "reversible",
    undo: "Demote or forget it.",
  },
  "memory.reflect": {
    effect: "Draws a lesson from this run.",
    reversible: "reversible",
    undo: "Forget it.",
  },
  "backlog.prioritize": {
    effect: "Re-ranks the opportunity backlog.",
    reversible: "reversible",
    undo: "Re-rank again. Scores recompute each cycle.",
  },
  // orchestration (the Chief of Staff runs the mission)
  "mission.plan": {
    effect: "Plans the mission into a small step-by-step DAG.",
    reversible: "reversible",
    undo: "Re-plan. The steps regenerate.",
  },
  "mission.dispatch": {
    effect: "Dispatches the ready mission steps to their agents.",
    reversible: "partial",
    undo: "Halt the mission before the dispatched runs finish.",
  },
  "mission.finalize": {
    effect: "Marks the mission complete.",
    reversible: "reversible",
    undo: "Reopen the mission.",
  },
  "agent.handoff": {
    effect: "Hands the task to the next agent in the loop.",
    reversible: "partial",
    undo: "Halt the mission before the receiver runs.",
  },
  "tasks.update_status": {
    effect: "Changes a task's status (todo / in progress / done).",
    reversible: "reversible",
    undo: "Set the status back.",
  },
  "research.synthesize": {
    effect: "Synthesizes signals into themes / opportunities.",
    reversible: "partial",
    undo: "Remove the generated theme/opportunity. The source signals are untouched.",
  },

  /*
   * ── THE SIX GATED TOOLS THAT HAD NO ENTRY, ADDED 2026-08-16 ──────────────
   * Found by reading the RENDERED /today, not the source: the `sp-gate-q`
   * heading -- 19px, the size this system reserves for "the biggest thing on a
   * surface", the question a person is there to answer -- was printing
   *
   *     "Runs the tool with the agent's arguments."
   *
   * `approvals-queue.functions.ts` sets a tool gate's `title` to
   * `consequence.effect`, so an uncatalogued tool put the DEFAULT in the one
   * slot on the surface that must never be generic.
   *
   * Measured against the registry: 59 tools, 36 catalogued, 23 falling through.
   * Six of those 23 are `confirm` or `review` mode, so they are exactly the ones
   * that can reach an approval gate, and they are not small: revising a
   * decision, revising a spec, reverting a release, spawning agents.
   *
   * THIS IS THE SECOND TIME THIS DEFECT HAS BEEN FOUND, in a different map.
   * `every-tool-can-be-named.test.ts` records the first: `ACTION_LABEL` held ten
   * entries against 59 tools, so six of the seven stations said "working" while
   * an agent drafted their spec. That was fixed by deriving from TOOL_DEFAULTS
   * and guarded. The guard covers naming and does not reach this map, so the
   * same shape recurred one file away. See the new guard in
   * tool-consequences.test.ts.
   *
   * Each effect below is written from the tool's own definition in
   * registry.server.ts rather than from its name, because this file's contract
   * is that the claim never outruns the wiring.
   */
  "decision.revise": {
    // registry.server.ts: overwrites the rationale, captures the prior one for
    // a one-key Rewind, and does not touch status.
    effect: "Rewrites a decision's rationale in place. Its status is not touched.",
    reversible: "reversible",
    undo: "Rewind the edit in one key. The previous rationale was captured, and the rewind lands on the audit trail.",
  },
  "prd.revise": {
    effect: "Rewrites the spec's body in place, applying only the change that was asked for.",
    reversible: "reversible",
    undo: "Rewind the edit in one key. The previous body was captured, and the rewind lands on the audit trail.",
  },
  "roadmap.move": {
    effect: "Moves an opportunity to Now, Next or Later, or back to the backlog.",
    reversible: "reversible",
    undo: "Rewind the move in one key. The previous placement was captured.",
  },
  "studio.revert": {
    // Not a delete: it synthesizes an INVERSE changeset which then goes through
    // commit, PR and the CI gate like any other.
    effect:
      "Rolls back a merged release by opening an inverse changeset, which goes through commit, the pull request and the CI gate like any other.",
    reversible: "partial",
    undo: "The revert is itself a change on the rails. Close its pull request before it merges; after that, going back means another changeset.",
  },
  "agent.spawn": {
    effect:
      "Starts several sub-agents at once, each working on its own and each spending a split of the mission's budget.",
    reversible: "irreversible",
    undo: "They have started and cannot be recalled. Halt the mission to stop the work that has not begun yet.",
  },
  "web.crawl": {
    // category: "read" -- it changes nothing. The spend is the irreversible part,
    // and saying so is the honest reading of "partial".
    effect: "Reads up to 25 pages on one domain, following its links.",
    reversible: "partial",
    undo: "Nothing was changed anywhere. The credits it spends are not refundable.",
  },

  /*
   * ── THE SEVENTEEN THAT WERE MISSING, CATALOGUED 2026-08-19 ─────────────
   *
   * WHY THIS WAS URGENT RATHER THAN TIDY. `toolRisk` FAILS CLOSED: a tool with no
   * entry here scores `high`, and `loop.server.ts:186` demotes any high-risk tool
   * from `auto` to `confirm`. So an absent row is not a neutral omission, it is
   * the strictest possible gate, applied silently.
   *
   * The live cost was measurable. `cluster.trigger` was deliberately seeded
   * `auto` on 2026-08-03 BECAUSE it was 24 of 60 pending approvals. Having no row
   * here it scored `high`, the demotion put it back to `confirm`, and it queued
   * anyway: 18 of the 53 pending approvals, 34% of the whole queue. A fix a person
   * had already made was being reversed by a missing table row.
   *
   * ── AND THE COMMENT ON `RISK_PROFILE` WAS WRONG ABOUT THIS ────────────
   * It said read-only tools are "omitted deliberately" because "anything not in it
   * is not gated by this file at all". The first half was the intent; the second
   * half is false in effect, for the reason above. That sentence is corrected
   * where it sits, because a comment telling the next reader an omission is free
   * is how seventeen of them accumulated.
   *
   * ── THE RULE THAT DECIDES `reversible` FOR A READ ──────────────────────
   * `web.crawl` set it and it generalises: a read is `reversible` when it changes
   * nothing and its cost is bounded and incidental, and `partial` when it changes
   * nothing but its SPEND is the consequence. So the `web.*` family is `partial`
   * beside `web.crawl`, and a database read, a GitHub API read and a sandbox that
   * destroys itself are `reversible`.
   */

  // --- The web family. Changes nothing, spends real money doing it. --------
  "web.search": {
    effect: "Searches the public web and returns ranked results, optionally reading each one.",
    reversible: "partial",
    undo: "Nothing was changed anywhere. The credits it spends are not refundable.",
  },
  "web.fetch": {
    effect: "Reads one URL and returns its main content.",
    reversible: "partial",
    undo: "Nothing was changed anywhere. The credits it spends are not refundable.",
  },
  "web.map": {
    effect: "Lists the URLs on one domain, without reading them.",
    reversible: "partial",
    undo: "Nothing was changed anywhere. The credits it spends are not refundable.",
  },

  // --- Reads. Nothing changes and nothing leaves. --------------------------
  "repo.read": {
    effect: "Reads up to eight files from the connected repo.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "repo.search": {
    effect: "Searches the connected repo's code and returns matching paths.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "repo.tree": {
    effect: "Lists the connected repo's file tree.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "github.ci.read": {
    effect: "Reads the status checks on a pull request.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "workspace.search": {
    effect: "Searches the workspace's own documents, specs, notes and signals.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "workspace.list_tasks": {
    effect: "Lists this workspace's tasks.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "signals.list": {
    effect: "Lists the signals already ingested into this workspace.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "themes.list": {
    effect: "Lists the workspace's grouped signal themes.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  "sources.status": {
    effect: "Reports which sources have been sending signals, and how many.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },
  /*
   * A READ, DESPITE ITS NAME, and it earns a comment because the name is actively
   * misleading: it connects nothing. It looks up the setup instructions and
   * capabilities for a named connector so an agent can talk somebody through
   * linking one. Reading it as a write is the mistake the name invites, and gating
   * it would put an approval in front of an instruction manual.
   */
  "sources.connect": {
    effect: "Looks up how a named source is connected, and what it can do.",
    reversible: "reversible",
    undo: "Nothing to undo; it reads setup instructions and connects nothing.",
  },
  "mission.observe": {
    effect: "Reads the live state of every step in this mission.",
    reversible: "reversible",
    undo: "Nothing to undo; read-only.",
  },

  // --- Writes that can be run again, which is why they are not gated. ------
  /*
   * THE ONE THIS WHOLE BLOCK EXISTS FOR. It regroups recent signals into themes,
   * claims each signal atomically, and files a stage event per signal. Every one of
   * those is re-runnable and none of them deletes a signal, so re-clustering is
   * the undo and `reversible` is the honest reading rather than the convenient one.
   */
  "cluster.trigger": {
    effect: "Regroups this workspace's recent signals into themes.",
    reversible: "reversible",
    undo: "Run it again. No signal is deleted and the grouping is replaceable.",
  },
  "critic.evaluate": {
    effect: "Red-teams a bet or a spec and files an advisory verdict on it.",
    reversible: "reversible",
    undo: "The verdict is advisory and can be replaced by running it again.",
  },
  /*
   * IT EXECUTES CODE, AND IT IS STILL NOT GATED. That looks like the wrong call
   * until you read what it does: it clones the changeset's branch into a fresh
   * sandbox, runs the checks, reports the real exit codes, and destroys the
   * sandbox. Nothing in the repo changes and nothing leaves.
   *
   * `trust-ramp.ts` already argues this out for the other four verification tools,
   * and its argument is the whole reason this one matters: "Flooring them would
   * invert their point twice over. It would put an approval in front of the check
   * that exists to shorten the approval queue, and it would make skipping the
   * check the cheapest path through the loop." This is the one of the five that
   * actually runs, so gating it is the version of that mistake that bites.
   */
  "studio.checks.run": {
    effect: "Runs this changeset's checks in a throwaway sandbox and reports the real results.",
    reversible: "reversible",
    undo: "Nothing to undo; the sandbox is destroyed and the repo is untouched.",
  },
};

const DEFAULT: ToolConsequence = {
  effect: "Runs the tool with the agent's arguments.",
  reversible: "partial",
  undo: "Effect not catalogued. Review the arguments before approving.",
};

/**
 * `DEFAULT.effect`, exported so a guard can say "not this sentence" without
 * keeping a fourth hand-typed copy of it.
 *
 * The three copies that already exist stay literals on purpose
 * (`tool-risk-six-dimensions.test.ts`, and twice in `tool-consequences.test.ts`):
 * a test that imports the string it is pinning cannot notice that string
 * changing. This export is for the opposite assertion -- "this surface must NOT
 * be showing the sentinel" -- where a literal buys nothing and only rots.
 */
export const UNCATALOGUED_EFFECT = DEFAULT.effect;

export function toolConsequence(toolName: string | null | undefined): ToolConsequence {
  if (!toolName) return DEFAULT;
  return CONSEQUENCES[toolName] ?? DEFAULT;
}

/**
 * The registry tools whose `category` is `"read"`, mirrored here because
 * `isSideEffectingTool` has to answer on the client and `registry.server.ts` —
 * which holds the categories — is worker-only and pulls in Supabase, the AI
 * runtime and every connector adapter. Mirrored the way `EXTERNAL_TOOLS` below
 * mirrors the workspace boundary: a hand-kept copy of a fact that lives
 * somewhere else.
 *
 * A HAND-KEPT COPY DRIFTS, so it is not left to discipline. The guard in
 * `tool-consequences.test.ts` reads the registry source and fails if this set and
 * the registry's `read` category disagree in either direction — a read added to
 * the registry and not to this set is a read that gets counted as an unattended
 * write; a name left here after the registry stops calling it a read is a write
 * that gets filed as harmless research.
 *
 * IT IS THE CATEGORY THAT IS MIRRORED, NOT THE CONSEQUENCE SENTENCE, and the two
 * do not always agree. `studio.review` reads a diff and its consequence says
 * "Writes no code and opens nothing" — true, and it still updates
 * `studio_changesets.code_review`, so the registry files it under `planning` and
 * it is not in this set. `studio.checks.run` is the opposite case: it executes
 * code, and the registry deliberately calls it a read because the sandbox is
 * destroyed and nothing a person can see survives the call. The question this set
 * asks is "does anything outlive the call", and `category` is the field that
 * tracks it.
 */
const READ_ONLY_TOOLS = new Set<string>([
  "workspace.search",
  "workspace.list_tasks",
  "signals.list",
  "themes.list",
  "sources.status",
  "sources.connect",
  "github.ci.read",
  "repo.tree",
  "repo.read",
  "repo.search",
  "ci.logs",
  "studio.secrets.scan",
  "studio.tests.plan",
  "studio.checks.run",
  "studio.deps.audit",
  "web.search",
  "web.fetch",
  "web.map",
  "web.crawl",
  "mission.observe",
]);

/** The mirror above as a list, exported for the drift guard only. The guard has
 *  to compare it to the registry in BOTH directions, and the direction a
 *  membership test cannot see is the orphan: a tool renamed in the registry
 *  leaves its old name here, answering for nothing. */
export const READ_ONLY_TOOL_NAMES: readonly string[] = [...READ_ONLY_TOOLS];

/**
 * Does anything survive running this tool?
 *
 * It flags a `tool_calls` row as an UNATTENDED write — every tool_calls row is an
 * inline (auto-mode) execution, since gated tools queue an approval instead, so a
 * side-effecting one is work the agent's trust arc carried without a human gate —
 * and it sorts a tool into a consent class.
 *
 * ── FIXED 2026-08-22. IT USED TO BE `name in CONSEQUENCES`. ───────────────
 * That is catalogue membership wearing this name, and it gave the right answer
 * only while the catalogue held nothing but writers. On 2026-08-19 the catalogue
 * was completed to all 59 registry tools to fix a different defect — a tool with
 * no row scored `high` in `toolRisk` and was silently demoted to `confirm` — and
 * completing it made this predicate return `true` for all 59, the 20 reads
 * included. What that cost, measured at each caller before the fix:
 *
 *   - `consent-classes.ts` returns `"read-only"` only when this is false, so that
 *     class matched NOTHING. Scored over the whole registry: 0 read-only, 47
 *     internal-write, 5 stakeholder, 7 repo-write. A bucket the consent surface
 *     renders in a fixed order stood permanently empty, and a `web.search` was
 *     filed beside a `decision.record`.
 *   - `today.functions.ts`, `missions.functions.ts` and `gauntlet.functions.ts`
 *     mark a row unattended from this, so a repo read counted as work the loop
 *     carried on its own — and in gauntlet's case it went into the numerator of
 *     the autonomy ratio the product reports.
 *   - `approval-policy.ts` was the one caller the 2026-08-19 change IMPROVED: its
 *     fail-closed always-human branch fires on the negation, so cataloguing the
 *     reads moved them off it. That improvement is kept, by giving that branch
 *     the question it was actually asking — see `isCataloguedTool` below.
 *
 * FAIL CLOSED, which is what the rest of this file does. An unrecognised name is
 * not in the read set, so it answers `true`. `toolRisk` scores an unknown tool
 * `high`, `assessTool` scores it irreversible, and `DEFAULT` tells the reader to
 * check the arguments before approving; a predicate that answered "read-only
 * research" for that same name would be the one place an unvetted tool could be
 * filed as never-gate. A null or empty name is not a tool at all — it is a
 * non-tool gate — and stays false.
 */
export function isSideEffectingTool(toolName: string | null | undefined): boolean {
  return !!toolName && !READ_ONLY_TOOLS.has(toolName);
}

/**
 * Is there a row in this file saying what the tool does?
 *
 * Split out of `isSideEffectingTool` on 2026-08-22, because one predicate was
 * answering two questions and fixing it for one would have answered the other
 * wrongly. `approval-policy.ts` asks THIS one: its fail-closed default says
 * "nothing is written down about what this changes", which is a statement about
 * the catalogue and not about the tool. Reads are catalogued, so they keep the
 * never-ask default they gained on 2026-08-19 instead of dropping back onto
 * always-human behind a reason that is no longer true of them.
 *
 * Keep CONSEQUENCES in sync when any tool is added; the guard in
 * `tool-risk-six-dimensions.test.ts` fails the build if you do not.
 */
export function isCataloguedTool(toolName: string | null | undefined): boolean {
  return !!toolName && toolName in CONSEQUENCES;
}

/**
 * The one sentence a person is shown at the TOP of a gate, for a tool that may
 * not be in this file at all.
 *
 * WHAT WAS WRONG. `toolConsequence` answers every caller with `DEFAULT` when it
 * holds no row, and `DEFAULT.effect` reads "Runs the tool with the agent's
 * arguments." That is a CLAIM, and three surfaces put it in the one slot
 * reserved for the question a person is there to answer: the 19px `sp-gate-q`
 * heading on the approval queue, the `sub` line of a run's "also waiting on you"
 * row, and the lead of the chief-of-staff brief. It tells a reader the product
 * knows what the call does, one line above the button that runs it.
 *
 * WHAT IT COSTS, MEASURED 2026-08-23. No REGISTERED tool can reach that sentence
 * any more: the registry defines 59 tools and all 59 have a row, closed on
 * 2026-08-19/20 and guarded three times over from the registry side. The door
 * still open is the SEED. Six tool names are written into `agent_approvals` by
 * five seed migrations and are defined by no tool anywhere -- `code.commit`,
 * `decisions.kill`, `changelog.publish`, `rollout.ramp`, `schema.migrate`,
 * `experiments.create`. That is 21 insert tuples on disk and 32 rows already in
 * production (none of them pending today, because 20260820013000 cancelled the
 * seven that were). EIGHT OF THE 21 ARE WRITTEN `status = 'pending'` WITH A LIVE
 * `expires_at`, so the next re-seed stands a gate up on the queue that nothing in
 * the product can describe. 20260820013000 said so at the time -- "SO THE SEED IS
 * THE REAL DEFECT AND CANCELLING IS ONLY HALF" -- and cancelled the rows without
 * closing the door. The guard that closes it is
 * `__tests__/a-seed-may-not-raise-a-gate-the-product-cannot-answer.test.ts`;
 * this function is what the surfaces say in the meantime.
 *
 * WHY A SEPARATE FUNCTION AND NOT A BETTER `DEFAULT.effect`. Rewriting the
 * default is one edit and it would DISARM TWO GUARDS. Both
 * `tool-risk-six-dimensions.test.ts` and `tool-consequences.test.ts` find
 * fall-through tools by comparing against a hand-typed copy of that exact
 * sentence; change it here and they search for a string nothing returns, and
 * pass for ever, vacuously. `DEFAULT` also remains the right answer for
 * `reversible` and `undo`, which the same three callers read off the same object.
 *
 * NO TOOL NAME IN THIS STRING, and that is a ruling, not a taste.
 * `runs.$missionId.tsx` states it where it renders the gate ("Plain words, never
 * the tool name"), and `tool-consequences.test.ts` states it as a property of the
 * default ("must degrade to a conservative sentence rather than crash or leak its
 * id"). An internal identifier is not the thing a person is being asked to judge.
 */
export function gateHeadline(toolName: string | null | undefined): string {
  if (isCataloguedTool(toolName)) return toolConsequence(toolName).effect;
  return "Nothing here says what this call changes.";
}

export const REVERSIBILITY_LABEL: Record<Reversibility, string> = {
  reversible: "Reversible",
  irreversible: "Irreversible",
  partial: "Partly reversible",
};

// ---------------------------------------------------------------------------
// FND-0.5 — agent blast-radius limits (per-agent tool allow-list).
//
// "Blast radius" = two static axes that are SAFE to state (not model output):
// reversibility (above) + whether the effect reaches OUTSIDE the workspace. An
// external write (a repo, a tracker, a calendar) has a wider blast radius than an
// internal workspace write even when reversible, so the two axes are independent
// (e.g. opening a PR is reversible but external). `toolRisk` folds them into one
// low/medium/high tier; `filterToolsByRisk` is the pure allow-list pre-filter that
// per-agent scoping (and, once wired at the loop, enforcement) consumes. Client-safe.
// ---------------------------------------------------------------------------

/**
 * Tools whose effect reaches a system OUTSIDE the Supaprod workspace (repo / tracker / calendar).
 * Excluded deliberately: `studio.stage` (stages the local git index only, nothing leaves the repo
 * until `studio.commit`) and `scheduler.propose` (a workspace-local proposal, nothing books on the
 * calendar until `calendar.create`) — both are internal until their committing companion runs.
 */
const EXTERNAL_TOOLS = new Set<string>([
  "github.pr.open",
  "studio.pr.open",
  "studio.pr.merge",
  "github.issue.create",
  "github.commit.append",
  "studio.commit",
  "studio.fix.commit",
  "studio.sync_branch",
  "calendar.create",
  "prd.link_issue",
  "delegate.openhands",
  /*
   * Added 2026-08-16 with its consequence and its risk profile, and it belongs
   * here by this set's own definition: it opens a pull request on the repo,
   * which is the same boundary `studio.pr.open` two rows up crosses.
   *
   * Left out, `assessTool` would have contradicted itself -- reporting
   * `external: false` beside a profile whose `dataExposure` is `"external"` --
   * and a surface showing all six axes would print both. The direction is safe:
   * this tool is already `review` mode, the most gated there is, so nothing
   * here can loosen what it takes to run it.
   */
  "studio.revert",
]);

export type ToolRisk = "low" | "medium" | "high";

/** Ordered so a numeric compare answers "is this within the cap?" (low < medium < high). */
export const RISK_RANK: Record<ToolRisk, number> = { low: 0, medium: 1, high: 2 };

export const RISK_LABEL: Record<ToolRisk, string> = {
  low: "Low blast radius",
  medium: "Medium blast radius",
  high: "High blast radius",
};

/** True for tools whose effect leaves the workspace. */
export function isExternalTool(toolName: string | null | undefined): boolean {
  return !!toolName && EXTERNAL_TOOLS.has(toolName);
}

/**
 * Static blast-radius tier from (reversibility x scope). Irreversible is always high;
 * an external partial write is high; an external reversible write or an internal partial
 * write is medium; an internal reversible write is low.
 *
 * Fail-closed for the unknown cases since this gates enforcement (the per-agent cap drops a
 * tool above its tier; the min-confirm floor gates high-blast tools): a REAL tool name we have
 * not catalogued is treated as `high` (unknown blast radius = maximal), so an un-vetted tool can
 * never slip past a low/medium cap and is always floored. Catalogue every TOOL_REGISTRY tool in
 * CONSEQUENCES to keep this from over-gating a genuinely low-risk new tool. A null/absent tool
 * name (a non-tool gate, not a tool) stays neutral `medium` — it just never shows the high chip.
 */
export function toolRisk(toolName: string | null | undefined): ToolRisk {
  if (!toolName) return "medium";
  const cat = CONSEQUENCES[toolName];
  if (!cat) return "high";
  if (cat.reversible === "irreversible") return "high";
  const external = EXTERNAL_TOOLS.has(toolName);
  if (external) return cat.reversible === "partial" ? "high" : "medium";
  return cat.reversible === "partial" ? "medium" : "low";
}

export function isHighRiskTool(toolName: string | null | undefined): boolean {
  return toolRisk(toolName) === "high";
}

/* ==================================================================
 * THE SIX DIMENSIONS.
 *
 * `toolRisk` above folds TWO static axes (reversibility x scope) into
 * one low/medium/high tier, and it gates enforcement today. It is left
 * exactly as it was: every existing caller keeps its current answer.
 *
 * What it cannot express is WHY a tool is risky, and a single tier
 * cannot support a decision finer than "stop everything at review".
 * Two tools both land on `high` when one merges code to a branch CI
 * has already checked and the other hands repo access to a third-party
 * agent. Those are not the same call and a human staring at one word
 * cannot tell them apart.
 *
 * So the same catalogue is scored on four further axes. The taxonomy
 * is Claire Vo's, published 2026-08-05 with a working implementation
 * that auto-approves low-risk pull requests and escalates the rest:
 * blast radius, reversibility, data security, ops impact, verification
 * gap, change surface. We already modelled the first two. These are
 * the other four, and `verification gap` in particular is the one that
 * distinguishes "irreversible but CI proved it correct first" from
 * "irreversible and nothing checked it", which is the single most
 * useful distinction on this list.
 *
 * SAME DISCIPLINE AS THE REST OF THIS FILE. Every value is a STATIC
 * property of the tool, never model output, so the claim never
 * outruns the wiring. A tool absent from the profile table scores
 * maximal on every axis, matching `toolRisk`'s existing fail-closed
 * default: an uncatalogued tool is treated as the worst case rather
 * than quietly waved through.
 * ================================================================== */

/**
 * Does the action move data across a trust boundary?
 *
 * `internal` scores ZERO, and that is the correction this axis needed. Writing
 * to the user's own workspace is the product working normally, not a risk, and
 * scoring it as one made every ordinary write non-auto-approvable and the
 * whole model decorative. The axis measures BOUNDARY CROSSING, so the levels
 * that cost anything are the ones that cross something: `sensitive` for an
 * internal read of credentials, `external` for data that leaves.
 */
export type DataExposure = "none" | "internal" | "sensitive" | "external";
/** Can it disturb something people are currently depending on? */
export type OpsImpact = "none" | "build" | "production";
/** Can the result be checked before it matters? */
export type VerificationGap = "verified" | "checkable" | "unverifiable";
/** How much does one invocation touch? */
export type ChangeSurface = "narrow" | "moderate" | "broad";

export interface ToolRiskProfile {
  dataExposure: DataExposure;
  opsImpact: OpsImpact;
  verificationGap: VerificationGap;
  changeSurface: ChangeSurface;
}

/** 0 is benign, 2 is the worst case, so the composite can take a max. */
const DATA_SCORE: Record<DataExposure, number> = {
  none: 0,
  internal: 0,
  sensitive: 1,
  external: 2,
};
const OPS_SCORE: Record<OpsImpact, number> = { none: 0, build: 1, production: 2 };
/**
 * `checkable` scores ZERO for the same reason `internal` does.
 *
 * The axis asks whether you would KNOW if this went wrong before it mattered.
 * "A check already passed" and "you can look at the result" both answer yes;
 * only "it is done and you cannot tell" answers no. Scoring `checkable` as a
 * risk would penalise every ordinary inspectable write and, combined with the
 * worst-axis fold, leave nothing auto-approvable — which is how this model
 * would have shipped looking rigorous and deciding nothing.
 */
const VERIFY_SCORE: Record<VerificationGap, number> = {
  verified: 0,
  checkable: 0,
  unverifiable: 2,
};
const SURFACE_SCORE: Record<ChangeSurface, number> = { narrow: 0, moderate: 1, broad: 2 };

/**
 * The four further axes, per tool.
 *
 * CORRECTED 2026-08-19. This used to say read-only tools were "omitted
 * deliberately" because "anything not in it is not gated by this file at all".
 * The intent was right and the second half was FALSE: `toolRisk` fails closed, so
 * a tool with no row scored `high` and `loop.server.ts` demoted it from `auto` to
 * `confirm`. An omission was the strictest gate available, applied silently, and
 * it cost 34% of the pending approval queue. Every registry tool is catalogued
 * now, read-only ones included: 59 rows against the registry's 59 tools, checked
 * both directions.
 *
 * THE GUARD IS IN `tool-risk-six-dimensions.test.ts`, under "coverage: every
 * registered tool is catalogued". This used to name `registry-is-catalogued.ts`,
 * which has never existed in this repo — a comment pointing at an imaginary test
 * is worse than no comment, because it tells the next reader the hole is already
 * covered and stops them looking. Corrected 2026-08-22, along with the count
 * below, which still said 36 (the pre-2026-08-19 total) while sitting on a table
 * of 59.
 *
 * Within it, every one of the 59 is scored explicitly rather than derived
 * from a naming pattern, because the interesting cases are exactly the ones a
 * pattern gets wrong (`studio.secrets.scan` is an internal read that touches
 * the most sensitive data in the product; `scheduler.propose` sounds external
 * and books nothing).
 */
const RISK_PROFILE: Record<string, ToolRiskProfile> = {
  // --- Repo and code, external and CI-gated -------------------------------
  "github.pr.open": {
    dataExposure: "external",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  "studio.pr.open": {
    dataExposure: "external",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  // Merging is irreversible, but CI has already run: the verification gap is
  // CLOSED, which is precisely the distinction a single tier cannot express.
  "studio.pr.merge": {
    dataExposure: "external",
    opsImpact: "production",
    verificationGap: "verified",
    changeSurface: "moderate",
  },
  // The widest-surface tool in the product: a third-party agent gets repo
  // access and works on its own, so nothing here is checked in advance.
  "delegate.openhands": {
    dataExposure: "external",
    opsImpact: "build",
    verificationGap: "unverifiable",
    changeSurface: "broad",
  },
  "github.issue.create": {
    dataExposure: "external",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "github.commit.append": {
    dataExposure: "external",
    opsImpact: "build",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  "studio.commit": {
    dataExposure: "external",
    opsImpact: "build",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  "studio.fix.commit": {
    dataExposure: "external",
    opsImpact: "build",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "studio.sync_branch": {
    dataExposure: "external",
    opsImpact: "build",
    verificationGap: "verified",
    changeSurface: "moderate",
  },
  // Stages the local index only. Nothing leaves until `studio.commit`.
  "studio.stage": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  // --- Reads that are not equally harmless --------------------------------
  "ci.logs": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "studio.review": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  // An internal read, and the most sensitive one there is. A naming pattern
  // would have scored this alongside `studio.tests.plan`.
  "studio.secrets.scan": {
    dataExposure: "sensitive",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "broad",
  },
  "studio.tests.plan": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "studio.deps.audit": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "moderate",
  },
  // --- Reaches a real person or a real calendar ---------------------------
  "calendar.create": {
    dataExposure: "external",
    opsImpact: "production",
    verificationGap: "unverifiable",
    changeSurface: "narrow",
  },
  // Sounds external and books nothing: a workspace-local proposal.
  "scheduler.propose": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "prd.link_issue": {
    dataExposure: "external",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  // Publishing a release is the one internal-looking tool that reaches users.
  "release.publish": {
    dataExposure: "external",
    opsImpact: "production",
    verificationGap: "checkable",
    changeSurface: "broad",
  },
  // --- Internal workspace writes ------------------------------------------
  "prd.draft": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "decision.record": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "design.draft": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "learning.record": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "tasks.create": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "tasks.update_status": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "notes.create": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "signals.log": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "research.synthesize": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "unverifiable",
    changeSurface: "narrow",
  },
  // --- Memory: internal, and it steers every later call -------------------
  "memory.remember": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  // Promotion changes what every future agent recalls, so the surface is wide
  // even though the write is one row.
  "memory.promote": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "broad",
  },
  "memory.reflect": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "unverifiable",
    changeSurface: "moderate",
  },
  // --- Planning and dispatch ----------------------------------------------
  "backlog.prioritize": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  "mission.plan": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  // Dispatch starts real work that spends real money on its own.
  "mission.dispatch": {
    dataExposure: "internal",
    opsImpact: "build",
    verificationGap: "unverifiable",
    changeSurface: "broad",
  },
  "mission.finalize": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  "agent.handoff": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },

  /*
   * ── PROFILES FOR THE SIX GATED TOOLS CATALOGUED 2026-08-16 ───────────────
   * Required, not optional, and the colocated guard said so within seconds of
   * the consequences landing: a tool with a consequence and no profile scores
   * worst-case on all four axes and can never be auto-approved, which "looks
   * like a policy decision and is actually a missing row".
   *
   * The three internal revisions follow `decision.record` exactly, because they
   * are the same act: a write to the user's own workspace, readable afterwards,
   * touching one object. `internal` scores zero deliberately -- the axis
   * measures BOUNDARY CROSSING, and the product working normally is not a risk.
   */
  "decision.revise": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "prd.revise": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "roadmap.move": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  // Opens a PR on the repo, so it crosses the same boundary `studio.pr.open`
  // does. `production` because its SUBJECT is a live release, and `checkable`
  // rather than `unverifiable` because the inverse changeset goes through the
  // PR and the CI gate like any other -- nothing lands unseen.
  "studio.revert": {
    dataExposure: "external",
    opsImpact: "production",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  // Reasoned against `delegate.openhands`, which is its nearest neighbour and
  // differs on exactly one axis. Both start work that runs on its own, so both
  // are `unverifiable` and `broad`. This one stays `internal`: the sub-agents
  // are Supaprod's own, under a split of the mission budget, where OpenHands is
  // a third party getting repo access.
  "agent.spawn": {
    dataExposure: "internal",
    opsImpact: "build",
    verificationGap: "unverifiable",
    changeSurface: "broad",
  },
  // `none` on both of the first two axes, and that is the honest reading rather
  // than a lenient one. The exposure axis measures what LEAVES: a crawl sends a
  // URL and brings public pages back, so nothing of the workspace crosses. It
  // changes nothing anyone depends on. It is gated for cost, not for blast
  // radius, and the risk model should not pretend otherwise.
  "web.crawl": {
    dataExposure: "none",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },

  /*
   * ── THE SAME SEVENTEEN, ON THE FOUR FURTHER AXES ───────────────────────
   *
   * `dataExposure` measures what LEAVES. A workspace or repo read is `internal`
   * because the data it touches is ours; the `web.*` family is `none`, following
   * `web.crawl`'s own reasoning, because a search sends a query and brings public
   * pages back and nothing of the workspace crosses.
   *
   * `opsImpact` is `none` for every one of these except `studio.checks.run`, which
   * is `build`: it genuinely runs the build, in a sandbox it then destroys. Calling
   * that `none` would be the flattering reading.
   *
   * `verificationGap` is `verified` for a read that hands back exactly what it
   * read, and `checkable` where there is a result to look at afterwards: the web
   * family, and the three writes.
   *
   * `changeSurface` is `narrow` everywhere except `cluster.trigger`, which is
   * `moderate` because one invocation regroups up to eighty signals at once.
   */
  "web.search": {
    dataExposure: "none",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "web.fetch": {
    dataExposure: "none",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "web.map": {
    dataExposure: "none",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "repo.read": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "repo.search": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "repo.tree": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "github.ci.read": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "workspace.search": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "workspace.list_tasks": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "signals.list": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "themes.list": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "sources.status": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "sources.connect": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "mission.observe": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "verified",
    changeSurface: "narrow",
  },
  "cluster.trigger": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "moderate",
  },
  "critic.evaluate": {
    dataExposure: "internal",
    opsImpact: "none",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
  "studio.checks.run": {
    dataExposure: "internal",
    opsImpact: "build",
    verificationGap: "checkable",
    changeSurface: "narrow",
  },
};

/** The worst case, used for any tool not catalogued above. Matches
 *  `toolRisk`'s existing fail-closed treatment of an unknown tool. */
const UNKNOWN_PROFILE: ToolRiskProfile = {
  dataExposure: "external",
  opsImpact: "production",
  verificationGap: "unverifiable",
  changeSurface: "broad",
};

export interface ToolAssessment {
  /** The two axes this file already modelled. */
  reversibility: Reversibility;
  external: boolean;
  /** The four from the published taxonomy. */
  profile: ToolRiskProfile;
  /** Folded tier, unchanged from `toolRisk` so no existing gate moves. */
  risk: ToolRisk;
  /** 0-2 per dimension, worst-case folded. */
  score: number;
  /** Which dimension set the score, so a surface can say WHY in one phrase. */
  drivenBy: string;
  /** True only when every dimension is benign AND the action is reversible. */
  autoApprovable: boolean;
}

const DIMENSION_LABEL: Record<string, string> = {
  reversibility: "it cannot be undone",
  dataExposure: "data leaves the workspace",
  opsImpact: "it touches something in use",
  verificationGap: "nothing checks it first",
  changeSurface: "it touches a lot at once",
};

/**
 * Score one tool across all six dimensions.
 *
 * The composite takes the MAXIMUM rather than an average, on purpose. A tool
 * that is irreversible and unverified is not made safe by being narrow and
 * internal, and averaging is exactly how a single disqualifying property gets
 * diluted by four benign ones. `drivenBy` reports which axis set the number so
 * the surface can explain the call in one phrase rather than showing six bars.
 *
 * `autoApprovable` is deliberately stricter than `score === 0`: it additionally
 * requires the action to be reversible. An unverified-but-benign-looking
 * irreversible action is never a candidate for auto-approval, whatever the
 * other five axes say, because the cost of being wrong is unbounded.
 */
export function assessTool(toolName: string | null | undefined): ToolAssessment {
  const cat = toolName ? CONSEQUENCES[toolName] : undefined;
  const profile = (toolName && RISK_PROFILE[toolName]) || UNKNOWN_PROFILE;
  const reversibility: Reversibility = cat?.reversible ?? "irreversible";
  const external = isExternalTool(toolName);

  const scores: Array<[string, number]> = [
    ["reversibility", reversibility === "irreversible" ? 2 : reversibility === "partial" ? 1 : 0],
    ["dataExposure", DATA_SCORE[profile.dataExposure]],
    ["opsImpact", OPS_SCORE[profile.opsImpact]],
    ["verificationGap", VERIFY_SCORE[profile.verificationGap]],
    ["changeSurface", SURFACE_SCORE[profile.changeSurface]],
  ];
  let score = 0;
  let drivenBy = "nothing of consequence";
  for (const [dim, s] of scores) {
    if (s > score) {
      score = s;
      drivenBy = DIMENSION_LABEL[dim] ?? dim;
    }
  }

  return {
    reversibility,
    external,
    profile,
    risk: toolRisk(toolName),
    score,
    drivenBy,
    autoApprovable: score === 0 && reversibility === "reversible" && !!cat,
  };
}

/** The profile as scored, for a surface that wants to show all six. */
export function toolRiskProfile(toolName: string | null | undefined): ToolRiskProfile {
  return (toolName && RISK_PROFILE[toolName]) || UNKNOWN_PROFILE;
}

/** Every side-effecting tool this file catalogues. Exported so the colocated
 *  guard can assert the two tables cover the same set: a tool with a
 *  consequence but no risk profile scores worst-case on every axis and would
 *  be silently un-approvable forever, which looks like a policy decision and
 *  is actually a missing row. */
export const CATALOGUED_TOOLS: readonly string[] = Object.keys(CONSEQUENCES);
export const PROFILED_TOOLS: readonly string[] = Object.keys(RISK_PROFILE);

export interface ToolAllowResult {
  /** Tools within the agent's permitted blast radius (risk <= cap), input order preserved. */
  allowed: string[];
  /** Tools that exceed the cap, paired with their tier so a caller can explain the block. */
  blocked: { tool: string; risk: ToolRisk }[];
}

/**
 * Allow-list pre-filter: partition a tool set by an agent's maximum permitted blast radius.
 * The pure building block for per-agent scoping (FND-0.5) — a high-blast agent keeps every
 * tool; a `maxRisk: "low"` agent is held to reversible internal writes only. De-dups while
 * preserving first-occurrence order so a caller can hand it the raw enabled-tool list.
 */
export function filterToolsByRisk(tools: string[], maxRisk: ToolRisk): ToolAllowResult {
  const cap = RISK_RANK[maxRisk];
  const allowed: string[] = [];
  const blocked: { tool: string; risk: ToolRisk }[] = [];
  const seen = new Set<string>();
  for (const tool of tools) {
    if (seen.has(tool)) continue;
    seen.add(tool);
    const risk = toolRisk(tool);
    if (RISK_RANK[risk] <= cap) allowed.push(tool);
    else blocked.push({ tool, risk });
  }
  return { allowed, blocked };
}
