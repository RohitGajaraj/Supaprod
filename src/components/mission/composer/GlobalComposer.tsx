// GlobalComposer (front-end reimagining, Phase 2 wiring): the ONE summon on
// the old-app surfaces. The two shortcut keys that used to open the command
// palette (Cmd/Ctrl+K) and the Ask panel (Cmd/Ctrl+J) now open this single
// ComposerOverlay, and the shared supaprod:open-ask / supaprod:open-cmdk
// events land here too (the TopBar Ask button, the /m index WarmSlot, and
// the AppShell palette button all dispatch those events already).
//
// Self-contained on purpose: it owns its own draft, useAskStream (the same
// /api/chat contract, per-scope thread persistence), and renders the answer
// messages INSIDE the overlay with ThreadMessage, so read-aloud, retry, and
// the promote chips survive the Ask panel's retirement (Addendum 1.1 rule 8).
// Mic dictation appends into the draft through the hook's onDictation seam.
//
// The Mission Control room (/m/$productId) is excluded: the room's shell owns
// the composer and the Thread there, and a second stream on the same
// conversation would go stale mid-answer. Journey chips here activate by
// navigating INTO the room with the journey and its first stage in the URL.

import * as React from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAskStream } from "@/hooks/use-ask-stream";
import { DESK_COMPOSE_EVENTS, fireDeskCompose } from "@/lib/desk-compose";
import { journeyById, type JourneyId } from "@/lib/journeys";
import type { PaletteRun } from "@/lib/palette-sections";
import type { StageId } from "@/components/mission/Spine";
import { ComposerOverlay } from "./ComposerOverlay";
import { ThreadMessage } from "./Thread";

/** The summon events the overlay answers (the old palette + Ask doors). */
export const OPEN_COMPOSER_EVENTS = ["supaprod:open-ask", "supaprod:open-cmdk"] as const;

export function GlobalComposer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The room owns its composer and Thread; never a second stream there.
  if (pathname.startsWith("/m/")) return null;
  return <GlobalComposerHost />;
}

function GlobalComposerHost() {
  const navigate = useNavigate();
  const { activeProductId } = useWorkspace();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const ask = useAskStream({
    enabled: open,
    onDictation: (text) => setDraft((d) => (d ? `${d} ${text}` : text)),
  });

  // The summon listeners ride refs so the window bindings mount once.
  const sendIntentRef = React.useRef(ask.sendIntent);
  sendIntentRef.current = ask.sendIntent;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && (key === "j" || key === "k")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onSummon = (e: Event) => {
      setOpen(true);
      // A palette ASK row arrives with an intent: run it straight away.
      const intent = (e as CustomEvent<{ intent?: string }>).detail?.intent?.trim();
      if (intent) sendIntentRef.current(intent);
    };
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
      if (run.event === "supaprod:open-ask") return; // this IS the Ask surface
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
      void navigate({
        to: "/m/$productId",
        params: { productId: activeProductId },
        search: { stage, journey: id },
      });
    } else {
      void navigate({ to: "/m" });
    }
  };

  const lastId = ask.messages.length > 0 ? ask.messages[ask.messages.length - 1].id : null;

  return (
    <ComposerOverlay
      open={open}
      onClose={() => setOpen(false)}
      draft={draft}
      onDraftChange={setDraft}
      onSubmitIntent={(text) => ask.sendIntent(text)}
      onActivateJourney={onActivateJourney}
      onRun={onRun}
      streaming={ask.streaming}
      dictation={ask.dictation}
    >
      {ask.messages.length > 0 ? (
        <div
          data-testid="overlay-thread"
          className="mb-2 flex max-h-[45vh] flex-col gap-3 overflow-y-auto"
        >
          {ask.messages.map((msg) => (
            <ThreadMessage
              key={msg.id}
              msg={msg}
              isStreamingThis={ask.streaming && msg.id === lastId && msg.role === "assistant"}
              liveStatus={ask.liveStatus}
              promoted={ask.promotedByMsg[msg.id]}
              onPromote={ask.promote}
              onRetry={ask.retry}
              readAloud={ask.readAloud}
            />
          ))}
        </div>
      ) : null}
    </ComposerOverlay>
  );
}
