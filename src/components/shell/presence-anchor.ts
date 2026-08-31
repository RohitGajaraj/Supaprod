/**
 * WHERE A TEAMMATE'S CURSOR GOES, AND HOW A SURFACE SAYS "THIS IS THAT THING".
 *
 * `SPEC-MULTIPLAYER-PRESENCE` §3.1: a teammate's cursor sits at "the on-screen
 * anchor of the object its newest `tool_calls` row actually targeted". S0's
 * `src/lib/presence/collision.ts` answers WHAT was targeted. This answers WHERE
 * that thing is drawn, and it is the only join between the two.
 *
 * ── THE IRON LAW IS WHY THIS IS A REGISTRY AND NOT A GUESS ─────────────────
 * §2: "If you cannot name the row a position came from, do not draw the
 * position", and "any cursor on screen whose position cannot be traced to a
 * specific row" removes the feature rather than patching it.
 *
 * So the layer NEVER infers a position. A surface that draws an object opts in
 * by stamping the object's identity onto the element it drew, and the layer
 * matches. **An object nobody stamped has no position, and a teammate anchored
 * on it is drawn nowhere** - which is correct, and is the difference between
 * this and a cursor that drifts to wherever looks plausible.
 *
 * ── WHY TWO ATTRIBUTES AND NOT ONE COMPOSED KEY ───────────────────────────
 * The obvious shape is one attribute carrying the composed key. Two reasons not
 * to. Upstream's key separator is a NUL byte, and that file already had to be
 * repaired once for reading as binary to grep because of it; a NUL inside an
 * attribute selector is not something to rely on. And a `file` id is a PATH -
 * `src/checkout/AddressStep.tsx` - carrying slashes and dots that mean
 * something else inside a CSS selector.
 *
 * So the DOM carries the two plain facts, the match happens in JS through one
 * normaliser, and nothing is ever escaped.
 */

/** The element drawing an object stamps its kind here: `row:decision`, `file`. */
export const ANCHOR_KIND_ATTR = "data-presence-kind";
/** ...and the id or path here. Together they are one object. */
export const ANCHOR_ID_ATTR = "data-presence-id";

/** A Postgres uuid, which is the shape of every row id in this schema. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The key an anchor and an on-screen object must share to be the same thing.
 *
 * ── THIS IS A COPY, IT IS MARKED AS ONE, AND IT IS ASKED ABOUT ────────────
 * It reproduces `groupKeyOf` in `src/lib/presence/collision.ts`, which is
 * module-private. **A second copy of a grouping rule is exactly what produced
 * the wrong all-clear that rule was written to fix** - PRD `e9e5b033` held by
 * seven traces and reported as unrelated pairs, because one run named it
 * `prd_id` and another named it `id`. So the rule is: identity is the ID, not
 * the key that named it, FOR UUIDS ONLY. A non-uuid keeps its kind, because
 * `signal_id: "1"` and `theme_id: "1"` are two different things.
 *
 * S0 has been asked to export theirs
 * (`coordination/requests/S2/the-cursor-layer-needs-three-things-from-presence.md`
 * §3). **When it lands this function becomes one import and this comment goes
 * with it.** Until then the duplication is visible rather than quiet, and
 * `presence-anchor.test.ts` asserts the two agree on the cases A-006 names.
 *
 * The separator is `|` rather than the byte upstream uses. Nothing compares a
 * key from here against a key from there - only keys from this function to
 * keys from this function - so the byte is free, and a searchable file is
 * worth more than a matching one.
 */
export function anchorKeyOf(a: { targetKind: string; targetId: string }): string {
  const kind = a.targetKind.startsWith("row") && UUID.test(a.targetId) ? "row" : a.targetKind;
  return `${kind}|${a.targetId}`;
}

/**
 * Props a surface spreads onto the element that draws an object.
 *
 * ```tsx
 * <li {...presenceAnchor("row:decision", d.id)}>
 * ```
 *
 * **A missing id returns NOTHING rather than an empty attribute**, and that is
 * load-bearing: `data-presence-id=""` on every unidentified row would make them
 * all match each other, so one anchor would light every card on the board. An
 * object we cannot name is an object the layer does not know about, which is
 * the honest state.
 */
export function presenceAnchor(
  kind: string,
  id: string | null | undefined,
): Record<string, string> {
  const trimmed = typeof id === "string" ? id.trim() : "";
  if (!trimmed) return {};
  return { [ANCHOR_KIND_ATTR]: kind, [ANCHOR_ID_ATTR]: trimmed };
}

/**
 * Every object currently drawn on screen, keyed the way an anchor is keyed.
 *
 * LAST ONE WINS is deliberate and it is not arbitrary. The same object can be
 * drawn twice - a decision in the queue and the same decision open in a panel -
 * and the later element in document order is the more specific, more recently
 * opened one. Drawing the cursor on the detail rather than on the list row is
 * the one a person is more likely to be looking at.
 */
export function anchoredElements(root: ParentNode): Map<string, Element> {
  const out = new Map<string, Element>();
  for (const el of root.querySelectorAll(`[${ANCHOR_ID_ATTR}]`)) {
    const targetId = el.getAttribute(ANCHOR_ID_ATTR);
    const targetKind = el.getAttribute(ANCHOR_KIND_ATTR);
    if (!targetId || !targetKind) continue;
    out.set(anchorKeyOf({ targetKind, targetId }), el);
  }
  return out;
}
