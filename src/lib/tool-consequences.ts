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
};

const DEFAULT: ToolConsequence = {
  effect: "Runs the tool with the agent's arguments.",
  reversible: "partial",
  undo: "Effect not catalogued. Review the arguments before approving.",
};

export function toolConsequence(toolName: string | null | undefined): ToolConsequence {
  if (!toolName) return DEFAULT;
  return CONSEQUENCES[toolName] ?? DEFAULT;
}

/**
 * True for tools that change the world (have a catalogued blast radius). Used to
 * flag a `tool_calls` row as an UNATTENDED write: every tool_calls row is an
 * inline (auto-mode) execution — gated tools queue an approval instead — so a
 * side-effecting one means the agent's trust arc executed it without a human
 * gate. Read tools also execute inline but aren't delegation, so they're
 * excluded. Keep CONSEQUENCES in sync when a side-effecting tool is added.
 */
export function isSideEffectingTool(toolName: string | null | undefined): boolean {
  return !!toolName && toolName in CONSEQUENCES;
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
