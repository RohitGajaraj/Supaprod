import * as React from "react";

/*
 * THE ONE IMPORT FROM `shell/` IN THIS FILE, AND IT IS A TYPE.
 *
 * `use-selection.ts` is the multi-select STATE, and it is not part of the
 * retired paint layer: it holds no class name, reads no token and renders
 * nothing. It sits in `shell/` only because that folder's convention gave a hook
 * its own file. `BulkBar` takes the object that hook returns, so the shape has
 * to come from where the shape is defined; importing it type-only means no
 * runtime edge from Meridian back into `shell/`.
 */
import type { Selection } from "@/components/shell/use-selection";

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
/**
 * The face of a quiet text control sitting in a HEADING SLOT.
 *
 * Hoisted out of `Region`'s body 2026-08-20 rather than copied, because the row
 * selection bar needs the same face and this file's whole argument is that a
 * second copy of a part is how the product ended up with four of everything. It
 * is 12.5px against a 13px statement on purpose: the label states, the control
 * offers, and the half-pixel step is what says which is which.
 */
const HEADING_CONTROL =
  "shrink-0 rounded-mrd-xs text-[12.5px] text-mrd-mute transition-colors hover:text-mrd-ink";

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
  const controlFace = HEADING_CONTROL;

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

/**
 * A closed padlock, and the reason it is not another ring with a mark in it.
 *
 * `FailMark` above is a circle. Law 3 asks that colour survive a greyscale test,
 * so the difference between a failure and a refusal may not be carried by hue:
 * strip the colour and a second ringed glyph would leave two states that read
 * identically at a glance. A shackle over a body is a different silhouette at
 * 14px, which is the size a reader actually meets it at.
 *
 * The stroke matches `FailMark` at 2.2 rather than thinning to suit the drawing.
 * These two sit in the same slot of the same box and a weight change there would
 * read as emphasis, which is a meaning neither of them carries.
 */
function RefusedMark() {
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
      className="mt-px shrink-0 text-mrd-hold"
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M8.25 10.5V7.75a3.75 3.75 0 0 1 7.5 0v2.75" />
    </svg>
  );
}

/**
 * THE READ SUCCEEDED AND THE ANSWER IS NO.
 *
 * A THIRD FACT, and the reason it needed its own component rather than a prop on
 * an existing one. Three things can be true when a surface has nothing to show:
 *
 *   NOTHING IS HERE      the read ran and the answer was empty.
 *   THE READ FAILED      the read did not finish, so nobody knows the answer.
 *   YOU MAY NOT SEE IT   the read finished, the answer exists, and it is not
 *                        yours. Nothing is broken and nothing is missing.
 *
 * They send a person in three different directions, and the middle one is where
 * this repo has already been caught: `_authenticated.admin.tsx` had to write the
 * distinction out in its own header and then honour it by hand, because the
 * system had no word for the third. A refusal wearing `ReadFailed`'s clothes
 * sends an operator to reload a page that will refuse them again, and a refusal
 * wearing `NothingHere`'s clothes tells them a console does not exist.
 *
 * ── AMBER, NOT RED, AND IT IS A REAL ARGUMENT EITHER WAY ────────────────
 * Both readings are defensible and the choice is `hold`.
 *
 * FOR `fail`: the colour law says red reports an OUTCOME that has happened, and
 * a refusal is exactly that. The check ran, it resolved, and the verdict is no.
 * That is not an intent, so red would not be breaking the rule that keeps it off
 * "roll back".
 *
 * WHY `hold` WINS ANYWAY, on two grounds. First, red is already spent one slot
 * away: `ReadFailed` draws the same box in the same place and paints its mark
 * `--mrd-fail`. The whole purpose of this component is that a refusal stops
 * being confused with a failure, and painting it the neighbour's hue reinstates
 * the confusion at the layer a person reads fastest. Second, `--mrd-hold` is
 * declared in meridian.css as "stopped, and not on you", which is a literal
 * description of a refusal: the surface is stopped, the condition is a grant of
 * access, and the reader is not the one who can give it. Amber says wait for a
 * condition. Red would say something went wrong, and nothing did.
 *
 * NOT `you`, which was the third candidate. Orchid means a person is required
 * AND a decision by THIS reader releases it. Nothing this reader decides opens a
 * refusal. Where an act genuinely does exist it arrives as `action`, drawn as a
 * control rather than as a hue.
 *
 * ── NO RETRY, AND `detail` IS REQUIRED ──────────────────────────────────
 * There is deliberately no `onRetry`. Running the same read again produces the
 * same refusal, and offering the button would be the copy defect this component
 * exists to prevent, drawn as a control.
 *
 * `detail` is required rather than defaulted, and that is the one prop shape here
 * that departs from `ReadFailed`. A default sentence about a refusal can only be
 * generic, and a generic refusal is the failure mode: it has to name what was
 * refused and what happens next, with the data of the surface it is on. Making
 * it required is how the component asks for that instead of hoping for it.
 *
 * `action` is the door and it is omitted rather than filled with a
 * plausible-looking button, same rule as `NothingHere`. It exists because a
 * refusal sometimes has one genuine way out that is not "ask someone": the admin
 * console's bootstrap claim, where a workspace with no admin at all would
 * otherwise be unadministrable.
 */
export function Refused({
  children,
  detail,
  action,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      data-mrd=""
      role="status"
      aria-live="polite"
      className="rounded-mrd-card border border-mrd-line bg-mrd-sink px-mrd-6 py-mrd-5"
    >
      <h2 className="flex items-start gap-mrd-3 text-[13px] leading-snug font-medium text-mrd-ink">
        <RefusedMark />
        <span>{children}</span>
      </h2>
      <p className="mt-mrd-3 max-w-[62ch] text-[12.5px] leading-relaxed text-mrd-body">{detail}</p>
      {action ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{action}</div> : null}
    </section>
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

/* ------------------------------------------------------------------ *
 * THE FOUR PARTS 79 FILES WERE STILL HELD ON
 *
 * Measured for this item: 79 component files import the retired
 * `shell/primitives`, they use 29 distinct symbols between them, and 25 of
 * those already had a Meridian answer. These are the four that did not, and
 * without them `AccountConnectionsSection` (51 occurrences), `RoadmapColumns`
 * (35), `IntegrationsTab` (27) and `TeamCard` (15) could not be ported at all.
 *
 * ── EVERY VALUE BELOW IS CARRIED ACROSS OR ARGUED, NEVER PICKED ──────────
 * `rows.tsx` said it best when it ported `Row` and `Line`: a rebuild is the
 * moment a measured value gets silently rounded off. So each of these reads the
 * retired STYLESHEET as well as the component, because half of the contract was
 * paint: the grid's column measure, the cell's computed hover, the bar's height
 * and the preformatted box's overflow all lived in `primitives.css` and none of
 * them is visible in the `.tsx`. Where the retired figure disagrees with a
 * Meridian token that was solved for in BOTH grounds, Meridian wins and the
 * paragraph says which one moved and why.
 * ------------------------------------------------------------------ */

/**
 * PREFORMATTED OUTPUT THAT NOBODY WROTE FOR A READER: a deploy log, a stderr
 * blob, a curl line, a token, a JSON payload, a diff.
 *
 * ── WHY THIS IS NOT `CodeBlock`, WHICH IS THE FIRST THING TO CHECK ───────
 * `CodeBlock` is Meridian's preformatted box and it is the wrong shape here, on
 * four counts that three porting agents reached independently before this one
 * (the argument is written out at the top of `studio/RunReturn.tsx`, which
 * refused the swap and kept a retired import rather than force it):
 *
 *   `filename: string` is REQUIRED, and a raw stderr blob does not have one.
 *       Forcing it means inventing a filename, which puts a false fact in the
 *       chrome of a box whose entire job is to print something verbatim.
 *   `lines: CodeToken[][]` is PRE-TOKENISED. Every caller here holds a string.
 *       Tokenising plain text is work with no consumer, and the token union has
 *       no outcome tone, so a failure printed verbatim loses its voice.
 *   It draws a LINE-NUMBER GUTTER and a copy control. `<Pre>{fullLink}</Pre>` in
 *       `TeamCard` is a one-line invite link; a numbered gutter beside a single
 *       line reads as a table with one row.
 *   It carries a STREAMING caret and a reveal. Nothing that reaches this box is
 *       arriving a line at a time.
 *
 * A `mode="raw"` on `CodeBlock` was the other option and it is worse: it would
 * make `filename` and `lines` optional and add `children`, so one component
 * would carry two mutually exclusive prop sets. This file's own header names
 * that move and rules against it, because merging a disagreement behind a flag
 * is how a design system turns into a pile of them.
 *
 * ── WHAT IT TAKES FROM `CodeBlock` ANYWAY, AND THAT IS THE POINT ─────────
 * The paint is `CodeBlock`'s scroller, to the pixel: same recess, same 12px
 * mono, same 1.7 leading, same padding, same cap. A raw log and a written file
 * appearing on one screen must not read as two products, and the size of the
 * type is the first thing that gives that away.
 *
 * IT CAPS ITS HEIGHT, WHICH THE RETIRED `.sp-pre` DID NOT. That sheet set
 * `overflow-x: auto` and nothing else, so a 400-line log grew the page to
 * whatever the machine happened to write and pushed every control under it off
 * the screen. `CodeBlock` exists because that exact defect was found live at
 * `traces.$traceId` under a comment claiming the box clipped and scrolled. It
 * did neither, and neither did this. `overflow-auto` scrolls both axes, so a
 * 300-column JSON line no longer takes the page sideways with it.
 *
 * FOCUSABLE BECAUSE IT SCROLLS: a region a mouse can scroll and a keyboard
 * cannot is unreachable. It does NOT wear `mrd-focus-inset`, and that is the one
 * difference from `CodeBlock` worth stating. That class exists for a control
 * flush inside a clipping parent, whose outset ring comes back sheared in half.
 * This box IS the outer element, nothing clips it, and the inset rule only
 * matches a DESCENDANT of a `data-mrd` root anyway, so on the root itself it
 * would paint nothing at all.
 *
 * IT SETS NO OUTER MARGIN. `.sp-pre` baked in a `margin-top`, so the box decided
 * the space above itself and a caller who wanted it elsewhere could not say so.
 * Same call as `Actions`: a composition decision belongs to the composition, and
 * a caller that wants the old spacing writes `mt-mrd-3` where it can be seen.
 */
export function Pre({
  children,
  maxHeight = 320,
}: {
  children: React.ReactNode;
  /** The cap, in px. `CodeBlock`'s default, so the two boxes agree on the one
   *  dimension a reader cannot predict. */
  maxHeight?: number;
}) {
  return (
    <pre
      data-mrd=""
      tabIndex={0}
      className="overflow-auto rounded-mrd-card bg-mrd-sink px-3 py-2.5 font-mrd-mono text-[12px] leading-[1.7] text-mrd-body"
      style={{ maxHeight }}
    >
      {children}
    </pre>
  );
}

/**
 * A LIST IS READ DOWN. A CATALOG IS SCANNED ACROSS.
 *
 * The arithmetic that makes this a grid rather than a column, and it is the
 * whole reason the part exists: nineteen providers down a column is nineteen
 * rows of scrolling, and the same nineteen at three or four across is five.
 *
 * ── THE COLUMN MEASURE IS A PROP, BECAUSE IT ALREADY HAD TO BE ───────────
 * The retired sheet carried it as a custom property so a grid whose contents
 * need a different measure could set that instead of redeclaring the whole grid
 * and drifting from it. Two live callers took it up, and both are the reason
 * this is typed rather than a style hole:
 *
 *   `EvalScoreChips` sets 132px, because a score is four characters and the
 *       196px default would leave half of every cell empty.
 *   `DetailKit` wanted a FIXED number of equal columns and could not say so, so
 *       it re-declared `gridTemplateColumns` inline over the class -- which is
 *       exactly the drift the custom property was introduced to prevent.
 *
 * So both are props. `columns` wins when both are passed, since a caller asking
 * for four across has already answered the question `cellMin` exists to ask.
 */
export function Grid({
  children,
  cellMin = 196,
  columns,
}: {
  children: React.ReactNode;
  /** The narrowest a column may get before the grid drops one, in px. */
  cellMin?: number;
  /** A fixed number of equal columns, for a set whose count is the point. */
  columns?: number;
}) {
  return (
    <div
      data-mrd=""
      className="grid gap-mrd-4"
      style={{
        gridTemplateColumns: columns
          ? `repeat(${columns}, minmax(0, 1fr))`
          : `repeat(auto-fill, minmax(${cellMin}px, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

/** `raised` | `recessed`. TWO GROUNDS, AND DELIBERATELY NOT A STATUS WORD.
 *
 *  Meridian has five status words and this is not a sixth vocabulary: both of
 *  these name a place on the SURFACE ladder, which is the same axis `bg-mrd-lift`
 *  and `bg-mrd-sink` already sit on. A cell is furniture, and furniture does not
 *  get a palette. Anything a cell needs to report about an OUTCOME goes in its
 *  `sub` as a `Value`, which is where the five words live. `EvalScoreChips` and
 *  `DetailKit` both already do exactly that. */
export type CellTone = "raised" | "recessed";

/*
 * ── THE TINT AND ITS HOVER, WHICH IS THE ONE MECHANIC A PAINT-ONLY PORT DROPS ──
 *
 * The retired stylesheet computed the hover from the tint with a single
 * `color-mix(in oklab, <the tint> 92%, <ink>)`, and its comment says that
 * coupling is the entire reason `tone` works: a lane had reported that an inline
 * background silently outranks a class hover, so their cells faked hover with
 * `onMouseEnter` state and lost the focus state with it. Mixing INK into the
 * ground moved it the right way in both themes, lighter on dark and darker on
 * paper, with one rule.
 *
 * THAT RULE IS NOT PORTED, AND THE REASON IS ARITHMETIC RATHER THAN TASTE.
 * Meridian already owns this exact problem and solved it by measuring both
 * grounds instead of computing one: `--mrd-lift-hover` is set per ground, and
 * meridian.css states the constraint the computed version cannot see -- the
 * hover is "held clear of `sink` (0.932) so a hovered control never reads as a
 * recess." Run the retired mix against Meridian's own values and it breaks that
 * on paper: `lift` 0.951 mixed 92% with `ink` 0.28 lands at 0.897, which is
 * BELOW `sink` at 0.932. So a hovered raised cell would read as a recess, on the
 * ground where the whole ladder is tightest. Meridian's measured pair is 0.938
 * and clears it.
 *
 * So the coupling survives and the formula does not: the tone picks a ground and
 * its hover together, out of one table, so the two can still never disagree.
 * `recessed` rises to the raised stop under the pointer, which is one direction
 * in both grounds and is the only step available that was measured rather than
 * computed. A recess that lifts when you reach for it is also the truer reading
 * of what a hover means.
 */
const CELL_GROUND: Record<CellTone, string> = {
  raised: "bg-mrd-lift enabled:hover:bg-mrd-lift-hover",
  recessed: "bg-mrd-sink enabled:hover:bg-mrd-lift",
};

/**
 * ONE CELL OF A `Grid`.
 *
 * TINTED, NEVER BORDERED. Nineteen bordered cells in one region is nineteen
 * bordered containers and the standard caps a region at one, so the ground
 * changes instead of the edge. It reads as a cell because what is under it
 * changed, and the WHOLE cell is the affordance rather than carrying a button,
 * which is what keeps it two lines tall.
 *
 * ── IT IS A REAL `<button>` WHEN IT DOES SOMETHING ───────────────────────
 * So it is tabbable, it answers Space and Enter, and it takes the Meridian focus
 * ring without being asked. The retired grid was written for a `<div>`, so every
 * lane that needed a clickable card wrote the same eight-property reset inline.
 * Two of those properties are the ones a `<button>` gets wrong for this shape
 * and both are set here: `text-left`, because a button centres its label and a
 * two-line cell must start on one edge, and `font: inherit`, which Tailwind's
 * own preflight already does.
 *
 * ── IT SHARES `Row`'s RHYTHM, WHICH IS THE PART THAT WAS NEVER CHOSEN ────
 * A grid of cells and a list of rows are two arrangements of one information
 * model -- a mark, a lead, a different fact underneath -- and they shipped at
 * two type scales and two gutters. There is no argument anywhere for either set,
 * so this takes `Row`'s: a 14px ink lead, a 13px mute sub, `leading-[1.4]`, a
 * 13px gutter after the mark, `py-[9px]`, and the 44px floor that is both the
 * decision-row height and the smallest square a finger reliably hits. A catalog
 * and a queue now read as one product, and the radius follows for the same
 * reason: `rounded-mrd-ctl`, which is `Row`'s, rather than the card radius the
 * retired sheet used.
 *
 * ONE VALUE DOES NOT FOLLOW `Row`, AND IT IS DELIBERATE RATHER THAN DRIFT. The
 * lead keeps `font-medium` where `Row`'s is regular. A row is read in sequence,
 * so its lead only has to be the next thing; a cell is one of twenty being
 * SCANNED, and the retired sheet spent the weight on exactly that. Today's
 * design is the floor here, and taking emphasis off a scan target to win a
 * consistency argument is a smaller surface, not a better one.
 *
 * ── BOTH LINES TRUNCATE, UNCONDITIONALLY ────────────────────────────────
 * Founder ruling: one or two lines, and depth is a click away rather than
 * showcased on the cell. `Row` makes this opt-in through `tight` because a row
 * in a detail view sometimes should wrap. A cell in a grid never should: it
 * would take its whole row of the grid with it. So there is no prop.
 */
export function Cell({
  mark,
  lead,
  sub,
  onClick,
  selected,
  disabled = false,
  tone = "raised",
  title,
}: {
  /** A provider or agent mark, or nothing. A cell for a thing nobody acts as
   *  carries none. */
  mark?: React.ReactNode;
  lead: React.ReactNode;
  /** The different fact, never a restatement of the lead. */
  sub?: React.ReactNode;
  /** Absent when nothing happens on click. An affordance is a promise, so a
   *  cell that does nothing is a div and never lights up under the cursor. */
  onClick?: () => void;
  /** Present only on a cell that is one of a set you PICK from. It makes the
   *  cell a toggle to a screen reader, so leave it undefined on a cell that
   *  opens or connects something. */
  selected?: boolean;
  disabled?: boolean;
  tone?: CellTone;
  title?: string;
}) {
  /*
   * A RING, NEVER A FILL, and drawn as a pseudo-element rather than as a ring
   * utility. Both halves are ported reasoning.
   *
   * The fill is out because Meridian's own `--mrd-select` is a translucent wash
   * meant to sit over a container's ground, and a cell brings its own opaque
   * one, so the wash would REPLACE the tint rather than layer over it and the
   * tone would stop being visible on the selected cell. A ring is also structure
   * rather than hue, so it survives the greyscale test on its own.
   *
   * The pseudo-element is because the obvious drawing, an inset `box-shadow`, is
   * quietly broken here: the app-wide focus rule is UNLAYERED and sets
   * `box-shadow: none`, and Meridian's own focus rule sets it too, so the
   * selection ring would vanish at the exact moment a keyboard reader arrived on
   * the cell that has it. An overlay is immune to that and costs no layout,
   * where a real border would move every cell in the grid by a pixel.
   */
  const ring = selected
    ? "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-mrd-ink before:content-['']"
    : "";

  const shape = `relative flex w-full items-center gap-[13px] min-h-11 rounded-mrd-ctl px-mrd-4 py-[9px] text-left transition-colors ${CELL_GROUND[tone]} ${ring}`;

  const body = (
    <>
      {mark ? <span className="flex shrink-0 items-center">{mark}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] leading-[1.4] font-medium text-mrd-ink">
          {lead}
        </span>
        {sub ? (
          <span className="mt-0.5 block truncate text-[13px] leading-[1.4] text-mrd-mute">
            {sub}
          </span>
        ) : null}
      </span>
    </>
  );

  /* `data-tone`, `data-selected` and `data-disabled` DECLARE the state and the
     classes only paint it, which is the rule `Value` and `Num` already follow in
     this file: a guard that wants to assert what a cell is claiming cannot read
     a Tailwind class without rendering the paint. */
  if (!onClick) {
    return (
      <div
        data-mrd=""
        data-tone={tone}
        data-disabled={disabled}
        title={title}
        aria-disabled={disabled || undefined}
        className={`${shape} ${disabled ? "opacity-45" : ""}`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-mrd=""
      data-tone={tone}
      data-selected={selected ?? false}
      data-disabled={disabled}
      aria-pressed={selected}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`${shape} cursor-pointer disabled:cursor-default disabled:opacity-45`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {body}
    </button>
  );
}

/**
 * THE BAR A ROW SELECTION PUTS IN A LIST'S HEADER SLOT.
 *
 * ── THE NAME, AND IT IS THE FIRST THING TO SETTLE ───────────────────────
 * IT IS CALLED `BulkBar` AND NOT `SelectionBar`, AND THAT IS NOT A STYLE CHOICE.
 * Meridian already exports `SelectionActions`, and it is an unrelated concept
 * wearing a colliding name: read its signature and it takes a live DOM `range:
 * Range | null` and a positioned `containerRef`, draws highlight panels over the
 * range's own client rects, and hides itself entirely when the range is null. It
 * is the toolbar that appears when a reader selects A PASSAGE OF PROSE and hands
 * those words to an agent. It lands on the spec, the PRD and the release
 * document. Point it at a set of row ids and it renders nothing at all.
 *
 * This is the other kind of selection: ROW IDS held by `use-selection`, a count,
 * a select-all, a clear, and the verbs. An agent scanning this folder's exports
 * for the retired `SelectionBar` finds `SelectionActions` and takes it as the
 * answer, and that has already happened once on the record. So the name shares
 * no substring with either of them, which makes the port checkable: after a
 * consumer moves across, `SelectionBar` grepping to zero in that file is proof
 * rather than a guess. `Bulk` is what the pattern is called everywhere it
 * exists, and `Bar` follows `PromptBar` for a strip that sits in a slot.
 *
 * ── WHAT IT SAYS, AND WHAT IT REFUSES TO CARRY ──────────────────────────
 * It states the count as a fact and then offers verbs. Nothing else: a selection
 * bar that also carries filters or a search box has stopped being a statement
 * about what is selected.
 *
 * `Escape` clears, because a selection is a mode and every mode in this product
 * leaves by the same key. That listener is the behaviour a paint-only port drops
 * without noticing, and until this item nothing in the repo rendered this
 * component in a test, so nothing asserted it.
 *
 * ── THE MEASUREMENTS, EACH ONE CARRIED OR ARGUED ────────────────────────
 * The ground is `bg-mrd-lift` and carries no status hue, because a selection is
 * a STATE and not a status and colour here reports only what happened. The
 * radius is `rounded-mrd-ctl`, which is what the retired row radius already
 * resolved to. The verbs push to the trailing edge so the count and the two
 * escapes stay together on the left where the eye lands first, and the gap
 * between those two groups (16px) is visibly larger than the gap within the
 * verbs (10px), which is Meridian's own spacing law.
 *
 * THE HEIGHT MOVED FROM 38px TO 44px, and it is the one figure here that is not
 * a carry. The retired sheet set 38px so "the bar occupies one scan row and the
 * list below it does not shift when a selection begins", and 38px was one scan
 * row in a system whose rows were 38px. Meridian's row floor is 44px, argued
 * twice over in `rows.tsx`: a row carrying a decision earns the height, and 44px
 * is the smallest square a finger reliably hits. A 38px bar above 44px rows is
 * two rhythms, so the figure follows the intent rather than the number.
 *
 * ── THE EARLY RETURN CARRIES NO `data-mrd`, AND CANNOT ──────────────────
 * Every component with an early return carries `data-mrd` on that return too, or
 * its controls lose the focus ring. This one returns `null`: an empty selection
 * must not hold a row open, so there is no element for the attribute to sit on
 * and no control inside it to lose a ring. Stated rather than left to look like
 * an omission.
 */
export function BulkBar({
  selection,
  total,
  noun = "item",
  children,
}: {
  selection: Selection;
  /** How many rows are selectable right now, after filtering. */
  total: number;
  /** Singular. "call", "run", "decision". Pluralised here. */
  noun?: string;
  /** The verbs. Controls, and the destructive one last. */
  children: React.ReactNode;
}) {
  const { count, allSelected, selectAll, clear } = selection;

  /*
   * `onEscape` rather than `onKey`, and the name is load bearing. `decide.tsx`
   * found this out the hard way: `decide-holds-its-guard-across-the-confirm.test.ts`
   * locates that route's gate-key effect by the FIRST `const onKey = (e:
   * KeyboardEvent) =>` in the file, so a second handler spelled the same way
   * pointed the guard at the wrong effect. The guard reading a spelling is its
   * own weakness, but this handler only ever answers Escape and saying so costs
   * nothing.
   *
   * GATED ON `count === 0`, which is why the listener is not always live: a
   * product-wide Escape handler that runs while nothing is selected is a
   * keystroke competing with every dialog and menu that also leaves by Escape.
   */
  React.useEffect(() => {
    if (count === 0) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") clear();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [count, clear]);

  if (count === 0) return null;

  return (
    <div
      data-mrd=""
      role="region"
      aria-label={`${count} selected`}
      className="flex min-h-11 items-center gap-mrd-5 rounded-mrd-ctl bg-mrd-lift px-mrd-4 text-[13px] text-mrd-body"
    >
      <span className="font-medium whitespace-nowrap text-mrd-ink">
        <Num>{count}</Num> {count === 1 ? noun : `${noun}s`} selected
      </span>
      {/* Only offered when it would change something. Everything already
          selected, or a total that does not exceed the count, means this button
          would report a number and do nothing. */}
      {!allSelected && total > count ? (
        <button
          type="button"
          onClick={selectAll}
          className={HEADING_CONTROL}
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          Select all {total}
        </button>
      ) : null}
      <button
        type="button"
        onClick={clear}
        className={HEADING_CONTROL}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        Clear
      </button>
      <span className="ml-auto flex items-center gap-mrd-4">{children}</span>
    </div>
  );
}
