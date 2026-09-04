/**
 * P-58b · ATTRIBUTION FIRST, THEN THE FIX THE NUMBERS NAME.
 *
 * P-58's ping keeps the Worker's own isolate warm and `/` still cost 4.86s
 * after 31 minutes idle (A3, live). The ping's own scope is deliberately
 * database-free (`/health` "touches no database"), so it cannot be warming
 * whatever `/` reads that a bare isolate does not need. This is how that
 * gets NAMED rather than guessed a second time: a `Server-Timing` header
 * naming each phase a route's `loader` actually pays for, read once cold and
 * once warm, so the report carries a number instead of a theory.
 *
 * ONLY THE TRULY SERVER-RENDERED ROUTES CAN CARRY ONE. `/_authenticated`
 * sets `ssr: false` for its entire subtree (that file's own comment: "the
 * client-side beforeLoad below handles the real auth gate"), so `/start` has
 * no SSR phase to time at all -- a curl against it reads the same static
 * shell every client route gets, and `/start`'s own cost lives entirely in
 * the browser, in the `beforeLoad` chain `_authenticated.tsx` already marks
 * with `console.log("[perf] ...")`. This file is for the routes that DO
 * render server-side; `/start` needs a browser Performance-panel reading,
 * not a curl one, and that distinction is itself part of what this packet's
 * attribution step was for.
 *
 * FAILS SILENT, NEVER LOUD. `setResponseHeader` depends on running inside the
 * request's own server context; this codebase has no prior use of it from a
 * route `loader` to model this on, so the whole point of the wrapper is that
 * a context this call cannot reach costs the page nothing -- no header, not
 * a broken response. A timing header is a diagnostic, and a diagnostic that
 * can crash the page it is measuring is the wrong trade every time.
 */
import { setResponseHeader, getResponseHeader } from "@tanstack/react-start/server";

/** One phase's name and how long it took, in the shape `Server-Timing` wants:
 *  `name;dur=123`. Spaces are not legal in the token, so a name with one
 *  would silently corrupt the header -- caught here rather than downstream. */
function entry(name: string, ms: number): string {
  if (/\s/.test(name)) throw new Error(`server-timing phase name "${name}" must not contain space`);
  return `${name};dur=${Math.round(ms)}`;
}

/**
 * Append one already-timed phase to the response's `Server-Timing` header.
 * The half `timedPhase` below shares with a caller that already has its own
 * duration -- `track.functions.ts`'s `withStartReaderTiming` is the first of
 * those: it already wraps every `/start`-adjacent reader with a wall-clock
 * measurement and a `console.log`, so this rides the same number onto a
 * header a person can `curl -sI` for, rather than a Worker log they would
 * otherwise need `wrangler tail` to reach. Fails silent, same reason
 * `timedPhase` does: see this file's own header.
 */
export function appendServerTiming(name: string, ms: number): void {
  try {
    const existing = getResponseHeader("Server-Timing") as unknown;
    const prior =
      typeof existing === "string" ? existing : Array.isArray(existing) ? existing.join(", ") : "";
    const next = prior ? `${prior}, ${entry(name, ms)}` : entry(name, ms);
    setResponseHeader("Server-Timing", next);
  } catch {
    // No request context reachable (see this file's own header) -- the
    // caller's own timing (its console.log, its return value) is unaffected;
    // only this header is silently lost.
  }
}

/**
 * Time one phase and append it to the response's `Server-Timing` header.
 * Returns whatever `fn` returns either way -- a phase that cannot be timed
 * (no request context, e.g. a route rendered outside a real HTTP request)
 * must not change what the route itself does.
 */
export async function timedPhase<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    return await fn();
  } finally {
    appendServerTiming(name, performance.now() - started);
  }
}
