/**
 * WHERE THE WORK IS, AND WHAT THE CREW IS DOING WITH IT.
 *
 * THE DEFECT THIS EXISTS TO CLOSE. When a message dispatches work rather than
 * answering, `/api/chat` emits one delta carrying a mission id and then
 * `[DONE]`. From that instant the Ask pane knows a mission exists and nothing
 * else about it, so a person is told work opened and then shown nothing while
 * it happens. A conversational front door whose promise is showing the work
 * cannot end its most important turn by going quiet.
 *
 * `src/lib/ask-sse.ts` now parses three frames that carry the missing facts
 * (`station`, `tool`, `landing`) and `use-ask-stream.ts` accumulates them into
 * `work`. This is the surface that reads them. AS OF 2026-08-20 AND 2026-08-22 BOTH ARE EMITTED -- `station` on the
 * `@`-mention dispatch, `tool` from the research phases and the chat branch's
 * workspace search. On a turn that dispatches nothing and searches nothing this
 * component renders nothing on every turn the product serves today; it costs
 * exactly one null check on an ordinary answer.
 *
 * WHAT IT SAYS, AND THE TWO THINGS IT REFUSES TO SAY.
 *
 *   · THE RAIL is the seven stations, in loop order, with the current one lit.
 *     The stations BEFORE the lit one are drawn no differently, because we do
 *     not know the run passed through them. A frame said where the work IS; it
 *     said nothing about where it has been, and painting the earlier chips as
 *     completed would be the product asserting a history it never observed.
 *   · THE ACTION is `toolActionLabel`, never the raw registry id. A tool the
 *     label table does not know returns null and this says nothing rather than
 *     leaking `prd.draft` at a reader. That is the same degrade-to-silence rule
 *     `ask-sse.ts` applies to a station id it does not recognise.
 *
 * AN UNLIT RAIL IS A REAL ANSWER. With a tool running and no station named, the
 * seven chips still draw with none of them lit, which is Today's settled
 * behaviour for the shell spine: a null station is not a missing value, it is
 * the strip saying you are not standing on a station.
 *
 * ON THE STYLING. Every rule here is an inline style object referencing the
 * `--sp-*` tokens, which is an established pattern in this codebase (see
 * `ChangesPanel.tsx`, `IntegrationsTab.tsx`, `AskTurn.tsx`), and it is used
 * here because this lane may not edit a stylesheet. No literal colour and no
 * literal size appears below: the tokens carry both, so this inherits the light
 * and dark palettes and the type ramp without restating either.
 *
 * The names are at the SAME size the shell's own spine strip draws them
 * (`--sp-text-prose`), and the rail wraps to a second line on a narrow pane
 * rather than shrinking the type or truncating a station's name. The ratchet
 * forbids answering a width problem by making the surface worse, and all seven
 * names are the one thing on this line that must survive.
 */

import * as React from "react";
import {
  AGENT_STATIONS,
  AGENT_STATION_ORDER,
  toolActionLabel,
  type AgentStation,
} from "@/lib/agent-vocabulary";
import { stageHueForStation } from "@/components/shell/agent-glyphs";

/** "drafting a spec" -> "Drafting a spec". The label is a phrase; this line
 *  reads as a sentence, and a lower-case opening reads as a bug. */
function opened(phrase: string): string {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

const wrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-space-2)",
  // Tinted, never bordered: the ground changes so this reads as its own
  // region without adding a second bordered box to a pane that already has one.
  background: "var(--sp-lift)",
  borderRadius: "var(--sp-radius-card)",
  padding: "var(--sp-space-3)",
};

const rail: React.CSSProperties = {
  display: "flex",
  // Wraps rather than scrolls or truncates. A horizontal scroller would hide
  // half the product's mental model behind a scrollbar on the narrowest pane,
  // which is the exact trade `shell.css` rejected for the full-width strip.
  flexWrap: "wrap",
  columnGap: "var(--sp-space-3)",
  rowGap: "var(--sp-space-1)",
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const chip: React.CSSProperties = {
  fontSize: "var(--sp-text-prose)",
  lineHeight: "var(--sp-leading-tight)",
  // The bar is drawn on every chip and only coloured on the lit one, so the
  // rail's height does not change as the work moves and the pane never nudges
  // under someone who is reading it.
  borderBottom: "2px solid transparent",
  paddingBottom: "2px",
  transition: "color var(--sp-dur-fast) var(--sp-ease)",
};

const say: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-space-2)",
  margin: 0,
  fontSize: "var(--sp-text-meta)",
  lineHeight: "var(--sp-leading-tight)",
  color: "var(--sp-body)",
};

const dot: React.CSSProperties = {
  flex: "none",
  width: "6px",
  height: "6px",
  borderRadius: "50%",
};

export function AskWorkLine({
  station,
  tools,
}: {
  /** The station the work is at, or null when no frame has named one. */
  station: AgentStation | null;
  /** Registry tool names seen this turn, oldest first. The line reads the
   *  latest; the rest are the trail, kept so a future step list can draw it
   *  without changing this contract. */
  tools: readonly string[];
}) {
  const action = toolActionLabel(tools[tools.length - 1]);

  // Nothing known, nothing drawn. This is the ordinary-answer path and it must
  // stay free: an answer that dispatched no work pays one comparison for a
  // surface it never shows.
  if (!station && !action) return null;

  // Build is the anchor when the station is unknown, matching the fallback the
  // stylesheet already uses everywhere `--sp-hue` is unset.
  const hue = station ? stageHueForStation(station) : "var(--sp-stage-build)";

  return (
    <div style={wrap}>
      <ol style={rail} aria-label="Where this work is in the loop">
        {AGENT_STATION_ORDER.map((id) => {
          const lit = id === station;
          return (
            <li
              key={id}
              style={{
                ...chip,
                // Colour is never the only signal: the lit chip also takes the
                // weight and the bar, so the rail survives greyscale.
                color: lit ? "var(--sp-ink)" : "var(--sp-mute)",
                fontWeight: lit ? "var(--sp-weight-medium)" : "var(--sp-weight-regular)",
                borderBottomColor: lit ? stageHueForStation(id) : "transparent",
              }}
              aria-current={lit ? "step" : undefined}
            >
              {AGENT_STATIONS[id].name}
            </li>
          );
        })}
      </ol>
      {action ? (
        // `aria-live` sits on the words, so the change is announced once when
        // the crew moves on rather than the whole region being re-read.
        <p style={say} aria-live="polite">
          <span aria-hidden="true" style={{ ...dot, background: hue }} />
          {opened(action)}
        </p>
      ) : null}
    </div>
  );
}
