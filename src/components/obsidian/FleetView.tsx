/**
 * OBS-10: the by-AGENT lens folded into Build as a view-mode tab. Ported from
 * the retired `/fleet` page: same pure `agent-fleet.ts` model, same visual
 * signals (4 states, 4 tallies), no TopBar/SurfaceHeader/outer wrapper since
 * Build's own page chrome already provides those.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import type { FleetAgent } from "@/lib/agent-fleet";

const STATE_META: Record<string, { label: string; color: string }> = {
  working: { label: "Working", color: "var(--action-blue, #2563eb)" },
  queued: { label: "Queued", color: "var(--ink-faint)" },
  attention: { label: "Exceptions", color: "var(--coral, #e11d48)" },
  idle: { label: "Idle", color: "var(--ink-faint)" },
};

function Tally({ n, label, color }: { n: number; label: string; color?: string }) {
  if (n === 0) return null;
  return (
    <span style={{ color: color ?? "var(--ink-subtle)" }} className="tabular-nums">
      {n} {label}
    </span>
  );
}

function AgentRow({ a }: { a: FleetAgent }) {
  const meta = STATE_META[a.state] ?? STATE_META.idle;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "1px solid var(--hairline)",
        borderRadius: 10,
        padding: "11px 14px",
        background: "var(--surface-card)",
      }}
    >
      <span
        style={{ width: 8, height: 8, borderRadius: 99, background: meta.color, flexShrink: 0 }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{a.name}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 3 }}>
          <Tally n={a.running} label="running" color="var(--action-blue, #2563eb)" />
          <Tally n={a.queued} label="queued" />
          <Tally n={a.done} label="done" color="var(--emerald, #059669)" />
          <Tally n={a.failed} label="failed" color="var(--coral, #e11d48)" />
          {a.total === 0 ? (
            <span style={{ color: "var(--ink-faint)", fontStyle: "italic" }}>
              no runs yet
            </span>
          ) : null}
        </div>
      </div>
      <span
        className="mono-label"
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: meta.color,
          border: `1px solid ${meta.color}`,
          borderRadius: 999,
          padding: "3px 9px",
          flexShrink: 0,
        }}
      >
        {meta.label}
      </span>
    </div>
  );
}

export function FleetView() {
  const { activeWorkspaceId } = useWorkspace();
  // PC-29 fix: scoped by workspaceId (shares its cache with the station
  // PresenceChip/AgentRelay reads elsewhere on the same workspace) so this
  // view can no longer show another workspace's agent runs merged in.
  const fGet = useServerFn(getAgentFleet);
  const query = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fGet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const fleet = query.data?.fleet;

  if (query.isPending) {
    // Skeleton matching the loaded row list (never a bare text placeholder).
    return (
      <div role="status" style={{ padding: "16px 0" }}>
        <span className="sr-only">Scanning the fleet…</span>
        <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 56,
                borderRadius: 10,
                border: "1px solid var(--hairline)",
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div style={{ padding: "32px 0" }}>
        <p style={{ color: "var(--rose)", margin: 0 }}>
          Could not load the fleet. {(query.error as Error)?.message}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            marginTop: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--ink-subtle)",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          Retry · rescans the fleet
        </button>
      </div>
    );
  }
  if (!fleet) return null;

  return (
    <>
      <p style={{ color: "var(--ink)", margin: "4px 0 22px" }}>{fleet.headline}</p>
      {fleet.agents.length === 0 ? (
        <div style={{ color: "var(--ink-subtle)", padding: "8px 0" }}>
          No agents have run yet. Dispatch a mission and your fleet shows up here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fleet.agents.map((a) => (
            <AgentRow key={a.slug} a={a} />
          ))}
        </div>
      )}
    </>
  );
}
