import { useState, type ReactNode } from "react";

import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { Chevron } from "@/components/meridian/surface-parts";

/*
 * WHAT IS LEFT OF THE RECORD SURFACE'S OWN PARTS.
 *
 * ── THE HEADER'S PROMISE, KEPT ON 2026-08-15 ────────────────────────────
 * This file used to open by saying that everything in it "is a candidate to
 * move into src/components/meridian/ the moment a second surface needs it".
 * Three surfaces later nothing had moved, and `ReadFailed` had reached five
 * copies. `Figure`, `Region`, `Reading`, `NothingYet`, `Act`, `Acts`, `Door`,
 * `Delta` and the chevron are now in `components/meridian/surface-parts.tsx`,
 * along with the same ideas from Approvals, Crew, the Engine Room and Runs.
 *
 * ── WHAT DID NOT MOVE, AND WHY ──────────────────────────────────────────
 * Four things, and each of them fails the test a part has to pass. A part moves
 * when two surfaces genuinely mean the same thing by it; these are each drawn
 * on Brain and nowhere else.
 *
 *   `CrewMark` is the agent as identity ALONE, always faint, claiming nothing
 *   about how the run went. Crew's mark of the same name is a status badge with
 *   six states and Runs' carries five more, so the three of them share only the
 *   glyph, and the glyph is already shared through `agent-glyphs.tsx`. Folding
 *   them together would need a union of three state vocabularies behind one
 *   prop, which is three meanings wearing one name.
 *
 *   `RecordSpeaks` keeps its lamp, and the lamp is why it stayed. Meridian
 *   permits exactly ONE lit object in the product and this is it; Runs' `Recess`
 *   is the same recess with the lamp deliberately refused. A `lamp` prop would
 *   turn a scarcity rule into a switch anyone can flip.
 *
 *   `RecordLine` and `RecordDoors` are drawn on this surface only.
 *
 * ── FOCUS IS INHERITED, NOT HAND-WRITTEN ────────────────────────────────
 * Every root here carries `data-mrd`, which is the whole mechanism meridian.css
 * describes: `[data-mrd][data-mrd] :focus-visible` outranks the unlayered
 * `[data-obsidian] :focus-visible` in styles.css and paints the neutral
 * `--mrd-focus` ring on every control underneath. The `FOCUS_RING` constant the
 * other three ports exported could never do that, and styles.css says so at the
 * rule that beats it.
 */

/* ------------------------------------------------------------------ *
 * The mark
 * ------------------------------------------------------------------ */

/**
 * The agent that did the thing, as a SHAPE and never as a hue.
 *
 * This replaces the shell's `AgentMark`, and the change is the same one
 * `CallContext` made on the Approvals port for the same stated reason. The
 * shell mark encodes the agent as a shape AND its loop stage as one of seven
 * hues. That is a good system and it is the wrong one here: Meridian spends
 * colour on one distinction only, what a machine did against what a person must
 * decide, and a stage rainbow down a column of standing rules competes with the
 * single accent that means someone is required. `station-glyphs.tsx` states the
 * ruling in full ("identity is shape here, never hue").
 *
 * The glyph itself is reused rather than redrawn, so an agent that is a spiral
 * on Approvals is a spiral here. Two drawings of one roster is the failure that
 * file was written to prevent.
 *
 * The name rides as a `title` rather than as visible text because every place
 * this is drawn already names the actor in the line beside it.
 */
export function CrewMark({ slug, name }: { slug: string | null | undefined; name: string }) {
  const Glyph = glyphForSlug(slug);
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className="mt-px flex size-4 shrink-0 items-center justify-center text-mrd-faint [&>svg]:size-[13px]"
    >
      <Glyph />
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Regions
 * ------------------------------------------------------------------ */

/**
 * ONE COLLAPSED DOOR. Depth is a click away, never stacked on the surface.
 *
 * Moved off the shell's ghost `Button` with a hand-written negative margin,
 * which was compensating for a control that was never meant to open a section.
 * A disclosure is a `<button aria-expanded>` and its chevron turns; nothing
 * else about it is a button in a toolbar.
 */
export function Disclosure({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section data-mrd="">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="-mx-1 inline-flex items-center gap-mrd-3 rounded-mrd-ctl px-1 py-1 text-[12.5px] font-medium text-mrd-mute transition-colors hover:text-mrd-ink"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        <Chevron open={open} />
        {label}
      </button>
      {open ? (
        <div id={id} className="mt-mrd-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Lines
 * ------------------------------------------------------------------ */

/**
 * WHO DID WHAT, AND WHEN. The system's grammar for an event.
 *
 * A row in a list never wraps past two lines: one lead, one different fact, and
 * depth is a click away rather than showcased on the surface.
 *
 * A row that is clickable AND carries its own control cannot be one button, so
 * the readable part becomes the clickable region and the control sits outside
 * it at the trailing edge. That is the shell primitive's rule and it is right;
 * only the paint changed.
 *
 * `mrd-focus-inset` is on the clickable region because a row sits flush inside
 * a region that clips, and an outset ring on a flush row is sheared off and
 * reads as a broken half-drawn edge rather than as focus.
 */
export function RecordLine({
  mark,
  lead,
  sub,
  time,
  onClick,
  action,
}: {
  mark?: ReactNode;
  lead: ReactNode;
  sub?: ReactNode;
  time?: string | null;
  onClick?: () => void;
  action?: ReactNode;
}) {
  const body = (
    <>
      {mark ? <span className="flex w-4 shrink-0 justify-center">{mark}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-snug text-mrd-ink">{lead}</span>
        {sub ? (
          <span className="mt-0.5 block text-[12.5px] leading-snug text-mrd-mute">{sub}</span>
        ) : null}
      </span>
      {time ? (
        <span className="font-mrd-mono shrink-0 text-[11.5px] tabular-nums text-mrd-faint">
          {time}
        </span>
      ) : null}
    </>
  );

  /* One class string for both shapes, so a line does not reflow the moment the
     thing it names becomes openable. The alignment is decided ONCE here rather
     than conditionally appended: two alignment utilities in one list resolve by
     stylesheet order and not by the order they were written, which is a defect
     that looks correct in a diff. */
  const shell = `flex w-full gap-mrd-4 py-mrd-3 text-left ${action ? "items-center" : "items-start"}`;

  if (onClick) {
    return (
      <div
        data-mrd=""
        className="flex items-start gap-mrd-3 border-b border-mrd-line-soft last:border-0"
      >
        <button
          type="button"
          onClick={onClick}
          className={`mrd-focus-inset rounded-mrd-ctl transition-colors hover:bg-mrd-hover ${shell}`}
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          {body}
        </button>
        {action ? <span className="shrink-0 self-center">{action}</span> : null}
      </div>
    );
  }

  return (
    <div data-mrd="" className={`border-b border-mrd-line-soft last:border-0 ${shell}`}>
      {body}
      {action ? <span className="shrink-0">{action}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The record speaking
 * ------------------------------------------------------------------ */

/**
 * THE RECORD SPEAKING: the one lit surface in the product.
 *
 * It is a recess rather than a card, so it reads as something the page opened a
 * hole into rather than as one more container stacked on the ground. The claim
 * sits at `--mrd-t-lead`, the one figure on this surface worth reading before
 * the words around it, and the evidence under it is mono because it is counts
 * and dates.
 *
 * ── THE LAMP IS A DELIBERATE OVERRIDE, AND IT IS DERIVED HERE ───────────
 * anti-slop bans a glow on the dark ground, and the legacy record was recorded
 * as a deliberate exception to it: this is the only lit object anywhere, which
 * is what makes it register on a page of grey rows. That exception is kept, and
 * it is also why this component did not move to Meridian when the rest of this
 * file did. Runs' `Recess` is the same recess with the lamp refused, and the
 * two are kept apart rather than merged behind a `lamp` prop, because the rule
 * is that there is exactly ONE of these and a prop is an invitation to a
 * second.
 *
 * Meridian has no token for it, so the light is mixed from `--mrd-ink` at 7%,
 * which resolves correctly in both grounds: a warm paper-white bloom on dark,
 * and a soft ink shadow on paper, both landing in the same place. It is derived
 * inline in ONE file on purpose. meridian.css's own note on `--mrd-sheen` says
 * the rule -- three files doing the same colour arithmetic is three files that
 * drift -- so the moment a second surface wants this, it becomes `--mrd-spot`.
 *
 * The legacy version also BREATHED, once every eight seconds. That is not
 * carried over: Meridian's keyframes are `pixel-on`, `attention`, `shimmer`,
 * `fade-in`, `fade-up`, `eq`, `spin` and `pop-in`, and none of them is a
 * low-amplitude eight-second breath. Faking it with `pixel-on` would run 0.15
 * to 1 opacity, which is a flash rather than a breath. Reported rather than
 * approximated.
 */
export function RecordSpeaks({
  children,
  evidence,
  onClick,
  title,
}: {
  /** What the record says. It contradicts you or it confirms you; either way it
   *  is a claim, and never a statistic dressed as one. */
  children: ReactNode;
  /** What backs it. Counts and dates, in mono. */
  evidence?: ReactNode;
  /** Absent when nothing happens on click. Present when the claim names a prior
   *  decision the reader can go and open, which is the usual case. */
  onClick?: () => void;
  title?: string;
}) {
  const body = (
    <>
      <span aria-hidden className="relative z-[1] mt-1.5 size-2.5 shrink-0 rotate-45 bg-mrd-ink" />
      <span className="relative z-[1] min-w-0">
        <span className="block text-[17px] leading-tight text-mrd-ink">{children}</span>
        {evidence ? (
          <span className="font-mrd-mono mt-mrd-3 block text-[11.5px] tabular-nums text-mrd-mute">
            {evidence}
          </span>
        ) : null}
      </span>
    </>
  );

  const lamp = (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-[70px] -left-[40px] h-[210px] w-[280px]"
      style={{
        background:
          "radial-gradient(closest-side, color-mix(in oklab, var(--mrd-ink) 7%, transparent), transparent 72%)",
      }}
    />
  );

  // The div and the button are drawn from one class string so a record does not
  // reflow the moment the decision it cites becomes openable.
  const shell =
    "relative flex w-full gap-mrd-5 overflow-hidden rounded-mrd-card bg-mrd-sink px-mrd-6 py-mrd-5 text-left";

  if (!onClick) {
    return (
      <div data-mrd="" className={shell} title={title}>
        {lamp}
        {body}
      </div>
    );
  }

  return (
    /* Only a button lights up: an affordance is a promise, so a record that
       opens nothing must not move under the cursor. The hover steps the recess
       one stop up the neutral ladder rather than adding a second moving thing,
       because the lamp is already there and two of them compete. */
    <button
      type="button"
      data-mrd=""
      title={title}
      onClick={onClick}
      className={`mrd-focus-inset transition-colors hover:bg-mrd-lift ${shell}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {lamp}
      {body}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The doors
 * ------------------------------------------------------------------ */

/**
 * THE TAB STRIP, and the selected door is obvious on the dark ground.
 *
 * `--mrd-select` rather than `--mrd-hover`, and that distinction is the point.
 * meridian.css names using hover as a selected state as a recurring bug in this
 * codebase: hover is a 4.5% whisper designed to be barely perceptible under a
 * pointer, and a selected thing must be unmistakable because everything below
 * it is about exactly that choice. Here the selected door also steps up the
 * neutral ladder and takes ink weight, so it survives greyscale.
 *
 * NO HUE ANYWHERE. These are five doors into one record, not five statuses.
 *
 * KNOWN GAP, AND IT IS NOT THIS LANE'S TO CLOSE. This declares `role="tablist"`
 * and `role="tab"` and carries neither a roving tab stop nor arrow keys, so it
 * promises a keyboard it does not have. `components/runs/Tabs.tsx` is the same
 * strip with that contract built, and the Engine Room's `ViewTabs` is a third
 * copy with the same gap. Consolidating the three needs `TabPanel` wiring at
 * every call site, which changes the DOM inside a Suspense boundary here.
 */
export function RecordDoors<T extends string>({
  doors,
  active,
  onOpen,
  label,
}: {
  doors: { id: T; label: string }[];
  active: T;
  onOpen: (id: T) => void;
  /** Names the set for assistive tech: what the doors are doors INTO. */
  label: string;
}) {
  return (
    <div
      data-mrd=""
      role="tablist"
      aria-label={label}
      className="flex flex-wrap items-center gap-mrd-2 border-b border-mrd-line pb-mrd-3"
    >
      {doors.map((door) => {
        const on = active === door.id;
        return (
          <button
            key={door.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onOpen(door.id)}
            className={`inline-flex h-8 items-center rounded-mrd-chip px-3 text-[12.5px] transition-colors ${
              on
                ? "bg-mrd-select font-medium text-mrd-ink"
                : "text-mrd-mute hover:bg-mrd-hover hover:text-mrd-body"
            }`}
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {door.label}
          </button>
        );
      })}
    </div>
  );
}
