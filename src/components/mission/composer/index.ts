// Mission Control composer (front-end reimagining Phase 2): the docked
// strip, the shortcut summon, the suggestion rows, and the journey chips.
// These components consume props only.
//
// THE THREAD RE-EXPORT IS GONE, with the Mission Control room that owned it.
// `Thread.tsx` rendered the room's conversation column, and the room was
// deleted on 2026-08-10 as unreachable: `ROOM_PRODUCT_ROUTE_IDS` in
// `src/lib/room-url.ts` is an empty array with both route ids commented out,
// so nothing could mount it. Re-exporting a deleted module from a barrel is
// not a dangling name a reader can ignore -- this barrel is what
// `src/routes/_authenticated.tsx` imports `GlobalComposer` through, so a stale
// line here fails the whole authenticated tree at compile time.
//
// What remains is re-exported because it is still reachable: `GlobalComposer`
// is mounted by that route, and Composer / ComposerOverlay / SuggestionPopover
// / JourneyChips are its transitive dependencies through `ComposerOverlay`.

export { Composer, ComposerSurface } from "./Composer";
export type { ComposerProps, ComposerSurfaceProps } from "./Composer";
export { ComposerOverlay } from "./ComposerOverlay";
export type { ComposerOverlayProps } from "./ComposerOverlay";
export { SuggestionPopover, buildSuggestionRows } from "./SuggestionPopover";
export type { SuggestionPopoverProps, SuggestionRow, SuggestionSection } from "./SuggestionPopover";
export { JourneyChips, COMPOSER_JOURNEYS } from "./JourneyChips";
export type { JourneyChipsProps } from "./JourneyChips";
export { GlobalComposer, OPEN_COMPOSER_EVENTS } from "./GlobalComposer";
