import { useEffect, useRef, useState } from "react";
import { PixelStat } from "@/components/supaprod/PixelStat";

/**
 * The exhibit's shared parts. Both columns are painted from these, verbatim,
 * so a per-column exception has nowhere to hide: the last version drifted
 * precisely because each side was styled by hand.
 */
const EXHIBIT_LABEL = "mb-4 block font-mono text-[11px] uppercase text-zinc-500";
const EXHIBIT_LABEL_STYLE = { letterSpacing: "0.2em" } as const;
const EXHIBIT_SOURCE = "not-italic mt-4 block font-mono text-[10.5px] uppercase text-zinc-600";
const EXHIBIT_SOURCE_STYLE = { letterSpacing: "0.12em" } as const;

const TYPED_WORD = "Devs";

/**
 * The loop's clock. Erasing is faster than typing because that is how a person
 * at a keyboard actually behaves: deleting is held backspace, typing is not.
 * The hold is the long beat, so the finished word is what the eye rests on for
 * most of the cycle and the motion stays at the edge of attention rather than
 * demanding it. One full cycle is roughly 2.9s.
 */
const TYPE_MS = 120;
const ERASE_MS = 65;
const HOLD_MS = 1500;
const GAP_MS = 420;
const START_MS = 260;

/** What the Decisions row types into its empty cell.
 *
 * Every other row names WHERE that craft lives. This one answers the same
 * question honestly: decisions live in chat and in people's heads. It states a
 * situation, it does not blame a vendor, which is the standing rule for naming
 * Slack on this page. It deliberately does not repeat the status column's
 * "no home": the cell answers where, the status answers what that means. */
const MISSING_ANSWER = "Slack threads, your memory";

/**
 * Named complimentarily, as the AI-native home of that craft (founder ruling
 * 2026-07-25). No superiority claim, no partnership implied, nothing untrue.
 * Decisions is the one row with an empty cell: it reads as an absence.
 *
 * Rows corrected 2026-07-25 (founder): v0 and Lovable generate UI CODE, not
 * design, so they moved up to Code and Design is Figma and Framer, the two
 * tools that are actually the home of that craft. Code being visibly the most
 * crowded row is the point, not a flaw: every craft is crowded and Decisions
 * has nobody. Names only, never logos - a name is nominative fair use, a logo
 * is a trademark whose guidelines forbid third-party use that implies
 * partnership, and names set in mono read as a spec list rather than a
 * jumble of mismatched brand weights.
 */
const CRAFT_HOMES: { craft: string; tools: string | null; status: string }[] = [
  { craft: "Code", tools: "Claude Code, Cursor, Codex, v0, Lovable", status: "agent-run" },
  { craft: "Design", tools: "Figma, Framer", status: "agent-assisted" },
  { craft: "Docs", tools: "Notion AI, Gemini", status: "agent-assisted" },
  { craft: "Work", tools: "Linear, Jira", status: "system of record" },
  { craft: "Decisions", tools: null, status: "no home" },
];

/**
 * Beat 2 - The gap. The page's single sanctioned typography-only moment
 * (plan section 4.4): three lines, zero boxes, scale doing the design work.
 * Only the word "Devs" types itself behind the terminal prompt (founder
 * 2026-07-15); everything else reveals like every other beat. The product
 * line gets no prompt on purpose: product has no terminal yet. SSR ships the
 * full text; reduced motion skips the typing.
 *
 * Craft pass 2026-07-25 (founder review, points 3, 4, 5):
 * 3. The typing beat. Two carets used to live here and neither behaved: the
 *    headline caret ran a soft opacity pulse on a loop that typed, erased and
 *    retyped forever, and the Decisions cell held an ember caret that blinked
 *    for eternity and never typed a character. Now there is exactly one
 *    caret. It types "Devs" once, at 120ms per character, when the section
 *    scrolls into view, blinks on a hard steps(1) terminal beat while it
 *    works, then leaves. The invisible sizer still holds the final width so
 *    the line never reflows. Reduced motion renders the finished word with
 *    no caret at all.
 * 4. The ledger. The rows were a flex-wrap pile with a 180px minimum on the
 *    tools cell, so they ragged and wrapped instead of using the width. They
 *    are a real three-column grid now (108px craft / fluid tools / 132px
 *    right-set status), one line per craft at every size above 640px, with
 *    every column edge landing on the same rule. The Decisions row is the
 *    payoff: the only ember row, and its empty cell is a dashed hollow slot
 *    so the eye lands on the hole rather than on a word.
 * 5. The two pieces of evidence sat one under the other with the right half
 *    of the section empty. They are a two-column pair from 768px up (the
 *    quote a human said, the number a study measured) and only stack below.
 */
export function TheGap() {
  const [inView, setInView] = useState(false);
  const [typed, setTyped] = useState(TYPED_WORD);
  const [typing, setTyping] = useState(false);
  // The second beat: the hole types its own answer (founder 2026-07-25).
  // An earlier pass removed the Decisions caret on the grounds that "a caret
  // with nothing left to type is a tease". Correct diagnosis, wrong cure: the
  // fix is to give it something to type, not to take the caret away. This is
  // the punchline of the whole table, so it should arrive by being written.
  // SSR ships the finished string; the run only starts once in view.
  const [slotTyped, setSlotTyped] = useState(MISSING_ANSWER);
  const [slotTyping, setSlotTyping] = useState(false);
  // The hole gets exactly one run, ever. The headline loops forever, so
  // without this latch every cycle would retrigger it.
  const slotDoneRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  /**
   * The word types itself on a loop, terminal-style, and keeps going (founder
   * 2026-07-25: "constantly, devs was typing on the loop sort of thing").
   *
   * It used to run once and stop. That was a deliberate earlier call, on the
   * grounds that a resting caret is a tease, and it is the wrong call here:
   * this line is the section's thesis, a live terminal is the whole conceit,
   * and a cursor that types once and dies just looks like it broke.
   *
   * ONE CARET, STILL. The rule that the hole below and this word never blink
   * at the same time survives, and the loop is what made it interesting. The
   * cycle is type, hold, erase, gap, repeat, EXCEPT on the very first pass:
   * there it holds, hands the stage to the hole, and pauses outright. The
   * effect re-runs when slotTyping flips back to false and the loop resumes.
   * So during the hole's one run this word shows no caret at all, and after
   * it the hole rests finished while only this word blinks.
   *
   * The chain schedules a single timeout at a time, so clearing the latest one
   * cancels the entire run, including mid-cycle. Reduced motion returns before
   * any of it and leaves the finished word on screen, which is also what SSR
   * ships.
   */
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Paused while the hole writes. Dropping the caret here is what keeps the
    // two from ever blinking together.
    if (slotTyping) {
      setTyping(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const at = (ms: number, fn: () => void) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const typeIn = (i: number) => {
      setTyped(TYPED_WORD.slice(0, i));
      if (i < TYPED_WORD.length) {
        at(TYPE_MS, () => typeIn(i + 1));
        return;
      }
      if (!slotDoneRef.current) {
        at(HOLD_MS, () => {
          slotDoneRef.current = true;
          setSlotTyping(true);
        });
        return;
      }
      at(HOLD_MS, () => eraseOut(TYPED_WORD.length - 1));
    };

    const eraseOut = (i: number) => {
      setTyped(TYPED_WORD.slice(0, i));
      if (i > 0) {
        at(ERASE_MS, () => eraseOut(i - 1));
        return;
      }
      at(GAP_MS, () => typeIn(1));
    };

    setTyped("");
    setTyping(true);
    at(START_MS, () => typeIn(1));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inView, slotTyping]);

  // The hole answers itself. Same terminal grammar as the headline word, and it
  // only starts once that one has finished and released its caret, so exactly
  // one caret is alive on the section at any moment. The dashed slot already
  // reserves its own box, so nothing reflows while the characters land.
  useEffect(() => {
    if (!slotTyping) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const at = (ms: number, fn: () => void) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };
    const step = (i: number) => {
      setSlotTyped(MISSING_ANSWER.slice(0, i));
      if (i < MISSING_ANSWER.length) {
        at(52, () => step(i + 1));
      } else {
        at(900, () => setSlotTyping(false));
      }
    };
    setSlotTyped("");
    at(120, () => step(1));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slotTyping]);

  // One reveal grammar for the whole beat: 16px of travel (not 32, which
  // reads as a slide), a 700ms ease-out curve, and a 60ms stagger between
  // siblings. Reduced motion keeps the fade and drops the travel.
  const revealCls = (extra: string) =>
    `gap-reveal transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
      inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    } ${extra}`;
  const revealDelay = (ms: number) => (inView ? `${ms}ms` : "0ms");

  return (
    <section ref={sectionRef} className="py-32 px-4">
      {/* Opacity only, so nothing paints a new layer or animates a shadow.
          Reduced motion keeps the fade and drops the movement. */}
      <style>{`
        @keyframes gapBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.16; } }
        .gap-caret { animation: gapBlink 1.15s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .gap-caret { animation: none; opacity: 1; }
          .gap-reveal { transform: none !important; transition-property: opacity; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <h2
          className={revealCls(
            "mb-10 text-3xl font-semibold leading-[1.16] text-white md:text-5xl lg:text-[52px]",
          )}
          style={{ transitionDelay: revealDelay(0), letterSpacing: "-0.025em" }}
        >
          {/* nowrap from md up only. On a phone this line is 516px of text in
              a 358px column, so the hard nowrap was pushing the whole page
              into horizontal scroll. The invisible sizer below is what stops
              the typed word from reflowing, not this, so wrapping is free. */}
          <span className="block md:whitespace-nowrap">
            <span className="mr-3 font-mono text-zinc-500" aria-hidden>
              &gt;
            </span>
            {/* The invisible copy holds the width; the typed overlay fills it,
                so the rest of the line never shifts. */}
            <span className="relative inline-block" aria-label={TYPED_WORD}>
              <span className="invisible" aria-hidden>
                {TYPED_WORD}
              </span>
              <span className="absolute left-0 top-0" aria-hidden>
                {typed}
                {/* Thin caret bar, not the block glyph: it fits inside the
                    word space so it never overlaps the next word. */}
                {typing && (
                  <span
                    className="gap-caret"
                    style={{
                      display: "inline-block",
                      width: "0.07em",
                      height: "0.72em",
                      marginLeft: "0.05em",
                      background: "#a1a1aa",
                      verticalAlign: "-0.02em",
                    }}
                  />
                )}
              </span>
            </span>{" "}
            got agents that ship real code.
          </span>
          {/* No prompt glyph here on purpose: product has no terminal yet. */}
          <span className="block">
            <span
              style={{
                fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
                fontWeight: 400,
                letterSpacing: "0",
                color: "#FF6B2C",
              }}
            >
              Product
            </span>{" "}
            is still waiting for its own.
          </span>
        </h2>

        <p
          className={revealCls("mb-5 font-mono text-[11px] uppercase text-zinc-500 md:text-[12px]")}
          style={{ transitionDelay: revealDelay(60), letterSpacing: "0.14em" }}
        >
          Every craft got its AI-native home
        </p>

        {/* The ledger of homes. Every tool here is named as the home of its
            craft, which is what it is. One row has an empty cell, and that
            absence is the whole argument.

            Sized down twice on 2026-07-25 (founder: "that table can be a
            little small in size, it does not require that importance"). It
            started at hero scale: 16px tool names, 18px from md up, spanning
            the full 1024px column. The first pass took it to 13/14px at
            max-w-3xl. This pass finishes the job: 12px tool names flat, a
            10px craft label, a 9.5px status word, tighter rows, and the whole
            ledger capped at max-w-2xl. It is supporting evidence, so it now
            runs at two thirds the measure of the argument above it, and the
            vertical space it gives back pays for the three-layer band below.
            The one thing that did NOT shrink is the hole. */}
        <div className={revealCls("mb-14 max-w-2xl")} style={{ transitionDelay: revealDelay(120) }}>
          {CRAFT_HOMES.map((row) => {
            const missing = row.tools === null;
            return (
              <div
                key={row.craft}
                className={`grid grid-cols-[72px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b sm:grid-cols-[92px_minmax(0,1fr)_116px] ${
                  missing ? "border-[#FF6B2C]/25 py-3.5" : "border-white/[0.06] py-2"
                }`}
              >
                <span
                  className="font-mono text-[10px] uppercase"
                  style={{ letterSpacing: "0.12em", color: missing ? "#FF6B2C" : "#71717a" }}
                >
                  {row.craft}
                </span>
                <span className="text-[12px] leading-snug text-zinc-300">
                  {missing ? (
                    // The hole, drawn. A hollow dashed slot where a tool name
                    // sits on every other row: the eye lands on the absence.
                    // Held at its own height while everything around it got
                    // smaller, because the absence is the argument.
                    // The hole, and then its own answer typed into it. The box
                    // is sized by an invisible sizer holding the finished
                    // string, so the row never reflows as characters land.
                    <span className="relative inline-flex min-h-[1.5em] w-full max-w-[232px] items-center rounded-[3px] border border-dashed border-[#FF6B2C]/45 bg-[#FF6B2C]/[0.045] px-1.5">
                      <span aria-hidden className="invisible whitespace-pre text-[12px]">
                        {MISSING_ANSWER}
                      </span>
                      <span
                        className="absolute left-1.5 right-1.5 whitespace-pre text-[12px]"
                        style={{ color: "#FF6B2C" }}
                      >
                        {slotTyped}
                        {slotTyping ? (
                          <span
                            aria-hidden
                            className="gap-caret ml-[1px] inline-block h-[0.95em] w-[6px] translate-y-[1px] bg-[#FF6B2C]"
                          />
                        ) : null}
                      </span>
                      <span className="sr-only">{MISSING_ANSWER}</span>
                    </span>
                  ) : (
                    row.tools
                  )}
                </span>
                <span
                  className="col-start-2 font-mono text-[9.5px] uppercase sm:col-start-3 sm:text-right"
                  style={{ letterSpacing: "0.12em", color: missing ? "#FF6B2C" : "#52525b" }}
                >
                  {row.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* THE EXHIBIT (rebuilt 2026-07-25, founder: "this is just put for
            namesake, just randomly the text").

            He was right, and the cause was structural rather than cosmetic.
            The comment here used to claim these two were "one argument, one
            row" while the markup made them nothing of the kind: the left was a
            blockquote with a left rule and the right was a bare div with none,
            neither carried a label saying what KIND of evidence it was, and
            the right was nudged with md:pt-1 to fake an alignment the two
            never actually shared. Two leftovers sitting next to each other.

            They are one exhibit now, and both columns are built from the same
            four parts in the same order: a hairline they both start on, a
            label, the payload, the source. That is the anatomy the layers band
            and the run receipts already use, so this reads as the same page.

            The claim they prove was buried inside the right column's first
            sentence ("nobody knows what to build, so teams build on gut"),
            which made that column do two jobs and left the exhibit with no
            stated point. It is the lead-in now: the table above ends on
            "Decisions / no home", this states the consequence, and the two
            columns are its two independent proofs, one human and one counted.

            The 80% was the hardest number on the page set at the size of the
            words around it. It is a PixelStat now, the app's single way to
            render a metric, so the numeric voice matches every other surface.
            Its colour is passed explicitly rather than via tone="blue":
            PixelStat resolves that to var(--action-blue), which the public
            ink theme does not define, so the token would fall back and lose
            the hue. */}
        <p
          className={revealCls("mb-9 text-lg leading-snug text-zinc-400 md:text-xl")}
          style={{ transitionDelay: revealDelay(160) }}
        >
          So teams build on gut.
        </p>

        <div className="grid items-start gap-10 md:grid-cols-2 md:gap-14">
          <blockquote
            className={revealCls("border-t border-white/[0.09] pt-5")}
            style={{ transitionDelay: revealDelay(200) }}
          >
            <span className={EXHIBIT_LABEL} style={EXHIBIT_LABEL_STYLE}>
              What teams say
            </span>
            <p className="text-lg leading-snug text-zinc-300 md:text-2xl">
              &ldquo;So why did we decide on X? Cue hours of finding that Slack conversation from
              months ago.&rdquo;
            </p>
            <cite className={EXHIBIT_SOURCE} style={EXHIBIT_SOURCE_STYLE}>
              {/* The mono caps voice was rendering this as R/PRODUCTMANAGEMENT.
                  A subreddit is lowercase, always, and "r/" is part of the
                  name rather than styling we get to change. Getting a source
                  citation wrong is the one place on a page like this where a
                  reader stops trusting the rest, so the transform is switched
                  off for this token only and the caption keeps its voice. */}
              Top-voted thread, <span className="normal-case">r/ProductManagement</span>, 480 points
            </cite>
          </blockquote>

          <div
            className={revealCls("border-t border-white/[0.09] pt-5")}
            style={{ transitionDelay: revealDelay(260) }}
          >
            <span className={EXHIBIT_LABEL} style={EXHIBIT_LABEL_STYLE}>
              What it costs
            </span>
            <PixelStat
              value="80%"
              glow
              style={{
                display: "block",
                marginBottom: 10,
                fontSize: "clamp(42px, 5.4vw, 62px)",
                color: "#6cb0f5",
              }}
            />
            {/* THE TURN. Founder: "this 80%, how is it adding value having it
                on our platform? Does it make any sense?" Fair, and the stat on
                its own did not earn its place. It is one of the most cited
                numbers in the industry, it appears in every product tool's
                marketing, and a reader has seen it many times before us. Worse,
                bare, it argues for usage analytics, which is not what we sell.

                So the number stays, because it is real, sourced and checkable,
                and the SENTENCE does the work now. The second half converts a
                feature-usage statistic into a decision-quality one, which is
                our actual product: the waste is not that teams build badly, it
                is that nobody could say why a thing was chosen. That is the
                claim layer 01 answers, and it is the argument this page is
                making everywhere else. */}
            <p className="text-lg leading-snug text-zinc-300 md:text-2xl">
              of shipped features are rarely or never used.{" "}
              <span className="text-zinc-500">
                The building was never the problem. The choosing was.
              </span>
            </p>
            <cite className={EXHIBIT_SOURCE} style={EXHIBIT_SOURCE_STYLE}>
              Pendo, across 615 products
            </cite>
          </div>
        </div>
      </div>
    </section>
  );
}
