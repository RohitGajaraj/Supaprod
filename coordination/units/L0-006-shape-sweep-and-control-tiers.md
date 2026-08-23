# UNIT L0-006: The three density shapes die across components

**Lane:** LANE 0
**Completed:** 2026-08-23T18:05+05:30
**Commit:** c66c644f5 (49 files)

## What this unit was

The founder's number one complaint ("everything looks like one single dump,
back to back back to back") had three mechanical causes left in my tree after
MissionOrchestratorDetail closed clean. All three swept in one fan-out of six
disjoint file sets, plus two control-tier ports that answers/M10 ranked.

## Shape 1: silent sizes (the U006 defect, component half)

37 elements carried both a text-[Npx] arbitrary and a text-mrd-* size
utility. CSS emission order makes the utility win, so every authored px
below 14 rendered as prose(14px) without anyone choosing it. Fix deletes
the loser; rendering unchanged by construction. Verified zero remaining by
grep, including reverse order.

## Shape 2: bare leadings off Meridian's ladder

leading-snug resolved to Tailwind's 1.375, tighter than the 1.4 Meridian
explicitly replaced with --mrd-lh-snug=1.5 (answers/M13). Converted across
~60 sites to leading-mrd-{tight,snug,prose}; snug/tight move value on
purpose (more air, exactly what M13 orders), relaxed renames at identical
1.625. Remaining bare leadings in my tree: comment mentions only.

## Shape 3: control tiers (M10 queue, five files)

ObsidianOnboarding 8 controls, DecisionQueue 7, InvitationsPanel 6,
DesignScaffoldPanel gate pair + owner toggle + feedback rows,
ProductAnalyticsPanel icon actions. Each carries a TIER comment naming the
M10 clause that fired: Approve for releases held for a person, Action for
verdicts and writes, quiet for deferrals and secondary paths, plain button
for navigation-only (Go to workspace etc.). loom-press retained wherever it
still guards a plain button, retired where CONTROL_SHAPE supersedes it.

## Two regressions caught, not shipped

1. DesignScaffoldPanel's port duplicated var(--madder) into new branches:
   ratchet grew 4 to 5 and failed the build. Converted all five to
   --mrd-fail; file now carries zero madder.
2. Seven controls used hover:text-mrd-prose believing prose was a colour
   step. It is font-size only, so label text GREW on hover. Now
   hover:text-mrd-ink, matching each file's own active state.

Also consolidated DecisionQueue's duplicate surface-parts import left by
the interrupted agent run.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,721 / 212 | **2,684 / 209** | design:ratchet over merged disk |
| Silent-size doubles (my tree) | 37 | 0 | grep text-[Npx]+text-mrd-(size) |
| Bare leadings (my tree) | ~60 | 0 live (2 comment mentions) | grep |
| Retired Button uses in the five M10 files | 35 | 0 | grep '<Button' + obsidian imports |
| hover:size traps | 7 | 0 | grep hover:text-mrd-prose |
| tsc / bun test | - | exit 0 / 10,733 tests, 0 fail | full suite |

Fan-out note: two agents were interrupted mid-run but kept writing to the
worktree afterwards; their edits landed while I verified. Detected by
watching git diff --stat grow between polls and by the ratchet failing on
a madder line I had already cleaned. Lesson recorded: after an interrupt,
poll for quiescence (three consecutive identical diff-stats) before
touching any file an agent owned.

## Open items handed forward

1. GraphSlider remains the one obsidian import in ProductAnalyticsPanel;
   Meridian has no slider component, so its replacement needs a meridian-gap
   ruling first.
2. ObsidianOnboarding keeps AiPulse on a deep retired path (tracked debt).
3. Landing surfaces converted mechanically but not yet eyeballed; next unit
   runs the dev server once and verifies Hero/TheGap/TrustClose render
   before more copy work lands there.
4. MissionOrchestratorDetail hierarchy pass (spacing roles, one focal point)
   remains open as Wave 3 surface work; its controls and shapes are done.
