# S2 → S0 (route to S3) · The `Brain` rail door opens a crashed surface, and 27% of the table causes it

**Filed 2026-08-31, S2. Found by running T1-S2's own acceptance** — *"sign in cold and try to predict
what each rail click does before making it"* — **which I had never actually run.** I had driven
individual doors and never the walk the ruling names. It found this on the third door.

**Not my prefix.** `src/components/knowledge/**` is S3's. **I have changed nothing**; this is the
report.

---

## The symptom

Click **Brain** in the rail. The route resolves, the row lights correctly, and the surface says
**"The record did not load."** That sentence is the error boundary doing its job — the page did not
fail to *read*, it failed to *render*.

Console, three times over:

```
TypeError: Cannot read properties of undefined (reading 'tone')
  at src/components/knowledge/DecisionsPanel.tsx  (in the decisions map)
  The above error occurred in the <DecisionsPanel> component.
Warning: Error in route match: /_authenticated/brain/brain
```

## The cause, and it is one unguarded lookup

`src/components/knowledge/DecisionsPanel.tsx:492`

```tsx
<span className={OUTCOME_WORD[d.status].tone || undefined}>
```

`src/components/knowledge/decisions-shared.ts:70`

```ts
export const OUTCOME_WORD: Record<DecisionRow["status"], { word: string; tone: string }> = {
  approved: { word: "Kept",        tone: "sp-pass" },
  rejected: { word: "Dropped",     tone: "sp-fail" },
  pending:  { word: "Not settled", tone: "" },
};
```

**Three keys. The table holds five statuses, and one of the three has never been written.**
Service-role through Lovable `query_database` on project `371dd588`:

```sql
SELECT coalesce(status,'(null)') AS status, count(*) FROM decisions GROUP BY 1 ORDER BY 2 DESC;
```

| status | rows | in `OUTCOME_WORD`? |
| --- | --- | --- |
| `approved` | 142 | yes |
| `pending` | 126 | yes |
| **`standing`** | **80** | **NO** |
| **`superseded`** | **20** | **NO** |
| **`declined`** | **1** | **NO** |
| `rejected` | **0** | yes — and never written |

**101 of 369 decisions — 27.4% — resolve to `undefined`, and `.tone` on `undefined` throws.** The
map's only miss-free key set is a world that does not exist: it handles `rejected`, which has never
happened, and not `standing`, which is 80 rows.

## Why no gate caught it, and this is the part worth keeping

**The map is typed `Record<DecisionRow["status"], …>`, so TypeScript is satisfied the moment the
three keys match the union. The union is wrong.** The type asserts three statuses; the table holds
five. `tsc` cannot see that, `bun test` did not exercise a `standing` row, and the error boundary
turned a crash into a calm sentence — so **the surface has been reporting "did not load" rather than
"I cannot draw this", and nothing upstream said anything at all.**

This is *measure what writes, not what looks right*, with a type in the way of noticing.

## What I would ask S3 for, and the order matters

1. **Guard the lookup** — a missing key must render the status plainly rather than throw. **One
   surface should never crash because a column grew a value.**
2. **Then widen the union and the map**, which is the real fix: `standing`, `superseded` and
   `declined` need words. **`standing` at 80 rows is the one a person will actually meet.**
3. **Consider dropping `rejected`** or confirming it is still reachable — a key with zero rows in the
   life of the table is either dead or the writer is broken, and both are worth knowing.

**Do 1 before 2.** A guard stops the crash today for every value the column may yet grow; widening
the union fixes today's five and leaves the next value to crash again.

## Two smaller things from the same walk, both S3's, neither urgent

- **The `Guardrails` door opens a page titled "Engine room · Supaprod".** The rail label was renamed
  2026-08-15 and the document title was not. **§12's own warning is that a word renamed in one place
  and left stale in another has made the problem worse**, and the tab is where a person keeps the
  page. One string.
- **`/engine-room`'s first heading is "Reading the engine."** That is a loading state and it is
  reasonable — noting it only because "the engine" is the vocabulary §12 retired, and it is the
  sentence a person sees while waiting.

## What the walk otherwise found, which is the good news

**Every rail door landed where its label promised and lit exactly one row.** Predictions written
before clicking: Work → the composer; Waiting for you → what needs my answer; Brain → what we have
learned; Threads → past conversations; Guardrails → what agents may do. **Five of five matched the
destination; `Brain` matched the route and the surface was broken.** No dark rail, no double-lit row,
no label that promised a place the click did not reach — which is F-144/145/146's acceptance met on
the running product.
