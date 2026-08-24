Unit 045: the barrel is gone, and obsidian is down to its live six

The atomic move unit 044 mapped, executed. The five mounted panels now
read direct files: VouchersPanel and SpecProjectionsPanel ported OFF
obsidian entirely (Button to Meridian's Action, MonoLabel to the
mrd-eyebrow utility, VerdictChip and its tone type to ink's chips, with
the drift tones remapped to ink's vocabulary - current passes, stale
asks for a person, no-contract is neutral). GraphSlider left the retired
directory altogether: relocated to meridian/ with its six retired tokens
ported to mrd equivalents (hairline, raised, text-subtle, text-faint),
so it is a Meridian component now, not a guest.

What remains in obsidian/ is the live six: AiPulse, TestStationPanel,
graph-slider's old neighbours status.tsx (TestStationPanel reads it
directly), primitives, verdict - wait, primitives and verdict lost
their last consumers in this pass and went with the barrel. The
directory now holds AiPulse, TestStationPanel, status, graph-slider and
their tests, every one of them mounted by direct path.

Ratchet 1972 to 1910, the biggest single cut of the run. tsc 0 - build
passes - full suite 10629 pass / 0 fail (62 fewer tests because the
deleted files' tests went with them) - on main.
