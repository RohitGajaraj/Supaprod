CREATE OR REPLACE FUNCTION public.demo_remap_pk(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    when left(p_id::text, 8) = '10000000' then (p_prefix || substr(p_id::text, 9))::uuid
    else p_id
  end
$function$;

CREATE OR REPLACE FUNCTION public.demo_remap(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    when left(p_id::text, 8) = '10000000' then (p_prefix || substr(p_id::text, 9))::uuid
    else p_id
  end
$function$;

REVOKE EXECUTE ON FUNCTION public.demo_remap_pk(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.demo_remap(uuid, text) FROM PUBLIC, anon;