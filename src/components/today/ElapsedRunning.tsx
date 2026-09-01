import { Num } from "@/components/meridian/surface-parts";
import { useElapsed } from "@/components/meridian/use-elapsed";

/**
 * THE TICKING CLOCK ON A RUNNING ROW.
 *
 * The board's first glance-fact is "every piece of work in flight … and how
 * long it has been doing it". A relative string computed at render ("12m")
 * answers it only as of the last poll; this mounts the shared clock so the
 * figure moves while a person is looking at it, derived from the mission's
 * own `created_at` — the age of the WORK, never the age of the component
 * (that distinction is `useElapsed`'s whole reason for `startedAt`).
 *
 * Engine-Room: an elapsed time on work a person delegated. Nothing about how
 * the timer works appears anywhere.
 *
 * WHY THE CLOCK IS NOT THE BANNED TIMER. `today-states-its-wait.test.ts`
 * refuses `setInterval` in the route because a timer walking an index through
 * step labels is fabricated progress (`no-fabricated-agent-steps.test.ts`).
 * This advances a REAL duration from a REAL timestamp — the opposite claim —
 * and it lives beside the row rather than in the route file for the same
 * reason `HandoverNote` does: enrichment owns its own rendering, and the
 * route's read-count contract stays untouched.
 *
 * REUSED, NOT REBUILT: `useElapsed` + `formatElapsed` are the run views'
 * existing clock (LoadingState, AgentPulse, RunTimeline all read them), so a
 * board clock and a run-page clock can never disagree about one instant.
 *
 * THE CALLER GUARDS THE HONEST CASES: this mounts only for a genuinely
 * running row whose `created_at` parses. An unparseable start must not become
 * a counter that silently reports time since mount — that is the exact lie
 * `useElapsed` was written to prevent — so the caller falls back to the plain
 * relative word instead of mounting this.
 */
export function ElapsedRunning({ startedAt }: { startedAt: number }) {
  const elapsed = useElapsed(startedAt);
  return (
    <>
      <Num>{elapsed}</Num> running
    </>
  );
}

/** True when the row's timestamp can honestly drive a live clock. A future
 *  instant is a clock skew, not an age, so it refuses like garbage does.
 *  `now` is injectable so the refusal is testable rather than trusted. */
export function parseableInstant(
  iso: string | null | undefined,
  now: number = Date.now(),
): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= 0 && t <= now ? t : null;
}
