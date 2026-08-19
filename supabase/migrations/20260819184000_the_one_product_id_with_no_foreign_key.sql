-- 20260819184000_the_one_product_id_with_no_foreign_key.sql
--
-- Claude lane, 2026-08-19.
--
-- THE ONE `product_id` WITH NO FOREIGN KEY.
--
-- WHAT IS BROKEN. Seventeen tables now carry `product_id` referencing
-- `projects`. Sixteen of them declare the reference. `credit_ledger` does not:
--
--   select conrelid::regclass, confrelid::regclass from pg_constraint c
--     join unnest(c.conkey) k(attnum) on true
--     join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum
--    where c.contype='f' and a.attname='product_id';
--
-- `credit_ledger` does not appear. The column was declared bare at
-- 20260619212731_...sql:114 -- `product_id uuid,` -- with two indexes built on
-- it on the next lines but no reference, while every sibling column added since
-- has carried one.
--
-- WHY IT HAS NOT BITTEN. The column is empty:
--
--   select count(*), count(product_id) from credit_ledger;   -- 13890, 0
--
-- Zero of 13,890. A constraint cannot be violated by a value nobody writes, so
-- the gap has been free. It stops being free the moment the stamping work lands,
-- which is the next thing in this lane: `debit_account_credits` and
-- `refund_account_credits` both already take a `_product_id` parameter and both
-- already write it, and `runtime.server.ts:1420` passes `opts.productId ?? null`
-- from 72 call sites of which exactly one supplies a value
-- (`cluster.server.ts:185`). When those call sites start passing real ids, an
-- unconstrained column is how a spend row ends up attributed to a product that
-- was deleted last week.
--
-- SO THIS IS THE CHEAPEST POSSIBLE MOMENT. Adding the reference to an empty
-- column validates instantly and locks nothing meaningfully, where adding it
-- after 13,890 rows carry values means a full scan against a table that is
-- written on every model call.
--
-- WHY `ON DELETE SET NULL` AND NOT CASCADE. A credit ledger row is money. It is
-- an accounting record and it must survive the deletion of the thing it was
-- spent on -- CASCADE here would silently destroy spend history when a product
-- is removed, which is the one thing a ledger may never do. Blanking the
-- attribution keeps the row and loses only the label. This is the same choice
-- `learnings.product_id` made in 20260819181000 and for a weaker reason; here it
-- is not a preference.
--
-- NOT VALIDATED SEPARATELY. Unlike `learnings.workspace_id`, there are no
-- violating rows to work around, so the constraint goes on valid immediately.
--
-- SHAPE AND SECURITY. RLS on `credit_ledger` is a single read policy and no
-- write policy at all; every write is inside a SECURITY DEFINER function. A
-- foreign key does not interact with either. The two existing indexes
-- (`credit_ledger_product_idx`, `credit_ledger_account_product_created_idx`)
-- already cover the lookups a reference implies, so none is added.

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.credit_ledger'::regclass
       and conname  = 'credit_ledger_product_id_fkey'
  ) then
    alter table public.credit_ledger
      add constraint credit_ledger_product_id_fkey
      foreign key (product_id) references public.projects(id) on delete set null;
  end if;
end $$;

comment on column public.credit_ledger.product_id is
  'The product this spend is attributed to. A product is a row in `projects`. '
  'NULL means account-level, which is correct for grants, top-ups, resets and '
  'vouchers -- a monthly grant is not attributable to one product. It is NOT '
  'correct for a debit, and as of 2026-08-19 every one of the 13,890 rows is '
  'NULL because 1 of 72 callModel call sites passes a productId. ON DELETE SET '
  'NULL, never CASCADE: a ledger row is an accounting record and must outlive '
  'the product it was spent on.';

do $$
declare n_fk bigint;
begin
  select count(*) into n_fk from pg_constraint
   where conrelid = 'public.credit_ledger'::regclass
     and conname  = 'credit_ledger_product_id_fkey'
     and contype  = 'f'
     and convalidated;
  if n_fk <> 1 then
    raise exception 'credit_ledger_product_id_fkey missing or unvalidated';
  end if;
end $$;
