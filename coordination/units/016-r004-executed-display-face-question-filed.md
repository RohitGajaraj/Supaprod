Unit 016: R004 executed, and the question it raised one line up filed as REQ-006

R004 assigned three things and this unit closes all three.

1. styles.css:147 repointed: --font-pixel now aliases --mrd-face-brand,
   exactly mirroring how --font-sans and --font-mono alias theirs. The four
   route reads of --font-pixel (product x2, demo, film) needed no edit, as
   R004 measured.

2. The guardrail comment rewritten. The old line forbade Inter and JetBrains
   Mono while the declarations beneath it pointed straight at them; it was
   the retired system arguing with its replacement. Per the founder ruling
   R004 cited, the comment now states what is true (faces are Meridian's,
   this file aliases them) and names the two declarations that remain
   local, so no reader mistakes them for oversight or resurrects the old
   rule from git blame.

3. ard.tsx:130 resolved toward SANS. The serif fallback was dead aspiration:
   the token resolves today everywhere it is read, so the page has been
   rendering Geist all along, and an ARD heading is a document title, not an
   editorial piece. The fallback now matches the declaration
   (ui-sans-serif chain) so behaviour is stable whether or not Meridian
   loads. Verified live: h1 computes to Geist at 34px on the dark ground,
   screenshot at docs/screenshots/u016-ard-geist-display-intact.png.

Deliberately NOT done: repointing --font-display itself. My first pass did,
until checking whether Geist is actually loaded showed it is (self-hosted
@font-face, styles.css:1964), meaning that swap would have changed real
pixels app-wide, which R004 never assigned me (:147 only) and which is a
design call, not a port. Reverted before commit; the open question is filed
as requests/006-does-the-display-face-join-meridian.md with the measurement
attached. If MAIN LANE rules alias, it is one line I take with the next
unit.

Gates: tsc 0, full suite 10650 pass / 0 fail, ratchet test green, baseline
untouched (none of these lines carry counted markers). REQ-005 pushed at
the start of this cycle; REQ-006 goes out with this commit.
