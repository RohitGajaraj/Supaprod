import type { Anchor, Collision } from "@/lib/presence/collision";
import { isSideEffectingTool } from "@/lib/tool-consequences";
import { agentDisplayName } from "@/lib/agent-vocabulary";

/**
 * TWO TEAMMATES ON ONE THING, SAID ON THE ROW THAT OWNS IT.
 *
 * ── THE SPLIT, AND WHY THIS FILE EXISTS AT ALL ─────────────────────────────
 * `SPEC-MULTIPLAYER-PRESENCE` §4 gives the DERIVATION to S0 and the MARK to S2.
 * S0 built `src/lib/presence/collision.ts` and `getWorkspaceAnchors`, which
 * answer "which targets have two runs on them". That is not yet an answer to
 * the board's question, which is "does THIS ROW overlap with anyone", because
 * `Collision.runs` carries `runId` and never `missionId` — the board is a list
 * of pieces of work, not a list of runs. This file is that join, and nothing
 * else. It reasons about no data it was not handed.
 *
 * ── THE RULE S0 ADDED AND THIS FILE IS BUILT AROUND ────────────────────────
 * **Two runs READING the same thing is not worth a mark.** Measured 2026-08-26,
 * the tools that name a target are overwhelmingly reads, so a mark that fired on
 * any shared target would be on almost all the time — technically correct, and
 * the fastest way to teach a person to stop looking at it. Only `contested`
 * overlaps (at least one side writes) are drawn. The rest are counted in the
 * check line and never marked.
 *
 * The brief names the opposite failure and both are live here: *"a dedupe screen
 * that returns nothing is worse than none"* — the restatement fold answered
 * `ids: []` and produced a ~46-track graveyard. So the negative answer is not
 * silence: `checkLine` says "Nobody is on the same thing" OUT LOUD, and says in
 * the same breath what it could not check.
 *
 * ── THE THREE THINGS THAT ARE NOT THE SAME AS "SAFE" ───────────────────────
 * A collision surface fails in one direction — by reporting people as apart when
 * nobody knows. Three separate populations can produce that lie and each is kept
 * distinct here rather than folded into a zero:
 *
 *   1. **Runs that cannot be checked.** Every run started before 2026-08-26 has
 *      a NULL `trace_id` (F-93) and is unknowable forever. `unknowableRuns`
 *      carries them and `checkLine` says the number.
 *   2. **Runs whose newest call named no target.** They contribute no anchor by
 *      design — absent from the view, not clear. S0 enforces this in `targetOf`.
 *   3. **Overlaps on work that is not a mission.** A run whose `mission_id` is
 *      null has no row on this board to carry its mark. Counted as `offBoard`
 *      and said, rather than dropped into the same silence as "none found".
 *
 * ── PLAIN WORDS (operating model §12) ──────────────────────────────────────
 * Nothing here says collision, contested, anchor, target or run. A person says
 * *"Scout is changing the same file"*, so that is the sentence. The teammate is
 * named, because naming is the whole value — "1 conflict detected" is a status,
 * and a name and a file is an event someone can act on.
 */

/** The other teammates on this row's thing, and whether each one writes. */
export interface Overlap {
  targetKind: string;
  targetId: string;
  others: Array<{ runId: string; agentSlug: string | null; toolName: string; writes: boolean }>;
}

/** What `checkLine` needs to say what was and was not checked. */
export interface OverlapCheck {
  /** Contested overlaps found, whether or not a board row could carry them. */
  found: number;
  /** Of those, the ones that landed on a mission row and are drawn. */
  drawn: number;
  /** Contested overlaps whose runs carry no mission — real, and not on this board. */
  offBoard: number;
  /** Active runs with no recorded correlation. Never "touched nothing". */
  unknowable: number;
}

/**
 * Which board rows have someone else on their thing, keyed by mission id.
 *
 * ONLY CONTESTED ONES ARE RETURNED. A shared read is real and reported by S0's
 * derivation, and drawing it here would put a permanent mark on a healthy
 * afternoon. `check()` still counts them; this map is what gets painted.
 *
 * A mission appearing in two collisions keeps the FIRST, because a row carries
 * one line and S0 already sorts contested to the front. Two lines under one row
 * is a list, and a list is the thing this surface exists to avoid.
 */
export function contestedOverlapsByMission(
  anchors: readonly Anchor[] | undefined,
  collisions: readonly Collision[] | undefined,
): Map<string, Overlap> {
  const out = new Map<string, Overlap>();
  if (!anchors || !collisions) return out;

  for (const c of collisions) {
    if (!c.contested) continue;
    for (const a of anchors) {
      if (a.targetKind !== c.targetKind || a.targetId !== c.targetId) continue;
      if (!a.missionId || out.has(a.missionId)) continue;
      // Everyone on this thing except the run this row already is.
      const others = c.runs
        .filter((r) => r.runId !== a.runId)
        .map((r) => ({
          runId: r.runId,
          agentSlug: r.agentSlug,
          toolName: r.toolName,
          writes: isSideEffectingTool(r.toolName),
        }));
      if (others.length === 0) continue;
      out.set(a.missionId, { targetKind: c.targetKind, targetId: c.targetId, others });
    }
  }
  return out;
}

/** What was checked and what could not be, so a quiet answer can be trusted. */
export function check(
  anchors: readonly Anchor[] | undefined,
  collisions: readonly Collision[] | undefined,
  unknowableRuns: number | undefined,
): OverlapCheck {
  const contested = (collisions ?? []).filter((c) => c.contested);
  const drawn = contestedOverlapsByMission(anchors, collisions).size;
  return {
    found: contested.length,
    drawn,
    offBoard: Math.max(0, contested.length - drawn),
    unknowable: unknowableRuns ?? 0,
  };
}

/**
 * The plain noun for what is being shared.
 *
 * A path is worth printing — it is the thing a person recognises. A row id is
 * not: `row:prd` with a uuid tells a reader nothing they can use, so the kind
 * becomes an ordinary noun and the id stays out of the sentence.
 */
function thingFor(kind: string): { noun: string; showId: boolean } {
  if (kind === "file") return { noun: "file", showId: true };
  switch (kind) {
    case "row:prd":
      return { noun: "spec", showId: false };
    case "row:decision":
      return { noun: "decision", showId: false };
    case "row:signal":
      return { noun: "piece of evidence", showId: false };
    case "row:changeset":
      return { noun: "change", showId: false };
    case "row:track":
    case "row:mission":
      return { noun: "piece of work", showId: false };
    case "row:theme":
      return { noun: "theme", showId: false };
    case "row:learning":
      return { noun: "learning", showId: false };
    case "row:release":
      return { noun: "release", showId: false };
    default:
      return { noun: "item", showId: false };
  }
}

/** A teammate's name, never the seat slug, and never the word "Agent". */
function nameOf(slug: string | null): string {
  if (!slug || !slug.trim()) return "Another teammate";
  const name = agentDisplayName(slug);
  return name === "Agent" ? "Another teammate" : name;
}

/**
 * The line drawn under a running row, or null.
 *
 * ONE OTHER TEAMMATE GETS A VERB, because it is knowable and it is the whole
 * point: *changing* the same file is an interruption, *reading* it while you
 * change it is worth knowing and is not the same event. TWO OR MORE get "are
 * on", because per-teammate verbs would need a clause each and the row has one
 * line. Contested guarantees at least one of them writes either way.
 */
export function overlapLine(overlap: Overlap | undefined): string | null {
  if (!overlap || overlap.others.length === 0) return null;
  const { noun, showId } = thingFor(overlap.targetKind);
  const tail = showId ? `: ${overlap.targetId}` : "";

  if (overlap.others.length === 1) {
    const other = overlap.others[0]!;
    const verb = other.writes ? "is changing" : "is reading";
    return `${nameOf(other.agentSlug)} ${verb} the same ${noun}${tail}`;
  }

  const names = overlap.others.map((o) => nameOf(o.agentSlug));
  const joined = `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${joined} are on the same ${noun}${tail}`;
}

/**
 * The sentence that makes a quiet answer trustworthy, or null while unknown.
 *
 * NULL IS RETURNED ONLY WHILE THE READ IS IN FLIGHT, and the caller renders it
 * beside a sentence that always stands, so nothing here resolves a wait to
 * nothing. A FAILED read says so: "cannot check" and "nobody is on the same
 * thing" are different claims and this surface may never swap one for the other.
 */
export function checkLine(
  c: OverlapCheck | null,
  state: "pending" | "failed" | "ready",
): string | null {
  if (state === "pending") return null;
  if (state === "failed" || !c) {
    return "This could not be read, so it cannot say whether two are on the same thing.";
  }

  const caveats: string[] = [];
  if (c.unknowable > 0) {
    caveats.push(
      `${c.unknowable} started before we recorded what they touch, so ${
        c.unknowable === 1 ? "it cannot" : "they cannot"
      } be checked`,
    );
  }
  if (c.offBoard > 0) {
    caveats.push(`${c.offBoard} ${c.offBoard === 1 ? "is" : "are"} on work not listed here`);
  }
  const tail = caveats.length === 0 ? "" : ` ${sentenceOf(caveats)}.`;

  // FOUND NOTHING IS AN ANSWER, AND IT IS SAID OUT LOUD. The graveyard this
  // surface is built against was a screen that returned nothing and looked the
  // same as a screen that had not run.
  if (c.found === 0) return `Nobody is on the same thing.${tail}`;

  // FOUND SOMETHING: the marks on the rows name who and what, so repeating the
  // count here would be the surface talking about itself. Only what the marks
  // cannot carry is added.
  return caveats.length === 0 ? null : sentenceOf(caveats) + ".";
}

function sentenceOf(parts: string[]): string {
  const joined =
    parts.length === 1
      ? parts[0]!
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}`;
}
