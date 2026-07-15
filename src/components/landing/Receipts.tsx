import type { LandingStats } from "@/lib/landing.functions";

/**
 * Beat 4 - Receipts (the investor beat).
 * Counters are pulled live from the DB at render time via the route loader;
 * if the pull fails the strip degrades to the artifact row and never renders
 * a hardcoded count (claims law, plan section 1.5). Gold numerals are the
 * palette's one sanctioned micro-detail (section 4.1b).
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
        <h2
          className="text-4xl md:text-5xl font-semibold mb-4 text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Receipts, not screenshots.
        </h2>
        <p className="text-lg text-zinc-400 mb-12" style={{ maxWidth: "65ch" }}>
          {stats
            ? "Every number below is pulled live from our own workspace. Cadence has run our product since June 2026. We publish the misses on the same ledger as the wins."
            : "Every artifact below is a live object in our workspace. Cadence has run our product since June 2026. We publish the misses on the same ledger as the wins."}
        </p>

        {/* Live counters: rendered only when the live pull succeeded */}
        {stats && (
          <div className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      color: "#E8B44C",
                    }}
                  >
                    {item.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wide">{item.label}</div>
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
        <div className="mt-12 mb-12 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
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

        {/* Where we are: proven in production, doors opening (founder ruling
            2026-07-15: state the strength, not the zero) */}
        <div className="border border-white/10 bg-[#0d0d0e] rounded-xl p-8 mb-16">
          <h3 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">
            Where we actually are
          </h3>
          <p className="text-zinc-300 leading-relaxed" style={{ maxWidth: "65ch" }}>
            The engine is built and has run our own product in production since June 2026; the
            artifacts above come from that live workspace. This month the doors open to the first
            outside cohort. <span className="text-white font-semibold">Early is the offer.</span>
          </p>
        </div>

        {/* The thesis pull quote: the beat's brand moment, in the pixel face */}
        <p
          className="text-2xl md:text-[34px] text-white text-center leading-snug mx-auto"
          style={{ maxWidth: "26ch", fontFamily: "var(--font-pixel)", fontWeight: 400 }}
        >
          Agents do the work. You answer for it. Cadence is how you answer.
        </p>
      </div>
    </section>
  );
}
