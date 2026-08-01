CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.suspended IS DISTINCT FROM OLD.suspended THEN
    IF current_setting('role', true) = 'service_role'
       OR auth.role() = 'service_role'
       OR public.has_role(auth.uid(), 'admin') THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Only an admin can change account suspension';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER guard_profile_privileged_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

CREATE OR REPLACE FUNCTION public.guard_trust_graduation_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.decided_by IS DISTINCT FROM OLD.decided_by
     OR NEW.decided_at IS DISTINCT FROM OLD.decided_at THEN
    IF current_setting('role', true) = 'service_role'
       OR auth.role() = 'service_role'
       OR public.has_role(auth.uid(), 'admin') THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Only an admin can decide a trust graduation request';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_trust_graduation_decision ON public.trust_graduation_proposals;
CREATE TRIGGER guard_trust_graduation_decision
BEFORE UPDATE ON public.trust_graduation_proposals
FOR EACH ROW EXECUTE FUNCTION public.guard_trust_graduation_decision();