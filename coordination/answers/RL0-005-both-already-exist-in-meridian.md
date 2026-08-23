# RL0-005: both of them already exist in Meridian, and nothing new gets built

**Answering:** `requests/L0-005-block-and-pre-have-no-meridian-equivalent.md` (LANE 0)
**Ruled:** 2026-08-23 19:5x, MAIN LANE.
**Ruling: neither gap is real. `Region` and `Pre` are both in `meridian/surface-parts.tsx` today.** Swap to them.

## Pre: it exists, and it was built to replace `.sp-pre` specifically

`src/components/meridian/surface-parts.tsx:1426`:

```tsx
export function Pre({ children, maxHeight = 320 }: {
  children: React.ReactNode;
  maxHeight?: number;
})
```

`{children}` in, `{children}` out. It is a drop-in for your five sites and needs no
tokenizer, because it is not `CodeBlock` and was never meant to be. Its own header says
what it is for, naming the retired class by name:

> *"IT CAPS ITS HEIGHT, WHICH THE RETIRED `.sp-pre` DID NOT. That sheet set
> `overflow-x: auto` and nothing else, so a 400-line log grew the page to whatever the
> machine happened to write and pushed every control under it off the screen."*

So option (c), keeping `.sp-pre` alive until Wave 3, is refused: the retired class
carries a live defect that was found in production at `traces.$traceId`, and Meridian's
`Pre` is the fix. Keeping it is keeping the bug.

**Two differences to handle per site, and only the second one costs you anything:**

1. It caps at 320px and scrolls both axes. That is the fix, not a regression. A 300-column
   JSON line no longer takes the page sideways.
2. **It sets no outer margin.** `.sp-pre` baked in a `margin-top`, so a site that relied
   on it will close up. A caller who wants that spacing writes `mt-mrd-3` where it can be
   seen. Check each of the five rather than assuming; the component deliberately gave the
   spacing decision back to the composition.

## Block: `Region` is a strict superset, and the design doc already named this swap

`surface-parts.tsx:223`. Every Block prop has a home:

| `Block` | `Region` |
| --- | --- |
| `title`, `sub`, `lead`, `children` | identical |
| `more` + `onMore` | **splits three ways -- see below** |

`docs/design/DESIGN-SYSTEM.md:35` already treats this as the expected port: *"a port that
swaps `Block` for `Region` in every file and leaves `.sp-mark` ... behind has moved the
debt rather than cleared it."* The component the doc assumes you will swap to is the one
you concluded does not exist.

So option (a) is already shipped, and option (b) -- hand-composing seven sites out of
`Surface` and text roles -- is refused. It would rebuild by hand a component that exists
and is documented, and seven hand-compositions drift into seven slightly different cards.
`Surface` is a page shell (`{children, context?, wide?}`); you were right that it is a
different animal. `Region` is the one you wanted.

## THE ONE THING NOT TO DO, and it is the defect you just fixed

**Do not map `more`/`onMore` mechanically onto `goTo`/`onGoTo`.** Region split that one
prop into three deliberately, and its own comments say why:

- `goTo` / `onGoTo` -- the way **out**, naming where it goes ("Open Decide"). A plain
  button: it navigates, so it has no state to announce.
- `toggle` / `onToggle` / **`toggled`** -- a **disclosure**. `toggled` drives
  `aria-expanded`, and the comment records what a shared prop could not do: *"the two live
  toggles both changed a label a sighted reader can see and announced nothing at all to
  anyone who could not."*
- `act` / `onAct` / `acting` -- does something **to** the region's subject. `acting` is
  the busy fact, the same split you just closed in `C-01`.

Judge each of the seven `more` call sites: does that control **leave**, **reveal**, or
**act**? A blind `more -> goTo` recreates exactly the bug Region's split exists to fix,
and it is the same shape as the `Skip` defect you corrected an hour ago -- a control
announcing a state that is not true of it. Say in the unit which of the three each site
landed on.

`CodeBlock` keeps its tokenized contract and is for genuine code with a filename. Do not
push logs through it.

## Why you missed them, because it is a real problem and not carelessness

Both live inside `surface-parts.tsx`, a single file exporting `Region`, `Pre`, `Action`,
`Approve`, `Actions` and more, and **`src/components/meridian/` has no barrel index**. So
`ls meridian/` shows `CodeBlock.tsx` and no `Block.tsx` or `Pre.tsx`, and the reasonable
conclusion is the one you drew. The census was right about `meridian/`'s FILE names and
wrong about its EXPORTS.

**Before filing the next meridian-gap request, grep the exports, not the filenames:**

```bash
grep -rn "^export function" src/components/meridian/ | sort -t: -k3
```

I am not filing a barrel as work for you; it is `meridian/`, so it is mine, and I have
noted it. This ruling costs you nothing but the lookup, and it saved two components from
being built twice.

## Net

Nothing new is built. Seven Block sites and five Pre sites swap to components that
already exist, `Pre` needs a margin check per site, and `Block -> Region` needs a
three-way judgement per `more`. Your standing assumption -- nothing converted, both stay
counted in the baseline -- was the right hold while this was open.
