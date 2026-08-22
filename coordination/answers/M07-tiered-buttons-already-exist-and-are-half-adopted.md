# ANS-M07: Tiered buttons are not a Meridian gap. They exist, and 47% of controls ignore them

**Verdict:** refuted
**Answered:** 2026-08-23T04:58:00+05:30
**Refutes:** ranked win #2 in [`units/000-reading-notes.md`](../units/000-reading-notes.md),
"**the missing primitives**: visibly-tiered buttons (founder-named defect)".

**The founder's complaint is real. Its cause is not a missing primitive.** I measured the
complaint myself on `/pricing` in [`M05`](./M05-the-founders-test-run-against-the-live-site.md):
Enterprise's action at weight 500 while three siblings sit at 600, and "Request access"
rendering at two different treatments on one page. That is all true. **What is not true is that
Meridian lacks the primitive to fix it.**

**Do not build a `Button` component.** It would be the fifth button vocabulary in this repo and
a regression, not a fix.

## What already exists

`src/components/meridian/surface-parts.tsx:409`

```ts
export type ActionVariant = "default" | "primary" | "quiet" | "destructive";
```

**Those are the four tiers the founder named**, already shipped. And the system goes further
than a variant union, in a way worth reading before you touch it:

| Component | Line | What it is for |
| --- | --- | --- |
| `Approve` | `surface-parts.tsx:596` | a click that **UNBLOCKS**: something is held, pressing it releases it |
| `Action` | `surface-parts.tsx:518` | "a control that does something, and **unblocks nothing**" |
| `Actions` | `surface-parts.tsx:644` | the container that enforces one primary |

**The accent is a separate COMPONENT rather than a fifth variant string, and the file says why:**

> "The four files that grew a copy of this had already reached that conclusion separately... They
> then disagreed about what `primary` meant, and one of them spent orchid on a failed read's
> retry. Making the accent a different COMPONENT rather than a different string is what stops
> that recurring."

That is CLAUDE.md's *approve vs review* ruling encoded as structure instead of documentation.
`Approve` for a merge gate or an approval-queue item; `Action` for everything that merely does
a thing. **The test is whether clicking it unblocks something.**

`destructive` is wired to `--mrd-stop`, and the file records a hazard no gate can catch:

> "Put `--mrd-stop` on a chip and the greyscale law breaks, silently, with no gate to catch it:
> the ratchet sees a valid `--mrd-*` token and passes. There is no test that can currently stop
> this."

`--mrd-fail` and `--mrd-stop` read **1.12 on dark and 1.04 on paper** against each other, which
is indistinguishable in greyscale. They are survivable only because one is a state on chips and
the other a control on buttons. **Keep that separation.** It is also why `--mrd-stop` has no
chip, which I ruled on separately in [`M04`](./M04-the-ratchet-cannot-see-the-founders-pain-point.md).

There is also a `busy` prop, distinct from `disabled`, with its own measurement: 196 call sites
disabled on a pending flag and **not one** announced it, so a screen reader said "unavailable"
for the whole round trip of every mutation in the product.

## The actual defect, measured

Not a missing tier. **Nearly half the controls in the product never reach the tiers.**

```bash
grep -rho "<Action\b"  src/components src/routes --include='*.tsx' | wc -l   # 475
grep -rho "<Approve\b" src/components src/routes --include='*.tsx' | wc -l   #  28
grep -rho "<button\b"  src/components src/routes --include='*.tsx' | wc -l   # 352
grep -rho "<Button\b"  src/components src/routes --include='*.tsx' | wc -l   #  99
```

| | controls | share |
| --- | --- | --- |
| speaking Meridian (`Action` + `Approve`) | 503 | **52.7%** |
| hand-rolled `<button>` or retired `<Button>` | **451** | **47.3%** |
| total | 954 | |

**A hand-rolled `<button>` has no tier at all**, which is exactly what the founder is seeing: not
four tiers rendering too similarly, but 451 controls that were never asked which tier they are.

**One honest caveat:** a handful of those 352 are the primitives' own implementations, since
`Action` is itself built on `<button>`. `surface-parts.tsx` holds 12 and `SidebarNav.tsx` 8 for
that reason. **It does not move the conclusion** — the count is 451 against 503 and the
implementations are a couple of dozen at most.

Worst offenders, and the first two are the useful targets:

| File | raw `<button>` |
| --- | --- |
| `src/components/missions/MissionOrchestratorDetail.tsx` | 15 |
| `src/components/product/ProductAnalyticsPanel.tsx` | 7 |
| `src/components/product/DesignScaffoldPanel.tsx` | 7 |

## This is the same shape as the type finding, in a second domain

| | the system has | the product uses | diagnosis |
| --- | --- | --- | --- |
| type | 13 steps | 480 hard-coded px, 457 of them exact duplicates of a step | adoption |
| controls | 4 tiers + `Approve` | 451 of 954 controls bypass them | adoption |

**Twice now, the richest part of Meridian is the part least used.** That is worth saying to the
founder plainly: the design system is not the problem, and building more of it is not the fix.

## What this changes

**Rewrite ranked win #2.** It is not "build the missing primitives". It is **"route the 451
controls that bypass the tiers into `Action` and `Approve`, and decide the tier for each."**
That is mechanical for most of them and it is a judgement call for exactly one question per
control: *does clicking this unblock something?* If yes it is `Approve`; if no it is `Action`
with a variant.

**A third metric for your unit files**, beside the ratchet and the 873:

```bash
echo $(( $(grep -rho "<button\b" src/components src/routes --include='*.tsx' | wc -l) \
       + $(grep -rho "<Button\b" src/components src/routes --include='*.tsx' | wc -l) ))
```

**Opening value: 451.** It should only go down.

**What I am NOT refuting** in your ranked win #2: the caption/inset pattern and empty-state
treatment. I have not adjudicated those yet. `boundary-states.tsx` covers **failure** states only
(`ShellReadFailed`, `ShellRouteMissing`, `PageReadFailed`, `PageRouteMissing`), and `NeedsSetup.tsx`
and `LoadingState.tsx` exist, so **empty is the one genuinely thin area** of the three. File a
`meridian-gap` request naming the surface and what it must say when it has nothing, and I will
rule on it with the same check I ran here.
