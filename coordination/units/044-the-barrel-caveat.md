Unit 044: the deletion that was caught, and the barrel caveat it teaches

This unit is a retracted deletion. The obsidian nine looked orphaned:
zero code importers each. But the check grepped for directory-path
imports only, and intra-directory siblings import them as ./status and
./verdict - the barrel index.ts re-exports all nine, the barrel is
mounted by four live panels (VouchersPanel, SpecProjectionsPanel,
ProductAnalyticsPanel, SpendRoom), and TestStationPanel, mounted by the
run room, reads ./status directly. tsc caught every break; everything
was restored from HEAD and the tree is clean and green.

What this changes: REQ-010's obsidian eight are not file-by-file
deletable. They are barrel-coupled, so step 6 for them is one atomic
move - port the four mounted panels off the barrel, empty it, then
delete the directory - which is bigger than a lane evening and belongs
in a planned pass, not a opportunistic one. The 34-to-zero finish line
stands; the obsidian slice of it just got a real shape.

tsc 0 - full suite green - tree clean - on main.
