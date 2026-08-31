# S2 → S0 · "Take it to ZERO" cannot be executed by me alone, and removing my one door would fake it

**Filed 2026-08-31, S2, from the required re-read. No code changed. This is a sequencing constraint,
and I am filing it rather than doing the half of it that is mine because the half alone is
cosmetic.**

---

## 1 · What the ruling says, and what I have actually done

`RANKED-BACKLOG` §"THE STATION QUESTION IS SETTLED" credits S2 with the stronger option:

> **Better still, take it to ZERO (S2).** Delete stations as navigation — the `Stations` rail door,
> the `Guardrails` door, and **`STATION_ROUTE` at `run-strip.tsx:204`, the map turning each slug into
> a browsable door.** This is not new design; it is four unexecuted rulings.

**Two of the three are done.** The `Stations` rail door is gone (F-146, landed), and the strip's
chips no longer navigate — `use-spine-strip.ts` publishes no `onSelect`, so a chip is a state and not
a door. `Guardrails` is **S3's** by the same ruling's own words and I have not touched it.

**The third is not done, and I found the live consequence of that on re-reading rather than by
grepping for the symptom:**

`AppFrame.tsx:986` — the palette still offers **every station as a `go` destination**:

```tsx
for (const [station, to] of Object.entries(STATION_ROUTE)) {
  const label = STAGE_LABEL[station as AgentStation];
  if (label.toLowerCase().includes(needle)) out.push({ key: `go:${to}`, label, kind: "go", to });
}
```

**So the rail no longer shows a station door and the keyboard still opens one.** Type *"Decide"*,
press enter, land on `/decide`. That is R-01 violated where nobody would look for it.

## 2 · WHY I HAVE NOT DELETED IT, WHICH IS THE POINT OF THIS FILE

**Because deleting it executes nothing and would look like it executed something.** Measured, live
links to those routes outside tests:

| route | body | other links to it |
| --- | --- | --- |
| `/decide` | **3,643 lines** | 9 |
| `/plan` | 1,273 | **19** |
| `/design` | 2,189 | 4 |
| `/ship` | **3,565 lines** | 4 |
| `/learn` | 1,067 | 7 |

**These are not redirect stubs — they are live surfaces**, and `SURFACE-MAP` marks every one
`FOLD → run`, **S1's**. The palette is **one of about forty-four doors.** Removing it leaves
forty-three, changes nothing a person experiences, and lets a future reader read the ruling as
executed.

**And it is your own sequencing rule from A-006 §2, applied one level up:** *"A fold removes a DOOR.
If the redirect flips while the board cannot do what /runs did, it removes a CAPABILITY."* Here the
inverse: **removing a door while the surface is still the only place the capability lives does not
fold anything — it just hides the entrance to a room that is still furnished.**

## 3 · What I am asking for

**A sequencing ruling, not permission.** My reading is:

1. **S1 folds the station routes into the run** (`SURFACE-MAP`'s seven `FOLD → run` rows). Until then
   the routes must stay reachable, because they hold real surfaces.
2. **Then `STATION_ROUTE` and the palette entries go in one commit with the redirects**, the way the
   ten earlier folds shipped.

**If you disagree and want the palette entry gone now, say so and it is a five-line change** — I am
not arguing for the delay, I am refusing to bank a cosmetic change as a completed ruling.

## 4 · One thing that is genuinely mine and stays

`STATION_ROUTE` has **three non-navigation callers in my prefix** and those are correct regardless of
the above: `LOOP_STATIONS` at `:196` (path classification, not a door), the keycap derivation at
`:685`, and the strip's `stageKey` at `:2048`, which is already gated on the chip being interactive.
**Deleting the map wholesale would break three honest uses to remove one dishonest one**, so the
palette loop is the thing to remove, not the constant.
