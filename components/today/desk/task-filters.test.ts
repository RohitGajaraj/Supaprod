import { describe, expect, test } from "bun:test";
import {
  dueRowsOf,
  isDoneToday,
  isOpenDue,
  isOverdue,
  openDueCountOf,
  type TaskRow,
} from "./task-filters";

const TODAY = "2026-07-09";

function task(patch: Partial<TaskRow>): TaskRow {
  return {
    id: "t1",
    title: "a task",
    status: "todo",
    due_date: TODAY,
    completed_at: null,
    ...patch,
  };
}

describe("task selectors", () => {
  test("open task due today is due, not overdue", () => {
    const t = task({});
    expect(isOpenDue(t, TODAY)).toBe(true);
    expect(isOverdue(t, TODAY)).toBe(false);
  });

  test("open task due yesterday is due AND overdue", () => {
    const t = task({ due_date: "2026-07-08" });
    expect(isOpenDue(t, TODAY)).toBe(true);
    expect(isOverdue(t, TODAY)).toBe(true);
  });

  test("a task with no due date never qualifies", () => {
    const t = task({ due_date: null });
    expect(isOpenDue(t, TODAY)).toBe(false);
    expect(isOverdue(t, TODAY)).toBe(false);
  });

  test("done today counts as done today; done yesterday does not", () => {
    expect(isDoneToday(task({ status: "done", completed_at: `${TODAY}T10:00:00Z` }), TODAY)).toBe(
      true,
    );
    expect(isDoneToday(task({ status: "done", completed_at: "2026-07-08T10:00:00Z" }), TODAY)).toBe(
      false,
    );
  });

  test("dueRowsOf keeps open due rows and rows finished today, drops the rest", () => {
    const rows = dueRowsOf(
      [
        task({ id: "open-today" }),
        task({ id: "open-overdue", due_date: "2026-07-01" }),
        task({ id: "done-today", status: "done", completed_at: `${TODAY}T09:00:00Z` }),
        task({ id: "done-old", status: "done", completed_at: "2026-07-01T09:00:00Z" }),
        task({ id: "future", due_date: "2026-08-01" }),
        task({ id: "no-due", due_date: null }),
      ],
      TODAY,
    );
    expect(rows.map((r) => r.id)).toEqual(["open-today", "open-overdue", "done-today"]);
    expect(openDueCountOf(rows)).toBe(2);
  });
});
