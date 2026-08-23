Unit 009: the corrections from U005-U007 folded, and a binary route file healed

What was wrong: MAIN LANE's answer on units 005-007 accepted the work but
corrected three claims. Twelve double-size elements remained where I had
reported seven removed (the silent-winner doubles; commit 8669c4829 already
swept those, verified zero remain by the re-runnable grep). Four arbitrary
leadings survived off-scale. Nine loose markers were named as unblocked.
Separately, admin.landing.tsx had been living as a BINARY file to git since
it was written, which no one appears to have noticed.

Changes, all on my paths:

1. `_authenticated.admin.landing.tsx` carried two literal U+0000 bytes
   inside `?? "\0missing"` fallback keys (lines 283/318 region), so git,
   grep and diff treated the whole file as binary data. Replaced with the
   identical `\0` ESCAPE SEQUENCE as text; semantics unchanged, file is
   UTF-8 text again. This matters beyond tidiness in a three-lane repo:
   git cannot diff or merge a binary source file, so any conflict there
   would have been unresolvable by the normal machinery.

2. Same file: its two `var(--sp-font-mono)` reads now say
   `var(--font-mono)`, which resolves through Meridian's `--mrd-mono`
   exactly as the alias did. Those were the last real readers anywhere
   (the other two grep hits are comments), so
   3. `src/styles/ink.css` loses the `--sp-font-mono` alias and its stale
   "stays because five files read it" comment. The comment's claim about
   `.sp-num` still reading it was already false; recorded rather than
   trusted.

4. `_authenticated.meridian.tsx:1058`: one paragraph carried THREE size
   utilities (`text-mrd-base`, `text-mrd-prose`, `text-mrd-body`) plus an
   off-scale `leading-[1.75]`, the same shape MAIN LANE caught eleven of
   elsewhere. Now `mrd-copy`, one role carrying size, weight, colour and
   leading as one decision.

5. `_authenticated.plan.spec.$id.tsx`, three leadings onto the scale, each
   with its in-file comment corrected so it stops arguing for the old
   value:
   - :1547 row `leading-[1.4]` -> `leading-mrd-snug`. The comment said the
     numbers were "written out rather than rounded"; but 1.4 is exactly the
     value `--mrd-lh-snug` was raised FROM ("was 1.4; the reference's air
     lives here"), so the token is not a rounding of this value, it is the
     ruling that superseded it.
   - :1610 spec-title input `leading-[1.24]` -> `leading-mrd-tight`. The
     preserved `.sp-title` leading has no excuse left now that the scale
     declares a heading stop.
   - :1918 spec-body textarea `leading-[1.55]` -> `leading-mrd-prose`.
     Reading text, mono only as an editing affordance.

Deliberately NOT touched: settings.tsx's two `sp-inner` / `sp-main` class
reads (names, not values; blocked on REQ-003's shell ruling) and the four
`--font-pixel` reads (blocked on REQ-004, filed alongside this unit).

Verification, and its honest gap:

- `bunx tsc --noEmit` exit 0.
- `bun test` 10,733 tests, 0 fail (first run failed exactly one, the
  ratchet guard reporting my own gains; re-frozen per procedure).
- Ratchet 2,720 -> 2,718: admin.landing --sp- 2 -> 0, ink.css --sp- 69 ->
  68. Baseline re-frozen in the same commit as the port that earned it.
- Zero arbitrary `leading-[...]` remain under src/routes and
  src/components/shell (grep, exit 1 = no match).
- NOT done: an eyeball pass on the changed authenticated surfaces. No lane
  can log in (U006 answer records MAIN LANE confirmed the same), so the
  rendered result of the three leading snaps and the mrd-copy swap is
  verified by construction, not by looking. The public surfaces render
  pixel headlines untouched pending REQ-004.
