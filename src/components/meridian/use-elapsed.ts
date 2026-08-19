import { useEffect, useState } from "react";

import { formatElapsed } from "./run-rows";

/**
 * HOW LONG THIS HAS BEEN GOING, in tenths.
 *
 * Split out of `LoadingState.tsx` on 2026-08-18 when `AgentPulse` needed the
 * same figure. Two copies of one clock is how two indicators on one screen come
 * to disagree about the same instant, which is the argument `run-state.ts`
 * makes for one status vocabulary and `agent-pulse-words.ts` makes for one word
 * list. It is a `.ts` module rather than an export from the component file
 * because `react-refresh/only-export-components` allows a component module to
 * export a constant and not a helper.
 *
 * TENTHS, because that moves visibly without forcing a render every frame.
 *
 * `startedAt` exists because the common case is NOT a fresh mount. Someone
 * reopens a surface on a run that has been going for four minutes, and a timer
 * that restarts at 0.0s there is actively misleading: it reports the age of the
 * COMPONENT, not the age of the WORK.
 *
 * `active` exists so a caller that has no honest start time does not pay for a
 * 100ms interval it will never render. `LoadingState` leaves it on, because a
 * loading state with no `startedAt` still legitimately reports time since it
 * appeared. `AgentPulse` turns it off, because an agent indicator showing time
 * since the indicator mounted would be the exact lie described above.
 *
 * ── THE HOURS BRANCH, ADDED 2026-08-19, AND WHY IT WAS MISSING ──────────
 * This formatted `${m}m ${s}s` above sixty seconds and never rolled over, so an
 * 86-hour hold rendered as `5160m 0.0s`. It typechecked, it was not wrong, and no
 * reader could parse it. It had not bitten because the only caller was a loading
 * state measured in seconds, and it was found by reading rather than by looking:
 * one of the sizes nobody draws.
 *
 * The formatting itself lives in `run-rows.tsx` as `formatElapsed`, because the
 * three run views need the same figure without mounting a timer to get it.
 */
export function useElapsed(startedAt?: number, active = true): string {
  const [ds, setDs] = useState(() =>
    startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 100)) : 0,
  );
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setDs((d) => d + 1), 100);
    return () => clearInterval(t);
  }, [active]);
  return formatElapsed(ds / 10);
}
