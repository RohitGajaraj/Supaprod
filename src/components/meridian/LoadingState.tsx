import { useElapsed } from "@/components/meridian/use-elapsed";

/*
 * LOADING STATE, a pixel-grid loader for long-running work.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Loading State"
 *                 (their file: components/LoadingState.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * The founder called live agent status "the only core USP of our platform" and
 * asked for it on every surface at every depth. What shipped states WHAT is
 * being read and never HOW LONG it has been reading, so a slow job and a hung
 * job are the same pixels. Someone waiting cannot tell whether to keep waiting.
 * The elapsed figure is the entire point; the grid is what makes it legible at
 * a glance from across a desk.
 *
 * ── THE VARIANTS, AND WHY THE TIMINGS ARE WHAT THEY ARE ─────────────────
 *   Drive  square cells, a chevron wavefront driving right. The 650ms cycle is
 *          deliberately SHORTER than the sweep, so two fronts are always in
 *          flight and the grid never reads as empty mid-cycle.
 *   Dots   the same wavefront in circular cells.
 *   Orbit  a single comet lapping the perimeter. Slower (950ms) because one
 *          travelling cell at 650ms reads as a glitch rather than a rotation.
 *
 * ── WHAT IT MUST NOT BECOME ─────────────────────────────────────────────
 * A working indicator where no agent works is a lie, and an elapsed timer on a
 * 200ms fetch is noise. Use this only where work genuinely takes seconds and a
 * person is waiting on the result. Ordinary reads get a plain quiet state.
 */

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3);
  const c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

export type LoadingVariant = "Drive" | "Dots" | "Orbit";

const PATTERNS: Record<LoadingVariant, { delays: (number | null)[]; dur: number; round: boolean }> =
  {
    Drive: { delays: chevron, dur: 650, round: false },
    Dots: { delays: chevron, dur: 650, round: true },
    Orbit: { delays: orbit, dur: 950, round: false },
  };

export function LoadingState({
  label = "Working",
  variant = "Drive",
  startedAt,
}: {
  label?: string;
  variant?: LoadingVariant;
  /** Epoch ms the work actually began. Omit only when it began at mount. */
  startedAt?: number;
}) {
  const elapsed = useElapsed(startedAt);
  const { delays, dur, round } = PATTERNS[variant] ?? PATTERNS.Drive;

  return (
    <div data-mrd="" className="flex w-fit items-center gap-2.5" role="status" aria-live="polite">
      {/*
       * Hidden from assistive tech on purpose. The live region above already
       * announces the label and the figure; a nine-cell decorative grid has
       * nothing to add to a screen reader and would only add noise.
       */}
      <span aria-hidden className="grid grid-cols-[repeat(3,4px)] gap-[1.5px]">
        {delays.map((d, i) => (
          <span
            key={i}
            className={`size-[4px] bg-mrd-ink ${round ? "rounded-full" : "rounded-[1px]"}`}
            style={{
              opacity: d === null ? 0.07 : 0.15,
              animation: d === null ? "none" : `mrd-pixel-on ${dur}ms ease-in-out ${d}ms infinite`,
            }}
          />
        ))}
      </span>

      {/*
       * The label shimmers rather than pulses. A pulse changes the whole
       * label's brightness, which pulls the eye off the content beside it; a
       * highlight travelling through it reads as "still going" in peripheral
       * vision and stays quiet when looked at directly.
       */}
      <span
        className="bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--mrd-mute) 35%, var(--mrd-ink) 50%, var(--mrd-mute) 65%)",
          backgroundSize: "200% 100%",
          animation: "mrd-shimmer 1.4s linear infinite",
        }}
      >
        {label}
      </span>

      {/* Tabular figures, so the number does not jitter sideways as it ticks. */}
      <span className="font-mrd-mono text-[12px] text-mrd-mute tabular-nums">{elapsed}</span>
    </div>
  );
}

export default LoadingState;
