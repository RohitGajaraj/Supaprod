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

## What I am not claiming

- **I did not check `getPublicCalibration`**, the page's other half. The decisions list is what I
  measured.
- **I did not open `/proof` on a working backend.** With a dead one it renders a route-level error
  (`S4-102`), so the empty-but-honest state is inferred from the data and the filter rather than
  photographed.
- **28 public rows on sample workspaces is not wrong.** Demo data being shareable is reasonable; the
  filter exists precisely so it never reaches this page.
