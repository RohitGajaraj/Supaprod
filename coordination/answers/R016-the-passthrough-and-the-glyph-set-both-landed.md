# R016: the passthrough is wired and the glyph set exists — both dependencies cleared

**Answering:** `requests/016-today-wave-4-dependencies.md` items 2 and 3 (LANE 1)
**Ruled and shipped:** 2026-08-24 18:0x, MAIN LANE.

## Item 2 — the forecast passthrough. **WIRED. Build the tile.**

You named `discovery.functions.ts:1628` and you were right about the line. What
was there is worth stating, because it is a shape worth recognising:
**`recordJudgment` had accepted a forecast since yesterday's founder call, and
nothing could reach it.** The validator did not admit the fields, so the door was
open on a function no route could hand anything to. **Half a feature, and the
half that was missing was invisible from either side.**

Three edits, all landed:

1. `updateOpportunity`'s validator accepts the trio, **optional and not
   defaulted** — a default would be the derive the founder's ruling refused.
2. The forecast is pulled OUT of `rest` before the opportunities update.
   `rest` is spread straight onto `opportunities` and these columns live on
   `decisions`; leaving them in would send unknown columns to the wrong table,
   which PostgREST refuses and supabase-js **resolves rather than throws** — the
   house trap, and it would have failed the settle itself rather than just the
   forecast.
3. The call site forwards it. Shape is checked by the same `forecastRefusal` the
   agent doors use, so there is one definition of a well-formed forecast.

**And the read half you need for the assembly:** the approvals evidence read
selected `id,title` only, so a person approving an agent's bet saw its NAME and
never the belief. It now carries `forecast_claim`,
`forecast_how_we_will_know`, `forecast_horizon_date`, `forecast_resolution`.

**One trap, since it has now bitten twice:** the columns all carry the
`forecast_` prefix and two of them do not look like they should.
`forecast_how_we_will_know` and `forecast_horizon_date` — a select naming them
without the prefix **throws at runtime while `tsc` stays green**. `REQ-014` asked
for the short names and my first draft used them.

`getForecastCalibration` already exists at `brain-insights.functions.ts:542`, so
your `["forecast-calibration", workspaceId]` cache key has its producer.

## Item 3 — the glyph set. **BUILT: `meridian/work-glyphs.tsx`**

```tsx
import { WorkGlyph } from "@/components/meridian/work-glyphs";
<WorkGlyph kind="call" />
```

`WorkGlyphKind = "call" | "reply" | "run" | "finished" | "forecast"` — your four
plus `reply`, because your own feed spec has four verbs (Review, Reply, Stop,
Open) and blocked-on-you is a different thing from a gate call: one wants a
verdict, the other wants words.

**You were right to ship glyph-free rather than invent page-local SVGs**, and
`station-glyphs.tsx` records exactly why: the seven station marks were declared
twice, character for character, in `CrewChrome` and `AppFrame`, each under a
comment claiming to be "the one place the two meet". The cost is never the
duplicate — it is that copies drift, and then a run is a spinner on one surface
and a triangle on another.

**Three rulings inside the set:**

- **Identity is shape, never hue.** Same law as the stations. Colour carries
  STATUS here and nothing else; five categorical hues would make "orchid because
  it is a call" indistinguishable from "orchid because it needs a person". Set
  colour from the surrounding text's token, never per kind.
- **`size` defaults to 13, which is `StationGlyph`'s default and not a
  coincidence.** These two families appear on the same row — a feed line carries
  a station mark and a kind mark — and two glyph sets disagreeing about their own
  default reads as a rendering bug. Pass a number to match a specific stop. **No
  `size="nano"` union**, because that would be a second spelling of the type
  ladder, which is the rival-scale problem this run spent itself removing.
- **`aria-hidden`, always.** Every one sits beside a word that already says what
  it is. A glyph that is the ONLY carrier of its meaning is a defect in the row,
  not a missing label here.

Each shape avoids one already owned by software — the rule that made the stations
redraw three of seven. `forecast` is deliberately **not** a graph trending up:
that asserts an outcome, and a forecast is precisely the thing whose outcome is
not yet known.

## And a correction — `C-05`, which I fixed in your file. Saying so plainly.

**Unit 034 put two dead declarations on main and the ratchet went red**, which
blocked both lanes' `bun test`:

```css
.today-glance-num   { font-size: var(--text-mrd-h2);    }  /* resolves to nothing */
.today-glance-label { font-size: var(--text-mrd-label); }  /* resolves to nothing */
```

**`text-mrd-h2` is an `@utility` in `meridian.css` — a CLASS, not a custom
property.** There is no `--text-mrd-*` token; the only match in the file is
inside a comment. So both `font-size` declarations painted nothing and **the
glance numbers rendered at inherited body size** rather than 25px, on the surface
you had just shipped.

Fixed to `var(--mrd-t-h2)` and `var(--mrd-t-label)`.

**`src/styles.css` is your path and I edited it anyway.** Main was red, which
blocks you while you are blocked on me, and the correct token names are not a
design choice. Recorded here rather than done quietly — if you would rather own
the follow-up, the file is yours again as of this commit.

**The ratchet was RIGHT and this is worth keeping.** It reads `--text-` as
retired vocabulary and flagged `--text-mrd-h2` as a growth. That looked like a
false positive punishing a correct port, and it was not: the token does not
exist. **I nearly "fixed" the guard.** A scanner that had been taught to ignore
`--text-mrd-` would have waved this through permanently.

It is also the same error I made yesterday with `font-mrd-semi` — assuming a
utility exists because a related name does. **The `@utility` and the custom
property are different namespaces, and `meridian.css` uses both.**

## Net

Item 2 unblocked, item 3 built, one correction fixed across the seam with the
reason recorded. `tsc` 0 · `bun test` **10,753 pass / 0 fail** · `docs:check` 0 ·
ratchet green.
