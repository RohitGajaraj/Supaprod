# S4-038 · Every public route swept, and the one 500 was my own instrument

> _S4, 2026-08-27, on `lane/proof`. One dev-server lifecycle: ports checked free, `DEVSERVER`
> declared in `NOW-S4.md`, dummy `.env` pointing at `http://localhost:54321` where nothing listens,
> thirteen routes fetched, **server killed, ports confirmed clear, dummy `.env` removed.**_

## The result, and most of it is good news

Thirteen public routes, fetched server-side with **no real credentials of any kind**:

| Route | | Route | |
| --- | --- | --- | --- |
| `/` | 200 · 191KB | `/security` | 200 · 37KB |
| `/pricing` | 200 · 87KB | `/privacy` | 200 · 38KB |
| `/signup` | 200 · 26KB | `/investors` | 200 · 15KB |
| `/login` | 200 · 26KB | `/brief` | 200 · 15KB |
| `/demo` | 200 · 35KB | `/faq` | 200 · 41KB |
| `/film` | 200 · 35KB | `/product` | 200 · 49KB |
| | | **`/proof`** | **500 · 5.5KB** |

**Twelve of thirteen render fully with a database that does not exist.** The stranger's whole path
— land, read the pitch, check pricing, sign up — survives a dead backend. That is a real property and
worth recording as one, because nothing else in this repo says whether the marketing surface is
coupled to the database.

## The 500 was mine, and it is not a finding

**I am not filing `/proof` as broken.** The control tells the story: every route that returned 200
contains **zero** Supabase references, and the only route that reads the database is the only one
that failed. `proof.tsx:23-29`:

```ts
loader: async () => {
  const [calibration, decisions] = await Promise.all([
    getPublicCalibration(),
    listPublicDecisions(),
  ]);
  return { calibration, decisions };
},
```

My dummy env points those at a dead port. **A known-good control failing as badly as the suspect case
is the signal to suspect the instrument**, and here the pattern is cleaner than that: only the
instrument-dependent page failed. Reporting *"the public track-record page is down"* would have been
the dramatic story and it would have been false.

## What IS real, and it is narrower than the 500 made it look

Chasing whether a production read failure could do the same thing, the two computations behind that
page turn out to differ:

**`computePredictionHitRate` (`proof-surface.functions.ts:200-224`) is fully guarded**, and guarded
well:

```ts
try {
  const { data, error } = await db…
  if (error) return { rate: null, hits: 0, total: 0, tableReady: false };
  …
} catch {
  return { rate: null, hits: 0, total: 0, tableReady: false };
}
```

**Credit where it is due, and I have spent all day on the opposite pattern:** it returns
`rate: null` with `tableReady: false`, **not `rate: 0`**. That is F-86's rule — *a metric that cannot
be read is not zero* — applied correctly, in a file nobody wrote a finding about.

**`computeSupersessionsCaught` (`:170-189`) is half-guarded.** It checks the query error:

```ts
const { data, error } = await supabaseAdmin…
if (error) return { total: 0, last30d: 0, trend: "flat" };
```

but has **no `try`/`catch`**, so a *thrown* failure rather than a returned one propagates. F-100
records that `supabaseAdmin`'s factory throws outright when its variable is absent, so that path is
not hypothetical in a misconfigured deploy.

And nothing above it catches: `getPublicCalibration` has no `try`, and `proof.tsx` has **no
`errorComponent`**.

**So the narrow, honest finding is:** a *thrown* failure anywhere under that loader takes a public
marketing page to a raw 500, rather than to the sparse state the route's own header says it was
designed for:

> *"Honest when sparse: a zero-decision or zero-outcome state is a real message, never a placeholder
> made to look like data."*

That is a designed **empty** state with no designed **failed** state, which is R-20's sad-path
requirement (empty, loading, failed, held, permission-denied) missing one entry, and frontier
standard #3 (*"No raw error ever reaches a person"*) on a page a stranger can reach.

**The fix is four lines and its own sibling is the template**: give `computeSupersessionsCaught` the
same `try`/`catch` that `computePredictionHitRate` already has, twenty lines away in the same file.

## Verdict

- **Public route sweep: PASS, 12 of 13.** The marketing surface is not coupled to the database, and
  that is good news nobody had measured.
- **`/proof` 500: NOT A FINDING.** My dummy env. Recorded so nobody re-investigates it, and so the
  method is on the record.
- **`computeSupersessionsCaught` missing its `try`/`catch`: CONFIRMED**, narrow, with the fix and the
  in-file template named. `src/lib/**` is S0's; I have not touched it.
- **`computePredictionHitRate`: correct, and credited.**

**Still owed on standing question 2:** the signed-in sixty seconds, which needs real credentials, and
any visual or timing judgement, which needs a browser this session does not have.
