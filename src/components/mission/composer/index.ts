// Mission Control composer: what is left of it is Ask's mount point.
//
// THIS BARREL EXPORTS ONE NAME, and it used to export nine. Composer,
// ComposerSurface, ComposerOverlay, SuggestionPopover, buildSuggestionRows,
// JourneyChips and COMPOSER_JOURNEYS were the command palette's overlay and
// its rows; they were reachable only through `GlobalComposerHost`, which was
// declared in `GlobalComposer.tsx` and never called. The palette was retired
// by ruling on 2026-08-21 and those files were deleted with it. The reasoning
// is in `docs/decisions/palette-retired-2026-08.md`.
//
// `OPEN_COMPOSER_EVENTS` went with them: it named `supaprod:open-cmdk`, the
// palette's summon, which nothing in `src/` ever dispatched.
//
// Keep this barrel. `src/routes/_authenticated.tsx` imports `GlobalComposer`
// through it, so a stale line here fails the whole authenticated tree at
// compile time -- which is exactly why it is worth keeping honest.

export { GlobalComposer } from "./GlobalComposer";
