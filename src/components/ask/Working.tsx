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
 * THE FLAVOUR WORDS, and the exact line they are not allowed to cross.
 *
 * Founder, 2026-07-30: *"the message should not be just plain Working, writing
 * the answer, reading your workspace. Can we keep it something like how Claude
 * Code uses? They use some random words, but still that's something appealing.
 * Something is getting cooked, something is brewing in the background."*
 *
 * This looks like it contradicts "never invent a status" and it does not, on a
 * distinction worth stating precisely:
 *
 *   AN EFFORT WORD IS NOT AN OPERATION CLAIM. Nobody reads "Simmering" and
 *   concludes that a subsystem called simmer is running. They read it as "still
 *   going". But "Searching the web", "Reading your workspace" or "Consulting
 *   the record" are checkable assertions about capabilities that may not have
 *   run at all: on the plain chat path (`researchMode === "chat"`) no retrieval
 *   and no web search happen, so printing either would be a straight lie, and
 *   the person cannot tell which of the two kinds of word they are looking at.
 *
 * So the rule this file enforces is: THE FALLBACK MAY DESCRIBE EFFORT, NEVER AN
 * OPERATION. Every word below is intransitive and names no capability. The
 * moment the server tells us what it actually did, its words win outright.
 *
 * There is a test asserting no operation verb ever enters this list, because
 * "Searching" is exactly the word a future edit will reach for.
 */
const EFFORT_WORDS = [
  "Working",
  "Thinking it through",
  "Brewing",
  "Simmering",
  "Percolating",
  "Turning it over",
  "Mulling it over",
  "Warming up",
] as const;

/** How long one flavour word holds before the next. Long enough to read, short
 *  enough that the line is visibly alive on a slow answer. */
const WORD_MS = 3800;

/**
 * The verb, from the most trustworthy source that has anything to say.
 *
 * Exported with `tick` so it stays pure and the vocabulary rule is testable:
 * "never invent a status" is the kind of rule that quietly decays six months
 * later unless something asserts it.
 */
export function workingLabel(status: ResearchStatus | null, hasContent: boolean, tick = 0): string {
  // 1. What the server actually did. Specific, checkable, always wins.
  if (status?.label.trim()) return status.label.trim();
  // 2. What we can see for ourselves. Also specific, also true.
  if (hasContent) return "Writing the answer";
  // 3. We genuinely do not know yet, so: effort, never an operation.
  return EFFORT_WORDS[Math.abs(Math.trunc(tick)) % EFFORT_WORDS.length];
}

/** Exported for the test that guards the vocabulary. */
export const WORKING_EFFORT_WORDS: readonly string[] = EFFORT_WORDS;

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

/** Which flavour word is up. Starts somewhere random so two answers in a row do
 *  not open on the same word and read as a canned animation. */
function useWordTick(): number {
  const [tick, setTick] = React.useState(() => Math.floor(Math.random() * 997));
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), WORD_MS);
    return () => clearInterval(id);
  }, []);
  return tick;
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
  const tick = useWordTick();
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
        {workingLabel(status, hasContent, tick)}
      </span>
      {/* Under a second there is no number worth showing, and "0s" reads as
          broken. It appears once there is genuinely something to report. */}
      {seconds > 0 ? <span className="sp-working-since">{seconds}s</span> : null}
    </div>
  );
}
