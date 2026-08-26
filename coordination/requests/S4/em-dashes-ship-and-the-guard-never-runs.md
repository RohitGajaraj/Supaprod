S4 -> S0 (and every lane) - URGENT, founder-raised: 13 em dashes ship to the browser - filed 2026-08-26

Full verdict: docs/lanes/verify/S4-029-thirteen-em-dashes-ship-and-the-guard-that-should-catch-them-never-runs.md

The founder raised this directly mid-session: he can see em dashes in the running application and
wants no AI fingerprints on any user-facing surface.

## Measured on the BUILD, not on a grep

A source grep is worthless here: this repo's comment blocks are enormous and comments do not ship.
I ran `bun run build` (exit 0) and scanned `.output/public/`, which is what a browser receives.
26 occurrences ship; 13 are user-facing.

## The 13, exact

SIX are the product's own voice, src/lib/presence/character.ts, on the run screen:
  :172 "I've lost sight of the run - the reads are failing. The work itself may be fine."
  :213 "I need you for this one - the question is on the card below."
  :220 "A door I need is locked. Reconnect it and start me again - redoing the work would not open it."
  :228 "I'm on it - you can leave this page and I'll keep going."
  :250 "I've stopped - the reason is on the hold line. I'll carry on when it clears."
  :257 "I'm ready - press run and I'll walk this from the top."
  (the dashes above are shown as hyphens in this file; the source has U+2014)

SEVEN more:
  src/routes/_authenticated.start.tsx:311   "Carried over ... Edit it freely [em] it starts however you leave it."
  src/components/track/SteerComposer.tsx:220 placeholder "Say what to change [em] try @<agent>"
  src/components/track/TrackRun.tsx:837      title "Run it [em] done"
  bundled into _authenticated.track.$trackId  boundary sentence "<o> [em] but <because>. Nothing ran."
  src/components/meridian/InsightCards.tsx:751  em dash AS the empty value
  src/routes/_authenticated.meridian.tsx:1086   two, in a note on the design gallery route

## DO NOT blanket-replace. Two of the 26 must stay.

  DocsPanel input rule /^(?:---|[em]-|___\s|\*\*\*\s)$/ MATCHES an em dash so the editor can make a
  horizontal rule. Deleting it breaks the editor.
  Two in verify-green.server.ts are the detector's own pattern. One is inside the Supabase library.

## The eight in src/lib/spine/driver.ts are the ROOT, not a leaf

They are in the briefs sent to the model. Not on screen, but a model imitates the punctuation of its
instructions, so an em-dashed brief produces em-dashed output that is then shown to a person. If the
founder is seeing dashes in text nobody wrote, this is where they come from.

## THE ACTUAL FINDING: the guard exists and has never been able to see any of this

scripts/check-humanized.sh is built for exactly this and bans U+2014 / U+2013 / the invisible set.
I ran it: "check-humanized: clean. No banned dashes or invisible characters in scanned additions."
Clean, over a build shipping thirteen. Three reasons, each in the script:

  1. It is wired to NOTHING. `grep -rn "check-humanized" .claude/ .github/ package.json` -> no results.
     Not a hook, not CI, not a package script. Its own header calls the blocking hook "opt in".
  2. It scans only ADDED LINES OF A STAGED DIFF (:5, :263-282, `git diff --cached --unified=0`).
     Everything already committed is invisible to it forever. Nothing staged -> scans nothing -> "clean".
  3. Its scope CONSUMER_RE='^(src/components/|src/routes/|src/lib/ai/prompts|src/lib/ai/humanize|public/)'
     EXCLUDES src/lib/presence/, where six of the thirteen live.

Reason 3 rests on the script's own comment at :78 - "Everything else under src/lib/** is server logic
whose dashes never leave." THE BUILD DISPROVES THAT: src/lib/presence/character.ts is bundled into
.output/public/assets/Character-*.js and shipped. The scope is built on an assumption that stopped
being true when presence went to the client.

Same shape as F-88 (built, permitted, never briefed) and F-90 (documented backwards in the file every
session loads): a guard nobody wired, scoped by a belief nobody rechecked.

## Asked for, in this order

  1. WIRE the check and make it scan the TREE, not the diff.
  2. SET ITS SCOPE FROM THE BUILD: a test that greps .output/public/ needs no path list and cannot go
     stale when a module moves from server to client, which is exactly what happened here.
  3. THEN clean the thirteen. Every one reads fine with a colon, comma, full stop or parentheses.
  4. Strip the eight from driver.ts's briefs so generated copy stops inheriting the fingerprint.

S4 has fixed none of it: every path is src/ or scripts/, and neither is mine.
