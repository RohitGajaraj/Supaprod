// ThreadsSurface (front-end reimagining Phase 4; founder-approved, "Threads").
// The revisitable home for every conversation. Two panes: the day-grouped list
// (with search) and the read view of the selected thread (rename + copy link).
//
// Honest to the backend today (gaps K1-K5 are the migration follow-ups):
// - list + read + rename + deep link are live (conversations domain).
// - folders, cross-scope views, full-text search, and "Save to the brain" are
//   NOT shown, because they are not wired yet. Search here filters the loaded
//   list (a filter, never a second composer, per charter #3).
// Plain ink surfaces, chip attribution, mono timestamps, no cost, no edge strips.

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listThreads, getThread, type ThreadSummary, type ThreadMessage } from "@/lib/threads.functions";
import { renameConversation } from "@/lib/conversations.functions";
import { proposeMemoryCandidate } from "@/lib/memory-candidates.functions";

function dayLabel(iso: string | null): string {
  if (!iso) return "Earlier";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - 86400000) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function clockTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

type Msg = ThreadMessage;

function ThreadRow({
  thread,
  selected,
  onSelect,
}: {
  thread: ThreadSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className="ink-focus flex w-full flex-col gap-1 rounded-[10px] border px-3 py-2.5 text-left transition-colors"
      style={{
        borderColor: selected ? "var(--ink-hairline)" : "transparent",
        background: selected ? "var(--ink-raised)" : "transparent",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" style={{ color: "var(--ink-text)" }}>
          {thread.title}
        </span>
        <span className="flex-none font-mono text-[10px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
          {clockTime(thread.updatedAt)}
        </span>
      </div>
      {thread.snippet ? (
        <span className="line-clamp-1 text-[12px]" style={{ color: "var(--ink-subtle)" }}>
          {thread.snippet}
        </span>
      ) : null}
    </button>
  );
}

function ThreadPreview({ threadId }: { threadId: string | null }) {
  const fetchThread = useServerFn(getThread);
  const rename = useServerFn(renameConversation);
  const propose = useServerFn(proposeMemoryCandidate);
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const q = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThread({ data: { id: threadId as string } }),
    enabled: !!threadId,
  });

  const messages = (q.data?.messages ?? []) as ThreadMessage[];
  const title = q.data?.title ?? "Thread";

  const renameMutation = useMutation({
    mutationFn: (next: string) => rename({ data: { id: threadId as string, title: next } }),
    onSuccess: () => {
      setEditing(false);
      void qc.invalidateQueries({ queryKey: ["threads"] });
      void qc.invalidateQueries({ queryKey: ["thread", threadId] });
      toast.success("Thread renamed.");
    },
    onError: () => toast.error("Could not rename the thread."),
  });

  // Save to the brain: propose this thread's key line as a memory candidate.
  // Honest about the gate: it lands in Brain's review queue, pending, not
  // straight into memory. No migration (memory_candidates already exists).
  const saveToBrain = useMutation({
    mutationFn: () => {
      const lastAgent = [...messages].reverse().find((m) => m.role !== "user");
      const content = (lastAgent?.content ?? title).trim().slice(0, 1000);
      return propose({ data: { content, sourceKind: "user" } });
    },
    onSuccess: () => toast.success("Proposed to the brain. It waits in Brain's review queue."),
    onError: () => toast.error("Could not propose this to the brain."),
  });

  if (!threadId) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-center">
        <p className="max-w-[320px] text-[13px]" style={{ color: "var(--ink-subtle)" }}>
          Pick a thread to read it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className="flex min-h-[52px] flex-none items-center gap-2 border-b px-5"
        style={{ borderColor: "var(--ink-hairline)" }}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--ink-subtle)" }}>
          Thread
        </span>
        {editing ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draftTitle.trim()) renameMutation.mutate(draftTitle.trim());
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={() => setEditing(false)}
            className="ink-focus min-w-0 flex-1 rounded-md border bg-transparent px-2 py-1 text-[14px] font-semibold"
            style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-text)" }}
          />
        ) : (
          <h1 className="min-w-0 flex-1 truncate text-[14px] font-semibold" style={{ color: "var(--ink-text)" }}>
            {title}
          </h1>
        )}
        <button
          type="button"
          title="Rename"
          onClick={() => {
            setDraftTitle(title);
            setEditing(true);
          }}
          className="ink-focus flex-none rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--ink-raised)]"
          style={{ color: "var(--ink-subtle)" }}
        >
          Rename
        </button>
        <button
          type="button"
          title="Copy link"
          onClick={() => {
            const url = `${window.location.origin}/threads?c=${threadId}`;
            void navigator.clipboard?.writeText(url);
            toast.success("Link copied.");
          }}
          className="ink-focus flex-none rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--ink-raised)]"
          style={{ color: "var(--ink-subtle)" }}
        >
          Copy link
        </button>
        <button
          type="button"
          title="Save to the brain"
          disabled={saveToBrain.isPending || messages.length === 0}
          onClick={() => saveToBrain.mutate()}
          className="ink-focus flex-none rounded-md px-2 py-1 text-[12px] transition-colors hover:bg-[var(--ink-raised)] disabled:opacity-40"
          style={{ color: "var(--voice-memory-dim)" }}
        >
          {saveToBrain.isPending ? "Saving…" : "Save to the brain"}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {q.isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="ink-skeleton h-16 w-full rounded-xl" />
            <div className="ink-skeleton h-16 w-3/4 rounded-xl" />
          </div>
        ) : q.isError ? (
          <p className="text-[13px]" style={{ color: "var(--ink-body)" }}>
            Could not open this thread.
          </p>
        ) : messages.length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--ink-subtle)" }}>
            This thread has no messages yet.
          </p>
        ) : (
          <div className="mx-auto flex max-w-[680px] flex-col gap-3">
            {messages.map((m, i) => {
              const isYou = m.role === "user";
              return (
                <div
                  key={m.id ?? i}
                  className="rounded-[10px] px-3 py-2.5"
                  style={{
                    background: isYou ? "var(--ink-raised)" : "var(--voice-machine-faint)",
                    border: isYou ? "1px solid var(--ink-hairline-soft)" : "1px solid transparent",
                  }}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className="font-mono text-[9.5px] uppercase tracking-[0.08em]"
                      style={{ color: isYou ? "var(--ink-subtle)" : "var(--voice-machine-dim)" }}
                    >
                      {isYou ? "You" : "Agent"}
                    </span>
                    <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
                      {clockTime(m.createdAt ?? null)}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-[12.5px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
                    {typeof m.content === "string" ? m.content : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ThreadsSurface({
  initialThreadId,
  onSelectThread,
}: {
  initialThreadId?: string | null;
  onSelectThread?: (id: string) => void;
}) {
  const fetchThreads = useServerFn(listThreads);
  const q = useQuery({ queryKey: ["threads"], queryFn: () => fetchThreads() });
  const threads = useMemo(() => q.data?.threads ?? [], [q.data]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(initialThreadId ?? null);
  const [view, setView] = useState<"all" | "today" | "week">("all");

  // Default the selection to the newest thread once loaded.
  useEffect(() => {
    if (!selected && threads.length > 0) setSelected(threads[0].id);
  }, [threads, selected]);

  // View counts (computed client-side from the loaded threads, honest).
  const counts = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const weekMs = Date.now() - 7 * 86400000;
    const ts = (t: ThreadSummary) => (t.updatedAt ? new Date(t.updatedAt).getTime() : 0);
    return {
      all: threads.length,
      today: threads.filter((t) => ts(t) >= todayMs).length,
      week: threads.filter((t) => ts(t) >= weekMs).length,
    };
  }, [threads]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const weekMs = Date.now() - 7 * 86400000;
    return threads.filter((t) => {
      const ts = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
      if (view === "today" && ts < todayMs) return false;
      if (view === "week" && ts < weekMs) return false;
      if (needle) {
        return t.title.toLowerCase().includes(needle) || t.snippet.toLowerCase().includes(needle);
      }
      return true;
    });
  }, [threads, query, view]);

  const groups = useMemo(() => {
    const out: { label: string; items: ThreadSummary[] }[] = [];
    for (const t of filtered) {
      const label = dayLabel(t.updatedAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(t);
      else out.push({ label, items: [t] });
    }
    return out;
  }, [filtered]);

  const select = (id: string) => {
    setSelected(id);
    onSelectThread?.(id);
  };

  return (
    <div className="flex min-h-dvh" style={{ background: "var(--ink-bg)", color: "var(--ink-body)" }}>
      {/* Rail: scope + views (the third pane, screen-9 baseline). Folders and
          cross-scope + save-to-brain views arrive with their migration. */}
      <aside
        className="hidden w-[220px] flex-none flex-col gap-5 border-r px-3 py-6 md:flex"
        style={{ borderColor: "var(--ink-hairline)", background: "var(--ink-bg)" }}
      >
        <div>
          <h1 className="px-2 text-[16px] font-medium" style={{ color: "var(--ink-text)" }}>
            Threads
          </h1>
          <p className="mt-0.5 px-2 text-[11.5px]" style={{ color: "var(--ink-subtle)" }}>
            Everything asked and answered.
          </p>
        </div>
        <div>
          <div className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--ink-faint)" }}>
            Views
          </div>
          {([
            { id: "all", label: "All threads", n: counts.all },
            { id: "today", label: "Today", n: counts.today },
            { id: "week", label: "This week", n: counts.week },
          ] as const).map((v) => {
            const on = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-current={on ? "true" : undefined}
                className="ink-focus flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[var(--ink-raised)]"
                style={{ background: on ? "var(--ink-raised)" : "transparent", color: on ? "var(--ink-text)" : "var(--ink-body)" }}
              >
                <span className="min-w-0 flex-1 truncate">{v.label}</span>
                <span className="flex-none font-mono text-[10.5px] tabular-nums" style={{ color: "var(--ink-faint)" }}>
                  {v.n}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section
        className="flex w-full max-w-[400px] flex-none flex-col border-r"
        style={{ borderColor: "var(--ink-hairline)" }}
      >
        <div className="flex-none px-4 pb-2 pt-6 md:hidden">
          <h1 className="text-[18px] font-medium" style={{ color: "var(--ink-text)" }}>
            Threads
          </h1>
          <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink-subtle)" }}>
            Everything asked and answered, saved.
          </p>
        </div>
        <div className="flex-none px-4 pb-2 pt-6 md:pt-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your threads"
            className="ink-focus h-9 w-full rounded-lg border bg-[var(--ink-panel)] px-3 text-[12.5px]"
            style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-text)" }}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
          {q.isLoading ? (
            <div className="flex flex-col gap-2 px-1 pt-1">
              <div className="ink-skeleton h-12 w-full rounded-[10px]" />
              <div className="ink-skeleton h-12 w-full rounded-[10px]" />
              <div className="ink-skeleton h-12 w-full rounded-[10px]" />
            </div>
          ) : threads.length === 0 ? (
            <div
              className="mx-1 mt-2 rounded-xl border border-dashed px-5 py-8 text-center"
              style={{ borderColor: "var(--ink-hairline)" }}
            >
              <p className="text-[13px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
                Nothing asked yet. Ask anything and it lands here, saved.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-2 pt-3 text-[12.5px]" style={{ color: "var(--ink-subtle)" }}>
              No threads match "{query}".
            </p>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              {groups.map((g) => (
                <div key={g.label} className="flex flex-col gap-1">
                  <div
                    className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em]"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    {g.label}
                  </div>
                  {g.items.map((t) => (
                    <ThreadRow
                      key={t.id}
                      thread={t}
                      selected={t.id === selected}
                      onSelect={() => select(t.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ThreadPreview threadId={selected} />
    </div>
  );
}
