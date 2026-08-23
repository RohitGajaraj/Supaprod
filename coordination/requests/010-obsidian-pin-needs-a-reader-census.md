REQ-010: the obsidian parchment pin needs a reader census before it can ship

Following answers/R005 section 3. The ruling named the real fix (pin the
parchment aliases inside [data-obsidian] to their dark values) and offered
a defer if too wide for one night. I took the defer then; this request
records WHY it stays deferred even with a live session, so the next attempt
starts from facts instead of re-deriving them.

The block is styles.css around 1365-1390: --ink through --dark-navy alias
parchment names onto theme-varying tokens (--ink: var(--text-primary),
--paper: var(--canvas), and fifteen more). Pinning means restating each with
its dark value inside the scope.

The blocker, measured just now: the aliases' readers are not only public
pages. Grep of src/components outside landing/ and supaprod/ finds at least
nine authed component families reading them:

chat/MessageMeta.tsx, admin/VouchersPanel.tsx,
product/SpecProjectionsPanel.tsx, product/RoadmapHistory.tsx,
system/BackendHealthBanner.tsx, meridian/boundary-states.tsx,
brief/BriefFormationFlow.tsx, engine-room/EngineRoomSurface.tsx,
engine-room/RoomCard.tsx, engine-room/ConnectionStrip.tsx.

Under data-theme=light those components currently receive light-tuned
values consistent with their adaptive mrd grounds. Pinned, they would carry
dark-palette ink onto whatever ground their region renders, which for an
authed light user may itself be light. That trades today's scoped bug for a
new unscoped one, on the busiest authenticated surfaces.

Three shapes of fix, your call:

1. PIN-ALL anyway, and audit each reader family for ground consistency in
   the same pass. Largest blast radius; correct if every listed family sits
   on always-dark context (brief deck does; chat and admin likely do not).
2. RETIRE-READERS-FIRST: port the nine families off parchment names onto
   mrd tokens (most live beside code already speaking mrd), then pin with
   zero authed readers left. Slowest, safest, and it shrinks the retired
   vocabulary rather than freezing it - my preference if you want the pin
   this month rather than tonight.
3. PER-SURFACE OPT-IN: leave the shared block alone; give always-dark
   public surfaces their own pinned scope class. Fastest, but it multiplies
   scopes and leaves the original inconsistency standing.

Until ruled, status quo holds: the landing keeps its own style block (ruled
correct as-is), public pages keep their spreads, nothing regresses today.
