/**
 * OBS-11 → IA SPINE (2026-07-11) - the JUMP destinations and ACT verbs. Pure
 * data, no JSX, so both unit-test without React.
 *
 * DERIVATION LAW: JUMP is DERIVED from `nav-model.ts`'s `PRIMARY_NAV` - the
 * hand-copied list is gone, so the palette can never drift from the rail.
 * The displayed key hint is the destination's 1-based rail position (the
 * same keys GotoShortcuts binds).
 *
 * THE SHAPE LAW FOR ACT (2026-08-21, K-37, founder ruling B+):
 *
 *   A palette verb either NAVIGATES to the station that owns the job, or it
 *   ACTS IN PLACE through something mounted globally. It never does both.
 *
 * This replaced the opposite assertion, which stood here until 2026-08-21 and
 * was the root cause of four verbs that silently did nothing: it read "every
 * composer opens in place via its scoped supaprod:* event ... no verb merely
 * navigates and calls it an action", which forbids the shape that works and
 * demands the one that cannot. The shape it demanded needed the destination to
 * mount a listener within a TTL of a route change it does not control, so
 * "Add a task", "Capture a signal", "Share status" and "Start a focus block"
 * dispatched into nothing on every authenticated route. Deleting them while
 * leaving that sentence standing would get them rebuilt the same way.
 *
 * ACT IS HAND-WRITTEN AND JUMP IS DERIVED, and that asymmetry is why only ACT
 * rotted: a literal array cannot notice that its destination was rebuilt
 * underneath it, which is exactly what happened when Today lost its Desk. So
 * an ACT verb exists for a station when that station OWNS a create surface,
 * and it navigates there. `palette-catalog.test.ts` fails the build on any
 * verb that is neither shape.
 *
 * The reasoning, the three shapes and the cost accepted:
 * docs/decisions/palette-verb-shapes.md
 */
import { PRIMARY_NAV, navKeyHint } from "@/lib/nav-model";

export type PaletteRun = { to: string; search?: Record<string, string>; event?: string };

export type JumpDestination = { label: string; hint: string; tagline: string; run: PaletteRun };

export const JUMP_DESTINATIONS: readonly JumpDestination[] = PRIMARY_NAV.map((n) => ({
  label: n.label,
  hint: navKeyHint(n),
  tagline: n.tagline,
  run: { to: n.to, search: n.search },
}));

export type ActVerb = { label: string; run: PaletteRun };

/**
 * The events an ACT verb may carry, and the proof each one is heard from
 * anywhere. A verb with an event NOT on this list is shape 3 - navigate AND
 * open something on arrival - which is the shape that rotted, and the guard
 * fails the build on it.
 */
export const GLOBALLY_MOUNTED_EVENTS: readonly string[] = [
  // AskProvider, ask-context.tsx:324. Mounted above every authenticated route.
  "supaprod:open-ask",
  // AuditLineageSheet.tsx:279, mounted by AppFrame.tsx:2042, which wraps every
  // authenticated surface.
  "supaprod:open-lineage",
];

export const ACT_VERBS: readonly ActVerb[] = [
  { label: "Challenge a belief", run: { to: "/arriving", search: { tab: "opportunities" } } },
  { label: "Connect a source", run: { to: "/settings", search: { section: "connections" } } },
  { label: "Answer the waiting call", run: { to: "/today" } },
  { label: "Ask about this screen", run: { to: "/today", event: "supaprod:open-ask" } },
  // K-37: the two station acts. Both navigate, and both land ON the box rather
  // than merely on the station - the capture box sits below Discover's ranked
  // reading by deliberate design, so a bare `/discover` would land you on the
  // right station with the box off screen. `?capture=1` is parsed by
  // _authenticated.discover.tsx's validateSearch, which is the same repair
  // `?focus=` needed: the route drops any param it does not parse.
  { label: "Capture a signal", run: { to: "/arriving", search: { capture: "1" } } },
  // NameABet, _authenticated.decide.tsx:3385. The palette has never offered
  // this and it is the most valuable act in the product. Plain navigation for
  // now: /decide has no validateSearch at all, so the landing treatment above
  // is a larger change there and is filed separately rather than bundled.
  { label: "Name a bet", run: { to: "/decide" } },
];
