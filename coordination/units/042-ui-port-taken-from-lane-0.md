Unit 042: the ui port, taken from LANE 0's queue by founder routing

Founder sent LANE 0 to the UI rework and the Discover engine, and
authorized this lane to take LANE 0's other pending items. The gating
one was ui/*: every --ds-* reference in the vendored primitives is gone.
Sizes and z-indexes inline as literals (h-9, h-10, z-[300] and friends -
values straight off the alias definitions, so pixels are identical);
button's link variant drops the old blue ramp for Meridian's ink-link
shape, because colour carries status and a link's identity is its
underline, not its hue; the test pinned to the blue follows the code.

Ratchet re-frozen downward: 2010 to 1990. Teardown step 4's gate was
"when ui/* reaches zero" - it has.

tsc 0 - build passes - full suite 10897 pass / 0 fail - on main.
