/**
 * Threads. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the six answers.
 *
 * 1. WHO IS HERE, AND WHY. One person: a product lead who remembers the crew
 *    already answered this, and needs that answer again. They arrive on a
 *    deep link (`?c=`) or with one sentence half-remembered. They are here to
 *    re-read one conversation, not to tidy an archive.
 *
 * 2. THE ONE THING IT EXISTS FOR. To re-read a conversation with the crew
 *    with WHO SAID WHAT still attached, and to keep the part worth keeping.
 *    Nothing else on this surface earns its place unless it serves that.
 *
 * 3. KEEP / MOVE / KILL, on everything that was here before:
 *    KEEP  the thread in focus, whole, as the main column. It is the job.
 *    KEEP  search. It is the only thing that finds a thread by something said
 *          INSIDE it (searchConversations reads titles AND message content,
 *          server side). Without it the archive is a scroll.
 *    KEEP  the day grouping. It is how people actually remember a
 *          conversation ("it was Tuesday"), it is free from updated_at, and
 *          it costs one muted line per group.
 *    KEEP  rename, copy link, and save-to-the-brain. All three are real
 *          writes and all three are why you came back to a thread.
 *    KILL  RoomChromeShell. The app shell already draws the brand, the
 *          workspace scope, the live line, Ask and the account door. This was
 *          the second shell, and it is the disease the rebuild is treating.
 *    KILL  the 220px left rail (title, subtitle, scope buttons, views,
 *          folders). It was a third level of navigation inside a page that is
 *          reached from navigation.
 *    KILL  the FOLDERS feature entirely: the Folders group, "New folder", the
 *          folder chip on every row, the "Move to folder" select, the Unfiled
 *          view, and the usePrompt dialog behind them. Manual filing is a
 *          librarian's job, nobody arrives here to do it, search already
 *          answers "where is that thread" better, and in an agent-native
 *          product a filing cabinet the human maintains is the anti-thesis.
 *          Five controls served a job nobody came for. GAP REPORTED: the
 *          server functions (listFolders / createFolder / moveThreadToFolder /
 *          listThreadsInFolder) and the conversation_folders migration now
 *          have zero UI consumers.
 *    KILL  the "Waiting on you" and "In the brain" rail views. `waiting` is a
 *          PENDING memory candidate, which is already an item in the
 *          approvals queue and already counted on the rail. A second count of
 *          the same truth is the two-counts disease. The fact survives, as
 *          words, on the row it belongs to.
 *    KILL  the three-chip row under every list row (your call / in the brain /
 *          you / folder). Four chips is four ways of saying what one mark and
 *          one second line say.
 *    KILL  the "Thread" mono eyebrow above the title. The title is the title.
 *    KILL  the message bubbles (raised background, tinted machine background,
 *          borders). Two nested tinted containers per message, thirty times.
 *          Attribution is the mark, not the wallpaper.
 *    KILL  the "Agent" label on every crew message. An unattributed line is a
 *          surface pretending the work did itself; it is the exact defect
 *          FINAL-agent-presence.md R7 exists to end.
 *    KILL  the rename / move / save toasts. See THE COMMIT below.
 *    MOVE  the product scope switch: it becomes ONE line, and it is inverted
 *          (see 4). It stays because nothing else narrows this list, but it
 *          is a boundary, not a navigation region.
 *
 * 4. ONE CLICK AWAY. Every thread other than the one in focus is one row
 *    click. A list row is one line plus a DIFFERENT second fact (the last
 *    thing said, or the one state that needs you), and it never wraps. The
 *    archive shows the twelve most recent and says how many more there are,
 *    because a list that only grows is not designed; search reaches the rest.
 *    The product filter now defaults OFF, so nothing quietly disappears: a
 *    thread with no product_id would have been hidden by the old default.
 *
 * 5. THE MOMENT. Typing half a sentence you remember and having the right
 *    conversation come back, with the crew's name still on the line that
 *    answered you. And the honest one: the copy-link receipt tells you the
 *    link is yours alone (conversations RLS is `auth.uid() = user_id`), so
 *    nobody pastes it to a colleague and watches it 404.
 *    What would confuse: a control that cannot act, and a line signed
 *    "Agent".
 *
 * 6. WHERE THE CREW APPEARS, AND WHAT IT PROVES.
 *    - ATTRIBUTION on every message and every row. Yours carry your disc,
 *      the crew's carry the Chief of Staff's mark and its name. Remove the
 *      agents from this product and this surface loses half its ink.
 *      WHO, precisely: Ask dispatches through the conductor
 *      (`src/routes/api/chat.ts:564` runs the loop as `orchestrator`), so the
 *      seat that answers you here is the Chief of Staff. WHAT WE DO NOT
 *      CLAIM: `messages` stores role and content and no agent column, so
 *      which of the crew did the work behind an answer is not knowable from
 *      this read. The surface names the seat and never guesses the worker,
 *      and the context column says so in one line rather than shrugging.
 *    - WORK IN MOTION. A thread is a record; nothing is in flight here by
 *      definition. Every mark is therefore `quiet`, and ember appears only on
 *      a thread that genuinely has something waiting on your call. Animating
 *      a settled transcript would be the overclaim R12 forbids.
 *    - JUDGMENT LEAVES A TRACE. See THE COMMIT.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10, §9). Keeping a line used to
 * fire a toast and vanish. A toast confirms that your click registered; a
 * receipt renders what your click CAUSED. Keeping the last answer now says
 * what it did, per item: it waits for your call in the brain, and if
 * proposeMemoryCandidate matched an existing memory it says that approving it
 * would retire that one. NO HANDOFF ARROW is drawn, because nothing in the
 * response names an agent that picks it up: you do, in the brain. An arrow to
 * nowhere is worse than no arrow. A failed write still writes a receipt and
 * goes honest immediately. Rename keeps no receipt on purpose, because its
 * consequence is the title changing in front of you; a receipt for a visible
 * change is noise.
 *
 * GAPS REPORTED, not worked around here:
 *  - `/threads` is still in `_authenticated.tsx`'s `isReimaginedSurface`
 *    list, so AppFrame does not wrap it yet. That entry must come off in the
 *    same pass that lands this file, or this surface renders with no chrome.
 *  - No primitive draws a transcript line (top-aligned mark, wrapping prose
 *    body). `Row` centres its mark slot and styles its second line as
 *    metadata, so a long message would hang a mark in mid-air. `Said` below
 *    is local and token-only; it wants to be a primitive.
 *  - Your initials are derived here the same way AppFrame derives them. That
 *    belongs on a shared hook.
 *  - `searchConversations` returns `lastRole: null` and `waiting: false`, so
 *    search results cannot show who spoke last. It is a read-shape gap, not a
 *    rendering one.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Num } from "@/components/meridian/surface-parts";
import { invalidateShellReads } from "@/lib/query-keys";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentBlurb, agentDisplayName } from "@/lib/agent-vocabulary";
import {
  listThreads,
  getThread,
  searchConversations,
  type ThreadSummary,
} from "@/lib/threads.functions";
import { renameConversation } from "@/lib/conversations.functions";
import { proposeMemoryCandidate } from "@/lib/memory-candidates.functions";
import { openAskConversation } from "@/lib/ask-open";
import { Answer } from "@/components/ask/Answer";
import { Actions, Block, Button, Empty, Failed, Input, Line, Loading, PageHead, Receipt, Row, Surface, Switch, Who } from "@/components/shell/primitives";
import { AgentMark, YouMark } from "@/components/meridian/marks";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/_authenticated/threads")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: ThreadsSurface,
  head: () => ({ meta: [{ title: "Threads · Supaprod" }] }),
});

/** The seat that answers you here. `api/chat.ts` dispatches the loop as
 *  `orchestrator`, so this is a wiring fact, not a flattering label. Which of
 *  the crew worked behind an answer is NOT stored on a message, and this
 *  surface never guesses it. */
const ANSWERED_BY = "orchestrator";

/** The archive shows this many and says how many more. A list that only grows
 *  is not designed; search reaches the rest. */
const SHOWN = 12;

function dayLabel(iso: string | null): string {
  if (!iso) return "Earlier";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - 86400000) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function clock(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** Plain words, never a fake precision. */
function since(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function initialsFrom(email: string | null, name: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** One line of a transcript: the mark, the name, what was said, when.
 *
 *  Local, and the gap is reported in the header: `Row` centres its mark slot
 *  and renders its second line as metadata, so a paragraph would hang the
 *  mark in mid-air and print the message in label grey. Every value here is a
 *  token; nothing carries a literal colour. `overflowWrap` is load bearing:
 *  a pasted URL or a code fragment must break inside this column rather than
 *  push the page sideways, which was named twice as a pain point. It is an
 *  inherited property, so it still governs inside the parsed blocks `Answer`
 *  renders.
 *
 *  `plain` HOLDS THE NEWLINES OF A RAW STRING, and it is off for anything that
 *  arrives already laid out in blocks. A person's own message is characters
 *  they typed, so its line breaks are theirs and `pre-wrap` is the only thing
 *  keeping them; parsed Markdown carries its breaks as real elements, and
 *  leaving `pre-wrap` on top of those doubles every gap (the same reason
 *  `.sp-prose[data-markdown="true"]` turns it off in primitives.css).
 *
 *  The body slot is a DIV, not a SPAN, because `Answer` renders one and a
 *  `<div>` inside a `<span>` is invalid markup that React refuses to hydrate.
 *  primitives.tsx carries the same fix on `Empty`, found the same way. */
function Said({
  mark,
  who,
  at,
  plain = false,
  children,
}: {
  mark: ReactNode;
  who: string;
  at: string | null;
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 13,
        alignItems: "flex-start",
        padding: "var(--sp-space-4) 0",
        borderTop: "1px solid var(--sp-line-soft)",
      }}
    >
      <span style={{ flex: "none", width: 34, display: "flex", paddingTop: 1 }}>{mark}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "var(--sp-text-body)" }}>
          <Who>{who}</Who>
        </span>
        <div
          style={{
            marginTop: "var(--sp-space-1)",
            whiteSpace: plain ? "pre-wrap" : undefined,
            overflowWrap: "anywhere",
            fontSize: "var(--sp-text-prose)",
            lineHeight: "var(--sp-leading-body)",
            color: "var(--sp-body)",
          }}
        >
          {children}
        </div>
      </div>
      {at ? (
        <span style={{ flex: "none", fontSize: "var(--sp-text-data)", color: "var(--sp-mute)" }}>
          <Num>{at}</Num>
        </span>
      ) : null}
    </div>
  );
}

type Note = { key: string; verb: string; consequence: string; at: string; failed?: boolean };

function ThreadsSurface() {
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeProductId, activeProduct, activeWorkspaceId } = useWorkspace();

  const fetchThreads = useServerFn(listThreads);
  const fetchThread = useServerFn(getThread);
  const runSearch = useServerFn(searchConversations);
  const mRename = useServerFn(renameConversation);
  const mKeep = useServerFn(proposeMemoryCandidate);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [thisProductOnly, setThisProductOnly] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [initials, setInitials] = useState("?");
  // THE COMMIT (agents/FINAL-agent-presence.md R10). What you did here does
  // not evaporate into a toast; it stays on the surface for the session. The
  // durable record is the brain's own queue, so this never duplicates it.
  const [notes, setNotes] = useState<Note[]>([]);

  const stamp = () =>
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const note = (n: Omit<Note, "key" | "at">) =>
    setNotes((prev) => [{ ...n, key: `${Date.now()}-${prev.length}`, at: stamp() }, ...prev]);

  useEffect(() => {
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

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const list = useQuery({ queryKey: ["threads"], queryFn: () => fetchThreads() });
  const searching = debounced.length > 0;
  const found = useQuery({
    queryKey: ["threads-search", debounced],
    queryFn: () => runSearch({ data: { q: debounced } }),
    enabled: searching,
  });

  const threads = useMemo(() => list.data?.threads ?? [], [list.data]);
  const searchHits = useMemo(() => found.data?.threads ?? [], [found.data]);
  const visible = useMemo(() => {
    const pool = searching ? searchHits : threads;
    return thisProductOnly && activeProductId
      ? pool.filter((t) => t.productId === activeProductId)
      : pool;
  }, [searching, searchHits, threads, thisProductOnly, activeProductId]);

  // The URL is the selection, so a thread stays a shareable deep link and the
  // back button walks conversations rather than component state.
  const selectedId = c ?? visible[0]?.id ?? threads[0]?.id ?? null;

  const thread = useQuery({
    queryKey: ["thread", selectedId],
    queryFn: () => fetchThread({ data: { id: selectedId as string } }),
    enabled: !!selectedId,
  });

  const messages = thread.data?.messages ?? [];
  const title = thread.data?.title ?? "";
  const lastAt = messages.length ? messages[messages.length - 1].createdAt : null;
  const lastAnswer = [...messages].reverse().find((m) => m.role !== "user");
  const keepText = (lastAnswer?.content ?? "").trim().slice(0, 2000);
  const canKeep = keepText.length >= 3;

  const groups = useMemo(() => {
    const out: { label: string; items: ThreadSummary[] }[] = [];
    for (const t of visible.slice(0, SHOWN)) {
      const label = dayLabel(t.updatedAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(t);
      else out.push({ label, items: [t] });
    }
    return out;
  }, [visible]);

  const keep = useMutation({
    mutationFn: () =>
      mKeep({
        data: {
          content: keepText,
          sourceKind: "user" as const,
          sourceConversationId: selectedId ?? undefined,
        },
      }),
    onSuccess: (res) =>
      note({
        verb: "You kept the last answer",
        // Real, per-item, and never a generic confirmation: the response tells
        // us whether approving it would retire something already in the brain.
        consequence: res.supersedesMemoryId
          ? "It waits for your call in the brain, and taking it would retire something already there."
          : "It waits for your call in the brain. Take it there and the crew reads it before it acts.",
      }),
    // A failed write still writes a receipt, and the receipt goes honest
    // immediately. Never a success shape over a failed write.
    onError: (e: Error) => note({ verb: "Nothing was kept", consequence: e.message, failed: true }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["threads"] });
      // A pending candidate is a call waiting on you, and the rail counts it.
      invalidateShellReads(qc);
    },
  });

  const rename = useMutation({
    mutationFn: (next: string) => mRename({ data: { id: selectedId as string, title: next } }),
    onSuccess: () => {
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ["threads"] });
      void qc.invalidateQueries({ queryKey: ["thread", selectedId] });
    },
    onError: (e: Error) =>
      note({ verb: "The name did not change", consequence: e.message, failed: true }),
  });

  async function copyLink() {
    if (!selectedId) return;
    const url = `${window.location.origin}/threads?c=${selectedId}`;
    try {
      await navigator.clipboard.writeText(url);
      note({
        verb: "You copied the link",
        // Honest about the wiring: conversations are scoped `auth.uid() =
        // user_id`, so this is a bookmark, not a share. Saying otherwise
        // would send someone's colleague to an empty page.
        consequence: "It opens this thread for you. A thread is private to your account.",
      });
    } catch {
      note({
        verb: "The link was not copied",
        consequence: "Your browser blocked the clipboard. The address bar carries the same link.",
        failed: true,
      });
    }
  }

  const open = (id: string) => void navigate({ to: "/threads", search: { c: id }, replace: true });

  /** Hand this conversation back to Ask, where it can be continued.
   *
   *  The thread's OWN product decides the bucket, not whichever product happens
   *  to be selected: filing a workspace thread under the active product would
   *  quietly move it. A thread reached by deep link that is not in this list
   *  falls back to the workspace bucket, which still opens the right
   *  conversation because the pane is keyed on its id. */
  function reopenInAsk() {
    if (!selectedId) return;
    const known = [...threads, ...searchHits].find((t) => t.id === selectedId);
    openAskConversation({
      conversationId: selectedId,
      productId: known?.productId ?? null,
      workspaceId: activeWorkspaceId,
    });
  }

  const headline = thread.isLoading
    ? "Reading the thread."
    : selectedId
      ? title || "Untitled thread"
      : list.isLoading
        ? "Reading your threads."
        : "Nothing asked yet.";

  const sub = selectedId ? (
    messages.length > 0 ? (
      <>
        <Num>{messages.length}</Num> {messages.length === 1 ? "message" : "messages"}
        {since(lastAt) ? <> · last {since(lastAt)}</> : null}
      </>
    ) : undefined
  ) : (
    // CMD K, BECAUSE CMD J OPENS NOTHING. Ask owned Cmd+J and the palette owned
    // Cmd+K until 2026-07-30, when the two collapsed into one key on Ask;
    // ask-context.tsx removed Cmd+J rather than keeping it as an alias, and
    // says why. This line kept teaching the dead key, which is the worst kind
    // of wrong copy: it reads as a broken product to anyone who tries it.
    "Ask is top right, or Cmd K. Every conversation it has lands here, saved."
  );

  return (
    <Surface
      context={
        <>
          <div className="sp-ctx-head">Who you are talking to</div>
          <div className="sp-ctx-row">
            <AgentMark slug={ANSWERED_BY} state="quiet" />
            <span>
              <span className="sp-ctx-name">{agentDisplayName(ANSWERED_BY)}</span>
              <span className="sp-ctx-sub">{agentBlurb(ANSWERED_BY)}</span>
            </span>
          </div>
          <div className="sp-ctx-body">
            Ask goes here first. It answers, or it starts a run and the crew works it. Which of the
            crew wrote a line is not kept on the message, so nothing here guesses.
          </div>

          <div className="sp-ctx-head">Find a thread</div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Anything that was said"
            aria-label="Search your threads"
          />
          {activeProductId ? (
            <Line label="This product only" sub={activeProduct?.name ?? undefined}>
              <Switch
                checked={thisProductOnly}
                onChange={setThisProductOnly}
                label="Show only threads in this product"
              />
            </Line>
          ) : null}

          {list.isError ? (
            <Failed onRetry={() => void list.refetch()}>Your threads did not load.</Failed>
          ) : searching && found.isError ? (
            <Failed onRetry={() => void found.refetch()}>The search did not run.</Failed>
          ) : list.isLoading || (searching && found.isLoading) ? null : visible.length === 0 ? (
            <Empty>
              {searching ? "Nothing said matches that." : "No threads in this product yet."}
            </Empty>
          ) : (
            <>
              {groups.map((g) => (
                <div key={g.label} style={{ marginTop: "var(--sp-space-5)" }}>
                  <div className="sp-ctx-head">{g.label}</div>
                  {g.items.map((t) => (
                    <Row
                      key={t.id}
                      tight
                      focused={t.id === selectedId}
                      marks={
                        t.lastRole === "user" ? (
                          <YouMark initials={initials} />
                        ) : (
                          // Ember only when this thread genuinely holds
                          // something waiting on your call.
                          <AgentMark slug={ANSWERED_BY} state={t.waiting ? "gate" : "quiet"} />
                        )
                      }
                      lead={t.title}
                      // A DIFFERENT fact, not more of the title: the one state
                      // that needs you, else what was last said.
                      sub={
                        t.waiting
                          ? "A line from this waits for your call"
                          : t.inBrain
                            ? "A line from this is in the brain"
                            : t.snippet || undefined
                      }
                      time={clock(t.updatedAt)}
                      onClick={() => open(t.id)}
                    />
                  ))}
                </div>
              ))}
              {!searching && visible.length > SHOWN ? (
                <Empty>
                  <Num>{visible.length - SHOWN}</Num> more above. Search finds a thread by anything
                  said inside it.
                </Empty>
              ) : null}
            </>
          )}
        </>
      }
    >
      <PageHead
        title={
          editing ? (
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) rename.mutate(draft.trim());
                if (e.key === "Escape") setEditing(false);
              }}
              aria-label="Thread name"
              style={{
                font: "inherit",
                height: "auto",
                padding: "2px 10px",
              }}
            />
          ) : (
            headline
          )
        }
        sub={editing ? "Enter saves it. Escape leaves it alone." : sub}
      />

      {selectedId && !thread.isError ? (
        <Actions>
          {editing ? (
            <>
              <Button
                variant="primary"
                disabled={!draft.trim() || rename.isPending}
                onClick={() => rename.mutate(draft.trim())}
              >
                Save the name
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {/* THE WAY BACK INTO ASK, and the reason it is the primary here.
                  Ask and Threads are ONE OBJECT AT TWO MOMENTS: Ask is the
                  conversation happening, this is the same conversation
                  remembered. Both read `conversations`. Without this control the
                  second half of that claim is a description of the schema rather
                  than something a person can do, so re-reading and continuing
                  become one motion and this is the forward action on the
                  surface. "Keep the last answer" steps down to default: one
                  primary per screen, and keeping is the side errand. */}
              <Button variant="primary" onClick={reopenInAsk}>
                Continue in Ask
              </Button>
              {/* Rendered only when there IS a crew answer to keep. A control
                  that cannot act teaches people the controls are decorative. */}
              {canKeep ? (
                <Button disabled={keep.isPending} onClick={() => keep.mutate()}>
                  Keep the last answer
                </Button>
              ) : null}
              <Button onClick={() => void copyLink()}>Copy link</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(title);
                  setEditing(true);
                }}
              >
                Rename
              </Button>
            </>
          )}
        </Actions>
      ) : null}

      {notes.length > 0 ? (
        <Block title="What you did here">
          {notes.map((n) => (
            <Receipt
              key={n.key}
              initials={initials}
              verb={n.verb}
              consequence={n.consequence}
              time={n.at}
              failed={n.failed}
            />
          ))}
        </Block>
      ) : null}

      {/* Three states, three primitives, on both reads (2026-08-10).
          Both branches used `isLoading ? null`, so a cold load rendered
          nothing and then announced that nothing had ever been asked. A read
          in flight was indistinguishable from an empty workspace, which is the
          one confusion Empty, Failed and Loading exist to prevent.
          The list read also had no error arm at all, while the thread read two
          lines below it did. Same page, same shape of failure, one of them
          silent: a failed list would also have claimed the workspace was
          empty. */}
      {!selectedId ? (
        list.isLoading ? (
          <Loading>Reading what has been asked.</Loading>
        ) : list.isError ? (
          <Failed onRetry={() => void list.refetch()}>The thread list did not load.</Failed>
        ) : (
          <Empty>Nothing has been asked in this workspace yet.</Empty>
        )
      ) : thread.isError ? (
        <Failed onRetry={() => void thread.refetch()}>This thread did not open.</Failed>
      ) : thread.isLoading ? (
        <Loading>Opening the thread.</Loading>
      ) : messages.length === 0 ? (
        <Empty>This thread has no messages yet.</Empty>
      ) : (
        <Block title="What was said">
          {messages.map((m, i) => {
            const isYou = m.role === "user";
            const text = typeof m.content === "string" ? m.content : "";
            return (
              <Said
                key={m.id ?? i}
                mark={
                  isYou ? (
                    <YouMark initials={initials} />
                  ) : (
                    <AgentMark slug={ANSWERED_BY} state="quiet" />
                  )
                }
                who={isYou ? "You" : agentDisplayName(ANSWERED_BY)}
                at={clock(m.createdAt)}
                plain={isYou}
              >
                {/* THE CREW'S WORDS GO THROUGH THE ONE RENDERER, and this
                    surface was the second place they did not.
                    `Answer` (src/components/ask/Answer.tsx) exists because the
                    founder read `### Workspace Status` and `**finalizing**`
                    printed literally on 2026-07-30, and its header says the fix
                    is at the boundary rather than at the call site: anything
                    that shows what the crew said comes through it. This file
                    read the SAME `messages` rows into a `pre-wrap` span, so
                    every hash and asterisk in the archive printed raw. Ask and
                    Threads are one object at two moments, and until now they
                    disagreed about what a message looks like.

                    YOUR OWN MESSAGES STAY PLAIN, on purpose. `Answer` is the
                    renderer of ASSISTANT prose: the model is instructed to
                    write Markdown (api/chat.ts), so its syntax is meant to be
                    read as syntax. Nobody instructed the person typing. Their
                    `*` is an asterisk they wanted, a line starting `#` is not a
                    heading, and their newlines are the only structure they
                    have. Parsing their text would rewrite what they said, which
                    is a worse defect than the one being fixed. */}
                {isYou ? text : <Answer>{text}</Answer>}
              </Said>
            );
          })}
        </Block>
      )}
    </Surface>
  );
}
