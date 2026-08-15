import * as React from "react";

/*
 * THE CHROME FIVE SURFACES HAD EACH GROWN A PRIVATE COPY OF.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────
 * Approvals, Brain, Crew, the Engine Room and Runs were ported to Meridian one
 * at a time, and each port wrote the same parts again. `record-parts.tsx` said
 * so in its own header on the first day: everything in it "is a candidate to
 * move into src/components/meridian/ the moment a second surface needs it".
 * `CrewChrome.tsx`, `EngineChrome.tsx` and `run-parts.tsx` each repeated the
 * warning and each took the debt anyway. `ReadFailed` reached five copies.
 *
 * The test applied here, and the only one: A PART MOVES WHEN TWO SURFACES
 * GENUINELY MEAN THE SAME THING BY IT. Not when two files hold the same name.
 * Three marks, three gates and three record panels stayed where they were,
 * because the surfaces disagree about what they are, and merging a
 * disagreement behind a prop is how a design system turns into a pile of
 * flags.
 *
 * ── FOCUS IS INHERITED HERE, AND THE CONSTANT IT REPLACES NEVER WORKED ───
 * Three of the five files exported
 *
 *   const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-1
 *                       focus-visible:outline-[var(--mrd-focus)]"
 *
 * and six more imported it. It is inert, and `src/styles.css` says so at the
 * rule that beats it, with the browser check that proved it: `[data-obsidian]
 * :focus-visible` is UNLAYERED, Tailwind emits utilities into a layer, and
 * unlayered wins over layered whatever the specificity. So any component-level
 * `focus-visible:outline-*` class "is permanently inert here. It cannot win no
 * matter what color it names."
 *
 * Which leaves two cases and neither of them needs the constant. Inside a
 * `data-mrd` subtree, meridian.css already paints `--mrd-focus`. Outside one,
 * the constant does nothing and the control takes the app-wide legacy ring.
 * Every root in this file therefore carries `data-mrd` and no control writes a
 * focus class, which is the mechanism meridian.css describes and the one that
 * actually paints.
 *
 * ── ONE CONTROL SIZE ────────────────────────────────────────────────────
 * The five files carried two: h-9 / px-4 / 13px on Approvals, Crew and the
 * Engine Room, h-8 / px-3 / 12.5px on Brain and Runs. Neither was argued for
 * anywhere, and the same JOB appears at both sizes, so it is drift rather than
 * a scale: the gate on /approvals draws its controls at h-9 and the gate on a
 * run draws the same act at h-8. The h-8 stop wins because it is the one
 * closest to Meridian's own, which `ApprovalCard` sets at `h-7 px-3
 * text-[12.5px] font-medium`: same padding, same type, four pixels of height
 * apart. /approvals mounts that card directly under its gate, so this is also
 * the first time those two agree on one screen.
 */

/* ------------------------------------------------------------------ *
 * Type
 * ------------------------------------------------------------------ */

/**
 * Every number, duration, count, id and timestamp, and NOTHING else.
 *
 * meridian.css draws the line the legacy `.sp-num` did not: mono is for those
 * things "and nothing else. A sentence containing a number is not mono."
 *
 * IT SETS NO COLOUR, which is the difference between the two versions this
 * replaces. Crew and the Engine Room painted it `text-mrd-ink`, and every one
 * of their call sites is a figure INSIDE a sentence: "Run <Figure>12</Figure>
 * times", "<Figure>3</Figure> of them have enough results to rank on". A
 * number that jumps to full ink halfway through a muted line reads as a typo
 * rather than as an emphasis, and in `RecordSpeaks`'s evidence line it jumped
 * two stops at once. It inherits now, so a caller that genuinely wants a
 * headline figure says so where the headline is.
 */
export function Figure({ children }: { children: React.ReactNode }) {
  return <span className="font-mrd-mono tabular-nums">{children}</span>;
}

/**
 * The uppercase micro-label, and the ONE place mono is not used for it.
 *
 * meridian.css reserves a stop for exactly this and nothing else:
 * `--mrd-t-nano` at 10px with `--mrd-w-micro` at weight 650, uppercase. That
 * is what makes a label read as a label without borrowing a monospace face it
 * has no numerical reason to wear.
 */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-[650] tracking-mrd-label text-mrd-mute uppercase">
      {children}
    </span>
  );
}

/** The page's one h1, and the sentence under it. `--mrd-t-h2` is the step every
 *  ported surface puts a page title on, and 74ch is the prose measure: a page
 *  subtitle is prose, and it is the widest thing here on purpose, because a
 *  region's own sub sits one rung in at 68ch. */
export function PageHeading({ title, sub }: { title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <header data-mrd="">
      <h1 className="text-[25px] leading-tight font-medium text-mrd-ink">{title}</h1>
      {sub ? (
        <p className="mt-mrd-3 max-w-[74ch] text-[13px] leading-relaxed text-mrd-body">{sub}</p>
      ) : null}
    </header>
  );
}

/**
 * The one chevron. It points right at rest and turns down when a disclosure is
 * open, which is the only difference between the two private copies this
 * replaces: Brain rotated it, Crew pointed it at a row that goes somewhere.
 * One drawing, for the same reason `agent-glyphs.tsx` gives for the roster.
 *
 * IT NAMES BOTH TRANSITIONED PROPERTIES ITSELF, and a caller passes colours
 * only. Crew's copy carried `transition-colors` and Brain's `transition-transform`,
 * and both set the same longhand: had the two been concatenated, one of them
 * would have been dropped by STYLESHEET order rather than by the order they were
 * written, which is a defect that looks correct in a diff. Naming both here
 * leaves nothing for a caller to conflict with.
 */
export function Chevron({ open = false, className = "" }: { open?: boolean; className?: string }) {
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
      className={`shrink-0 transition-[transform,color] ${className}`}
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
 * The primitive all four copies replaced drew every region title in a `<span>`,
 * so a reader navigating by heading got one stop on a five-tab surface. That
 * fix is kept, and so is the half of it Brain and Runs dropped: the same
 * comment complains that a span "sat below the body text underneath it", and
 * then paints the fixed `<h2>` `text-mrd-mute`, which is a stop DIMMER than the
 * `text-mrd-body` it sits over. So the title is ink here, which is also what
 * every other heading in `src/components/meridian/` is.
 *
 * `sub` says what the region is FOR, once, and never restates the title. It is
 * a `<div>` rather than a `<p>` for the reason `NothingYet` records: a `<p>`
 * may only hold phrasing content, so a caller passing two paragraphs produces
 * markup React refuses to hydrate.
 *
 * `lead` is the one rung between the page title and everything else, opt-in and
 * rare: a surface that marks every region has marked none, so it belongs to the
 * regions carrying an ARGUMENT and never to the ones carrying inventory.
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
  sub?: React.ReactNode;
  more?: string;
  onMore?: () => void;
  lead?: boolean;
  children: React.ReactNode;
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
                  : "text-[13px] font-medium text-mrd-ink"
              }
            >
              {title}
            </h2>
          ) : (
            <span aria-hidden />
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
        <div
          className={`${title || more ? "mt-mrd-3" : ""} max-w-[68ch] text-[12.5px] leading-relaxed text-mrd-mute`}
        >
          {sub}
        </div>
      ) : null}

      <div className={title || sub || more ? "mt-mrd-4" : undefined}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

/**
 * The shape of a control: everything about it except what colour it is.
 *
 * `active:scale-[0.98]` and nothing bouncier. Meridian's motion is ease-out
 * exponential with no elastic anywhere, and a press is 120ms. The bare
 * `active:` rather than `enabled:active:` is load bearing: `:enabled` matches
 * form controls only, so a link wearing this shape would otherwise lose its
 * press. A disabled button never matches `:active` in the first place.
 */
export const CONTROL_SHAPE =
  "inline-flex h-8 items-center gap-2 rounded-mrd-ctl px-3 text-[12.5px] font-medium whitespace-nowrap transition-[background-color,color,opacity,transform] active:scale-[0.98]";

const CONTROL_DEAD = "disabled:cursor-default disabled:opacity-45";

/** Drawn by the file that BINDS the key, never by a component that cannot see
 *  the listener. That rule is why every caller passes this as a prop. */
function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-mrd-mono rounded-mrd-xs border border-current px-1 text-[11px] opacity-60">
      {children}
    </kbd>
  );
}

export type ActionVariant = "default" | "primary" | "quiet";

const ACTION_FACE: Record<ActionVariant, string> = {
  /*
   * The neutral primary: the one stop on the ladder nothing else in the product
   * uses. The hover goes to `--mrd-solid-hover` and NEVER to `bg-mrd-float`,
   * which meridian.css records as a defect found shipped in two components:
   * `float` is DARKER than `solid` on dark, so the button dims as you reach for
   * it, and near-white on paper, which puts a light label on a pale slab.
   *
   * The label is `--mrd-on-solid` and never `--mrd-ink`. Both `bg-mrd-solid`
   * and `text-mrd-ink` invert with the ground, so they travel together instead
   * of apart: 11.26:1 on dark, 1.19:1 on paper, a slab with the ghost of a word
   * on it.
   */
  primary: "bg-mrd-solid text-mrd-on-solid enabled:hover:bg-mrd-solid-hover",
  // `enabled:hover:` and not a bare `hover:`. A dead control that still lights
  // up under the pointer is promising something it will not do, and these
  // surfaces deliberately keep disabled controls pointer-reachable so a `title`
  // can say what would unlock them.
  quiet: "text-mrd-mute enabled:hover:bg-mrd-hover enabled:hover:text-mrd-body",
  default:
    "border border-mrd-line bg-mrd-lift text-mrd-body enabled:hover:bg-mrd-lift-hover enabled:hover:text-mrd-ink",
};

/**
 * A CONTROL THAT DOES SOMETHING, AND UNBLOCKS NOTHING.
 *
 * This is deliberately not the same component as `Approve`, and the split is
 * the design system's own rule rather than a preference: approve names a GATE
 * ACTION, something is blocked pending the click, and review names looking at
 * something. Every control here fails that test. "Try again" re-reads, "Open
 * the run" navigates, "Hand it over" starts work, "Capture a signal" writes a
 * row. None of them releases anything that is currently held.
 *
 * The four files that grew a copy of this had already reached that conclusion
 * separately, in their own words, and the Engine Room's copy went furthest:
 * it refused a primary variant outright because "an engineer came here to read
 * evidence". They then disagreed about what `primary` meant, and one of them
 * spent orchid on a failed read's retry. Making the accent a different
 * COMPONENT rather than a different string is what stops that recurring.
 */
export function Action({
  variant = "default",
  shortcut,
  className = "",
  children,
  ...rest
}: {
  variant?: ActionVariant;
  shortcut?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      data-mrd=""
      className={`${CONTROL_SHAPE} ${CONTROL_DEAD} ${ACTION_FACE[variant]} ${className}`}
      style={{
        transitionDuration: "var(--mrd-d-press)",
        // The specular top edge that makes a filled control read as a raised
        // object rather than a coloured rectangle. Only a filled face has
        // somewhere for light to fall.
        boxShadow: variant === "primary" ? "inset 0 1px 0 var(--mrd-sheen)" : undefined,
      }}
    >
      {children}
      {shortcut ? <Keycap>{shortcut}</Keycap> : null}
    </button>
  );
}

/**
 * THE ONE CONTROL THAT RELEASES SOMETHING, and the only place orchid is spent
 * on a control anywhere in the product.
 *
 * meridian.css spends `--mrd-you` on one meaning: a person is required. A gate
 * is the one place that is literally true of a button, because the work is
 * stopped until it is pressed. Approvals settles a call, Crew grants an agent
 * more room, a run merges its changeset. Everything else on all five surfaces
 * is chrome by that test, and an accent that fires on chrome stops meaning
 * anything.
 *
 * DISABLED FALLS BACK TO THE NEUTRAL FACE, because a dead control is furniture
 * and must not keep shouting. It also closes a contrast trap: a gate sets
 * `disabled` for the whole round trip of a decision, and `text-mrd-ink` on
 * `bg-mrd-solid` measures 1.19:1 on paper, so the label used to vanish on every
 * click. `--mrd-on-solid` and `--mrd-on-you` are the two tokens that are light
 * in both grounds and they exist for exactly this.
 */
export function Approve({
  shortcut,
  className = "",
  children,
  ...rest
}: {
  shortcut?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      data-mrd=""
      className={`${CONTROL_SHAPE} ${CONTROL_DEAD} bg-mrd-you text-mrd-on-you enabled:hover:opacity-90 disabled:bg-mrd-solid disabled:text-mrd-on-solid ${className}`}
      style={{
        transitionDuration: "var(--mrd-d-press)",
        boxShadow: "inset 0 1px 0 var(--mrd-sheen)",
      }}
    >
      {children}
      {shortcut ? <Keycap>{shortcut}</Keycap> : null}
    </button>
  );
}

/**
 * A row of controls. One primary among them, and only one.
 *
 * IT SETS NO OUTER MARGIN, which is the difference between the two versions
 * this replaces. Brain and Runs baked `mt-mrd-4` into the container, so the row
 * decided the space above itself and a caller who wanted it elsewhere could not
 * say so. The ten call sites that relied on it now say `mt-mrd-4` themselves,
 * which is where a composition decision belongs.
 *
 * `trailing` is the control that undoes or destroys, separated by DISTANCE
 * rather than by colour: red reports an outcome in this system and orchid means
 * a person is required, so neither is available to mark an intention.
 */
export function Actions({
  children,
  trailing,
  className = "",
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-mrd="" className={`flex flex-wrap items-center gap-mrd-3 ${className}`}>
      {children}
      {trailing ? <span className="ml-auto">{trailing}</span> : null}
    </div>
  );
}

/**
 * A WORD INSIDE A SENTENCE THAT GOES SOMEWHERE.
 *
 * The quiet end of the affordance scale, and the reason it is not an `Action`
 * is that `Action` is for something the surface is ASKING you to do, and this
 * is for a fact that happens to have an address of its own.
 *
 * It inherits its size from the line it sits in rather than fixing one, because
 * a control that shrinks halfway through a sentence reads as a typo. The dotted
 * underline goes solid on hover, which is the only thing that changes.
 *
 * `href` exists because some destinations are OUTBOUND. An anchor and a button
 * are not interchangeable to a keyboard or to a middle click, so the element
 * follows the destination rather than the paint.
 */
export function Door({
  children,
  onClick,
  href,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  /** Present for an outbound address. Mutually exclusive with `onClick`. */
  href?: string;
  title?: string;
}) {
  const paint =
    "rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid";
  const timing = { transitionDuration: "var(--mrd-d-press)" };

  if (href) {
    return (
      <a
        data-mrd=""
        href={href}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
        className={paint}
        style={timing}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      data-mrd=""
      title={title}
      onClick={onClick}
      className={paint}
      style={timing}
    >
      {children}
    </button>
  );
}

/**
 * A short closed set, picked from in place, sitting in a toolbar rather than in
 * a form.
 *
 * A native `<select>`, deliberately. It is keyboard-native, it answers
 * type-ahead, it opens as the platform's own list on a phone, and it reports
 * its state without being told to. The chevron is drawn by the browser and left
 * alone: replacing it would mean owning the open state, which is a listbox,
 * which is a component these surfaces do not need.
 */
export function Picker({ className = "", ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      data-mrd=""
      className={`h-8 max-w-full rounded-mrd-ctl border border-mrd-edge bg-mrd-lift px-2 text-[12.5px] text-mrd-ink transition-colors disabled:cursor-default disabled:opacity-45 ${className}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    />
  );
}

/**
 * A STANDING GRANT, ON OR OFF.
 *
 * IT IS NOT GREEN, AND THAT IS THE PORT RATHER THAN A PREFERENCE. Both copies
 * of this filled their track with a moss green when on. Under Meridian green
 * reports an OUTCOME, what happened and never what is set, so a green track on
 * a routine says the routine SUCCEEDED, one inch from a last-run line where
 * green means exactly that. On steps to `--mrd-solid` instead, the one ladder
 * stop nothing else uses, with the specular top edge every filled control here
 * carries. It survives the greyscale test on knob position alone, which the hue
 * never did.
 *
 * `busy` and `disabled` are separate, and the cursor follows `busy` rather than
 * `disabled`. The Engine Room's copy painted `cursor-wait` on any disabled
 * switch, so a toggle a person is simply not allowed to move promised them it
 * was about to finish something.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  busy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Required: a bare switch is unreadable to a screen reader. */
  label: string;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      data-mrd=""
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:opacity-45 ${
        busy ? "disabled:cursor-wait" : "disabled:cursor-default"
      } ${checked ? "border-transparent bg-mrd-solid" : "border-mrd-edge bg-mrd-lift"}`}
      style={{
        transitionDuration: "var(--mrd-d-press)",
        boxShadow: checked ? "inset 0 1px 0 var(--mrd-sheen)" : undefined,
      }}
    >
      <span
        aria-hidden
        className={`absolute size-3.5 rounded-full transition-[left] ${
          checked ? "left-[1.125rem] bg-mrd-on-solid" : "left-0.5 bg-mrd-mute"
        }`}
        style={{
          transitionDuration: "var(--mrd-d-move)",
          transitionTimingFunction: "var(--mrd-ease)",
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The things a read can be, kept apart
 * ------------------------------------------------------------------ */

/**
 * A READ STILL IN FLIGHT, which is neither empty nor failed.
 *
 * DELIBERATELY NOT `LoadingState`. That component's own header forbids this
 * use: "an elapsed timer on a 200ms fetch is noise. Use this only where work
 * genuinely takes seconds and a person is waiting on the result. Ordinary reads
 * get a plain quiet state."
 */
export function Reading({ children = "Reading." }: { children?: React.ReactNode }) {
  return (
    <p data-mrd="" role="status" aria-live="polite" className="text-[13px] text-mrd-mute">
      {children}
    </p>
  );
}

/**
 * NOTHING IS HERE YET, drawn where a REGION would have been.
 *
 * The bordered half of the pair. Empty and failed are siblings and a reader has
 * to tell them apart by what they SAY rather than by their container, so this
 * and `ReadFailed` are the same box in two moods.
 *
 * No accent and no illustration: an empty state must not invent a call to act.
 * `action` is the door, and it is omitted rather than filled with a
 * plausible-looking button wherever there is genuinely nowhere to go.
 */
export function NothingHere({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-mrd=""
      className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5"
    >
      <div className="max-w-[62ch] text-[13px] leading-relaxed text-mrd-body">{children}</div>
      {action ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{action}</div> : null}
    </div>
  );
}

/**
 * NOTHING IS HERE YET, said INSIDE a region that already has a container.
 *
 * The bare half of the pair, and a genuinely different component rather than a
 * variant: this one draws no box at all, because the box it would draw is
 * already around it. Brain and Runs use it under a `Region` heading; Crew and
 * the Engine Room use `NothingHere` where the region itself is missing.
 */
export function NothingYet({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
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

function FailMark() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mt-px shrink-0 text-mrd-fail"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  );
}

/**
 * THE READ FAILED, which is a different fact from an empty region and must
 * never wear its clothes. "Nothing here" and "we could not find out" send a
 * person in opposite directions, so this says which one it is and carries the
 * way out.
 *
 * Red is correct here and is not a warning: it reports an OUTCOME, which is the
 * only thing this system's red is ever allowed to mean.
 *
 * THE RETRY IS NEUTRAL, and one of the five copies had it orchid. That copy's
 * own header says the accent is spent twice on its surface and both times it
 * means a person is required, once on the standing marker and once on the
 * control that releases the agent. A retry is neither: it re-reads. Three of
 * the other four files rule this out in their own words, the Engine Room's
 * most plainly, and this is now the only place the decision is made.
 */
export function ReadFailed({
  children,
  onRetry,
  retryLabel = "Try again",
  detail = "Nothing has been changed and nothing has been lost. This screen just could not read it.",
}: {
  children: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  detail?: React.ReactNode;
}) {
  return (
    <section
      data-mrd=""
      role="status"
      aria-live="polite"
      className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5"
    >
      <h2 className="flex items-start gap-mrd-3 text-[13px] leading-snug font-medium text-mrd-ink">
        <FailMark />
        <span>{children}</span>
      </h2>
      <p className="mt-mrd-3 max-w-[62ch] text-[12.5px] leading-relaxed text-mrd-body">{detail}</p>
      {onRetry ? (
        <div className="mt-mrd-5">
          <Action onClick={onRetry}>{retryLabel}</Action>
        </div>
      ) : null}
    </section>
  );
}

/**
 * THE READ FAILED, said as one sentence rather than as a box.
 *
 * The bare half of the pair, for a region that already draws its own container
 * and only needs the fact and the way out. Same rule as `NothingYet`: two
 * containers around one sentence is a frame, and the standard caps a region at
 * one bordered box.
 */
export function ReadFailedLine({
  children,
  onRetry,
  retryLabel = "Try again",
}: {
  children: React.ReactNode;
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
          <Door onClick={onRetry}>{retryLabel}</Door>
        </>
      ) : null}
    </div>
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
 * be in this system. The chips are mixed from the semantic tokens rather than
 * given a literal tint, so they follow both grounds without a second
 * definition.
 *
 * NAMED FOR WHAT IT IS rather than `Delta`, which is already taken in this
 * folder by `InsightCards`'s labelled movement. Two exports called `Delta`
 * meaning two things is the drift this file exists to end.
 */
export function Diffstat({
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
 * THE RECORD SPEAKING, which is a claim rather than a statistic.
 *
 * It contradicts you or it confirms you, and either way what backs it is
 * printed beside it. The left rule is the one mark of emphasis: no accent,
 * because the record is not asking for a person, it is telling you something,
 * and the control underneath it is where the asking happens.
 *
 * The claim takes the 62ch measure that every other read-this-sentence block in
 * this file uses, rather than the 68ch a region's sub takes. A claim narrower
 * than the heading above it is the right way round.
 *
 * NOT THE SAME COMPONENT as Brain's `RecordSpeaks` or Runs' `Recess`, which are
 * recesses with a diamond and a lead-size claim. Those two differ from each
 * other by exactly one thing, the lamp, and the lamp is a scarcity rule rather
 * than a setting: Meridian permits ONE lit object in the product and Brain
 * holds the licence. A prop for it would turn the rule into a switch.
 */
export function RecordSpeaks({
  children,
  evidence,
}: {
  children: React.ReactNode;
  evidence?: React.ReactNode;
}) {
  return (
    <div data-mrd="" className="border-l-2 border-mrd-edge pl-mrd-5">
      <p className="max-w-[62ch] text-[13px] leading-relaxed text-mrd-body">{children}</p>
      {evidence ? <p className="mt-mrd-2 text-[12px] text-mrd-faint">{evidence}</p> : null}
    </div>
  );
}
