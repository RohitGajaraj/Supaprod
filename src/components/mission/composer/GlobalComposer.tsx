// GlobalComposer: the mount point for the two summons on old-app surfaces.
//
// THEY ARE TWO SURFACES AGAIN, and that is the change. Cmd/Ctrl+J and Cmd/Ctrl+K
// used to open the same centred overlay, so Ask and the command palette were
// one box doing two jobs. The founder's complaint on 2026-07-30 was that Ask
// "looks very bare and very lean", and the reason is that it was never designed
// as Ask: it was a palette with a thread stapled above it.
//
//   Cmd/Ctrl+J and supaprod:open-ask  ->  AskPane, a right-hand pane scoped to
//     what you are looking at, with the record register and the action cards.
//     The open state and the resolved scope live in AskProvider, so this file
//     no longer binds that key at all.
//   Cmd/Ctrl+K and supaprod:open-cmdk ->  ComposerOverlay, unchanged. It is the
//     palette: Jump, Act, Catalog, journeys.
//
// The Mission Control room is excluded: the room's shell owns the composer and
// the Thread there, and a second stream on the same conversation would go stale
// mid-answer. Journey chips activate by navigating INTO the room with the
// journey and its first stage in the URL. NOTE, reported not worked around:
// that navigation is a live door into the one unported legacy surface. It is
// gone from Ask, where it was actively routing people into the old design, and
// it survives in the palette because retiring the room is not this lane's call.

import * as React from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { useOpenRoom } from "@/hooks/use-open-room";
import { ROOM_PRODUCT_ROUTE_IDS } from "@/lib/room-url";
import { useDictation } from "@/hooks/use-voice";
import { DESK_COMPOSE_EVENTS, fireDeskCompose } from "@/lib/desk-compose";
import { journeyById, type JourneyId } from "@/lib/journeys";
import type { PaletteRun } from "@/lib/palette-sections";
import type { StageId } from "@/components/mission/Spine";
import { AskPane } from "@/components/ask/AskPane";
import { ComposerOverlay } from "./ComposerOverlay";
import { AskDock } from "@/components/ask/AskDock";

/** The summon events the PALETTE overlay answers. Ask has its own door now. */
export const OPEN_COMPOSER_EVENTS = ["supaprod:open-cmdk"] as const;

export function GlobalComposer() {
  // The room owns its composer and Thread; never a second stream there.
  // Matched route ids, not a pathname prefix: the room moved from /m/<uuid> to
  // /$workspaceSlug/$productSlug, and a startsWith("/m/") test would have gone
  // quietly false there, mounting a second stream on the room's conversation.
  const inRoom = useRouterState({
    select: (s) =>
      s.matches.some((m) => (ROOM_PRODUCT_ROUTE_IDS as readonly string[]).includes(m.routeId)),
  });
  if (inRoom) return null;
  // THE OVERLAY IS GONE, and this is now only Ask's mount point.
  //
  // Founder ruling 2026-07-30: *"if I click on Ask or the shortcut Cmd+K, it
  // still opens me that old section... You need to ensure that old one is gone
  // and it redirects me. Or if I click Ask, it should open me this Ask panel
  // which we are working on."*
  //
  // `GlobalComposerHost` below is therefore no longer rendered. It is left in
  // the file rather than deleted, per the standing rule that retired UI stays
  // in the tree unmounted (Addendum 1.1 rule 8): its journey chips are the only
  // remaining door into the legacy Mission Control room, and retiring that room
  // is a separate call from retiring this overlay. Nothing dispatches
  // `supaprod:open-cmdk` on a rebuilt surface any more, and Cmd+K belongs to
  // AskProvider, so the overlay is unreachable rather than merely discouraged.
  // THE DOCK, not the bare pane. AskDock renders this same AskPane unchanged
  // and adds the collapsed row that makes the door visible from everywhere.
  // See AskDock.tsx: the pane keeps Cmd+K, Escape and both forks exactly as
  // they were, so this is a presence change and not a behaviour change.
  return <AskDock />;
}

function GlobalComposerHost() {
  const navigate = useNavigate();
  const openRoom = useOpenRoom();
  const { activeProductId } = useWorkspace();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  // NO STREAM HERE ANY MORE. The palette used to own a second useAskStream and
  // render the answers above its own input, which is how Ask ended up being a
  // palette with a thread stapled to it. Free text now goes to Ask, which is
  // the surface built to answer one. Dictation stays, because the palette input
  // still takes speech.
  const dictation = useDictation((text) => setDraft((d) => (d ? `${d} ${text}` : text)));

  /** Free text leaves the palette and lands in Ask, carrying the question. */
  const handOffToAsk = (text: string) => {
    setOpen(false);
    setDraft("");
    window.dispatchEvent(new CustomEvent("supaprod:open-ask", { detail: { intent: text } }));
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+J belongs to AskProvider now. Binding it here as well would
      // toggle two surfaces on one press, or cancel itself out.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onSummon = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    for (const ev of OPEN_COMPOSER_EVENTS) window.addEventListener(ev, onSummon);
    return () => {
      window.removeEventListener("keydown", onKey);
      for (const ev of OPEN_COMPOSER_EVENTS) window.removeEventListener(ev, onSummon);
    };
  }, []);

  // Jump / Act / Catalog rows keep the command palette's exact run semantics.
  const onRun = (run: PaletteRun) => {
    if (run.event) {
      if (DESK_COMPOSE_EVENTS.includes(run.event)) {
        fireDeskCompose(run.event);
        setOpen(false);
        void navigate({ to: run.to, search: run.search as never });
        return;
      }
      if (run.event === "supaprod:open-ask") {
        // The palette's own ASK row: open Ask with whatever is typed.
        handOffToAsk(draft.trim());
        return;
      }
      window.dispatchEvent(new CustomEvent(run.event, { detail: {} }));
      setOpen(false);
      // The focus composer opens in place; navigating away would defeat it.
      if (run.event === "supaprod:focus-compose") return;
      void navigate({ to: run.to, search: run.search as never });
      return;
    }
    setOpen(false);
    void navigate({ to: run.to, search: run.search as never });
  };

  // A journey starts in the room: land on the journey's first stage with the
  // slice lit. No product yet: the /m index renders the honest prospect state.
  const onActivateJourney = (id: JourneyId) => {
    setOpen(false);
    if (activeProductId) {
      const stage = journeyById(id).stages[0] as StageId;
      openRoom(activeProductId, { search: { stage, journey: id } });
    } else {
      // /runs, not /m. With no active product /m has nothing to resolve, so it
      // used to land the user in Mission Control's legacy shell with no product
      // chosen, which is a dead end wearing a page. /runs is the spine and it
      // reads fine empty.
      //
      // The branch above still opens the room, because a journey is a
      // product-scoped stage canvas and the run-scoped strip does not replace
      // it. That is the one live door left into the legacy shell and it is
      // recorded as such, not quietly left behind.
      void navigate({ to: "/runs" });
    }
  };

  return (
    <ComposerOverlay
      open={open}
      onClose={() => setOpen(false)}
      draft={draft}
      onDraftChange={setDraft}
      onSubmitIntent={handOffToAsk}
      onActivateJourney={onActivateJourney}
      onRun={onRun}
      streaming={false}
      dictation={dictation}
    />
  );
}
