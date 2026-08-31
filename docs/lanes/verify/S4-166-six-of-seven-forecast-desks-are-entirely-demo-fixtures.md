# S4-166 — six of seven forecast desks are entirely demo fixtures, under a comment saying none of it is

> _S4 · 2026-08-31 ~10:50 UTC · Lovable project `371dd588`, all `SELECT`, plus source and `git log`.
> No dev server (R-21), no browser, no row written. **Standing question 2.**_

**Standing question 2 asks for seed data presented as real. This is it, and the code says out loud
that it is not happening.**

## The claims as made

`docs/lanes/log/S1.md`, RUN-104 and RUN-106: *"fifteen forecasts past their horizon, no verdict, and
the inbox said 'Nothing needs you' … Wired under the desk's own query key"*, and *"there are 15 due,
so the inbox understated by three on the day it shipped. Rows stay the page, the count became a
floor."*

`src/components/inbox/InboxSurface.tsx:29-31`: *"**EVERY ROW IS A REAL READ.** The calls come from
`getApprovalsQueue`, the runs from `listMissions` … **Nothing here is sample data**; where a group has
nothing real to show, the component draws nothing for it."*

## Verdicts

| claim | verdict |
| --- | --- |
| RUN-105's *91 of 176 forecasts resolved* | **CONFIRMED, exactly.** 176 with a forecast, 176 with a horizon, 91 resolved. |
| RUN-106's *count is a floor, not a page* | **CONFIRMED in code.** `count: "exact"` is applied before `.limit`, and the comment at `forecast.functions.ts:129` says why. |
| RUN-104's *fifteen past their horizon* | **STALE, not wrong.** It is **24** today. |
| `InboxSurface`'s *nothing here is sample data* | **FALSE, for six of the seven accounts that have a desk at all.** |

---

## What the desk actually holds

24 forecasts are past their horizon with no resolution. Split by the workspace they sit on:

| | |
| --- | --- |
| overdue, all workspaces | **24** |
| of those, on an `is_sample` workspace | **20** |
| **genuinely real** | **4** |
| `decisions.is_sample` set on any of them | **0** — only the *workspace* flag distinguishes them |

**But the population is the wrong statistic, and the per-person view is worse.** RLS admits the
workspaces a caller belongs to, so this is what each account's desk would draw:

| person | desk shows | of those, demo fixtures | real | from |
| --- | --- | --- | --- | --- |
| `60000000` | 4 | **0** | **4** | Helio Labs [real] |
| `20000000` | 3 | **3** | 0 | Helio Labs [sample] |
| `30000000` | 3 | **3** | 0 | Helio Labs [sample] |
| `40000000` | 3 | **3** | 0 | Helio Labs [sample] |
| `50000000` | 3 | **3** | 0 | Helio Labs [sample] |
| `1339eea2` | 3 | **3** | 0 | Helio Labs [sample] |
| `868ae33b` | 3 | **3** | 0 | Sample workspace [sample] |

**Six of the seven accounts with a non-empty forecast desk see a desk in which every single row is a
demo fixture.** Not a count inflated by fixtures — a count made entirely of them. The two populations
never mix for one person, so nobody sees a blended number; they see either all real or all fiction.

**These are not throwaway rows.** All seven accounts carry an email, five have a `last_sign_in_at`,
and they have between 34 and 624 `agent_runs` each. They were created in two batches sharing a
microsecond (2026-07-22 and 2026-07-25), so they are seeded accounts **that have been signed into and
driven**. Whoever opens one — including anyone demonstrating the product — is shown a forecast desk of
pure fixtures, presented as calls that need settling.

**The moat claim is what is on the line.** Canon: *the moat is the forecast captured at decision
time.* This is the one surface where that claim is cashed, and for six of seven accounts it is
cashing seed rows.

## Why it slipped, and it is this repository's signature shape

The invariant and the change that falsified it are two days apart:

```
f7af3a00c  2026-08-25  "The inbox door opens, and it was already built"
                       -> writes "Nothing here is sample data", naming its two sources:
                          getApprovalsQueue and listMissions
8f11615b0  2026-08-27  "RUN-106: my own new count was a bounded read stated as a total"
                       -> adds listDueForecasts as a THIRD source, at line 152
```

**The comment was true when it was written, about the two sources it names.** A third source was
added beneath it two days later and the sentence was not revisited. Same shape as F-151's inline list
that forgot a status word, and F-150's exemption that outlived its defect: **a written invariant that
a later change falsified without touching it.**

**Nothing on the path is sample-aware.** `listDueForecastsImpl` filters on `forecast_claim`,
`forecast_resolution`, `forecast_horizon_date` and `forecast_next_check_at`, and optionally
`workspace_id` — never `is_sample`. And `FORECAST_COLS` does not even select it, so
`ForecastDeskPanel`, `InboxSurface` and `forecast-line.ts` **could not label these rows if they wanted
to.**

**The cross-workspace design is NOT the defect and should not be touched.** `forecast.functions.ts:88-100`
argues the unscoped desk deliberately — *"every call anywhere that needs settling"* — and explains why
the scoped `listDueForecastsHere` exists separately for the strip. That reasoning is sound and this
finding does not disturb it. **The fix is orthogonal: exclude sample workspaces, or select `is_sample`
and label the row.** One filter, or one column and a chip.

## Related, and deliberately not re-filed

This is a new instance of the class in
[S4-055](./S4-055-the-shell-was-built-to-label-demo-data-and-does-not.md), open at OPEN-QUEUE §2.3b,
which names `listTracks` and the workspace menu. **`listDueForecasts` is a different function and did
not exist when that was filed** (RUN-104, this week), so it is recorded here as a new instance rather
than folded into the old row — but it is the same defect and one fix should cover both.

## What I did not do

I did not open a browser. The per-person table is computed from `workspace_members` and RLS's rule
rather than observed on a rendered desk, and I have said so rather than implying I watched it. **A
browser pass should confirm the rendered count matches**, and it is the next thing I owe.

No approval answered, nothing pressed, no track driven, no row written.

**Owner: S1** for `listDueForecasts` and the `InboxSurface` invariant, since RUN-104/106 are theirs
and the sentence is in their file's header.
