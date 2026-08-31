import type { Anchor } from "@/lib/presence/collision";
import { groupKeyOf } from "@/lib/presence/collision";
import { isSideEffectingTool } from "@/lib/tool-consequences";

/**
 * WHAT CHANGED WHILE YOU WERE LOOKING SOMEWHERE ELSE.
 *
 * `SPEC-MULTIPLAYER-PRESENCE` §3.2: the shared-object mark "stays after the
 * cursor leaves, briefly, as a 'changed just now' trace, so a person who looked
 * away for ten seconds can still see what moved."
 *
 * ── THIS IS THE EASIEST PLACE IN THE FEATURE TO LIE ───────────────────────
 * A cursor is disciplined by §2: no live run, no cursor. **A trace is the
 * loophole** — it is drawn precisely BECAUSE the teammate has gone, so the
 * obvious implementation keeps a copy and fades it on a timer. That copy claims
 * something after its row stopped being true, and a timer is the one mechanism
 * §2 names as theatre. This repo has already failed a branch for a timer
 * advancing step labels.
 *
 * ── SO THE TRACE IS DECIDED BY THE ROW'S OWN AGE, NOT BY OURS ─────────────
 * A trace survives while **the tool call it describes** is younger than the
 * window — `now - createdAt`, where `createdAt` is the `tool_calls` row. Not
 * "how long since we noticed it left", which is a fact about the client, and
 * not a countdown started on departure, which is a timer.
 *
 * **The difference is visible in the case that matters.** A teammate whose last
 * action was four minutes ago, and whose run has just ended, produces NO trace:
 * nothing changed just now, so nothing says it did. A departure-triggered
 * countdown would have drawn one for the next forty-five seconds and been
 * wrong the entire time.
 *
 * Every field a trace renders — who, what verb, which object — is copied from
 * the anchor row itself, so the mark can always name the row it came from,
 * which is §2's whole test.
 */

/** The last thing we saw a teammate do to an object, kept only while it is recent. */
export interface Trace {
  /** Same key an `Anchor` and an on-screen object are matched by. */
  key: string;
  slug: string;
  toolName: string;
  /** Epoch ms of the `tool_calls` row. The trace's whole lifetime is this. */
  at: number;
}

/**
 * HOW LONG "JUST NOW" LASTS, and the number is argued rather than picked.
 *
 * §3.2's stated case is "a person who looked away for ten seconds". Ten is too
 * tight to survive the read that produced it — the anchors poll is 10s, so a
 * ten-second window could expire between two polls and the trace would never be
 * drawn at all. Sixty would be worse in the other direction: a minute-old change
 * is not "just now" to anybody, and a mark that overstays is the furniture
 * problem again.
 *
 * **45s: comfortably longer than one poll interval, comfortably shorter than
 * the minute at which the phrase stops being true.**
 */
export const TRACE_MS = 45_000;

/**
 * The traces to draw, given what is live now and what we last saw.
 *
 * Pure, and takes `now` as an argument rather than reading the clock, because a
 * function that reads the clock cannot be tested at the boundary — and the
 * boundary is the whole behaviour here.
 */
export function tracesFrom(
  seen: ReadonlyMap<string, Trace>,
  live: readonly Anchor[],
  now: number,
  windowMs: number = TRACE_MS,
): Trace[] {
  const liveKeys = new Set<string>();
  for (const a of live) if (a.agentSlug) liveKeys.add(groupKeyOf(a));

  const out: Trace[] = [];
  for (const t of seen.values()) {
    /* A LIVE OBJECT IS NOT A TRACE. It has a cursor on it, and drawing both
       would put two marks on one thing saying the same teammate is and is not
       there. */
    if (liveKeys.has(t.key)) continue;
    if (now - t.at >= windowMs) continue;
    out.push(t);
  }
  /* Newest last, so the most recent change paints over an older one when two
     objects overlap. The reader's eye should land on the freshest thing. */
  return out.sort((a, b) => a.at - b.at);
}

/**
 * Fold this poll's anchors into what we have seen, dropping what has aged out.
 *
 * **Bounded by construction**: an entry is only kept while its row is inside the
 * window, so this map cannot grow with session length — which is the other way a
 * remembered-state feature goes wrong, quietly, over hours.
 */
export function rememberAnchors(
  seen: ReadonlyMap<string, Trace>,
  live: readonly Anchor[],
  now: number,
  windowMs: number = TRACE_MS,
): Map<string, Trace> {
  const next = new Map<string, Trace>();
  for (const [key, t] of seen) if (now - t.at < windowMs) next.set(key, t);

  for (const a of live) {
    if (!a.agentSlug) continue;
    /* ── A READ LEAVES NO TRACE, BECAUSE NOTHING MOVED ───────────────────
       §3.2 asks for a "changed just now" trace so a person who looked away
       "can still see WHAT MOVED". A `repo.read` moved nothing, and a mark
       saying otherwise is a small lie that would also be the common case:
       S0 measured the target-naming tools as overwhelmingly reads -
       `repo.read` 64 calls, `prd.get` 25 - against a handful that write.

       So the trace is spent only where something actually changed, on the
       same `isSideEffectingTool` judgement the contested mark uses. This is
       the difference between the LIVE indicator and the trace: the ring says
       "somebody is on this" for any anchor, because that is true; the trace
       says "this changed" and is only drawn where it did. */
    if (!isSideEffectingTool(a.toolName)) continue;
    const at = Date.parse(a.createdAt);
    /* An unparseable stamp cannot be aged, and a trace is nothing but an age.
       Dropped rather than treated as now - treating it as now would make it the
       longest-lived trace on screen, which is the opposite of what an unusable
       timestamp should buy. */
    if (!Number.isFinite(at)) continue;
    const key = groupKeyOf(a);
    const held = next.get(key);
    /* Newest wins per object. Two teammates on one thing leaves the later
       action as the trace, which is what "changed just now" means about an
       object rather than about a person. */
    if (held && held.at >= at) continue;
    next.set(key, { key, slug: a.agentSlug, toolName: a.toolName, at });
  }
  return next;
}
