import { useState, type ReactNode } from "react";

import { glyphForSlug } from "@/components/shell/agent-glyphs";

/*
 * THE RECORD SURFACE'S PARTS, DRAWN IN MERIDIAN.
 *
 * ── WHAT THIS FILE REPLACES, AND WHY IT IS A FILE ───────────────────────
 * Brain and its three components were built entirely out of
 * `src/components/shell/primitives.tsx`, which is the `--sp-*` layer.
 * meridian.css states the migration rule plainly: that layer is life support,
 * "no new surface may use it, every migrated surface drops it". So the port
 * cannot keep Block, Row, Empty, Failed, Loading, Num, Door, Diffstat and
 * Record and still be a port.
 *
 * Meridian ships the parts a DENSE DATA surface needs -- RecordsTable,
 * FilterTable, Search, ContextCards -- and it does not ship the parts a
 * PROSE-AND-ATTRIBUTION surface needs: a region with a heading, an attributed
 * line, an empty state, a failed read, a quiet reading line, a word inside a
 * sentence that goes somewhere. Brain is almost entirely made of those. Rather
 * than write the same markup three times across the route and its two
 * components, they live here once, which is the same shape the Approvals port
 * settled on next door in `src/components/approvals/`.
 *
 * Everything here is a candidate to move into `src/components/meridian/` the
 * moment a second surface needs it. Nothing here is Brain-specific except its
 * copy defaults, and there are none.
 *
 * ── FOCUS IS INHERITED, NOT HAND-WRITTEN ────────────────────────────────
 * Every root in this file carries `data-mrd`, which is the whole mechanism
 * meridian.css describes: `[data-mrd][data-mrd] :focus-visible` outranks the
 * unlayered `[data-obsidian] :focus-visible` in styles.css and paints the
 * neutral `--mrd-focus` ring on every control underneath. So no control in this
 * file writes a focus class of its own.
 *
 * That is deliberately NOT what the Approvals port did: it exports a
 * `FOCUS_RING` constant painting `--mrd-edge-focus`, and meridian.css says in
 * its own words why that token is the wrong one for a ring -- it is a FIELD's
 * border colour, it measured 2.9:1 on paper, and `--mrd-focus` exists because
 * of it. `data-mrd` gets the right token with no constant to keep in sync.
 * The drift between those two is reported rather than fixed here, because
 * both files are outside this lane.
 *
 * ── THE ONE THING THAT IS AN OVERRIDE ───────────────────────────────────
 * `RecordSpeaks` keeps its lamp. See its own note.
 */

/* ------------------------------------------------------------------ *
 * Marks and figures
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

/**
 * Every number, duration, count, id and timestamp, and NOTHING else.
 *
 * meridian.css draws the line the legacy `.sp-num` did not: "Mono is for
 * numbers, durations, counts, ids and timestamps and nothing else. A sentence
 * containing a number is not mono." So this wraps the figure and stops, and the
 * words on either side of it stay in the sans face.
 *
 * It sets no colour and no size. It is used INSIDE sentences that already have
 * both, and a token that changes the size halfway through a line reads as a
 * typo rather than as an emphasis.
 */
export function Figure({ children }: { children: ReactNode }) {
  return <span className="font-mrd-mono tabular-nums">{children}</span>;
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

/**
 * A control the surface is asking you to press.
 *
 * `primary` takes the NEUTRAL primary face, not the accent. meridian.css is
 * explicit that `--mrd-solid` is the primary and that the accent is never spent
 * on chrome; Approvals' `GateAction` puts orchid on its primary because that
 * one control IS the pending human action, and nothing on Brain is. "Capture a
 * signal" and "Try again" are ordinary primaries.
 *
 * The hover goes to `--mrd-solid-hover` and never to `bg-mrd-float`, which
 * meridian.css records as a defect found shipped in two components: `float` is
 * DARKER than `solid` on dark, so the button dims as you reach for it.
 *
 * The label is `--mrd-on-solid` and never `--mrd-ink`. Both `bg-mrd-solid` and
 * `text-mrd-ink` invert with the ground, so they travel together instead of
 * apart: 11.26:1 on dark, 1.19:1 on paper, which is a slab with the ghost of a
 * word on it.
 */
export function Act({
  variant = "default",
  children,
  ...rest
}: {
  variant?: "primary" | "default" | "quiet";
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const face =
    variant === "primary"
      ? "bg-mrd-solid text-mrd-on-solid enabled:hover:bg-mrd-solid-hover"
      : variant === "quiet"
        ? "text-mrd-mute enabled:hover:bg-mrd-hover enabled:hover:text-mrd-body"
        : "border border-mrd-line bg-mrd-lift text-mrd-body enabled:hover:bg-mrd-float enabled:hover:text-mrd-ink";
  return (
    <button
      type="button"
      {...rest}
      data-mrd=""
      className={`inline-flex h-8 items-center gap-2 rounded-mrd-ctl px-3 text-[12.5px] font-medium transition-[background-color,color,opacity,transform] enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-45 ${face}`}
      style={{
        transitionDuration: "var(--mrd-d-press)",
        // The specular top edge that makes a filled control read as a raised
        // object rather than a coloured rectangle. Only the filled variant has
        // a face for light to fall on.
        boxShadow: variant === "primary" ? "inset 0 1px 0 var(--mrd-sheen)" : undefined,
      }}
    >
      {children}
    </button>
  );
}

/** A row of controls. One primary among them, and only one. `trailing` is the
 *  one that undoes or destroys, separated by DISTANCE rather than by colour:
 *  red reports an outcome in this system and orchid means a person is required,
 *  so neither is available to mark an intention. */
export function Acts({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div data-mrd="" className="mt-mrd-4 flex flex-wrap items-center gap-mrd-3">
      {children}
      {trailing ? <span className="ml-auto">{trailing}</span> : null}
    </div>
  );
}

/**
 * A WORD INSIDE A SENTENCE THAT GOES SOMEWHERE.
 *
 * The quiet end of the affordance scale, and the reason it is not a `Act` is
 * the reason the shell primitive it replaces gives: `Act` is for something the
 * surface is ASKING you to do, and this is for a fact that happens to have an
 * address of its own. Brain's second line is four of them in a row.
 *
 * It inherits its size from the line it sits in rather than fixing one, because
 * a control that shrinks halfway through a sentence reads as a typo. The dotted
 * underline goes solid on hover, which is the only thing that changes.
 */
export function Door({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  /** Required. A door with nowhere to go is a span. */
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      data-mrd=""
      title={title}
      onClick={onClick}
      className="rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Regions
 * ------------------------------------------------------------------ */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 transition-transform"
      style={{
        transform: open ? "rotate(90deg)" : undefined,
        transitionDuration: "var(--mrd-d-move)",
        transitionTimingFunction: "var(--mrd-ease)",
      }}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * A region, with a heading that is a real heading.
 *
 * The shell primitive this replaces carries a measured defect in its own
 * header: every region title on Brain was a `<span>`, so a reader navigating by
 * heading got exactly one stop on a five-tab surface. That fix is kept, and so
 * is the reason it mattered for the TYPE: a span carries no size of its own, so
 * the heading role had to be drawn entirely by a class that sat below the body
 * text underneath it.
 *
 * `lead` is the one rung between the page title and everything else, and it is
 * opt-in and rare on purpose. A surface that marks every region has marked
 * none, so it belongs to the regions carrying the surface's ARGUMENT and never
 * to the ones carrying its inventory. 20px is `--mrd-t-h3`, the same step
 * Approvals' gate question stands on.
 */
export function Region({
  title,
  sub,
  more,
  onMore,
  lead = false,
  children,
}: {
  title?: string;
  /** What this region is FOR, said once. If it restates the title it should not
   *  exist: label, sublabel and helper all saying one thing is a hard ban. */
  sub?: ReactNode;
  more?: string;
  onMore?: () => void;
  lead?: boolean;
  children: ReactNode;
}) {
  return (
    <section data-mrd="" className="flex flex-col">
      {title || more ? (
        <div className="flex items-baseline justify-between gap-mrd-4">
          {title ? (
            <h2
              className={
                lead
                  ? "text-[20px] leading-tight font-medium text-mrd-ink"
                  : "text-[13px] font-medium text-mrd-mute"
              }
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {more ? (
            <button
              type="button"
              onClick={onMore}
              className="shrink-0 rounded-mrd-xs text-[12.5px] text-mrd-mute transition-colors hover:text-mrd-ink"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              {more}
            </button>
          ) : null}
        </div>
      ) : null}

      {sub ? (
        <div className="mt-mrd-3 max-w-[68ch] text-[12.5px] leading-relaxed text-mrd-mute">
          {sub}
        </div>
      ) : null}

      <div className={title || sub || more ? "mt-mrd-4" : undefined}>{children}</div>
    </section>
  );
}

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
 * The three states a read can be in, kept apart
 * ------------------------------------------------------------------ */

/**
 * NOTHING IS HERE YET, and who acts next.
 *
 * `action` is the door. An empty state that names who acts next and gives you
 * no way to act is only half honest.
 */
export function NothingYet({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div data-mrd="" className="max-w-[62ch] text-[13px] leading-relaxed text-mrd-body">
      {/* A div rather than a p, and that is a bug fix rather than a preference:
          a `<p>` may only contain phrasing content, so the moment a caller
          passes two paragraphs the markup is invalid and React refuses to
          hydrate. That was caught in a browser on /today. */}
      <div>{children}</div>
      {action ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{action}</div> : null}
    </div>
  );
}

/**
 * THE READ FAILED, which is a different fact from an empty region and must
 * never wear its clothes. "Nothing here" and "we could not find out" send a
 * person in opposite directions, so this says which one it is and carries the
 * way out.
 *
 * Red is correct and is not a warning: it reports an OUTCOME, which is the only
 * thing this system's red is ever allowed to mean.
 */
export function ReadFailed({
  children,
  onRetry,
  retryLabel = "Try again",
}: {
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      data-mrd=""
      role="status"
      aria-live="polite"
      className="max-w-[68ch] text-[13px] leading-relaxed"
    >
      <span className="text-mrd-fail">{children}</span>
      {onRetry ? (
        <>
          {" "}
          <button
            type="button"
            onClick={onRetry}
            className="rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {retryLabel}
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * A READ STILL IN FLIGHT. The third fact, and the quiet one.
 *
 * DELIBERATELY NOT `LoadingState`. That component's own header forbids this
 * use: "an elapsed timer on a 200ms fetch is noise. Use this only where work
 * genuinely takes seconds and a person is waiting on the result. Ordinary reads
 * get a plain quiet state." Every read on Brain is an ordinary read of rows.
 * This is the same plain line the Approvals port draws over its queue.
 */
export function Reading({ children = "Reading." }: { children?: ReactNode }) {
  return (
    <p data-mrd="" role="status" aria-live="polite" className="text-[13px] text-mrd-mute">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * A diff, and the record speaking
 * ------------------------------------------------------------------ */

/**
 * WHAT MOVED, AND WHICH WAY.
 *
 * A ZERO SIDE IS NOT DRAWN. "+10 -0" presents a zero as if it were a finding:
 * nothing was removed because there was nothing there to remove. Both zero
 * cannot happen, because every caller draws this only for something that
 * changed; the guard is kept anyway so it can never render an empty box.
 *
 * Green and red are outcomes here, which is the only thing they are allowed to
 * be in this system.
 */
export function Delta({
  added,
  removed,
  unit = "lines",
}: {
  added: number;
  removed: number;
  /** What is being counted. The shape reads as LINES by default, so anything
   *  counting something else has to say so rather than borrow a meaning. */
  unit?: string;
}) {
  const both = added === 0 && removed === 0;
  const chip = "rounded-mrd-xs px-1 font-medium";
  return (
    <span
      data-mrd=""
      className="font-mrd-mono inline-flex items-center gap-1 text-[11.5px] tabular-nums"
      aria-label={`${added} ${unit} added, ${removed} ${unit} removed`}
    >
      {added > 0 || both ? (
        <b
          className={`${chip} text-mrd-pass`}
          style={{
            background: "color-mix(in oklab, var(--mrd-pass) 16%, transparent)",
            boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--mrd-pass) 26%, transparent)",
          }}
        >
          +{added}
        </b>
      ) : null}
      {removed > 0 ? (
        <b
          className={`${chip} text-mrd-fail`}
          style={{
            background: "color-mix(in oklab, var(--mrd-fail) 16%, transparent)",
            boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--mrd-fail) 26%, transparent)",
          }}
        >
          &minus;{removed}
        </b>
      ) : null}
    </span>
  );
}

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
 * is what makes it register on a page of grey rows. That exception is kept.
 *
 * Meridian has no token for it, so the light is mixed from `--mrd-ink` at 7%,
 * which resolves correctly in both grounds: a warm paper-white bloom on dark,
 * and a soft ink shadow on paper, both landing in the same place. It is derived
 * inline in ONE file on purpose. meridian.css's own note on `--mrd-sheen` says
 * the rule -- three files doing the same colour arithmetic is three files that
 * drift -- so the moment a second surface wants this, it becomes `--mrd-spot`.
 *
 * The legacy version also BREATHED, once every eight seconds. That is not
 * carried over: Meridian's keyframes are `pixel-on`, `shimmer`, `fade-in`,
 * `fade-up`, `eq`, `spin` and `pop-in`, and none of them is a low-amplitude
 * eight-second breath. Faking it with `pixel-on` would run 0.15 to 1 opacity,
 * which is a flash rather than a breath. Reported rather than approximated.
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
