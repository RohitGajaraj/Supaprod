// RPT-37: the cross-vendor agent scorecard. "The agent org chart, with
// receipts." Lives in the Engine Room "Team" tab (Safety room), below TrustDial,
// operator-facing only. Automates the tier list operators hand-build: per agent,
// its approve rate, outcome hit rate, and revert count, plus a per-task-type
// (tool_name) breakdown. Honest: a metric with no decided history is hidden, not
// shown as a hollow 0/0; and per-vendor (native vs BYO) grading is deliberately
// NOT claimed here, because the call-level vendor signal (ai_events.via) has no
// agent join yet (see the footnote).

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAgentScorecard } from "@/lib/agent-scorecard.functions";
import {
  acceptanceRate,
  outcomeHitRate,
  type AgentScorecard,
  type ToolRecord,
} from "@/lib/agent-scorecard";
import { formatOutcomeRecord, formatTrackRecord } from "@/lib/agent-track-record";
import { MonoLabel } from "@/components/supaprod/Primitives";
import { AgentMark } from "@/components/agents/AgentMark";
import { AGENT_STATIONS, agentDisplayName, agentMark, agentStation } from "@/lib/agent-vocabulary";

const MAX_TOOLS_SHOWN = 4;

function pct(fraction: number | null): string | null {
  return fraction == null ? null : `${Math.round(fraction * 100)}%`;
}

/** A grayscale-safe rate: the percent, a thin meter, and the raw a/b, or "no history yet". */
function RateStat({
  label,
  fraction,
  detail,
}: {
  label: string;
  fraction: number | null;
  detail: string | null;
}) {
  const p = pct(fraction);
  return (
    <div style={{ minWidth: 128, flex: "1 1 128px" }}>
      <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-subtle)" }}>{label}</div>
      {p == null ? (
        <div style={{ color: "var(--text-subtle)", marginTop: 3 }}>no history yet</div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              marginTop: 3,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p}</span>
            <span style={{ color: "var(--text-subtle)" }}>{detail}</span>
          </div>
          <div
            style={{
              height: 3,
              borderRadius: 999,
              background: "var(--hairline)",
              overflow: "hidden",
              marginTop: 5,
            }}
          >
            <div
              style={{
                width: `${Math.round((fraction ?? 0) * 100)}%`,
                height: "100%",
                background: "var(--text-body)",
                borderRadius: 999,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ToolChips({ tools }: { tools: ToolRecord[] }) {
  if (tools.length === 0) return null;
  const shown = tools.slice(0, MAX_TOOLS_SHOWN);
  const extra = tools.length - shown.length;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {shown.map((t) => (
        <span
          key={t.tool_name}
          title={`${t.tool_name}: approved ${t.approved} of ${t.total}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 8px",
            borderRadius: 999,
            border: "1px solid var(--hairline)",
            color: "var(--text-body)",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-subtle)" }}>
            {t.tool_name}
          </span>
          {Math.round((t.approved / t.total) * 100)}%
        </span>
      ))}
      {extra > 0 ? (
        <span style={{ color: "var(--text-subtle)", alignSelf: "center" }}>+{extra} more</span>
      ) : null}
    </div>
  );
}

function ScorecardRow({ card }: { card: AgentScorecard }) {
  const { hue } = agentMark(card.slug);
  const station = agentStation(card.slug);
  const stationLabel = station ? AGENT_STATIONS[station].name : null;
  return (
    <div
      style={{
        padding: "14px 0",
        borderTop: "1px solid var(--hairline)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <AgentMark slug={card.slug} size={26} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 560, color: hue }}>{agentDisplayName(card.slug)}</div>
          {stationLabel ? (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-subtle)",
              }}
            >
              {stationLabel}
            </div>
          ) : null}
        </div>
        {card.reverts > 0 ? (
          <span
            title="Times a human rewound this agent's shipped work"
            style={{
              marginLeft: "auto",
              color: "var(--text-subtle)",
              border: "1px solid var(--hairline)",
              borderRadius: 999,
              padding: "3px 9px",
            }}
          >
            {card.reverts} {card.reverts === 1 ? "rewind" : "rewinds"}
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 12 }}>
        <RateStat
          label="Approve rate"
          fraction={acceptanceRate(card.approve)}
          detail={formatTrackRecord(card.approve)}
        />
        <RateStat
          label="Outcome hit rate"
          fraction={outcomeHitRate(card.outcome)}
          detail={formatOutcomeRecord(card.outcome)}
        />
      </div>

      <ToolChips tools={card.byTool} />
    </div>
  );
}

export function AgentScorecardPanel() {
  const fScorecard = useServerFn(getAgentScorecard);
  const query = useQuery({
    queryKey: ["agent-scorecard"],
    queryFn: () => fScorecard(),
  });

  const cards = query.data?.scorecards ?? [];

  return (
    <section
      style={{
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        background: "var(--card)",
        boxShadow: "var(--shadow-elevated)",
        padding: "18px 20px",
      }}
    >
      <MonoLabel>Track record, by agent and task type</MonoLabel>
      <p style={{ color: "var(--text-subtle)", marginTop: 6, maxWidth: 560 }}>
        The tier list, kept for you: how often each agent's work is approved and how often it turns
        out right, per task type. Only decided history counts, so a fresh agent shows nothing rather
        than a hollow score.
      </p>

      {query.isLoading ? (
        <div style={{ color: "var(--text-subtle)", marginTop: 16 }}>Reading the record...</div>
      ) : query.isError ? (
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--text-body)" }}>Could not load the scorecard.</span>
          <button
            type="button"
            onClick={() => void query.refetch()}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid var(--hairline)",
              background: "transparent",
              color: "var(--text-body)",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : cards.length === 0 ? (
        <div style={{ color: "var(--text-subtle)", marginTop: 16, lineHeight: 1.5 }}>
          No decided history yet. Track records appear here as you approve, reject, or rewind what
          the agents do.
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          {cards.map((card) => (
            <ScorecardRow key={card.slug} card={card} />
          ))}
        </div>
      )}

      <p
        style={{
          color: "var(--text-subtle)",
          lineHeight: 1.5,
          marginTop: 16,
          borderTop: "1px solid var(--hairline)",
          paddingTop: 12,
        }}
      >
        Grades reuse the same decided-judgment record shown in the trust dial above, so the numbers
        agree. Per-vendor grading (native vs a BYO model) is not shown yet: the call-level vendor
        signal is not joined to an agent in the data today, so claiming it would be a guess.
      </p>
    </section>
  );
}
