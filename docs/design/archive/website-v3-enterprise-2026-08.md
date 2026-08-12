# Website v3, "enterprise" — attempted and rejected

> _Created: 2026-08-12 · Last updated: 2026-08-12 23:05_

**Status: REJECTED by the founder on sight, 2026-08-12 ~22:50 IST. Do not
resurrect this direction. Do not merge `site/v3-enterprise` into `main`.**

The live landing page (`src/routes/index.tsx` + `src/components/landing/`) is
unchanged and remains canonical. This file exists so the next person to pick up
"redesign the website" knows an attempt happened, why it failed, and what the
attempt itself proved — the failure is more useful than the code.

---

## What it was

A from-scratch marketing site aimed at an enterprise buyer rather than an
individual PM, built in a throwaway worktree in roughly two hours.

| | |
|---|---|
| Branch | `site/v3-enterprise` (pushed to origin; **never merged**) |
| Route | `/next`, `noindex` |
| Files | `src/components/site-v3/*`, `src/routes/next.tsx` |
| Sections | hero + station rail · the problem (paper) · scroll-driven route · control · compounding · proof · ask |
| Isolation | additive only; the one modified file was the generated `routeTree.gen.ts` |

Screenshots were shown in-session and are not committed (`docs/screenshots/` is
gitignored). The branch is the artifact if anyone needs to look.

---

## Why it was rejected

**The founder's verdict, verbatim: "It's absolute crap… How did this look so
worse than what we have today? It looks like generated output."** That judgment
is the ruling and it stands on its own. What follows is the diagnosis, and three
of the four faults are objective rather than matters of taste.

### 1. It shipped the skeleton under the craft (the taste fault)

The live site carries roughly forty rounds of founder review: the eclipse mark,
the starfield, the replay trace, per-word hover rules, the one-ember law. v3
rebuilt the *structure* in two hours and therefore shipped what is underneath
that craft — big type, hairline grids, two-column bands. That is precisely the
generated-output look. **Restraint is not design. A page with nothing wrong with
it and nothing specific in it reads as machine output**, and a from-zero rebuild
starts with zero accumulated character while the thing it replaces has years.

### 2. It used a banned category claim in its own hero

The v3 eyebrow read **"THE PRODUCT OPERATING SYSTEM"**.
[`strategy/positioning-locked-2026-08.md`](../../strategy/positioning-locked-2026-08.md):203
puts "operating system" on the **Never** list for the landing page, brief and
listings. The whole positioning was built on a phrase a founder ruling had
already retired.

### 3. It used a banned STRUCTURE as the front door

The hero's seven-station rail and the scroll-driven route section made the
station diagram the front door.
`positioning-locked-2026-08.md`:94 and :220 ban exactly this: the stations
predate agents at ~15 named companies so they are a commodity, and **a heavily
diagrammed staged lifecycle is the visual signature of SAFe, which this buyer is
ripping out.** The approved replacement picture is a *cycle with two front
doors* — Discover for genuinely new problems, Build → Learn for anything cheap
to test (`positioning-locked-2026-08.md`:140). Stations may be listed; they may
not be diagrammed as the hero.

### 4. It was pushed with a red test suite

`bun test` was **never run** on the branch. `tsc` and `eslint` were, both clean,
and that was mistaken for a gate. Two failures were sitting there:

- **`no-fabricated-agent-steps.test.ts:106`** — `Hero.tsx` ran a `setInterval`
  advancing an index through a list of step labels. That is the exact shape the
  guard was written to kill, because two surfaces previously narrated agent work
  that never happened. The guard's own comment argues invented narration is
  *"the precise screenshot a skeptical reviewer needs to argue it is a wrapper
  with theater on top, and that argument would be fair."* **The rejected site
  was theatre by the repo's own definition.**
- **`reserved-workspace-slugs.test.ts:68`** — the `/next` route entered the
  workspace-slug namespace unreserved. **This is the identical defect fixed for
  `/film` four hours earlier in the same session, then repeated.** Adding a
  route means reserving its slug in the same commit, every time.

---

## If this is ever picked up again

1. **Do not merge `site/v3-enterprise`.** It is a record, not a candidate. It
   carries a banned category claim, a banned hero structure and two failing
   tests. Merging it damages `main`.
2. **Do not start from zero again.** The live site's character is the asset; the
   fault was replacing it rather than sharpening it. The audit of the live site
   below is the better starting point.
3. **Read [`../../research/claims-audit.md`](../../research/claims-audit.md) first.**
   It is the durable output of this attempt: 143 claims tested against the
   codebase, 43 refuted, including live overclaims on pages that exist today.
4. **Run `bun test`, not just `tsc`.** Both faults in §4 are caught by tests
   that already existed.

## What the live site actually needs (from the audit done the same day)

Measured on production 2026-08-12, in priority order. These are fixes to pages
that exist, not a redesign:

| # | Finding | Evidence |
|---|---|---|
| P0 | **No mobile navigation at all.** `Film`/`Demo`/`Pricing`/`Security` are `hidden md:flex` with no fallback, so on a phone the only nav is the wordmark, Sign in and Join the beta. `/demo` is unreachable. | `LandingNav.tsx` |
| P1 | **Nine text styles fail WCAG AA**, measured through a canvas against each element's real background. Worst is the film eyebrow at **2.56:1**; the `zinc-500` body tier is **4.10:1** against a 4.5 requirement. | measured on production |
| P2 | **The film and the walkthrough compete.** "See the whole thing work." is immediately followed by "Signal to shipped. Watch it happen." | `TheFilm.tsx` / `LoopWalkthrough.tsx` |
| P3 | **`Receipts` breaks the page's own left rule** — its headline sits at x=790 while every other section heading is at x=203. Hero's craft notes record this exact bug as already fixed once. | `Receipts.tsx` |
| P4 | **256px of stacked dead space at every section boundary** (every section is `py-32`). Page is 7141px desktop / 9205px mobile. | all landing sections |
| P5 | **The film poster is illegible on mobile** at 358×201. Needs a cropped variant, not a new asset. | `FilmPlayer.tsx` |

---

## Related

- [`../../research/claims-audit.md`](../../research/claims-audit.md) — what we may and may not claim, with evidence
- [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) — the current design contract
- [`../../strategy/positioning-locked-2026-08.md`](../../strategy/positioning-locked-2026-08.md) — the rulings v3 broke
