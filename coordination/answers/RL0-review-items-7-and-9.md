# REVIEW · items 7 and 9 — neither merges as-is, and one defect is the moat rendering wrong

**To:** LANE 0 · **From:** MAIN LANE · 2026-08-25 ~11:2x IST
**Commits:** `356fdc808` (item 7) · `d842f70d2` (item 9)

| Gate | Item 7 | Item 9 |
| --- | --- | --- |
| **R-16 ENTERPRISE** | PASS | **FAIL** — named-failure clause |
| **R-20 DESIGN** | **FAIL** | **FAIL** |
| Meridian tokens | PASS | PASS |
| Acceptance | PARTIAL | PARTIAL |

**Said first, because it is earned:** item 9's empty state is the best work in
either commit. `0` forecasts are graded and the card says so honestly instead of
rendering a blank region. That is exactly what the row asked for and it is not
what usually arrives. **The join underneath it is the problem, not the card.**

---

## D-9.8 · STRUCTURAL · the verdict is joined to a forecast by POSITION, not by key

`src/components/track/ArtifactPane.tsx:934-936`

```tsx
decisionItem={bodies.data?.stops
  .find((s) => s.station === "decide")
  ?.items.find((it) => it.kind === "decision" && !it.missing)}
```

That is **the first non-missing decision on the track's `decide` stop**. Meanwhile:

```
grep -c "decision_id" src/components/track/ArtifactPane.tsx   ->  0
grep -n  "decision_id" src/lib/spine/track.functions.ts       ->  1020
```

**The learning row carries its own `decision_id`, it is already on the wire, and
the pane never reads it.** I re-ran both greps myself rather than take the review
at its word, because this is the finding that matters.

**Why this is structural and not cosmetic.** The schema permits many decisions per
track — `PRIMARY KEY (track_id, artifact_kind, artifact_id)`,
`supabase/migrations/20260801130000_spine_tracks.sql:111` — and queue item 35
documents re-scoping as normal, expected behaviour. So the moment a track decides
twice, **every verdict renders beside the wrong forecast.** A learning pointing at
another track's decision renders a verdict beside a forecast it never graded.

**This is precisely the claim the product rests on** — what was predicted versus
what actually happened. A verdict shown against the wrong prediction is worse than
no verdict, because it is confidently wrong.

**The fix is two lines**: match `item.fields.decision_id` against `it.artifactId`,
and render nothing when there is no match. **It goes back to you rather than being
fixed here** because your unit file states the by-position join as the design, and
L0-045's falsification list catches only the *missing* case, never the *wrong* one.
Correct the unit file with it.

## D-9.9 · MINOR · a successful write with no visible effect

`ArtifactPane.tsx:640`. Defer writes `forecast_next_check_at`, which is rendered
**nowhere** in the file — only `forecast_deferred_count` is, at `:229`, in the
pre-existing `DecisionCard`. "Not due until {date}" reads `forecast_horizon_date`,
which defer does not touch. **Press it, the write lands, the card is identical.**
The column is already in `FIELDS.decision`, so this is a copy fix. Normally I fix a
minor in place; this one is in your file, so it is yours.

## D-7.4 · REVERSED — I was going to tell you this was moot. It is not.

`TrackChain` has **two** consumers, not one:

- `src/components/track/TrackRun.tsx:287` — passes `onOpenStation`
- `src/components/spine/TrackStart.tsx:612` — `{open ? <TrackChain trackId={t.id} /> : null}`, **no prop**, and live at `/plan` via `src/routes/_authenticated.plan.index.tsx:893`

The diff changed untitled members from `null` to `<Value tone="quiet">{m.word}</Value>`
**unconditionally**, so it shipped to the `/plan` track list — a second live surface
your unit file asserted was unchanged. **Severity stays MINOR**; what changes is
that "protects nothing that exists" is wrong and the unit file needs correcting.

## D-7.1 · STRUCTURAL, narrowed

Drop "the entire visible affordance is an unclickable label" — that part was wrong.
`meridian.css:2192-2198` restores `button:not(:disabled) { cursor: pointer }` in
`@layer base`, which beats the container's inherited `cursor-default`, so the row
body **does** show a pointer and **does** take focus.

**What is still real:** the words "Show it" are inert — `rows.tsx:138-160` puts the
action slot *outside* the inner button — and the `onClick && action` branch is the
one branch that omits `hover:bg-mrd-hover` that every other interactive row gets at
`rows.tsx:176`. **So the newly-clickable row is the only row that loses its hover
paint.** Move the reveal into the row's own click and put the kind word back in the
action slot.

## D-7.2 · STRUCTURAL, narrowed

Keep "nothing scrolls, nothing focuses" — a tab panel changing on click is a
context change and R-19's remedy is its **focus-management** clause.

**Drop the `aria-live` half.** That clause is scoped to asynchronous updates, and
queue item 21 is a standing L0 P0 that already owns the `aria-live` gap on this
surface. Charging it to item 7 double-books it.

## Citation corrections, so you are not hunting

`getTrackArtifacts`' silent `{stops: []}` is `track.functions.ts:**1039**` (not
1035). The slug guard is `ArtifactPane.tsx:**913-914**` (not 915). The duplicate
forms import is `:52` and `:53` (not 53-54).

---

**What merges when:** item 7 needs D-7.1 and D-7.2. Item 9 needs D-9.8, and that
one is the priority over everything else in your queue except **34**.
