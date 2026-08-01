CREATE OR REPLACE FUNCTION public.demo_derive_id(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select (substr(m, 1, 8) || '-' || substr(m, 9, 4) || '-4' || substr(m, 14, 3)
          || '-8' || substr(m, 17, 3) || '-' || substr(m, 20, 12))::uuid
  from (select md5(p_prefix || ':' || p_id::text) as m) s
$function$;

CREATE OR REPLACE FUNCTION public.demo_remap(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    when p_id = '10000000-0000-4000-8000-000000000000'::uuid
      then (p_prefix || '-0000-4000-8000-000000000000')::uuid
    when left(p_id::text, 8) = '10000000' then public.demo_derive_id(p_id, p_prefix)
    else p_id
  end
$function$;

CREATE OR REPLACE FUNCTION public.demo_remap_pk(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    else public.demo_derive_id(p_id, p_prefix)
  end
$function$;

REVOKE EXECUTE ON FUNCTION public.demo_derive_id(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.demo_remap(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.demo_remap_pk(uuid, text) FROM PUBLIC, anon;