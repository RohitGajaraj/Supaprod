import type { LandingStats } from "@/lib/landing.functions";

/**
 * Beat 4 - Receipts (the investor beat).
 * Counters are pulled live from the DB at render time via the route loader;
 * if the pull fails the strip degrades to the artifact row and never renders
 * a hardcoded count (claims law, plan section 1.5). Numerals use the blue
 * data tone; gold is banned outside the trace's memory rows (founder ruling).
 */
export function Receipts({ stats }: { stats: LandingStats | null }) {
  const artifacts = [
    { label: "A decision, with its receipt", href: "/d/acf1fa74a20840cda5759644c6f02c05" },
    { label: "A public teardown, no signup", href: "/p/teardown" },
    { label: "The trust ledger", href: "/proof" },
    { label: "What shipped this week", href: "/updates" },
  ];

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
              Receipts, not screenshots.
            </h2>
            <p className="text-lg text-zinc-400" style={{ maxWidth: "48ch" }}>
              {stats
                ? "Every number here is pulled live from our own workspace. Cadence has been building itself on its own loop since May 2026. We publish the misses on the same ledger as the wins."
                : "Every artifact here is a live object in our workspace. Cadence has been building itself on its own loop since May 2026. We publish the misses on the same ledger as the wins."}
            </p>
            <div className="cap-scrim hidden md:flex flex-col gap-2.5 mt-12 py-6 px-8 -mx-8">
              <span className="font-mono text-[11px] text-zinc-600 mb-1.5">On the ledger</span>
              {["live counters", "real decisions", "public teardowns", "dated shipping log"].map(
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

          <div className="md:order-1">
            {/* Live counters: rendered only when the live pull succeeded */}
            {stats && (
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "missions run", value: stats.missionsRun },
                    { label: "decisions recorded", value: stats.decisionsRecorded },
                    { label: "outcomes graded", value: stats.outcomesGraded },
                    { label: "AI calls, one audited path", value: stats.aiCallsGoverned },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border border-white/10 bg-[#0d0d0e] rounded-xl p-6 transition-colors hover:border-white/20"
                    >
                      <div
                        className="text-3xl md:text-4xl mb-2"
                        style={{
                          fontFamily: "var(--font-pixel)",
                          fontVariantNumeric: "tabular-nums",
                          // Blue data tone (the in-app PixelStat ruling); gold
                          // is reserved for the trace's memory rows only.
                          color: "#6cb0f5",
                        }}
                      >
                        {item.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wide">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-600 font-mono mt-3">
                  Pulled live from the database at{" "}
                  {new Date(stats.pulledAt).toISOString().slice(0, 16).replace("T", " ")} UTC.
                </p>
              </div>
            )}

            {/* Artifact row: every link is a real, live object */}
            <div className="mt-10 grid grid-cols-1 gap-y-1">
              {artifacts.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="group flex items-baseline justify-between gap-4 py-3 border-b border-white/[0.07] text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  <span>{a.label}</span>
                  <span className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all">
                    &rarr;
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* The thesis statement: the beat's brand moment, in the pixel face,
            framed so it reads as its own message between the receipts above
            and the moat beat below (founder 2026-07-15). The dividers fade at
            the edges (the mask-fade treatment) so the line floats instead of
            sitting in a table row. Ember on the product name: the human voice,
            because the statement is about you answering. */}
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
            Agents do the work. You answer for it. <span style={{ color: "#FF6B2C" }}>Cadence</span>{" "}
            is how you answer.
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
