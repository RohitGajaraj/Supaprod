# Lovable's security scanner, and the two criticals that block publishing

> _Created: 2026-08-22_

**Publishing is refused while the scan holds an unresolved critical.** On 2026-08-22 `deploy_project`
returned: *"Publishing was refused because the latest security scan found 2 unresolved critical security
findings."* That is a hard block on shipping, so what the two findings actually are matters.

**Both are false positives. Verified against production, not reasoned about.** The correct action is
**"Ignore issue"** in the Lovable Security view, with this file as the reason. Do not write a migration for
either; one was written on 2026-08-22, found redundant, and removed before it landed.

## The limitation that produces them

**The scanner reads RLS policies statically. It cannot see a `BEFORE UPDATE` trigger.** Every rule below is
enforced by a trigger, so the policy genuinely does permit the full-row update the scanner describes, and
the write genuinely does not happen. Both halves are true at once, which is why the finding reads
convincingly.

## Finding 1 — "Account/workspace owners can upgrade their own billing plan without paying"

**Already enforced**, by `protect_account_billing_columns()` and `protect_workspace_billing_columns()`, both
`BEFORE INSERT OR UPDATE`. When `auth.role()` is not `service_role` they **silently revert** the protected
columns to their old values:

```sql
NEW.plan_tier := OLD.plan_tier;
NEW.stripe_customer_id := OLD.stripe_customer_id;
NEW.stripe_subscription_id := OLD.stripe_subscription_id;
NEW.plan_updated_at := OLD.plan_updated_at;
```

**Measured, impersonating the row's own owner over PostgREST:**

| Attack | before | after |
| --- | --- | --- |
| `UPDATE accounts SET plan_tier='enterprise'` | `free` | **`free`** |
| `UPDATE workspaces SET plan_tier='enterprise'` | `team` | **`team`** |

**A trap this created while checking it, worth carrying.** The first test asked whether the `UPDATE` threw.
It did not — a silent revert succeeds — so the run reported *"ALLOWED, hole is real"* for both tables and was
wrong. **Assert on the value, never on the absence of an exception.** The same mistake is recorded elsewhere
in this repo as *measure what writes, not what looks right*.

**Why silent revert rather than `RAISE` is the right call here, and should not be changed:** clients commonly
send a whole row on update. Raising would fail every one of those, including legitimate edits to unrelated
columns. Reverting lets the legitimate part of the write land and drops only the protected part.

## Finding 2 — "Users can remove their own account suspension and modify protected profile fields"

**Already enforced**, by `guard_profile_privileged_columns()`, `BEFORE UPDATE`. It raises rather than
reverting. Measured, impersonating the profile's own user:

```
UPDATE profiles SET suspended = true  ->  ERROR: Only an admin can change account suspension
```

The legitimate path is the `admin_set_user_suspended(_uid, _suspend, _reason)` RPC, which is
`SECURITY DEFINER` and runs with the admin's own `auth.uid()`, so `has_role(..., 'admin')` clears the guard.

## The warnings are a different matter and are NOT blocking

Publishing is blocked only by criticals. Three warnings stood on 2026-08-22 and each deserves its own
judgement rather than a blanket ignore:

| Warning | Note |
| --- | --- |
| **Account owners can raise their own spending caps unrestricted** | **REAL, and measured. Not a false positive.** See below. |
| Function Search Path Mutable | Supabase linter `0011`. Functions without `SET search_path`. |
| Materialized View in API | Supabase linter `0016`. A materialized view reachable over the Data API. |

## The one that is REAL: an account owner can delete their own spend ceiling

**Measured 2026-08-22, the same way, asserting on the value.** Impersonating the account's own owner:

| Attack | Result |
| --- | --- |
| `UPDATE credit_caps SET cap_credits = 999999999` | **5,000 → 999,999,999.** Raised, and it held |
| `DELETE FROM credit_caps WHERE id = ...` | **Succeeded.** The ceiling can be removed entirely |

The policy is `account owner writes caps [ALL]` and **the only trigger on `credit_caps` is
`set_updated_at`** — a timestamp helper, not a guard. So unlike `accounts` and `workspaces`, nothing reverts
the write. The scanner is right and it is filed as a Warning rather than a Critical, which understates it.

**Why this one matters more here than it would elsewhere.** This product had a real runaway-spend incident
close by: roughly $75/month of the spine driving demo fixtures, closed 2026-08-21. A cap is the control that
bounds that class of failure, and today the person who benefits from removing it is the person allowed to
remove it.

**It is not fixed here, deliberately.** The fix is a product decision rather than a patch: whether a cap may
be raised at all without an admin, whether there is an absolute ceiling per plan tier, and whether deleting
the row should be refused outright. Guessing a number and enforcing it would be inventing policy. The shape
of the fix, once the numbers are chosen, is the same trigger pattern `protect_account_billing_columns`
already uses.

## The seven ignored findings, and the one whose paperwork is broken

All seven carry a recorded ignore reason and all seven reasons are sound. Six need nothing. The two realtime
ones need their tracking repaired, because **an accepted risk with a dead pointer is a forgotten risk.**

**The ignore reason cites `docs/feature-backlog.md`. That file does not exist.** The real row is
[`../../planning/archive/feature-backlog.md`](../../planning/archive/feature-backlog.md) line 1017, as
`F-SEC-REALTIME-RLS`, still marked `☐ (deferred by operator)` — and it is in an **archive** directory, so
nothing live owns it and it appears on no board.

**It also disagrees with itself.** `planning/archive/build-log.md:1817` records the same F-ID as *closed*, by
dropping `public.agent_runs` from the `supabase_realtime` publication. The backlog row still reads deferred.

**Live state, measured 2026-08-22, which settles it:**

| Check | Value |
| --- | --- |
| `realtime.messages` RLS enabled | **true** |
| Policies on `realtime.messages` | **0** |
| Tables in the `supabase_realtime` publication | **`agent_approvals`, and nothing else** |

So the drop did happen and the risk is **narrower than the ignore reason describes** — one table broadcasts,
not every table. It is not zero: `agent_approvals` is workspace-scoped, and a public channel subscription is
not membership-checked. The reason's core argument still holds, that payloads carry ids and event types
while the actual row reads go through RLS-protected REST.

**What this needs is not a fix, it is an owner.** Either move `F-SEC-REALTIME-RLS` out of `archive/` onto the
board, or correct the ignore reason to point at where it really lives and say the blast radius is one table.

## How to re-verify any of this in one query

Impersonate the row's own owner and assert on the value:

```sql
DO $$
DECLARE a_id uuid; a_owner uuid; before_t text; after_t text;
BEGIN
  SELECT id, owner_id, plan_tier INTO a_id, a_owner, before_t
    FROM public.accounts WHERE owner_id IS NOT NULL LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', a_owner, 'role','authenticated')::text, true);
  UPDATE public.accounts SET plan_tier='enterprise' WHERE id=a_id;
  SELECT plan_tier INTO after_t FROM public.accounts WHERE id=a_id;
  PERFORM set_config('request.jwt.claims','',true);
  RAISE EXCEPTION 'before=% after=%', before_t, after_t;   -- aborts, nothing persists
END $$;
```

`RAISE EXCEPTION` at the end is deliberate: it reports the result and rolls the transaction back, so a probe
against production leaves nothing behind.
