/**
 * WHERE THIS SENTENCE ENTERS THE ROAD, BEFORE ENTER (fifth review, 2026-09-09).
 *
 * THE DEFECT. Every sentence typed on the home was filed as `new-capability`
 * and walked all seven stations, because `shape` was a hard-coded default at
 * the one call site and no surface in the product let a person say otherwise.
 * "Fix the broken login" opened a Discover run. The route model has known
 * better for months: `suggestRoute` gives each of the five shapes an entry
 * station and its policy waivers, and `incident-fix` enters at Build. The
 * founder's own §5E ruling (positioning-locked-2026-08.md, 2026-08-10) asked
 * for the shorter route to be "a first-class selectable route now... Do not
 * make it the default", and on the entry nobody could select anything.
 *
 * WHY A PICKER AND NOT A CLASSIFIER, AND WHY THAT ARGUMENT NOW HOLDS BOTH
 * (revised by Lane 1, 2026-09-10, against the founder's *"anticipate, do not
 * interrogate"*).
 *
 * The original objection, kept because it is still right about what it
 * objected to: *"A model reading the sentence and choosing the route SILENTLY
 * is the product deciding and then telling you afterwards, on the one press
 * where the person knows the answer and the machine is guessing."*
 *
 * Every load-bearing word in that sentence is about silence and about a model,
 * and the reading added today is neither. It is forty listed words in
 * `shape-from-sentence.ts`, it NAMES THE WORD THAT DECIDED IT -- *"Reads as
 * something broken now, from 'crashes'"* -- and Change is one press away and
 * remembered. A person can see what was decided, see what decided it, and
 * overrule it; that is not the product deciding and telling you afterwards.
 *
 * What the objection missed is the cost on the other side, which was only
 * visible once somebody arrived cold: the picker drew on FIRST PAINT, above an
 * empty box, defaulting to the longest route. So the first thing an agentic
 * product asked a person to do was classify their own work into our five
 * buckets -- `new-capability`, `under-the-hood` -- before they had typed a
 * word. Asking is not neutral just because it is honest.
 *
 * So: nothing is said until there is a sentence, the reading is shown with its
 * evidence, and the picker is one press behind it. The exchange the original
 * note wanted -- the person in their words, the machine in its own -- still
 * happens; it just no longer opens with an interrogation.
 *
 * WHY IT SITS BESIDE THE PRODUCT PICKER, in the same mute one-line register
 * rather than as a second card: it is the same class of fact about the press
 * that is about to happen, and two quiet clauses under a field is a sentence
 * with two facts, while two cards is a form. The default stays Discover, so a
 * person who reads nothing here loses nothing.
 */
import React from "react";
import { Door, Picker } from "@/components/meridian/surface-parts";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { suggestRoute, WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";
import { SHAPE_READ_AS, shapeFromSentence } from "@/lib/spine/shape-from-sentence";

const SHAPES = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];

/** "Discover, Decide and Plan", never "sense, decide, define". */
function named(list: readonly string[]): string {
  if (list.length <= 1) return list[0] ?? "";
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/**
 * What choosing this shape does to the road, read from the route model itself
 * rather than written beside it. A waiver added or removed in `route.ts`
 * changes this sentence in the same edit; a copy of the list here would be the
 * second writer of one fact, which is how the home's hold states drifted
 * (F-211).
 */
export function routeClause(shape: WorkShape): string {
  const route = suggestRoute(shape, null);
  const entry = AGENT_STATIONS[route.entry].name;
  const waived = route.waived.map((w) => AGENT_STATIONS[w.station].name);
  if (waived.length === 0) return `it enters at ${entry} and walks all seven stations`;
  /*
   * ── "SKIPS", NOT "WAIVED", BECAUSE THE PRODUCT ALREADY SAYS SKIPS ────────
   *
   * WALKED ON THE SERVED HOME, 2026-09-10. Choosing "Something is broken now"
   * gave: *"it enters at Build; Discover, Decide, Plan and Design are
   * waived"*. Every option in the picker above it is plain English -- "A
   * change to something people see", "Something is broken now" -- and the
   * consequence sentence then drops into a word a reader has never met, on
   * the FIRST thing they do in this product.
   *
   * AND IT IS NOT ONLY JARGON, IT IS A SPLIT. `tracks-feed.ts` already says
   * this exact concept in the row a person meets later: *"needs a step this
   * route skips"*. So one idea wears two words on two surfaces, which is the
   * §12 failure this repo names by name, and the one a user meets first is the
   * internal one.
   *
   * "waived" stays in the CODE, where it is the route model's own term and
   * correct. What changes is what a person is shown.
   *
   * The semicolon goes with it: two clauses joined by "and" read as one fact
   * about one route, where a semicolon reads as a second announcement.
   */
  return `it enters at ${entry} and skips ${named(waived)}`;
}

/**
 * ── IT SAYS NOTHING UNTIL THERE IS A SENTENCE TO READ ────────────────────
 *
 * FOUNDER, 2026-09-10: *"Anticipate, do not interrogate. What am I asking a
 * human to do that an agent should do in the background?"*
 *
 * WHAT THIS WAS. A native `<select>` inside a mad-lib, drawn on arrival with
 * an empty box above it:
 *
 *     The work is [ Something we have not built before v ] · it enters at
 *     Discover and walks all seven stations
 *
 * Five options, defaulting to the longest route, asked **before the person had
 * typed anything**. So the first interaction with an agentic product was a
 * taxonomy question, in our taxonomy -- `new-capability`, `under-the-hood` are
 * words from `route.ts` -- that the product was better placed to answer than
 * the person was.
 *
 * WHAT IT IS NOW, IN THREE STATES:
 *
 *   empty box      nothing at all. Nothing has been said, so there is nothing
 *                  to read and nothing to ask.
 *   read           one sentence: what it read, THE WORD THAT DECIDED IT, and
 *                  where that puts it on the road. Plus one control: Change.
 *   nothing read   the default route, said as a default rather than dressed up
 *                  as a reading, and the same Change control.
 *
 * NAMING THE WORD IS THE WHOLE DESIGN, not a flourish. `the-bar.md`'s
 * Anthropic lens catches exactly this failure -- *"confident output with no way
 * to check it"* -- and a classifier that shows an answer with no reasoning is
 * it. A person who reads *"reads as something broken now, from 'crashes'"* can
 * see in one glance both what was decided and what decided it, and when it is
 * wrong they can see WHY, which is the difference between correcting a
 * collaborator and fighting a guess.
 *
 * THE PICKER SURVIVES, BEHIND ONE PRESS. The reading is not always right and
 * the person is always the authority; what changed is that they are no longer
 * asked before the product has done any work. A choice made by hand is
 * remembered and the reading never overrides it -- `touched` is what stops the
 * product arguing with somebody who has already answered.
 */
export function ComposerRoutePicker({
  shape,
  onSelect,
  sentence = "",
}: {
  shape: WorkShape;
  onSelect: (shape: WorkShape) => void;
  /** What is in the box right now. Empty means say nothing. */
  sentence?: string;
}) {
  const [touched, setTouched] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const read = React.useMemo(() => shapeFromSentence(sentence), [sentence]);

  /* THE READING DRIVES THE SHAPE, until a person says otherwise. Effect rather
     than render-time, because `shape` is the route's state and the submit path
     reads it: deriving the sentence here and the payload there would be two
     readers of one fact, which is how this page's hold states drifted before. */
  React.useEffect(() => {
    if (touched || !read || read.shape === shape) return;
    onSelect(read.shape);
    // `onSelect` is a setState from the route and stable enough; re-running on
    // its identity would fight the picker on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read, touched, shape]);

  /* NOTHING SAID, NOTHING ASKED. */
  if (!sentence.trim() && !touched) return null;

  return (
    <div className="flex flex-wrap items-center gap-mrd-2 text-mrd-small text-mrd-mute">
      {open || touched ? (
        <label htmlFor="composer-shape" className="flex items-center gap-mrd-2">
          <span>The work is</span>
          <Picker
            id="composer-shape"
            value={shape}
            /*
             * CHECKED, NOT CAST. `e.target.value` is a DOM string and `as
             * WorkShape` is a claim about it, not a check of it. Membership in
             * `WORK_SHAPE_LABEL`, which is the record the options themselves
             * come from, so the check cannot drift from the list a person sees.
             * Ignoring an unknown value leaves the picker on its last good one,
             * which is the honest outcome: nothing was chosen.
             */
            onChange={(e) => {
              const v = e.target.value;
              if (v in WORK_SHAPE_LABEL) {
                setTouched(true);
                onSelect(v as WorkShape);
              }
            }}
          >
            {SHAPES.map((s) => (
              <option key={s} value={s}>
                {WORK_SHAPE_LABEL[s]}
              </option>
            ))}
          </Picker>
        </label>
      ) : (
        <>
          <span>
            {read ? (
              <>
                Reads as {SHAPE_READ_AS[shape]}, from{" "}
                <span className="text-mrd-body">{`"${read.because}"`}</span>.
              </>
            ) : (
              <>
                Nothing in the sentence says what kind of work this is, so: {SHAPE_READ_AS[shape]}.
              </>
            )}
          </span>
          <Door onClick={() => setOpen(true)}>Change</Door>
        </>
      )}
      {/* The consequence, not a promise: where it enters and what policy
          waives are both checkable the moment the run starts. The dot is the
          shell's own separator between two facts on one line, and it is
          hidden from a reader who is hearing the sentence rather than
          scanning it. */}
      <span aria-hidden="true">·</span>
      <span>{routeClause(shape)}</span>
    </div>
  );
}

export default ComposerRoutePicker;
