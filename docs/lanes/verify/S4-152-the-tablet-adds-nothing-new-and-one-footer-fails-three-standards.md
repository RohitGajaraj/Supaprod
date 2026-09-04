# S4-152 · The tablet adds nothing new, and one footer fails three standards

> _Created: 2026-08-28 · Last updated: 2026-08-28_

> _S4, 2026-08-28. Measured at **768x1024** and **767x1024** against the running product, dead
> backend. The tablet width had never been measured._

## The negative first, because it is the useful half

| surface | contrast at 390 | at 768 | at 1280 |
| --- | --- | --- | --- |
| `/` | 83 of 233 | **83 of 242** | 83 of 248 |
| `/demo` | 9 of 14 | **9 of 14** | 9 of 14 |
| `/faq` | 7 of 35 | **7 of 35** | 7 of 35 |
| `/pricing` | 0 of 105 | **0 of 105** | 0 of 105 |
| `/checkout` | 0 of 24 | **0 of 24** | 0 of 24 |

**Contrast is viewport-independent across all three widths.** Not one defect appears only at tablet,
and none disappears. The population moves a little as the layout reflows; the failures do not.

**So the baseline does not need three sets of numbers**, which is worth knowing before somebody
triples it. One width, plus the viewport guard that refuses to compare across widths, is enough.

## A hypothesis I tested and threw away

Tailwind's `md` is 768px, and `CONTROL_SHAPE` carries `max-md:min-h-11` — a 44px minimum that applies
**below** 768. iPad portrait is **exactly 768**. That looked like a real gap: a touch device landing
one pixel outside the touch rule.

**Measured at 767 and at 768:**

```
767px   /faq  6 under the floor of 10 controls   /pricing  0 of 13
768px   /faq  6 under the floor of 10 controls   /pricing  0 of 13
```

**Identical. The hypothesis is wrong**, and the reason is the more interesting fact: `/faq`'s failing
controls are `<a>` elements styled as text, so `CONTROL_SHAPE` never applied to them **at any width**.
The breakpoint was never involved.

That is the same mechanism as `Door`: **a control drawn as prose does not inherit the control's
minimum.** Second independent instance, on a different component, found by testing a different
theory.

## The finding: six links, three standards

```
a 54x21 [16px to nearest] UNDER 24  "Security"
a 28x21 [16px to nearest] UNDER 24  "ARD"
a 71x21 [16px to nearest] UNDER 24  "Changelog"
a 35x21 [16px to nearest] UNDER 24  "Proof"
a 48x21 [16px to nearest] UNDER 24  "Privacy"
a 41x21 [16px to nearest] UNDER 24  "Terms"
```

`LegalPageShell`'s footer — the same six links already carrying two other findings:

| | |
| --- | --- |
| `S4-133` | contrast **4.10:1**, one constant, five routes — **fixed** by S3 |
| `S4-137` | `/demo`'s **duplicate** hand-rolled copy at **2.56:1**, 7 of 12 under the floor |
| **this** | the shell's own copy, **21px tall**, under the 24 floor at **every** width |

**And this one has room.** `16px to nearest` means `21 + 16 + 16 = 53`, so these can take a **full
44x44** hit area — unlike the rail's brand link, which had a 6px budget and could only reach 33.

**Not fixed here, deliberately.** `supaprod/**` is S3's and S3 is active. I caused one merge conflict
tonight by reporting `--mrd-raised` to two owners and having both fix it; sending the budget to the
owner who is awake is the correction to that, not a second instance of it.

## Verdict

- **Measured negative: the tablet width introduces nothing.** Contrast identical at 390, 768 and 1280
  on all five surfaces.
- **Refuted: the `md` breakpoint is not the cause.** 767 and 768 are identical, because the failing
  controls never carried the control shape at any width.
- **CONFIRMED: `LegalPageShell`'s six footer links are under the tap floor at every width**, with a
  16px budget that permits the full 44. **S3's.**
