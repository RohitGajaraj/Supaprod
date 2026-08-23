# ANS-M10: The untiered controls are 337, not 451, and they are on your side of the line

**Verdict:** partial
**Answered:** 2026-08-23T11:30:00+05:30
**Raised by:** nobody. MAIN LANE, finishing the third of the three adoption gaps and
**correcting its own earlier number** while doing it.

## The correction first

[`M07`](./M07-tiered-buttons-already-exist-and-are-half-adopted.md) said **451 of 954**
controls bypass the `Action` / `Approve` tiers. That number counted the design system's own
components alongside the surfaces, and it should not have.

**A raw `<button>` inside Meridian is usually correct.** `Action` IS a `<button>`; so is
`Approve`. A primitive is made of the element it wraps, and counting that as a bypass is like
counting a table's legs as furniture standing on the floor.

The honest split:

| | controls | tiered | untiered | |
| --- | --- | --- | --- | --- |
| inside `components/meridian/**` | 113 | 18 | 95 | mostly implementations, some real |
| **everywhere else** | **808** | **471** | **337** | **the actual adoption gap** |

**337 is the number to work against, and it is 42% of the controls on your surfaces.**

## Why I am not fixing them

Two reasons, and the second is the one that matters.

**They are yours.** `STATUS.md` gives MAIN LANE `meridian.css` and `components/meridian/**`;
everything else is your side of the line, and 337 of these are on surfaces you are porting
anyway. Converting them under you would be the two-writers failure the split exists to stop.

**And a bulk conversion would be wrong even if they were mine.** Not every `<button>` is an
Action. A tab, a nav item, a dismiss X, a disclosure caret and a clickable row are all
interactive without being an ACTION in the tier sense, and forcing them into `Action` would
put a control tier on something that does not act. **The question is one per control and it is
not mechanical:**

> Does clicking this DO something to the work? If yes, it is `Action`, and pick the variant.
> Does clicking it UNBLOCK something held? Then it is `Approve` and never `Action`.
> Does it only reveal, navigate or dismiss? Then a plain `<button>` is correct and it should
> stay one.

## Where the 337 are

```bash
# the count, so you can watch it fall
python3 - <<'PY'
import re,glob
fs=[f for f in glob.glob('src/components/**/*.tsx',recursive=True)+glob.glob('src/routes/**/*.tsx',recursive=True)
    if '__tests__' not in f and '.test.' not in f and '/meridian/' not in f]
n=sum(len(re.findall(r'<button\b',open(f).read()))+len(re.findall(r'<Button\b',open(f).read())) for f in fs)
print(n)
PY
```

| file | untiered controls |
| --- | --- |
| `src/components/missions/MissionOrchestratorDetail.tsx` | 23 |
| `src/components/shell/primitives.tsx` | 15 |
| `src/components/brief/BriefFormationFlow.tsx` | 11 |
| `src/routes/_authenticated.runs.index.tsx` | 10 |
| `src/components/shell/AppFrame.tsx` | 8 |
| `src/components/onboarding/ObsidianOnboarding.tsx` | 8 |
| `src/components/today/DecisionQueue.tsx` | 7 |
| `src/components/admin/InvitationsPanel.tsx` | 7 |
| `src/components/product/DesignScaffoldPanel.tsx` | 7 |
| `src/components/product/ProductAnalyticsPanel.tsx` | 7 |

**`shell/primitives.tsx` is the retired layer**, so its 15 die with it rather than being
ported, and the 99 `<Button>` uses across the tree are that layer's component reaching into
surfaces. Those two facts overlap: retiring the layer and tiering the controls is one job, not
two, and it is already Wave 1 shaped.

## What is ready for you

Everything this needs now exists and none of it did this morning:

- **`Action` with `default | primary | quiet | destructive`**, and `Approve` as its own
  component for controls that unblock. Neither is new; they were there and half-used.
- **Text roles** for the labels around them ([`M08`](./M08-meridian-has-text-roles-now-use-them.md)).
- **Spacing roles**, including `gap-mrd-inline` for a mark and its label and `gap-mrd-stack`
  for row to row.
- **`EmptyRegion`**, so a surface with nothing in it no longer has to reach for the retired
  `Empty` and take the debt.
- **Source marks** on official brand geometry, so a row naming a source can show it.

**Meridian's own state, for what it is worth as a floor:** hard-coded type sizes 259 to 10,
double `font-size` declarations 57 to 0, headings at or below body size 9 to 0, Tailwind
default animations 1 to 0, and three wrong brand colours corrected against the published
values.

## What I would take first, if it were mine

`MissionOrchestratorDetail.tsx` at 23. It is the largest single concentration, it was already
named as a port target in the session handoff on 2026-08-22, and it is a detail surface, which
is where the founder says the reading is worst: *"when you show additional details, it looks
like back to back, back to back."* The rail fix in `ContextColumn` is the shape to copy, and
its reasoning is written into that file rather than left in a commit message.
