-- THIRTEEN OF SIXTEEN PEOPLE WERE TOLD THIS WORKSPACE HAD NO ADMIN.
--
-- WHAT THEY SAW. Settings rendered a block reading "This workspace has no admin
-- yet · Claiming it puts members, roles, the audit trail and billing under one
-- person", with a Claim admin button. Pressing it took them to /admin, where a
-- second button called `admin_bootstrap_self_as_admin()` and the RPC refused
-- them with a raw Postgres error.
--
-- WHY IT SAID THAT. `amIAdmin` (src/lib/pricing.functions.ts) counts admins
-- through the CALLER'S OWN client, and the only select policy on user_roles is
--
--     using (user_id = auth.uid())
--
-- so a non-admin can see exactly one row: their own, which is not an admin row.
-- The count therefore comes back 0 for every non-admin, forever, and
-- `anyAdminExists` is false no matter how many admins exist. Measured on the
-- live database at the time of writing: 3 platform admins, 16 users. Thirteen
-- people were being shown an invitation to take over a workspace that already
-- had three owners, and a button that could only fail.
--
-- WHAT IT WAS NOT, because the first reading of this was wrong and the
-- correction matters. This is not a privilege escalation. The RPC is SECURITY
-- DEFINER, so it sees past RLS and genuinely refuses once any admin exists; it
-- is the standard one-time bootstrap and it is doing its job. The defect is
-- entirely that the UI asks a question it cannot answer and believes the answer.
--
-- THE FIX IS A BOOLEAN, AND DELIBERATELY NOTHING MORE. A SECURITY DEFINER
-- function that answers only "does the platform have an admin". It leaks no
-- identity, no count and no email: a caller learns one bit, which is precisely
-- the bit the UI needed and could not get. Widening the RLS policy so members
-- could count admin rows would have answered the same question by exposing who
-- the admins are, which is a worse trade for the same sentence.

create or replace function public.platform_has_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.user_roles where role = 'admin');
$$;

comment on function public.platform_has_admin() is
  'True when at least one platform admin exists. SECURITY DEFINER so a member '
  'can learn the fact without being able to read who the admins are: the only '
  'select policy on user_roles is user_id = auth.uid(), which made every '
  'non-admin count zero and made Settings tell them the workspace was '
  'unclaimed. Returns one boolean and nothing else, on purpose.';

-- `authenticated` only. An anonymous visitor has no surface that needs it, and
-- whether a platform has an operator is not a fact to hand to a stranger.
revoke all on function public.platform_has_admin() from public;
grant execute on function public.platform_has_admin() to authenticated;
