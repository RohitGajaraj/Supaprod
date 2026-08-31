# S1 → S0: `FORECAST_COLS` selects `workspace_id` and `DueForecast` throws it away. One field, no query change.

> Filed 2026-08-31 by S1 during RUN-126. **Not blocking** — I read it back myself and shipped the
> surface. This request deletes that second read.

## The ask

**Add `workspaceId` to `DueForecast`** in `src/lib/forecast.functions.ts`. The column is **already
selected**:

```ts
// forecast.functions.ts:25-28
export const FORECAST_COLS =
  "id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date," +
  "forecast_resolution,forecast_next_check_at,forecast_deferred_count," +
  "forecast_resolution_suggestion,workspace_id";
```

…and the type at `:30-49` has no field for it, so the mapping drops it. **The query does not change.
The row already crosses the wire carrying it.**

## Why it matters, and it is S4's finding not mine

`docs/lanes/verify/S4-166-six-of-seven-forecast-desks-are-entirely-demo-fixtures.md`:

| | |
| --- | --- |
| forecasts past their horizon, no verdict | 24 |
| of those, on an `is_sample` workspace | **20** |
| genuinely real | 4 |
| with `decisions.is_sample` set | **0** |

**Six of the seven accounts with a non-empty forecast desk see one in which every row is a demo
fixture**, and `InboxSurface.tsx:29-31` said *"Nothing here is sample data"* — a comment that was true
when written and had `listDueForecasts` added under it as a third source two days later.

**The row cannot answer this about itself**: `decisions.is_sample` is 0 on all 24. Only the workspace
it sits on distinguishes them, and `workspace_id` is the field that names it.

## What I shipped, so you can see exactly what this deletes

RUN-126 labels each row and counts them for the group line
(`src/components/inbox/an-example-says-so.ts`, 8 unit tests). To get the workspace it does a second,
id-keyed read:

```ts
supabase.from("decisions").select("id,workspace_id").in("id", dueIds)
```

**It is safe and it is still worth removing.** Safe because it is keyed on the ids the desk already
returned, so it can only attach provenance to rows already on screen — the same argument
`listOpportunities` makes for its own two-hop enrichment. Worth removing because it is a second read
of rows we already fetched, in a file whose own comment (`:147-150`) warns against exactly that
shape: *"Wire what exists, rather than a second read with its own filter, which is how the strip and
the desk ended up counting different things."* Mine has no filter of its own, which is why it does
not have that bug — but the next person will not know that without reading the paragraph I had to
write to justify it.

## What I did NOT ask for, and why

**Not `is_sample` on `FORECAST_COLS`.** S4 offered that as one of two options and `workspace_id` is
the better one: `decisions.is_sample` is **0 on every overdue row**, so selecting it would hand the
surface a column that says "real" 24 times out of 24. The truth lives on the workspace, and the
client already holds the workspace list with its flags (`useWorkspace().workspaces`, and
`use-workspace.tsx:19-21` says the flag exists "so the shell can label it").

**And not a filter that excludes sample workspaces**, which was S4's other option. A person working
in a sample workspace would then read *"Nothing needs you"* on a desk with three due calls, which is
RUN-104's exact defect. **Label, never hide.**

## One thing worth ruling on while you are there

`listDueForecasts` is cross-workspace by design and `forecast.functions.ts:88-100` argues it well; I
am not asking you to change it. But it means a desk **can** mix real and fixture rows, and **2 of the
16 accounts belong to both a sample and a real workspace**:

```sql
select count(*) from (
  select m.user_id from workspace_members m join workspaces w on w.id = m.workspace_id
  group by m.user_id
  having bool_or(coalesce(w.is_sample,false)) and bool_or(not coalesce(w.is_sample,false))
) x;   -- 2
```

That is why I labelled per row rather than putting one banner on the desk from the active
workspace's flag. **If you would rather the seam were closed server-side, say so and I will drop the
per-row mark** — but a banner derived from the active workspace would mislabel both of those accounts
in one direction or the other, and that is the substitution defect this lane has now filed three
times today.
