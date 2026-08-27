# S4-119 · The public evidence page has no public evidence, and the swallow beneath it is undetectable

> _S4, 2026-08-27, measured live. `/proof` is the public Trust Ledger — the page whose job is to show
> that the product does what it claims._

## What it can show

```sql
SELECT count(*) FROM decisions WHERE is_public = true AND share_slug IS NOT NULL;  -- 28
```

**All 28 are on sample workspaces. Zero on a real one.**

```sql
SELECT w.is_sample, count(*), max(d.created_at)
FROM decisions d LEFT JOIN workspaces w ON w.id = d.workspace_id
WHERE d.is_public AND d.share_slug IS NOT NULL GROUP BY 1;
-- true | 28 | 2026-06-23 15:47:26
```

And `decisions-share.functions.ts:277` filters them out, correctly:

```ts
.filter((r) => r.is_public && r.share_slug && !sampleWorkspaceIds.has(r.workspace_id ?? ""))
```

**So `/proof` renders zero decisions.** Not because of a bug — because the filter is honest and every
public decision in the product is demo data. **Nothing has been made public since 2026-06-23**, over
two months ago.

## The page was built for this and says so

`proof.tsx:6`:

> *"Honest when sparse: a zero-decision or zero-outcome state is a real message, never a placeholder
> made to look like data."*

**That is the right design and it is being honoured.** The finding is not that the page lies. It is
that **the product's public evidence page has, correctly, nothing to prove with.**

## Which makes the swallow underneath it undetectable

`S4-102` found `decisions-share.functions.ts:314-318` returning `[]` on error and in a bare `catch`,
with no logging and no marker — so *"the database did not answer"* and *"there are no public
decisions"* render identically.

**That defect is normally caught by someone noticing the page went empty. Here it cannot be, because
empty is the true state.** A silent read failure on this page would look exactly like every other
day, indefinitely.

Two individually reasonable things — an honest empty state and a defensive catch — combine into a
failure nobody can see. That is the same shape S3 described on their own work tonight: *"two
individually-correct changes, and together they put the secret back."*

## What this is really about

The founder's test is whether this solves a real pain or is another wrapper. **The page built to
answer that question in public is empty**, and the reason is not a rendering bug: it is that the loop
has not yet produced a public decision on a real workspace. `S4-095` says why — 37 of 55 real tracks
never leave the first station.

**This is a consequence, not a separate defect**, and it is the most externally visible one.

## The other half, checked, and it is honest

I named `getPublicCalibration` as unchecked. Checking it closed the question in the page's favour.

`computePredictionHitRate` reads **`insights`**, not the forecasts on decisions, filtering
`resolution IS NOT NULL`, excluding `inconclusive`, and excluding sample workspaces:

| | |
| --- | --- |
| insights | 144 |
| resolved | 36 |
| pass the filter | 28 |
| **on a REAL workspace** | **4** |

**So the public hit rate is computed from four data points.** I expected to find a bare percentage
published on that, which would have been a serious claim on a meaningless sample.

**It is not.** `proof.tsx:152` renders:

> *"Supaprod called {hits} of the last {total} calls right."*
> *"That is {rate}%, including the misses. We publish this number because a competitor claiming 100%
> is a competitor not tracking outcomes at all."*

**The denominator is on the screen**, so a visitor reading it sees "of the last 4". And
`hasData = tableReady && total > 0 && rate !== null` gates the whole block, so it does not render a
rate with nothing behind it.

**Checked and clean.** The number is small and the page says how small, which is the whole standard.

### The second public number is also 4, and also stated plainly

`supersessionsCaught` reads `artifact_lineage` for the four supersession relations, over 60 days,
excluding sample workspaces:

| relation | rows | **on a real workspace, last 60d** |
| --- | --- | --- |
| `supersedes` | 29 | **3** |
| `contradicts` | 15 | **1** |

**Four.** And `proof.tsx:197` renders *"{n} decision{s} caught and corrected by a later call"*, which
with the value 4 reads "4 decisions caught and corrected by a later call" and pluralises correctly.

**So both of `/proof`'s public numbers are 4, and both are stated at their true size.** The page is
honest twice over. What it does not have is anything to be honest ABOUT, and that is the finding at
the top of this file rather than a fault in the page.

## What I am not claiming

- **I did not open `/proof` on a working backend.** With a dead one it renders a route-level error
  (`S4-102`), so the empty-but-honest state is inferred from the data and the filter rather than
  photographed.
- **28 public rows on sample workspaces is not wrong.** Demo data being shareable is reasonable; the
  filter exists precisely so it never reaches this page.
