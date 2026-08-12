// The landing-funnel imports left with the hero's /demo link on 2026-08-12
// (see the CTA row below). The hero's tertiary link is now an in-page anchor
// to the film, and a scroll is not a conversion worth a row: the film section
// fires `film_play` when somebody actually presses play, which is the event
// that means something. `demo_click` still fires from LandingNav and
// LoopWalkthrough, so the funnel keeps that step.
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
 *    grades it. guides the next call." are four separate hover targets on the
 *    same terms. Same rule, same reason, same ban on lighting them as a group.
 *    Each target also carries white-space: nowrap, because a phrase that breaks
 *    across lines splits the thing the pointer lights.
 * 10. One left rule for the whole page. The hero was max-w-6xl / px-6 while
 *    every section below it is max-w-5xl / px-4, so the eye entered at two
 *    different x positions. The hero now shares the page rule, and every
 *    block inside it is left aligned at every breakpoint (it used to flip
 *    from centre to left at lg).
 *
 * Craft pass 2026-07-25b (founder review, one ember not two):
 * A. ONE ember word above the fold. It was "product managers"; since
 *    2026-08-10 it is "agentic-first", because the line it sits in changed job
 *    from naming the audience to naming the category. The rule is unchanged and
 *    is what matters: the hero used to tint three words ember on top of the
 *    ember CTA fill, and four accents in one viewport is the
 *    everything-is-important failure, where the eye ping-pongs and nothing
 *    lands. Colour marks the NEW information, which is now what this product
 *    IS, the one thing the page never said above the fold.
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
        /* The open door (see the note on the CTA row). Outline only, never a
           fill: the ember button stays the one filled object above the fold, so
           this answers "can I see it work" without entering the contest the
           one-accent rule was written to settle. */
        .hero-try {
          transition: border-color 0.2s cubic-bezier(0.23, 1, 0.32, 1),
                      background-color 0.2s cubic-bezier(0.23, 1, 0.32, 1),
                      transform 0.15s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .hero-try:active { transform: scale(0.99); }
        .hero-cta:focus-visible,
        .hero-try:focus-visible,
        .hero-quiet:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 4px #FF6B2C;
        }
        .hero-spec-key { color: #d4d4d8; transition: color 0.2s ease; }
        /* nowrap added 2026-08-10 with the longer fourth verb. Each of these is
           a single hover target, so a line break inside one splits the thing the
           pointer lights: the balanced wrap was putting "grades" and "it." on
           different lines. The phrases are atomic; the line breaks BETWEEN them. */
        .hero-loop-verb { transition: color 0.2s ease; white-space: nowrap; }
        @media (hover: hover) and (pointer: fine) {
          .hero-cta:hover { background-color: #ff8344; }
          .hero-quiet:hover { color: #ffffff; }
          .hero-try:hover {
            border-color: rgba(255, 255, 255, 0.22);
            background-color: rgba(255, 255, 255, 0.055);
          }
          .hero-cta:hover .hero-arrow,
          .hero-try:hover .hero-arrow,
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
          .hero-cta:active,
          .hero-try:active { transform: none; }
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
              // LIFTED 2026-08-10, and this is a legibility failure, not a
              // preference. Measured on the live page against the #0a0a0a
              // ground: zinc-600 is 2.56:1 at 11px. The AA floor for text under
              // 18px is 4.5:1, so the line was a little over half of the
              // required contrast. That is the same 2.56:1 that failed the
              // brief audit, and the same shape as the disclosure that beat 4
              // shipped "engineered not to be read".
              //
              // It mattered more here than it would anywhere else on the page.
              // The only part of this sentence a visitor could actually read
              // was "AGENTIC-FIRST", because ember measures 6.97:1 and passes.
              // The four words carrying the category (operating system for
              // product teams) sat under the floor. The page's one-line answer
              // to "what is this" was the least readable text in the hero.
              //
              // zinc-400 is 7.72:1 and clears it with room. It stays well below
              // the sub (13.4:1) and the headline (19.8:1), so the ladder is
              // intact: this line is now legible without competing for first
              // read. Size goes 11 to 12 (12 to 13 at md) for the same reason,
              // since 11px mono uppercase at 0.14em tracking is small even when
              // the contrast is legal.
              className="hero-rise mb-4 font-mono text-[12px] uppercase text-zinc-400 md:text-[13px]"
              style={{ animationDelay: "0ms", letterSpacing: "0.14em" }}
            >
              {/* "who ship with agents" CAME OUT 2026-08-10, and it was doing
                  real damage for a qualifier nobody would defend on purpose.
                  Two problems, one sentence.

                  IT CONTRADICTED THE NEXT BEAT. TheGap.tsx:343-357, one screen
                  down, is "Devs got agents that ship real code. Product is
                  still waiting for its own." The hero addressed people who
                  already ship with agents; the argument underneath it says
                  product people do not have them yet. A visitor who agrees
                  with beat two has just been told beat one was not for them.

                  IT GATED OUT THE LARGER MOTION. The pitch corpus has led with
                  "Motion 1 Transform: 650K existing teams" since 2026-07-22
                  (docs/strategy/brownfield-positioning-evaluation.md). Those
                  teams are defined by NOT having this yet. A door that admits
                  only the already-agentic is the smaller room.

                  What replaces it names the reader by what they are
                  accountable for, which is true of every PM whether or not
                  they have an agent today, and it sets up the page's own
                  closing line: "Agents do the work. You answer for it."

                  ONE EMBER WORD, restored. The rule at the top of this file
                  says the audience line carries a single ember accent and
                  "agents" steps down, because four accents in a viewport is
                  the everything-is-important failure. "agents" had drifted
                  back to a second tinted noun in blue. The line is one accent
                  again, and it is the audience, which is the new information. */}
              {/* THE CATEGORY LINE, added 2026-08-10 on the founder's ruling,
                  and it REVERSES the landing banned-words entry for "operating
                  system". The reasoning for that ban is in ThreeLayers.tsx and
                  still holds WHERE IT WAS AIMED: under a headline reading "One
                  system, three layers", naming layer 02 "the operating system"
                  is the system inside the system, so layer 02 stays "the loop".

                  This is a different job. Nothing above the fold told a first
                  time visitor what Supaprod IS, only what it does for them.
                  "Supaprod tells you what to build" is a promise without a
                  category, and a reader who cannot file a product cannot
                  recommend it either. This line is the one sentence that
                  answers "what is this", and it is the sentence README opens
                  with, so the site now agrees with the canon instead of
                  avoiding its own words.

                  It also carries the audience, and that has now moved twice.
                  It named the reader ("product managers who answer for what
                  ships"), then named the team and the category together, and on
                  2026-08-11 it came back to naming the reader. The round trip
                  is not indecision: the middle version was chosen to buy a
                  wider arena and was retired once the ICP was re-locked to the
                  individual PM. A line that names a market outlives its welcome
                  faster than one that names a person. */}
              {/* TWO ACCENTS ON THIS LINE (founder 2026-08-10), and they are the
                  page's own colour language rather than decoration. The note at
                  the top of this file records the rule as ONE ember word, and
                  this is a deliberate revision of it by the person who set it.

                  It is defensible on the page's own terms. Blue is the machine
                  here (the replay, the 80% stat, layer 02) and ember is the
                  human (layer 01, the CTA), which is the same law the whole
                  product runs on: ember marks the person, never the machine.
                  This line teaches that palette before the headline arrives.

                  What keeps it from being the everything-is-important failure
                  the one-accent rule was written against: both accents are 12px
                  inside one short line and they mark the two nouns of a single
                  sentence, not four unrelated objects competing across a
                  viewport. The headline stays the only white object and the
                  only large one.

                  REWRITTEN 2026-08-11, founder ruling, and BOTH HALVES CHANGED.

                  The line said "The agentic-first operating system for product
                  teams". "Operating system" is retired everywhere rather than
                  demoted, in his words because it "sounds like a cliche and
                  vague, where people do not want to get into that". It had been
                  on the retirements list as the LEAD since 2026-08-10 and this
                  page never got the memo.

                  "Product teams" became "product managers" because NOBODY
                  SELF-IDENTIFIES AS A TEAM. An eyebrow works by recognition,
                  and "product team" is how a vendor describes a market rather
                  than how a person describes themselves. It is the same failure
                  as "operators". It also matches the locked ICP, the individual
                  PM or founding PM, and a team noun signals procurement when
                  the land motion is a person who can start without asking
                  anyone.

                  The colours swapped ends with the nouns and the LAW did not
                  move: ember is still on the human, blue is still on the
                  machine. It reads as an inversion and is the opposite, which
                  is why this paragraph exists. */}
              For <span className="font-medium text-[#FF6B2C]">product managers</span> who ship with{" "}
              <span className="font-medium text-[#6cb0f5]">agents</span>
            </p>

            <h1
              className="hero-rise mb-10 text-white"
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
              <span className="mt-3 block text-[21px] leading-[1.3] text-[#7a7a85] md:text-[28px] lg:text-[32px]">
                {/* "gets sharper." until 2026-08-10. Same four-target grammar,
                    same weight, same colour: only the words changed.

                    README calls the last verb of this sentence "the whole
                    product", and the canonical thesis ends "so next time it
                    guides the call". "gets sharper" was the one beat that named
                    no actor and no object: sharper at what, for whom? It also
                    left the page's strongest claim implicit in the exact spot
                    built to carry it. The <title>, the meta description,
                    llms.txt and the agent card all end on "guides the next
                    call"; the headline a human actually reads did not. */}
                then <span className="hero-loop-verb">builds it.</span>{" "}
                <span className="hero-loop-verb">ships it.</span>{" "}
                <span className="hero-loop-verb">grades it.</span>{" "}
                <span className="hero-loop-verb">guides the next call.</span>
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
              className="hero-sub hero-rise mb-14 text-base leading-relaxed text-zinc-300 md:text-lg lg:whitespace-nowrap lg:text-[17px]"
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

            {/* WRAPS SINCE 2026-08-11, and the wrap is load-bearing rather than
                defensive. With the teardown door added below, the row carries
                three controls, and this column is EXACTLY 511px at every desktop
                width (the measurement is in the sub's note above: max-w-5xl caps
                the container, so the number does not drift). The three controls
                measure about 650px laid end to end, so at lg they cannot share a
                line and a row with no wrap would have pushed the tertiary link
                out of the column.

                Wrapping puts the hierarchy in the layout: the ember button and
                the teardown sit together on line one, which is the pairing that
                matters, and "Watch a real run" drops to its own line as the
                third thing it has always been. Below lg the column is the whole
                page width and all three fit on one line; at 320 the row is a
                stack, as it already was. The y gap is smaller than the x gap so
                a wrapped line reads as the same row continuing, not as a new
                block. */}
            <div
              className="hero-rise flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-4"
              style={{ animationDelay: "180ms" }}
            >
              {/* 2026-08-05, AND WHY IT IS BEING PARTLY UNDONE ON 2026-08-07.
               *
               * THE ORIGINAL RULING, KEPT IN FULL BECAUSE IT WAS RIGHT AT THE
               * TIME. This button used to send every visitor to #join, the email
               * waitlist. Measured on 2026-08-05: 1,294 landing_visit events and
               * ZERO rows in waitlist_signups. Not a poor rate. Zero. Signup was
               * fully open with auto-confirm and the product said so on two
               * other surfaces (/pricing offered "Start free" straight to
               * /signup, /demo said "the beta is open for sign-ups"), so the
               * home page was the ONLY surface pretending the product was gated,
               * on the page a Product Hunt listing sends its entire spike to. A
               * visitor's question at second eight is "can I try this"; the nav
               * answered "Sign in", implying accounts exist, and this button
               * answered "wait". That ambiguity at the primary CTA was the whole
               * loss, and pointing the button at the open door removed it.
               *
               * WHAT CHANGED. The founder closed signup on 2026-08-07: private
               * beta, entry by invite code. So the premise the ruling stood on
               * is simply gone. "Start free" now leads to a form that asks for a
               * code the visitor does not have, which is a worse version of the
               * same ambiguity, not a fix for it: the loudest control on the page
               * would promise a thing the next screen refuses.
               *
               * WHAT THE ZERO DOES AND DOES NOT PROVE, because it is the reason
               * to be careful here. That measurement was taken while a free
               * account sat one click away in the nav and on /pricing. It shows
               * the waitlist LOSING TO AN OPEN DOOR, which is unsurprising and no
               * longer the choice on offer. It is not evidence that people will
               * not ask for access when asking is the way in. Those are different
               * claims and only the first one was measured.
               *
               * THE TRADE, ACCEPTED KNOWINGLY. This will convert worse than an
               * open signup did, and that is the point rather than a cost: a real
               * count of people who asked for access is the number the founder
               * wants, and it cannot be collected from a door that lets everyone
               * through. What must NOT come back is the ambiguity, so there is
               * still exactly one loud control and it now says the true thing.
               * The invite door keeps a quiet text link below, which is the
               * mirror image of the arrangement this replaces.
               *
               * The Critic offer under this button did not move and is now doing
               * more work than ever: it is the only thing a stranger can still do
               * with no account at all. */}
              <a
                href="#join"
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
                {/* "Request access" until 2026-08-10 (founder). It replaced
                    "Start free" on 2026-08-07 when the gate went up, and that
                    move was right: the door really is shut, and a button
                    promising a free start would have been a lie by 2026-08-07.
                    The word chosen to carry it was the problem.

                    "Request" makes the visitor petition for something and
                    invites the question "why do I have to ask?" before they
                    know enough about the product to want to. It puts the cost
                    of the gate on the reader at the exact moment we are asking
                    them to commit.

                    "Join the beta" keeps the gate honest, which is why it is
                    the replacement rather than a return to "Start free": it
                    promises membership in something that is deliberately small,
                    not instant entry. It is also what the form's OWN button has
                    said all along (WaitlistForm.tsx:181) and what
                    MACHINE_CONTENT says. The loudest control on the page and
                    the thing it opens now use one word instead of two. */}
                <span className="flex items-center gap-2">
                  Join the beta
                  <span className="hero-arrow inline-block" aria-hidden>
                    &rarr;
                  </span>
                </span>
              </a>
              {/* THE OPEN DOOR, PUT BACK ON 2026-08-11 (founder), and it is a
               * deliberate partial reversal of the removal recorded below. Read
               * that note first: it is still right about the shape that failed.
               *
               * WHY IT COMES BACK. The button above it is honest and it is shut.
               * A visitor with no invite code reads "Join the beta", and the
               * only thing the hero then offers them is a video of somebody
               * else's run. /p/teardown is the one surface in this product that
               * turns a stranger into a person who has SEEN it work: one
               * textarea, no account, no code, and it hands back a real
               * evidence-backed critique of THEIR OWN spec. It was reachable
               * only from the footer, from a link list five beats down, and from
               * /demo, which is to say only by people who had already decided to
               * keep reading.
               *
               * WHY THIS IS NOT THE THING THAT WAS REMOVED. The 2026-08-10
               * ruling killed three asks and five lines of body copy under one
               * button. What returns is ONE control and no paragraph: the invite
               * door stays gone from the hero, and the cost and the payload ride
               * inside the control itself instead of in prose beneath it. The
               * ladder is legible at a glance because each rung is a different
               * kind of object: one filled ember button, one outlined door, one
               * plain text link. That is a hierarchy, not three equal asks.
               *
               * THE COPY IS THE OFFER. "Tear down your PRD" is what they get and
               * whose document it runs on; the mono line is what it costs, and
               * "no signup" is the word that matters most standing next to an
               * invite-only button. Second line is the machine register this
               * hero already uses for specification (the column opposite, the
               * eyebrow above), so it reads as terms rather than as sell.
               *
               * The contrast ruling recorded on the eyebrow above binds small
               * type here too, and 11px is the smallest this hero goes. Measured
               * live against this box's own ground (3% white over #0a0a0a, which
               * computes to #111111): the label is 12.78:1 and the mono line is
               * 7.2:1, both clear of the 4.5:1 floor. zinc-500 was the obvious
               * choice for a second line and it is the wrong one, at 4.1:1. */}
              <a
                href="/p/teardown"
                className="hero-try rounded-xl border border-white/10 bg-white/[0.03] px-4 py-[7px] text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium leading-5 text-zinc-300">
                  Tear down your PRD
                  <span className="hero-arrow inline-block" aria-hidden>
                    &rarr;
                  </span>
                </span>
                <span
                  className="mt-0.5 block font-mono text-[11px] uppercase leading-[14px] text-zinc-400"
                  style={{ letterSpacing: "0.08em" }}
                >
                  No signup &middot; evidence in a minute
                </span>
              </a>
              {/* THE THIRD LINK IS GONE, 2026-08-12 (founder), AND THIS IS THE
                  SECOND TIME THE SAME RULE HAS BEEN APPLIED HERE.

                  It read "Watch a real run" and pointed at /demo, which was a
                  promise the destination could not keep: /demo is live seeded
                  DATA (a teardown, a decision history, a mission trace) and not
                  one frame of it moves. Repointing it at the film fixed the
                  promise and left the real problem standing - it wrapped onto
                  its own line under the two buttons and read as an orphan, a
                  third door competing with the two that matter.

                  That is the note directly below this one, from 2026-08-10,
                  arriving a second time: "under one ember button the hero was
                  offering three doors at once". Two is the shape that works.
                  The film is not hidden by this; it has the nav, its own
                  section one scroll down, and /film. Nothing above the fold
                  has to carry it. */}
            </div>

            {/* REMOVED 2026-08-10 (founder): the Critic offer paragraph and the
                "Already have an invite code? Open your account" link.

                Both were defensible on their own and wrong together. Under one
                ember button the hero was offering three doors at once: request
                access, try the Critic, sign in with a code. Three asks is the
                same failure as four accents, and the two quiet ones were
                carrying five lines of body copy directly beneath the CTA row,
                which is the worst place on the page to spend a reader's
                attention on a footnote.

                Neither path is lost. The Critic is the first row of the
                Receipts beat ("A public teardown, no signup") and it is in the
                footer; the invite door is /signup, which is where an invited
                person is sent by the email that invited them, and "Sign in" is
                in the nav.

                THE CRITIC CAME BACK ON 2026-08-11 and the invite door did not,
                which is the distinction this note failed to draw the first time.
                The defect was never that the hero named the Critic; it was that
                three doors and five lines of footnote sat under one button, and
                two of those doors led somewhere a stranger cannot go. Sending a
                person with no code to /signup is a dead end. Sending them to a
                textarea that answers them in a minute is the only first-hand
                evidence this page can offer. One is worth a control in the CTA
                row; the other is not, and it stays where it is. */}
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
            className="hero-spec hero-rise hidden pl-5 font-mono text-[12px] uppercase text-zinc-400 lg:grid lg:grid-cols-[auto_1fr] lg:gap-x-3 lg:gap-y-3.5"
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
