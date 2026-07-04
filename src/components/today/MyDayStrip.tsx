/**
 * LOOM W2-TODAY: My-day strip
 *
 * Productivity productivity in one row:
 * - Meetings today (calendar items)
 * - Tasks due (upcoming tasks)
 * - Focus next (the highest-signal task/call from ambient sense)
 *
 * Launched from one row, collapsed under "N more" if screen real estate pressures.
 * Re-homes FocusNext.tsx from its orphaned state.
 */

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, CheckSquare2, Zap } from "lucide-react";

interface MyDayItem {
  id: string;
  label: string;
  time?: string;
  type: "meeting" | "task" | "focus";
}

interface MyDayStripProps {
  meetings?: number;
  tasksDue?: number;
  focusItem?: { title: string; source: string };
  onViewMeetings?: () => void;
  onViewTasks?: () => void;
}

export function MyDayStrip({
  meetings = 0,
  tasksDue = 0,
  focusItem,
  onViewMeetings,
  onViewTasks,
}: MyDayStripProps) {
  const items: MyDayItem[] = [];

  if (meetings > 0) {
    items.push({
      id: "meetings",
      label: `${meetings} meeting${meetings !== 1 ? "s" : ""} today`,
      type: "meeting",
    });
  }

  if (tasksDue > 0) {
    items.push({
      id: "tasks",
      label: `${tasksDue} task${tasksDue !== 1 ? "s" : ""} due today`,
      type: "task",
    });
  }

  if (focusItem) {
    items.push({
      id: "focus",
      label: focusItem.title,
      type: "focus",
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "12px 16px",
        background: "rgba(127, 209, 220, 0.08)", // --glacier tint
        borderRadius: 8,
        marginBottom: 20,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {items.map((item) => {
        const Icon = item.type === "meeting" ? Calendar : item.type === "task" ? CheckSquare2 : Zap;
        const handleClick = item.type === "meeting" ? onViewMeetings : item.type === "task" ? onViewTasks : undefined;

        return (
          <button
            key={item.id}
            onClick={handleClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "rgba(127, 209, 220, 0.12)",
              border: "1px solid rgba(127, 209, 220, 0.25)",
              borderRadius: 6,
              color: "var(--text-body)",
              cursor: handleClick ? "pointer" : "default",
              fontSize: 12,
              fontFamily: "inherit",
              fontWeight: 500,
              transition: "background 140ms var(--ease-out)",
            }}
            onMouseEnter={(e) => {
              if (handleClick) {
                (e.currentTarget as HTMLElement).style.background = "rgba(127, 209, 220, 0.18)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(127, 209, 220, 0.12)";
            }}
            onMouseDown={(e) => {
              if (handleClick) {
                (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
              }
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
            disabled={!handleClick}
          >
            <Icon size={14} style={{ opacity: 0.8 }} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
