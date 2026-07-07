import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
import { Button, MonoLabel } from "@/components/obsidian";
import { createGoal, listGoals, setGoalStatus, type GoalListItem, type GoalStatus } from "@/lib/goals.functions";

/**
 * SW-4 / mission 3.10 GOAL MODE: the standing-objectives panel on Plan.
 *
 * A goal is an outcome the swarm keeps working: state it once, and the
 * goal planner proposes opportunities into Decide on its own cadence (an
 * inline first pass on creation, then the goal-tick cron). This panel is
 * the plainest honest surface over that capability: state a goal, see what
 * it has proposed, pause or close it. All judgment stays in Decide.
 */

const STATUS_TONE: Record<string, string> = {
  active: "var(--glacier)",
  paused: "var(--text-subtle)",
  achieved: "var(--moss, #4a7c59)",
  archived: "var(--text-subtle)",
};

export function GoalsPanel() {
  const qc = useQueryClient();
  const fList = useServerFn(listGoals);
  const fCreate = useServerFn(createGoal);
  const fStatus = useServerFn(setGoalStatus);
  const [title, setTitle] = useState("");

  const goalsQ = useQuery({ queryKey: ["goals"], queryFn: () => fList() });

  const create = useMutation({
    mutationFn: (value: string) => fCreate({ data: { title: value } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      if (r.firstPass?.proposed === 1) {
        toast.success("Goal set. The swarm already proposed its first opportunity into Decide.");
      } else {
        toast.success("Goal set. The swarm found nothing new yet; it keeps watching and re-plans every 20 minutes.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: (v: { goalId: string; status: GoalStatus }) => fStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    const value = title.trim();
    if (value.length < 3 || create.isPending) return;
    create.mutate(value);
    setTitle("");
  };

  const goals = (goalsQ.data ?? []).filter((g) => g.status !== "archived");

  return (
    <div>
      <div
        style={{
          background: "var(--surface-card)",
          borderRadius: "var(--radius-panel)",
          border: "1px solid var(--hairline)",
          boxShadow: "var(--shadow-elevated)",
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <MonoLabel tone="muted">What outcome should the swarm keep working?</MonoLabel>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='State the outcome, like "grow activation 15% this quarter". The swarm re-plans against it.'
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            style={{
              flex: 1,
              padding: "9px 12px",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              fontSize: 13,
              color: "var(--text-primary)",
              background: "var(--surface-raised)",
            }}
          />
          <Button
            variant="secondary"
            disabled={create.isPending || title.trim().length < 3}
            loading={create.isPending}
            onClick={submit}
            className="loom-press"
          >
            Set the goal
          </Button>
        </div>
      </div>

      {goalsQ.isLoading ? (
        <p style={{ fontSize: 13, color: "var(--text-subtle)", margin: 0 }}>Loading goals…</p>
      ) : goals.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-subtle)", margin: 0 }}>
          No standing goals yet. Set one above and the swarm starts working it immediately.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onSetStatus={(status) => setStatus.mutate({ goalId: g.id, status })} />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onSetStatus }: { goal: GoalListItem; onSetStatus: (s: GoalStatus) => void }) {
  const worked = goal.last_worked_at
    ? new Date(goal.last_worked_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <div
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-panel)",
        border: "1px solid var(--hairline)",
        padding: "12px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{goal.title}</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: STATUS_TONE[goal.status] ?? "var(--text-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {goal.status}
        </span>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--text-subtle)" }}>
        {goal.opportunity_count === 0
          ? "No proposals yet."
          : `${goal.opportunity_count} opportunit${goal.opportunity_count === 1 ? "y" : "ies"} proposed into Decide.`}
        {worked ? ` Last worked ${worked}.` : " Not worked yet."}
      </p>
      {goal.recent_opportunities.length > 0 ? (
        <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {goal.recent_opportunities.map((o) => (
            <li key={o.id} style={{ fontSize: 12.5 }}>
              <Link to="/decide" style={{ color: "var(--glacier)", textDecoration: "none" }}>
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {goal.status === "active" ? (
          <Button variant="tertiary" onClick={() => onSetStatus("paused")}>
            Pause
          </Button>
        ) : goal.status === "paused" ? (
          <Button variant="tertiary" onClick={() => onSetStatus("active")}>
            Resume
          </Button>
        ) : null}
        {goal.status !== "achieved" ? (
          <Button variant="tertiary" onClick={() => onSetStatus("achieved")}>
            Mark achieved
          </Button>
        ) : (
          <Button variant="tertiary" onClick={() => onSetStatus("archived")}>
            Archive
          </Button>
        )}
      </div>
    </div>
  );
}
