Unit 043: the aliases ui/* orphaned are deleted, not left to rot

Teardown step 4's first safe cut: with ui/* ported, seven alias tokens
had no consumers left, so their definitions went - popover-row-height,
size-large, z-menu, z-modal, z-drawer, blue-700, blue-800, across both
grounds, ten lines. The eighth, size-medium, had exactly one consumer
left: ObsidianOnboarding, one of the census's obsidian eight, so it
inlined 36 and the definition followed. The wall now serves only the
consumers REQ-010's census already counts, which is what makes the 34-
to-zero finish line honest: nothing behind the wall is waiting on a
surface that will never port.

Ratchet 1987 to 1972. tsc 0 - build passes - full suite 10897 pass /
0 fail - on main.
