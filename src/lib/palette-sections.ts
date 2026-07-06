/**
 * OBS-11 - the JUMP destinations and ACT verbs. Pure data, no JSX, so both
 * unit-test without React. JUMP mirrors `nav-model.ts`'s `PRIMARY_NAV`
 * verbatim (read-only - OBS-10 owns the route list itself).
 */

export type PaletteRun = { to: string; search?: Record<string, string>; event?: string };

export type JumpDestination = { label: string; hint: string; run: PaletteRun };

export const JUMP_DESTINATIONS: readonly JumpDestination[] = [
  { label: "Today", hint: "1", run: { to: "/today" } },
  { label: "Discover", hint: "2", run: { to: "/discover" } },
  { label: "Plan", hint: "3", run: { to: "/plan" } },
  { label: "Build", hint: "4", run: { to: "/build" } },
  { label: "Brain", hint: "5", run: { to: "/brain" } },
];

export type ActVerb = { label: string; run: PaletteRun };

export const ACT_VERBS: readonly ActVerb[] = [
  { label: "Challenge a belief", run: { to: "/discover", search: { tab: "opportunities" } } },
  { label: "Connect a source", run: { to: "/settings", search: { section: "connections" } } },
  { label: "Answer the current Call", run: { to: "/today" } },
  { label: "Ask about this screen", run: { to: "/today", event: "cadence:open-ask" } },
];
