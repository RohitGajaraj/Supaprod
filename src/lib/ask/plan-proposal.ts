import { WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";
import { asStation } from "@/lib/ask/route-intent";
import type { AgentStation } from "@/lib/agent-vocabulary";

/**
 * THE PROPOSAL A GATE IS ANSWERED ABOUT, on the wire and back off it.
 *
 * ── WHY THIS MODULE EXISTS AT ALL, AND WHY IT CARRIES NO PLAN ────────────
 *
 * `api/chat.ts` computes a route for a handover and, until this shipped, threw
 * it away behind `void routed`. The seam comment there names the consumer that
 * makes it true: a gate that shows the entry station and the crew BEFORE
 * anything runs and asks for a yes. At that point the station stops being a
 * classifier's guess about somebody else's dispatch and becomes a proposal a
 * person accepted.
 *
 * THE FRAME CARRIES THE INPUTS TO THE ROUTE, NOT THE ROUTE. That is the whole
 * design decision in this file, and it is the protocol's own rule applied one
 * level up: `ask-sse.ts` says each frame carries "the SMALLEST honest fact,
 * never a rendered sentence: an id the client already knows how to name".
 * `routeIntent` is pure — no model call, no network, no clock — so the shape,
 * the named station and the origin ARE the plan, and the client derives the
 * same path, the same waivers and the same crew the server would.
 *
 * That is not a saving of bytes. It is what makes the gate honest across two
 * requests. The confirmation route re-derives the route from these same three
 * values, so the plan a person answered about and the plan that is recorded
 * cannot be two different things — there is no second copy to drift. A frame
 * carrying a rendered step list would have had to be trusted or re-checked, and
 * a plan the server cannot recompute is a plan it cannot honestly record.
 *
 * WHAT IS ON IT THAT THE CLIENT COULD NOT DERIVE:
 *   · `title` / `goal` come from the classifier, which only ran on the server.
 *   · `spend_cap_usd` is `resolveMissionSpendCap`, a workspace read. Guessing it
 *     client-side would put a number under "Spend ceiling" that no run obeys.
 *   · `id` is the answer's idempotency key. See the confirmation route.
 *
 * ── WHAT IS NOT HERE, SAID PLAINLY ──────────────────────────────────────
 *
 * Nothing persists a proposal. There is no proposals table and this module does
 * not invent one: the frame is emitted, the gate is answered within the life of
 * the pane, and a reload loses the gate (never a run, because none started and
 * nothing was charged). The recorded belief — the answer — IS persisted, by the
 * confirmation route, into `human_gate_events`. See that file for the two
 * columns this would want and does not have.
 */

export type PlanProposal = {
  /**
   * THE ANSWER'S IDEMPOTENCY KEY, and the only field with no meaning of its own.
   *
   * The confirmation route writes it to `human_gate_events.subject_ref`, and
   * refuses a second answer that names a proposal already on the record. A gate
   * answered twice is this repo's own named defect (see the 2026-08-14
   * migration): two clicks, two runs, one of them nobody asked for.
   */
  id: string;
  /** One of the five the spine declares. Validated, never trusted. */
  shape: WorkShape;
  /**
   * The station the CLASSIFIER named, or null when it named none.
   *
   * The classifier's raw answer rather than the resolved entry station, so that
   * `routeIntent({shape, station, origin})` on the client is character-for-
   * character the call the server made. Passing the resolved station back would
   * reach the same route today and would stop doing so the moment the override
   * rule changes on one side only.
   */
  station: AgentStation | null;
  /** The person's own words, which `suggestRoute` requires for the origin rule. */
  origin: string;
  /** What the mission would be called. */
  title: string;
  /** What the mission would be for. */
  goal: string;
  /** The real ceiling the run would carry, or null for a workspace with none. */
  spendCapUsd: number | null;
};

/**
 * How much rope the work gets. The three `PlanGate` offers and no fourth.
 *
 * Declared here rather than imported from the component, because the server
 * validates an answer off the wire and must not reach into a `.tsx` file to do
 * it. `PlanGate.Autonomy` is asserted equal to this in the tests, so the two
 * cannot drift apart in silence.
 */
export const PLAN_AUTONOMY = ["run-it", "check-writes", "keep-planning"] as const;
export type PlanAutonomy = (typeof PLAN_AUTONOMY)[number];

/** An autonomy answer this product actually offers, or null. Never throws. */
export function asPlanAutonomy(value: unknown): PlanAutonomy | null {
  if (typeof value !== "string") return null;
  return (PLAN_AUTONOMY as readonly string[]).includes(value) ? (value as PlanAutonomy) : null;
}

/**
 * A work shape the spine actually has, or null.
 *
 * A Set of the five, and NOT `value in WORK_SHAPE_LABEL`. `in` walks the
 * prototype chain, so an earlier draft of this check accepted "constructor" and
 * "toString" as work shapes — and every one of them then reached `SHAPES[shape]`
 * in `suggestRoute`, which has no such key, and threw. A defensive reader that
 * turns a strange model output into a 500 is worse than no reader at all.
 */
const WORK_SHAPES: ReadonlySet<string> = new Set(Object.keys(WORK_SHAPE_LABEL));

export function asWorkShape(value: unknown): WorkShape | null {
  if (typeof value !== "string") return null;
  return WORK_SHAPES.has(value) ? (value as WorkShape) : null;
}

/** Every string field is bounded, because all of them cross a request boundary. */
const MAX_ORIGIN = 200;
const MAX_TITLE = 200;
const MAX_GOAL = 4000;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t ? t.slice(0, max) : null;
}

/**
 * READ A PROPOSAL OFF THE WIRE, or return null.
 *
 * VALIDATED AGAINST THE CLOSED SETS, exactly like `station` in `ask-sse.ts`: a
 * shape this client does not know, a station that is not one of the seven, a
 * missing title — any of them yields null, and the frame is then `ignored`
 * rather than rendering a gate about a plan nobody can name. A gate is the one
 * surface where degrading to silence really is better than degrading to a guess:
 * the thing being answered is how much money may be spent without asking again.
 *
 * `station` is the exception that is allowed to be absent, because the
 * classifier is allowed to say it does not know. A station that is present and
 * unrecognised is NOT tolerated the same way — it means server and client
 * disagree about the seven, and the plan drawn from it would be a different
 * plan from the one the server will recompute on confirmation.
 */
export function parsePlanProposal(value: unknown): PlanProposal | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const id = text(raw.id, 100);
  const shape = asWorkShape(raw.shape);
  const origin = text(raw.origin, MAX_ORIGIN);
  const title = text(raw.title, MAX_TITLE);
  const goal = text(raw.goal, MAX_GOAL);
  if (!id || !shape || !origin || !title || !goal) return null;

  const stationRaw = raw.station;
  const station = asStation(stationRaw);
  // Present but unrecognised is a disagreement, not an absence. See above.
  if (stationRaw !== null && stationRaw !== undefined && !station) return null;

  const capRaw = raw.spend_cap_usd;
  let spendCapUsd: number | null = null;
  if (capRaw !== null && capRaw !== undefined) {
    const n = Number(capRaw);
    /*
     * A ceiling that does not parse is not reported as "no ceiling": the gate
     * would then say the run may spend without limit, which is the one reading
     * of an unreadable number that a person must never be shown. So it drops
     * the whole proposal instead, and the pane draws no gate rather than a
     * wrong one.
     *
     * ZERO IS ACCEPTED, and negative is not. Zero is a real ceiling meaning
     * nothing may be spent — `spendState` draws it as already reached, in the
     * failure chip, which is loud and is the correct fail direction. It is also
     * what `planProposalLine` falls back to when a cap arrives non-finite, for
     * the reason written there: `JSON.stringify(NaN)` is `null`, and `null` in
     * this field means the opposite of what a broken number should mean.
     */
    if (!Number.isFinite(n) || n < 0) return null;
    spendCapUsd = n;
  }

  return { id, shape, station, origin, title, goal, spendCapUsd };
}

/**
 * ONE `data: ` LINE, ready to enqueue.
 *
 * A BUILDER RATHER THAN A TEMPLATE AT THE CALL SITE, because this protocol has
 * already been shipped wrong in exactly that way once: the first `landing`
 * emitter wrote the parser's RETURN type (`{kind, artifact}`) instead of its
 * INPUT (`{landing: …}`), which `parseSseLine` read as `ignored` and dropped in
 * silence. No type could catch it — both ends were internally consistent and
 * only disagreed about the wire. With one builder there is one shape, and the
 * test walks its output through the real parser.
 *
 * `plan_proposal`, snake_case, matching `dispatch_blocked` rather than the
 * single-word keys, because the name has two words in it and the protocol's
 * existing two-word key is snake.
 */
export function planProposalLine(proposal: PlanProposal): string {
  /**
   * THE ONE CHECK THE PARSER CANNOT MAKE FOR ITSELF, and it was found by
   * writing the round-trip test rather than by reading this function.
   *
   * `JSON.stringify(NaN)` is `null`, and `null` in this field means "this
   * workspace has no ceiling". So a cap that arrived as NaN — a `Number()` of a
   * column that held something odd — crosses the wire as permission to spend
   * without limit, and the reader on the other side has nothing left to
   * disbelieve: it is a well-formed null. The parser refuses an unreadable
   * number, and cannot refuse this one, because by then it is not a number.
   *
   * So it is caught here, where the value still exists, and it falls CLOSED to
   * zero rather than open to null. Zero draws as a ceiling already reached,
   * which stops the run and is loud; null draws as no ceiling at all, which is
   * silent and is the reading that costs money. `resolveMissionSpendCap` cannot
   * produce a NaN today; this is the guard for the day something upstream can.
   */
  const cap =
    proposal.spendCapUsd === null || Number.isFinite(proposal.spendCapUsd)
      ? proposal.spendCapUsd
      : 0;
  return `data: ${JSON.stringify({
    plan_proposal: {
      id: proposal.id,
      shape: proposal.shape,
      station: proposal.station,
      origin: proposal.origin,
      title: proposal.title,
      goal: proposal.goal,
      spend_cap_usd: cap,
    },
  })}\n\n`;
}

/**
 * WHAT A PERSON CHANGED BEFORE THEY ANSWERED, on its way to the record.
 *
 * `PlanGate` lets the plan be edited — a step skipped with a reason, a station
 * waived with a reason — and a gate you cannot redirect is a speed bump. Those
 * edits are the difference between the plan that was proposed and the plan that
 * was accepted, so they travel with the answer and land in the gate event's
 * `diff_summary`, which is the column that exists for exactly this ("a short
 * human-readable summary of any change").
 */
export type PlanEdits = {
  /** Step ids the person took out, with the reason they gave. */
  skipped?: { id: string; why?: string | null }[];
  /** Stations the person took off the route, with the reason they gave. */
  waived?: { station: string; reason?: string | null }[];
};

/** At most this much of an edit summary reaches `diff_summary`. */
const MAX_DIFF = 1000;

/**
 * The edits as one line, or an empty string when the plan was accepted as filed.
 *
 * EMPTY IS A REAL ANSWER HERE and is not padded into "no changes". A blank
 * `diff_summary` already means "nothing was changed" to every existing reader of
 * this table; writing a sentence that says so would make this one gate's rows
 * sort and group differently from every other gate's for no gain.
 */
export function describePlanEdits(edits: PlanEdits): string {
  const parts: string[] = [];
  for (const s of edits.skipped ?? []) {
    if (!s?.id) continue;
    parts.push(s.why ? `skipped ${s.id}: ${s.why}` : `skipped ${s.id}`);
  }
  for (const w of edits.waived ?? []) {
    if (!w?.station) continue;
    parts.push(w.reason ? `waived ${w.station}: ${w.reason}` : `waived ${w.station}`);
  }
  return parts.join("; ").slice(0, MAX_DIFF);
}
