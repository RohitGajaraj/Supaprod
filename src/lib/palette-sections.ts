/**
 * OBS-11 → IA SPINE (2026-07-11) - the JUMP destinations and ACT verbs. Pure
 * data, no JSX, so both unit-test without React.
 *
 * DERIVATION LAW: JUMP is DERIVED from `nav-model.ts`'s `PRIMARY_NAV` - the
 * hand-copied list is gone, so the palette can never drift from the rail.
 * The displayed key hint is the destination's 1-based rail position (the
 * same keys GotoShortcuts binds).
 */
import { PRIMARY_NAV } from "@/lib/nav-model";
import { TASK_COMPOSE_EVENT, SIGNAL_COMPOSE_EVENT, STATUS_COMPOSE_EVENT } from "@/lib/desk-compose";

export type PaletteRun = { to: string; search?: Record<string, string>; event?: string };

export type JumpDestination = { label: string; hint: string; run: PaletteRun };

export const JUMP_DESTINATIONS: readonly JumpDestination[] = PRIMARY_NAV.map((n, i) => ({
  label: n.label,
  hint: String(i + 1),
  run: { to: n.to, search: n.search },
}));

export type ActVerb = { label: string; run: PaletteRun };

export const ACT_VERBS: readonly ActVerb[] = [
  { label: "Challenge a belief", run: { to: "/discover", search: { tab: "opportunities" } } },
  { label: "Connect a source", run: { to: "/settings", search: { section: "connections" } } },
  { label: "Answer the waiting call", run: { to: "/today" } },
  { label: "Ask about this screen", run: { to: "/today", event: "cadence:open-ask" } },
  // PM Desk (2026-07-09): the desk tools, reachable from anywhere. Every
  // composer opens in place via its scoped cadence:* event (the dock listens
  // globally for focus; the Desk cards consume a pending intent after the
  // /today landing) - no verb merely navigates and calls it an action.
  { label: "Start a focus block", run: { to: "/today", event: "cadence:focus-compose" } },
  { label: "Add a task", run: { to: "/today", event: TASK_COMPOSE_EVENT } },
  { label: "Capture a signal", run: { to: "/today", event: SIGNAL_COMPOSE_EVENT } },
  { label: "Share status", run: { to: "/today", event: STATUS_COMPOSE_EVENT } },
];
