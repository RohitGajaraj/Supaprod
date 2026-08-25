import type { ReactNode } from "react";

/*
 * THE KINDS OF WORK ON A SURFACE, AS MARKS.
 *
 * ── WHY THIS FILE EXISTS (REQ-016 item 3, ruled 2026-08-24) ─────────────
 * Today's phase two draws a prioritised feed whose rows each state a verb --
 * review a call, reply to something blocked on you, stop a live run, open a
 * finished one -- plus a glance strip of tiles. LANE 1 asked for real icons and
 * then did the right thing with the absence: it shipped GLYPH-FREE rather than
 * inventing page-local SVGs, and filed for the set instead.
 *
 * That instinct is the whole reason this is a system file. `station-glyphs.tsx`
 * records what happens otherwise: the seven station marks were declared twice,
 * character for character, in `crew/CrewChrome.tsx` and `shell/AppFrame.tsx`,
 * each under a comment claiming to be "the one place the two meet". Both were
 * right about the principle and wrong about being the place. **The cost is never
 * the duplicate, it is that copies drift and then a run is a spinner on one
 * surface and a triangle on another.**
 *
 * ── WHAT THIS IS NOT ────────────────────────────────────────────────────
 * NOT the stations. `station-glyphs.tsx` answers "which of the seven stations
 * is this", and it is keyed by station. This answers "what KIND of thing is this
 * row, and what does it want from me". A row has both: it sits at a station and
 * it is a call or a run. Two questions, two vocabularies, deliberately not fused.
 *
 * NOT the status ladder. `StatusChip` and the `--mrd-pass/fail/hold/agent/you`
 * family answer "how is it going". A `call` glyph on a row that has failed is
 * still a call. Kind is stable; status changes under it.
 *
 * ── IDENTITY IS SHAPE, NEVER HUE. Same law as the stations ──────────────
 * Colour carries STATUS in this product and nothing else. Fourteen categorical
 * hues here would spend palette on category and make "this is orchid because it
 * is a call" indistinguishable from "this is orchid because it needs a person".
 * The glyph says WHAT it is; the colour it inherits says how it is doing. A
 * caller sets colour with the surrounding text's token and never per kind.
 *
 * ── TWO HALVES, ONE VOCABULARY ──────────────────────────────────────────
 * The set has grown a second half and the split is worth stating, because a
 * reader scanning fourteen names should be able to see the seam:
 *
 *   WHAT A ROW WANTS FROM YOU   call · reply · run · finished · forecast
 *   WHAT THE WORK PRODUCED      signal · theme · decision · prd · task ·
 *                               prototype · changeset · deployment · learning
 *
 * The second half arrived 2026-08-25 from two lanes filing the same gap within
 * an hour of each other (`coordination/requests/L1-to-L0-workglyph-artifact-
 * kinds.md`, then `mrd-workglyph-artifact-kinds.md`). LANE 1's audit found
 * ArtifactPane's member rows labelling their kind as a plain right-aligned word
 * -- "prototype", "signal", "spec" -- with no shape beside it, and correctly
 * called it an adoption gap rather than a defect: the pane simply predated a
 * kind set that covered artifacts. LANE 0 confirmed the honest half, that none
 * of the original five maps to a filed artifact, so there was nothing to adopt
 * without inventing meanings.
 *
 * ── WHERE THE NINE NAMES COME FROM, AND WHY NONE WAS INVENTED ───────────
 * `src/lib/spine/attach.ts` is the one vocabulary. `TOOL_PRODUCTS` says which
 * tool creates which kind, `STATION_ARTIFACT` says which kind each of the seven
 * stations exists to produce, and `KIND_WORD` says what a person is shown. Every
 * name below is a key of `KIND_WORD` and nothing else is, which is why
 * `every-artifact-the-spine-files-has-a-mark.test.tsx` asserts the two sets
 * against each other rather than trusting this comment.
 *
 * THE KEYS ARE THE KIND, NOT THE WORD, and the difference is load bearing on
 * three of them: the kind is `prd` and the word is "spec"; the kind is
 * `deployment` and the word is "release"; the kind is `theme` and the word is
 * "cluster". Keying on the word would be a SECOND spelling of a vocabulary the
 * database already holds -- the rival-scale problem this system spent a run
 * removing -- and it would break the moment `KIND_WORD` was reworded, which is a
 * copy change and should never be a glyph change.
 *
 * TWO KINDS THE LANES DID NOT ASK FOR ARE HERE ANYWAY, and the measurement is
 * the argument. `attach.ts` records what `spine_track_members` actually holds:
 * *1104 signals, 177 themes, 110 tasks, 27 decisions, 21 prds, 13 prototypes,
 * 5 missions, 2 learnings*. Both requests listed eight kinds and left out `task`
 * and `mission` -- which between them are the second most common member row in
 * the product. Shipping the eight would have left the commonest artifact after a
 * signal with no shape, so the set is keyed to what the spine FILES rather than
 * to what the request listed.
 *
 * `mission` takes no drawing of its own. `KIND_WORD` already says a mission is
 * spelled "run" to a person, and `run` is in this file's first half meaning work
 * in flight. Drawing a fourteenth silhouette for the thing the product already
 * calls a run would put two marks on one word. `GLYPH_FOR_ARTIFACT_KIND` maps it
 * across, which is the same bridge `GLYPH_FOR_STATION` builds between the
 * database's station ids and the drawings' kind names.
 *
 * ── WHY THESE SHAPES ────────────────────────────────────────────────────
 * Each is the thing's own verb or its own object, and each avoids a shape that
 * already means something else in software -- the rule that made the stations
 * redraw three of seven, and that cost this set four drawings before it landed.
 *
 * WHAT A ROW WANTS FROM YOU:
 *
 *   call      a raised hand's stop-square inside a bracket: something is HELD
 *             pending your word. Not a bell (notification) and not a question
 *             mark (help).
 *   reply     an arrow turning back on itself into a line of text: the thing is
 *             waiting on WORDS from you, not a verdict. Not a speech bubble,
 *             which every chat product owns.
 *   run       three ascending bars, the shape the product already uses for work
 *             in flight in `LoadingState`'s cell grid. Deliberately borrowed
 *             from ourselves: an agent working should look the same everywhere.
 *             Not a spinner -- a spinner is a control's busy state.
 *   finished  a line completing into a terminal tick. Not a checkbox, which is
 *             a control, and not a bare check, which reads as "approved" and
 *             collides with the pass status.
 *   forecast  a horizon line with a mark above it at a point ahead: a claim
 *             placed in the future. Not a crystal ball, not a graph trending up
 *             -- both assert an OUTCOME, and a forecast is precisely the thing
 *             whose outcome is not yet known.
 *
 * WHAT THE WORK PRODUCED:
 *
 *   signal    a flat baseline broken by ONE asymmetric spike: something came in
 *             above the noise, which is the product's own word for it. Not the
 *             station mark for discover, which is arcs spreading from a source
 *             and is the ACT of listening rather than the one thing heard.
 *             Deliberately not a repeating heartbeat: a rhythm reads as health
 *             monitoring, and a single spike reads as an event.
 *   theme     three circles of unequal size, gathered. What `cluster.trigger`
 *             and `research.synthesize` produce is literally a cluster, and a
 *             cluster is what a scatter of unequal points looks like. Not an
 *             enclosing lasso, which is mush at 13px; not equal circles, which
 *             read as a group of people.
 *   decision  a line entering from the left and splitting: one path leaves the
 *             frame, the other ends at a closed node. It draws the thing
 *             `decision.record` REFUSES to omit -- the rejected alternative --
 *             which is the whole reason the tool exists. Emphatically not the
 *             decide station's diamond, and not a Y: the station was redrawn
 *             away from a Y in 2026-08-15 because at 13px people read it as a
 *             keyboard shortcut, and that finding is not spent by using it here.
 *             THE CLOSED BRANCH WAS DRAWN AS A WALL FIRST -- a detached bar
 *             across the stub -- and rendering it at 13, 20 and 44 killed it:
 *             the bar fuses with the stub into a hook. A node terminates a
 *             branch at every size, and it is the shape a repository already
 *             uses for a branch that ends.
 *   prd       a sheet with a folded corner and two rules. A spec is a document
 *             and pretending otherwise costs legibility for nothing. Not the
 *             plan station's three bare lines: the sheet is what makes this the
 *             ARTIFACT rather than the act of planning.
 *   task      a ticket, notched on both sides. Not a checkbox and not an empty
 *             square -- `forms.tsx` exports a real `Checkbox` and this glyph
 *             sits on rows beside it, which is exactly the borrowed-control
 *             failure the station set was redrawn to end. Not a list either; a
 *             list is a plan, and a task is one unit of it. THE NOTCHES ARE THE
 *             WHOLE MARK: a plain rounded rectangle with a divider was drawn
 *             first and read as a toggle switch at every size, which is a
 *             control's shape and therefore unavailable. A clipboard was drawn
 *             second and lost to `prd` -- two sheets, one row.
 *   prototype a pointer arrow. A prototype in this product is what
 *             `design.draft` files: a draft you can CLICK. The frame was tried
 *             first and rejected twice over -- it is the design station's own
 *             mark, and a set carrying a sheet, a ticket and a frame is three
 *             rectangles a reader has to tell apart at 13px.
 *   changeset a plus and a minus, side by side and the same size. Added lines
 *             and removed lines is what a changeset IS, and it is the one mark
 *             every developer reads without being taught. Not the build
 *             station's angle brackets, which say "code" rather than "a change
 *             to it". Stacked was drawn first and reads as the single glyph
 *             "plus-or-minus"; side by side reads as two facts.
 *   deployment a release tag with its eyelet. Not the ship station's parcel --
 *             the parcel is the act of shipping and the tag is the version that
 *             is now live. Not an arrow rising off a line: three marks in this
 *             set already stand on a baseline and a fourth would blur them.
 *   learning  a ribbon marking the page worth returning to. The relationship to
 *             the learn station's open book is deliberate rather than
 *             accidental -- the station is what the loop leaves behind, the
 *             artifact is the page you come back for -- and the silhouettes
 *             cannot be confused, one being wide and open and the other narrow
 *             and notched. A bookmark is a control in a BROWSER; this product
 *             has no bookmark control anywhere, which was checked before the
 *             mark was drawn. Not a lightbulb: it means "tip" everywhere and
 *             claims an idea where this records a verdict.
 */

export type WorkGlyphKind =
  /* What a row wants from you. */
  | "call"
  | "reply"
  | "run"
  | "finished"
  | "forecast"
  /* What the work produced. Keys are `KIND_WORD`'s, in `src/lib/spine/attach.ts`. */
  | "signal"
  | "theme"
  | "decision"
  | "prd"
  | "task"
  | "prototype"
  | "changeset"
  | "deployment"
  | "learning";

export const WORK_GLYPHS: Record<WorkGlyphKind, ReactNode> = {
  /* Held pending your word: a stop-bar cradled by two brackets. */
  call: (
    <g>
      <path d="M7 4.5A4.5 4.5 0 0 0 4.5 8.5v7A4.5 4.5 0 0 0 7 19.5" />
      <path d="M17 4.5a4.5 4.5 0 0 1 2.5 4v7a4.5 4.5 0 0 1-2.5 4" />
      <path d="M12 8v8" />
    </g>
  ),
  /* Waiting on words: an arrow turning back, over a line of text. */
  reply: (
    <g>
      <path d="M10 5.5 5.5 10 10 14.5" />
      <path d="M5.5 10h8a5 5 0 0 1 5 5v.5" />
      <path d="M8 19h9" />
    </g>
  ),
  /* Work in flight. The ascending bars `LoadingState` already draws. */
  run: (
    <g>
      <path d="M6 15.5v3" />
      <path d="M12 9.5v9" />
      <path d="M18 5.5v13" />
    </g>
  ),
  /* A line completing into a terminal tick. */
  finished: (
    <g>
      <path d="M4 12.5h6" />
      <path d="M10 12.5 13 16l7-8" />
    </g>
  ),
  /* A claim placed ahead of a horizon. */
  forecast: (
    <g>
      <path d="M3.5 17.5h17" />
      <path d="M7 17.5v-3" />
      <path d="M12 17.5v-6" />
      <circle cx="17.5" cy="8" r="2.5" />
    </g>
  ),

  /* One thing that came in above the noise: a baseline broken once. */
  signal: <path d="M2.5 15h5.2l3.3-7.5 3 9.4 1.8-1.9h5.7" />,
  /* A cluster, drawn as one: three points of unequal size, gathered. */
  theme: (
    <g>
      <circle cx="8.2" cy="8.6" r="3.4" />
      <circle cx="16.8" cy="7.4" r="2.2" />
      <circle cx="12.8" cy="16.4" r="2.8" />
    </g>
  ),
  /* One path leaves the frame; the alternative ends at a closed node. */
  decision: (
    <g>
      <path d="M2.5 11h5l4.5-5h10" />
      <path d="M7.5 11 11.5 16" />
      <circle cx="13.4" cy="18" r="2.2" />
    </g>
  ),
  /* The spec, as the document it is: a folded corner and its rules. */
  prd: (
    <g>
      <path d="M6 3.5h7.2L18.5 8.8V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z" />
      <path d="M13.2 3.6V9h5.3" />
      <path d="M8 13.5h6.5M8 16.8h4.5" />
    </g>
  ),
  /* One unit of assigned work: a ticket, notches and all. */
  task: <path d="M4 6.5h16v3.2a2.3 2.3 0 0 0 0 4.6v3.2H4v-3.2a2.3 2.3 0 0 0 0-4.6z" />,
  /* A draft you can click. */
  prototype: <path d="M4.3 4.3 10.4 18.9l2.1-6.4 6.4-2.1z" />,
  /* Lines added and lines removed: a diff, which is what a changeset is. */
  changeset: (
    <g>
      <path d="M3 12h6M6 9v6" />
      <path d="M15 12h6" />
    </g>
  ),
  /* The version that is now live, tagged. */
  deployment: (
    <g>
      <path d="M11.6 3.2H5.4a2.2 2.2 0 0 0-2.2 2.2v6.2a2 2 0 0 0 .6 1.4l7.4 7.4a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8L13 3.8a2 2 0 0 0-1.4-.6z" />
      <circle cx="7.8" cy="7.8" r="1.5" />
    </g>
  ),
  /* The page worth returning to. */
  learning: <path d="M6.5 3.5h11v17l-5.5-4.4-5.5 4.4z" />,
};

/**
 * THE ONE PLACE THE SPINE'S ARTIFACT KINDS AND MERIDIAN'S GLYPH KINDS MEET.
 *
 * Same job as `GLYPH_FOR_STATION` in `station-glyphs.tsx`, and it exists for the
 * same reason that one does: without it, every surface that lists members --
 * ArtifactPane's member rows, TrackChain, the ToolStream rows that produced
 * something -- writes its own `artifactKind -> glyph` object, they drift, and a
 * prototype is a cursor on one surface and nothing at all on another.
 *
 * KEYED BY `string` RATHER THAN A UNION, deliberately. `Attachment.artifactKind`
 * is a `string` in `attach.ts` because it is read back off a database column,
 * and declaring a union HERE would be this file asserting a closed set over data
 * it does not own. The guard that actually holds is the test, which walks
 * `KIND_WORD`, `TOOL_PRODUCTS` and `STATION_ARTIFACT` and fails the build the
 * moment a kind the spine can file has no mark.
 *
 * The VALUE side is the union, so a caller can never be handed a kind name that
 * `WORK_GLYPHS` cannot draw.
 */
export const GLYPH_FOR_ARTIFACT_KIND: Readonly<Record<string, WorkGlyphKind>> = {
  signal: "signal",
  theme: "theme",
  decision: "decision",
  prd: "prd",
  task: "task",
  prototype: "prototype",
  changeset: "changeset",
  deployment: "deployment",
  learning: "learning",
  /* A mission IS a run -- `KIND_WORD` already spells it that way to a person,
   * so it takes the run mark rather than a fourteenth silhouette. */
  mission: "run",
};

/**
 * The mark for an artifact kind, or `null` when this file has never heard of it.
 *
 * NULL IS THE DESIGNED ANSWER, not an oversight. A row whose kind we cannot draw
 * should render its WORD alone, exactly as ArtifactPane's rows do today; the
 * failure being designed out is a surface reaching for a nearby shape and
 * telling a reader that an unknown kind is a prototype. Callers write
 * `{glyph ? <WorkGlyph kind={glyph} /> : null}`, which is the shape
 * `_authenticated.today.tsx`'s `FeedHead` already uses for the same reason.
 */
export function glyphForArtifactKind(kind: string): WorkGlyphKind | null {
  return GLYPH_FOR_ARTIFACT_KIND[kind] ?? null;
}

/**
 * `size` DEFAULTS TO 13, WHICH IS `StationGlyph`'S DEFAULT AND NOT A COINCIDENCE.
 *
 * These two families appear on the same row -- a feed line carries its station
 * mark and its kind mark side by side -- and two glyph sets that disagree about
 * their own default size read as a rendering bug rather than a choice. So the
 * default is carried across rather than picked, the same way `BulkBar` carried
 * the retired row radius.
 *
 * A caller matching a specific type stop passes the number, because the glyph
 * should sit optically with the text beside it: `--mrd-t-nano` text takes a
 * smaller mark than `--mrd-t-lead` text. The stops are in `meridian.css` and the
 * caller reads the one it is already using; a `size="nano"` union here would be
 * a SECOND spelling of the type ladder, which is the rival-scale problem this
 * run spent itself removing.
 *
 * `aria-hidden`, always. Every one of these sits beside a word that already says
 * what it is -- "Review", "Stop", "came true", "prototype" -- and a screen
 * reader announcing "call icon, Review" is reading the same fact twice. A glyph
 * that is the ONLY carrier of its meaning is a defect in the row, not a missing
 * label here.
 */
export function WorkGlyph({
  kind,
  size = 13,
  className,
}: {
  kind: WorkGlyphKind;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {WORK_GLYPHS[kind]}
    </svg>
  );
}
