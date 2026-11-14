CREATE TABLE public.quote_analyses (
  quote_id uuid PRIMARY KEY REFERENCES public.quotes_household(id) ON DELETE CASCADE,
  verdict text NOT NULL,
  current_annual_cost_eur numeric,
  best_annual_cost_eur numeric,
  overpay_eur numeric,
  summary text NOT NULL,
  instructions_md text,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  tariffs_compared int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.quote_analyses TO service_role;
ALTER TABLE public.quote_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view analyses" ON public.quote_analyses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.scan_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'active',
  pause_reason text,
  locked_until timestamptz,
  last_run_at timestamptz,
  last_result jsonb
);
GRANT ALL ON public.scan_state TO service_role;
GRANT SELECT ON public.scan_state TO authenticated;
ALTER TABLE public.scan_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view scan state" ON public.scan_state FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.scan_state (id) VALUES (1);

INSERT INTO public.suppliers (name, slug, website_url, is_active) VALUES
('ZSE Energia','zse','https://www.zse.sk',true),
('Stredoslovenská energetika (SSE)','sse','https://www.sse.sk',true),
('Východoslovenská energetika (VSE)','vse','https://www.vse.sk',true),
('SPP','spp','https://www.spp.sk',true),
('MAGNA ENERGIA','magna','https://www.magnaenergia.sk',true),
('Slovakia Energy','slovakia-energy','https://www.slovakiaenergy.sk',true),
('ČEZ Slovensko','cez','https://www.cez.sk',true),
('Energie2','energie2','https://www.energie2.sk',true),
('MET Slovakia','met','https://www.met.sk',true),
('Elektrina od Pow-en','pow-en','https://www.pow-en.sk',true),
('ENERGIE PRE VÁS','energie-pre-vas','https://www.energieprevas.sk',true),
('Comfort Energy','comfort-energy','https://www.comfortenergy.sk',true)
ON CONFLICT (slug) DO NOTHING;