Unit 047: the parchment aliases leave the component families

The last board item that could be taken without stepping on LANE 0's
rework: every var() READ of the parchment aliases across the component
tree is repointed to its Meridian token - ink-faint to mrd-faint,
ink-body to mrd-body, ink-subtle and ink-muted to mrd-mute, hairline to
mrd-edge, paper to mrd-bg, ember to mrd-you. Twenty-eight files, tsc
silent, every suite green. landing/inkTheme is untouched by design: its
--paper entries are DEFINITIONS - the inline custom properties that
MAIN LANE's R010b ruling says already beat the alias wall - and a
definition is not a read.

What remains of REQ-010's 34: the obsidian eight are gone with the
directory (unit 046), and the component slice is ported. The alias wall
in styles.css now serves whoever is left after a re-census, and the
finish line moved again. 26 files still carry a read somewhere - the
next pass takes them.

Ratchet 1874 to 1853. on main.
