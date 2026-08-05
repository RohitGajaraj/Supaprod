import { useEffect, useRef, useState } from "react";
import type { LandingStats } from "@/lib/landing.functions";
import { listPublicDecisions } from "@/lib/decisions-share.functions";

/**
 * Beat 4 - Receipts (the investor beat).
 *
 * The live adoption counters were removed (founder ruling 2026-07-25): on a
 * pre-launch page they invite a question the company cannot answer well, and
 * they were abstractions on an already abstract page. What replaced them is
 * the graded ledger, which shows judgment being scored rather than restating
 * the loop the walkthrough already shows.
 *
 * The WRONG row is the point of the section. Publishing a miss is what makes
 * the other three rows worth reading, so it is the only row that carries a
 * rail, a tint, and a full-strength state colour; the three RIGHT verdicts sit
 * in a muted green so the eye finds the miss without the table shouting.
 * Verdicts sit in mono (the machine passing judgment), decisions in Sans (the
 * human who made the call). Red and green are state colours and legitimate
 * here; gold never touches any of it.
 *
 * Alignment (founder ruling 2026-07-25, "placements matter"): the beat runs on
 * one left edge. Artifacts left, argument right, then the ledger spanning the
 * full measure underneath so its four columns get the width the page has been
 * wasting. The pixel thesis at the end is the one centred object on the page,
 * and it is centred on purpose: it is a statement, not a row.
 *
 * The `stats` prop is accepted and ignored so the route can keep passing it.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-05 - two truthfulness defects fixed, and why the fix took this shape.
 *
 * DEFECT 1, the decision link was a SEEDED row. This section hardcoded
 * /d/acf1fa74a20840cda5759644c6f02c05. Checked against the live DB: that slug
 * belongs to workspace e375a61c ("Explore workspace") with is_sample = true. It
 * is a seed fixture, and it is exactly the class of row listPublicDecisions()
 * deliberately filters out of /proof so the trust ledger can never show
 * fabricated content as real dogfood history. The landing page was linking, as
 * "a decision, with its receipt", the very row the ledger refuses to show.
 *
 * The fix is a LIVE READ, not a swapped constant. listPublicDecisions() already
 * applies the sample-workspace filter server-side, so whatever it returns is by
 * construction real. Today it returns nothing: every one of the 28 public,
 * slugged decisions in the database sits in an is_sample workspace, so there is
 * no real slug to hardcode even if we wanted one. A constant would therefore
 * have to be either fake again or absent. A live read is the only version that
 * is true today AND stays true the moment the founder shares a real decision,
 * with no code change and no chance of this rotting back into a lie.
 *
 * Until one exists the row resolves to /proof, which is itself a live object and
 * which states the same emptiness honestly. The row also carries a visible tag
 * saying so, because the ratchet forbids hiding the state: a visitor learns MORE
 * than before, not less. Nothing is removed; the destination is just never
 * allowed to be a fixture.
 *
 * DEFECT 2, the ledger table is invented, and 10px grey is not a disclosure.
 * Real data genuinely cannot back these four rows yet. A graded row needs a
 * verdict, and there are ZERO graded learnings anywhere outside seed fixtures
 * and sample workspaces (the founder's own workspace has 49 decisions and 0
 * graded outcomes). So the table stays illustrative, and per the ratchet it
 * stays, period. What changes is the disclosure: the old label was 10px
 * zinc-600, the faintest text on the page, sitting under a sentence that
 * claimed everything here was a live object. That is a disclosure engineered
 * not to be read.
 *
 * It is now a bordered, tinted banner directly above the table with a
 * full-contrast chip, body text at 14px, and a link to where the real graded
 * record is published. It is the loudest object in the section, which is the
 * correct weight for the one thing on this page that is not our data.
 *
 * The claim above the table was reworded to match. It used to say "Every
 * artifact HERE is a live object in our workspace" while the table sat inside
 * that same "here". The sentence now scopes itself to the links (which are all
 * real pages, one of them resolved live) and hands the table to the banner. The
 * sentence and the object it points at now agree, which is the whole ask: this
 * is the page whose entire argument is that the product does not make things
 * up, so it is the last page that can afford a made-up object presented gently.
 *
 * NOT re-added: live counters. The 2026-07-25 founder ruling removed them from
 * this beat and that ruling still stands, so the banner links to /proof (which
 * publishes the real calibration number live) rather than printing a number
 * here.
 */
export function Receipts(_props: { stats?: LandingStats | null }) {
  // The decision receipt is resolved live from the same server fn that powers
  // /proof, so the sample-workspace filter is applied server-side and this can
  // only ever point at a real, shared decision. Null means "asked, and there is
  // genuinely none yet", which the row then says out loud.
  const [decisionSlug, setDecisionSlug] = useState<string | null>(null);
  const [decisionResolved, setDecisionResolved] = useState(false);

  useEffect(() => {
    let alive = true;
    listPublicDecisions()
      .then((rows) => {
        if (!alive) return;
        setDecisionSlug(rows?.[0]?.share_slug ?? null);
        setDecisionResolved(true);
      })
      .catch(() => {
        // A failed read is not evidence of emptiness, so the row keeps its
        // neutral destination and claims nothing about what we have published.
        if (alive) setDecisionResolved(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const artifacts = [
    {
      label: "A decision, with its receipt",
      // Before it resolves, and when there is none, the row points at the
      // ledger: a live page that publishes the same emptiness honestly. It is
      // never allowed to point at a seeded fixture.
      href: decisionSlug ? `/d/${decisionSlug}` : "/proof",
      note: decisionResolved && !decisionSlug ? "none shared publicly yet" : null,
    },
    { label: "A public teardown, no signup", href: "/p/teardown", note: null },
    { label: "The trust ledger", href: "/proof", note: null },
    { label: "What shipped this week", href: "/updates", note: null },
  ];

  const ledger = [
    {
      week: "Week 02",
      decision: "Kill the secondary product line",
      evidence: "Usage and margin data, two quarters",
      verdict: "RIGHT" as const,
    },
    {
      week: "Week 04",
      decision: "Say no to the top-voted request",
      evidence: "Usage contradicts the votes",
      verdict: "RIGHT" as const,
    },
    {
      week: "Week 07",
      decision: "Chase the big logo ahead of roadmap",
      evidence: "Gut call, no evidence attached",
      verdict: "WRONG" as const,
    },
    {
      week: "Week 11",
      decision: "Reprice from seats to usage",
      evidence: "Revenue analysis by signup month",
      verdict: "RIGHT" as const,
    },
  ];

  // The rows enter on scroll, 50ms apart, transform and opacity only. Reduced
  // motion gets the finished table with nothing moving at all.
  const [revealed, setRevealed] = useState(false);
  const [instant, setInstant] = useState(false);
  const ledgerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setInstant(true);
      setRevealed(true);
      return;
    }
    const el = ledgerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

  return (
    <section className="py-32 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Text on the right, evidence on the left: this beat alternates
            sides with the rest of the page (the reference register). */}
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.85fr] gap-12 items-start">
          <div className="md:order-2">
            <h2
              className="text-4xl md:text-5xl font-semibold mb-4 text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Receipts,
              <br />
              not claims.
            </h2>
            {/* Scoped to the links on purpose. The old sentence said "every
                artifact here", and the illustrative table sat inside that same
                "here", which is what made the section arguable. The table is
                now handed to its own banner, which says what it is at full
                contrast. */}
            <p className="text-lg text-zinc-400" style={{ maxWidth: "48ch" }}>
              Every link here opens a real page, and the decision receipt is resolved live, so it
              can only point at something we have actually published. Supaprod has run on its own
              loop since June 2026. We publish the misses on the same ledger as the wins.
            </p>
            <div className="cap-scrim hidden md:flex flex-col gap-2.5 mt-12 py-6 px-8 -mx-8">
              <span className="font-mono text-[11px] text-zinc-600 mb-1.5">On the ledger</span>
              {["graded verdicts", "real decisions", "public teardowns", "dated shipping log"].map(
                (f) => (
                  <span
                    key={f}
                    className="cap-item font-mono text-[12px] uppercase text-zinc-400"
                    style={{ letterSpacing: "0.12em" }}
                  >
                    {f}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Artifact row: every link is a real, live object */}
          <div className="md:order-1 grid grid-cols-1 gap-y-1">
            {/* Keyed by label, not href: the decision row falls back to /proof
                when nothing real is published, which would collide with the
                trust ledger row's key. */}
            {artifacts.map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="group flex items-baseline justify-between gap-4 py-3 border-b border-white/[0.07] text-sm text-zinc-300 hover:text-white transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
              >
                <span>
                  {a.label}
                  {a.note ? (
                    <span
                      className="ml-2 font-mono text-[10px] uppercase text-zinc-500"
                      style={{ letterSpacing: "0.14em" }}
                    >
                      {a.note}
                    </span>
                  ) : null}
                </span>
                <span className="text-zinc-600 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* The graded ledger. Four calls, one of them wrong, all of them
            scored. Mobile stacks each row; md+ resolves it to four columns
            via `contents` on the week/verdict wrapper. */}
        <div className="mt-24" ref={ledgerRef}>
          {/* The disclosure. It was 10px zinc-600, the faintest text on the
              page, which is a disclosure written not to be read. It is now the
              loudest object in the section, because it is the one thing here
              that is not our data. Neutral white, never ember: this is a
              statement of fact, not a brand moment. */}
          <div
            className="mb-8 rounded-lg px-5 py-4"
            style={{
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="font-mono text-[11px] uppercase font-medium rounded px-2 py-1"
                style={{
                  letterSpacing: "0.18em",
                  color: "#0b0b0d",
                  background: "#e4e4e7",
                }}
              >
                Worked example
              </span>
              <span
                className="font-mono text-[11px] uppercase text-zinc-400"
                style={{ letterSpacing: "0.14em" }}
              >
                not our data, not a customer's
              </span>
            </div>
            <p
              className="mt-3 text-[14px] leading-relaxed text-zinc-300"
              style={{ maxWidth: "62ch" }}
            >
              The four rows below show the shape a graded ledger takes for one product team over one
              quarter. They are written to explain the format, and no row is a real call by anyone.
              Our own graded record is published live, including the misses.
            </p>
            <a
              href="/proof"
              className="group inline-flex items-baseline gap-2 mt-3 text-[13px] text-zinc-200 hover:text-white transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.22)" }}
            >
              See the real ledger
              <span className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5">
                &rarr;
              </span>
            </a>
          </div>

          {/* The column head carries the word too. The banner above is the real
              disclosure, but a screenshot cropped to the table would leave it
              behind, and that crop is exactly how a made-up table travels. */}
          <div
            className="hidden md:grid md:grid-cols-[96px_1.3fr_1.1fr_88px] md:gap-8 pb-3 font-mono text-[10px] uppercase text-zinc-600"
            style={{ letterSpacing: "0.2em" }}
            aria-hidden
          >
            <span className="flex flex-col gap-1">
              <span className="text-zinc-400">example</span>
              <span>week</span>
            </span>
            <span>decision</span>
            <span>evidence</span>
            <span>verdict</span>
          </div>

          {ledger.map((row, i) => {
            const wrong = row.verdict === "WRONG";
            return (
              <div
                key={row.week}
                className="border-t border-white/[0.07] py-5 px-3 -mx-3 rounded-r-lg md:grid md:grid-cols-[96px_1.3fr_1.1fr_88px] md:gap-8 md:items-baseline"
                style={{
                  // The miss carries a rail and a tint. Pre-rendered, never
                  // animated: only transform and opacity move on this page.
                  background: wrong ? "rgba(229,83,75,0.05)" : undefined,
                  boxShadow: wrong ? "inset 2px 0 0 #e5534b" : undefined,
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0)" : "translateY(10px)",
                  transition: instant
                    ? undefined
                    : `opacity 260ms ${EASE}, transform 260ms ${EASE}`,
                  transitionDelay: revealed && !instant ? `${i * 50}ms` : "0ms",
                }}
              >
                <div className="flex items-baseline justify-between gap-4 md:contents">
                  <span
                    className="font-mono text-[12px] text-zinc-500"
                    style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}
                  >
                    {row.week}
                  </span>
                  <span
                    className="md:order-1 font-mono text-[12px] font-medium"
                    style={{
                      letterSpacing: "0.12em",
                      color: wrong ? "#e5534b" : "#4f9a6a",
                    }}
                  >
                    {row.verdict}
                  </span>
                </div>
                <p
                  className="text-[15px] mt-2 md:mt-0"
                  style={{ color: wrong ? "#ffffff" : "#e4e4e7" }}
                >
                  {row.decision}
                </p>
                <p className="text-[13px] text-zinc-500 mt-1 md:mt-0">{row.evidence}</p>
              </div>
            );
          })}
          <div className="border-t border-white/[0.07]" aria-hidden />

          {/* The moat, stated plainly for the first time on this page.
              Founder asked whether this should be one line instead of three.
              It should not: at 163 characters one line runs about three times
              the length an eye can track back from, which is what the 45 to 75
              character rule exists to prevent. It sets 54 per line today,
              right in the band, so the wrap is correct and the LOOK was the
              real complaint.

              The cause was size, not line count. It read as a footnote because
              it was rendering at 14px: `text-base` resolves through Tailwind
              v4's --text-base, and the Tempo tokens claim that exact variable
              ([data-obsidian] sets it to 14px), so the utility silently
              renders a step below its name across this whole page. An explicit
              px value sidesteps the collision. See the note in styles.css. */}
          <p
            className="mt-10 text-[17px] leading-relaxed text-zinc-300"
            style={{ maxWidth: "52ch" }}
          >
            Verdicts take weeks. The record accrues in calendar time. It cannot be backfilled,
            bought, or bolted on. A competitor starting next year starts at zero, next year.
          </p>
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
            className="text-2xl md:text-[34px] text-white text-center leading-snug mx-auto py-16"
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
