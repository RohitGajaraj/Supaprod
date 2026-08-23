REQ-005: three Meridian gaps found while porting routes; each has a second caller or a ruling behind it

State first: units 012 through 014 ported every remaining hand-painted
control on my paths onto Action. Nothing here blocks them; these are the
gaps the ports exposed, filed together because they are all "the primitive
does not exist yet" shaped.

1. A LINK FACE. Five anchors wear retired `.btn` classes today because
   they are navigations that must keep middle-click and modifier-click,
   so Action's button contract cannot take them: signup.tsx:635
   (waitlist), reset-password.tsx:99 and :146 (Links), join.$token.tsx
   :156/:163/:225 (Log in / Sign up / Go to Supaprod). build.index.tsx and
   sync.tsx each grew their own local `LINK_AS_CONTROL` string already,
   which is the second-caller rule satisfied twice over. Ask: an exported
   link-flavoured counterpart to Action in surface-parts (an `<a>` wearing
   CONTROL_SHAPE plus a variant face), after which I port the five anchors
   and the two local strings collapse onto it.

2. A SELECTION CONTROL. Checkout's plan cards and billing toggle,
   settings' credit-bundle grid, pricing's billing pills: stateful
   selected/unselected controls whose meaning lives in the selection
   itself. Mapping selection onto Action variants would fabricate
   semantics, and unit 012 left them hand-rolled with reasons recorded.
   Four files is well past a token earning its place. Ask: a Meridian
   selection primitive (radiogroup/pressed semantics with a chosen-state
   face), or a ruling that these stay bespoke per surface.

3. THE LANDING'S SINGLE-THEME RULING. index.tsx paints seven raw hexes in
   its own <style> block. Measured under a stamped light theme, the
   obsidian vars there resolve LIGHT, so those literals are what keeps the
   landing dark for returning light-theme visitors; its comment argues
   they ARE the single-theme contract. Mounting PUBLIC_INK_THEME on the
   landing root would fix it the way product.tsx was fixed in unit 011,
   but it re-prices every token read underneath, including LANE 0
   components I do not own. This one is a design call, not a port: say
   the word and it is mechanical.

No urgency on any of the three; nothing downstream blocks. REQ-003 and
REQ-004 remain open alongside this one.

Addendum, after RL0-005 taught the export-census lesson: both claims were
re-verified against `grep "^export function|^export const"
src/components/meridian/*.tsx` before this went out rather than filenames.
Action (:548) spreads rest onto a button and accepts no href; Toggle (:789)
is an independent labelled switch, which is not the contract a
select-one-from-N card or a segmented billing pair needs. The link face and
the selection control remain real gaps under the corrected lookup method.
