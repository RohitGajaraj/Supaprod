# REQ-001: Meridian gap ruling - spacing stops 8px and 12px, plus six lesser gaps

**Kind:** meridian-gap
**Blocking:** no
**Raised:** 2026-08-23 ~03:20 IST

## What I need

A ruling on whether Meridian's spacing scale gains the retired system's two workhorse steps, or
whether their consumers snap to existing stops. Measured consumer counts across src/ right now:

- `var(--sp-space-2)` (8px, "inside a component"): **39 call sites**
- `var(--sp-space-3)` (12px, "between components"): **37 call sites**

Meridian's ramp is `--mrd-s1..s8` = 2 / 4 / 6 / 10 / 16 / 24 / 40 / 64. Neither 8 nor 12 exists.
The retired system's own comments call these two THE LAW (inside vs between components), so they
are not accidental values; snapping them to 10 would reflow every dense surface by +2px per gap,
and to 6 would tighten by the same. I will not shift 76 sites without a ruling.

Same question, lower stakes, all with exact consumer counts:

| Retired token | Value | Uses | Nearest mrd |
| --- | --- | --- | --- |
| `--sp-leading-row` | 1.4 | 13 | lh-snug 1.5 |
| `--sp-leading-body` | 1.55 | 10 | lh-prose 1.625 |
| `--sp-text-prose` | 13.5px | 17 | base 13 / prose 14 |
| `--sp-text-gate` | 19px | 4+ | h3 20 / lead 17 |
| `--sp-radius-ctl` | 8px | 5 | r-ctl 9 |
| `--sp-track-title/-gate` | em-based | 6 | --mrd-track is fixed px |

If the ruling is "build them into Meridian", I propose meaning-named additions on the second
caller rule: the two spacing stops are the urgent ones; the rest can stay parked until their
files are otherwise being ported.

## Why I cannot answer it myself

Token vocabulary in Meridian is a design-system law question, and MAIN LANE adjudicates those.

## What I assumed in the meantime

Nothing shifted. All 76 space-2/space-3 sites and the table above stay on retired tokens until
answered; every exact-value port around them proceeds now.
