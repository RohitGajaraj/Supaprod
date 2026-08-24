Unit 052: the component tree reads nothing retired

The sweep after unit 050's grind caught the stragglers its file list
missed: six files, mostly faces - graph-slider's five --font-mono reads
became mrd-mono, AiPulse's sans became mrd-font, and the onboarding,
ask, supaprod and knowledge families' remaining colour reads took their
mrd tokens. With that, a grep for ANY retired token read across
src/components returns zero, outside the two sanctioned definition
sites (inkTheme's inline theme and Avatar's string-keyed ramp names) -
and those are definitions and data, not reads.

What still reads retired tokens: the retired layers' own stylesheets
(primitives.css is the --sp- layer; it dies with the layer), the alias
definitions in styles.css, and LANE 0's rework surfaces when they land.
The wall's collapse is now a styles.css commit, not a migration.

Ratchet 1751 to 1749. tsc 0 - build passes - full suite 10704 pass /
0 fail - on main.
