Unit 018: ard gets the fleet ground, and its dead fallbacks die with it

What was wrong: the ARD standard page was the last public surface with no
theme mechanism. Its reads carried parchment-era hex fallbacks
(#f6f2ea paper, #1f1b16 ink) that never fire because :root defines every
one of those vars, so the page actually rendered dark by inheritance while
its own code argued it was warm-paper light. Under a light-theme user the
inherited values flip and it re-themes, same exposure subprocessors had
before unit 017.

The fix is the fleet pattern from 017's lesson: PUBLIC_INK_THEME spread on
the root with background/color reading var(--paper)/var(--ink) from that
same style object, no raw colour, no data-obsidian (counted debt nothing
here needs). All six dead hex fallbacks dropped; three var(--mrd-edge)
borders became var(--soft-stone), spread-pinned, matching d.$slug's
resolution for the same flip problem.

The ratchet did its job twice in one unit. First pass used literal hexes
and the born-clean guard refused them; second pass dropped six real counts
and the down-only guard refused to accept the gain until the baseline was
re-frozen. Both refusals were correct. Baseline now 2524 (from 2525), ard
raw-colour 7 to 1, the last one grandfathered inside the ARD example
payload string where it is content, not styling.

Also this cycle: REQ-005 gained an addendum re-verifying both claimed gaps
against meridian's actual exports per RL0-005's census lesson. Action takes
no href (:548); Toggle (:789) is an independent labelled switch, not a
select-one contract. The link face and selection control stand as real gaps
under the corrected lookup method.

Verified live on /ard: rgb(10,10,10) ground, rgb(244,244,245) ink, pinned
--paper, Geist h1 intact, console clean. Gates: tsc 0, full suite
10650 pass / 0 fail, ratchet test green after re-freeze.
