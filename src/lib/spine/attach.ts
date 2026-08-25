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
 * WHAT THAT COSTS. A tool that creates rows but returns only a count is
 * invisible here, and the driver attaches nothing for it rather than guessing.
 * That was true of `research.synthesize` and `cluster.trigger`, which create
 * `themes` and returned a bare count, so a Sense run that clustered produced no
 * member row at all. Both now return `theme_ids` as well, which is why
 * `ToolProduct` reads a list as readily as a single id: one call does not always
 * make one row, and forcing the many case through the one case would file the
 * first theme and silently drop the rest. Any tool that still returns only a
 * count stays invisible, on purpose. An unattached artifact is honest; a guessed
 * one is not.
 *
 * WORK MADE THROUGH A GATE, which was the largest hole here and is now closed.
 * Adversarial review found that nothing produced through an approved gate was
 * ever attached: a gated tool runs later inside `executeApproval`, entirely
 * outside `runAgentLoop`, so its id-bearing return value lands in
 * `agent_approvals.result` and never appears in any `LoopResult.steps`. The
 * driver saw `queued > 0`, held, and the spec drafted through the boundary was
 * attached to nothing, permanently. That was exactly inverted from what this
 * product claims, because the artifacts that went THROUGH a boundary are the
 * ones the governance story cares most about.
 *
 * `harvestGates` and `gatesOpenedBy` below close it, using the same causal
 * channel and never a query for what appeared lately: a queued step carries its
 * own `approval_id`, the driver remembers it on the track, and once the person
 * answers, the approval row's own recorded result is read back. The station that
 * ASKED is stored with the gate, because a person may move the track by hand
 * before answering and the artifact belongs to whichever station produced it.
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
  /**
   * Key on the tool's return value holding the row id, or a LIST of ids.
   *
   * Both shapes are read, because one call does not always make one row. A
   * clustering pass creates several themes at once and hands back all of their
   * ids; a draft creates exactly one. Forcing the many case through the one
   * case would mean filing the first theme and silently dropping the rest.
   */
  idField: string;
  /** True when idField holds an array of ids rather than a single one. */
  many?: boolean;
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
  // Goes through `writeSignals` (the sink) since 2026-08-15 and returns
  // { inserted, skipped, id }, where `id` is the row the sink actually wrote.
  // It used to insert by hand and return `{id}` from its own `.select("id")`.
  //
  // THE MIGRATION WAS ONLY SAFE BECAUSE OF THIS LINE. Routing the tool through the
  // sink gained it the `stage_events` trail row, `source_kind`, dedup and an inline
  // embedding, but the sink reports a BATCH and originally handed back only counts.
  // A result with no `id` would have made the agent's own evidence unattachable, so
  // Discover would file a signal and still be recorded as producing nothing, which
  // is the freeze this file exists to prevent. `SinkResult.ids` was added for it,
  // and `every-station-can-finish.test.ts` pins the field name against this entry.
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
  /*
   * THE OTHER TWO STEPS OF THE BUILD CHAIN, added 2026-08-25 with F-36.
   *
   * `studio.stage` was the only changeset sink, which was right when Build was
   * briefed to call only `studio.stage`. F-36 corrected that brief — Build now
   * stages, commits, and opens a pull request, because founder ruling
   * 2026-07-08 made all three autonomous and no station had ever been told —
   * and a station that commits or opens a PR was filing NOTHING to the track.
   *
   * MEASURED 2026-08-25: `spine_track_members` holds 1104 signals, 177 themes,
   * 110 tasks, 27 decisions, 21 prds, 13 prototypes, 5 missions, 2 learnings
   * and **not one changeset**, while `studio_changesets` holds 45 rows — one of
   * which (`f847d98a`, status `staged`) belongs to a mission that IS a member
   * of track `c4b12e7c` at `build`. The work reached the record and the record
   * never reached the track.
   *
   * Both return `changeset_id`, and membership is "part of this piece of work"
   * rather than "created by this dispatch" — the same rule already written
   * above for `studio.stage`, so re-attaching the same changeset across the
   * three steps is expected and idempotent.
   */
  "studio.commit": { kind: "changeset", table: "studio_changesets", idField: "changeset_id" },
  "studio.pr.open": { kind: "changeset", table: "studio_changesets", idField: "changeset_id" },
  // Both create SEVERAL themes in one call and now hand back every id. They
  // used to return a bare count, which made a clustering pass invisible here
  // and left a Sense run with no member row at all; the ids were always in hand
  // and only the return shape was withholding them.
  "research.synthesize": { kind: "theme", table: "themes", idField: "theme_ids", many: true },
  "cluster.trigger": { kind: "theme", table: "themes", idField: "theme_ids", many: true },
  // The four stations that used to have no hands (founder ruling 2026-08-01).
  // Each returns the id of the row it created, so the station it ran at finally
  // produces a member instead of walking through and leaving nothing.
  "decision.record": { kind: "decision", table: "decisions", idField: "decision_id" },
  "design.draft": { kind: "prototype", table: "prototypes", idField: "prototype_id" },
  "learning.record": { kind: "learning", table: "learnings", idField: "learning_id" },
  // Runs through a review gate, so its id arrives via `agent_approvals.result`
  // and is picked up by the gate harvest rather than off a loop step. That path
  // already exists and needs nothing special here.
  "release.publish": { kind: "deployment", table: "deployments", idField: "deployment_id" },
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
 * The uncomfortable half of this table WAS the point of writing it down: four of
 * the seven stations could not produce a member row at all, having no registered
 * tool that created their artifact. **That is no longer true and the table below
 * is the proof** -- every station now carries a `createdBy` and every `gap` is
 * null, closed one at a time by the founder ruling of 2026-08-01 and the Build
 * mission fix after it.
 *
 * The warning the paragraph carried is still worth keeping, because it is about
 * method rather than about the gaps: a time-window query would have "found" rows
 * for a station with no tool anyway, written by a cron or a person, and filed
 * them against the track as though the station had made them. **Attribution is
 * by the tool that returned the id, never by what happened to be created while a
 * station was running.**
 *
 * MEASURED 2026-08-20, because a closed gap is not the same as a used tool.
 * `spine_track_members` on production holds rows for six of the seven stations;
 * **ship has none, of any kind, ever**, and `release.publish` -- pinned to
 * review, so a call always leaves an approval row -- has never raised one.
 * Meanwhile `deployments` holds 42 rows, all successful. **Shipping happens, and
 * it happens outside the spine.**
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
    // WAS a gap. `decision.revise` could only edit a decision that already
    // existed, so the one station whose entire job is deciding could not record
    // a decision. `decision.record` closes it, and refuses a call with no
    // rejected alternative, because the alternatives are what the brain
    // compounds on later.
    createdBy: "decision.record",
    gap: null,
  },
  define: { kind: "prd", table: "prds", createdBy: "prd.draft", gap: null },
  design: {
    kind: "prototype",
    table: "prototypes",
    // WAS a gap, and the excuse for it had reached the UI: the chain panel told
    // people "design is done with people today", which is the wrapper story
    // told in our own product. Deleted, and the tool built instead.
    createdBy: "design.draft",
    gap: null,
  },
  build: {
    kind: "changeset",
    table: "studio_changesets",
    createdBy: "studio.stage",
    // WAS a gap, and the history is worth keeping. Adversarial review found this
    // table claiming Build was attachable when it was not: `studio.stage` opens
    // with `if (!missionId) throw`, and the driver dispatched with no mission,
    // so every Build step errored and nothing was ever filed. The honest fix was
    // not to reword the entry, it was to give the driver a mission
    // (`missionForTrack` in driver.server.ts, created once per track and stored
    // as a member so Build ticks reuse it). The gap is closed rather than
    // documented, so this is null again, this time truthfully.
    gap: null,
  },
  ship: {
    kind: "deployment",
    table: "deployments",
    // WAS a gap. `release.publish` calls the SAME promote path a person does,
    // rather than adding a second way to ship that could disagree with the
    // first. It is pinned to review and is the only gate in the loop: a
    // production deploy is irreversible and customers see it, which is the one
    // place a person genuinely belongs.
    createdBy: "release.publish",
    gap: null,
  },
  learn: {
    kind: "learning",
    table: "learnings",
    // WAS a gap. The nightly outcome sweep still writes its own learnings; this
    // gives the station's agent the same ability during a run, so a track that
    // reaches Learn produces the verdict instead of waiting on a cron that
    // knows nothing about it.
    createdBy: "learning.record",
    gap: null,
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
  /** Present only on a QUEUED step: the gate the loop opened for this call. */
  approval_id?: string;
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

/** Every valid id in a list-shaped result. Junk entries are dropped, not fatal. */
function idsFrom(result: unknown, field: string): string[] {
  if (!result || typeof result !== "object") return [];
  const value = (result as Record<string, unknown>)[field];
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const id = raw.trim();
    if (UUID_RE.test(id)) out.push(id);
  }
  return out;
}

/** The ids a product yields from one result, whichever shape it uses. */
function productIds(result: unknown, product: ToolProduct): string[] {
  if (product.many) return idsFrom(result, product.idField);
  const one = idFrom(result, product.idField);
  return one ? [one] : [];
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
    for (const id of productIds(step.result, product)) {
      const key = `${product.kind}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ artifactKind: product.kind, artifactId: id, station });
    }
  }

  return out;
}

/**
 * A gate this track is waiting on: the approval id, and the station that asked.
 *
 * The station is carried rather than re-derived, because by the time the call is
 * answered the track may not be standing where it was when it asked. Filing the
 * artifact against the station that actually produced it is the whole point of
 * recording a member row at all.
 */
export type PendingGate = { id: string; station: AgentStation };

/** The shape of an `agent_approvals` row this module needs. */
export type ApprovalRowLike = {
  id: string;
  tool_name: string | null;
  status: string | null;
  result: unknown;
};

/** What harvesting a batch of gates concluded. */
export type GateHarvest = {
  /** Artifacts that were made once the person said yes. */
  attachments: Attachment[];
  /** Gates still worth checking on a later tick. */
  stillPending: PendingGate[];
};

/**
 * Read back what a track's ANSWERED gates produced.
 *
 * WHY THIS EXISTS, and it is the hole the first version of this module left
 * open and said so. When a write tool is gated, `runAgentLoop` queues it and
 * returns; the tool actually runs later inside `executeApproval`, entirely
 * outside the loop. Its id-bearing return value is written to
 * `agent_approvals.result` and, until now, nothing in the product ever read that
 * column back. So a spec drafted through the boundary was attached to nothing,
 * permanently.
 *
 * That is exactly inverted from what the product claims. The artifacts that went
 * THROUGH a boundary are the ones the governance story cares most about, and
 * they were the only ones with no record of membership. This closes it using the
 * same causal channel as the unqueued path: the tool's own reported return
 * value, never a query for what appeared lately.
 *
 * WHAT COUNTS, and nothing else does:
 *   executed  the person said yes AND the tool ran. Its result is real.
 *   approved  said yes, has not run yet. No result to read. Check again later.
 *   pending   still in front of the person. Check again later.
 *   rejected  said no. Nothing was made and nothing ever will be, so the gate is
 *   expired   dropped rather than carried forever.
 *   failed    the tool ran and threw. There is no artifact to attach.
 *
 * A gate whose row cannot be found at all is dropped rather than retried
 * forever: the approval table is the authority on its own rows, and a missing
 * one is not going to reappear.
 */
export function harvestGates(
  pending: readonly PendingGate[] | null | undefined,
  rows: readonly ApprovalRowLike[] | null | undefined,
): GateHarvest {
  const gates = Array.isArray(pending) ? pending : [];
  if (gates.length === 0) return { attachments: [], stillPending: [] };

  const byId = new Map<string, ApprovalRowLike>();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (r?.id) byId.set(r.id, r);
  }

  const attachments: Attachment[] = [];
  const stillPending: PendingGate[] = [];
  const seen = new Set<string>();

  for (const gate of gates) {
    if (!gate?.id) continue;
    const row = byId.get(gate.id);
    // Unknown row: not ours to chase.
    if (!row) continue;

    const status = (row.status ?? "").trim().toLowerCase();
    if (status === "pending" || status === "approved") {
      stillPending.push(gate);
      continue;
    }
    if (status !== "executed") continue; // rejected, expired, failed: nothing made.

    const product = row.tool_name ? TOOL_PRODUCTS[row.tool_name] : undefined;
    if (!product) continue;
    for (const id of productIds(row.result, product)) {
      const key = `${product.kind}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      attachments.push({ artifactKind: product.kind, artifactId: id, station: gate.station });
    }
  }

  return { attachments, stillPending };
}

/**
 * The gates a run just opened, from its own queued steps.
 *
 * A queued step carries the `approval_id` the loop wrote for it, so this is the
 * same direct channel the executed path uses, one step earlier.
 *
 * EVERY QUEUED CALL IS RECORDED, not only the ones that will yield an artifact
 * (widened 2026-08-01). This list started life as "gates worth harvesting" and
 * filtered to tools in TOOL_PRODUCTS, on the reasoning that carrying a gate for
 * a tool with no known product means re-reading a row forever to learn nothing.
 * That reasoning was right about harvesting and wrong about the list, because
 * the list became the answer to a second and more important question: IS THIS
 * TRACK WAITING ON A PERSON?
 *
 * The driver used to answer that by counting every pending approval belonging
 * to the user, which meant one unanswered call anywhere froze every track that
 * person owned. With the count now scoped to this track's own gates, a queued
 * call that went unrecorded would read as "not waiting", and the next tick would
 * redispatch the station and queue the same call again, every ten minutes,
 * forever.
 *
 * Nothing is re-read forever as a result: `harvestGates` drops an executed gate
 * with no product, and drops rejected, expired, failed and vanished rows too, so
 * a product-less gate holds the track exactly as long as the call is genuinely
 * open and not one tick longer.
 */
export function gatesOpenedBy(
  steps: readonly ToolStepLike[] | null | undefined,
  station: AgentStation,
): PendingGate[] {
  if (!steps || steps.length === 0) return [];
  const out: PendingGate[] = [];
  const seen = new Set<string>();
  for (const step of steps) {
    if (step.kind !== "tool_call" || step.status !== "queued") continue;
    const id = typeof step.approval_id === "string" ? step.approval_id : null;
    if (!id || !UUID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, station });
  }
  return out;
}

/**
 * Plain words for each kind, because the driver's line is read by a person.
 *
 * `changeset` and `prd` are mechanism words that the voice rules keep out of
 * user-facing copy, so they are said the way the rest of the product says them.
 */
export const KIND_WORD: Readonly<Record<string, { one: string; many: string }>> = {
  signal: { one: "signal", many: "signals" },
  theme: { one: "cluster", many: "clusters" },
  prd: { one: "spec", many: "specs" },
  task: { one: "task", many: "tasks" },
  changeset: { one: "code change", many: "code changes" },
  // Opened by the driver so Build's own tool will run at all. It is real
  // membership, so it is said rather than hidden.
  mission: { one: "run", many: "runs" },
  decision: { one: "decision", many: "decisions" },
  prototype: { one: "prototype", many: "prototypes" },
  learning: { one: "learning", many: "learnings" },
  // `deployment` is the table's word; a person says release.
  deployment: { one: "release", many: "releases" },
};

export function joinPlainly(parts: string[]): string {
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
