// Pure selectors for the Desk's task card (PM Desk, founder goal 2026-07-09).
// Extracted verbatim from the retired MyDayStrip so the due-today logic is
// unit-testable and shared: due today or overdue and still open, plus anything
// finished today — checking a box must not make the row vanish mid-glance.

export type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  priority?: string | null;
  is_deep_work?: boolean | null;
  assignee_kind?: string | null;
};

/** Local YYYY-MM-DD — tasks.due_date is a Postgres `date`. */
export function todayStr(now = new Date()): string {
  return now.toLocaleDateString("en-CA");
}

export function isDoneToday(t: TaskRow, today: string): boolean {
  return t.status === "done" && (t.completed_at ?? "").slice(0, 10) === today;
}

export function isOpenDue(t: TaskRow, today: string): boolean {
  return t.status !== "done" && !!t.due_date && t.due_date <= today;
}

export function isOverdue(t: TaskRow, today: string): boolean {
  return t.status !== "done" && !!t.due_date && t.due_date < today;
}

/** The card's rows: open due-or-overdue tasks plus tasks finished today. */
export function dueRowsOf(tasks: TaskRow[], today: string): TaskRow[] {
  return tasks.filter(
    (t) => isOpenDue(t, today) || (isDoneToday(t, today) && !!t.due_date && t.due_date <= today),
  );
}

export function openDueCountOf(rows: TaskRow[]): number {
  return rows.filter((t) => t.status !== "done").length;
}
