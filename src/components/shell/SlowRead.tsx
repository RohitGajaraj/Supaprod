import { LoadingState } from "@/components/meridian/LoadingState";
import { Reading } from "@/components/meridian/surface-parts";
import { useSlowRead } from "@/components/shell/use-slow-read";

/**
 * A READ IN FLIGHT THAT STARTS TELLING YOU HOW LONG ONCE IT HAS EARNED IT.
 *
 * Quiet first, then a figure. `use-slow-read.ts` carries the whole argument
 * and the measurement behind it; the short version is that whether a read is
 * "ordinary" is not knowable when the JSX is written, so this decides it from
 * what actually happened rather than from a guess.
 *
 * A DROP-IN FOR `Reading`, on purpose. Every site that already says
 * `<Reading>Reading the run record.</Reading>` becomes `<SlowRead>` with the
 * same sentence and reads identically for the first two and a half seconds. A
 * replacement that changed the fast path would have to be argued for at every
 * one of those sites; this one only changes what happens when the surface was
 * already failing its reader.
 *
 * THE LABEL IS A STRING, NOT A NODE, and that is a real narrowing from
 * `Reading`. `LoadingState` shimmers its label through a background-clip
 * gradient, which paints text and cannot carry an element. Taking a string
 * makes the constraint visible at the call site instead of dropping a nested
 * node silently on the floor once the threshold passes.
 */
export function SlowRead({
  children = "Reading.",
  afterMs,
}: {
  children?: string;
  afterMs?: number;
}) {
  const { slow, startedAt } = useSlowRead(afterMs);

  if (!slow) return <Reading>{children}</Reading>;

  /* `Dots` rather than `Drive`: this sits inline in a region beside prose, and
     the rounded cells read as an indicator where the square ones read as a
     tiny table. `startedAt` is the instant the READ began, not the instant
     this branch was taken, so the figure does not under-report the wait by the
     length of the threshold. */
  return <LoadingState label={children} variant="Dots" startedAt={startedAt} />;
}
