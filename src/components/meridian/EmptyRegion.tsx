import type { ReactNode } from "react";

/*
 * EMPTY REGION, the state where a surface asked its question and the answer was
 * nothing.
 *
 * ── WHY THIS EXISTS, AND WHY IT IS NOT `NothingYet` ─────────────────────
 * Meridian already had `NothingYet` (`surface-parts.tsx`), and it is correct for
 * what it does: a quiet sentence INSIDE a block that something else has already
 * labelled. `PromotionCard`'s inset carries an `Eyebrow` reading "What settled
 * it" and then a `NothingYet` under it. A headline there would say the same
 * thing twice.
 *
 * THE CASE THAT HAD NO COMPONENT is the other one: a whole region is empty and
 * nothing else on it is labelling the space. A bare sentence floating in an
 * empty panel gives the eye nothing to land on, which is the founder's own
 * complaint about text being dumped, arriving through the back door.
 *
 * FOUNDER, this session: "in the neat setup... there is a header, subtext, and
 * below that another layer of texture... it is not giving the proper
 * distinction between what is header one, what is header two, and what is header
 * three."
 *
 * ── WHY IT IS NOT `NeedsSetup` EITHER, WHICH IS THE NEAR MISS ───────────
 * `NeedsSetup`'s own header names three facts this product had been collapsing
 * into two states: nothing exists yet, the read failed, and a precondition is
 * missing. It was built for the third. This is the FIRST, and the difference is
 * not cosmetic: a precondition has exactly one act that changes anything and
 * naming it is the whole job, while a genuinely empty region often has nothing
 * for a person to do and must not invent an action to look helpful.
 *
 * So `action` is OPTIONAL here and required in spirit there. An empty region
 * that offers a button nobody needs is worse than one that says, plainly, that
 * the machinery is working and nothing has arrived.
 *
 * ── WHAT THE REFERENCE SHOWS, AND WHAT WAS TAKEN FROM IT ────────────────
 * Read from Mobbin on 2026-08-23, web: Copilot's Helpdesk empty state and
 * Front's knowledge-base empty state. Both, independently, use exactly three
 * text levels and stop:
 *
 *   a headline, at roughly 1.5x the body size
 *   one or two lines of muted supporting text
 *   one control, filled, and nothing competing with it
 *
 * The MECHANIC worth copying is not the layout, it is the RATIO and the
 * restraint. Neither reference adds a fourth level, and neither separates its
 * levels by a couple of pixels: the headline is obviously a headline before a
 * word of it is read. `mrd-title` over `mrd-copy` is 20px over 14px, which is
 * that ratio in this system's own stops.
 *
 * A glyph is optional and deliberately small. Both references anchor the block
 * with one, and both keep it quiet: it marks where the block begins rather than
 * decorating it.
 */

export function EmptyRegion({
  title,
  children,
  action,
  glyph,
  meta,
}: {
  /** What is empty, said as a fact. "No decisions yet", never "No results". */
  title: string;
  /** Why it is empty, and what would change it. One or two sentences. */
  children: ReactNode;
  /**
   * OPTIONAL, and think before passing one. A region that is empty because the
   * loop has not produced anything yet has no act for a person to take, and a
   * button there invents work. Pass this only when there is a real door.
   */
  action?: ReactNode;
  /** A small quiet mark to anchor the block. Optional; never decorative. */
  glyph?: ReactNode;
  /** One quieter line under the body. Use for a fact, not for encouragement. */
  meta?: string;
}) {
  return (
    <div
      data-mrd=""
      /* Left-aligned, not centred. Centred empty states read as an error page,
         and this region usually sits inside a panel whose other content is left
         aligned; two alignments in one panel is the thing that makes a surface
         feel unplanned. */
      className="flex flex-col items-start px-mrd-6 py-mrd-7"
      // Not aria-live: this is the state on arrival, not a change to announce.
    >
      {glyph ? (
        <span aria-hidden className="mb-mrd-4 text-mrd-faint">
          {glyph}
        </span>
      ) : null}

      <h2 className="mrd-title">{title}</h2>

      <div className="mt-mrd-3 max-w-[62ch] mrd-copy">{children}</div>

      {meta ? <p className="mt-mrd-2 max-w-[62ch] mrd-meta">{meta}</p> : null}

      {action ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{action}</div> : null}
    </div>
  );
}

export default EmptyRegion;
