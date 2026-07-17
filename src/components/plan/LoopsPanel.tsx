import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
import { Button } from "@/components/obsidian";
import { SectionSummaryCard } from "./SectionSummaryCard";
import { LOOP_KINDS, type LoopCadence, type LoopKind } from "@/lib/loops.shared";
import {
  createLoop,
  listLoops,
  setLoopStatus,
  type LoopListItem,
  type LoopStatus,
} from "@/lib/loops.functions";

/**
 * SW-4 / mission 3.10 LOOP MODE: the recurring-missions panel on Plan.
 *
 * Hidden crons, promoted: each loop wraps a pass the platform already runs
 * (competitor sweep, signal re-cluster, outcome review), but the user owns
 * it: they pick the cadence, see every run and what it cost, and hold the
 * pause switch. No new machinery is invented; this is the honest surface
 * over what the swarm was already doing.
 */

const STATUS_TONE: Record<string, string> = {
  active: "var(--glacier)",
  paused: "var(--text-subtle)",
  archived: "var(--text-subtle)",
};

const CADENCE_LABEL: Record<string, string> = {
  hourly: "every hour",
  daily: "daily",
  weekly: "weekly",
};

const selectStyle: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-control)",
  fontSize: "var(--text-label-13)",
  color: "var(--text-primary)",
  background: "var(--surface-raised)",
};

export function LoopsPanel({
  collapsed = false,
  onExpand,
}: {
  /** IA SPINE (2026-07-11): when collapsed, the panel renders as one summary
   * card (count + last activity) that expands on demand. */
  collapsed?: boolean;
  onExpand?: () => void;
}) {
  const qc = useQueryClient();
  const fList = useServerFn(listLoops);
  const fCreate = useServerFn(createLoop);
  const fStatus = useServerFn(setLoopStatus);
  const [kind, setKind] = useState<LoopKind>("competitor_sweep");
  const [cadence, setCadence] = useState<LoopCadence | "">("");
  // Anti-scroll (founder ruling 2026-07-06): show the top few and expand on
  // demand, same idiom as SignalFeed/AutoClustered.
  const [showAll, setShowAll] = useState(false);
  const VISIBLE_LOOPS = 5;

  const loopsQ = useQuery({ queryKey: ["loops"], queryFn: () => fList() });

  const create = useMutation({
    mutationFn: (v: { kind: LoopKind; cadence?: LoopCadence }) => fCreate({ data: v }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["loops"] });
      if (r.firstRun?.ok) {
        toast.success(`Mission started. First run done: ${r.firstRun.summary}`);
      } else {
        toast.success("Mission started. Its first run lands on the next tick.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: (v: { loopId: string; status: LoopStatus }) => fStatus({ data: v }),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["loops"] });
      toast.success(
        v.status === "paused"
          ? "Mission paused."
          : v.status === "active"
            ? "Mission resumed."
            : "Mission archived.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loops = (loopsQ.data ?? []).filter((l) => l.status !== "archived");
  const activeKinds = new Set(loops.map((l) => l.kind));

  // Collapsed: one summary card (count + last activity), expanding on demand.
  if (collapsed) {
    const lastRun = loops
      .map((l) => l.last_run_at)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1);
    const when = fmtWhen(lastRun ?? null);
    return (
      <SectionSummaryCard
        label="Show recurring missions"
        loading={loopsQ.isLoading}
        primary={
          loopsQ.isLoading
            ? "Loading recurring missions…"
            : loopsQ.isError
              ? "Couldn't load recurring missions"
              : loops.length === 0
                ? "No recurring missions yet"
                : `${loops.length} recurring mission${loops.length === 1 ? "" : "s"}`
        }
        detail={
          loopsQ.isError
            ? "Open to retry"
            : loops.length === 0
              ? "Open to start one; every run shows up with its cost"
              : when
                ? `Last ran ${when}`
                : "No runs yet"
        }
        onExpand={onExpand}
      />
    );
  }

  return (
    <div>
      <div
        className="material-medium"
        style={{
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-label-13)",
            color: "var(--text-muted)",
          }}
        >
          What should Cadence keep re-running?
        </span>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <select
            aria-label="Mission kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as LoopKind)}
            style={{ ...selectStyle, flex: 1, minWidth: 220 }}
          >
            {(Object.keys(LOOP_KINDS) as LoopKind[]).map((k) => (
              <option key={k} value={k}>
                {LOOP_KINDS[k].label}
              </option>
            ))}
          </select>
          <select
            aria-label="Cadence"
            value={cadence}
            onChange={(e) => setCadence(e.target.value as LoopCadence | "")}
            style={selectStyle}
          >
            <option value="">{`Default (${CADENCE_LABEL[LOOP_KINDS[kind].defaultCadence]})`}</option>
            <option value="hourly">Every hour</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <Button
            variant="secondary"
            disabled={create.isPending}
            loading={create.isPending}
            onClick={() => create.mutate({ kind, ...(cadence ? { cadence } : {}) })}
            className="loom-press"
          >
            Start the mission
          </Button>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "var(--text-label-13)", color: "var(--text-subtle)" }}>
          {LOOP_KINDS[kind].description}
          {activeKinds.has(kind)
            ? " Already running below; a second copy runs on its own cadence."
            : ""}
        </p>
      </div>

      {loopsQ.isLoading ? (
        <div role="status" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="sr-only">Loading recurring missions…</span>
          {[0, 1].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="material-base"
              style={{ height: 64, opacity: 0.4 }}
            />
          ))}
        </div>
      ) : loopsQ.isError ? (
        <div
          style={{
            padding: 24,
            background: "var(--surface-card-deep)",
            borderRadius: "var(--radius-panel)",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label-12)", color: "var(--madder)" }}>
            COULDN'T LOAD RECURRING MISSIONS
          </div>
          <p style={{ fontSize: "var(--text-label-13)", color: "var(--text-muted)", marginTop: 8 }}>
            {(loopsQ.error as Error)?.message}
          </p>
          <button
            type="button"
            onClick={() => loopsQ.refetch()}
            className="outline-none transition-colors hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={{
              marginTop: 14,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-label-12)",
              color: "var(--text-body)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Retry · reloads recurring missions
          </button>
        </div>
      ) : loops.length === 0 ? (
        <p style={{ fontSize: "var(--text-label-13)", color: "var(--text-subtle)", margin: 0 }}>
          No recurring missions yet. Start one above: it runs on its cadence and every run shows up
          here with its cost.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(showAll ? loops : loops.slice(0, VISIBLE_LOOPS)).map((l) => (
            <LoopCard
              key={l.id}
              loop={l}
              onSetStatus={(status) => setStatus.mutate({ loopId: l.id, status })}
              statusPending={setStatus.isPending}
            />
          ))}
          {loops.length > VISIBLE_LOOPS ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="loom-press w-full outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-label-13)",
                fontWeight: 500,
                color: "var(--text-muted)",
                background: "transparent",
                border: "1px solid var(--hairline-strong)",
                borderRadius: "var(--radius-control)",
                padding: "8px 14px",
              }}
            >
              {showAll ? "Show fewer" : `Show ${loops.length - VISIBLE_LOOPS} more`}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function fmtWhen(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCost(v: number | null | undefined): string {
  const n = Number(v ?? 0);
  if (n === 0) return "$0";
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function LoopCard({
  loop,
  onSetStatus,
  statusPending = false,
}: {
  loop: LoopListItem;
  onSetStatus: (s: LoopStatus) => void;
  statusPending?: boolean;
}) {
  const last = fmtWhen(loop.last_run_at);
  const next = fmtWhen(loop.next_run_at);
  return (
    <div
      className="material-base"
      style={{
        padding: "12px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span className="text-label-14" style={{ color: "var(--text-primary)" }}>
          <strong>{loop.title}</strong>
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-label-12)",
            color: STATUS_TONE[loop.status] ?? "var(--text-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {loop.status}
        </span>
        <span
          style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label-12)", color: "var(--text-subtle)" }}
        >
          {CADENCE_LABEL[loop.cadence] ?? loop.cadence}
        </span>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: "var(--text-label-13)", color: "var(--text-subtle)" }}>
        {loop.run_count === 0
          ? "No runs yet."
          : `${loop.run_count} run${loop.run_count === 1 ? "" : "s"}, ${fmtCost(loop.total_cost_usd)} total.`}
        {last ? ` Last ran ${last}.` : ""}
        {loop.status === "active" && next ? ` Next ${next}.` : ""}
      </p>
      {loop.recent_runs.length > 0 ? (
        <ul
          style={{
            margin: "8px 0 0",
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {loop.recent_runs.slice(0, 3).map((r) => (
            <li
              key={r.id}
              style={{
                fontSize: "var(--text-label-13)",
                color: "var(--text-body)",
                display: "flex",
                gap: 8,
                alignItems: "baseline",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  flexShrink: 0,
                  // Run outcomes are semantic: green success, red failure
                  // (Tempo hard law; ember stays reserved for human gates).
                  background:
                    r.status === "ok"
                      ? "var(--moss)"
                      : r.status === "error"
                        ? "var(--madder)"
                        : "var(--text-subtle)",
                  position: "relative",
                  top: -1,
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                {r.status === "error"
                  ? (r.error_message ?? "Run failed.")
                  : (r.summary ?? "Run finished.")}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-label-12)",
                  color: "var(--text-subtle)",
                  flexShrink: 0,
                }}
              >
                {fmtWhen(r.started_at)} · {fmtCost(r.cost_usd)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {loop.status === "active" ? (
          <Button variant="tertiary" onClick={() => onSetStatus("paused")} disabled={statusPending}>
            Pause
          </Button>
        ) : loop.status === "paused" ? (
          <Button variant="tertiary" onClick={() => onSetStatus("active")} disabled={statusPending}>
            Resume
          </Button>
        ) : null}
        <Button variant="tertiary" onClick={() => onSetStatus("archived")} disabled={statusPending}>
          Archive
        </Button>
      </div>
    </div>
  );
}
