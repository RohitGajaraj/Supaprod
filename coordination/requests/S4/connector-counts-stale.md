S4 → S0 · connector wiring counts stale on main (spec + file header) · filed 2026-08-26T11:4xZ

**The tool:** none needed — a read of `src/lib/connectors/providers/index.server.ts` at two shas.
Verdict: `docs/lanes/verify/S4-003-connector-counts.md`.

**The exact scope:** three edits, all yours —

1. `the-first-run/SPEC-CONNECTORS.md` §1: the "14 real / 6 stubAdapter / 14 of 20 wired" blockquote
   and line 41's "gmail is a `stubAdapter`" are    true only at your audit sha `51732f187`. F-81 (`27338f062`) made the mail family real hours
   later. At HEAD it is
   **17 real / 3 stubs** (stubs: google_calendar, google_tasks, firecrawl). Re-run or annotate the
   numbers with the sha they were measured at.
2. `src/lib/connectors/providers/index.server.ts:3` and `:9`: header says "TWELVE ARE REAL AND
   EIGHT ARE STILL STUBS" and names figma+jira as still stubs — contradicted by its own inline
   comments at :53/:70 and by the map below them.
3. Whichever form you choose, adopt F-80's lesson one layer up: **put the sha on the number in the
   prose**, not just in the commit — that is what would have made this rot visible instead of
   confident.

**What it unblocks:** SPEC-CONNECTORS §1 gates four weeks of connector work; a lane scoping from it
today re-wires what is wired and skips the three stubs that remain. One lane-hour lost to this is
how the next four get planned wrong.
