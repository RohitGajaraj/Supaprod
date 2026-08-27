/**
 * ONE DEAD SESSION, SAID ONCE, ON A WHOLE PAGE.
 *
 * A page that mounts several panels gives each one its own read, so when the
 * session dies they all fail and each announces it. Measured on three surfaces
 * before this existed: Brain drew five failure statements and four "Try again"
 * buttons; the settings boundary pane drew five; /learn draws three. Every
 * sentence honest, and together a wall that makes the product look far more
 * broken than it is.
 *
 * A DEAD SESSION IS A PAGE-LEVEL FACT. None of those reads can succeed until
 * the reader signs in, so panels reporting it separately tell them nothing the
 * first one did -- and each offers a "Try again" that would re-read with the
 * same dead token forever. One statement, one control that works.
 *
 * WRITTEN THREE TIMES BEFORE IT WAS EXTRACTED. S3 built it on Brain (U-052)
 * and on the settings boundary pane (U-056); S1 needed the same thing on
 * /learn and asked rather than inventing a second one, which is the drift both
 * lanes keep catching in each other. This is that component.
 *
 * WHAT THE CALLER MUST STILL DECIDE, because it is never the same twice: what
 * is STILL TRUE. "The read failed" is not the fact a reader wants; on a
 * permissions page it is that nothing moved while they were away, on a record
 * it is that nothing was lost. That sentence is the whole value of the card and
 * it cannot be defaulted, so it is a required prop.
 *
 * SCOPE IT DELIBERATELY. Use this only when the page's reads share one dead
 * session. A genuine mixture -- one read dead, the others live -- must keep
 * per-panel honesty, because there the panels disagree and which half is real
 * is exactly what the reader needs.
 *
 * PLACEMENT: `components/system/` is S3's prefix and this is a system-level
 * state rather than a design primitive. If S0 would rather it sat with the
 * shared parts, it moves with no behaviour change.
 */
import { PageHeading, ReadFailed } from "@/components/meridian/surface-parts";
import { sessionEndedMessage } from "@/lib/error-copy";

/**
 * Returns the sentence when the error IS an ended session, so a caller can
 * branch on it before rendering anything else. Null otherwise, which means the
 * page should fall through to its own per-panel handling.
 */
export function endedSessionFor(...errors: unknown[]): string | null {
  for (const e of errors) {
    const said = sessionEndedMessage(e);
    if (said) return said;
  }
  return null;
}

export function SessionEnded({
  /** The page's own title, kept so the reader still knows where they are. */
  title,
  /**
   * THE SURFACE'S OWN HEADING, when it has one.
   *
   * Brain heads its pages with `RecordHead` rather than `PageHeading`, and its
   * session-ended title is "The record is still here." -- which says what is
   * still true in the title itself and is better than anything this component
   * would impose. Forcing one grammar on every caller would have made the
   * shared component worse than the copies it replaced, so a surface with its
   * own head passes it and keeps it.
   */
  head,
  /** What is STILL TRUE. Required: see the header. */
  children,
  /** Any of the page's errors; the primitive derives the sentence and the door. */
  error,
}: {
  title?: string;
  head?: React.ReactNode;
  children: React.ReactNode;
  error: unknown;
}) {
  return (
    <>
      {head ?? <PageHeading title={title ?? ""} sub="You are not signed in any more." />}
      <ReadFailed error={error}>{children}</ReadFailed>
    </>
  );
}
