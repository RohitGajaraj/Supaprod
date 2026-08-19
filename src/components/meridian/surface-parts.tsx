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
 *
 * ── `goTo` IS A WAY OUT, NOT A WAY PAST A CAP, AND THE NAME IS THE POINT ──
 * This slot was called `more`/`onMore` until 2026-08-16, inherited from the
 * retired `Block`, and the rename fixes a defect that had gone one step further
 * than a wrong name: the docstring here CLAIMED the prop did not exist at all
 * ("there is no more/onMore, and that is a refusal") while the signature
 * accepted it and rendered it. A comment that contradicts its own function is
 * worse than either choice alone, because the next porter reads the refusal,
 * the type system says otherwise, and neither is trustworthy afterwards.
 *
 * The reason the refusal was written still stands, and it is measured. Brain's
 * port found a shelf capped at six putting "Show all 14" in the REGION HEADING,
 * above rows the reader had not reached yet, SO THE WAY PAST A CAP WAS
 * ANNOUNCED BEFORE THE CAP. A person reads an offer to see more of a list
 * before they have seen any of it, and the number in that offer is the only
 * place the real total appears.
 *
 * But every live caller was doing something else. All four pass a whole
 * surface: "Open Discover", "Open Decide", "Open the spec", "Open Learn". That
 * is NAVIGATION OUT of the region, and it belongs in the heading, because the
 * heading is what the destination is named after and a reader looking for the
 * way out looks at the top.
 *
 * One prop was serving two controls, which is why the ban could not be stated
 * without deleting something correct. Split by name and both become sayable:
 *
 *   goTo  -- leaves this region for a named destination. Correct here.
 *   a cap -- has no prop, and will not be given one. `RecordsTable` already
 *            answers it, by stating the real arithmetic UNDER the last row with
 *            the way out beside it, where a reader arrives having actually hit
 *            the limit. A reveal belongs to the CONTENT, never to the frame.
 *
 * This is the same move the product already made for `Action` and `Approve`:
 * making the difference a different NAME rather than a different string is what
 * stops it recurring.
 */
export function Region({
  title,
  sub,
  goTo,
  onGoTo,
  toggle,
  onToggle,
  toggled,
  act,
  onAct,
  acting = false,
  lead = false,
  children,
}: {
  title?: string;
  sub?: React.ReactNode;
  /** The label for the way OUT of this region, naming where it goes ("Open
   *  Decide"). A plain button: it navigates, so it has no state to announce.
   *  Never a reveal past a cap -- see the note above. */
  goTo?: string;
  onGoTo?: () => void;
  /** A control that acts on THIS region instead of leaving it: the finder on
   *  Runs, the changes panel on a mission. Rendered identically to `goTo` and
   *  kept separate from it for the reason that split exists at all -- this one
   *  is a disclosure and must say so. */
  toggle?: string;
  onToggle?: () => void;
  /** Whether what `toggle` controls is currently showing. Drives
   *  `aria-expanded`, which is the half a shared prop could not emit: the two
   *  live toggles ("Look at it"/"Hide it", "Find a run"/"Close the finder")
   *  both changed a label a sighted reader can see and announced nothing at all
   *  to anyone who could not. */
  toggled?: boolean;
  /**
   * A control that DOES something to this region's subject, rather than
   * revealing more of it or leaving it. Added 2026-08-18 for Discover's
   * "Cluster the loose 12", which starts a real model run from a region header.
   *
   * WHY IT COULD NOT BE `toggle`. `toggle` emits `aria-expanded={toggled ??
   * false}` unconditionally, so wearing it would tell every screen reader that
   * this button expands something. It does not; it dispatches an agent. An
   * incorrect ARIA state is worse than none, because it is believed.
   *
   * WHY NOT `goTo` EITHER: that one navigates, and a reader who takes it as a
   * link will not expect to have spent credits.
   *
   * `acting` is the half the old `Block` could not express. Its callers faked
   * the in-flight state by swapping the LABEL ("Cluster the loose 12" becomes
   * "Reading them together") while the button stayed live, so a second press
   * started a second run. Here the work is announced with `aria-busy` and the
   * control is disabled while it runs, which is the same fact told once.
   */
  act?: string;
  onAct?: () => void;
  /** True while the act is running. Disables the control and announces it. */
  acting?: boolean;
  lead?: boolean;
  children: React.ReactNode;
}) {
  const head = Boolean(title || goTo || toggle || act);
  const controlFace =
    "shrink-0 rounded-mrd-xs text-[12.5px] text-mrd-mute transition-colors hover:text-mrd-ink";

  return (
    <section data-mrd="" className="flex flex-col">
      {head ? (
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
          {goTo || toggle || act ? (
            <span className="flex shrink-0 items-baseline gap-mrd-3">
              {act ? (
                <button
                  type="button"
                  onClick={onAct}
                  disabled={acting}
                  aria-busy={acting || undefined}
                  className={`${controlFace} ${acting ? "text-mrd-agent" : ""} disabled:cursor-default`}
                  style={{ transitionDuration: "var(--mrd-d-press)" }}
                >
                  {act}
                </button>
              ) : null}
              {toggle ? (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded={toggled ?? false}
                  className={controlFace}
                  style={{ transitionDuration: "var(--mrd-d-press)" }}
                >
                  {toggle}
                </button>
              ) : null}
              {goTo ? (
                <button
                  type="button"
                  onClick={onGoTo}
                  className={controlFace}
                  style={{ transitionDuration: "var(--mrd-d-press)" }}
                >
                  {goTo}
                </button>
              ) : null}
            </span>
          ) : null}
        </div>
      ) : null}

      {sub ? (
        <div
          className={`${head ? "mt-mrd-3" : ""} max-w-[68ch] text-[12.5px] leading-relaxed text-mrd-mute`}
        >
          {sub}
        </div>
      ) : null}

      <div className={head || sub ? "mt-mrd-4" : undefined}>{children}</div>
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

export type ActionVariant = "default" | "primary" | "quiet" | "destructive";

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
  /*
   * ── STOPS SOMETHING, OR REMOVES IT ──────────────────────────────────────
   *
   * Stop this run and discard forty minutes of work. Discard the changeset.
   * Remove the connection. Until `--mrd-stop` existed there was nowhere for
   * this control to stand: the colour law reserves `--mrd-fail` for an outcome
   * that has already happened and forbids it on an intent, and a neutral face
   * makes a stop indistinguishable from the benign secondary sitting next to it.
   *
   * IT IS THE QUIETEST OF THE FOUR ON PURPOSE, and that is not timidity. What
   * protects a destructive act is DISTANCE plus a CONFIRM, never volume. A stop
   * button that dominates a run surface gets pressed by accident, and a warning
   * a reader meets forty times a day is a warning they have stopped reading.
   * `Actions` already separates it by distance, in its own `trailing` slot; the
   * confirm is the Dialog.
   *
   * SO THE FILL IS A WASH RATHER THAN A SLAB. 8%, and the figure is measured
   * rather than picked: the label is `--mrd-stop` sitting on its own wash, and
   * across every ground stop in both themes that reads 4.64 at worst, on a
   * floating pane in the dark theme, and 6.21 at best. At 10% the same worst
   * case is 4.50, exactly on the text floor, and at 13% it is 4.29, under it.
   * A control label may not be a hundredth from failing.
   *
   * HOVER FIRMS THE EDGE AND LEAVES THE FILL ALONE, which is the one thing here
   * that looks like a quirk and is not. Deepening the wash on hover is the
   * obvious move and it takes the label under 4.5 in exactly the state a person
   * is committing to a destructive act. The border instead: 40% at rest, which
   * measures 1.92 and is deliberately quiet, stepping to 75% and 3.55 under the
   * pointer, so the edge clears the 3:1 a boundary owes at the moment it matters.
   * meridian.css already establishes the idiom on its form fields, where the
   * border STEPS UP rather than gaining a ring.
   *
   * ── THE CONSTRAINT THAT MAKES ALL OF THIS LEGAL, AND IT IS ABSOLUTE ─────
   *
   * **`--mrd-stop` MAY ONLY EVER PAINT SOMETHING A PERSON CAN PRESS.** Never a
   * chip, never a dot, never a rule, never a row's state, never a count.
   *
   * Measured, and this is the whole reason: `--mrd-stop` and `--mrd-fail`
   * collapse in greyscale. Against each other they read **1.12 on dark and 1.04
   * on paper**, which is indistinguishable. The chroma separation that makes
   * them obviously different colours to most readers does nothing for a reader
   * who cannot separate hues, and nothing at all in a black-and-white
   * screenshot.
   *
   * That is survivable ONLY because the two live in different systems: `fail`
   * reports STATE and appears on chips, dots and rows, while `stop` is a CONTROL
   * colour and appears on buttons. A reader never has to tell them apart,
   * because the shape already did. Put `--mrd-stop` on a chip and the greyscale
   * law breaks, silently, with no gate to catch it: the ratchet sees a valid
   * `--mrd-*` token and passes. There is no test that can currently stop this,
   * so it is written here in the file that owns the token's only legal use.
   */
  destructive:
    "border border-mrd-stop/40 bg-mrd-stop/8 text-mrd-stop enabled:hover:border-mrd-stop/75",
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
 *
 * ── THE FOURTH VARIANT, AND WHY IT DID NOT SPLIT OFF INTO ITS OWN COMPONENT ──
 * `destructive` was added 2026-08-19 and it is a variant rather than a second
 * `Approve`-style component, which is the opposite call to the one made above.
 * The reason the accent got its own component is that `primary` meant four
 * different things to four authors, so the WORD was the problem. `destructive`
 * has no such ambiguity: a control either stops or removes something or it does
 * not, and there is nothing for two readers to disagree about.
 *
 * THE `Approve` DISTINCTION IS UNCHANGED AND STILL THE ONLY ONE THAT MATTERS
 * HERE. `Approve` is for a click that UNBLOCKS: something is held and pressing
 * it releases it. `destructive` is for a click that STOPS or REMOVES. The test
 * is whether clicking it unblocks anything, and if it does, it is not this.
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
      className={`h-8 max-w-full rounded-mrd-ctl border border-mrd-field bg-mrd-lift px-2 text-[12.5px] text-mrd-ink transition-colors disabled:cursor-default disabled:opacity-45 ${className}`}
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
      } ${checked ? "border-transparent bg-mrd-solid" : "border-mrd-field bg-mrd-lift"}`}
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
 * No accent: an empty state must not invent a call to act.
 *
 * THE ILLUSTRATION HALF OF THIS RULE WAS LIFTED ON 2026-08-19 (founder ruling),
 * and it is worth saying why it was wrong rather than only that it is gone. The
 * stated reason was that an empty state must not invent a call to act, which is
 * an argument about FAKE BUTTONS. It never supported a ban on drawing, and the
 * two got fused because both were true of the same bad screen.
 *
 * What replaces it is narrower than "illustrations are allowed": AN ILLUSTRATION
 * DRAWS THE PRODUCT'S OWN MECHANICS -- the loop turning, the seven stations, the
 * crew, a signal becoming a bet -- in the monoline vocabulary `station-glyphs`
 * already uses. Never a mascot, never a stock figure, and never a scene that
 * asserts activity the workspace does not have, which is the empty-state version
 * of the honesty rule the shell applies to its agent marks.
 *
 * The reason for that shape: a drawing of our own model cannot be copied without
 * copying the model, and it cannot lie about what the product is doing. A
 * cartoon can do both.
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

/* ------------------------------------------------------------------ *
 * THE TWO PARTS THE MIGRATION WAS BLOCKED ON
 *
 * Measured 2026-08-15: 137 files still import `components/shell/primitives`,
 * the retired Cadence/ink component layer, and that is more files than carry
 * any token debt at all. Going through the import list by frequency, most of
 * it already had a Meridian answer -- Button is Action/Approve, Failed is
 * ReadFailed, Loading is Reading, Block is Region, Empty is NothingHere.
 *
 * `Num` (25 importers) and `Value` (8) had none, so every port had to either
 * keep the retired import or hand-roll a replacement. These are the two, and
 * they are placed here rather than invented per surface for the reason this
 * file exists: five surfaces each drawing their own chrome is how the product
 * ended up with four copies of one component.
 * ------------------------------------------------------------------ */

/**
 * EVERY NUMBER, DURATION, COUNT, IDENTIFIER AND TIMESTAMP. AND NOTHING ELSE.
 *
 * The second half of that sentence is the whole reason this is a component
 * rather than a pair of utility classes. The rule is easy to state and it has
 * already been broken in this codebase in the way it always gets broken: a
 * PHRASE CONTAINING a duration was set in mono, so "stopped 3 days" and
 * "waiting 1 day" rendered as typewriter text. JetBrains Mono's letterforms --
 * the double-storey a, the tailed g -- make a short English sentence read as
 * code. A sentence that contains a number is not a number.
 *
 * `tabular-nums` is the half that does invisible work: it stops digits
 * jittering as a value ticks over, and it keeps a column of these aligned down
 * a table. Tabular figures exist in the sans face too, so they were never the
 * reason to reach for mono.
 */
export function Num({ children }: { children: React.ReactNode }) {
  /* `data-num` is the SEMANTIC hook, and it is not decoration. A guard that
     wants to assert "every number goes in the data face" cannot read a Tailwind
     class without testing the paint, and cannot read `font-family` at all in a
     DOM without a stylesheet. The attribute states the claim in the markup, so
     the rule stays checkable after the paint changes again. */
  return (
    <span data-num="" className="font-mrd-mono tabular-nums">
      {children}
    </span>
  );
}

/**
 * A FACT YOU CAN READ AND CANNOT SET FROM HERE.
 *
 * The right-hand side of a labelled row: a pinned tool, a plan only the owner
 * can change, a model chosen for you. An empty right-hand slot says nothing
 * about which, which is why this exists rather than a bare span.
 *
 * `tone` IS FOR A VALUE THAT IS ITSELF AN OUTCOME, which is the one case where
 * colour carries information rather than decorating a fact. It sets the VOICE,
 * not the face: numbers inside it still go in `Num`.
 *
 * ── THE VOCABULARY IS MERIDIAN'S FIVE, NOT THE RETIRED LAYER'S ──────────
 * The version this replaces offered `quiet | pass | warn | fail | live`, and
 * two of those five were wrong in ways that had already been fixed by hand on
 * two separate surfaces before anyone changed the component:
 *
 *   `warn` BECAME `hold`. Every caller meant "waiting on a condition" -- spend
 *       to come down, an eval to pass, a dependency to answer -- which is
 *       exactly what Meridian's amber says. Orchid would have been the reflex
 *       and it is wrong: orchid means A PERSON IS REQUIRED and promises a
 *       control that moves the thing.
 *   `live` CAME OFF GREEN ONTO `agent`. Green reports an OUTCOME here, so
 *       "still deploying" and "deployed successfully" were rendering in one
 *       colour. A machine working is `--mrd-agent`, present tense.
 *
 * No `you` tone, deliberately. A value is something you READ; if a person is
 * required, that belongs on a control, not on a fact.
 */
export function Value({
  children,
  tone = "quiet",
}: {
  children: React.ReactNode;
  tone?: "quiet" | "pass" | "fail" | "hold" | "agent";
}) {
  const paint =
    tone === "pass"
      ? "text-mrd-pass"
      : tone === "fail"
        ? "text-mrd-fail"
        : tone === "hold"
          ? "text-mrd-hold"
          : tone === "agent"
            ? "text-mrd-agent"
            : "text-mrd-mute";
  /* `data-tone` DECLARES the tone; the class only paints it. Dropping this
     attribute in the first draft broke a guard that was right to exist: its own
     header records that this test used to read `span.style.color` and expect
     `var(--emerald)`, and was rewritten to read the tone instead, because
     "reading the tone is the honest test; reading the paint was testing the old
     system". A component that encodes its meaning ONLY in a colour class has
     put the meaning back in the paint. */
  return (
    <span data-tone={tone} className={`text-[12.5px] ${paint}`}>
      {children}
    </span>
  );
}
