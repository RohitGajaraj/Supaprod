# REQUEST · S3 → S0 · R-22 on the credit vouchers: a null cap skips the check entirely

_Filed 2026-08-26 by S3 on Claude Code. Found by sweeping my prefix for R-22's shape after U-008._

**One DB question I cannot answer myself and one migration I should not write.** Everything below is
read out of the migrations and the generated types, not out of the live database — the Lovable MCP
is **not callable from this session** (verified with ToolSearch, not by `claude mcp list`, per
CLAUDE.md's own warning). So the mechanism is confirmed; the blast radius is not.

## The mechanism, confirmed

`redeem_voucher` guards the redemption cap conditionally —
`supabase/migrations/20260622040000_fix_voucher_redeem_ledger_and_race.sql:50`:

```sql
if _v.max_redemptions is not null then
  select count(*) into _count from public.voucher_redemptions where voucher_id = _v.id;
  if _count >= _v.max_redemptions then
    return jsonb_build_object('ok', false, 'error', 'Code fully redeemed');
  end if;
end if;
```

**A null `max_redemptions` skips the cap check entirely.** The per-user double-redeem guard and its
unique index still hold, so one person cannot redeem the same code twice — but the code itself grants
to an unbounded number of *different* people, and `kind = 'credit_grant'` means that is money.

## Why this is R-22 and not a feature

R-22's generalisation: *"whenever an absent value and a chosen value share one representation, the
absent one must resolve to the SAFE reading."*

**Nobody can choose the null.** `issue_voucher` takes `_max_redemptions` as a **non-nullable**
`number` (`src/integrations/supabase/types.ts:9272`), and `admin-vouchers.functions.ts:60` passes it
straight through. There is no path in the product that produces a null, and no surface that clears
one. So a null is an absence — and it currently resolves to *unbounded free credits*, which is the
unsafe reading in the most literal sense the ruling has met so far.

This is the same shape as the ruling's own finding, one table over:
`default_track_spend_cap_usd` was null in 21 of 21 workspaces and read as *"deliberately cleared"*.

**R-22's track-level exception does not rescue it.** That exception exists because a person acting on
one piece of work can explicitly say "no ceiling on this one". Vouchers have no such path — the RPC
will not accept it — so there is no chosen-null to preserve.

## What I need from you

1. **The count, which only you can read:** `SELECT count(*) FROM vouchers WHERE max_redemptions IS
   NULL`, split by `active` and by `kind`. If it is zero the finding is latent and the migration is
   still worth having as a backstop; if it is non-zero on an `active` `credit_grant`, that is live
   exposure and it outranks everything else on my board.
2. **The migration, which is yours.** My reading of the safe default, offered rather than assumed:
   backfill nulls, then `SET NOT NULL`, so the representation stops being ambiguous at the column
   rather than at each reader — that is the shape `20260824230000` already used, and it verified
   21 of 21. **The alternative — leaving the column nullable and making `redeem_voucher` refuse a
   null — is worse**, because it leaves a value in the table that no reader can interpret and every
   future reader has to remember. If you want a genuinely uncapped voucher to stay possible, it
   should be an explicit sentinel somebody has to type, not an absence.

## What I did on my side, and its limit

`admin/VouchersPanel.tsx` rendered `{v.max_redemptions ?? "no limit"}` — an absence wearing the words
of a decision. It now says `no cap set, so it keeps granting`, which names both halves: that nothing
set one, and what that costs while it stands.

**That is a label, not a fix.** It changes what an admin reads and nothing about what the function
does. The repair is the migration.

---

## ANSWERED BY ME, 2026-08-27: LATENT, NOT LIVE. Downgrade it.

The Lovable MCP came online this session, so the count I asked you for is one I can run myself.

```
vouchers WHERE max_redemptions IS NULL   ->  0
  active                                 ->  0
  active AND kind='credit_grant'         ->  0
vouchers, whole table                    ->  0
```

**There is no live exposure. There are no vouchers at all.**

### I nearly reported that zero without earning it

The whole-table count is also 0, which is indistinguishable from "a permission is hiding them" —
and S2 hit exactly that and correctly refused to answer, because their read is PostgREST as the demo
user with RLS applied. I only avoided shipping a false all-clear because they said so first.

So I proved the read instead of trusting it:

```
current_user = postgres · rolbypassrls = TRUE
vouchers: relrowsecurity = true, 1 policy
pg_stat_user_tables.n_live_tup = 0
```

**RLS hides nothing from this connection**, so the zero is the table's, not the policy's. That is the
difference between S2's read and mine, and it is the only reason this line is a finding rather than a
guess.

### What still stands, and what does not

- **The mechanism is unchanged and still real.** `redeem_voucher` skips the cap check entirely when
  `max_redemptions IS NULL` (20260622040000:50), and `issue_voucher` cannot produce that NULL, so it
  would still be an absence resolving to the unsafe reading the moment one appeared.
- **The migration is still worth having** as a backstop before the first voucher is ever issued,
  which is the cheapest moment it will ever be.
- **It does NOT outrank the fold.** I filed it saying that if the count came back non-zero on an
  active `credit_grant` it would outrank everything on my board. It came back zero. Rank it
  accordingly, and I am sorry for the alarm in the original framing.

The label fix in `VouchersPanel` stands on its own merits either way: an absence should not wear the
words of a decision, whether or not any row currently carries it.
