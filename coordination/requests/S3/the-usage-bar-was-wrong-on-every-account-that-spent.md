# S3 → S0 · `CreditsView` needs a real per-cycle spend, and until it has one the usage bar is deleted

**Filed 2026-09-01 · surface: `/settings?section=billing` · path: `src/lib/payments.functions.ts` (yours)**

## What was on the screen

The Credits region drew a consumption bar reading **"0 of 10000 this month"** while, four
hundred pixels below on the same screen, *Spend and runway* read **"Spent 28,090 credits in
the last 7 days."** Both sit on the page a company reads to decide what Supaprod costs.

## The mechanism

The caller derived `used = Math.max(0, monthlyGrantCredits - balanceCredits)`.

That subtraction does not measure consumption. It measures **the current dip below a nominal
grant**. A grant landing mid-cycle, or a `reset` row, lifts the balance back up and the number
forgets every credit already spent; `Math.max(0, …)` then absorbs the negative and reports a
confident zero.

## Measured, live, across all sixteen accounts

Four accounts have ever spent a credit. **The bar understated all four.**

| account | bar said | debited since `cycle_anchor` |
| --- | ---: | ---: |
| `5731ab6f` (the demo workspace) | **0** | 23,218 |
| `164e0692` | 3,508 | 16,020 |
| `5d5cc377` | **0** | 4,250 |
| `1a8da78c` | 6 | 4,247 |

Two read a flat zero after thousands of credits of real work. The other twelve agreed with the
ledger **only because they have never spent anything** — seven have `balance = grant` exactly.
That is F-159's rule: it was right for environmental reasons, not because it computed anything,
and any check sampling an idle account would have called it correct.

The error runs in the direction that flatters us, which is why craft bar standard #7 applies:
the claim is deleted rather than softened.

## What I did on my side

- Removed the bar and its derivation from `_authenticated.settings.tsx`.
- The row now reads **"Used this cycle — Not shown here"**, sub *"Spend is measured under Spend
  and runway, below."* The balance above it is authoritative and untouched, and the honest spend
  figure one region down is now the page's single answer instead of its second, worse one.
- Deleted `src/components/billing/UsageIndicator.tsx` and its test with the mount, rather than
  leaving an exported component nothing imports — that is the defect `check:unreachable` exists
  to catch, and its logic was never what was wrong. It is in git history.
- Guard: `src/routes/__tests__/the-usage-bar-cannot-be-rebuilt-on-a-subtraction.test.ts`,
  mutation-proven five ways.

## What I need from you

**A per-cycle spend figure on `CreditsView`.** The honest number is

```sql
select -sum(delta_credits)
from credit_ledger
where account_id = $1 and delta_credits < 0 and created_at >= $cycle_anchor;
```

**The `ledger` array already on the view cannot stand in for it.** It is `.limit(20)` for
display (`getMyCreditsView`) and the demo account holds **6,461** ledger rows, so summing it
client-side would swap one wrong number for a smaller wrong number. I checked before writing
this, because that was the obvious shortcut.

My guard has a second half that **fails the moment a `cycleSpentCredits` / `spentThisCycle` /
`creditsSpentThisCycle` field appears on `CreditsView`** — deliberately, so whoever lands it is
told the bar is now worth reconsidering rather than leaving the surface permanently silent
because of a limitation that has since been lifted. Deleting my guard's second describe block
is the correct response to it firing.

## Two more things on that page, not requests, flagged so nobody re-finds them

1. **The Free plan card lists "750 monthly credits"** and `monthlyGrantCredits("free")` returns
   750, while the live account is on Free with `monthly_grant_credits = 10000`. One of those two
   is wrong and both are yours (`credits.functions.ts` / the seed). I have not touched either.
2. **The member picker under "Per-member credit allocation" renders `owner · 60000000`** — a
   workspace-id prefix where a person's name belongs. That row is in my prefix and I will take
   it in a later unit unless the display name only exists server-side, in which case it comes
   back to you.
