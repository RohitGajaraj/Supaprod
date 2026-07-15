/**
 * Beat 5 - The USP beat (founder ruling 2026-07-15): building is commoditized;
 * knowing WHAT to build is the moat. Cadence is the second brain that makes
 * the call with you and remembers whether it was right. Unnamed contrast,
 * agent-era framing, no comparison boxes, no competitor names.
 */
export function FieldStops() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-4xl md:text-5xl font-semibold mb-14 text-white leading-[1.1]"
          style={{ letterSpacing: "-0.02em", maxWidth: "24ch" }}
        >
          Everyone can build now. Almost nobody knows what to build. That is the moat.
        </h2>

        {/* The ledger: what the field leaves on you, and what Cadence does
            about each one. Mono kickers, two voices, no boxes. */}
        <div className="mb-16">
          <div className="hidden md:grid md:grid-cols-2 gap-10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
              the field today
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6cb0f5]">
              with cadence
            </span>
          </div>
          {[
            {
              kicker: "signal feeds",
              them: "surface what is happening. The call is still yours to make, alone.",
              ours: "It arrives with the call already ranked, backed by your own precedent.",
            },
            {
              kicker: "agent fleets",
              them: "ship whatever they are pointed at. Pointing them is the scarce skill.",
              ours: "It does the pointing: picks the bet, writes the spec, and runs the fleet behind your gate.",
            },
            {
              kicker: "docs and boards",
              them: "hold the plan. The taste behind it evaporates.",
              ours: "Fourteen days after every ship, it grades the outcome against the call that caused it. The next call starts sharper.",
            },
          ].map((row) => (
            <div
              key={row.kicker}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-10 py-6 border-t border-white/[0.07] -mx-3 px-3 rounded-lg hover:bg-white/[0.015] transition-colors"
            >
              <p className="text-base md:text-lg leading-snug">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-2">
                  {row.kicker}
                </span>
                <span className="text-zinc-500">{row.them}</span>
              </p>
              <p className="text-base md:text-lg leading-snug md:pt-6">
                <span className="text-zinc-100">{row.ours}</span>
              </p>
            </div>
          ))}
        </div>

        {/* The claim, stated as a display line; the USP phrase carries the
            brand face and the gold micro-detail (founder ruling 2026-07-15) */}
        <p
          className="text-2xl md:text-3xl text-white font-medium leading-snug mb-4"
          style={{ letterSpacing: "-0.015em", maxWidth: "36ch" }}
        >
          The result is a{" "}
          <span
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
          A record like that cannot be bought or backfilled. It exists only if the system was in the
          loop when the call was made.
        </p>

        {/* The compounding moment: the same bet, months apart, shown not told */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        <p className="text-sm text-zinc-500 mb-20" style={{ maxWidth: "62ch" }}>
          Every call it records is a call a replacement starts without. The precedent chips are the
          shipped UI; the pair above is an illustration.
        </p>

        {/* Pull line */}
        <p
          className="text-center text-xl md:text-2xl text-zinc-300 font-medium"
          style={{ letterSpacing: "-0.01em" }}
        >
          Alignment expires. The ledger compounds.
        </p>
      </div>
    </section>
  );
}
