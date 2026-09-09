/**
 * ASK. The pane, redesigned rather than re-skinned.
 * (docs/planning/rebuild-2026-07/SURFACE-JUSTIFICATION.md, all seven answers.)
 *
 * The founder, 2026-07-30: *"If you open Ask, that panel is not at all touched.
 * It looks very bare and very lean ... Is it like going to be a chat or Copilot
 * window? Do those things happen in threads? Do we have something called
 * threads also? So where exactly does this thing happen?"* And, raised several
 * times: *"if there is any approval queue waiting or any sort of action that is
 * dependent, it needs to render a card inside itself where the action needs to
 * be taken there itself ... In background everything is done by agents."*
 *
 * THE ARCHITECTURE ANSWER, wired rather than asserted: ASK AND THREADS ARE ONE
 * OBJECT AT TWO MOMENTS. Ask is the conversation HAPPENING, summoned over
 * whatever you are looking at, scoped to it, dismissed when you are done.
 * `/threads` is that same conversation REMEMBERED. Both read the same
 * `conversations` table: Ask writes through `conversations.functions.ts` and
 * `listThreads` reads that table with nothing but RLS in front of it, so an Ask
 * conversation is a thread the moment it exists. The way back is `resume`
 * (ask-open.ts), so re-reading and continuing are one motion.
 *
 * 1. WHO IS STANDING HERE. Someone in the middle of looking at something who
 *    has a question about THAT thing, and does not want to lose it off the
 *    screen to ask. Often the question ends in a small piece of work.
 *
 * 2. THE ONE THING IT EXISTS FOR. To settle a question about what is in front
 *    of you without navigating away. Settle, not answer: if the reply sends you
 *    to another surface to press the button, this surface failed.
 *
 * 3. KEEP / MOVE / KILL.
 *    KEEP  the stream and its whole contract (useAskStream, /api/chat SSE,
 *          per-scope conversation persistence). It works and it is locked.
 *    KEEP  promote-to-record, as an action on an answer rather than a chip row.
 *    MOVE  the panel itself: a centred modal over a scrim became a right-hand
 *          pane. A question about what is on screen must not take the screen
 *          away, which is the pane's entire justification in primitives.tsx.
 *    KILL  the scrim, the focus trap and `aria-modal`, deliberately. Dimming
 *          the run you are asking about defeats the surface. This is a
 *          complementary region: Escape closes it, focus returns, and the page
 *          behind it stays live and readable.
 *    KILL  JourneyChips here. Verified: the journey branch navigates into
 *          Mission Control, the one unported legacy surface. Ask was routing
 *          people INTO the old design.
 *    KILL  the Jump and Catalog suggestion rows here. They are the command
 *          palette's rows, and a navigation menu inside Ask makes Ask a second
 *          nav surface.
 *    KEEP, and it is the one exception to the line above: A TYPED ID.
 *          Founder ruling 2026-07-30, *"if I give the ID it should show me the
 *          details and the connected lineages"*. This is not a menu and not
 *          navigation: it appears only when the whole typed line IS a
 *          reference to one record (`detectReference`, pure and tested), it
 *          names that record, and it opens the record BESIDE the work like
 *          everything else in this pane. The alternative was leaving it in the
 *          palette alone, and the palette is no longer reachable: ask-context
 *          took Cmd+K the same day, so an id door built only there would have
 *          been the second dead control in this feature.
 *    KILL  the answer toolbar of chips. Two actions survive as words.
 *
 * 4. ONE CLICK AWAY. Everything before this conversation, and it is a CONTROL
 *    in the chrome rather than a word in a paragraph. Until 2026-07-30 the only
 *    live way into `/threads` in the whole app was a bare link buried in this
 *    pane's footer sentence, and the founder could not find the surface at all.
 *    The fix is not a rail item. Nobody wakes up wanting to browse
 *    conversations; they want the answer they already got, mid-thought, which
 *    makes the archive ASK'S OWN HISTORY rather than a destination. So
 *    `Conversations` sits in the header, opens the switcher in place, and the
 *    switcher's own last row is the way down to the full archive. Two depths of
 *    one idea. There is exactly ONE door and it does not appear twice.
 *
 * 4b. AND IT OPENS FRESH. Founder ruling, same day: *"every single time when a
 *    user logs in, shouldn't it be a new window where a fresh screen appears?
 *    If you show me threads of a hundred plus messages, it would become too
 *    humongous to grasp."* The pointer is NEW PER SESSION AND KEPT WITHIN ONE:
 *    a page load opens an empty conversation, and closing the pane with Escape
 *    is not ending a conversation, so reopening comes back to it. That is one
 *    storage decision, `pointer: "session"` below, and the reasoning lives on
 *    `readSessionConversationId` in ask-stream-core.ts.
 *
 * 5. THE MOMENT, AND WHAT WOULD CONFUSE. The moment is asking what happened,
 *    and being told, and then approving the thing that was waiting, without the
 *    screen ever changing. What would confuse is a scope chip that says the
 *    same words everywhere, or a citation that sounds right and is invented.
 *
 * 6. WHERE THE CREW APPEARS. The answering seat is the Chief of Staff and it is
 *    named (api/chat.ts dispatches the loop as `orchestrator`). Work in motion
 *    is the run card, polled live off `getAskMissionCanvas`. Judgment leaves a
 *    Receipt in the thread, never a toast. Nothing overclaims: no citation
 *    without a server-resolved fact behind it.
 *
 * 7. WOULD A STRANGER RECOGNISE THIS?
 *    IDENTITY DRAWN: the Chief of Staff's mark on the header, your initials on
 *    what you settled. Registers are LABELLED (`You`, `Answer`, `From the
 *    record`), so who is speaking never depends on which side a bubble sits on.
 *    SCANNING PATH: the scope chip first (what am I asking about), then the
 *    most recent answer, then the one lit surface on the page, which is the
 *    record recess. Nothing else is lit, which is what makes it win.
 *    THE EMPTIEST REALISTIC STATE: see `Opening` below. It is the state every
 *    user sees on day one and it was the founder's actual complaint.
 *    WHAT A STRANGER DOES NOT UNDERSTAND: "PRD" is gone (the chip says "your
 *    specs"). "Steer" is explained by its own placeholder. "Hand it over" is
 *    plain English for dispatch, and the line under it says what it costs you.
 *    "Threads" is gone from this surface too: the control says `Conversations`,
 *    which is the word the founder used and the word a stranger has.
 *
 * 8. THE MIC, which existed and was never drawn. `useDictation` has been a
 *    complete Web Speech wrapper since PC-36 and `use-ask-stream` has been
 *    handing it to the UI the whole time; the only surface rendering it was the
 *    legacy palette that is being retired. It is here now, it HIDES ITSELF
 *    where the browser has no speech recognition rather than offering a dead
 *    button, and listening is a WORD plus the live transcript, never a pulse:
 *    `gate` blinks and is the only blink in the system.
 */

import * as React from "react";
import { Row } from "@/components/meridian/rows";
import { Action, Actions, ReadFailedLine } from "@/components/meridian/surface-parts";
import { LoadingState } from "@/components/meridian/LoadingState";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useNavigate } from "@tanstack/react-router";
import { startTrack } from "@/lib/spine/track.functions";
import { failureLine } from "@/lib/error-copy";
import { useAskStream } from "@/hooks/use-ask-stream";
import { useApprovalPush } from "@/hooks/use-approval-push";
import { useAsk, chipLabel, retrievalScope } from "@/lib/ask-context";
import { defaultIntent, contentForIntent, type AskIntent } from "@/lib/ask-intent";
import { shapeOfTheWork } from "@/lib/ask/shape-of-the-work";
import { WORK_SHAPE_LABEL, suggestRoute } from "@/lib/spine/route";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

/**
 * ── WHAT PRESSING THIS WILL ACTUALLY DO, IN THE LINE THAT ALREADY WARNED ───
 *
 * The hint under the composer read "This starts a run and spends credits." on
 * exactly the drafts that hand over. True, and it named the cost without naming
 * the thing being bought: F-222 was that every one of those runs walked all
 * seven stations because the hand-over passed a literal shape.
 *
 * SAID, NOT ASKED. Lane 1's home fix is a picker beside the composer, and it is
 * right there and wrong here: this hand-over fires from intent detection on
 * submit rather than from a row with space for a control, and a select bolted
 * onto a conversation pane is interrogation rather than anticipation. So the
 * machine works it out, states it in the line that was already going to speak,
 * and the person rewords if it reads wrong. Nothing new is asked of them, and
 * the shape is no longer a silent constant.
 *
 * DERIVED END TO END, so it cannot drift from what actually runs: the shape's
 * words come from `WORK_SHAPE_LABEL` and the entry station from
 * `suggestRoute(shape).entry` through the one station display map. Change a
 * waiver in `route.ts` and this sentence changes in the same edit.
 */
function handoverLine(draft: string): string {
  const shape = shapeOfTheWork(draft);
  const entry = AGENT_STATIONS[suggestRoute(shape).entry]?.name;
  const what = WORK_SHAPE_LABEL[shape];
  /* The station is dropped rather than guessed if the map ever loses it: the
     cost is the half a person must not miss, and it is said either way. */
  return entry
    ? `${what}. It starts at ${entry} and spends credits.`
    : `${what}. This starts a run and spends credits.`;
}
import { openAskConversation } from "@/lib/ask-open";
import { detectReference } from "@/lib/palette-reference";
import { OPEN_MODAL_SELECTOR } from "@/lib/overlay";
import { openLineage } from "@/components/supaprod/AuditLineageSheet";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { listMissions } from "@/lib/missions.functions";
import {
  starterPrompts,
  starterStateIsKnownEmpty,
  contextualStarters,
  type Starter,
} from "@/lib/ask-starters";
import { Choices, Textarea } from "@/components/meridian/forms";
import { AgentMark } from "@/components/meridian/marks";
import { AgentPulse } from "@/components/meridian/AgentPulse";
import { IconMic } from "@/components/shell/icons";
import { SuggestionRail } from "./SuggestionRail";
import { AskSwitcher } from "./AskSwitcher";
import { AskTurn, toTurns } from "./AskTurn";
import { approvalsQueueKey, missionsKey } from "@/lib/query-keys";
import { initialsFrom } from "@/lib/initials";

/** The seat that answers. `api/chat.ts` runs the loop as `orchestrator`, so
 *  this is a wiring fact, not a flattering label. */
const ANSWERED_BY = "orchestrator";

/* ------------------------------------------------------------------ *
 * The pane
 * ------------------------------------------------------------------ */

export function AskPane() {
  const ask = useAsk();
  if (!ask.isOpen) return null;
  // Keyed on the resumed conversation: `useAskStream` reads its stored thread
  // once, in a state initialiser, so remounting is how Threads hands a
  // conversation back. The opener has already written it into the per-scope
  // map, so this mount hydrates it.
  return <AskPaneOpen key={ask.resume?.conversationId ?? "live"} />;
}

function AskPaneOpen() {
  const ask = useAsk();
  const { activeWorkspace, activeProductId, activeProduct, productsVisible } = useWorkspace();
  /**
   * WHICH PRODUCT'S RECORD ANSWERS, and it is not the same question as which
   * thread you are in. See `retrievalScope` in ask-context.tsx for the ruling.
   * Resolved here rather than in `AskProvider` because the provider deliberately
   * holds no workspace data, and this component already reads it.
   */
  const retrieval = retrievalScope({
    productId: activeProductId ?? null,
    productName: activeProduct?.name ?? null,
    manyProducts: Boolean(productsVisible),
  });
  const [initials, setInitials] = React.useState("?");
  const [draft, setDraft] = React.useState("");
  /*
   * ── HANDING IT OVER, AND THE ONE FAILURE THAT MUST NOT BE SILENT ────────
   *
   * The palette is a modal over whatever a person was doing, so a start that
   * fails here has nowhere obvious to say so: the pane closes on navigate, and a
   * refused start would close it too and leave them where they began with no
   * sentence and no run. So the sentence goes BACK IN THE BOX on any failure and
   * the pane says what happened, which is the same contract `/start` holds.
   */
  const [handoverProblem, setHandoverProblem] = React.useState<string | null>(null);
  const [intentOverride, setIntentOverride] = React.useState<AskIntent | null>(null);
  const [shown, setShown] = React.useState(false);
  // The switcher takes the BODY, not a layer over it. A pane 392px wide has
  // room for one thing at a time, and the composer stays put underneath so a
  // question that arrives while you are looking still has somewhere to go.
  const [browsing, setBrowsing] = React.useState(false);
  // The Textarea primitive takes no ref, so the wrapper owns it. Cheaper than
  // forking the primitive for one focus call.
  const boxWrap = React.useRef<HTMLDivElement | null>(null);
  const focusBox = React.useCallback(() => {
    boxWrap.current?.querySelector("textarea")?.focus();
  }, []);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const paneRef = React.useRef<HTMLElement | null>(null);
  /**
   * WHETHER THE PERSON IS ALREADY SOMEWHERE ELSE.
   *
   * A pane that took focus owes it back, which is what the cleanup below does.
   * But an outside CLICK has already put the person somewhere specific, and
   * yanking focus back to the control that opened Ask would undo the click they
   * just made. So the restore happens for every dismissal EXCEPT that one, which
   * is exactly the keyboard-versus-pointer split it needs to be: Escape, the
   * Close control and a route change all return focus, and only the gesture that
   * names its own destination does not.
   */
  const leftByPointer = React.useRef(false);

  const resume = ask.resume;
  const startRun = useServerFn(startTrack);
  const askNavigate = useNavigate();
  const handOver = React.useCallback(
    async (text: string) => {
      setHandoverProblem(null);
      try {
        const res = await startRun({
          data: {
            /* Capped at 200 by the validator, which throws rather than
               truncating; the whole sentence is not lost, it is the title. */
            title: text.slice(0, 200),
            /*
             * ── DERIVED, NOT A LITERAL (F-222) ──────────────────────────────
             * This read `shape: "new-capability"`, which is the one shape that
             * waives nothing, so EVERY sentence typed into Ask opened a full
             * seven-station run: "fix the broken login" walked Discover,
             * Decide, Plan and Design before anything touched Build. The
             * derivation and the reason it will not derive `interface-change`
             * are in `shape-of-the-work.ts`; the person reads its answer in the
             * hint line under the composer before they press.
             */
            shape: shapeOfTheWork(text),
            /*
             * THE ORIGIN WAS NEVER SENT AT ALL, which is the quieter half of
             * the same defect. `suggestRoute(shape, origin)` carries it onto
             * the route, and every surface that later asks "where did this work
             * come from" reads it. The person's own sentence is the answer, and
             * it was being dropped on the floor.
             */
            origin: text,
            productId: activeProductId ?? undefined,
            workspaceId: activeWorkspace?.id ?? undefined,
          },
        });
        if (!res.track) {
          setHandoverProblem(res.problems.join(" ") || "Nothing was started.");
          setDraft(text);
          return;
        }
        await askNavigate({
          to: "/track/$trackId",
          params: { trackId: res.track.id },
          search: { start: true },
        });
      } catch (e) {
        setHandoverProblem(
          failureLine("Nothing was started and your sentence is back in the box.", e as Error),
        );
        setDraft(text);
      }
    },
    [startRun, askNavigate, activeProductId, activeWorkspace?.id],
  );

  const stream = useAskStream({
    enabled: true,
    scope: ask.scope,
    // ONE LIVE CONVERSATION PER SESSION, in the workspace bucket, and this used
    // to be the thread's own product. The switcher is why it changed. Ask kept
    // an INVISIBLE thread per product, which is a second answer to a question
    // the person now answers out loud by picking a conversation, and it broke
    // the moment the two disagreed: reopening a thread from another product
    // moved the pane's bucket, so the first Escape dropped it and reopening
    // showed an empty pane. Closing a pane is not ending a conversation. One
    // bucket cannot disagree with itself, and walking to another product now
    // keeps the conversation you are in rather than silently swapping it.
    // Retrieval is UNAFFECTED: `scope` above is what narrows an answer, and it
    // still follows the screen.
    productId: null,
    // AND WHICH PRODUCT'S RECORD ANSWERS, a third question the two lines above
    // do not settle. `scope` narrows to the RECORD on screen and `productId`
    // picks the thread's bucket; this narrows to the PRODUCT you are standing
    // in. It was never set until now, so an answer about one product could be
    // built out of another product's evidence. See `retrievalScope`.
    retrievalProductId: retrieval.productId,
    // New per session, kept within one. See 4b in the header.
    pointer: "session",
    onDictation: (text) => setDraft((d) => (d ? `${d} ${text}` : text)),
  });

  /**
   * THE LIVE SURFACE SUBSCRIBES, INSTEAD OF ONLY THE RETIRED ONE.
   *
   * `useApprovalPush` is a complete Supabase realtime subscription on this
   * user's `agent_approvals` rows, and until now its ONLY mount was
   * `components/obsidian/ask-canvas.tsx`, the retired canvas. The run cards a
   * person actually watches render from `AskTurn` inside THIS pane, a different
   * tree, so on the live surface the push was not mounted at all and the card
   * polled at four seconds to discover a gate the server already knew about.
   *
   * Mounted here rather than inside `AskRunCard` deliberately: a turn can render
   * several cards, and one subscription per card would open several channels
   * sharing a name for one socket's worth of information. The pane is the
   * singleton, it is unmounted when closed (so nothing subscribes while nobody
   * is looking), and it is the parent of every card that benefits.
   *
   * The 4s poll in AskRunCard is deliberately KEPT. Realtime drops silently on a
   * network blip, and a card that stops updating is worse than one that updates
   * slowly.
   */
  /*
   * FALSE SINCE 2026-09-01, AND THE CAPABILITY DID NOT SHRINK -- IT GREW.
   * This subscription is now mounted once in the authenticated shell
   * (`_authenticated.tsx`), so it is live on every surface rather than only
   * while this panel is open, and the run screen's inline gate and the board's
   * review queue are pushed to as well. Two mounts would open two Supabase
   * channels under the same name, so this one stands down.
   */
  useApprovalPush(false);

  // THE QUEUE IS READ, AND IT IS NOT DRAWN ON ARRIVAL. Founder ruling
  // 2026-07-30: *"approval should not go under Ask... If I click Ask, it should
  // open a fresh window, no approvals waiting for me, nothing like that. But
  // when some conversation happens, user triggers conversation asking about
  // certain things, what is waiting for me, where the action needs to be taken,
  // then you can display those cards."*
  //
  // So Ask ANSWERS ABOUT approvals and never CARRIES them. `/approvals` and
  // Today own that inbox; a second one behind this door would make the count in
  // the rail mean two different things. The read stays because the answer needs
  // it: `gatesForAnswer` (AskTurn) matches these rows to a turn BY ID, or draws
  // the head of the queue when the question was literally "what is waiting on
  // me", and settles them inline. Nothing reads it before a question exists.
  const fetchQueue = useServerFn(getApprovalsQueue);
  const queue = useQuery({
    // The SAME key the shell's rail count uses, so one truth has one cache and
    // settling a gate here updates the badge without a second read.
    queryKey: approvalsQueueKey(activeWorkspace?.id ?? null),
    queryFn: () => fetchQueue({ data: { workspaceId: activeWorkspace?.id ?? undefined } }),
    staleTime: 30_000,
  });
  const items = queue.data?.items ?? [];

  // What the workspace is actually doing, for the way in. The SAME key AppFrame
  // reads for the rail's run count, so on every authenticated surface this is
  // already resolved and Ask pays nothing for it.
  const fetchMissions = useServerFn(listMissions);
  const missions = useQuery({
    queryKey: missionsKey(activeWorkspace?.id ?? null),
    /* Scoped, because the key claims a workspace. See use-live-agents.ts. */
    queryFn: () => fetchMissions({ data: { workspaceId: activeWorkspace?.id ?? undefined } }),
    staleTime: 30_000,
  });

  React.useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setInitials(
        initialsFrom(
          data.user?.email ?? null,
          (data.user?.user_metadata?.full_name as string | undefined) ?? null,
        ),
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  // Enter, and focus RETURNED on the way out. The pane is not modal, so the
  // page behind it keeps its scroll and its interactivity; what it owes is
  // putting focus back where it took it from.
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      setShown(true);
      focusBox();
    });
    return () => {
      cancelAnimationFrame(raf);
      if (leftByPointer.current) return;
      if (opener && document.body.contains(opener)) opener.focus();
    };
  }, [focusBox]);

  /**
   * A CLICK OUTSIDE COLLAPSES IT, WHICH IS WHAT A SIDE PANE OWES.
   *
   * FOUNDER RULING, 2026-08-11, and it is the half of dismissal this pane never
   * had: *"when I click my mouse cursor somewhere outside, it should collapse if
   * it is a left pane. If it is opening in a full-sized window or pop-up-like
   * window, then Escape or a close button should be fine."* Until now the only
   * ways out were Escape and the Close control, so a person who was finished
   * with Ask and reached for the work behind it got nothing, twice, and then
   * went looking for a button.
   *
   * IT IS THE MATCHING GESTURE FOR THE SHAPE WE CHOSE. This surface stayed a
   * side pane rather than becoming a centred modal (see the geometry note on the
   * `aside` below), and light dismissal is what a side pane trades for keeping
   * the page behind it live. A modal earns Escape and an explicit control
   * BECAUSE it has taken the screen; a pane that has taken nothing must let go
   * the moment attention moves.
   *
   * `pointerdown` RATHER THAN `click`, and the difference is real: a click fires
   * only if press and release land on the same element, so dragging a selection
   * out of the pane and releasing on the page would not dismiss, and a press
   * that lands on something the page removes never dismisses at all. Pointerdown
   * is the moment attention moved, which is the thing being detected.
   *
   * WHAT IT STANDS DOWN FOR, and each of these is a real surface that would
   * otherwise close the pane underneath itself:
   *   · the pane, obviously, including anything it renders inline;
   *   · the two doors that OPEN Ask. Without this the header control and the
   *     dock row become dead: pointerdown closes the pane and the click that
   *     follows immediately reopens it, so pressing the visible Ask button
   *     appears to do nothing at all;
   *   · the lineage sheet, which is summoned FROM this pane, takes its exact
   *     geometry and covers it. Dismissing Ask on the press that traces a record
   *     would destroy the conversation that asked for the trace;
   *   · anything modal or floating above, which owns its own dismissal. A menu,
   *     a popover, a dialog and a select all render outside this subtree.
   *
   * NOTHING IS LOST BY CLOSING. The conversation is persisted server side and
   * the session pointer survives, so reopening comes back to it, which is the
   * same contract Escape has had since 2026-07-30.
   */
  React.useEffect(() => {
    const KEEPS_IT_OPEN = [
      '[data-testid="ask-pane"]',
      ".sp-askbtn",
      '[data-testid="ask-dock"]',
      ".sp-lineage",
      '[role="dialog"]',
      '[role="alertdialog"]',
      '[role="menu"]',
      '[role="listbox"]',
      "[data-radix-popper-content-wrapper]",
    ].join(", ");

    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !document.body.contains(target)) return;
      if (paneRef.current?.contains(target)) return;
      if (target.closest(KEEPS_IT_OPEN)) return;
      leftByPointer.current = true;
      ask.close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [ask]);

  /**
   * ESCAPE CLOSES THIS PANE, AND STOPS THERE.
   *
   * THE DEFECT THIS PREVENTS. This handler used to be `if (e.key === "Escape")
   * ask.close()` on `window`, claiming nothing and yielding to nobody, so a
   * single press in an engine room with Ask open and a lineage trail traced ran
   * three handlers at once and took the person out of the room as well. The
   * footer below makes that far worse than an ordering nit: while an answer
   * streams it prints "Escape leaves it running.", INSTRUCTING the press, and
   * that is exactly the moment the composer is disabled and focus has fallen to
   * <body>, so the room's own "is focus in a field" guard sees nothing to hold it
   * back. We were telling people to press the key that lost their place.
   *
   * THIS IS THE THIRD RUNG of the ladder documented on AuditLineageSheet's own
   * Escape handler: document BUBBLE, which is after MoreMenu's document-capture
   * listener (a popover inside this pane, which must still win) and before the
   * engine room's window-bubble one (the page underneath, which must lose).
   * Position on the propagation path is the layer order, and unlike mount order
   * it cannot drift.
   *
   * `!e.defaultPrevented` is belt to that braces: if a future layer claims the
   * key without stopping propagation, this pane respects the claim rather than
   * closing on top of it.
   *
   * ON `document` RATHER THAN `window`, and the difference is only visible to a
   * test: a real key event targets the focused element and passes through
   * document on the way up, so this hears every genuine press. An event
   * synthesised with `window.dispatchEvent` has a propagation path of exactly
   * one node and never reaches here. Shipped source may not synthesise keypresses
   * at all (src/lib/__tests__/no-synthetic-key-dispatch.test.ts), so a test that
   * dispatches on `window` is testing something no user can do; dispatch on the
   * focused element, or on document.body, as the real thing does.
   *
   * NO FIELD GUARD, for the same reason the sheet has none, and one more: Escape
   * with focus in this pane's own composer is the single most common way anybody
   * closes it, so standing down inside a textarea would break the pane's most
   * used gesture.
   */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      /**
       * ASK IS NOT THE INNERMOST LAYER, and the first version of this assumed
       * it was.
       *
       * `stopPropagation` here was unconditional, which silences every listener
       * this handler happens to beat. Ask binds on `document`; BoardPanel and
       * the other summoned overlays bind on `window`, which in the bubble phase
       * runs AFTER document. So with the board open over Ask, one Escape closed
       * Ask and the board never heard the key -- a person who opened the board
       * to glance at a run had to press Escape twice and watched the wrong thing
       * close first.
       *
       * Standing down under an open modal restores the order the shell actually
       * has: the thing on top goes first. `defaultPrevented` above covers any
       * layer that claimed the press before us; this covers the ones that run
       * after. Ask still closes on Escape with nothing over it, which is the
       * gesture its own footer promises while an answer streams.
       */
      if (document.querySelector(OPEN_MODAL_SELECTOR)) return;
      e.preventDefault();
      e.stopPropagation();
      ask.close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ask]);

  // An intent handed in by an opener (a palette row, a "ask about this" link)
  // runs once, verbatim: an opener already said what it wanted.
  const sendIntentRef = React.useRef(stream.sendIntent);
  sendIntentRef.current = stream.sendIntent;
  React.useEffect(() => {
    if (!ask.pendingIntent) return;
    sendIntentRef.current(ask.pendingIntent);
    ask.clearPendingIntent();
  }, [ask]);

  const turns = React.useMemo(() => toTurns(stream.messages), [stream.messages]);
  const lastId = stream.messages.length ? stream.messages[stream.messages.length - 1].id : null;

  // The foot follows the answer. One scroll per frame of content, never a
  // jump per token.
  React.useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [stream.messages.length, stream.streaming]);

  const scopeLabel = chipLabel(ask.scope, activeWorkspace?.name ?? null);
  const intent: AskIntent = intentOverride ?? defaultIntent(draft);

  // AN ID IS NOT A QUESTION. When the whole box is a reference to one record,
  // the honest reply is the record, not a paragraph about it: the model would
  // be guessing at a row it has not read. Null for anything else, including a
  // sentence that merely mentions a tag, so no row appears while typing prose.
  const reference = React.useMemo(() => detectReference(draft), [draft]);

  const dictation = stream.dictation;

  function send() {
    const text = draft.trim();
    if (!text || stream.streaming) return;
    // Sending is the end of dictating. The box goes read-only while an answer
    // streams, so a mic still running would be talking into a locked door.
    if (dictation.listening) dictation.stop();
    /**
     * BOTH HALVES OF THE CHOICE TRAVEL NOW.
     *
     * `contentForIntent` only ever carried the INSTRUCTION half, by prefixing
     * the conductor's alias so a resolved mention skips the server's
     * classifier. The question half had no representation on the wire at all,
     * so pressing Ask sent a bare sentence and the classifier was free to read
     * it as work and dispatch a mission that spends money. The request field
     * `api/chat.ts` reads into `forcedAsk` was never emitted by anything.
     *
     * SINCE 2026-08-22 THE FIELD CARRIES BOTH HALVES AND THE TEXT CARRIES
     * NEITHER. The prefix is gone: it skipped the classifier, took the
     * single-step dispatch path instead of the planning loop, and edited the
     * person's own sentence on the way to their transcript. `ask-intent.ts`
     * has the full account. `contentForIntent` still runs, because trimming is
     * its job and because the day an intent genuinely needs to change the text
     * this is where it belongs.
     *
     * The vocabulary differs on purpose and is mapped rather than renamed: this
     * pane thinks in "question / instruction", which is what the control says,
     * and the API speaks "ask / do".
     */
    /*
     * ── "HAND IT OVER" STARTS A RUN AND TAKES YOU TO IT (R-24, P-05) ────────
     *
     * WHAT IT DID BEFORE. The "do" intent posted to `/api/chat`, which called
     * `createMission` and streamed back a LANDING FRAME -- a link to `/build`
     * that the person then had to press. So the product's most direct
     * instruction, typed into the palette from anywhere, neither started the
     * unit of work the rest of the product is built on nor took anybody
     * anywhere. Two objects, two front doors, and the one a person met was the
     * one being retired.
     *
     * IT CALLS THE SAME SERVER FN THE COMPOSER DOES. `/start`'s composer has
     * landed a typed sentence on `/track/:id?start=true` correctly for weeks;
     * this is that path, reached from the palette. One path is better than a
     * second one that has to be kept in step with it, and it is why this does
     * not go through `/api/plan-gate` either: a gate in front of a start the
     * composer does not have would make the same sentence behave differently
     * depending on which box it was typed into.
     *
     * THE MISSION BRANCH IN `api/chat.ts` IS NOT DELETED, and that is
     * deliberate: it is a server route no packet holds, it still serves the
     * classifier's own path, and the acceptance is that no path FROM THE UI
     * reaches it. Unreachable is the claim; removed is a different packet.
     *
     * ASKING IS UNCHANGED. A question is a question and still streams.
     */
    if (intent === "instruction") {
      void handOver(text);
      setDraft("");
      setIntentOverride(null);
      setBrowsing(false);
      return;
    }

    stream.sendIntent(contentForIntent(text, intent), "ask");
    setDraft("");
    setIntentOverride(null);
    // The answer is the thing to look at now, not the list you came from.
    setBrowsing(false);
  }

  // A read that FAILED contributes nothing rather than an invented prompt, so
  // the error case and the not-yet case both arrive here as null. See
  // ask-starters.ts for why that distinction is load bearing.
  const starterSource = {
    missions: missions.isError ? null : (missions.data?.missions ?? null),
  };
  const starters = starterPrompts(starterSource);
  // Derived from the surface you are standing on, every time the pane opens.
  // The scope chip in the header and these questions are the same fact said
  // twice, which is what "connected to what they're working on" has to mean.
  const contextual = contextualStarters({
    scopeKind: ask.scope?.kinds?.[0] ?? null,
    scopeLabel,
  });

  return (
    <aside
      /**
       * COMPLEMENTARY, NOT A DIALOG, AND THE QUESTION WAS ASKED AGAIN AND
       * ANSWERED THE SAME WAY.
       *
       * Founder, 2026-08-11: *"should we also do it like a center pane when we
       * open it, instead of the ask pane only to a certain portion from the
       * right side."* He asked; he did not decide. The call is that it stays a
       * pane, and the reason is this surface's job rather than a preference
       * about shapes.
       *
       * WHAT THE MARKET DOES SPLITS CLEANLY ON ONE LINE, and it is not a split
       * about screen size (Mobbin, web, 2026-08-11). Every centred surface in
       * the reference set is a NAVIGATION palette: Magnific, Mistral, Vapi,
       * Juicebox and StackAI all dim the page because you are LEAVING it, so
       * hiding it costs nothing. Every surface that answers ABOUT the thing on
       * screen docks beside it and keeps it lit: Fabric puts its assistant to
       * the right of the note it is answering on, StackAI's agent rail sits
       * beside the workflow it is describing. Ask is unambiguously the second
       * kind. `chipLabel(ask.scope)` and `contextualStarters(scopeKind)` are the
       * same fact said twice, so what this pane offers is derived from the
       * surface behind it. A scrim would dim the evidence for its own answer.
       *
       * AND ONE FACT DECIDES IT OUTRIGHT: THIS PANE DRAWS GATES. Ask what is
       * waiting on you and `gatesForAnswer` renders a real approval, settleable
       * in place. Approving something whose context has been dimmed is the exact
       * failure this product exists to prevent, so the surface that carries an
       * approval may not take the screen away from it.
       *
       * SO THE SCRIM, THE FOCUS TRAP AND `aria-modal` STAY DELIBERATELY ABSENT,
       * and dismissal is the pane's rather than the modal's: an outside click
       * collapses it (the effect above), Escape closes it, Close closes it, and
       * focus goes back to whatever opened it unless the person's own click has
       * already said where they want to be.
       */
      ref={paneRef}
      role="complementary"
      aria-label="Ask"
      data-testid="ask-pane"
      style={{
        position: "fixed",
        top: "calc(var(--sp-header-h) + var(--sp-pane-inset))",
        right: "var(--sp-pane-inset)",
        bottom: "var(--sp-pane-inset)",
        width: "min(var(--sp-pane-ask-w), calc(100vw - var(--sp-pane-inset) * 2))",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--mrd-float)",
        borderRadius: "var(--mrd-r-pane)",
        boxShadow: "var(--sp-shadow)",
        transform: shown ? "none" : "translateX(calc(100% + 30px))",
        transition: "transform var(--sp-dur-slow, 300ms) var(--mrd-ease)",
      }}
    >
      <header
        style={{
          height: 52,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--mrd-s3)",
          padding: "0 var(--mrd-s5)",
          // Longhand: a shorthand carrying a custom property is parsed
          // inconsistently outside a real browser, and this rule is load bearing.
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: "var(--mrd-line-soft)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s3)", minWidth: 0 }}>
          <AgentMark slug={ANSWERED_BY} state={stream.streaming ? "running" : "quiet"} />
          <span style={{ fontSize: "var(--mrd-t-prose)", fontWeight: 600 }}>Ask</span>
          {/* THE SCOPE CHIP. It names the thing you are looking at, and it
              changes with the surface, or it is decoration. */}
          <span
            title="What this conversation is scoped to"
            style={{
              fontSize: "var(--mrd-t-label)",
              color: "var(--mrd-mute)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {scopeLabel}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", flex: "none" }}>
          {/* THE DOOR, and there is only one of it. Not ghost while open: the
              switcher has taken the body, and the control that did it has to
              look pressed without borrowing a colour to say so. */}
          {/* TIER: clause 3, disclosure only, nothing written */}
          <button
            type="button"
            className={
              browsing
                ? "rounded-mrd-chip border border-mrd-line bg-mrd-lift px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-lift-hover hover:text-mrd-ink"
                : "rounded-mrd-chip px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
            }
            aria-expanded={browsing}
            onClick={() => setBrowsing((v) => !v)}
          >
            Conversations
          </button>
          {/* TIER: clause 3, dismissal only */}
          <button
            type="button"
            className="rounded-mrd-chip px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
            aria-label="Close Ask"
            onClick={ask.close}
          >
            Close
          </button>
        </span>
      </header>

      {/* WHICH PRODUCT THE ANSWER IS DRAWN FROM, said out loud.
          Silent scoping is how somebody gets an answer built out of the wrong
          product's evidence and never finds out. It sits under the header rather
          than beside the scope chip because that chip names the RECORD on screen
          and this names the PRODUCT, and a 392px header cannot carry both
          without ellipsising one of them. Absent, not blank, on a workspace with
          one product: there is no boundary to disclose there.
          Meridian tokens in an `--sp-*` pane on purpose: nothing new is built in
          a retired vocabulary, whatever the file around it still speaks. */}
      {retrieval.chip ? (
        <div
          data-mrd=""
          title={retrieval.detail}
          style={{
            flex: "none",
            padding: "6px 16px",
            fontSize: 11.5,
            color: "var(--mrd-mute)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            borderBottomWidth: 1,
            borderBottomStyle: "solid",
            borderBottomColor: "var(--mrd-line-soft)",
          }}
        >
          {retrieval.chip}
        </div>
      ) : null}

      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "var(--mrd-s5)" }}>
        {browsing ? (
          <AskSwitcher
            answeredBy={ANSWERED_BY}
            initials={initials}
            currentId={stream.conversationId}
            busy={stream.streaming}
            onNew={() => {
              if (stream.streaming) return;
              setBrowsing(false);
              // Order matters. `startNewConversation` clears the thread AND the
              // session pointer; clearing the resume then drops the key the
              // pane is mounted on, so the remount reads nothing and lands on
              // an empty conversation rather than rehydrating the old one.
              stream.startNewConversation();
              ask.clearResume();
              focusBox();
            }}
            onPick={(t) => {
              setBrowsing(false);
              // The SAME motion Threads uses: write the pointer, summon. The
              // pane is keyed on the conversation, so it remounts and hydrates.
              openAskConversation({
                conversationId: t.id,
                productId: t.productId,
                workspaceId: activeWorkspace?.id ?? null,
              });
            }}
            onLeave={ask.close}
          />
        ) : stream.messages.length === 0 ? (
          <Opening
            scopeLabel={scopeLabel}
            // The SAME two inputs `contextualStarters` took, handed on so the
            // station a suggestion wears is read off the switch that chose it
            // rather than guessed at from its words.
            scopeKind={ask.scope?.kinds?.[0] ?? null}
            starters={starters}
            contextual={contextual}
            loading={missions.isLoading}
            failed={missions.isError}
            knownEmpty={starterStateIsKnownEmpty(starterSource)}
            onRetry={() => void missions.refetch()}
            onPick={(q) => {
              setDraft(q);
              focusBox();
            }}
          />
        ) : (
          turns.map((t) => (
            <AskTurn
              key={t.key}
              turn={t}
              streaming={stream.streaming && t.answer?.id === lastId}
              liveStatus={stream.liveStatus}
              queue={items}
              initials={initials}
              onRetry={stream.retry}
              /**
               * WHERE THIS TURN PUT SOMETHING, on the turn that put it.
               *
               * `stream.work.landings` describes the run in flight, so it
               * belongs to the LAST turn and to no other. Handing it to every
               * turn would re-label old answers with a new run's result each
               * time one arrived, which is the shape of lie this register
               * exists to prevent.
               *
               * Until tonight nothing emitted a `landing` frame at all, so
               * every one of these four pieces -- the parser, the accumulator,
               * this prop and `AskLanding` itself -- sat connected to nothing.
               * A person dispatched work and the conversation stopped, with the
               * mission reachable only by knowing to go and look for it.
               */
              landings={t.answer?.id === lastId ? stream.work.landings : undefined}
              /*
               * WHY NOTHING STARTED, on the turn that asked for something and
               * got nothing. Same rule as `landings` and for the same reason:
               * `stream.work` describes THIS request, so handing it to every
               * turn would re-label an old answer as a refusal the moment a
               * later dispatch was blocked.
               */
              blocked={t.answer?.id === lastId ? stream.work.blocked : null}
              /*
               * THE PLAN THIS ANSWER PUBLISHED, ON THE ANSWER THAT PUBLISHED IT
               * — and NOT gated on `lastId`, which is the whole difference
               * between this prop and the two above it.
               *
               * `landings` and `blocked` come out of `stream.work`, which
               * describes the request in flight and is reset when the next one
               * starts, so handing them to every turn would re-label an old
               * answer with a new run's facts. A proposal is the opposite kind
               * of thing: it is an UNANSWERED question, it is keyed by message
               * in the hook precisely so it survives the next turn, and taking
               * it off the screen because somebody typed again would strand work
               * behind a decision they never got to make.
               */
              proposal={t.answer ? (stream.proposalByMsg[t.answer.id] ?? null) : null}
              planDecision={t.answer ? stream.planDecisionByMsg[t.answer.id] : undefined}
              onDecidePlan={t.answer ? (d) => stream.decidePlan(t.answer!.id, d) : undefined}
            />
          ))
        )}
      </div>

      <footer
        style={{
          flex: "none",
          padding: "var(--mrd-s4) var(--mrd-s5) var(--mrd-s5)",
          borderTopWidth: 1,
          borderTopStyle: "solid",
          borderTopColor: "var(--mrd-line-soft)",
        }}
      >
        {reference ? (
          // THE ID YOU PASTED, READ BACK TO YOU. It sits above the fork because
          // it is more specific than either branch of it: those two ask what
          // should happen to a sentence, and this already knows what the line
          // IS. No ember: the lineage pane is the record, already settled, and
          // ember means one thing in this system and it is "waiting on you".
          <div style={{ marginBottom: "var(--mrd-s3)" }}>
            <Row
              tight
              lead={
                reference.kind ? `Open ${reference.ref}` : `Open the record for ${reference.ref}`
              }
              sub="Its details, and what it is connected to."
              onClick={() => {
                // The lineage pane takes this pane's own geometry, so tracing
                // covers Ask rather than moving it, and closing the trail puts
                // the conversation back exactly where it was.
                openLineage(reference.ref);
                setDraft("");
                setIntentOverride(null);
              }}
            />
          </div>
        ) : null}

        {/*
         * A HAND-OVER THAT DID NOT START MUST NOT CLOSE QUIETLY. This pane is a
         * modal over whatever the person was doing: on success it navigates and
         * is gone, so a failure that also closed it would leave them where they
         * began with no sentence and no run, and nothing said. The sentence goes
         * back in the box above and this says why.
         */}
        {handoverProblem ? (
          <div role="status" style={{ marginBottom: "var(--mrd-s3)" }}>
            <Row lead={handoverProblem} />
          </div>
        ) : null}

        {draft.trim() ? (
          // THE FORK, VISIBLE BEFORE YOU COMMIT. One box used to do two very
          // different things and only the server knew which. Now the person
          // does, and can flip it.
          <div style={{ marginBottom: "var(--mrd-s3)" }}>
            <Choices
              mode="one"
              label="What should happen when you send this"
              value={intent}
              onChange={(id) => setIntentOverride(id)}
              options={[
                { id: "question", label: "Ask", title: "Answer it from the record" },
                {
                  id: "instruction",
                  label: "Hand it over",
                  title: "Start a run and let the crew do it",
                },
              ]}
            />
          </div>
        ) : null}

        <div ref={boxWrap}>
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Ask about ${scopeLabel}`}
            aria-label={`Ask about ${scopeLabel}`}
            disabled={stream.streaming}
          />
        </div>

        {dictation.listening ? (
          // THE LISTENING STATE, and it does not pulse. `gate` blinks and is the
          // only blink in the system, so a breathing mic would be a second one
          // competing with the thing that actually needs a decision. What it
          // shows instead is the words as they arrive, which is better evidence
          // that the mic is live than any amount of motion.
          <div
            style={{
              marginTop: "var(--mrd-s3)",
              fontSize: "var(--mrd-t-base)",
              color: "var(--mrd-mute)",
              overflowWrap: "anywhere",
            }}
          >
            {dictation.interim || "Listening."}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--mrd-s4)",
            marginTop: "var(--mrd-s3)",
          }}
        >
          <span style={{ fontSize: "var(--mrd-t-small)", color: "var(--mrd-mute)", minWidth: 0 }}>
            {stream.streaming
              ? // THE PANE'S OWN IN-FLIGHT LINE, and an agent is genuinely behind
                // it: `sendIntent` posts to /api/chat, which classifies through
                // `callModel`, streams through `callModelStream` and dispatches the
                // loop as `orchestrator` via `runAgentLoop`. A flat "Answering."
                // was the one place this pane stated that as punctuation.
                // NO DETAIL. The honest noun would be which fork the person sent,
                // and it is gone by the time this renders: `send` clears the draft
                // and the override, so `intent` has already fallen back to its
                // default, and the opener and retry paths send with no fork at
                // all. A kind read off stale state would be wrong exactly when it
                // mattered. The per-turn `Working` line in the thread carries the
                // server's real progress labels.
                // ONE INDICATOR PER PANE, and this is not the one. `AskTurn`
                // already renders `<Working status={liveStatus} />` under the
                // answer, and that carries the server's REAL progress labels and an
                // elapsed count, which strictly beats a rotating gerund. Putting a
                // pulse here too gave the reader two live things to watch for one
                // piece of work, which is the cognitive load the founder's own bar
                // rules out ("a quick glance must not put cognitive load on the
                // reader"). So this line goes back to carrying the fact the
                // indicator cannot: how to walk away from it.
                "Escape leaves it running."
              : draft.trim() && intent === "instruction"
                ? handoverLine(draft)
                : stream.messages.length > 0
                  ? "Kept. Conversations reopens it."
                  : "Enter sends. Shift and Enter for a new line."}
          </span>
          <span style={{ display: "flex", alignItems: "center", flex: "none" }}>
            {/* THE MIC, and it is absent rather than dead where the browser has
                no speech recognition. `supported` is the hook's own answer, so
                this is a fact about the browser in front of the person, not a
                guess.
                A GLYPH, NOT A WORD (founder ruling 2026-07-30). An earlier pass
                argued for the word on the grounds that every other control in
                this pane is one, and that was the wrong read: the footer
                already carries the send button, the intent fork and a hint
                line, so a fourth run of words buried the one non-verbal action
                in the product among them. The name survives on `aria-label`,
                where it says which way the NEXT press goes rather than where
                you already are, and the pressed state is drawn rather than
                spelled, so it still survives greyscale. */}
            {dictation.supported ? (
              /* TIER: clause 3, toggles local dictation, nothing written */
              <button
                type="button"
                className="rounded-mrd-chip px-mrd-3 py-mrd-2 font-mrd text-mrd-label font-medium text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
                data-icon="true"
                aria-label={dictation.listening ? "Stop dictation" : "Start dictation"}
                aria-pressed={dictation.listening}
                disabled={stream.streaming}
                onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
              >
                <IconMic />
              </button>
            ) : null}
            {/* TIER: clause 1, dispatches the message; streaming blocks as a bystander, not busy */}
            <Action
              variant="primary"
              shortcut="Enter"
              disabled={!draft.trim() || stream.streaming}
              onClick={send}
            >
              {intent === "instruction" ? "Hand it over" : "Ask"}
            </Action>
          </span>
        </div>
      </footer>
    </aside>
  );
}

/* ------------------------------------------------------------------ *
 * The emptiest realistic state
 * ------------------------------------------------------------------ */

/**
 * THE STATE EVERY USER SEES FIRST, and the one the founder called bare.
 *
 * It refuses three easy things. No greeting: the first line is a fact. No
 * illustration: there is nothing to illustrate. No invented sample answer: a
 * pretend citation here would teach people to distrust the real ones.
 *
 * AND, SINCE 2026-07-30, IT REFUSES A FOURTH: THE APPROVALS QUEUE.
 * This used to open with a "Waiting on you" section drawing real gate cards.
 * The founder, on seeing it: *"If I'm not asked anything, why are you showing me
 * those approval windows at all?"*, and then the rule, which is about ownership
 * rather than clutter: *"approval should not go under Ask... But when some
 * conversation happens, user triggers conversation asking about certain things,
 * what is waiting for me, where the action needs to be taken, then you can
 * display those cards."*
 *
 * So a fresh conversation shows ZERO of it: no cards, no count, no banner, not
 * an "all clear" line either, because "nothing needs your call" is still Ask
 * answering a question nobody asked. The capability is untouched and one turn
 * away: ask what is waiting on you and `gatesForAnswer` renders the real cards,
 * settleable inline, which is the thing that makes this not a chat box. A queue
 * has one home and it is `/approvals`; a second one behind this door would make
 * the number in the rail mean two different things.
 *
 * WHAT IT SAYS INSTEAD is true, and specific to this workspace at this moment:
 *  - what this conversation is scoped to, so the chip is explained the first
 *    time and never again,
 *  - WHAT IT CAN SETTLE HERE, which is TWO things and used to be one. The
 *    opening described where an answer comes from and said nothing at all about
 *    the other half of this box: the same line, handed over instead of asked,
 *    becomes a run that plays out in this pane. That fork is real (`Choices`
 *    below, `contentForIntent`, the run card polled off `getAskMissionCanvas`)
 *    and it was invisible until you typed, so the one capability that makes
 *    this not a chat window was the one thing a new user could not discover.
 *  - up to six questions built out of runs that genuinely exist (`MAX` in
 *    ask-starters.ts, raised from three when the strip replaced the list), which
 *    is the
 *    other founder ruling of the day: the suggestions must "know the knowledge
 *    about the product", and the honest floor is FEWER of them rather than
 *    invented ones (see ask-starters.ts),
 *  - where the conversation goes afterwards, because "is this a chat window or
 *    is this Threads" was the founder's actual question.
 *
 * AND EVERY OFFER HOLDS STILL, SINCE 2026-08-11. Every way in used to be a chip
 * in a marquee, and a marquee is deliberately ambient: it travels, it pauses
 * only once you have already reached for it, and its capsules are nowrap and
 * capped at 300px. Measured in a browser that day, that cost more than polish.
 * Half the offers were ellipsised, the strip's own edge mask cut the rest
 * mid-word, and where a scope had only four prompts to deal into three rows the
 * copies a seamless loop needs put the SAME suggestion on screen twice at once.
 * The founder's verdict on the pane, that day: *"the user experience is not
 * rendered, not fully done, and not full."*
 *
 * So the strip became a rail: grouped, full width, wrapping, stationary, and
 * each row carrying the station it comes out of. What it DOES is untouched,
 * which is the part that was never in question: the offers are the same objects
 * from the same reads, and a press still lands the whole sentence in the
 * composer. See SuggestionRail.tsx for the reference set behind the shape and
 * ask-suggestions.ts for why the grouping and the station are derived rather
 * than decided here.
 *
 * A returning user rarely sees this at all: the pane opens holding the running
 * conversation for this scope, hydrated from the same table Threads reads.
 */
function Opening({
  scopeLabel,
  scopeKind,
  starters,
  contextual,
  loading,
  failed,
  knownEmpty,
  onRetry,
  onPick,
}: {
  scopeLabel: string;
  /** `scope.kinds?.[0]`, the other input `contextualStarters` took. */
  scopeKind: string | null;
  /** Already grounded. This component never invents one and never pads. */
  starters: Starter[];
  /** The offered questions for THIS surface. Derived from the scope on every
   *  open, never a constant: founder ruling, "never going to be a static
   *  message ever". */
  contextual: Starter[];
  loading: boolean;
  failed: boolean;
  /** The read LANDED and this workspace has run nothing. Different from both
   *  "still reading" and "could not read", and only this one may be said. */
  knownEmpty: boolean;
  onRetry: () => void;
  onPick: (q: string) => void;
}) {
  /* ONE LIST, GROUPED BY WHAT PRESSING IT DOES. Grounded prompts come first out
     of `starterPrompts`, and the rail keeps that order inside each group, so a
     live run is still the first thing offered without this component ever
     choosing which one that is.

     NOTHING IS LIFTED OUT ANY MORE. A "Start here" row used to be promoted above
     the strip for one reason: the strip moved, and asking somebody to click a
     travelling target is the worst thing that pattern does. Nothing moves now,
     so the promotion had become a second way to say one thing, and the group
     heading says it better: "Work in motion" over a row that names the run beats
     "Start here" over the same row. */
  const offers = [...starters, ...contextual];
  return (
    <>
      <div
        style={{
          fontSize: "var(--mrd-t-prose)",
          color: "var(--mrd-body)",
          lineHeight: "var(--mrd-lh-prose)",
        }}
      >
        {/* BOTH HALVES OF THE BOX, BEFORE ANYTHING IS TYPED. The second sentence
            is the one that was missing: until you had typed a line, nothing on
            this surface said the same box also hands work over, and that fork is
            the difference between this pane and a chat window. It names the
            OUTCOME, a run you watch here, rather than the dispatch that causes
            it, and the footer still says what it costs at the moment you
            commit. */}
        Ask about <b style={{ color: "var(--mrd-ink)" }}>{scopeLabel}</b>. The crew answers from
        this workspace's own record, and cites what it read. Or hand the work over rather than ask
        about it, and it becomes a run you watch from here.
      </div>

      {/* THE FORK IS SAID ONCE, WHERE IT IS ACTIONABLE, AND THE DEAD PREVIEW IS
          GONE. Two greyed-out `sp-btn` spans used to sit here reading "Ask" and
          "Hand it over", `aria-hidden`, `pointerEvents: none`, purely to
          announce a control that appears further down the moment you type. They
          cost about a hundred pixels of a 392px pane to say what the sentence
          above already says, and they read as two broken buttons: the founder's
          "not fully done" was partly them. The fact they carried, that one of
          the two spends credits, is now on the rail's own "Handed to the crew"
          heading, beside the rows that actually do it, and the footer still
          states it at the moment of commitment. */}

      {failed ? (
        // Never silently. A generic suggestion here would be indistinguishable
        // from a grounded one, so the honest move is to say the read broke.
        <div style={{ marginTop: "var(--mrd-s5)" }}>
          <ReadFailedLine onRetry={onRetry}>
            We could not read what is running, so the suggestions below are general ones.
          </ReadFailedLine>
        </div>
      ) : loading ? (
        <div style={{ marginTop: "var(--mrd-s5)" }}>
          <LoadingState label="Reading what is running." />
        </div>
      ) : null}

      {/* The capability lines ride along even when the workspace read failed or
          came back empty: they name nothing, so they cannot be wrong, and a
          person on day one needs them more than anyone. The grounded ones are
          the only thing a failed read costs, which is why the verdict above sits
          over the rail rather than inside it. */}
      <SuggestionRail
        items={offers}
        scopeKind={scopeKind}
        scopeLabel={scopeLabel}
        onPick={onPick}
      />

      {knownEmpty ? (
        <div
          style={{
            marginTop: "var(--mrd-s4)",
            fontSize: "var(--mrd-t-small)",
            color: "var(--mrd-mute)",
          }}
        >
          Nothing has run in this workspace yet.
        </div>
      ) : null}

      {/* THE SENTENCE, AND NOT A SECOND DOOR. This used to carry the only live
          link to the archive in the whole app, which is how the founder came to
          believe the surface did not exist. The door is `Conversations` in the
          header now; this only has to say where the words go, once. */}
      <div
        style={{
          marginTop: "var(--mrd-s6)",
          fontSize: "var(--mrd-t-small)",
          color: "var(--mrd-mute)",
        }}
      >
        Every conversation here is kept. Conversations, above, reopens one or starts a new one.
      </div>
    </>
  );
}
