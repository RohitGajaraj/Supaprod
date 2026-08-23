Unit 021: R005 and R006 executed across nine surfaces

Both rulings landed work on my paths and this unit carries all of it.

R006, one line plus honesty: --font-display now aliases --mrd-face-display
(byte-identical stack, no pixels move), and the block comment above it no
longer says a ruling is pending, because it ruled. The ruling's larger
point is recorded here because it outran my question: no utility in
meridian.css sets font-family at all, so every Meridian heading in the
product already renders Geist through styles.css's base h1..h6 rule, and
aliasing to --mrd-font would have silently restyled every heading in a
commit titled as cleanup. Not taking the obvious action was correct.

R005 part one, the built link face, ported everywhere it was mine:
signup's waitlist anchor became the canonical ActionLink primary form;
reset-password's two Links and join.$token's three took ACTION_LINK_FACE
faces matched to what they wore (primary where primary, quiet where ghost);
sync collapsed its local LINK_AS_QUIET_CONTROL and its run-parts import,
both sites onto the face strings, with a short comment recording why.
build.index was inspected and deliberately untouched: its LINK constant is
a Door-style sentence link with its own recorded justification, not a
control-face copy, and collapsing it would change paint against its own
comment. The btn-sm size modifiers rode away with the faces; size now
comes from CONTROL_SHAPE inside them.

R005 part two, selection primitives, four surfaces converted with state
logic preserved exactly: pricing's billing pills and checkout's billing
toggle are Choices mode="one" radiogroups; checkout's plan cards and
settings' credit bundles are Cell selected. Every hand-painted chosen
state (wash, ring, heavier edge) deleted; handlers, disabled states and
copy byte-preserved. One surface skipped correctly: settings'
plan-comparison period row lives in components/billing/PlanPicker.tsx,
LANE 0's file, so it is flagged for routing rather than reached across.

Verified live where reachable: /pricing renders a true labelled radiogroup
("Billing period"), Monthly checked on load, Annual click flips
aria-checked with the Save 17% badge intact; screenshot at
docs/screenshots/u021-pricing-choices-radiogroup.png. Checkout needs cart
state and settings needs an authed session, both verified by construction
on the full suite (tsc 0, 10650 pass / 0 fail).

Deliberately deferred with the ruling's own blessing: pinning the parchment
aliases dark inside [data-obsidian] (styles.css ~:1365). It is my file and
it would fix every obsidian surface at once, but it re-prices light-theme
rendering across the whole authed app, my dev auth session is dead, and I
will not make that change unverifiable overnight. The landing stays as-is
per the ruling; the pin waits for a session that can drive both themes.
