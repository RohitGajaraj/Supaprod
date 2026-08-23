# UNIT 005: the auth routes come off the retired text ramp

**Date:** 2026-08-23 · **Lane:** LANE 1 · **Wave:** 3 (first-touch surfaces first)
**Files:** `src/routes/{signup,login,join.$token,reset-password,forgot-password}.tsx`,
`src/__tests__/meridian-ratchet.baseline.json`

## What was wrong

The five unauthenticated auth routes carried 55 ratchet markers reading the Obsidian
text ramp (`--text-primary/body/muted/subtle`), its hairline, `--raised`, plus inline
leadings off-scale per M13. These are the first surfaces a stranger ever sees; they were
the last still painting zinc greys from a retired ramp while Meridian's warm-neutral
hierarchy ships everywhere else. Computed before porting: on dark ground `--text-subtle`
rendered #8f8f8f against Meridian mute oklch(70%) — cooler, dimmer, and outside the system.

## The mapping, by role

| retired | Meridian | why |
| --- | --- | --- |
| `--text-primary` | `--mrd-ink` | the thing itself |
| `--text-body` | `--mrd-body` | supporting prose |
| `--text-muted`, `--text-subtle` | `--mrd-mute` | captions and helpers are one role; the two retired steps sat one lightness point apart on 11.5px text, which is M08's density-not-hierarchy collapse |
| `--hairline` | `--mrd-edge` | a drawn edge |
| `--raised` | `--mrd-lift` | a raised surface; dark values near-identical |
| inline `lineHeight: 1.45/1.5` | `var(--mrd-lh-snug)` | M13: leadings convert in the same commit as the port |
| inline `lineHeight: 1.55` | `var(--mrd-lh-prose)` | same |

Untouched on purpose: `.btn-primary`/`.btn-ghost` styling (the funnel ruling governs CTA
styling on auth pages; type roles do not), `.loom-press` hover class, `.mono-label`,
`.input` — those are stylesheet classes for a later pass, and AuthScaffold itself is
LANE 0's file now (see below).

One process note recorded honestly: my first sed replaced `lineHeight: 1.5` inside
`lineHeight: 1.55`, producing `"var(--mrd-lh-snug)"5` in eight places. `tsc` caught all
eight immediately and they were fixed to the prose stop the 1.55 sites meant. Lesson:
longest-match first when string-porting numeric literals.

## Scope boundary hit, filed not crossed

`AuthScaffold.tsx` (11 markers: --ds-, --text-, --madder, data-obsidian mount) sits under
`src/components/supaprod/`, which is LANE 0's since the three-way split. I did not touch
it; it is named for the LANE 0 worklist in `requests/002`'s census long tail. The
`data-obsidian` mount stays until every retired read on auth surfaces ports, because
`.loom-press` and friends still scope their styles under it.

## Verification

Computed values read off `/signup` in BOTH grounds after the port: helper text =
`oklch(0.7 0.006 70)` = mrd-mute dark / `oklch(0.48 ...)` = mute light; invite-panel
border = mrd-edge; panel bg = oklch(0.215) = lift; links = body. Screenshots of both
grounds taken (gitignored). Zero console errors from the change.

## Gates

| Gate | Result |
| --- | --- |
| `bunx tsc --noEmit` | exit 0 (after catching the sed artifact above) |
| `bun test` | 10,636 pass / 0 fail across 630 files |
| Ratchet | 2,810 → **2,756** (-54); files 219 → 214; re-frozen same commit |

Five route files now carry ZERO retired-token markers.
