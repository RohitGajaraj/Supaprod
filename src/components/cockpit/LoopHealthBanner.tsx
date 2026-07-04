// Loop Health Monitor (E8) — a thin always-on strip on the Build surface that
// reads the loop's vitals (getLoopHealth) so a stall is caught before it bites.
// LOOM v4 reframe (W2-BUILD, audit D-10 + DESIGN-LOOM §9b): raw telemetry may
// never read as a broken product. The old strip said "Loop stalled · 7 calls
// expired · 19 in queue" with no meaning, no scope, and no way to act. The
// numbers stay exactly as true; each now ships with what it means and ONE
// action. Ember marks the needs-a-human state only (expired approvals are
// decisions nobody answered); a stall with no expired calls stays neutral ink.
// Polls every 30s for liveness.
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getLoopHealth, type LoopHealth } from "@/lib/loop-health.functions";

function rel(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Verdict word + dot color. Ember is reserved for needs-a-human (expired
 *  approvals); a stuck run with nothing to approve stays neutral ink. */
function verdictDisplay(h: LoopHealth): { label: string; color: string } {
  if (h.verdict === "idle") return { label: "Loop on watch", color: "var(--text-faint)" };
  if (h.verdict === "working") return { label: "Loop working", color: "var(--glacier)" };
  return h.expiredCalls > 0
    ? { label: "Loop waiting on you", color: "var(--ember)" }
    : { label: "Loop needs a look", color: "var(--text-muted)" };
}

/** The stalled line, with its meaning: what stopped, why, in plain words. */
function stalledSummary(h: LoopHealth): string {
  const parts: string[] = [];
  if (h.expiredCalls > 0) {
    parts.push(
      h.expiredCalls === 1
        ? "1 approval expired before anyone answered, so its work is on hold"
        : `${h.expiredCalls} approvals expired before anyone answered, so their work is on hold`,
    );
  }
  if (h.stalledRuns > 0) {
    parts.push(
      h.stalledRuns === 1
        ? `1 run has been quiet for over ${h.stallMinutes}m`
        : `${h.stalledRuns} runs have been quiet for over ${h.stallMinutes}m`,
    );
  }
  return parts.join(" · ");
}

export function LoopHealthBanner() {
  const fHealth = useServerFn(getLoopHealth);
  const q = useQuery({
    queryKey: ["loop-health"],
    queryFn: () => fHealth(),
    refetchInterval: 30_000,
  });
  const h = q.data;
  if (!h) return null;
  const v = verdictDisplay(h);

  return (
    <section
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-panel)",
        boxShadow: "var(--top-light), var(--shadow-ambient)",
        padding: "10px var(--card-pad)",
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        ...(h.verdict === "stalled" && h.expiredCalls > 0
          ? { border: "1px solid var(--ember-line)" }
          : {}),
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 99,
            background: v.color,
            boxShadow: `0 0 0 3px color-mix(in oklab, ${v.color} 20%, transparent)`,
            flexShrink: 0,
          }}
        />
        <strong style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
          {v.label}
        </strong>
      </span>

      {h.verdict === "stalled" ? (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{stalledSummary(h)}</span>
      ) : h.verdict === "working" ? (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {h.inFlightRuns} run{h.inFlightRuns === 1 ? "" : "s"} in flight
        </span>
      ) : (
        <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>
          nothing in flight, nothing stuck
        </span>
      )}

      <span style={{ flex: 1 }} />

      <span
        className="mono-label tabular-nums"
        style={{
          display: "flex",
          gap: 14,
          fontSize: "var(--text-mono-floor)",
          color: "var(--text-subtle)",
          flexWrap: "wrap",
        }}
      >
        {/* Scope on the number (§9b): the queue is calls waiting on a human. */}
        {h.queueDepth > 0 ? (
          <Link to="/today" style={{ color: "var(--text-subtle)" }}>
            {h.queueDepth} call{h.queueDepth === 1 ? "" : "s"} waiting on you
          </Link>
        ) : (
          <span>no calls waiting</span>
        )}
        <span>ingest {rel(h.lastIngestAt)}</span>
        <span>run {rel(h.lastRunAt)}</span>
      </span>

      {h.verdict === "stalled" &&
        (h.expiredCalls > 0 ? (
          // Expired gates now have ONE home: the quiet Expired group at the
          // end of Today's queue (R2-ATTENTION #2), so the action goes there.
          <Link
            to="/today"
            className="mono-label loom-press"
            style={{
              fontSize: "var(--text-mono-floor)",
              color: "var(--ember-text)",
              whiteSpace: "nowrap",
            }}
          >
            Review expired →
          </Link>
        ) : (
          <Link
            to="/govern"
            search={{ tab: "incidents" }}
            className="mono-label loom-press"
            style={{
              fontSize: "var(--text-mono-floor)",
              color: "var(--glacier)",
              whiteSpace: "nowrap",
            }}
          >
            Open the engine room →
          </Link>
        ))}
    </section>
  );
}
