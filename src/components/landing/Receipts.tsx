import { useEffect, useRef, useState } from "react";
import type { LandingStats } from "@/lib/landing.functions";

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
 */
export function Receipts(_props: { stats?: LandingStats | null }) {
  const artifacts = [
    { label: "A decision, with its receipt", href: "/d/acf1fa74a20840cda5759644c6f02c05" },
    { label: "A public teardown, no signup", href: "/p/teardown" },
    { label: "The trust ledger", href: "/proof" },
    { label: "What shipped this week", href: "/updates" },
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
            <p className="text-lg text-zinc-400" style={{ maxWidth: "48ch" }}>
              Every artifact here is a live object in our workspace. Supaprod has run on its own
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
            {artifacts.map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="group flex items-baseline justify-between gap-4 py-3 border-b border-white/[0.07] text-sm text-zinc-300 hover:text-white transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
              >
                <span>{a.label}</span>
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
          <span
            className="block font-mono text-[10px] uppercase text-zinc-600 mb-6"
            style={{ letterSpacing: "0.2em" }}
          >
            Illustrative &middot; one product team, one quarter
          </span>

          <div
            className="hidden md:grid md:grid-cols-[96px_1.3fr_1.1fr_88px] md:gap-8 pb-3 font-mono text-[10px] uppercase text-zinc-600"
            style={{ letterSpacing: "0.2em" }}
            aria-hidden
          >
            <span>week</span>
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

          {/* The moat, stated plainly for the first time on this page. */}
          <p className="text-base text-zinc-400 mt-10 leading-relaxed" style={{ maxWidth: "52ch" }}>
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
