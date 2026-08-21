// StageTimeline: the per-entity stage history block, one line per transition,
// read from the real stage_events rows via getStageEvents (SEAM-1 read side).
// Honest-empty: history accrues from today (no backfill), so zero events
// renders nothing at all — the section wrapper lives inside this component so
// a host never shows an empty shell. Two variants mirror the two host
// anatomies, no new styling: 'detailkit' wraps the rows in the shared
// DetailSection (spec / opportunity / decision details); 'loom' wraps them in
// the mission surface's LOOM_CARD <section> with its MonoLabel heading.
//
// PORTED TO MERIDIAN 2026-08-18. `--text-body`, `--text-subtle`, `--text-faint`
// and `--hairline` are gone; the rows read `--mrd-body`, `--mrd-mute`,
// `--mrd-faint` and `--mrd-line-soft`, and the timestamp goes through `Num`
// rather than a hand-written `font-family: var(--font-mono)`, so it carries
// `data-num` and tabular figures like every other number in the product.
//
// WHAT IS STILL LEGACY HERE, AND WHOSE IT IS. `MonoLabel`
// (components/supaprod/Primitives) and `LOOM_CARD` (components/studio/studio-ui)
// are the loom variant's host anatomy and belong to the mission surface, and
// `DetailSection` is DetailKit's. Both are named rather than reached into:
// changing another surface's shell from inside a shared timeline is how one
// port breaks three screens.
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getStageEvents } from "@/lib/stage-events.functions";
import { DetailSection } from "@/components/discover/DetailKit";
import { relTimeCaps } from "@/components/discover/format";
import { Num } from "@/components/meridian/surface-parts";
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
                borderBottom: i < events.length - 1 ? "1px solid var(--mrd-line-soft)" : "none",
              }}
            >
              <span style={{ color: "var(--mrd-body)" }}>
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
            <span className="text-[13px] text-mrd-prose text-mrd-body">
              {e.from_stage ? `${e.from_stage} -> ${e.to_stage}` : e.to_stage}
            </span>
            {/* THE ACTOR STOPS SHOUTING. It was mono, uppercased, at 0.06em
                tracking: three separate emphases on a name, in the data face,
                on a row whose subject is the transition beside it. An actor is
                a NAME and mono is for data, which is the rule `Num` exists to
                hold -- so the name is plain text at the row's own size and the
                only thing left carrying it is the quiet ink. */}
            <span className="text-[12.5px] text-mrd-mute">{e.actor}</span>
            {/* And the timestamp keeps mono, because that IS data. `Num` rather
                than a hand-rolled font-family, so it carries `data-num` and the
                tabular figures a column of times needs. */}
            <span className="ml-auto text-[12.5px] text-mrd-faint">
              <Num>{relTimeCaps(e.at)}</Num>
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
          className="text-[12.5px] text-mrd-mute underline decoration-dotted underline-offset-2 transition-colors hover:text-mrd-ink hover:decoration-solid"
        >
          See the full chain in the record room
        </Link>
      </div>
    </DetailSection>
  );
}
