-- THE LAST STATION HAD NOTHING WAITING ON IT, IN ANY WORKSPACE.
--
-- WHAT WAS MEASURED, 2026-08-06. Across the entire database: 7 shipped specs,
-- and all 7 already settled. `listPendingOutcomes` builds the Learn desk from
-- specs that are shipped AND unsettled, so the desk was empty for every user and
-- every demo workspace. The settle Gate -- the verdict form, the agent's draft,
-- the overturn path, and the "Too early to tell" exit added in 20260806100000 --
-- could not be seen working by anyone, because nothing was ever on it.
--
-- That is the last station of the loop and it carries the product's central
-- claim: a settled outcome re-ranks the next call. Demonstrating that claim with
-- an empty desk demonstrates it with no evidence behind it.
--
-- WHAT THIS DOES. In the seven seeded demo workspaces only, marks two specs
-- shipped and leaves them unsettled, so each opens Learn with two real bets
-- waiting for a verdict.
--
-- NOTHING IS INVENTED. These are existing seeded specs, already `approved` and
-- already carrying an outcome contract, so the Gate has a success metric to
-- judge against. The only change is a ship date and no outcome.
--
-- WHICH SPECS, AND WHY NOT THE OBVIOUS ONES. The first version of this shipped
-- `...011` (Simplify checkout) and `...012` (A daily notification digest),
-- because those are also linked to an opportunity and a verdict on them would
-- move a real bet's score -- which demos better. It was wrong. Every one of the
-- fourteen ALREADY HAS a learning row against it (two for `...011`, one for
-- `...012`, seeded 2026-07-19). The desk would have asked for a verdict on bets
-- the record already showed as settled, in front of an investor, which is a
-- worse thing to show than a strong-looking one.
--
-- `...002` and `...031` carry no learning of their own. They are not linked to
-- an opportunity, so the Gate will say no priority moves -- a state it already
-- handles and states honestly. Coherence beats the richer-looking option.
--
-- `status = 'shipped'`, NOT `'approved'`. Both code paths that stamp
-- `shipped_at` (deployments.functions.ts:417, outcome.functions.ts:180) also set
-- the status, `'shipped'` is in the accepted enum (discovery.functions.ts:1996),
-- and deployments.functions.ts:407 guards on it. The pre-existing shipped rows
-- carry `approved`, which is seed sloppiness rather than a state the product
-- produces.
--
-- DATES ARE STAGGERED so the desk reads like a real desk: one shipped nearly
-- four weeks ago, one under a fortnight -- which is also the range in which "too
-- early to tell" is a genuinely reasonable answer for the younger one.
--
-- TO REVERSE: set status='approved', shipped_at=null, outcome_check_by=null,
-- outcome_deferred_count=0 on the matched ids. No outcome, learning or
-- opportunity row is written by any of this.

-- Undo the first, wrong selection. A no-op on a database that never ran it.
update public.prds
set status = 'approved',
    shipped_at = null,
    outcome_check_by = null,
    outcome_deferred_at = null,
    outcome_deferred_count = 0
where workspace_id::text like '_0000000-0000-4000-8000-000000000000'
  and (id::text like '%-0001-4000-8000-000000000011' or id::text like '%-0001-4000-8000-000000000012')
  and status = 'shipped'
  and outcome is null;

update public.prds
set status = 'shipped',
    shipped_at = now() - interval '26 days',
    updated_at = now()
where workspace_id::text like '_0000000-0000-4000-8000-000000000000'
  and id::text like '%-0001-4000-8000-000000000002'
  and status = 'approved'
  and contract is not null
  and shipped_at is null;

update public.prds
set status = 'shipped',
    shipped_at = now() - interval '12 days',
    updated_at = now()
where workspace_id::text like '_0000000-0000-4000-8000-000000000000'
  and id::text like '%-0001-4000-8000-000000000031'
  and status = 'approved'
  and contract is not null
  and shipped_at is null;
