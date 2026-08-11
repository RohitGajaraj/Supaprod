/**
 * THE WAY IN, AS ROWS THAT CAN BE READ.
 *
 * WHAT IT REPLACES, AND WHY. `SuggestionMarquee` was three rows of travelling
 * capsules, and the capability inside it was right: it showed the breadth of
 * what Ask can do, every offer came from a real workspace read, and one press
 * ran it. What it could not do was let anybody READ the offers. A capsule is
 * `white-space: nowrap` and capped at 300px, so in a 392px pane every sentence
 * longer than about forty characters was ellipsised, and the two ends of each
 * row were cut mid-word by the strip's own mask. Measured in a browser at
 * 1280px on 2026-08-11, standing on Decide: "d this bet pay off?", "Did this b"
 * and "at did we learn the last time we tried this?" were all on screen at once,
 * and because four prompts were dealt round robin into three rows, the copies a
 * seamless loop needs put "Did this bet pay off?" on screen TWICE at the same
 * moment. A suggestion nobody can read is not a suggestion, and a duplicated one
 * reads as a rendering fault.
 *
 * WHAT THE REFERENCE SET ACTUALLY DOES, looked at rather than remembered
 * (Mobbin, web, 2026-08-11). Nobody uses a capsule for a sentence. Every
 * command surface with grouped suggestions uses a FULL-WIDTH ROW under a quiet
 * section label: Magnific, Mistral, Vapi, Juicebox and StackAI all do, and Vapi
 * and StackAI additionally print the AREA each row belongs to on the row itself
 * ("Monitors - Observe", "Integrations - Build"). The narrow rails do the same:
 * StackAI's agent panel is about this pane's width and lets its suggestions wrap
 * to three lines rather than clip. Capsules survive in that set only where the
 * text is a VERB FRAGMENT, never a sentence: Fabric's "Summarize" and "List
 * points", Copilot's "Get advice", Lindy's "Lead gen". Nothing this pane offers
 * is a verb fragment, so nothing here is a capsule.
 *
 * SO THE THREE RULES THIS OBEYS.
 *   1. NOTHING IS CLIPPED. A row wraps. No nowrap, no max-width, no mask, no
 *      ellipsis. Fewer offers fully read beats more offers half shown.
 *   2. NOTHING MOVES. The motion existed to imply "there is more than you can
 *      see", which a stationary list of everything does not need to imply. It
 *      also cost the marquee its own worst problem: asking a person to click a
 *      moving target. The block still scrolls, with the pane, which is the one
 *      scroller this surface has.
 *   3. EVERY ROW SAYS WHAT IT WILL DO. The heading says whether pressing
 *      anything under it gets an answer or starts a run, and the row carries
 *      the station it comes out of. See ask-suggestions.ts for why neither of
 *      those is a guess.
 *
 * WHAT IS UNCHANGED, because it was never the problem: the offers are the same
 * objects from the same reads, a press still lands the whole sentence in the
 * composer rather than sending it, and a grounded offer still carries the live
 * blue dot the shell uses for work in motion.
 */

import * as React from "react";
import type { Starter } from "@/lib/ask-starters";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { stageHueForStation } from "@/components/shell/agent-glyphs";
import { groupSuggestions, stationForStarter } from "./ask-suggestions";

/**
 * WHICH STATION THIS CAME OUT OF, and it is the founder's own sentence made
 * visible: *"Here you can do everything out of those seven stations."*
 *
 * It wears its stage hue, which is the hue that station already owns everywhere
 * else in the shell, so the tag is recognised rather than learned. Tinted and
 * never filled: a suggestion is not a state, and the four status colours have to
 * stay louder than seven stage families. No ember anywhere near it. Ember means
 * "waiting on you" and a suggestion is waiting on nobody.
 */
function StationTag({ station }: { station: AgentStation }) {
  return (
    <span
      className="sp-suggest-station"
      style={{ ["--sp-suggest-hue" as string]: stageHueForStation(station) }}
    >
      {AGENT_STATIONS[station].name}
    </span>
  );
}

function SuggestionRow({
  item,
  station,
  onPick,
}: {
  item: Starter;
  station: AgentStation | null;
  onPick: (prompt: string) => void;
}) {
  return (
    <button
      type="button"
      className="sp-suggest-row"
      data-kind={item.kind}
      /* THE NAME IS THE SENTENCE IT INSERTS, not the fragments on screen. A
         grounded row reads visually as "Ship SSO login for Beacon" above "What
         is the crew doing on it?", which is right for the eye and wrong for the
         ear: spoken as one run, "it" has no antecedent for somebody who cannot
         see the layout. The label says exactly what the press will put in the
         box. The station tag is deliberately outside it: it is orientation for
         the eye, and reading it aloud inside the sentence would corrupt the
         sentence. */
      aria-label={item.prompt}
      onClick={() => onPick(item.prompt)}
    >
      <span className="sp-suggest-body">
        {item.subject ? (
          <span className="sp-suggest-subject">
            {item.kind === "running" ? <span className="sp-chip-dot" aria-hidden="true" /> : null}
            {item.subject}
          </span>
        ) : null}
        <span className="sp-suggest-q">{item.question}</span>
      </span>
      {station ? <StationTag station={station} /> : null}
    </button>
  );
}

export function SuggestionRail({
  items,
  scopeKind,
  scopeLabel,
  onPick,
}: {
  /** Already grounded. This component never invents one and never pads. */
  items: Starter[];
  /** The two inputs `contextualStarters` used, so the station a row shows is
   *  read off the same switch that chose the row. */
  scopeKind: string | null;
  scopeLabel: string;
  /** A press puts the whole sentence in the composer, where it continues. */
  onPick: (prompt: string) => void;
}) {
  const groups = React.useMemo(() => groupSuggestions(items), [items]);
  if (groups.length === 0) return null;

  return (
    <div className="sp-suggest" data-testid="ask-suggestions">
      {groups.map((group) => {
        /* A grounded row names a real mission, and a mission row carries no
           station of its own (`MissionListRow`), so it gets the run's real name
           and the live dot rather than a tag we would have had to guess at. Only
           the capability lines are tagged, because only for them is the station
           derivable. */
        const stations = group.items.map((item) =>
          item.kind === "use-case" ? stationForStarter(item, scopeKind, scopeLabel) : null,
        );
        /**
         * ONE TAG WHERE THERE IS ONE ANSWER, AND THIS WAS WRONG ON FIRST BUILD.
         *
         * Seen in a browser at 1280px on 2026-08-11, standing on a decision: the
         * rail printed four rows each wearing its own "Decide" pill, in a column,
         * saying the same word four times. A per-row tag earns its place by
         * DISTINGUISHING rows, which is exactly what Vapi and StackAI use theirs
         * for; repeated down a group it is not information, it is texture that
         * costs the row a third of its width.
         *
         * So the tag hoists. Where every row in a group comes out of one station
         * it is said once, on the heading, and the rows get the width back. Where
         * they genuinely differ, which is the workspace default set drawn from
         * across the loop, it stays on the row where it is doing work. The test
         * of whether a label belongs beside a heading or beside a row is whether
         * it varies, and this asks that question rather than guessing at it.
         */
        const shared = stations[0] && stations.every((s) => s === stations[0]) ? stations[0] : null;
        return (
          <section className="sp-suggest-group" key={group.id} aria-label={group.label}>
            <div className="sp-suggest-head">
              <span className="sp-suggest-label">{group.label}</span>
              {shared ? <StationTag station={shared} /> : null}
              {group.note ? <span className="sp-suggest-note">{group.note}</span> : null}
            </div>
            {group.items.map((item, i) => (
              <SuggestionRow
                key={item.prompt}
                item={item}
                station={shared ? null : stations[i]}
                onPick={onPick}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
