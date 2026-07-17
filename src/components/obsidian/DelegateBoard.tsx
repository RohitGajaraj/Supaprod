/**
 * OBS-10: the by-MISSION lens folded into Build as a view-mode tab. Ported
 * from the retired `/delegate` page: same pure `delegate-desk.ts` model,
 * same 5-lane visual signals. One deliberate change: `MissionCard` opens the
 * mission via the passed-in `onOpen` (Build's existing slide-over) instead of
 * a full-page `<Link>`, since `MissionSlideOver` already fetches any mission
 * by id regardless of which list surfaced it.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDelegateDesk } from "@/lib/delegate-desk.functions";
import type { DeskLane, DeskMission } from "@/lib/delegate-desk";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/supaprod/AutoChip";

const LANE_ACCENT: Record<string, string> = {
  needsYou: "var(--coral, #e11d48)",
  working: "var(--action-blue, #2563eb)",
  awaiting: "var(--ink-faint)",
  done: "var(--emerald, #059669)",
  attention: "var(--amber, #d97706)",
};

function ProgressDots({ done, total }: { done: number; total: number }) {
  if (total === 0) return <span style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>-</span>;
  // Cap the rendered dots so a long plan stays one tidy row.
  const shown = Math.min(total, 12);
  const filled = Math.round((done / total) * shown);
  return (
    <span
      style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
      aria-label={`${done} of ${total} steps done`}
    >
      {Array.from({ length: shown }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 99,
            background: i < filled ? "var(--ink)" : "var(--hairline)",
          }}
        />
      ))}
      <span
        className="tabular-nums"
        style={{ fontSize: 10.5, color: "var(--ink-faint)", marginLeft: 4 }}
      >
        {done}/{total}
      </span>
    </span>
  );
}

function MissionCard({ m, onOpen }: { m: DeskMission; onOpen: (missionId: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(m.id)}
      className="loom-press transition-colors hover:[background-color:var(--hover)] hover:[border-color:var(--hairline-strong)]"
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "1px solid var(--hairline)",
        borderRadius: 10,
        padding: "11px 13px",
        background: "var(--surface-card)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, lineHeight: 1.3 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          {stripAutoPrefix(m.title) || "Untitled mission"}
        </span>
        {isAutoTitle(m.title) ? <AutoChip /> : null}
      </div>
      {m.goal ? (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-subtle)",
            marginTop: 3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {m.goal}
        </div>
      ) : null}
      <div style={{ marginTop: 8 }}>
        <ProgressDots done={m.progress.done} total={m.progress.total} />
      </div>
    </button>
  );
}

function LaneColumn({
  lane,
  onOpenMission,
}: {
  lane: DeskLane;
  onOpenMission: (id: string) => void;
}) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 99,
            background: LANE_ACCENT[lane.id] ?? "var(--ink-faint)",
          }}
        />
        <h2 style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          {lane.label}
        </h2>
        <span className="tabular-nums" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
          {lane.missions.length}
        </span>
      </div>
      <p style={{ fontSize: 11, color: "var(--ink-faint)", margin: "0 0 10px" }}>{lane.blurb}</p>
      {lane.missions.length === 0 ? (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-faint)",
            fontStyle: "italic",
            padding: "4px 0",
          }}
        >
          Nothing here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lane.missions.map((m) => (
            <MissionCard key={m.id} m={m} onOpen={onOpenMission} />
          ))}
        </div>
      )}
    </section>
  );
}

export function DelegateBoard({ onOpenMission }: { onOpenMission: (id: string) => void }) {
  const fGet = useServerFn(getDelegateDesk);
  const query = useQuery({ queryKey: ["delegate-desk"], queryFn: () => fGet() });
  const desk = query.data?.desk;

  if (query.isPending) {
    // Skeleton matching the loaded lane grid (never a bare text placeholder).
    return (
      <div role="status" style={{ padding: "16px 0" }}>
        <span className="sr-only">Reading the desk…</span>
        <div
          aria-hidden="true"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 22,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 120,
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
        <p style={{ fontSize: 13, color: "var(--rose)", margin: 0 }}>
          Could not load the desk. {(query.error as Error)?.message}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            marginTop: 10,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-subtle)",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          Retry · rereads the desk
        </button>
      </div>
    );
  }
  if (!desk) return null;

  return (
    <>
      <p style={{ fontSize: 13.5, color: "var(--ink)", margin: "4px 0 22px" }}>{desk.summary}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 22,
          alignItems: "start",
        }}
      >
        {desk.lanes.map((lane) => (
          <LaneColumn key={lane.id} lane={lane} onOpenMission={onOpenMission} />
        ))}
      </div>
    </>
  );
}
