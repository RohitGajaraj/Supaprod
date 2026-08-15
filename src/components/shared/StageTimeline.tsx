// StageTimeline: the per-entity stage history block, one line per transition,
// read from the real stage_events rows via getStageEvents (SEAM-1 read side).
// Honest-empty: history accrues from today (no backfill), so zero events
// renders nothing at all — the section wrapper lives inside this component so
// a host never shows an empty shell. Two variants mirror the two host
// anatomies, no new styling: 'detailkit' wraps the rows in the shared
// DetailSection (spec / opportunity / decision details); 'loom' wraps them in
// the mission surface's LOOM_CARD <section> with its MonoLabel heading.
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getStageEvents } from "@/lib/stage-events.functions";
import { DetailSection } from "@/components/discover/DetailKit";
import { relTimeCaps } from "@/components/discover/format";
import { MonoLabel } from "@/components/supaprod/Primitives";
import { LOOM_CARD } from "@/components/studio/studio-ui";

/** The entity kinds the stage_events read side accepts (getStageEvents). */
export type StageEntityType =
  "spec" | "mission" | "opportunity" | "theme" | "decision" | "goal" | "loop";

export interface StageTimelineProps {
  entityType: StageEntityType;
  entityId: string;
  variant?: "detailkit" | "loom";
}

/** The mission surface's time idiom (fmtStarted in MissionOrchestratorDetail,
 * module-private there): "Today HH:MM" or "Mon D HH:MM". */
function fmtAt(iso: string): string {
  const d = new Date(iso);
  const hm = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return d.toDateString() === new Date().toDateString()
    ? `Today ${hm}`
    : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${hm}`;
}

export function StageTimeline({ entityType, entityId, variant = "detailkit" }: StageTimelineProps) {
  const fGetStageEvents = useServerFn(getStageEvents);
  const eventsQuery = useQuery({
    queryKey: ["stage-events", entityType, entityId],
    queryFn: () => fGetStageEvents({ data: { entityType, entityId } }),
  });

  const events = eventsQuery.data?.events ?? [];
  if (events.length === 0) return null;

  if (variant === "loom") {
    return (
      <section style={{ ...LOOM_CARD, padding: "var(--card-pad)", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <MonoLabel>Stage history</MonoLabel>
          <span className="mono-label tabular-nums">
            {events.length} transition{events.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {events.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                gap: "var(--geist-space-3x)",
                alignItems: "baseline",
                padding: "8px 0",
                borderBottom: i < events.length - 1 ? "1px solid var(--hairline)" : "none",
              }}
            >
              <span style={{ color: "var(--text-body)" }}>
                {e.from_stage ? `${e.from_stage} -> ${e.to_stage}` : e.to_stage}
              </span>
              <span className="mono-label" style={{}}>
                {e.actor}
              </span>
              <span className="mono-label tabular-nums" style={{ marginLeft: "auto" }}>
                {fmtAt(e.at)}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <DetailSection heading="Stage history">
      <div style={{ display: "grid", gap: "8px" }}>
        {events.map((e) => (
          <div key={e.id} className="flex items-baseline" style={{ gap: "8px" }}>
            <span style={{ color: "var(--text-body)" }}>
              {e.from_stage ? `${e.from_stage} -> ${e.to_stage}` : e.to_stage}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-subtle)",
              }}
            >
              {e.actor}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                color: "var(--text-faint)",
              }}
            >
              {relTimeCaps(e.at)}
            </span>
          </div>
        ))}
      </div>
      {/* SW-6 (mission 3.13 SEE IT): one click from any artifact into the
          receipts trail. The inline rows above show THIS entity's chain; the
          ledger shows the machine's whole decision/action record. */}
      <div style={{ marginTop: "10px" }}>
        <Link
          to="/engine-room"
          search={{ room: "record" }}
          style={{
            color: "var(--text-subtle)",
            textDecoration: "none",
          }}
        >
          See the full chain in the record room
        </Link>
      </div>
    </DetailSection>
  );
}
