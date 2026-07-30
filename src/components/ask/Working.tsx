/**
 * THE LINE THAT SAYS SOMETHING IS HAPPENING.
 *
 * Founder ruling, 2026-07-30: *"when the user has asked and the agent is
 * working, a constant message should be going on, like Claude Code shows
 * waiting for background, running this task, discovering. Only for this section
 * you can use the orange text, with a gradient flow from left to right."* And,
 * on seeing the first cut sit still on one word: *"it should not be just
 * Working. It should be changing... one icon just changing the shapes, and next
 * to that a message displaying and shimmering gradient effect."*
 *
 * So it is three things that are one thing: OUR MARK, turning · THE VERB,
 * shimmering · HOW LONG IT HAS BEEN, counting.
 *
 * HOW IT CHANGES WITHOUT EVER LYING, which is the whole difficulty.
 * The obvious build is a carousel of "Discovering", "Thinking", "Consulting the
 * record" on a four second timer. That is what most products ship and it is a
 * lie told at four second intervals: the plain chat path in `/api/chat`
 * (`researchMode === "chat"`) emits no progress events at all, so on that path
 * every one of those words would be invented. A person who waits on this line
 * has to be able to trust it when it finally says something specific.
 *
 * Everything that moves here is therefore something that genuinely changed:
 *   · THE VERB changes when the SERVER says it did. `/api/chat` streams real
 *     progress (`{status:{phase,label}}`) built from work it actually performed:
 *     "Searching: <the query>", "Reading 4 sources", "Reading your workspace",
 *     "Synthesizing answer". Those arrive in sequence and are shown verbatim,
 *     because a label the server wrote is a fact and a paraphrase is a guess.
 *   · WITH NO EVENT the vocabulary is two words wide and both are observed:
 *     nothing has come back yet -> "Working"; tokens are landing -> "Writing the
 *     answer". That is the entire list.
 *   · THE SECONDS tick regardless, and that is the honest source of constant
 *     change the founder is asking for. An elapsed count is a fact that really
 *     is different every second, so the line is never frozen even on the chat
 *     path where the server has nothing to report. It is also the number a
 *     person actually wants while waiting.
 *   · THE MARK turns continuously. It carries no information, which is fine:
 *     it is the "something is alive" channel, and it is the brand doing it.
 *
 * WHY THE BRAND MARK AND NOT A SPINNER. Founder, same message: the logo should
 * be here "in fitting fashion", and it must be the REAL one with the ember core
 * rather than a mock. `SupaprodMark animated` is that mark: seven petals for the
 * seven loop stages, energy flowing along the curve, and the Brain+Pulse core
 * pulsing at the centre. It already pauses under `prefers-reduced-motion`.
 */

import * as React from "react";
import type { ResearchStatus } from "@/components/chat/ResearchActivity";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";

/**
 * The verb, from the most trustworthy source that has anything to say.
 *
 * Exported for the test: "never invent a status" is the kind of rule that
 * decays into a carousel six months later unless something asserts it.
 */
export function workingLabel(status: ResearchStatus | null, hasContent: boolean): string {
  if (status?.label.trim()) return status.label.trim();
  return hasContent ? "Writing the answer" : "Working";
}

/** Whole seconds since the answer was asked for. Coarse on purpose: a
 *  millisecond counter is a stopwatch, and nobody is timing us to that. */
function useElapsed(): number {
  const startedAt = React.useRef(Date.now());
  const [now, setNow] = React.useState(startedAt.current);
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((now - startedAt.current) / 1000));
}

export function Working({
  status,
  hasContent,
}: {
  /** The last real progress event off the stream, or null on the chat path. */
  status: ResearchStatus | null;
  /** Tokens have started landing in the answer. Observed, not guessed. */
  hasContent: boolean;
}) {
  const seconds = useElapsed();
  return (
    <div className="sp-working">
      {/* Decorative here: the sentence beside it already says what is going on,
          and the mark's own "Supaprod is working" label would say it twice. */}
      <span className="sp-working-mark" aria-hidden="true">
        <SupaprodMark size={15} animated strokeWidth={4} glow={false} />
      </span>
      {/* `aria-live` sits on the WORDS, not the row, so a screen reader hears
          the verb when it changes and is not read a new number every second. */}
      <span className="sp-working-say" aria-live="polite">
        {workingLabel(status, hasContent)}
      </span>
      {/* Under a second there is no number worth showing, and "0s" reads as
          broken. It appears once there is genuinely something to report. */}
      {seconds > 0 ? <span className="sp-working-since">{seconds}s</span> : null}
    </div>
  );
}
