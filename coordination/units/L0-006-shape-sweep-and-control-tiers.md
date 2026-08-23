# UNIT L0-006: Three density shapes swept out of components, five control files tiered

**Lane:** LANE 0
**Completed:** 2026-08-23T19:20+05:30
**Commits:** c66c644f5 (49 files), this record

## What was wrong

Three shapes, all serving the founder's number one complaint about text
reading as one undifferentiated dump:

1. **Silent sizes** (the U006 defect shape, component half): 37 elements
   carried both a text-[Npx] arbitrary and a text-mrd-* size utility. The
   utility is emitted after the arbitrary and always won, so authored
   12px, 12.5px, 13px and 13.5px all painted at prose(14px) with nobody
   choosing that. Fix deletes the loser, so rendering is unchanged by
   construction.
2. **Bare Tailwind leadings**: leading-snug resolved to 1.375, tighter than
   the 1.4 Meridian explicitly replaced with --mrd-lh-snug=1.5
   (answers/M13 calls this the founder's complaint in its most literal
   form). Converted onto leading-mrd-{tight,snug,prose}; snug/tight move
   value on purpose (more air), relaxed renames at identical 1.625.
3. **Untiered controls** in the answers/M10 concentrations:
   ObsidianOnboarding (8), DecisionQueue (7), InvitationsPanel (6 after
   port), DesignScaffoldPanel (gate pair, owner toggle, feedback rows),
   ProductAnalyticsPanel (icon actions). Every conversion carries a TIER
   comment naming which clause fired: Approve for releases held for a
   person, Action for verdicts/writes/dispatches, quiet for deferrals,
   plain button kept for navigation-only doors.

## Two regressions caught rather than shipped

1. DesignScaffoldPanel's background-agent port duplicated var(--madder)
   into new branches, growing its ratchet count 4 to 5. All five uses
   converted to --mrd-fail; the file now carries zero madder.
2. Seven controls used hover:text-mrd-prose believing prose was a colour
   step. It is font-size only, so label text GREW on hover while
   transition-colors announced a colour change that never came. Now
   hover:text-mrd-ink, matching each file's own active state.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,721 / 212 | **2,684 / 209** | design:ratchet over merged disk |
| Silent-size doubles, my tree | 37 | 0 | grep text-[Npx]+text-mrd-(prose/base/small/label) |
| Bare leadings, my tree | ~60 live | 0 live; 2 comment mentions | grep |
| Retired Button uses, five files | ~35 | 0 | grep '<Button', obsidian imports |
| hover:size traps | 7 | 0 | grep hover:text-mrd-prose |
| Gates | - | tsc exit 0; 10,733 tests, 0 fail | full suite |

## Verified in the browser (dev server started and stopped for this)

Landing page rendered post-sweep: h1 at display scale with tight leading;
body copy 13px at 1.5; lead 17px; no layout breakage from the leading
conversions. Console carries two PRE-EXISTING errors unrelated to this
unit (SSR hydration attribute mismatch; Vite HMR worker blocked by CSP in
dev only) - static className renames cannot cause either, and both should
be investigated separately if they reproduce in production.

## Process lesson recorded

Two subagents were interrupted mid-run but kept writing to the worktree
afterwards. Detected by watching git diff --stat grow between polls and by
the ratchet failing on a line already cleaned. After any interrupt: poll
for quiescence (three consecutive identical diff-stats) before touching a
file an agent owned, or two writers collide exactly the way main broke on
2026-08-22.

## Handed forward

1. ProductAnalyticsPanel keeps GraphSlider on the retired barrel: Meridian
   has no slider, so replacement needs a meridian-gap ruling first.
2. ObsidianOnboarding keeps AiPulse on a deep retired path (tracked debt,
   not growing).
3. MissionOrchestratorDetail hierarchy pass (spacing roles, single focal
   point) remains open Wave 3 surface work; controls and shapes are clean.
4. Empty/loading/error states and source marks are the next ranked
   missions untouched this session.
