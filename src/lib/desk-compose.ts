/**
 * IA SPINE (2026-07-11) — the desk composer events behind the palette's ACT
 * verbs. "Add a task", "Capture a signal", and "Share status" used to lie:
 * they claimed an action but only navigated to /today. Each now fires a
 * scoped cadence:* event that opens its composer in place, mirroring how
 * "Start a focus block" works (FocusDock's cadence:focus-compose).
 *
 * The focus dock is mounted globally, so its event always lands. These three
 * composers live on Today's Desk, so a fired intent is ALSO held as pending:
 * the palette navigates to /today, the owning card mounts, consumes the
 * pending intent, and opens its composer. A short TTL keeps a stale intent
 * from popping a composer minutes later.
 */
import { useEffect } from "react";

export const TASK_COMPOSE_EVENT = "cadence:task-compose";
export const SIGNAL_COMPOSE_EVENT = "cadence:signal-compose";
export const STATUS_COMPOSE_EVENT = "cadence:status-compose";

export const DESK_COMPOSE_EVENTS: readonly string[] = [
  TASK_COMPOSE_EVENT,
  SIGNAL_COMPOSE_EVENT,
  STATUS_COMPOSE_EVENT,
];

const PENDING_TTL_MS = 10_000;
let pendingEvent: string | null = null;
let pendingAt = 0;

/** Fire a desk composer intent: live listeners hear it now; a card that
 *  mounts within the TTL (after the palette's /today navigation) consumes it. */
export function fireDeskCompose(event: string): void {
  pendingEvent = event;
  pendingAt = Date.now();
  window.dispatchEvent(new CustomEvent(event));
}

/** Consume a pending intent for this event, if one is still fresh. */
export function consumePendingDeskCompose(event: string): boolean {
  if (pendingEvent === event && Date.now() - pendingAt < PENDING_TTL_MS) {
    pendingEvent = null;
    return true;
  }
  return false;
}

/** Test-only: clear the module-level pending intent. */
export function resetDeskComposeForTest(): void {
  pendingEvent = null;
  pendingAt = 0;
}

/**
 * Subscribe an owning surface to its composer intent. Handles both timings:
 * already-mounted (the live event) and mounted-after-navigation (the pending
 * intent consumed on mount).
 */
export function useDeskComposeIntent(event: string, onCompose: () => void): void {
  useEffect(() => {
    const handler = () => {
      pendingEvent = null;
      onCompose();
    };
    window.addEventListener(event, handler);
    if (consumePendingDeskCompose(event)) onCompose();
    return () => window.removeEventListener(event, handler);
    // onCompose is intentionally captured per-render-stable via the deps below;
    // owning cards pass stable callbacks (setState/focus on a ref).
  }, [event, onCompose]);
}
