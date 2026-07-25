# Session handoff - 2026-07-25 (landing craft pass + font-token fix)

## State: SAFE. Working tree clean, 13 commits pushed, origin/main = 42dd5ac7 (verified via GitHub API, not just local refs).

## What shipped

**Public landing, founder-directed craft pass.** Every item below was measured
in the live DOM at 1440 and 390 before commit, never estimated.

- Hero spec column beside the mark: was 4 ragged lines, now a 2-column grid,
  3 rows, all payloads on one rule. Reads "to decide what to build / to ship it
  while it matters / to know if you were right".
- Hero subline: one line on desktop (was widowed on "the next call"). 472px of
  text in a 511px column, 39px slack. One uniform weight, no partial highlight.
- Hero headline 34/46/52; loop line deliberately left at 21/28/32 so the STEP
  widened. "agents" in the audience line carries machine blue.
- Per-phrase ember hover on the spec phrases and the four loop verbs. This is a
  founder override of note 9 in Hero.tsx, asked for twice, recorded in the file.
  Do NOT "restore" the old no-hover rule or the whole-column version.
- ThreeLayers rebuilt from the brief's reference: small colour-coded label ->
  big Pixel claim -> context. 40px Pixel section headline. Three-part spotlight
  (warm pool + neutral lift + vignette), section-wide, never per column.
- Layer 02 renamed "the operating system" -> "the loop", SITE ONLY. The brief
  and the investor deck keep the canon name on purpose.
- Layers kicker "What we are building" -> "How it works" (the old one implied
  the product was unfinished to a customer).
- TheGap evidence pair rebuilt as one exhibit: both columns share hairline ->
  label -> payload -> source, painted from shared constants. 80% is a PixelStat.
  Reddit citation no longer uppercased (r/ProductManagement is lowercase).
- "Devs" typewriter LOOPS now. One-caret rule preserved: it pauses and drops its
  caret while the table's hole writes its one answer, then resumes.

**The font-token collision (the important one).** Tailwind v4 generates its type
utilities FROM `--text-*` custom properties, and Tempo claimed two of those exact
names. Every `text-base` / `text-sm` rendered a step small app-wide; on the
landing that was 18 elements wrong incl. both hero CTAs at 12px. Fixed by moving
Tempo out of Tailwind's namespace: `--tempo-text-base` / `--tempo-text-sm`,
3 definitions + 58 usages across 16 files. Landing verified 18 mismatches -> 0.

**/investors** is an alias that redirects to /brief. Canonical stays /brief per
the 2026-07-24 ruling (the deck reads for investors, partners, press AND
candidates). Footer label now "Investors", href points straight at /brief.

**The brief deck, moat slide only** (scoped by a new `.moat` class; it is the
deck's only paper slide, and 15 of 16 slides are byte-identical to before).
- Subtle ember dither in the top-right and bottom-left corners. True 2px
  squares from an inline SVG tile at 12px and 19px, sizes with no common factor
  so the layers never repeat visibly. Parchment background untouched.
  TWO OTHER SHAPES WERE TRIED AND FOUNDER-REJECTED: full-height edge bands read
  as curtains here (the reference frames a narrow centred column with wide
  gutters; this slide is one wide column with no gutters), and a harder
  pixel-clustered version was worse. Do not re-litigate this; corners won.
- Readability: 11 of 31 elements failed WCAG AA, now 0. `--ink3` #8b8276 (3.38)
  -> #736a5f (~4.8), paper ember #c2571f (4.02) -> #b34e1b (~4.7). Kicker
  10.5px -> 13px with tighter tracking (that was the founder's actual
  complaint), headers and caption 9/9.5px -> 11px.
- Ledger body cells stay at 11.5px ON PURPOSE. Bumping them to 12.5 was tried
  and reverted: they already passed contrast, and the extra point wrapped four
  rows onto two lines each and killed the one-line-per-row scannability.
- `public/brief.html` and `docs/pitch/investor-deck/*.html` must stay
  BYTE-IDENTICAL. Edit one, `cp` to the other, verify with `diff -q`.

## WATCH THIS AFTER THE PRODUCTION DEPLOY

The token rename is the only change with reach beyond the landing. Authenticated
surfaces that used the Tailwind CLASS `text-base`/`text-sm` will now render at
the size the class actually promises, which is LARGER than before. That is the
correction, not a regression, but it is a visible change and it was NOT visually
verified on authenticated surfaces (they need a login). Spot-check Today,
Settings and the admin pages first. Rollback is one revert of 42dd5ac7.

## Open items, none blocking

- `src/components/landing/FieldStops.tsx` is orphaned, nothing imports it. Its
  one strong argument was merged into Receipts.tsx. Delete when convenient.
- Pre-existing ~66px horizontal overflow at 768px from TrustClose.tsx:50.
- ~18 test failures from DetailKit cross-file pollution (passes 40/40 alone).
- Layer 02's "the loop" rename is site-only by design; if the brief is ever
  regenerated do not sweep the landing with it.

## Gotchas that cost time this session

- **A parallel "Wave 1-2" session was committing MY working tree** under its own
  messages (4b7b8da4 swept up in-flight landing edits). Nothing was lost, but
  commit early and often while it runs. 6 of the 13 pushed commits are its work.
- **`git push` fails with HTTP 408** on this repo when the push is large (703
  files / 157k insertions here). Fix that worked: push commit-by-commit,
  `for sha in $(git rev-list --reverse origin/main..HEAD); do git push origin
  "$sha:main"; done`. postBuffer bumps alone did NOT help.
- **Stale dev servers serve an empty shell.** :4190 returned 179KB of HTML with
  no page content while the source was fine. If changes seem missing, restart
  the server before debugging the code. Ports seen live: 4200 (this session's,
  correct), 8080 (a DIFFERENT checkout, cadence-lane-4), 8081.
- **zsh does not word-split unquoted `$var`.** `for f in $files` passes the whole
  list as one arg. Use `| while IFS= read -r f`.
- Range `getClientRects().length` is NOT a line count when an element has inline
  children. Use height / line-height.

## DEPLOY: the live site can be many commits behind while everything looks fine

Hit on 2026-07-25. The landing craft pass was invisible on supaprod.ai for hours
and it read exactly like the work had been wiped. Nothing was wiped. Read this
before debugging "my changes are not on the site".

**Lovable runs two independent pipelines.** GitHub -> source sync, and source ->
build. The first works: every commit we push arrives as a `developer_update`
edit, status `completed`, and `mcp__lovable__read_file` returns the CURRENT file.
The second lags: Lovable does NOT automatically build commits that arrive from
outside its own editor, which is every commit we push from Claude Code.

**So the two obvious health checks both lie.**
- `read_file` reads the REPO (current) -> looks healthy.
- Lovable's Publish button says "Up to date" -> it compares published against the
  last successful BUILD, not against your latest commit. With no newer build,
  there is honestly nothing to publish, so it is not lying, just answering a
  different question than the one you meant.

**The one field that tells the truth:** `mcp__lovable__get_project` ->
`latest_commit_sha`. That is the BUILD pointer. Compare it to `git rev-parse
HEAD`. If they differ, the live site is stale by exactly that gap. The screenshot
URL corroborates it, it embeds the commit: `id-preview-<sha>--<project>.lovable.app`.

**DANGER, this is what cost the extra hour.** The per-commit cards in Lovable's
feed are NOT a "catch up to latest" control. Each card's button means "build THIS
commit", and the feed is not reliably in commit order. Clicking `Update preview`
on an older card pins the build BACKWARDS and the preview visibly loses work.
That is a pointer move only, the repo is never touched, `git checkout --` or
simply ignoring it recovers everything. Only ever click the card for the true
latest sha, verified against `git rev-parse HEAD`.

**What reliably moves the pointer forward:** push a new commit. Every push mints
a fresh card at the true latest. That is the lever to reach for, not the buttons.

**Diagnosing without guessing at the UI:** fetch the live HTML and grep it for a
string only the new code has. The landing IS server-rendered, so the copy is in
the raw response, but strip `<script>`/`<style>` first because a stale marker can
survive in a JS chunk and give a false positive. Bracket the deployed commit by
picking markers whose introducing commit you know.

Lovable's own build commits (e.g. `6a5be5ea` "Rebuilt and published app") are
INTERNAL and never reach GitHub, so `git log` can never tell you what is live.

Unrelated but seen the same night: `.remember/remember.md` was found emptied in
the working tree (blob `e69de29b`) with the content intact at HEAD. If this file
is ever blank, `git checkout -- .remember/remember.md` before doing anything
else, and never commit the truncation.
