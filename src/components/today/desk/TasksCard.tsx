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
import { useToast } from "@/components/obsidian/toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { listTasks, createTask, updateTask } from "@/lib/tasks.functions";
import {
  dueRowsOf,
  isOverdue,
  openDueCountOf,
  todayStr,
  type TaskRow,
} from "./task-filters";

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
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
    <span style={{ ...mono, fontSize: 9.5, color, flexShrink: 0 }} aria-hidden="false">
      {text}
    </span>
  );
}

export function TasksCard() {
  const qc = useQueryClient();
  const showToast = useToast();
  const { activeProductId } = useWorkspace();

  const fTasks = useServerFn(listTasks);
  const mCreate = useServerFn(createTask);
  const mUpdate = useServerFn(updateTask);

  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fTasks() });

  const [draft, setDraft] = React.useState("");
  const [expanded, setExpanded] = React.useState(false);

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

  const today = todayStr();
  const allRows = (tasks.data?.tasks ?? []) as TaskRow[];
  const dueRows = dueRowsOf(allRows, today);
  const openCount = openDueCountOf(dueRows);
  const visible = expanded ? dueRows : dueRows.slice(0, VISIBLE_CAP);
  const hiddenCount = dueRows.length - visible.length;

  if (tasks.isPending) {
    return (
      <div
        aria-hidden="true"
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
      <div className="flex items-baseline" style={{ gap: 10, marginBottom: 10 }}>
        <h3 style={{ ...mono, color: "var(--text-subtle)", margin: 0 }}>Tasks today</h3>
        <div style={{ flex: 1 }} />
        {openCount > 0 ? (
          <span style={{ ...mono, fontSize: 9.5, color: "var(--text-faint)" }}>
            {openCount} open
          </span>
        ) : null}
      </div>

      {tasks.isError ? (
        <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 12.5, color: "var(--madder)" }}>Tasks didn't load.</span>
          <Button variant="tertiary" onClick={() => void tasks.refetch()} style={{ fontSize: 12 }}>
            Retry
          </Button>
        </div>
      ) : dueRows.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 10px" }}>
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
                  className="min-w-0 flex-1 truncate"
                  style={{
                    fontSize: 13,
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
              onClick={() => setExpanded(true)}
              style={{ fontSize: 12, alignSelf: "flex-start" }}
            >
              {hiddenCount} more
            </Button>
          ) : null}
        </div>
      )}

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
    </section>
  );
}
