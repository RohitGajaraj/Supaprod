/**
 * What a station actually produced, so a track has members and not just a route.
 *
 * THE PROBLEM. `spine_track_members` answers "what is part of this one piece of
 * work", which lineage structurally cannot answer for a track that entered
 * mid-loop and therefore has no root to walk from (the argument is in
 * supabase/migrations/20260801130000_spine_tracks.sql). The row only exists if
 * something writes it, and until now nothing did: `attachToTrack` had no caller.
 *
 * The driver is the right place to write it, and the awkward part is that the
 * driver does no product work. It dispatches the station's lead agent through
 * `runAgentLoop`, and the agent creates rows with its own tools. So the question
 * is how the driver learns what was made without asserting something it does not
 * know.
 *
 * THE APPROACH THAT WAS REJECTED, and why, because it is the obvious one.
 * Capture a timestamp before the dispatch, then afterwards query the station's
 * artifact table for rows with this user_id and workspace_id created after it.
 * It is cheap and it usually works, and "usually works" is the problem:
 *
 *   1. Two tracks for the same user at the same station in one tick. The tick
 *      (src/routes/api/public/hooks/track-tick.ts) drives up to five tracks
 *      SEQUENTIALLY, so bounding the window at both ends would keep those two
 *      apart. That narrows the case; it does not close it.
 *   2. Nothing else in the product holds still while a tick runs. Themes are
 *      written by `clusterSignalsCore`, which is reached from the recluster loop
 *      (loops.server.ts), from a person pressing cluster on Discover, and from
 *      `cluster.trigger`. Learnings are written by a separate cron sweep
 *      (outcome-tick -> outcome-review.server.ts). A chat run under the same
 *      user can log a signal mid-tick. A time window cannot tell any of those
 *      apart from the work this station just did.
 *   3. An overlapping tick. Nothing serialises two invocations of the hook, so
 *      two windows can overlap even though each tick is internally sequential.
 *
 * A member row that names the wrong artifact is a false claim about whose work
 * something is, and the surface built on it would show a person a spec that
 * belongs to somebody else's track. That is worse than an empty track, so the
 * time window is not used anywhere in this module.
 *
 * THE CHANNEL THAT ACTUALLY EXISTS. `runAgentLoop` returns its steps, and an
 * executed `tool_call` step carries the tool's own return value. Several of the
 * tools that create an artifact return the id of the row they just wrote. That
 * is a direct causal link: this dispatch called this tool and the tool handed
 * back this id. It cannot pick up another track's work, another user's work, or
 * a concurrent cron, because it never asks the database "what appeared lately",
 * it reads what this run reported doing.
 *
 * WHAT THAT COSTS, stated plainly rather than papered over. A tool that creates
 * rows but returns only a count is invisible here, and the driver attaches
 * nothing for it. Today that is `research.synthesize` and `cluster.trigger`,
 * both of which create `themes` and both of which return
 * `{themes_created | themes, ...}` with no ids, so a Sense run that clusters
 * produces no member row. The fix is one line in each of those tools (select and
 * return the ids they already hold), in a file this change does not own. Until
 * then the honest answer is an unattached theme, not a guessed one.
 *
 * THE LARGER COST, added after adversarial review found it missing here.
 * NOTHING PRODUCED THROUGH AN APPROVED GATE IS EVER ATTACHED. When a write tool
 * is gated, the loop queues it and the tool runs later inside `executeApproval`,
 * entirely outside `runAgentLoop`. Its id-bearing return value is written to
 * `agent_approvals.result` and never enters any `LoopResult.steps`, and nothing
 * in the product reads that column back. `driveTrackOnce` sees `queued > 0`,
 * holds at `waiting-on-a-person` with nothing attached, and re-dispatches the
 * station from scratch on the next tick. So a spec drafted through the boundary
 * is attached to nothing, permanently.
 *
 * That is worth stating loudly rather than burying, because it is exactly
 * inverted from what the product claims: the artifacts that went THROUGH a
 * boundary are the ones with no record of membership, and those are the ones
 * the governance story cares most about. The data needed to close it already
 * exists in `agent_approvals.result`; reading it back is a change to the
 * approval-execution path, not to this module.
 *
 * Pure and dependency-free so every mapping and every edge case is tested
 * without a database.
 */

import type { AgentStation } from "@/lib/agent-vocabulary";

/** The id shape every artifact table in this schema uses. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A row that belongs to a track, ready to be written to `spine_track_members`. */
export type Attachment = {
  /** The lineage vocabulary's word for the kind, so members and lineage agree. */
  artifactKind: string;
  artifactId: string;
  /**
   * The station that was being driven when the tool ran.
   *
   * NOT the station the kind "belongs to". If a Build run logs a signal, the
   * true fact is that a signal came out of Build, and the record should say so
   * rather than filing it under Sense because that is where signals usually
   * come from.
   */
  station: AgentStation;
};

/** Where a tool's created row id sits in the value the tool returns. */
export type ToolProduct = {
  /** Kind word written to `spine_track_members.artifact_kind`. */
  kind: string;
  /** Table the row lives in. Verified against src/integrations/supabase/types.ts. */
  table: string;
  /** Key on the tool's return value holding the row id. */
  idField: string;
};

/**
 * The tools that create an artifact AND hand back its id.
 *
 * Every entry was read out of src/lib/ai/tools/registry.server.ts rather than
 * assumed, and every table was checked against src/integrations/supabase/types.ts,
 * because tsc does not typecheck a PostgREST `.select()` string and a wrong
 * column compiles clean and fails only at runtime.
 *
 * DELIBERATELY ABSENT, each for a reason worth keeping:
 *   - `research.synthesize` / `cluster.trigger`: create `themes`, return counts
 *     only. See the header. No id, no attachment.
 *   - `notes.create`: returns an id, but `note` is not a kind in either artifact
 *     vocabulary (@/lib/artifact-tables or lineage's KIND_TARGETS), so a member
 *     row naming it could not be resolved to a title by any existing surface.
 *   - `prd.revise`, `decision.revise`, `roadmap.move`, `backlog.prioritize`:
 *     these UPDATE an existing row. Editing something does not by itself make it
 *     part of this track, and inferring that it does would be the product
 *     deciding a relationship nobody stated.
 *   - `github.issue.create` / `github.pr.open`: the id they return belongs to
 *     GitHub, not to a row in this schema. `spine_track_members.artifact_id` is
 *     a uuid, so there is nothing honest to put in it.
 */
export const TOOL_PRODUCTS: Readonly<Record<string, ToolProduct>> = {
  // .insert into signals, .select("id").single() -> { id }
  "signals.log": { kind: "signal", table: "signals", idField: "id" },
  // .insert into prds -> { prd_id, title, status, opportunity_id }
  "prd.draft": { kind: "prd", table: "prds", idField: "prd_id" },
  // .insert into tasks, .select("id,title").single() -> { id, title }
  "tasks.create": { kind: "task", table: "tasks", idField: "id" },
  // -> { changeset_id, repo, staged, ... }. The changeset may be one this run
  // created or an existing open one it staged into; either way the run wrote
  // code changes into it, which is what makes it part of this work. Membership
  // is "part of this piece of work", not "created by this dispatch".
  "studio.stage": { kind: "changeset", table: "studio_changesets", idField: "changeset_id" },
};

/**
 * What each station is for, in artifacts, and whether the driver can currently
 * see it.
 *
 * This is the station-to-artifact map, and it is documentation with teeth (the
 * tests assert it against TOOL_PRODUCTS) rather than a filter. It must NOT be
 * used to reject an attachment whose kind does not match its station: a Define
 * run that logs a signal really did log a signal, and dropping it would lose a
 * true fact to keep a tidy one.
 *
 * The uncomfortable half of this table is the point of writing it down. FIVE of
 * the seven stations cannot produce a member row today. Four of them have no
 * registered tool that creates their artifact at all; Build has one and the
 * driver cannot reach it, which is a different fact with the same result and is
 * recorded separately rather than rounded off. No attribution scheme whatsoever
 * would produce a row for any of the five. A time-window query would have
 * "found" rows for those stations anyway, written by a cron or a person, and
 * filed them against the track as though the station had made them.
 */
export type StationArtifact = {
  /** The kind this station exists to produce. */
  kind: string;
  /** Its table. Verified against src/integrations/supabase/types.ts. */
  table: string;
  /** The registered tool that creates it, or null when none does. */
  createdBy: string | null;
  /** Why nothing is attachable, when nothing is. Null when it is. */
  gap: string | null;
};

export const STATION_ARTIFACT: Readonly<Record<AgentStation, StationArtifact>> = {
  // Sense produces both. `signals.log` reports its id; the clustering tools do
  // not, so a theme is real and simply unattached.
  sense: { kind: "signal", table: "signals", createdBy: "signals.log", gap: null },
  decide: {
    kind: "decision",
    table: "decisions",
    createdBy: null,
    gap: "No registered tool inserts a decision. decision.revise only edits one that exists.",
  },
  define: { kind: "prd", table: "prds", createdBy: "prd.draft", gap: null },
  design: {
    kind: "prototype",
    table: "prototypes",
    createdBy: null,
    gap: "No registered tool creates a prototype. Design is driven by people today.",
  },
  build: {
    kind: "changeset",
    table: "studio_changesets",
    createdBy: "studio.stage",
    // CORRECTED after adversarial review: this said `gap: null`, which claimed
    // Build was attachable. It is not, and the reason is one line of the tool.
    // `studio.stage` opens with `if (!missionId) throw` (registry.server.ts),
    // and `driveTrackOnce` dispatches with only agentSlug/goal/workspaceId, so
    // `ctx.missionId` is null on every driver-run Build step and the call always
    // lands as an error. `collectAttachments` then correctly drops it. A tool
    // existing is not the same fact as the driver being able to reach it, and
    // this table's whole job is to record the second one honestly.
    gap: "studio.stage is the only tool that writes a changeset, and it refuses without a mission. The driver dispatches without one, so a Build tick can attach nothing until the driver opens or joins a mission first.",
  },
  ship: {
    kind: "deployment",
    table: "deployments",
    createdBy: null,
    gap: "No registered tool inserts a deployment. The deploy path writes that row, not an agent.",
  },
  learn: {
    kind: "learning",
    table: "learnings",
    createdBy: null,
    gap: "Learnings are written by the outcome-review sweep (outcome-tick), not by an agent tool.",
  },
};

/**
 * The shape this module needs off a loop step.
 *
 * Structural rather than an import of `LoopStep`, so the pure module never pulls
 * in a `.server.ts`. `LoopStep` satisfies it: `status` narrows to a string, and
 * `result` widens to unknown.
 */
export type ToolStepLike = {
  kind: string;
  name?: string;
  ok?: boolean;
  status?: string;
  result?: unknown;
};

function idFrom(result: unknown, field: string): string | null {
  if (!result || typeof result !== "object") return null;
  const value = (result as Record<string, unknown>)[field];
  if (typeof value !== "string") return null;
  const id = value.trim();
  // A non-uuid would be rejected by the column anyway, and rejecting it here
  // means one bad step cannot fail the whole batch write for the good ones.
  return UUID_RE.test(id) ? id : null;
}

/**
 * Everything this run reported making, ready to be filed against the track.
 *
 * Only a step that EXECUTED counts. A queued step is a call sitting in front of
 * a person and has produced nothing; a denied or errored step produced nothing
 * by definition. Reading an id off either would file an artifact that does not
 * exist.
 *
 * Deduplicated on kind + id because the primary key is, and because a run that
 * stages twice into one changeset reports the same changeset id both times.
 */
export function collectAttachments(
  steps: readonly ToolStepLike[] | null | undefined,
  station: AgentStation,
): Attachment[] {
  if (!steps || steps.length === 0) return [];

  const out: Attachment[] = [];
  const seen = new Set<string>();

  for (const step of steps) {
    if (step.kind !== "tool_call") continue;
    if (step.status !== "executed" || step.ok !== true) continue;
    const product = step.name ? TOOL_PRODUCTS[step.name] : undefined;
    if (!product) continue;
    const id = idFrom(step.result, product.idField);
    if (!id) continue;
    const key = `${product.kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ artifactKind: product.kind, artifactId: id, station });
  }

  return out;
}

/**
 * Plain words for each kind, because the driver's line is read by a person.
 *
 * `changeset` and `prd` are mechanism words that the voice rules keep out of
 * user-facing copy, so they are said the way the rest of the product says them.
 */
const KIND_WORD: Readonly<Record<string, { one: string; many: string }>> = {
  signal: { one: "signal", many: "signals" },
  prd: { one: "spec", many: "specs" },
  task: { one: "task", many: "tasks" },
  changeset: { one: "code change", many: "code changes" },
};

function joinPlainly(parts: string[]): string {
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * One sentence naming what joined the track, or null when nothing did.
 *
 * Only ever called with attachments that were actually written, so it can never
 * claim membership the table does not hold.
 */
export function describeAttachments(attachments: readonly Attachment[]): string | null {
  if (attachments.length === 0) return null;

  const counts = new Map<string, number>();
  for (const a of attachments) counts.set(a.artifactKind, (counts.get(a.artifactKind) ?? 0) + 1);

  const parts: string[] = [];
  for (const [kind, n] of counts) {
    const word = KIND_WORD[kind] ?? { one: kind, many: `${kind}s` };
    parts.push(`${n} ${n === 1 ? word.one : word.many}`);
  }

  return `It produced ${joinPlainly(parts)}, now part of this work.`;
}
