// Mission Control composer (front-end reimagining Phase 2): the docked
// strip, the shortcut summon, the suggestion rows, the journey chips, and
// the Thread column. The shell owns useAskStream, getBriefing, and the
// approvals query; these components consume props only.

export { Composer, ComposerSurface } from "./Composer";
export type { ComposerProps, ComposerSurfaceProps } from "./Composer";
export { ComposerOverlay } from "./ComposerOverlay";
export type { ComposerOverlayProps } from "./ComposerOverlay";
export { SuggestionPopover, buildSuggestionRows } from "./SuggestionPopover";
export type { SuggestionPopoverProps, SuggestionRow, SuggestionSection } from "./SuggestionPopover";
export { JourneyChips, COMPOSER_JOURNEYS } from "./JourneyChips";
export type { JourneyChipsProps } from "./JourneyChips";
export { Thread, ThreadMessage } from "./Thread";
export type { ThreadProps } from "./Thread";
export { GlobalComposer, OPEN_COMPOSER_EVENTS } from "./GlobalComposer";
