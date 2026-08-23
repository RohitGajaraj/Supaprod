# M13 — `leading-snug` is not Meridian's snug, and both lanes are about to write it

**Kind:** proactive finding + ruling, no request
**Raised by:** MAIN LANE
**Written:** 2026-08-23 13:20 IST
**Read this before your next surface port.** It costs you one line and it is the
founder's number one complaint in its most literal form.

## The collision

Two of Tailwind's leading names already exist in Meridian, **at a different number**:

| you write | you get | Meridian's value | gap |
| --- | --- | --- | --- |
| `leading-snug` | **1.375** | `--mrd-lh-snug` **1.5** | rows 8% tighter than the system says |
| `leading-tight` | **1.25** | `--mrd-lh-tight` **1.15** | headings 9% looser than the system says |
| `leading-relaxed` | 1.625 | `--mrd-lh-prose` 1.625 | same value, reached by luck |

Nothing warned anyone. Ten sites inside `src/components/meridian/` were on the first two,
every one of them reading as though it were on scale.

## Why the snug half is the founder's complaint, exactly

`--mrd-lh-snug` carries its own reason in `meridian.css`:

```css
--mrd-lh-snug: 1.5; /* UI rows. Was 1.4; the reference's air lives here */
```

The value was **raised on purpose** to stop UI rows reading as stuck together. Six components
were sitting at 1.375, which is **tighter than the 1.4 that ruling replaced**. So the surfaces
had not merely failed to gain the air; they had gone backwards past the starting point.

> "every word is stuck and very close to each other, especially on the right side. When you show
> additional details, it looks like back to back, back to back, back to back."

That is a fair description of a 1.375 row, and no author chose it. A name resolved to the wrong
system.

## What now exists, and what you write instead

`leading-mrd-tight` · `leading-mrd-snug` · `leading-mrd-prose` · `leading-mrd-mono`.

**Never write a bare `leading-*` in a surface you are porting.** If you need a leading and none of
the four fits, that is a `meridian-gap` request, not an arbitrary value.

`meridian.css` had documented this family since before either of you started (*"`text-mrd-base
leading-mrd-body` composes"*) and **it had never been built**, and `--mrd-lh-body` is not in the
family either. So an author who read the rule and obeyed it emitted no rule at all and inherited
the parent's leading, invisibly. Built and corrected in `b7d2c4021`.

## THE PART THAT IS YOURS, AND THE GUARD DOES NOT COVER IT

`leading-stays-on-the-meridian-scale.test.ts` scans **`src/components/meridian/` only**, because
that is what MAIN LANE owns and a guard should not fail a lane for a file it was handed dirty.

**The collision exists in every directory, and there is four times more of it than there was in
Meridian.** Measured 13:20 today: **138** bare Tailwind leadings across `src/components` and
`src/routes` outside `meridian/`, against the 32 that were inside it. They are not in the ratchet
and they are not in any guard, so nothing will tell you. Run it on your own files:

```bash
grep -rn "leading-\(snug\|tight\|relaxed\|none\|normal\|loose\)" --include="*.tsx" \
  src/components src/routes | grep -v components/meridian | wc -l
```

**Ruling: as you port a file, convert its leadings in the same commit.** Not a sweep, not a
separate item. A file that lands on Meridian carrying `leading-snug` has been reskinned rather
than ported, and it will read as stuck together no matter how correct its type roles are.

When your directories are clean, tell me and I will widen the guard's scan to cover them. Widening
it before that would fail you for work you have not reached yet.

## One thing I did NOT change, so you do not "fix" it

`rows.tsx` `Line` keeps `leading-[1.4]` on its **row container**, and it is exempted in the guard
with the reason. It is measured: Line is the most-used row in the app, was 46.9px, and
`py-[11px]` plus that leading land it at 40.9px, inside the band the density research supports.
**Do not round it.**

What did change is one layer in: `Line`'s `sub` is a wrapped sentence up to 56 characters wide
that carried no leading of its own and inherited the row's 1.4. The measurement was about a row's
**box height**; it was never an argument about a paragraph nested inside one. The sub now names
`leading-mrd-snug` and a Line with no sub renders identically, which is the case the 40.9px was
measured on. `45af3ef12`.

That distinction is the general rule: **an inherited value is not a decision.** Before you keep an
off-scale leading because a comment defends it, check whether the comment defends it *for the
element you are looking at*.
