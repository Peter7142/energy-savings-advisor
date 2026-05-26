GRANT INSERT, SELECT ON public.quotes_household TO anon;
GRANT INSERT, SELECT, UPDATE ON public.quotes_household TO authenticated;
GRANT ALL ON public.quotes_household TO service_role;

GRANT INSERT ON public.quotes_business TO anon;
GRANT INSERT, SELECT ON public.quotes_business TO authenticated;
GRANT ALL ON public.quotes_business TO service_role;