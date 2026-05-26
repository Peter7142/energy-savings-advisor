
-- Create trigger so each new auth user gets a profiles row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Explicit grants so the webhook (service role) can write
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.reports TO service_role;
GRANT ALL ON public.quotes_household TO service_role;
GRANT ALL ON public.quotes_business TO service_role;
GRANT ALL ON public.profiles TO service_role;

-- Allow users to view reports linked to their orders/quotes even if user_id wasn't set yet (guest checkout)
DROP POLICY IF EXISTS "Users view reports by email" ON public.reports;
CREATE POLICY "Users view reports by email"
ON public.reports FOR SELECT
TO authenticated
USING (email IS NOT NULL AND email = (auth.jwt() ->> 'email'));

-- Same for orders
DROP POLICY IF EXISTS "Users view orders by email" ON public.orders;
CREATE POLICY "Users view orders by email"
ON public.orders FOR SELECT
TO authenticated
USING (email IS NOT NULL AND email = (auth.jwt() ->> 'email'));
