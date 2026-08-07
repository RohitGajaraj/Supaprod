import { trackLandingEvent } from "@/lib/landing.functions";
import { getLandingSessionKey } from "@/lib/landing-session";
import { MarkGlint } from "./MarkGlint";

/**
 * Beat 1 - Hero. Monumental register (founder ruling 2026-07-15): the
 * headline on the left, the mark backlit at center like an eclipse, a mono
 * spec column on the right. No product frame above the fold; the product
 * shows itself one scroll down in the walkthrough.
 * Ink-and-metal: white light only behind the mark, ember on the primary CTA
 * and on exactly one word. Entrances are pure CSS so SSR paints complete
 * without JavaScript.
 *
 * Craft pass 2026-07-25 (founder review, points 1, 2, 9, 10):
 * 1. Hierarchy. One brightest object (the claim line, white Pixel), a clear
 *    second (the ember audience word and the ember CTA), everything else
 *    recedes through zinc-400 / 500 / 600. The verb line steps down 10px in
 *    size so scale carries the demotion, not colour alone.
 * 2. Dead space. The section was min-h-[100dvh] with pt-24 / pb-16, which
 *    parked the block roughly 149px below the fixed nav on a 900px viewport.
 *    Now min-h-[92svh] with pt-[92px] / pb-[124px]: the top padding clears
 *    the 57px nav with 35px of air, and the bottom pad is the larger of the
 *    two so the block sits optically high in the space it owns (~81px of
 *    visible gap under the nav on the same viewport).
 * 9. The spec column's three payload phrases warm to ember on their OWN hover,
 *    one at a time. This is a deliberate founder override of the old rule
 *    here ("ember is never a hover state", which killed the .hero-verb tint
 *    for dressing non-interactive words as affordances). Asked for twice and
 *    explicitly: first the tint, then "individually when I hover on it, the
 *    key impact message should only change the colour to ember, not all
 *    three" (2026-07-25). An intermediate version lit the whole column from
 *    any one hover and was rejected. Do not "restore" either older
 *    behaviour; the current one is the ruling.
 *
 *    What keeps it honest: the phrases carry no underline, no pointer cursor
 *    and no focus ring, so the tint reads as the line answering the pointer
 *    rather than as a link. The affordance law is respected in the signals
 *    that actually promise a click, which these do not send.
 *
 *    Extended the same day to the headline's loop line: "builds it. ships it.
 *    grades it. gets sharper." are four separate hover targets on the same
 *    terms. Same rule, same reason, same ban on lighting them as a group.
 * 10. One left rule for the whole page. The hero was max-w-6xl / px-6 while
 *    every section below it is max-w-5xl / px-4, so the eye entered at two
 *    different x positions. The hero now shares the page rule, and every
 *    block inside it is left aligned at every breakpoint (it used to flip
 *    from centre to left at lg).
 *
 * Craft pass 2026-07-25b (founder review, one ember not two):
 * A. ONE ember word above the fold, and it is "product managers". The hero
 *    used to tint three words ember (both nouns in the audience line, plus
 *    "Agents" opening the support paragraph) on top of the ember CTA fill.
 *    Four accents in one viewport is the everything-is-important failure: the
 *    eye ping-pongs and nothing lands. Colour now marks the NEW information,
 *    which is who this is for, the one thing the page never said before.
 *    "agents" is already carried by the headline's size and Pixel face, so it
 *    does not need hue as well; it steps down to zinc-400 and the support
 *    paragraph opens in plain body colour. No hashtag on the audience line:
 *    this page's credibility rests on receipts, and a hashtag reads as social
 *    styling.
 * B. The right-hand spec column loses its vertical hairline (founder: "one
 *    strip line that needs to be eliminated"). Three left-aligned mono lines
 *    with a shared indent already read as a column, and the rule was a second
 *    hard vertical edge sitting inside the mark's eclipse glow, competing
 *    with it for the same piece of the viewport. The indent stays so nothing
 *    reflows and the column keeps its gutter off the mark.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] items-center px-4 pt-[92px] pb-[124px]">
      <style>{`
        @keyframes heroRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFade { from { opacity: 0; } to { opacity: 1; } }
        .hero-rise { animation: heroRise 0.9s cubic-bezier(0.23, 1, 0.3, 1) both; }
        .hero-cta {
          transition: background-color 0.2s cubic-bezier(0.23, 1, 0.32, 1),
                      transform 0.15s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .hero-cta:active { transform: scale(0.98); }
        .hero-quiet { transition: color 0.2s cubic-bezier(0.23, 1, 0.32, 1); }
        .hero-arrow { transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); }
        .hero-cta:focus-visible,
        .hero-quiet:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 4px #FF6B2C;
        }
        .hero-spec-key { color: #d4d4d8; transition: color 0.2s ease; }
        .hero-loop-verb { transition: color 0.2s ease; }
        @media (hover: hover) and (pointer: fine) {
          .hero-cta:hover { background-color: #ff8344; }
          .hero-quiet:hover { color: #ffffff; }
          .hero-cta:hover .hero-arrow,
          .hero-quiet:hover .hero-arrow { transform: translateX(2px); }
          /* One phrase at a time. Founder 2026-07-25, explicit and repeated:
             hovering the column must NOT warm all three together, only the
             phrase under the pointer. See note 9. */
          .hero-spec-key:hover,
          .hero-loop-verb:hover { color: #FF6B2C; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-spec-key,
          .hero-loop-verb { transition: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-rise { animation: heroFade 0.5s cubic-bezier(0.23, 1, 0.32, 1) both; }
          .hero-arrow { transition: none; }
          .hero-cta:active { transform: none; }
        }
      `}</style>

      {/* Grain: fixed, pointer-events-none, barely there */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" aria-hidden>
        <svg width="100%" height="100%">
          <filter id="noise-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" />
          </filter>
          <rect width="100%" height="100%" fill="#ffffff" filter="url(#noise-filter)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.12fr_auto_0.6fr] lg:gap-8">
          {/* Mobile: the mark, left aligned on the same rule as the text so
              the eye enters at one x position on every device. */}
          <div className="hero-rise relative mb-4 flex justify-start lg:hidden">
            <div
              className="pointer-events-none absolute left-[48px] top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 42%, transparent 68%)",
              }}
              aria-hidden
            />
            <MarkGlint size={96} />
          </div>

          {/* Left: the claim */}
          <div className="text-left">
            {/* Who it is for, and the two actors, each in its own voice.
                "agents" used to sit at plain zinc-400, which said nothing. It
                now carries machine blue, the colour the replay and the 80%
                stat already use for the machine (founder asked 2026-07-25
                whether it should be marked too, and the page's own palette
                already had the answer). One line, two colours, and the
                reader learns the page's colour language before the headline:
                ember is the human, blue is the machine. The connectives stay
                at zinc-600 so only the two nouns carry hue. */}
            <p
              className="hero-rise mb-5 font-mono text-[11px] uppercase text-zinc-600 md:text-[12px]"
              style={{ animationDelay: "0ms", letterSpacing: "0.14em" }}
            >
              For <span className="font-medium text-[#FF6B2C]">product managers</span> who ship with{" "}
              <span className="font-medium" style={{ color: "#6cb0f5" }}>
                agents
              </span>
            </p>

            <h1
              className="hero-rise mb-7 text-white"
              style={{
                animationDelay: "60ms",
                fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
                fontWeight: 400,
                letterSpacing: "0",
                textWrap: "balance",
              }}
            >
              {/* The one brightest object on the page, and now the largest by
                  a clear margin (founder 2026-07-25: "make it a little bigger
                  so it gets a little highlight"). Only this line grew; the
                  loop line under it deliberately did not. Scaling both would
                  have kept the ratio identical and bought no emphasis at all,
                  so the step between them is what actually widened: at lg it
                  goes from 44/32 to 52/32. */}
              <span className="block text-[34px] leading-[1.14] md:text-[46px] lg:text-[52px]">
                Supaprod tells you what to build.
              </span>
              {/* The loop, a real size step down and two stops darker, so the
                  demotion is carried by scale and colour together. */}
              {/* Each stage of the loop answers the pointer on its own, the
                  same per-item grammar as the spec column opposite (founder
                  2026-07-25). Four separate targets, never lit together. */}
              <span className="mt-3 block text-[21px] leading-[1.3] text-zinc-500 md:text-[28px] lg:text-[32px]">
                then <span className="hero-loop-verb">builds it.</span>{" "}
                <span className="hero-loop-verb">ships it.</span>{" "}
                <span className="hero-loop-verb">grades it.</span>{" "}
                <span className="hero-loop-verb">gets sharper.</span>
              </span>
            </h1>

            {/* ONE WEIGHT, WHOLE SENTENCE (founder 2026-07-25). The tail
                (then "remember, and guide.", now "learn, and guide.") used to
                sit a stop brighter than the
                rest, a leftover from when it was the clause the headline did
                not cover. The founder's objection is the correct one: every
                verb in this sentence matters, so lifting two of them demotes
                the other two for no reason. The whole line is one weight and
                one colour now, lifted from zinc-400 to zinc-300 so nothing was
                dimmed to achieve the match. Hierarchy against the headline is
                carried by size, which is a 52/17 gap and does not need help.

                One line on desktop (founder 2026-07-25). It used to break with
                "the next call." alone on line two, which is a widow, and a
                widow is what actually read as unoptimised.

                Measured, not guessed. In the lg grid this column is exactly
                500px at every desktop width (max-w-5xl caps the container, so
                the number does not drift). At 18px the old sentence needed
                605px, so one line was never possible without cutting words:
                "the next call" went, and "guide" carries it alone, which the
                headline's "gets sharper" and layer 03 both already say.

                The trimmed sentence measures 499px at 18px in a 500px column.
                A 1px margin is not a margin, so lg also drops to 17px and the
                column gains 11px from a tighter gutter. Measured after the
                change: 472px of text in a 511px column, 39px of slack, one
                line. The 48ch cap resolves to 541px at 17px so it never binds
                here; below lg it is what keeps the sentence wrapping sanely on
                a phone, where none of the rest of this applies. */}
            <p
              className="hero-sub hero-rise mb-9 text-base leading-relaxed text-zinc-300 md:text-lg lg:whitespace-nowrap lg:text-[17px]"
              style={{ animationDelay: "120ms", maxWidth: "48ch" }}
            >
              {/*
               * THE MOST-READ SENTENCE WE HAVE, AND IT USED THE BANNED VERB.
               *
               * It read "...ship it, remember, and guide." CLAUDE.md:7 and
               * README.md:45 both ban "remember" outright: a filing cabinet
               * remembers, and storage is not defensible. The vocabulary is the
               * moat, which is why it binds UI copy and not just docs.
               *
               * The page was also arguing with itself. ThreeLayers.tsx, one
               * screen below this, carries the comment "it learns and it
               * guides, it never remembers, stores or logs" and prints "It
               * learns, and it guides." A visitor scrolling from the hero to
               * the mechanism met two different claims about the same layer.
               *
               * WIDTH IS SAFE. The comment above measures this line to 472px of
               * text in a 511px column with 39px of slack, and the whole
               * `lg:whitespace-nowrap` treatment depends on it staying one
               * line. "learn" is two characters SHORTER than "remember", so the
               * sentence can only get slacker, never tighter. The four-beat
               * rhythm is kept: know, ship, learn, guide.
               */}
              Agents that own outcomes. Not just output.
            </p>

            <div
              className="hero-rise flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-7"
              style={{ animationDelay: "180ms" }}
            >
              {/* THIS POINTED AT A DOOR THAT DID NOT NEED TO EXIST.
               *
               * It sent every visitor to #join, the email waitlist. Measured on
               * 2026-08-05: 1,294 landing_visit events and ZERO rows in
               * waitlist_signups. Not a poor rate. Zero.
               *
               * Signup is fully open with auto-confirm, and the product says so
               * on two other surfaces: /pricing offers "Start free" straight to
               * /signup, and /demo says "the beta is open for sign-ups". The
               * home page was the only surface pretending the product was
               * gated, and it is the page a Product Hunt listing sends its
               * entire spike to.
               *
               * A visitor's question at second eight is "can I try this". The
               * nav answered "Sign in", implying accounts exist, and this
               * button answered "wait". That ambiguity at the primary CTA is
               * the whole loss.
               *
               * Nothing is removed: the waitlist form is untouched and still
               * reachable at #join from the closing section. */}
              <a
                href="/signup"
                // text-[var(--cta-ink)], not text-white. White on ember #FF6B2C
                // computes to 2.84:1, which fails WCAG AA for body text (4.5:1)
                // and fails even the 3:1 large-text floor. This is the primary
                // conversion action on the highest-traffic page in the site.
                // --cta-ink is #0a0a0b and exists for exactly this, commented
                // "text on ember fill" at styles.css:2095; it computes to 6.97:1.
                // .btn-primary already does this correctly via
                // --primary-foreground. These landing CTAs bypassed the token.
                className="hero-cta group rounded-full bg-[#FF6B2C] px-8 py-3 font-medium text-[var(--cta-ink)]"
              >
                <span className="flex items-center gap-2">
                  Start free
                  <span className="hero-arrow inline-block" aria-hidden>
                    &rarr;
                  </span>
                </span>
              </a>
              <a
                href="/demo"
                // The session key is read inside the handler, never at render,
                // so SSR paints this link without touching sessionStorage. It
                // comes back undefined if the browser will not give us one, and
                // the event fires anyway with no key attached.
                onClick={() =>
                  void trackLandingEvent({
                    data: { event: "demo_click", sessionKey: getLandingSessionKey() },
                  })
                }
                className="hero-quiet group rounded-sm text-sm text-zinc-400"
              >
                Watch a real run{" "}
                <span className="hero-arrow inline-block" aria-hidden>
                  &rarr;
                </span>
              </a>
            </div>

            {/* The offer sits under the action, not above it. It is a reason
                to click, not a second headline, so it reads quiet. */}
            <p
              className="hero-rise mt-8 text-[13px] leading-relaxed text-zinc-500 md:text-sm"
              style={{ animationDelay: "240ms", maxWidth: "46ch" }}
            >
              {/* "The first 100 get a free teardown" was manufactured scarcity on
                  a thing that is already unlimited: /p/teardown gives anyone a
                  Critic verdict with no signup, capped only at 20 per IP per
                  hour, and this very page links to it. Inventing a queue for
                  something free is the one move a page arguing "receipts, not
                  claims" cannot afford. What replaces it is the true version,
                  which is a better offer anyway: try it before you sign up. */}
              <span className="text-zinc-300">
                <a href="/p/teardown" className="underline underline-offset-4 hover:text-white">
                  Try the Critic first
                </a>
                , no account needed.
              </span>{" "}
              Paste one product bet and it comes back with the risks, the gaps and a verdict in
              about twenty seconds.
            </p>
          </div>

          {/* Center: the mark, backlit like an eclipse (desktop) */}
          <div className="hero-rise relative hidden justify-center lg:flex" aria-hidden={false}>
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.045) 42%, transparent 68%)",
              }}
              aria-hidden
            />
            {/* Fixed position, revolving on its own clock (founder 2026-07-15):
                no pointer drift, the mark holds still and keeps turning. */}
            <MarkGlint size={176} />
          </div>

          {/* Right: the mono spec column, machine-voice register. No rule down
              its left edge (founder 2026-07-25): shared indent, shared
              baseline rhythm and one type register already read as a column,
              and the hairline was competing with the mark's glow. The payload
              phrases sit two stops above their connectives. */}
          {/* Two columns, three rows, never four lines (founder 2026-07-25:
              "put it in three lines, not four"). It used to be a flex stack of
              three sentences, so each row wrapped wherever it ran out of room
              and the payload phrases started at three different x positions.
              The verbs now share an auto-width column and every payload starts
              on one rule, which is what fixes the "positioning and look and
              feel". "while it still matters" lost "still" for the same reason:
              it was the one phrase too wide to hold its line. */}
          <div
            className="hero-spec hero-rise hidden pl-5 font-mono text-[12px] uppercase text-zinc-600 lg:grid lg:grid-cols-[auto_1fr] lg:gap-x-3 lg:gap-y-3.5"
            style={{ animationDelay: "120ms", letterSpacing: "0.14em", lineHeight: 1.5 }}
          >
            <span>to decide</span>
            <span className="hero-spec-key whitespace-nowrap">what to build</span>
            <span>to ship</span>
            <span className="hero-spec-key whitespace-nowrap">while it matters</span>
            <span>to know</span>
            <span className="hero-spec-key whitespace-nowrap">if you were right</span>
          </div>
        </div>
      </div>
    </section>
  );
}
