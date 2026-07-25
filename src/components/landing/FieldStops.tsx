/**
 * Beat 5 - The USP beat (founder ruling 2026-07-15): building is commoditized;
 * knowing WHAT to build is the moat. Supaprod is the second brain that makes
 * the call with you and remembers whether it was right.
 *
 * Subtracted 2026-07-25 (landing duplication audit), design otherwise
 * untouched: the opening clause was TheGap's sentence again, the field ledger
 * was the "where others stop" contrast told a third time, the closing pull
 * quote was the page's second identically framed statement, and the
 * cannot-be-backfilled line moved up to Receipts to sit beside the graded
 * ledger it describes. What is left has one job: memory compounds.
 */
export function FieldStops() {
  return (
    <section className="py-32 px-4">
      <style>{`
        .sb-glow { transition: text-shadow 0.3s ease; cursor: default; }
        .sb-glow:hover { text-shadow: 0 0 22px rgba(255,107,44,0.6); }
      `}</style>
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-4xl md:text-5xl font-semibold mb-14 text-white leading-[1.1]"
          style={{ letterSpacing: "-0.02em", maxWidth: "26ch" }}
        >
          Knowing what to build is the moat.
          <span
            className="block mt-4 text-[0.62em] text-zinc-300"
            style={{
              fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
              fontWeight: 400,
              letterSpacing: "0",
            }}
          >
            Supaprod builds that moat for you.
          </span>
        </h2>

        {/* The claim, stated as a display line; the USP phrase carries the
            brand face and the gold micro-detail (founder ruling 2026-07-15) */}
        <p
          className="text-2xl md:text-3xl text-white font-medium leading-snug mb-4"
          style={{ letterSpacing: "-0.015em", maxWidth: "36ch" }}
        >
          The result is a{" "}
          <span
            className="sb-glow"
            style={{
              fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
              fontWeight: 400,
              letterSpacing: "0",
              fontSize: "1.06em",
              color: "#FF6B2C",
            }}
          >
            second brain
          </span>{" "}
          for your product: every call, its evidence, and its outcome on one record.
        </p>
        <p className="text-base text-zinc-500 mb-16" style={{ maxWidth: "58ch" }}>
          It exists only if the system was in the loop when the call was made.
        </p>

        {/* The compounding moment: claim on the left, the evidence pair on the
            right (the reference register: text one side, artifact the other) */}
        <div className="grid grid-cols-1 md:grid-cols-[0.85fr_1.15fr] gap-10 items-center mb-6">
          <p className="text-lg text-zinc-400 leading-relaxed" style={{ maxWidth: "36ch" }}>
            The same class of bet, one month apart. The second time it arrives carrying its own
            history. Every call it records is a call a replacement starts without.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-white/10 bg-[#0d0d0e] rounded-xl p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                  June
                </span>
                <span className="text-[10px] font-mono text-zinc-600">ranked #4</span>
              </div>
              <p className="text-sm text-white mb-2">Cut onboarding to three steps</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Arrives cold. Ranked on the evidence alone: 3 signals, no history to lean on yet.
              </p>
            </div>
            <div className="border border-white/10 bg-[#0d0d0e] rounded-xl p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  July
                </span>
                <span className="text-[10px] font-mono text-zinc-400">ranked #1</span>
              </div>
              <p className="text-sm text-white mb-3">Trim the workspace setup flow</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" aria-hidden />
                Similar call, right 3 of 4 times
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-zinc-600 md:text-right">
          The precedent chips are the shipped UI; the pair is an illustration.
        </p>
      </div>
    </section>
  );
}
