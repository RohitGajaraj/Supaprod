# S4-136 · The guard against dead tokens was watching the retired system

> _S4, 2026-08-27. Static, whole-repo, no server. Every count below is of `src/**`, excluding test
> files, matching bare `var()` only — a use with a fallback degrades to something chosen and is not a
> defect._

## The defect this guard exists for

CSS has no notion of an undeclared custom property. `var(--mrd-raised)` with no fallback resolves to
**the empty string**, the declaration is dropped, and the property falls back to its inherited value.
**The rule looks applied, typechecks, passes every gate, survives review, and paints nothing.**

`src/styles/__tests__/every-token-used-is-defined.test.ts` was written for exactly this, after
`var(--sp-radius-lg)` left the Ask bar on Today — the surface whose own comment calls it *"PRIMARY
INTERFACE"* — as the one square-cornered object on the page.

## What it was actually watching

```ts
for (const m of src.matchAll(/var\(\s*(--sp-[a-z0-9-]+)\s*\)/gi)) {
```

**`--sp-*` is the RETIRED system.** `CLAUDE.md`: *"Meridian is the only design system, and this is
enforced, not requested."* The guard against a token that resolves to nothing was watching the family
being **removed** and not the family being **written**, and had been for months.

**Its own anti-vacuity test could not catch this**, and that is the interesting part. It asserts
`usedWithoutFallback().size` is greater than 20 — which is *true*, because the `--sp-` uses it counts
are genuinely non-empty. A scan-of-nothing check proves the scanner found something. It cannot prove
the scanner was **pointed at the right thing**.

A second gap, smaller: `declaredTokens()` read `src/styles/*.css` and **not `src/styles.css`**, which
is a sibling of that directory rather than a file in it, and is the largest stylesheet in the repo.

> ## CORRECTION · it is TWO, not four, and I made the mistake this file is about
>
> **`--mrd-fail-bright` and `--mrd-pass-bright` are not orphans. They are prose.** Each appears
> exactly once, inside a doc comment in `room-parts.tsx` that exists to record that they were
> **removed**. S2 caught it, and the engine room's failure colour paints correctly.
>
> **The cause is the same defect this verdict is about, one level down.** I built the allowlist from
> an ad-hoc scan of my own that did **not strip comments**, while the guard it feeds **does**. Two
> instruments, one list, and the wrong one wrote it down. Emptying the allowlist and running the real
> guard settles it in one command:
>
> ```
> + "--mrd-raised used bare in src/styles.css, src/components/mission/MissionOnboarding.tsx"
> + "--mrd-you-text used bare in src/components/product/DesignScaffoldPanel.tsx"
> ```
>
> **Two, and the comment-only pair is not among them.** This repo writes long comments that quote the
> code they replaced, so any scan of `src` that skips that step will keep finding the past. S2 has
> lost three assertions to the same thing today.
>
> **And my own test could not catch it**, which is the part worth keeping. It asserted each excused
> name was UNDECLARED — true of any string nobody has ever defined, including one that only exists in
> a sentence. It has been replaced by one that requires an entry to be undeclared **and actually seen
> by the scanner**, mutation-tested: a name nothing uses now fails the suite. That is the assertion
> that would have stopped this reaching a verdict.
>
> **`--mrd-raised` is real, and both of us were right about it.** It is live on `lane/proof` at
> `MissionOnboarding.tsx:112` and `:141`; on `origin/main` those uses are already gone. S2 checked
> main, I measured my branch. S2 also found and fixed the one that mattered most —
> `.today-hero`, the board's featured band, painting no background at all — and **deleted** the
> declaration rather than repointing it, on the reasoning that removing a rule which never applied
> cannot change a pixel while choosing a fill would. That is the same line I drew for `--mrd-mute`,
> drawn better.

## Widened, and it found TWO live orphans

| token | sites | what it draws |
| --- | --- | --- |
| **`--mrd-raised`** | `src/styles.css:2203`, `MissionOnboarding.tsx:112`, `:141` | a background, on the mission onboarding textarea and a hover |
| **`--mrd-you-text`** | `DesignScaffoldPanel.tsx` | text ink on the design scaffold |

**125 `--mrd-*` declared, 129 used bare, 2 declared nowhere** once comments are stripped.

`--mrd-raised` is the one to read twice: `--raised` is on `CLAUDE.md`'s retired list, so this looks
like a retired name that was given the Meridian prefix and never declared anywhere.

## Not fixed here, and why

**Choosing the replacement is a Meridian decision.** `--mrd-raised` is almost certainly reaching for
`--mrd-lift` ("a raised control, secondary button"), and *almost certainly* is not something the
verify lane gets to decide about a design system — the same rule that stopped me editing `--mrd-mute`
in `S4-134`, where I would have been wrong.

So they are a **named allowlist that may only ever shrink**. A new orphan fails the test. Removing a
name without fixing its call site fails it too, because the guard then sees it. Two tests hold that:
one asserts more than 20 Meridian tokens are being scanned, so the widening cannot silently revert;
one asserts the allowlist still contains exactly the four that are genuinely undeclared, so an excuse
cannot outlive its defect.

## Proven both ways

```
.s4-mutation-probe { color: var(--mrd-definitely-not-declared); }
  (fail) every bare var(--sp-*) and var(--mrd-*) resolves to something
  + "--mrd-definitely-not-declared used bare in src/styles/shell.css"
restored
  12 pass, 0 fail
```

## What I discarded

I had already written a standalone whole-repo scanner for this before finding the existing test.
**It was deleted rather than committed.** Two checks answering one question is how the answers start
disagreeing, and the existing one carries the incident that produced it, which is worth more than my
version's slightly wider net.

## Verdict

- **CONFIRMED: the guard watched only the retired token family.** Widened to Meridian, plus the
  stylesheet it never read.
- **CONFIRMED: 2 tokens painting nothing** — `--mrd-raised` (S2 fixed the worst site, `.today-hero`)
  and `--mrd-you-text` (`product/**`). The two I attributed to the engine room were comment text and
  are withdrawn.
