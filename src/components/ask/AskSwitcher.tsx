/**
 * THE CONVERSATION SWITCHER, inside Ask.
 *
 * Founder ruling, 2026-07-30: *"somewhere in the ask itself we need to have a
 * palette that if you click, we can see all our conversations and start new
 * conversations ... if I'm working about a particular feature and if I have to
 * just go and ask, I'll just click that. It can ask new conversations freshly,
 * and I can go and refer to the same conversations which I had."* Grouping
 * ("projects") was explicitly not asked for and is not built.
 *
 * WHY IT LIVES HERE AND NOT IN THE RAIL. Nobody wakes up wanting to browse
 * conversations. They want the answer they already got, and they want it while
 * they are mid-thought in Ask. `/threads`' own header says exactly who that
 * person is: *"a product lead who remembers the crew already answered this, and
 * needs that answer again ... They are here to re-read one conversation, not to
 * tidy an archive."* That makes the archive ASK'S OWN HISTORY rather than a
 * destination, so the door belongs where you would reach for it.
 *
 * TWO DEPTHS OF ONE IDEA, NEVER TWO DOORS. This is the shallow, fast path: the
 * eight most recent, one click each, no search box, no filters. `/threads` is
 * the deep one, and the only thing down there that is not up here is the part
 * that needs room: server-side search over titles AND message bodies, the day
 * grouping, rename, and the whole transcript. So the link out is the LAST thing
 * in the list rather than a second control competing with it.
 *
 * NO NEW SERVER FUNCTION. `listThreads` already returns exactly this shape,
 * RLS-scoped, ordered by `updated_at`, with the last line and the two states
 * that matter. It is read on the SAME query key `/threads` uses, so one truth
 * has one cache and walking between the two never shows two different answers.
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, type ThreadSummary } from "@/lib/threads.functions";
import { relativeTime } from "@/lib/memory-view";
import { Actions, Button, Empty, Failed, Loading, Row } from "@/components/shell/primitives";
import { AgentMark, YouMark } from "@/components/meridian/marks";

/** How many the shallow path shows. Small on purpose: this is the list you
 *  scan without reading, and the ninth conversation is what search is for. */
const RECENT = 8;

const sectionLabel: React.CSSProperties = {
  fontSize: "var(--sp-text-label)",
  color: "var(--sp-mute)",
  fontWeight: 500,
  marginBottom: "var(--sp-space-2)",
};

export function AskSwitcher({
  answeredBy,
  initials,
  currentId,
  busy,
  onNew,
  onPick,
  onLeave,
}: {
  /** The seat that answers, so a row here wears the same mark the thread does. */
  answeredBy: string;
  initials: string;
  /** The conversation the pane is holding right now, marked as where you are. */
  currentId: string | null;
  /** An answer is streaming: starting over would abandon it mid-sentence. */
  busy: boolean;
  onNew: () => void;
  onPick: (thread: ThreadSummary) => void;
  /** Leaving for the full archive takes the pane with it. */
  onLeave: () => void;
}) {
  const fetchThreads = useServerFn(listThreads);
  const list = useQuery({
    // The SAME key `/threads` uses. One truth, one cache.
    queryKey: ["threads"],
    queryFn: () => fetchThreads(),
    staleTime: 30_000,
  });
  const recent = (list.data?.threads ?? []).slice(0, RECENT);

  return (
    <>
      <Actions>
        {/* NOT "New conversation", which is the obvious label and the wrong one:
            `conversations.title` DEFAULTS to that exact string, so every thread
            nobody renamed is already called that and the button would have worn
            the same words as six rows under it, meaning something else.
            Not `primary` either. The send control in the footer is the one
            primary on this surface, and a second would make neither mean it. */}
        <Button onClick={onNew} disabled={busy}>
          Start fresh
        </Button>
      </Actions>

      <div style={{ marginTop: "var(--sp-space-5)" }}>
        <div style={sectionLabel}>Recent</div>
        {list.isError ? (
          <Failed onRetry={() => void list.refetch()}>
            We could not read your conversations. That is not the same as having none.
          </Failed>
        ) : list.isLoading ? (
          <Loading>Reading your conversations.</Loading>
        ) : recent.length === 0 ? (
          <Empty>Nothing asked yet. The one you are in is the first.</Empty>
        ) : (
          recent.map((t) => (
            <Row
              key={t.id}
              tight
              focused={t.id === currentId}
              marks={
                t.lastRole === "user" ? (
                  <YouMark initials={initials} />
                ) : (
                  // `waiting`, never `gate`: gate BLINKS and only one mark on a
                  // screen may wear it. A list of pending rows blinking at once
                  // spends the whole restraint budget (SYSTEM.md, the crew).
                  <AgentMark slug={answeredBy} state={t.waiting ? "waiting" : "quiet"} />
                )
              }
              lead={t.title}
              // A DIFFERENT fact, never more of the title: the one state that
              // needs you, else the last thing that was said.
              sub={
                t.waiting
                  ? "A line from this waits for your call"
                  : t.inBrain
                    ? "A line from this is in the brain"
                    : t.snippet || undefined
              }
              time={relativeTime(t.updatedAt, Date.now()) || null}
              onClick={() => onPick(t)}
            />
          ))
        )}
      </div>

      <div style={{ marginTop: "var(--sp-space-5)" }}>
        {/* A real anchor, wearing the button's own class, so it looks like the
            rest of the chrome and still middle-clicks like a link. */}
        <Link
          to="/threads"
          onClick={onLeave}
          className="sp-btn"
          data-variant="ghost"
          style={{ textDecoration: "none" }}
        >
          All conversations
        </Link>
      </div>
    </>
  );
}
