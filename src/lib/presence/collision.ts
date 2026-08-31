/**
 * TWO TEAMMATES ABOUT TO TOUCH THE SAME THING.
 *
 * ── WHOSE PROBLEM THIS IS ──────────────────────────────────────────────────
 * `SPEC-MULTIPLAYER-PRESENCE` §4 assigns the DERIVATION to S0 and the MARK to
 * S2, and `SPEC-AGENT-COMMS` §8 adds the constraint that decides the whole
 * design: *"a row comparison, never a model call."* Nothing here reasons. It
 * compares ids.
 *
 * ── THE RULE THAT KEEPS THIS FROM CRYING WOLF ──────────────────────────────
 * **Two runs reading the same thing is not a collision.** Measured 2026-08-26,
 * the tools that actually name a target are mostly reads — `repo.read` 64 calls,
 * `github.readFile` 35, `prd.get` 25, `brain.get_decision` 6 — against a handful
 * that write: `decision.revise` 7, `design.draft` 10, `prd.revise` 4,
 * `studio.unstage` 1. Two agents reading one PRD is a healthy afternoon. Two
 * agents REVISING it is the thing worth interrupting someone about.
 *
 * So a collision needs **at least one side-effecting anchor**, decided by
 * `isSideEffectingTool`, which already carries that knowledge and is client-safe.
 * Flagging every shared read would produce a mark that is technically true and
 * always on, and a mark that is always on is furniture.
 *
 * S2's own brief names the failure this must avoid, from the other direction:
 * *"a dedupe screen that returns nothing is worse than none"* — the restatement
 * fold answered `ids: []` and produced a ~46-track graveyard. The inverse is
 * equally fatal: one that answers "everything collides" teaches the reader to
 * stop looking.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ──────────────────────────────────────────
 * No similarity, no clustering, no "these look related". A target matches or it
 * does not. Anything fuzzier would be a model call wearing a comparison's
 * clothes, and it would put a guess in front of a person as a fact.
 */
import { isSideEffectingTool } from "@/lib/tool-consequences";

/** What one active run is currently touching. One per run, its newest call. */
export interface Anchor {
  runId: string;
  agentSlug: string | null;
  missionId: string | null;
  toolName: string;
  /** `file` for a path, `row:<table>` for an id. Deterministic, never inferred. */
  targetKind: string;
  /** The path or id the call actually named. */
  targetId: string;
  createdAt: string;
}

export interface Collision {
  targetKind: string;
  targetId: string;
  /** Two or more distinct runs. A run never collides with itself. */
  runs: Array<{ runId: string; agentSlug: string | null; toolName: string }>;
  /** True when at least one of them writes. Only these are worth a mark. */
  contested: boolean;
}

/** Arg keys that name a path, in the order a tool is most likely to use them. */
const PATH_KEYS = ["path", "file_path", "file", "paths"] as const;
/** Arg keys that name a row. `id` last: a specific key is better evidence. */
const ID_KEYS = [
  "signal_id",
  "decision_id",
  "prd_id",
  "track_id",
  "mission_id",
  "changeset_id",
  "theme_id",
  "learning_id",
  "release_id",
  "id",
] as const;

/** `prd_id` -> `row:prd`. `id` alone cannot name its table, so it stays `row`. */
function kindFromIdKey(key: string): string {
  return key === "id" ? "row" : `row:${key.replace(/_id$/, "")}`;
}

/** A Postgres uuid, which is the shape of every row id in this schema. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The key two anchors must share to be on the same thing.
 *
 * ── WHY THE KIND IS NOT THE IDENTITY ───────────────────────────────────────
 * The kind does two jobs and only one of them is identity: it decides the noun
 * a person reads (`row:prd` -> "spec"), and it used to decide grouping too. So
 * one PRD named `prd_id` by one run and `id` by another landed in two buckets
 * that were never compared. Measured against live rows 2026-08-26 (S2): PRD
 * `e9e5b033` held by FOUR runs, reported as two unrelated pairs; and the
 * two-run form of the same split returns no collision at all, so the surface
 * says *"Nobody is on the same thing"* over a real overlap. **Reporting people
 * as apart when they are together is the direction this file exists not to fail
 * in** — F-76 wearing this surface's clothes.
 *
 * So identity is the id, not the key that named it. **For uuids only.** A
 * non-uuid id keeps its kind in the key, because `signal_id: "1"` and
 * `theme_id: "1"` are two different things, and a mark that fires on things
 * that are not the same is the other way this surface dies.
 */
/**
 * THE GROUPING KEY, EXPORTED (S2's ask, 2026-08-31).
 *
 * A mark on screen has to answer "is this object the one that anchor points at"
 * **exactly the way `collisionsFrom` groups**, including A-006's rule that
 * identity is the id and not the key that named it — `row:prd` and bare `row`
 * over the same uuid are one thing. Re-deriving that in a component makes a
 * second copy of a rule that has already produced one wrong all-clear, so the
 * rule is exported rather than described.
 */
export function groupKeyOf(a: Pick<Anchor, "targetKind" | "targetId">): string {
  const kind = a.targetKind.startsWith("row") && UUID.test(a.targetId) ? "row" : a.targetKind;
  return `${kind}\u0000${a.targetId}`;
}

/**
 * The kind to SHOW for a group: the most specific one anybody named.
 *
 * Grouping collapsed `row:prd` and `row` onto one bucket; display must not, or
 * the reader loses the noun and gets "item" where the product knows "spec".
 * `row:prd` beats bare `row`; a tie between two specific kinds goes to the
 * most-named and then to first seen, so the pick never depends on the order
 * rows came back in.
 */
function displayKindOf(group: readonly Anchor[]): string {
  const counts = new Map<string, number>();
  for (const a of group) counts.set(a.targetKind, (counts.get(a.targetKind) ?? 0) + 1);

  let best = group[0]!.targetKind;
  for (const a of group) {
    if (a.targetKind === best) continue;
    const specific = a.targetKind !== "row";
    const bestIsSpecific = best !== "row";
    if (specific && !bestIsSpecific) best = a.targetKind;
    else if (specific === bestIsSpecific && counts.get(a.targetKind)! > counts.get(best)!)
      best = a.targetKind;
  }
  return best;
}

/**
 * The one thing this call names, or null.
 *
 * **A call that names nothing contributes NO anchor, and that is not the same as
 * a run touching nothing.** A run with no anchor is absent from the view rather
 * than shown as safe — the distinction F-76 was built out of, and the one a
 * collision surface would be most tempted to collapse.
 */
export function targetOf(args: unknown): { targetKind: string; targetId: string } | null {
  if (!args || typeof args !== "object") return null;
  const a = args as Record<string, unknown>;

  for (const key of PATH_KEYS) {
    const v = a[key];
    if (typeof v === "string" && v.trim()) {
      return { targetKind: "file", targetId: v.trim() };
    }
    // `paths: [...]` — the first entry only. A call touching many files is real,
    // but one anchor per run is the contract, and the first is the stable pick.
    if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) {
      return { targetKind: "file", targetId: v[0].trim() };
    }
  }

  /*
   * ── `changes: [{ path }]`, AND IT IS THE MOST SIDE-EFFECTING TOOL WE HAVE ──
   *
   * Added 2026-08-31. `studio.stage` names its file ONE LEVEL DOWN, and every
   * key above reads the top level only, so the collision layer could not see a
   * single staging call. Measured before writing this: of 46 `studio.stage`
   * calls all time, **46 carry `changes[0].path` and 0 are seen by the keys
   * above.** Two agents writing the same file is the CANONICAL collision this
   * module exists to catch, and it was the one shape it was structurally blind
   * to.
   *
   * S2 raised the anchor defect and explicitly said the key list was fine and
   * not to widen it; they had checked `studio.commit`'s `files` (a count of 3,
   * correctly dismissed) rather than `studio.stage`'s `changes`. Their finding
   * stands and is fixed separately in `getWorkspaceAnchors`; this is a second,
   * bigger one underneath it.
   *
   * First entry only, on exactly the reasoning `paths` already uses: a call
   * touching many files is real, one anchor per run is the contract, and the
   * first is the stable pick.
   */
  const changes = a.changes;
  if (Array.isArray(changes) && changes.length > 0) {
    const first = changes[0];
    if (first && typeof first === "object") {
      const pathValue = (first as Record<string, unknown>).path;
      if (typeof pathValue === "string" && pathValue.trim()) {
        return { targetKind: "file", targetId: pathValue.trim() };
      }
    }
  }

  for (const key of ID_KEYS) {
    const v = a[key];
    if (typeof v === "string" && v.trim()) {
      return { targetKind: kindFromIdKey(key), targetId: v.trim() };
    }
  }

  return null;
}

/**
 * Where two or more DISTINCT runs are anchored on one target.
 *
 * Distinct by `runId`: the same run appearing twice is one teammate, not two,
 * and reporting it as a collision would make a busy agent look like a crowd.
 */
export function collisionsFrom(anchors: readonly Anchor[]): Collision[] {
  const byTarget = new Map<string, Anchor[]>();
  for (const a of anchors) {
    const key = groupKeyOf(a);
    const list = byTarget.get(key);
    if (list) list.push(a);
    else byTarget.set(key, [a]);
  }

  const out: Collision[] = [];
  for (const group of byTarget.values()) {
    const seen = new Set<string>();
    const distinct = group.filter((a) => (seen.has(a.runId) ? false : (seen.add(a.runId), true)));
    if (distinct.length < 2) continue;

    out.push({
      targetKind: displayKindOf(distinct),
      targetId: distinct[0]!.targetId,
      runs: distinct.map((a) => ({
        runId: a.runId,
        agentSlug: a.agentSlug,
        toolName: a.toolName,
      })),
      contested: distinct.some((a) => isSideEffectingTool(a.toolName)),
    });
  }

  // Contested first: if a person reads one line of this, it should be the one
  // where somebody is writing.
  return out.sort((x, y) => Number(y.contested) - Number(x.contested));
}
