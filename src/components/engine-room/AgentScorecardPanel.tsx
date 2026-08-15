// RPT-37: the cross-vendor agent scorecard. "The agent org chart, with
// receipts." Lives in the Engine Room "Team" tab (Safety room), below TrustDial,
// operator-facing only. Automates the tier list operators hand-build: per agent,
// its approve rate, outcome hit rate, and revert count, plus a per-task-type
// (tool_name) breakdown. Honest: a metric with no decided history is hidden, not
// shown as a hollow 0/0; and per-vendor (native vs BYO) grading is deliberately
// NOT claimed here, because the call-level vendor signal (ai_events.via) has no
// agent join yet (see the footnote).
//
// 2026-08-15: PORTED TO MERIDIAN, and the agent's own hue went with it. The name
// used to be painted in `agentMark(slug).hue`, a per-agent colour, and the mark
// beside it carried the same. That encoding was retired by founder ruling on
// 2026-08-15 (written into meridian/station-glyphs.tsx): colour carries STATUS
// in this product and nothing else, so a rainbow of agent hues spends the whole
// palette on identity and leaves a reader unable to tell "Draft is amber
// because it is Draft" from "Draft is amber because something is stuck there".
// The glyph still says which agent it is, which is what it was drawn for, and
// it survives greyscale on its own.

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
import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { AGENT_STATIONS, agentDisplayName, agentStation } from "@/lib/agent-vocabulary";
import { Action, Eyebrow, Reading } from "./EngineChrome";

const MAX_TOOLS_SHOWN = 4;

function pct(fraction: number | null): string | null {
  return fraction == null ? null : `${Math.round(fraction * 100)}%`;
}

/** A grayscale-safe rate: the percent, a thin meter, and the raw a/b, or "no
 *  history yet". The meter is a NEUTRAL fill rather than a graded one, because
 *  nobody has set a threshold that says which approve rate is good. */
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
    <div className="min-w-[128px] flex-[1_1_128px]">
      <Eyebrow>{label}</Eyebrow>
      {p == null ? (
        <p className="mt-mrd-2 text-[12.5px] text-mrd-faint">no history yet</p>
      ) : (
        <>
          <div className="mt-mrd-2 flex items-baseline gap-mrd-3">
            <span className="font-mrd-mono text-[13px] font-medium text-mrd-ink tabular-nums">
              {p}
            </span>
            <span className="font-mrd-mono text-[11.5px] text-mrd-mute tabular-nums">{detail}</span>
          </div>
          <div className="mt-mrd-2 h-[3px] overflow-hidden rounded-full bg-mrd-line">
            <div
              className="h-full rounded-full bg-mrd-body"
              style={{ width: `${Math.round((fraction ?? 0) * 100)}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

/** The per-task-type breakdown, as colourless chips. A task type is a CATEGORY,
 *  never a status, so it carries no hue: spending one here is what makes a real
 *  status unreadable everywhere else on the panel. */
function ToolChips({ tools }: { tools: ToolRecord[] }) {
  if (tools.length === 0) return null;
  const shown = tools.slice(0, MAX_TOOLS_SHOWN);
  const extra = tools.length - shown.length;
  return (
    <div className="mt-mrd-4 flex flex-wrap items-center gap-mrd-3">
      {shown.map((t) => (
        <span
          key={t.tool_name}
          title={`${t.tool_name}: approved ${t.approved} of ${t.total}`}
          className="inline-flex items-center gap-mrd-3 rounded-mrd-chip border border-mrd-line bg-mrd-sink px-2 py-0.5 text-[12px] text-mrd-body"
        >
          <span className="text-mrd-mute">{t.tool_name}</span>
          <span className="font-mrd-mono tabular-nums">
            {Math.round((t.approved / t.total) * 100)}%
          </span>
        </span>
      ))}
      {/* A CAP PRINTS ITS REAL NUMBER, because a reader cannot know they are
          missing something otherwise. */}
      {extra > 0 ? <span className="text-[12px] text-mrd-faint">+{extra} more</span> : null}
    </div>
  );
}

function ScorecardRow({ card }: { card: AgentScorecard }) {
  const station = agentStation(card.slug);
  const stationLabel = station ? AGENT_STATIONS[station].name : null;
  const Glyph = glyphForSlug(card.slug);
  return (
    <div className="border-t border-mrd-line-soft py-mrd-5 first:border-0">
      <div className="flex items-center gap-mrd-4">
        <span
          aria-hidden
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-mrd-chip border border-mrd-line bg-mrd-sink text-mrd-mute [&>svg]:size-3.5"
        >
          <Glyph />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-mrd-ink">{agentDisplayName(card.slug)}</div>
          {stationLabel ? <div className="text-[12px] text-mrd-mute">{stationLabel}</div> : null}
        </div>
        {card.reverts > 0 ? (
          <span
            title="Times a human rewound this agent's shipped work"
            className="ml-auto shrink-0 rounded-mrd-chip border border-mrd-line px-2 py-0.5 text-[12px] text-mrd-mute"
          >
            <span className="font-mrd-mono tabular-nums">{card.reverts}</span>{" "}
            {card.reverts === 1 ? "rewind" : "rewinds"}
          </span>
        ) : null}
      </div>

      <div className="mt-mrd-5 flex flex-wrap gap-mrd-6">
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
      data-mrd=""
      className="rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-5 shadow-mrd-card"
    >
      <Eyebrow>Track record, by agent and task type</Eyebrow>
      <p className="mt-mrd-3 max-w-[62ch] text-[12.5px] leading-relaxed text-mrd-mute">
        The tier list, kept for you: how often each agent&rsquo;s work is approved and how often it
        turns out right, per task type. Only decided history counts, so a fresh agent shows nothing
        rather than a hollow score.
      </p>

      {/* Reading, failed and empty stay three separate facts. The failure says
          we do not know rather than that nothing is there, and it is the only
          one of the three that carries a way out. */}
      {query.isLoading ? (
        <div className="mt-mrd-5">
          <Reading>Reading the record.</Reading>
        </div>
      ) : query.isError ? (
        <div className="mt-mrd-5 flex flex-wrap items-center gap-mrd-4">
          <span className="text-[13px] text-mrd-fail">Could not load the scorecard.</span>
          <Action onClick={() => void query.refetch()}>Try again</Action>
        </div>
      ) : cards.length === 0 ? (
        <p className="mt-mrd-5 max-w-[62ch] text-[13px] leading-relaxed text-mrd-body">
          No decided history yet. Track records appear here as you approve, reject, or rewind what
          the agents do.
        </p>
      ) : (
        <div className="mt-mrd-4">
          {cards.map((card) => (
            <ScorecardRow key={card.slug} card={card} />
          ))}
        </div>
      )}

      <p className="mt-mrd-5 max-w-[68ch] border-t border-mrd-line-soft pt-mrd-4 text-[12px] leading-relaxed text-mrd-mute">
        Grades reuse the same decided-judgment record shown in the trust dial above, so the numbers
        agree. Per-vendor grading (native vs a BYO model) is not shown yet: the call-level vendor
        signal is not joined to an agent in the data today, so claiming it would be a guess.
      </p>
    </section>
  );
}
