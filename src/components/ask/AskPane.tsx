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
 *          nav surface. Cmd+K still opens the palette and still has them.
 *    KILL  the answer toolbar of chips. Two actions survive as words.
 *
 * 4. ONE CLICK AWAY. Everything before this conversation: `/threads`, named in
 *    the footer of the pane rather than duplicated as a list inside it.
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
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAskStream } from "@/hooks/use-ask-stream";
import { useAsk, chipLabel } from "@/lib/ask-context";
import { defaultIntent, contentForIntent, type AskIntent } from "@/lib/ask-intent";
import { openingGates, policyProposal } from "@/lib/ask-actions";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  AgentMark,
  Actions,
  Button,
  Choices,
  Empty,
  Failed,
  Loading,
  Textarea,
} from "@/components/shell/primitives";
import { AskGateCard } from "./AskGateCard";
import { AskTurn, toTurns } from "./AskTurn";

/** The seat that answers. `api/chat.ts` runs the loop as `orchestrator`, so
 *  this is a wiring fact, not a flattering label. */
const ANSWERED_BY = "orchestrator";

function initialsFrom(email: string | null, name: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  const { activeWorkspace } = useWorkspace();
  const [initials, setInitials] = React.useState("?");
  const [draft, setDraft] = React.useState("");
  const [intentOverride, setIntentOverride] = React.useState<AskIntent | null>(null);
  const [shown, setShown] = React.useState(false);
  // The Textarea primitive takes no ref, so the wrapper owns it. Cheaper than
  // forking the primitive for one focus call.
  const boxWrap = React.useRef<HTMLDivElement | null>(null);
  const focusBox = React.useCallback(() => {
    boxWrap.current?.querySelector("textarea")?.focus();
  }, []);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);

  const resume = ask.resume;
  const stream = useAskStream({
    enabled: true,
    scope: ask.scope,
    productId: resume ? resume.productId : undefined,
    onDictation: (text) => setDraft((d) => (d ? `${d} ${text}` : text)),
  });

  const fetchQueue = useServerFn(getApprovalsQueue);
  const queue = useQuery({
    // The SAME key the shell's rail count uses, so one truth has one cache and
    // settling a gate here updates the badge without a second read.
    queryKey: ["shell", "approvals", activeWorkspace?.id ?? null],
    queryFn: () => fetchQueue({ data: { workspaceId: activeWorkspace?.id ?? undefined } }),
    staleTime: 30_000,
  });
  const items = queue.data?.items ?? [];

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
      if (opener && document.body.contains(opener)) opener.focus();
    };
  }, [focusBox]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ask.close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  function send() {
    const text = draft.trim();
    if (!text || stream.streaming) return;
    stream.sendIntent(contentForIntent(text, intent));
    setDraft("");
    setIntentOverride(null);
  }

  const openingItems = openingGates(items, ask.scope?.sourceId ?? null);
  const openingPolicy = policyProposal(openingItems);

  return (
    <aside
      // COMPLEMENTARY, not a dialog. It sits beside the work rather than over
      // it, which is the only reason a pane exists in this system at all.
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
        background: "var(--sp-float)",
        borderRadius: "var(--sp-radius-pane)",
        boxShadow: "var(--sp-shadow)",
        transform: shown ? "none" : "translateX(calc(100% + 30px))",
        transition: "transform var(--sp-dur-slow, 300ms) var(--sp-ease)",
      }}
    >
      <header
        style={{
          height: 52,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--sp-space-2)",
          padding: "0 var(--sp-space-4)",
          // Longhand: a shorthand carrying a custom property is parsed
          // inconsistently outside a real browser, and this rule is load bearing.
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: "var(--sp-line-soft)",
        }}
      >
        <span
          style={{ display: "flex", alignItems: "center", gap: "var(--sp-space-2)", minWidth: 0 }}
        >
          <AgentMark slug={ANSWERED_BY} state={stream.streaming ? "running" : "quiet"} />
          <span style={{ fontSize: "var(--sp-text-body)", fontWeight: 600 }}>Ask</span>
          {/* THE SCOPE CHIP. It names the thing you are looking at, and it
              changes with the surface, or it is decoration. */}
          <span
            title="What this conversation is scoped to"
            style={{
              fontSize: "var(--sp-text-label)",
              color: "var(--sp-mute)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {scopeLabel}
          </span>
        </span>
        <Button variant="ghost" aria-label="Close Ask" onClick={ask.close}>
          Close
        </Button>
      </header>

      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "var(--sp-space-4)" }}>
        {stream.messages.length === 0 ? (
          <Opening
            scopeLabel={scopeLabel}
            gates={openingItems}
            policyId={openingPolicy?.id ?? null}
            initials={initials}
            queueFailed={queue.isError}
            queueLoading={queue.isLoading}
            onRetryQueue={() => void queue.refetch()}
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
              queue={items}
              initials={initials}
              onRetry={stream.retry}
            />
          ))
        )}
      </div>

      <footer
        style={{
          flex: "none",
          padding: "var(--sp-space-3) var(--sp-space-4) var(--sp-space-4)",
          borderTopWidth: 1,
          borderTopStyle: "solid",
          borderTopColor: "var(--sp-line-soft)",
        }}
      >
        {draft.trim() ? (
          // THE FORK, VISIBLE BEFORE YOU COMMIT. One box used to do two very
          // different things and only the server knew which. Now the person
          // does, and can flip it.
          <div style={{ marginBottom: "var(--sp-space-2)" }}>
            <Choices
              label="What should happen when you send this"
              value={intent}
              onPick={(id) => setIntentOverride(id)}
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--sp-space-3)",
            marginTop: "var(--sp-space-2)",
          }}
        >
          <span style={{ fontSize: "var(--sp-text-data)", color: "var(--sp-mute)", minWidth: 0 }}>
            {stream.streaming ? (
              "Answering. Escape leaves it running."
            ) : draft.trim() && intent === "instruction" ? (
              "This starts a run and spends credits."
            ) : stream.messages.length > 0 ? (
              <Link to="/threads" onClick={ask.close} style={{ color: "inherit" }}>
                Kept in Threads
              </Link>
            ) : (
              "Enter sends. Shift and Enter for a new line."
            )}
          </span>
          <Button
            variant="primary"
            disabled={!draft.trim() || stream.streaming}
            onClick={send}
            shortcut="Enter"
          >
            {intent === "instruction" ? "Hand it over" : "Ask"}
          </Button>
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
 * What it says instead is true and useful at exactly this moment:
 *  - what this conversation is scoped to, so the chip is explained the first
 *    time and never again,
 *  - what is genuinely waiting on you IN THAT SCOPE, settleable right here.
 *    On day one that list is usually empty and it says so plainly,
 *  - three questions that fit this scope, as a way in rather than as filler,
 *  - where the conversation goes afterwards, because "is this a chat window or
 *    is this Threads" was the founder's actual question.
 *
 * A returning user rarely sees this at all: the pane opens holding the running
 * conversation for this scope, hydrated from the same table Threads reads.
 */
function Opening({
  scopeLabel,
  gates,
  policyId,
  initials,
  queueFailed,
  queueLoading,
  onRetryQueue,
  onPick,
}: {
  scopeLabel: string;
  gates: ReturnType<typeof openingGates>;
  policyId: string | null;
  initials: string;
  queueFailed: boolean;
  queueLoading: boolean;
  onRetryQueue: () => void;
  onPick: (q: string) => void;
}) {
  const starters = [
    `What changed in ${scopeLabel}?`,
    "What is waiting on me?",
    "Why did we decide this?",
  ];

  return (
    <>
      <div
        style={{
          fontSize: "var(--sp-text-prose)",
          color: "var(--sp-body)",
          lineHeight: "var(--sp-leading-body)",
        }}
      >
        Ask about <b style={{ color: "var(--sp-ink)" }}>{scopeLabel}</b>. The crew answers from this
        workspace's own record, and cites what it read.
      </div>

      <div style={{ marginTop: "var(--sp-space-5)" }}>
        <div
          style={{
            fontSize: "var(--sp-text-label)",
            color: "var(--sp-mute)",
            fontWeight: 500,
            marginBottom: "var(--sp-space-2)",
          }}
        >
          Waiting on you
        </div>
        {queueFailed ? (
          <Failed onRetry={onRetryQueue}>
            We could not read what is waiting. That is not the same as nothing waiting.
          </Failed>
        ) : queueLoading ? (
          <Loading>Reading what is waiting.</Loading>
        ) : gates.length === 0 ? (
          <Empty>Nothing needs your call here. The crew is not blocked.</Empty>
        ) : (
          gates.map((g) => (
            <AskGateCard key={g.id} item={g} initials={initials} asPolicy={g.id === policyId} />
          ))
        )}
      </div>

      <div style={{ marginTop: "var(--sp-space-6)" }}>
        <div
          style={{
            fontSize: "var(--sp-text-label)",
            color: "var(--sp-mute)",
            fontWeight: 500,
            marginBottom: "var(--sp-space-2)",
          }}
        >
          A way in
        </div>
        <Actions>
          {starters.map((s) => (
            <Button key={s} variant="ghost" onClick={() => onPick(s)}>
              {s}
            </Button>
          ))}
        </Actions>
      </div>

      <div
        style={{
          marginTop: "var(--sp-space-6)",
          fontSize: "var(--sp-text-data)",
          color: "var(--sp-mute)",
        }}
      >
        Every conversation here is kept.{" "}
        <Link to="/threads" style={{ color: "inherit", textDecoration: "underline" }}>
          Threads
        </Link>{" "}
        has every one of them, searchable by anything that was said.
      </div>
    </>
  );
}
