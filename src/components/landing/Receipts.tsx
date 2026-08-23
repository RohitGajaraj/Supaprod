/**
 * Beat 4 - Receipts (the investor beat).
 *
 * The live adoption counters were removed (founder ruling 2026-07-25): on a
 * pre-launch page they invite a question the company cannot answer well, and
 * they were abstractions on an already abstract page.
 *
 * Alignment (founder ruling 2026-07-25, "placements matter"): the beat runs on
 * one left edge. Artifacts left, argument right. The pixel thesis at the end is
 * the one centred object on the page, and it is centred on purpose: it is a
 * statement, not a row.
 *
 * IT TAKES NO PROPS NOW. It used to accept `stats` and ignore it so the route
 * could keep passing something, and that courtesy is what kept six COUNT
 * queries alive in the loader of `/` for two weeks after the counters beat was
 * deleted. An ignored parameter reads as a temporary shim and survives as
 * permanent load.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-09 - the worked example and the dead links came out (founder ruling).
 *
 * What used to be here: a four-row "graded ledger" table (Week 02/04/07/11, one
 * of them WRONG), a full-contrast banner announcing that no row was a real call
 * by anyone, and four artifact links.
 *
 * The banner was added on 2026-08-05 because the rows are invented and the old
 * 10px grey disclosure was engineered not to be read. That fix was right about
 * the disclosure and wrong about the object. On the one page whose whole
 * argument is "receipts, not claims", the honest move is not to announce the
 * fabrication more loudly, it is to not ship the fabrication. The founder's
 * reading, verbatim: "not adding value... just for name sake".
 *
 * The destinations were then checked live, and THREE of the five on this beat
 * resolved to /proof, which renders three stacked empty states ("Not enough
 * recorded outcomes yet", "0 decisions caught and corrected", "No public
 * decisions yet"). That is not a bug in /proof: it reads from applyOutcome,
 * which has never completed in production. So "A decision, with its receipt"
 * (which falls back to /proof whenever nothing real is published, and nothing
 * is), "The trust ledger", and the banner's own "See the real ledger" were one
 * dead end reached three ways. A section that exists to prove we have receipts
 * was shipping one.
 *
 * What survives is what a stranger can verify without an account: /p/teardown,
 * which runs on their own PRD, and /updates, a dated log. Plus the moat
 * paragraph, which was always the actual argument here and never needed the
 * table under it -- it is a claim about calendar time, not a demonstration.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-22 - /p/teardown is retired (founder), so the sentence above is now
 * history rather than description. It is kept verbatim because the ruling it
 * records is still binding on everything else in this beat; only its first
 * example is gone. /demo took the slot. See the note on `artifacts` below for
 * why that is a downgrade and not a swap, and
 * docs/decisions/public-teardown-retired-2026-08.md for the ruling.
 *
 * /proof earns its link back the day one outcome settles. Not before. Do NOT
 * re-add an illustrative table to fill the space: that is the exact loop this
 * ruling closes, and Receipts.test.ts now fails if those rows come back.
 *
 * KEPT at founder request, 2026-08-09: the capability list, relabelled "On the
 * record" by the 2026-08-11 vocabulary ruling (it read "On the ledger" until
 * then; neither replacement noun takes the preposition). Two of its four items
 * (graded verdicts, real decisions) have nothing behind them today. It stays
 * because it names what the record holds, which is a description of the
 * product, not a count of what we have already collected.
 */
export function Receipts() {
  // Only destinations a stranger can check without an account, and only ones
  // with something on the other side. A link that resolves to an empty page is
  // not a receipt, it is a claim with extra steps.
  //
  // THE TEARDOWN ROW LEFT ON 2026-08-22 (founder). Record:
  // docs/decisions/public-teardown-retired-2026-08.md. It read "A public
  // teardown, no signup" and pointed at /p/teardown, which is now a permanent
  // redirect to /demo.
  //
  // /demo IS THE REPLACEMENT AND IT IS A WEAKER ONE, WHICH IS WORTH SAYING.
  // The teardown ran on the READER'S OWN document, which is what made it
  // checkable rather than merely viewable; /demo is a seeded workspace they can
  // read but not touch. It qualifies for this list under the rule above (no
  // account, and something real on the other side) and it does not qualify
  // under the spirit of it. It is here to keep the beat at two links rather
  // than one, not because it is as good.
  //
  // Do NOT restore an /proof row to fill the gap: Receipts.test.ts fails on it,
  // and the reason is four paragraphs up.
  const artifacts = [
    { label: "A real workspace, no login", href: "/demo" },
    { label: "What shipped this week", href: "/updates" },
  ];

  return (
    <section className="py-32 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Text on the right, evidence on the left: this beat alternates
            sides with the rest of the page (the reference register). */}
        {/* items-stretch (the default) rather than items-start, since 2026-08-09.
            With four links and a table below, items-start was right. With two
            links the evidence column is far shorter than the argument column,
            so it stretches instead and the moat is pushed to its foot with
            mt-auto: both columns then end on the same line and the leftover
            space becomes deliberate spacing rather than a hole. */}
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.85fr] gap-12">
          <div className="md:order-2">
            <h2
              className="text-4xl md:text-5xl font-semibold mb-4 text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Evidence,
              <br />
              not claims.
            </h2>
            {/* The sentence has to be true of the objects actually under it,
                which is what the previous two versions got wrong: the first
                scoped itself to "every artifact here" while an invented table
                sat inside that "here", and the second promised a decision
                receipt "resolved live" that resolved to an empty page. This one
                claims only what a stranger can go and check right now, with no
                account, on the two links beside it. */}
            <p className="text-lg text-zinc-400" style={{ maxWidth: "48ch" }}>
              Every link here opens a page you can check without an account: walk a real seeded
              workspace, read the dated log of what shipped. Supaprod has run on its own loop since
              June 2026.
            </p>
            <div className="cap-scrim hidden md:flex flex-col gap-2.5 mt-12 py-6 px-8 -mx-8">
              <span className="font-mono text-mrd-tiny text-zinc-400 mb-1.5">On the record</span>
              {/* "public teardowns" was the third item until 2026-08-22. The
                  product no longer publishes one, so it was the single item on
                  this list that named a thing that had stopped existing. The
                  other three still describe what the record holds. */}
              {[
                "graded verdicts",
                "real decisions",
                "recorded forecasts",
                "dated shipping log",
              ].map((f) => (
                <span
                  key={f}
                  className="cap-item font-mono text-mrd-small uppercase text-zinc-400"
                  style={{ letterSpacing: "0.12em" }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Artifact row: every link is a real, live object with something on
              the other side. Keyed by label rather than href so a future entry
              cannot silently collide with an existing destination. */}
          <div className="md:order-1 flex flex-col">
            {artifacts.map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="group flex items-baseline justify-between gap-4 py-3 border-b border-white/[0.07] text-sm text-zinc-300 hover:text-white transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
              >
                <span>{a.label}</span>
                <span className="text-zinc-400 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </a>
            ))}

            {/* The moat, and now the only argument in the lower half of the
                beat. It used to sit full-measure under the worked-example
                table, effectively as that table's caption. With the table gone
                it can carry the section alone, because it never was a
                description of those four rows: it is a claim about calendar
                time.

                It lives INSIDE the left column rather than below the grid, and
                that is a layout fix, not a preference. Dropping from four links
                to two left this column about 500px shorter than the one beside
                it, so the beat rendered as two links and a void -- which is the
                same "it is not even aligning" complaint that started this
                change. The moat fills that column and the two now end together.

                Founder asked whether this should be one line instead of three.
                It should not: at 163 characters one line runs about three times
                the length an eye can track back from, which is what the 45 to
                75 character rule exists to prevent. It sets 54 per line today,
                right in the band, so the wrap is correct and the LOOK was the
                real complaint.

                The cause was size, not line count. It read as a footnote
                because it was rendering at 14px: `text-base` resolves through
                Tailwind v4's --text-base, and the Tempo tokens claim that exact
                variable ([data-obsidian] sets it to 14px), so the utility
                silently renders a step below its name across this whole page.
                An explicit px value sidesteps the collision. See the note in
                styles.css. */}
            <p
              className="mt-12 md:mt-auto md:pt-16 text-mrd-lead leading-mrd-prose text-zinc-300"
              style={{ maxWidth: "52ch" }}
            >
              {/* CORRECTED 2026-08-10. This sentence used to assert that the
                  record could not be backfilled, bought or bolted on. (The exact
                  former wording is deliberately not reproduced here: the test
                  beside this file greps the source for it, so quoting it would
                  trip the guard that stops it coming back.)
                  That claim is falsified on
                  the record: Vercel's COO ran an agent over Slack, email and Gong
                  and reconstructed the true cause of a lost deal, overturning the
                  account executive's own account -- two days to build, about
                  $1,000 a year to run. Causes ARE recoverable from raw exhaust,
                  so a claim that they are not is one a well-read buyer can break
                  in a sentence.
                  What genuinely cannot be reconstructed is narrower and stronger:
                  a FORECAST. What a team believed would happen, recorded before
                  the outcome was known, is not an artifact -- it leaves no trace
                  in Slack or email or a CRM unless something captured it at the
                  moment of the call. The narrower claim survives being queried,
                  which the broad one did not. Evidence and approved language:
                  docs/research/lennys-corpus-sweep-2026-08.md section 2. */}
              Verdicts take weeks, so the record accrues in calendar time. What nobody can
              reconstruct afterwards is what you believed <em>before</em> the outcome landed. A
              forecast leaves no trace unless something wrote it down at the moment you decided. A
              competitor starting next year starts at zero, next year.
            </p>
          </div>
        </div>

        {/* The thesis statement: the beat's brand moment, in the pixel face,
            framed so it reads as its own message. The dividers fade at the
            edges (the mask-fade treatment) so the line floats instead of
            sitting in a table row. Ember stays on the two proper nouns of the
            sentence, always, never on hover (founder ruling 2026-07-25): the
            actor and the product. Everything between them stays white. */}
        <div className="mt-24">
          <div
            aria-hidden
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
            }}
          />
          <p
            className="text-2xl md:text-[34px] text-white text-center leading-mrd-snug mx-auto py-16"
            style={{ maxWidth: "26ch", fontFamily: "var(--font-pixel)", fontWeight: 400 }}
          >
            <span style={{ color: "#FF6B2C" }}>Agents</span> do the work. You answer for it.{" "}
            <span style={{ color: "#FF6B2C" }}>Supaprod</span> is how you answer.
          </p>
          <div
            aria-hidden
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
