
-- Fix search_path on existing functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Restrict EXECUTE on SECURITY DEFINER functions (callable only by triggers/internal)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
-- has_role needs to be callable by authenticated for RLS policies that authenticated users hit
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

COMMENT ON POLICY "Anyone can submit household quote" ON public.quotes_household IS
'Intentionally open: this is a public intake form. No sensitive data exposed, INSERT only.';
COMMENT ON POLICY "Anyone can submit business quote" ON public.quotes_business IS
'Intentionally open: this is a public intake form. No sensitive data exposed, INSERT only.';
