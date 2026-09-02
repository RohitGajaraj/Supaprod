// GlobalComposer: the mount point for Ask on every authenticated surface.
//
// IT MOUNTS ASK AND NOTHING ELSE, and this file is named for a thing that no
// longer exists. Until 2026-08-21 it also declared `GlobalComposerHost`, which
// rendered the ⌘K command palette overlay, and that host was never called: the
// palette had been unreachable since the founder's 2026-07-30 ruling gave ⌘K to
// Ask, and nothing in `src/` ever dispatched its `supaprod:open-cmdk` summon.
//
// THE PALETTE IS RETIRED, by ruling and not by cleanup. The reasoning, the two
// written contracts it reverses, and the evidence for each is in
// `docs/decisions/palette-retired-2026-08.md`. Read that before rebuilding a
// command palette here: the short version is that every job the palette was
// held for is now done by something mounted -- `GotoShortcuts` for the chords
// (`_authenticated.tsx`), `FindAnything` for search-by-name and `ShortcutSheet`
// for the chord table (`components/shell/AppFrame.tsx`) -- and that ⌘K is
// Ask's by the founder's own call, so the palette had no key left to open on.
//
// The standing rule is that retired UI stays in the tree unmounted (Addendum
// 1.1 rule 8). It was suspended here deliberately and for a recorded reason:
// keeping two dead hosts in the tree cost two sessions, and very nearly bought
// a ruling taken on the belief that four palette verbs were lying to users in
// production. A host nobody can reach is not recoverability, it is a trap that
// reads as live code. What was worth keeping was kept -- `lib/palette-catalog`
// and `lib/palette-sections` are still here as data, because the capability
// list they hold is the one thing with no other home.
//
// THE ROOM IS GONE, as of 2026-08-10, and the exclusion below outlived it.
// The room's shell owned the composer and the Thread there, and a second
// stream on the same conversation would go stale mid-answer.
// `ROOM_PRODUCT_ROUTE_IDS` (`src/lib/room-url.ts`) has been an empty array for
// some time with both ids commented out, so `inRoom` is permanently false. The
// check is kept because it is honest at zero cost -- an empty list matches
// nothing -- and it is the seam to re-arm if a product-scoped surface ever
// wants to suppress the global dock again.

import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import { ROOM_PRODUCT_ROUTE_IDS } from "@/lib/room-url";
import { AskDock } from "@/components/ask/AskDock";

export function GlobalComposer({ pane }: { pane?: React.ComponentType } = {}) {
  // The room owns its composer and Thread; never a second stream there.
  // Matched route ids, not a pathname prefix: the room moved from /m/<uuid> to
  // /$workspaceSlug/$productSlug, and a startsWith("/m/") test would have gone
  // quietly false there, mounting a second stream on the room's conversation.
  const inRoom = useRouterState({
    select: (s) =>
      s.matches.some((m) => (ROOM_PRODUCT_ROUTE_IDS as readonly string[]).includes(m.routeId)),
  });
  if (inRoom) return null;
  // THE DOCK, not the bare pane. AskDock renders AskPane unchanged and adds the
  // collapsed row that makes the door visible from everywhere. See AskDock.tsx:
  // the pane keeps ⌘K, Escape and both forks exactly as they were.
  return <AskDock pane={pane} />;
}
