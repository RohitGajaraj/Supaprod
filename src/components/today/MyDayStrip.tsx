// Loom W2-TODAY (DESIGN-LOOM §8b) — My day: the PM's at-a-glance strip.
//
// ONE quiet row under the hero: today's meetings (the same calendar data the
// Brain calendar tab reads), tasks due today with quick add/complete (the
// first UI consumer of tasks.functions since the /tasks retirement), and the
// one Focus-next suggestion (SF-FOCUS, re-homed). Each segment links or
// discloses inline; empty slots collapse; a failed query says so and offers
// a retry — it never wears the empty state's clothes (§9b).
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/obsidian";
import { useToast } from "@/components/obsidian/toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { getTodayEvents } from "@/lib/calendar.functions";
import { listTasks, createTask, updateTask } from "@/lib/tasks.functions";
import { getFocusNext } from "@/lib/brain/insights.functions";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import { FocusNext } from "./FocusNext";
import { FocusTimer } from "./FocusTimer";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
};

type EventRow = { id: string; title: string; start_at: string };

const segLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

function SegmentButton({
  children,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="loom-press outline-none transition-colors hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
      style={{
        ...segLabel,
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        background: "transparent",
        border: "none",
        padding: "2px 0",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function SegmentError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 6 }}>
      <span style={{ ...segLabel, color: "var(--madder)" }}>{label} didn't load</span>
      <button
        type="button"
        onClick={onRetry}
        className="loom-press outline-none hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        style={{ ...segLabel, color: "var(--glacier)", background: "transparent", border: "none" }}
      >
        Retry
      </button>
    </span>
  );
}

const Dot = () => (
  <span aria-hidden="true" style={{ color: "var(--text-faint)", fontSize: 11 }}>
    ·
  </span>
);

/** Local YYYY-MM-DD — tasks.due_date is a Postgres `date`. */
function todayStr(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function MyDayStrip() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const showToast = useToast();
  const { activeProductId } = useWorkspace();

  const fEvents = useServerFn(getTodayEvents);
  const fTasks = useServerFn(listTasks);
  const fFocus = useServerFn(getFocusNext);
  const mCreate = useServerFn(createTask);
  const mUpdate = useServerFn(updateTask);
  const mStart = useServerFn(startOrchestratedMission);

  const events = useQuery({ queryKey: ["calendar-today-events"], queryFn: () => fEvents() });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fTasks() });
  // SF-FOCUS: cheap when cold (no themes -> null); reuses a fresh insight server-side.
  const focus = useQuery({
    queryKey: ["focus-next"],
    queryFn: () => fFocus(),
    staleTime: 30 * 60 * 1000,
  });

  const [open, setOpen] = React.useState<"tasks" | "focus" | null>(null);
  const [draft, setDraft] = React.useState("");

  const addTask = useMutation({
    mutationFn: (title: string) =>
      mCreate({ data: { title, due_date: todayStr(), project_id: activeProductId ?? null } }),
    onSuccess: () => {
      setDraft("");
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => showToast(e.message),
  });

  // Optimistic where reversible (DESIGN-LOOM §9): the box flips the instant
  // it is clicked; a failed write rolls it back and says so.
  const toggleTask = useMutation({
    mutationFn: (v: { id: string; done: boolean }) =>
      mUpdate({ data: { id: v.id, status: v.done ? "done" : "todo" } }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<{ tasks: TaskRow[] }>(["tasks"]);
      qc.setQueryData<{ tasks: TaskRow[] }>(["tasks"], (old) =>
        old
          ? {
              ...old,
              tasks: old.tasks.map((t) =>
                t.id === v.id
                  ? {
                      ...t,
                      status: v.done ? "done" : "todo",
                      completed_at: v.done ? new Date().toISOString() : null,
                    }
                  : t,
              ),
            }
          : old,
      );
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      showToast(e.message);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const startMission = useMutation({
    // The orchestrator loop is awaited server-side — this can run 30s+.
    mutationFn: (data: { goal: string }) => mStart({ data }),
    onSuccess: () => {
      showToast("Mission dispatched. Track it in Build.");
      void qc.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: (e: Error) => showToast(e.message),
  });

  const today = todayStr();
  const eventRows = ((events.data?.events ?? []) as EventRow[]).filter((e) => e.start_at);
  const nextEvent = eventRows.find((e) => Date.parse(e.start_at) >= Date.now()) ?? null;

  const taskRows = (tasks.data?.tasks ?? []) as TaskRow[];
  // Due today or overdue and still open, plus anything finished today —
  // checking a box should not make the row vanish mid-glance.
  const dueRows = taskRows.filter((t) => {
    const doneToday = t.status === "done" && (t.completed_at ?? "").slice(0, 10) === today;
    const openDue = t.status !== "done" && !!t.due_date && t.due_date <= today;
    return openDue || (doneToday && !!t.due_date && t.due_date <= today);
  });
  const openDueCount = dueRows.filter((t) => t.status !== "done").length;

  // Gate only on the fast DB reads. getFocusNext can spend seconds deriving
  // an insight (one AI call when cold) — its segment simply appears when
  // ready instead of holding the whole strip hostage.
  const loading = events.isPending || tasks.isPending;
  if (loading) {
    return (
      <div
        aria-hidden="true"
        style={{
          height: 40,
          marginBottom: 12,
          borderRadius: "var(--radius-card)",
          background: "var(--surface-card-deep)",
          boxShadow: "var(--top-light)",
        }}
      />
    );
  }

  const focusInsight = focus.data ?? null;

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "9px 16px",
        marginBottom: 12,
        boxShadow: "var(--top-light)",
      }}
    >
      <div className="flex flex-wrap items-center" style={{ gap: 12, minHeight: 22 }}>
        <span style={{ ...segLabel, color: "var(--text-subtle)", letterSpacing: "0.13em" }}>
          My day
        </span>

        {events.isError ? (
          <>
            <Dot />
            <SegmentError label="Meetings" onRetry={() => void events.refetch()} />
          </>
        ) : eventRows.length > 0 ? (
          <>
            <Dot />
            <SegmentButton
              onClick={() => navigate({ to: "/brain", search: { tab: "calendar" } as never })}
            >
              {eventRows.length} meeting{eventRows.length === 1 ? "" : "s"}
              {nextEvent
                ? ` · next ${new Date(nextEvent.start_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })} ${nextEvent.title.slice(0, 28)}`
                : " · all done"}
              {" →"}
            </SegmentButton>
          </>
        ) : null}

        {tasks.isError ? (
          <>
            <Dot />
            <SegmentError label="Tasks" onRetry={() => void tasks.refetch()} />
          </>
        ) : (
          <>
            <Dot />
            <SegmentButton
              active={open === "tasks"}
              onClick={() => setOpen(open === "tasks" ? null : "tasks")}
            >
              {openDueCount > 0
                ? `${openDueCount} task${openDueCount === 1 ? "" : "s"} due`
                : "Add a task"}
            </SegmentButton>
          </>
        )}

        {focus.isError ? (
          <>
            <Dot />
            <SegmentError label="Focus" onRetry={() => void focus.refetch()} />
          </>
        ) : focusInsight ? (
          <>
            <Dot />
            <SegmentButton
              active={open === "focus"}
              onClick={() => setOpen(open === "focus" ? null : "focus")}
            >
              Focus next · {focusInsight.headline.slice(0, 48)}
            </SegmentButton>
          </>
        ) : null}

        {/* Founder ask (2026-07-04): the PM's day-in-day-out focus timer,
            as a strip segment rather than a new surface. */}
        <Dot />
        <FocusTimer />
      </div>

      {open === "tasks" ? (
        <div
          className="flex flex-col"
          style={{ gap: 7, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--hairline)" }}
        >
          {dueRows.map((t) => {
            const done = t.status === "done";
            const overdue = !done && !!t.due_date && t.due_date < today;
            return (
              <label key={t.id} className="flex cursor-pointer items-center" style={{ gap: 9 }}>
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggleTask.mutate({ id: t.id, done: !done })}
                  style={{ accentColor: "var(--moss)", width: 13, height: 13, flexShrink: 0 }}
                />
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{
                    fontSize: 13,
                    color: done ? "var(--text-subtle)" : "var(--text-body)",
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {t.title}
                </span>
                {overdue ? (
                  <span style={{ ...segLabel, fontSize: 9.5, color: "var(--madder)" }}>
                    Overdue
                  </span>
                ) : null}
              </label>
            );
          })}
          <form
            className="flex items-center"
            style={{ gap: 8 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim().length >= 2) addTask.mutate(draft.trim());
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a task for today"
              style={{
                flex: 1,
                background: "var(--surface-card-deep)",
                border: "1px solid var(--hairline-strong)",
                borderRadius: "var(--radius-control)",
                padding: "6px 10px",
                fontSize: 13,
                color: "var(--text-primary)",
              }}
            />
            <Button
              type="submit"
              variant="secondary"
              loading={addTask.isPending}
              disabled={draft.trim().length < 2}
              style={{ fontSize: 12, padding: "6px 14px" }}
            >
              Add
            </Button>
          </form>
        </div>
      ) : null}

      {open === "focus" && focusInsight ? (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--hairline)" }}>
          <FocusNext
            insight={focusInsight}
            onStart={(goal) => startMission.mutate({ goal })}
            isStarting={startMission.isPending}
          />
        </div>
      ) : null}
    </div>
  );
}
