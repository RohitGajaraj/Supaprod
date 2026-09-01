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
import { Action, Eyebrow, Reading } from "@/components/meridian/surface-parts";

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
        <p className="mt-mrd-2 text-mrd-label text-mrd-faint">no history yet</p>
      ) : (
        <>
          <div className="mt-mrd-2 flex items-baseline gap-mrd-3">
            <span className="font-mrd-mono text-mrd-base font-medium text-mrd-ink tabular-nums">
              {p}
            </span>
            <span className="font-mrd-mono text-mrd-data text-mrd-mute tabular-nums">{detail}</span>
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
 *  status unreadable everywhere else on the panel.
 *
 *  NAMED `ToolApprovalChips`, AND THE LONGER NAME IS THE ACCURATE ONE. What a row
 *  here carries is an APPROVAL RATE per tool, how often a person let that tool run,
 *  which is a fact about trust and not a record of calls. Anything named for tools
 *  and chips alone promises the calls themselves, so a reader would arrive at a
 *  scorecard expecting a stream. Renamed 2026-08-20; keep the longer name. */
function ToolApprovalChips({ tools }: { tools: ToolRecord[] }) {
  if (tools.length === 0) return null;
  const shown = tools.slice(0, MAX_TOOLS_SHOWN);
  const extra = tools.length - shown.length;
  return (
    <div className="mt-mrd-4 flex flex-wrap items-center gap-mrd-3">
      {shown.map((t) => (
        <span
          key={t.tool_name}
          title={`${t.tool_name}: approved ${t.approved} of ${t.total}`}
          className="inline-flex items-center gap-mrd-3 rounded-mrd-chip border border-mrd-line bg-mrd-sink px-2 py-0.5 text-mrd-prose text-mrd-body"
        >
          <span className="text-mrd-mute">{t.tool_name}</span>
          <span className="font-mrd-mono tabular-nums">
            {Math.round((t.approved / t.total) * 100)}%
          </span>
        </span>
      ))}
      {/* A CAP PRINTS ITS REAL NUMBER, because a reader cannot know they are
          missing something otherwise. */}
      {extra > 0 ? <span className="text-mrd-small text-mrd-faint">+{extra} more</span> : null}
    </div>
  );
}

function ScorecardRow({ card }: { card: AgentScorecard }) {
  const station = agentStation(card.slug);
  const stationLabel = station ? AGENT_STATIONS[station].name : null;
  const Glyph = glyphForSlug(card.slug);
  return (
    <div className="py-mrd-5">
      <div className="flex items-center gap-mrd-4">
        <span
          aria-hidden
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-mrd-chip border border-mrd-line bg-mrd-sink text-mrd-mute [&>svg]:size-3.5"
        >
          <Glyph />
        </span>
        <div className="min-w-0">
          <div className="text-mrd-base font-medium text-mrd-ink">
            {agentDisplayName(card.slug)}
          </div>
          {stationLabel ? <div className="text-mrd-small text-mrd-mute">{stationLabel}</div> : null}
        </div>
        {card.reverts > 0 ? (
          <span
            title="Times a human rewound this agent's shipped work"
            className="ml-auto shrink-0 rounded-mrd-chip border border-mrd-line px-2 py-0.5 text-mrd-small text-mrd-mute"
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

      <ToolApprovalChips tools={card.byTool} />
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
      {/*
       * THE THREE PARAGRAPHS IN THIS CARD SHARE ONE RIGHT EDGE, and until
       * 2026-09-01 they had three, because each capped itself in `ch` and `ch`
       * is FONT-RELATIVE -- it is the width of the "0" glyph at the element's
       * own size. Measured on this card: 62ch at `text-mrd-label` (12.5px) is
       * ~427px, 62ch at `text-mrd-prose` (14px) is ~477px, and the footnote's
       * 68ch at `text-mrd-small` (12px) is ~449px. So the block with the
       * BIGGEST ch number wrapped narrower than the one above it, and on
       * Safety > Who can act the card read as three mis-indented columns
       * inside one border.
       *
       * `.mrd-read` (meridian.css:2631) is the fix the system already carries,
       * and its own comment names this exact case: "a column that holds prose,
       * a heading and a field together" -- those have different natural
       * measures and something has to pick ONE. It caps at `--mrd-read-max`,
       * 42rem, which is a ROOT-relative measure and therefore identical at
       * every type size in the card. It is applied per paragraph rather than
       * as one wrapper on purpose: a wrapper would also clamp the scorecard
       * rows between them, and their rate stats are laid out against the full
       * card width.
       */}
      <p className="mrd-read mt-mrd-3 text-mrd-label leading-mrd-prose text-mrd-mute">
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
          <span className="text-mrd-base text-mrd-fail">Could not load the scorecard.</span>
          <Action onClick={() => void query.refetch()}>Try again</Action>
        </div>
      ) : cards.length === 0 ? (
        <p className="mrd-read mt-mrd-5 leading-mrd-prose text-mrd-prose text-mrd-body">
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

      <p className="mrd-read mt-mrd-5 border-t border-mrd-line-soft pt-mrd-4 text-mrd-small leading-mrd-prose text-mrd-mute">
        Grades reuse the same decided-judgment record shown in the trust dial above, so the numbers
        agree. Per-vendor grading (native vs a BYO model) is not shown yet: the call-level vendor
        signal is not joined to an agent in the data today, so claiming it would be a guess.
      </p>
    </section>
  );
}
