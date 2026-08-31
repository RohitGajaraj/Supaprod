/**
 * IS SOMEBODY ALREADY HOLDING THIS OBJECT?
 *
 * `SPEC-AGENT-COMMS` §3 defines **claim** — *"I have this object"* — so a second
 * teammate that would have taken the same object does not. This is the read
 * half: given the claim rows and an object, say who holds it.
 *
 * ── A ROW COMPARISON, NEVER A MODEL CALL ──────────────────────────────────
 * §3: *"the moment it needs a model call it is wrong."* Nothing here reasons,
 * scores similarity or clusters. Two rows name the same object or they do not,
 * and the comparison is `groupKeyOf`'s, imported rather than restated.
 *
 * ── WHAT THIS CANNOT SHOW YET, SAID PLAINLY ───────────────────────────────
 * **`claim` has zero rows, ever.** Measured 2026-08-31, service-role:
 * `agent_messages` holds `handoff` 143, `kickoff` 14, `steer` 4. So every
 * function here returns "nobody holds it" against today's database, and it
 * will keep doing that until the writer lands — that is S0's half, filed in
 * `coordination/requests/S2/a-claim-must-name-work-and-the-object-is-not-work.md`
 * with the constraint that makes it more than a one-line insert.
 *
 * **This is written now rather than after** because the rule it encodes is not
 * about claims at all: it is the difference between *"nobody holds this"* and
 * *"we could not find out"*, and that distinction has to exist before the first
 * row does or the surface is built on the wrong default.
 */
import { groupKeyOf } from "@/lib/presence/collision";

/** One `agent_messages` row of kind `claim`, in the shape the reader needs. */
export interface ClaimRow {
  id: string;
  /** `agent_messages.from_agent_slug`. Null means we cannot name a holder. */
  fromAgentSlug: string | null;
  /** `source_run_id`. The run that took it, and the reason self-collision works. */
  runId: string | null;
  /** `payload.targetKind`, verbatim from `targetOf`. Never normalised upstream. */
  targetKind: string;
  /** `payload.targetId` — the path or id the call actually named. */
  targetId: string;
  createdAt: string;
  /**
   * `payload.expiresAt`, written by the WRITER from the row's own timestamp.
   *
   * Null means the claim does not expire, which is a real answer rather than a
   * missing one. See `stillHeld` for why this reader refuses to invent it.
   */
  expiresAt?: string | null;
}

/** Somebody currently holding an object. */
export interface Holder {
  agentSlug: string | null;
  runId: string | null;
  since: string;
}

/**
 * WHAT WE KNOW ABOUT WHO HOLDS WHAT — AND "WE DO NOT KNOW" IS ONE OF THE
 * ANSWERS, NOT THE ABSENCE OF ONE.
 *
 * This is the entire reason this module has a type instead of returning a Map.
 * A read that FAILED and a workspace where nobody has claimed anything produce
 * the same empty collection, and on screen they produce the same thing too:
 * silence, which a person reads as *"go ahead, it's free"*. One of those two is
 * safe to act on and the other is the opposite of safe.
 *
 * This lane has already shipped that bug once and had to design around it:
 * `getWorkspaceAnchors` swallows a failed `agent_runs` read and returns an
 * empty result rather than throwing, so `isError` stays false and one branch is
 * reached by both *"nobody is working"* and *"we could not find out"*. The rail
 * crew's quiet state had to become a DOOR rather than a sentence for exactly
 * that reason — a sentence there is a false all-clear on a dead feed.
 *
 * So `unknown` is a first-class value here and every consumer has to handle it.
 * That is the point: the type makes the mistake unspellable rather than
 * discouraged.
 */
export type ClaimIndex =
  { known: false; why: string } | { known: true; byObject: ReadonlyMap<string, readonly Holder[]> };

/** The index for a read that did not come back. */
export function claimsUnknown(why: string): ClaimIndex {
  return { known: false, why };
}

/**
 * Is this claim still standing at `now`?
 *
 * **The clock is the ROW'S, never ours.** A claim with no `expiresAt` is held
 * until something releases it; this reader does not invent a timeout, and the
 * reason is the ruling already made one layer down in `presence-trace.ts`: a
 * lifetime we start is a lifetime that lies when the tab was closed. If a
 * crashed run should release its object after ten minutes, the writer stamps
 * that at write time and this line reads it. Guessing here would put a
 * fabricated deadline in front of a person as a fact.
 */
function stillHeld(c: ClaimRow, now: number): boolean {
  if (!c.expiresAt) return true;
  const at = Date.parse(c.expiresAt);
  // An unreadable stamp is not an expired claim. Dropping it would quietly
  // free an object somebody is holding, which is the failure this whole module
  // exists to prevent, arriving through a typo.
  return Number.isFinite(at) ? at > now : true;
}

/**
 * Index the claim rows by the object they name.
 *
 * `groupKeyOf` is the key, imported rather than re-derived, so this agrees with
 * `collisionsFrom` and the marks already on screen about what "the same object"
 * means — including A-006's rule that identity is the id, not the key that
 * named it, so `row:prd` and bare `row` over one uuid are one thing.
 */
export function indexClaims(
  rows: readonly ClaimRow[] | undefined,
  now: number = Date.now(),
): ClaimIndex {
  // `undefined` is a read still in flight or one that failed, and this function
  // cannot tell which. It refuses to answer rather than answering "empty".
  if (!rows) return claimsUnknown("the claim read has not answered");

  const byObject = new Map<string, Holder[]>();
  for (const c of rows) {
    if (!stillHeld(c, now)) continue;
    // A claim that names no object is not a claim on nothing; it is a row we
    // cannot place. Absent from the index, never counted as "free".
    if (!c.targetKind || !c.targetId) continue;
    const key = groupKeyOf(c);
    const held = byObject.get(key);
    const holder: Holder = { agentSlug: c.fromAgentSlug, runId: c.runId, since: c.createdAt };
    if (held) held.push(holder);
    else byObject.set(key, [holder]);
  }
  return { known: true, byObject };
}

/** What `heldBy` answers when the index could not be built. */
export const UNKNOWN_HOLDER = "unknown" as const;

/**
 * Who is holding this object, other than me.
 *
 * **A run never collides with itself**, which is §3's rule and the same one
 * `collisionsFrom` applies one layer down. A run re-reading an object it
 * already claimed is not contention, and reporting it as such would make the
 * mark fire on the single most common case — a teammate looking at its own
 * work — which is how a surface like this stops being believed.
 *
 * Returns `UNKNOWN_HOLDER` rather than an empty array when we could not find
 * out. Callers must branch; that is deliberate.
 */
export function heldBy(
  index: ClaimIndex,
  target: { targetKind: string; targetId: string },
  myRunId: string | null,
): readonly Holder[] | typeof UNKNOWN_HOLDER {
  if (!index.known) return UNKNOWN_HOLDER;
  const held = index.byObject.get(groupKeyOf(target)) ?? [];
  return held.filter((h) => !(myRunId && h.runId === myRunId));
}

/**
 * One plain sentence for a person about to take this object, or null.
 *
 * **Null means "say nothing", and it is returned for exactly one reason: the
 * object is free.** The unknown case gets a SENTENCE, not silence, because
 * silence beside a control that takes something reads as permission.
 */
export function claimLine(
  held: readonly Holder[] | typeof UNKNOWN_HOLDER,
  nameOf: (slug: string | null) => string = (s) => s ?? "A teammate",
): string | null {
  if (held === UNKNOWN_HOLDER) return "We could not check whether anyone has this.";
  if (held.length === 0) return null;
  if (held.length === 1) return `${nameOf(held[0]!.agentSlug)} has this.`;
  /* Two names beats "2 teammates" — the reader's next question is WHICH, and
     at two the answer fits. Past that it does not, and a list that wraps is
     worse than a count. */
  if (held.length === 2)
    return `${nameOf(held[0]!.agentSlug)} and ${nameOf(held[1]!.agentSlug)} both have this.`;
  return `${held.length} teammates have this.`;
}
