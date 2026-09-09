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
 * WHY A PICKER AND NOT A CLASSIFIER. A model reading the sentence and choosing
 * the route silently is the product deciding and then telling you afterwards,
 * on the one press where the person knows the answer and the machine is
 * guessing. They pick in their own words ("Something is broken now"), and the
 * machine answers in its own ("it enters at Build; Discover, Decide, Plan and
 * Design are waived"). That exchange is the journey made visible at the
 * entrance, which is the thing the home was missing.
 *
 * WHY IT SITS BESIDE THE PRODUCT PICKER, in the same mute one-line register
 * rather than as a second card: it is the same class of fact about the press
 * that is about to happen, and two quiet clauses under a field is a sentence
 * with two facts, while two cards is a form. The default stays Discover, so a
 * person who reads nothing here loses nothing.
 */
import { Picker } from "@/components/meridian/surface-parts";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { suggestRoute, WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";

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
  return `it enters at ${entry}; ${named(waived)} ${waived.length === 1 ? "is" : "are"} waived`;
}

export function ComposerRoutePicker({
  shape,
  onSelect,
}: {
  shape: WorkShape;
  onSelect: (shape: WorkShape) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-mrd-2 text-mrd-small text-mrd-mute">
      <label htmlFor="composer-shape" className="flex items-center gap-mrd-2">
        <span>The work is</span>
        <Picker
          id="composer-shape"
          value={shape}
          onChange={(e) => onSelect(e.target.value as WorkShape)}
        >
          {SHAPES.map((s) => (
            <option key={s} value={s}>
              {WORK_SHAPE_LABEL[s]}
            </option>
          ))}
        </Picker>
      </label>
      {/* The consequence, not a promise: where it enters and what policy
          waives are both checkable the moment the run starts. */}
      <span>{routeClause(shape)}</span>
    </div>
  );
}

export default ComposerRoutePicker;
