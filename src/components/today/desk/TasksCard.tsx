// The Desk's evident task list (PM Desk, founder goal 2026-07-09): what is due
// or overdue today, plus what got finished today, with the add affordance
// ALWAYS visible — never hidden behind a toggle (the retired strip's
// anti-pattern). Quiet mono tags carry the row's state: OVERDUE (madder),
// HIGH, DEEP, AGENT. Rows past five fold behind one inline expander. Same
// server functions and optimistic toggle the strip used; only the presentation
// grew structural affordance.
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/obsidian";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import { listTasks, createTask, updateTask } from "@/lib/tasks.functions";
import { dueRowsOf, isOverdue, openDueCountOf, todayStr, type TaskRow } from "./task-filters";
import { TASK_COMPOSE_EVENT, useDeskComposeIntent } from "@/lib/desk-compose";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const card: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "14px 18px 16px",
  boxShadow: "var(--top-light)",
};

const VISIBLE_CAP = 5;

function RowTag({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ ...mono, color, flexShrink: 0 }} aria-hidden="false">
      {text}
    </span>
  );
}

/** Quiet mono due-date label for the backlog list: "Jul 15" or "No date". */
function fmtDueDate(dueDate: string | null): string {
  if (!dueDate) return "No date";
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TasksCard() {
  const qc = useQueryClient();
  const { activeProductId } = useWorkspace();

  const fTasks = useServerFn(listTasks);
  const mCreate = useServerFn(createTask);
  const mUpdate = useServerFn(updateTask);

  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fTasks() });

  const [draft, setDraft] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);
  const [backlogOpen, setBacklogOpen] = React.useState(false);

  // IA SPINE (2026-07-11): the palette's "Add a task" verb opens this
  // composer in place — focus the always-visible input.
  const draftInputRef = React.useRef<HTMLInputElement>(null);
  const focusComposer = React.useCallback(() => {
    draftInputRef.current?.focus();
  }, []);
  useDeskComposeIntent(TASK_COMPOSE_EVENT, focusComposer);

  const addTask = useMutation({
    mutationFn: (title: string) =>
      mCreate({ data: { title, due_date: todayStr(), project_id: activeProductId ?? null } }),
    onSuccess: () => {
      setDraft("");
      toast.success("Added to today's list.");
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.success(e.message),
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
      toast.success(e.message);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const today = todayStr();
  const allRows = (tasks.data?.tasks ?? []) as TaskRow[];
  const dueRows = dueRowsOf(allRows, today);
  const openCount = openDueCountOf(dueRows);
  const visible = expanded ? dueRows : dueRows.slice(0, VISIBLE_CAP);
  const hiddenCount = dueRows.length - visible.length;

  // Open tasks that exist but never surface above: no due date, or a due
  // date past today. Without this they silently vanish from the Desk.
  const dueRowIds = new Set(dueRows.map((t) => t.id));
  const backlogRows = allRows.filter((t) => t.status !== "done" && !dueRowIds.has(t.id));

  if (tasks.isPending) {
    return (
      <div
        role="status"
        aria-label="Loading tasks"
        style={{
          height: 120,
          borderRadius: "var(--radius-card)",
          background: "var(--surface-card-deep)",
          boxShadow: "var(--top-light)",
        }}
      />
    );
  }

  return (
    <section aria-label="Tasks today" style={card}>
      <div className="flex items-baseline" style={{ gap: 12, marginBottom: 10 }}>
        <h3 className="text-label-12" style={{ ...mono, color: "var(--text-subtle)", margin: 0 }}>Tasks today</h3>
        <div style={{ flex: 1 }} />
        {openCount > 0 ? (
          <span className="text-label-12" style={{ ...mono, color: "var(--text-faint)" }}>
            {openCount} open
          </span>
        ) : null}
      </div>

      {tasks.isError ? (
        <div className="flex items-center" style={{ gap: "var(--geist-space-2x)", marginBottom: 10 }}>
          <span className="text-label-13" style={{ color: "var(--madder)" }}>Tasks didn't load.</span>
          <Button variant="tertiary" className="text-label-12" onClick={() => void tasks.refetch()}>
            Retry
          </Button>
        </div>
      ) : dueRows.length === 0 ? (
        <p className="text-label-13" style={{ color: "var(--text-muted)", margin: "0 0 10px" }}>
          Nothing due today. Add what matters.
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: 7, marginBottom: 10 }}>
          {visible.map((t) => {
            const done = t.status === "done";
            return (
              <label key={t.id} className="flex cursor-pointer items-center" style={{ gap: 9 }}>
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggleTask.mutate({ id: t.id, done: !done })}
                  style={{ accentColor: "var(--moss)", width: 13, height: 13, flexShrink: 0 }}
                />
                <span
                  className="min-w-0 flex-1 truncate text-label-13"
                  style={{
                    color: done ? "var(--text-subtle)" : "var(--text-body)",
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {t.title}
                </span>
                {isOverdue(t, today) ? <RowTag text="Overdue" color="var(--madder)" /> : null}
                {t.priority === "high" && !done ? (
                  <RowTag text="High" color="var(--text-muted)" />
                ) : null}
                {t.is_deep_work ? <RowTag text="Deep" color="var(--text-muted)" /> : null}
                {t.assignee_kind === "agent" ? (
                  <RowTag text="Agent" color="var(--text-muted)" />
                ) : null}
              </label>
            );
          })}
          {hiddenCount > 0 ? (
            <Button
              variant="tertiary"
              className="text-label-12"
              onClick={() => setExpanded(true)}
              style={{ alignSelf: "flex-start" }}
            >
              {hiddenCount} more
            </Button>
          ) : null}
        </div>
      )}

      {backlogRows.length > 0 ? (
        <div style={{ marginBottom: 10 }}>
          <Button
            variant="tertiary"
            className="text-label-12"
            aria-expanded={backlogOpen}
            onClick={() => setBacklogOpen((v) => !v)}
            style={{ alignSelf: "flex-start" }}
          >
            {backlogOpen ? "Hide backlog" : `Backlog (${backlogRows.length})`}
          </Button>
          {backlogOpen ? (
            <div className="flex flex-col" style={{ gap: 8, marginTop: 8 }}>
              {backlogRows.map((t) => (
                <div key={t.id} className="flex items-center" style={{ gap: 9 }}>
                  <span
                    className="min-w-0 flex-1 truncate text-label-13"
                    style={{ color: "var(--text-body)" }}
                  >
                    {t.title}
                  </span>
                  <span
                    className="text-label-12"
                    style={{ ...mono, color: "var(--text-faint)", flexShrink: 0 }}
                  >
                    {fmtDueDate(t.due_date)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <form
        className="flex items-center"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim().length >= 2) addTask.mutate(draft.trim());
        }}
      >
        <input
          ref={draftInputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="New task for today"
          placeholder="Add a task for today"
          className="text-label-13"
          style={{
            flex: 1,
            background: "var(--surface-card-deep)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "6px 10px",
            color: "var(--text-primary)",
          }}
        />
        <Button
          type="submit"
          variant="secondary"
          className="text-label-12"
          loading={addTask.isPending}
          disabled={draft.trim().length < 2}
          style={{ padding: "6px 14px" }}
        >
          Add
        </Button>
      </form>
    </section>
  );
}
