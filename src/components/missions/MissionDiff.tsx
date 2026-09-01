// D4b — the rich side-by-side mission checkpoint-diff surface.
//
// Rendered on a REPLAY mission (one that carries `replayed_from_mission_id`). It
// fetches the original via the existing `getMission` (RLS-scoped, same caller),
// runs the pure `diffMissions`, and shows what the replay changed: the metric
// columns (hops / cost / tokens / tool calls / duration) with signed deltas, the
// per-hop output drift, and the headline "the answer changed". Calm by default
// (engine-room doctrine): neutral ink + directional glyphs carry the signal, no
// celebration colour; `--rose` only when the replay regressed on failures. A
// fetch error names its cause with a retry (the panel is user-invoked); only a
// loaded-but-missing original degrades silent.
//
// THE COLOUR LAYER IS MERIDIAN NOW, 2026-08-23: --text-faint/-subtle/-body,
// --madder and --hairline were the retired palette's grounds; each maps onto
// Meridian's ladder (--mrd-faint, -mute, -body, -fail, -line) at the same
// perceptual job, so nothing moved visually that was not already wrong. The
// retry left `.btn btn-ghost btn-sm` for Meridian's `Action` by the answers/M10
// tier test: re-reading is work the surface does, not something it unblocks,
// so default face and never Approve.
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MonoLabel } from "@/components/supaprod/Primitives";
import { Action } from "@/components/meridian/surface-parts";
import { getMission, type MissionDetail } from "@/lib/missions.functions";
import { LOOM_CARD } from "@/components/studio/studio-ui";
import { diffMissions } from "@/lib/mission-diff";

function fmtCost(n: number): string {
  return n > 0 && n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}
function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}
function fmtDur(ms: number | null): string {
  if (ms === null) return "-";
  const s = Math.round(ms / 1000);
  return s < 90 ? `${s}s` : `${(s / 60).toFixed(1)}m`;
}

/** A signed delta chip; `down` = the desirable direction for this metric (for the rose-on-regression cue only). */
function Delta({
  value,
  render,
  desirable,
}: {
  value: number;
  render: (n: number) => string;
  desirable?: "lower" | "higher" | "neutral";
}) {
  if (value === 0) {
    return (
      <span style={{ color: "var(--mrd-faint)" }} title="No change">
        ·
      </span>
    );
  }
  const up = value > 0;
  const glyph = up ? "▲" : "▼";
  // Only colour a genuine regression (more cost / more failures than the original);
  // everything else stays calm neutral and lets the number speak.
  const regressed = (desirable === "lower" && up) || (desirable === "higher" && !up) ? true : false;
  return (
    <span
      style={{
        color: regressed ? "var(--mrd-fail)" : "var(--mrd-body)",
        whiteSpace: "nowrap",
      }}
    >
      {glyph} {render(Math.abs(value))}
    </span>
  );
}

function MetricRow({
  label,
  original,
  replay,
  delta,
}: {
  label: string;
  original: string;
  replay: string;
  delta: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr 0.9fr 0.7fr",
        gap: "var(--geist-space-2x)",
        alignItems: "baseline",
        padding: "5px 0",
        borderTop: "1px solid var(--mrd-line)",
      }}
    >
      <span style={{ color: "var(--mrd-mute)" }}>{label}</span>
      <span style={{ color: "var(--mrd-body)", fontVariantNumeric: "tabular-nums" }}>
        {original}
      </span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{replay}</span>
      <span style={{ textAlign: "right" }}>{delta}</span>
    </div>
  );
}

export function MissionDiff({
  current,
  counterpartId,
}: {
  /** The REPLAY mission currently on screen. */
  current: MissionDetail;
  /** The ORIGINAL mission id (`replayed_from_mission_id`). */
  counterpartId: string;
}) {
  const fGet = useServerFn(getMission);
  const q = useQuery({
    queryKey: ["mission", counterpartId],
    queryFn: () => fGet({ data: { missionId: counterpartId } }),
    staleTime: 30_000,
  });

  if (q.isLoading) {
    return (
      <div style={{ ...LOOM_CARD, padding: "var(--card-pad)" }}>
        <MonoLabel>comparing with the original…</MonoLabel>
      </div>
    );
  }
  // An error never hides (state audit 2026-07-12): the user explicitly asked
  // for this comparison, so a silent vanish is a dead end. Name the cause,
  // offer retry. A loaded-but-missing original still degrades silent below.
  if (q.isError) {
    return (
      <div style={{ ...LOOM_CARD, padding: "var(--card-pad)" }}>
        <MonoLabel style={{ color: "var(--mrd-fail)" }}>Couldn't load the original</MonoLabel>
        <p style={{ color: "var(--mrd-mute)", margin: "6px 0 0" }}>
          {(q.error as Error)?.message?.slice(0, 160) ??
            "The original mission could not be fetched."}
        </p>
        <Action variant="default" onClick={() => q.refetch()} className="mt-mrd-4">
          Retry · reloads the original
        </Action>
      </div>
    );
  }
  // Degrade silent: a missing/forbidden original renders nothing, never a broken panel.
  if (!q.data) return null;

  const diff = diffMissions(q.data, current);
  const driftHops = diff.hops.filter(
    (h) => h.presence !== "both" || h.outputChanged || !h.sameAgent,
  );

  return (
    <div style={{ ...LOOM_CARD, padding: "var(--card-pad)" }}>
      <MonoLabel style={{ marginBottom: 4 }}>replay vs original · what changed</MonoLabel>

      {diff.finalOutputChanged ? (
        <p style={{ color: "var(--mrd-body)", margin: "0 0 10px" }}>
          The final answer changed between the two runs.
        </p>
      ) : (
        <p style={{ color: "var(--mrd-mute)", margin: "0 0 10px" }}>
          The final answer is unchanged; the run shape may still differ below.
        </p>
      )}

      {/* Column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr 0.9fr 0.7fr",
          gap: "var(--geist-space-2x)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--mrd-mute)",
          paddingBottom: 2,
        }}
      >
        <span />
        <span>Original</span>
        <span>Replay</span>
        <span style={{ textAlign: "right" }}>Δ</span>
      </div>

      <MetricRow
        label="Hops"
        original={fmtNum(diff.original.hopCount)}
        replay={fmtNum(diff.replay.hopCount)}
        delta={<Delta value={diff.deltas.hopCount} render={fmtNum} desirable="neutral" />}
      />
      <MetricRow
        label="Cost"
        original={fmtCost(diff.original.costUsd)}
        replay={fmtCost(diff.replay.costUsd)}
        delta={<Delta value={diff.deltas.costUsd} render={fmtCost} desirable="lower" />}
      />
      <MetricRow
        label="Tokens in"
        original={fmtNum(diff.original.tokensIn)}
        replay={fmtNum(diff.replay.tokensIn)}
        delta={<Delta value={diff.deltas.tokensIn} render={fmtNum} desirable="neutral" />}
      />
      <MetricRow
        label="Tokens out"
        original={fmtNum(diff.original.tokensOut)}
        replay={fmtNum(diff.replay.tokensOut)}
        delta={<Delta value={diff.deltas.tokensOut} render={fmtNum} desirable="neutral" />}
      />
      <MetricRow
        label="Tool calls"
        original={fmtNum(diff.original.toolCalls)}
        replay={fmtNum(diff.replay.toolCalls)}
        delta={<Delta value={diff.deltas.toolCalls} render={fmtNum} desirable="neutral" />}
      />
      <MetricRow
        label="Failed tool calls"
        original={fmtNum(diff.original.toolCallsFailed)}
        replay={fmtNum(diff.replay.toolCallsFailed)}
        delta={<Delta value={diff.deltas.toolCallsFailed} render={fmtNum} desirable="lower" />}
      />
      <MetricRow
        label="Duration"
        original={fmtDur(diff.original.durationMs)}
        replay={fmtDur(diff.replay.durationMs)}
        delta={
          diff.deltas.durationMs === null ? (
            <span style={{ color: "var(--mrd-faint)" }}>-</span>
          ) : (
            <Delta value={diff.deltas.durationMs} render={fmtDur} desirable="lower" />
          )
        }
      />

      {/* Per-hop drift */}
      {driftHops.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <MonoLabel style={{ marginBottom: 4 }}>hops that differ</MonoLabel>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {driftHops.map((h) => (
              <li
                key={h.index}
                style={{
                  color: "var(--mrd-mute)",
                  padding: "3px 0",
                }}
              >
                <span style={{ color: "var(--mrd-body)" }}>
                  Hop {h.index + 1}
                  {h.agentSlug ? ` · ${h.agentSlug}` : ""}
                </span>{" "}
                {h.presence === "original-only"
                  ? "ran only in the original"
                  : h.presence === "replay-only"
                    ? "ran only in the replay"
                    : !h.sameAgent
                      ? "ran a different agent"
                      : h.outputChanged
                        ? "produced a different output"
                        : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ color: "var(--mrd-mute)", marginTop: 10 }}>
          Every hop matched the original step for step.
        </p>
      )}
    </div>
  );
}
