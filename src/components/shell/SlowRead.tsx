import { LoadingState } from "@/components/meridian/LoadingState";
import { useElapsed } from "@/components/meridian/use-elapsed";
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
  inline = false,
}: {
  children?: string;
  afterMs?: number;
  /**
   * FOR THE SLOTS THAT CANNOT TAKE A BLOCK, and there are real ones.
   *
   * `PageHeading` renders its `sub` inside a `<p>`. Crew's loading state lives
   * there, and it is the one I MEASURED at 6.9 seconds, so it is precisely the
   * case this component exists for — and it is the one place the component
   * could not go, because both `Reading` and `LoadingState` draw block
   * elements and a `<p>` inside a `<p>` is not nesting, it is the browser
   * closing the first one and rearranging the DOM underneath you.
   *
   * So the inline form gives up the pixel grid and keeps the half that
   * carries the information: the sentence, and the figure after it. No
   * wrapper, no live region of its own, nothing that changes the shape of the
   * slot it sits in.
   */
  inline?: boolean;
}) {
  const { slow, startedAt } = useSlowRead(afterMs);
  /* Called unconditionally, as hooks must be, and told to stay asleep unless
     this branch will actually render the figure. `useElapsed`'s `active` flag
     exists so a caller does not pay for a 100ms interval it will never show. */
  const elapsed = useElapsed(startedAt, slow && inline);

  if (inline) {
    if (!slow) return <>{children}</>;
    return (
      <>
        {children} <span className="font-mrd-mono mrd-meta tabular-nums">{elapsed}</span>
      </>
    );
  }

  if (!slow) return <Reading>{children}</Reading>;

  /*
   * THE TICKING FIGURE IS KEPT OUT OF THE LIVE REGION, and this is the whole
   * reason this branch is not simply `<LoadingState/>`.
   *
   * `use-elapsed` runs `setInterval(..., 100)`, so the figure changes TEN
   * TIMES A SECOND, and `LoadingState` puts it inside its own
   * `role="status" aria-live="polite"`. One of those is already a lot; the
   * board draws three at once. A screen-reader user would be read a stream of
   * numbers for as long as the page took to load, which on the measurement
   * that motivated this component was twenty-two seconds.
   *
   * R-19 defers small-screen work and explicitly does NOT defer accessibility,
   * naming "aria-live on anything that updates asynchronously" as in scope at
   * full weight. This is exactly that, and wiring three of them onto /today is
   * what turned a latent problem into a live one, so it is mine to close here
   * rather than to report.
   *
   * So the visual half is hidden from assistive tech entirely and the spoken
   * half is said once. A sighted reader still gets the ticking figure, which is
   * the entire point of escalating; a listening reader gets one sentence that
   * tells them the same thing the figure tells everyone else, which is that
   * this is still going and is taking a while.
   *
   * `Dots` rather than `Drive`: this sits inline in a region beside prose, and
   * the rounded cells read as an indicator where the square ones read as a tiny
   * table. `startedAt` is the instant the READ began, not the instant this
   * branch was taken, so the figure does not under-report the wait by the
   * length of the threshold.
   */
  return (
    <>
      <span aria-hidden className="block">
        <LoadingState label={children} variant="Dots" startedAt={startedAt} />
      </span>
      <p role="status" className="sr-only">
        {children} Still reading.
      </p>
    </>
  );
}
