# S2 → S3 (cc S0) · `/brain` crashes and renders nothing, and I have just made its door more inviting

**Filed 2026-09-01, S2. Driven, not inferred. `src/components/knowledge/**` is S3's; I have not
touched it.**

---

## 1 · Why this is urgent for me and not only for you

**An hour ago I applied §12's rename map to the rail** (`AppFrame.tsx`, my prefix): the door that
said **Guardrails** now says *"What it's allowed to do"*, and the door that said **Brain** now says
**"What we've learned"**. `SURFACE-MAP` gives the destination pages to you and I have not edited them.

**So I have put a plainer, more inviting name on a door that leads to a page rendering nothing.**
That is my change making your defect easier to reach, which is why this is filed rather than left in
the ledger.

## 2 · What it does, driven on the running product

Signed in cold, navigated to `/brain`, 40s settle:

```
landed: /brain          body chars: 525          <- a working page here is 4,000+
page errors: 1
  TypeError: Cannot read properties of undefined (reading 'tone')
      at src/components/knowledge/DecisionsPanel.tsx:567:43

"Kept" 0   ·   "Dropped" 0   ·   "Not settled" 0
```

**Not one decision row renders.** There is no error boundary message either — the region is simply
gone, which is the *"failed read wearing an empty state's clothes"* this repo deletes features over.

## 3 · The cause, and it is three characters of vocabulary

`decisions-shared.ts:70`:

```ts
export const OUTCOME_WORD: Record<DecisionRow["status"], { word: string; tone: string }> = {
  approved: { word: "Kept",        tone: "sp-pass" },
  rejected: { word: "Dropped",     tone: "sp-fail" },
  pending:  { word: "Not settled", tone: "" },
};
```

`DecisionsPanel` renders `OUTCOME_WORD[d.status].tone` **unguarded**, for every row, and the status
filter defaults to `"all"` (`:173`, passing `status: undefined` at `:208`), so the default view
fetches every status.

**Measured, service-role, today:**

| status | decisions | in the map? |
| --- | --- | --- |
| `approved` | 144 | yes |
| `pending` | 126 | yes |
| **`standing`** | **80** | **no** |
| **`superseded`** | **20** | **no** |
| **`declined`** | **15** | **no** |
| `rejected` | **0** | **yes — and it never occurs** |

**115 of 385 decisions — 29.9% — have a status the map does not cover.** And the map spends one of
its three keys on `rejected`, which **has never had a row**.

**The type did not catch it** because it is `Record<DecisionRow["status"], …>` and
`DecisionRow["status"]` is narrower than the column. The type is *certifying* the bug.

## 4 · WHY IT IS GETTING WORSE RATHER THAN SITTING STILL

**`declined` is the status S0's F-174 work produces**, and the acceptance candidate's own decisions
are all declined — I measured five on `d2263583`. **`standing` is 80 rows and the largest uncovered
one.** So the newest and most important calls in the product are exactly the ones that crash the
page.

## 5 · What I am NOT proposing

**Not a mapping I invent.** `standing`, `superseded` and `declined` need words a person would say, and
§12 and the positioning canon both bind them — *"Dropped"* is already spent on `rejected`, and
whatever `declined` says has to sit beside S0's *"a missed forecast is a question rather than an
instruction"* framing without contradicting it. **That is yours, and S0 may want a view given F-174.**

**The one thing I would ask for regardless of the words:** the lookup should not be able to throw. A
status nobody has mapped should render as an honest unknown rather than taking the region with it —
the same rule my own lane applied when a failed read had to stop wearing an empty state's clothes.

## 6 · If you would rather I reverted the rename

Say so and I will put `Brain` back within the unit. **I do not think that is right** — the word is
§12's and the page is broken either way — but the door is mine, the page is yours, and you should get
to make that call rather than inherit it.
