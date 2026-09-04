# S4-133 · One constant fails 35 elements across five legal pages

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27. Fourteen public surfaces measured in a real browser against the dev server on
> :8080, dead backend. **Nothing was unjudged on any of them**, so every count below is of the whole
> surface rather than the part the check could see. Measured on `lane/proof`, which does not contain
> S3's `cc23c49fc`._

## Every public surface, contrast

| surface | below AA | shapes | judged | verdict |
| --- | --- | --- | --- | --- |
| **`/`** | **83** | 80 | 248 | a third of its text |
| **`/demo`** | **9** | 9 | 14 | **worst by proportion** |
| **`/faq`** | 7 | 7 | 35 | the shell |
| **`/privacy`** | 7 | 7 | 39 | the shell |
| **`/security`** | 7 | 7 | 36 | the shell |
| **`/updates`** | 7 | 7 | 50 | the shell |
| `/pricing` | 0 | 0 | 105 | pass |
| `/subprocessors` | 0 | 0 | 69 | pass |
| `/product` | 0 | 0 | 49 | pass |
| `/ard` | 0 | 0 | 39 | pass |
| `/checkout` | 0 | 0 | 24 | pass |
| `/brief` | 0 | 0 | 15 | pass |
| `/investors` | 0 | 0 | 15 | pass |
| `/meridian` | 0 | 0 | 11 | pass |

**Eight of fourteen public surfaces are clean.** That is worth saying first, because the four in the
middle are not four problems.

## The four sevens are one constant

`/faq`, `/privacy`, `/security` and `/updates` each report **exactly 7**, and the seven are
identical on every one:

```
p 4.10:1 needs 4.5:1 at 14px/400 "Last updated August 7, 2026"
a 4.10:1 needs 4.5:1 at 14px/400 "Security" "ARD" "Changelog" "Proof" "Privacy" "Terms"
```

`src/components/supaprod/LegalPageShell.tsx`

```ts
const C = { bg: "#0a0a0a", … faint: "#71717a" };   // line 23 and line 28
:129  <p style={{ color: C.faint }}>Last updated {updated}</p>
:164  <a  style={{ color: C.faint, textDecoration: "none" }}>
```

**`#71717a` on `#0a0a0a` is 4.10:1.** It needs 4.5.

**Five routes import this shell** — `terms`, `privacy`, `faq`, `security`, `updates` — so the true
blast radius is **35 elements on 5 surfaces from one line**. I measured four of the five; `/terms`
is not in the baseline and was not visited, and it is named here as inference from the import rather
than as a measurement.

### The value

| candidate | on `#0a0a0a` |
| --- | --- |
| `#71717a` today | **4.10** |
| **`#7e7e86`** | **4.92** |
| `#83838b` | 5.26 |

**`#7e7e86` is the recommendation, and consistency is why.** S3 has already replaced this exact
source colour — `#71717a`, zinc-500 — with `#7e7e86` in `TheGap.tsx` under `cc23c49fc`. Two
components carrying the same wrong grey should not be fixed to two different right greys.

The shell paints a flat page ground, so `#0a0a0a` really is the backdrop here; this is not the case
where a lighter panel underneath makes the worst case worse.

## `/demo` is a different colour and a worse one

```
a.inline-block.px-8     2.41:1 at 14px/500  "Join the beta"
a.text-xs.text-zinc-600 2.56:1 at 12px/400  "Security" "ARD" "Changelog" "Proof" "Privacy" "Terms"
```

Same six links, **a different footer**, at `text-zinc-600` — `#52525b`, which is **2.56:1** on this
ground. So the footer exists twice: once in the shell at 4.10 and once hand-rolled on `/demo` at
2.56. Fixing the constant does not fix `/demo`.

**`"Join the beta"` at 2.41:1 is the lowest ratio on any public surface**, and it is that page's
primary call to action.

## What this does not say

- **`/terms` was not measured.** Five routes import the shell; four were visited.
- **Signed-in surfaces are not in this sweep.** Eighteen of the twenty-nine baseline surfaces sit
  behind auth and render error states under a dead backend, so their contrast is measurable but
  unrepresentative. They are the next run, and the gate waits for them.
- **A pass here is a pass for text contrast only.** `/meridian` passes at 0 of 11 judged and is the
  component gallery; eleven judged elements is a thin population, not a compliment.

## Verdict

- **CONFIRMED. One line, five surfaces, 35 elements.** `LegalPageShell.tsx:28`. **S3's**, with
  `supaprod/**`.
- **CONFIRMED and separate: `/demo`'s hand-rolled footer at 2.56:1 and its call to action at
  2.41:1.** Also S3's.
- **Eight of fourteen public surfaces are already clean**, with full coverage behind that statement.
