
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.energy_type AS ENUM ('electricity', 'gas');
CREATE TYPE public.customer_segment AS ENUM ('household', 'business');
CREATE TYPE public.tariff_status AS ENUM ('pending', 'validated', 'rejected', 'needs_review');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.distribution_area AS ENUM ('ZSD', 'SSD', 'VSD');

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= AUTO PROFILE TRIGGER =============
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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= UPDATED_AT TRIGGER FUNCTION =============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= SUPPLIERS =============
CREATE TABLE public.suppliers (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  energy_types public.energy_type[] NOT NULL DEFAULT '{electricity}',
  segments public.customer_segment[] NOT NULL DEFAULT '{household,business}',
  pricing_page_url TEXT,
  logo_url TEXT,
  website_url TEXT,
  parsing_rules JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active suppliers" ON public.suppliers FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= TARIFFS =============
CREATE TABLE public.tariffs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  energy_type public.energy_type NOT NULL,
  segment public.customer_segment NOT NULL,
  product_name TEXT NOT NULL,
  distribution_area public.distribution_area,
  tariff_band TEXT,
  monthly_fee_eur NUMERIC(10,4),
  unit_price_eur_per_kwh NUMERIC(10,6) NOT NULL,
  fixation_months INTEGER,
  valid_from DATE NOT NULL,
  valid_to DATE,
  status public.tariff_status NOT NULL DEFAULT 'pending',
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tariffs_lookup ON public.tariffs (energy_type, segment, distribution_area, status, valid_from DESC);
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views validated tariffs" ON public.tariffs FOR SELECT TO anon, authenticated USING (status = 'validated');
CREATE POLICY "Admins view all tariffs" ON public.tariffs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tariffs" ON public.tariffs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tariffs_updated_at BEFORE UPDATE ON public.tariffs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= TARIFF AUDIT =============
CREATE TABLE public.tariff_audit (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  tariff_id UUID REFERENCES public.tariffs(id) ON DELETE SET NULL,
  raw_payload JSONB NOT NULL,
  source_url TEXT,
  http_status INTEGER,
  validation_diff JSONB,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tariff_audit_supplier ON public.tariff_audit (supplier_id, scraped_at DESC);
ALTER TABLE public.tariff_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit" ON public.tariff_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============= OKTE SPOT =============
CREATE TABLE public.okte_spot_daily (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date DATE NOT NULL UNIQUE,
  avg_price_eur_per_mwh NUMERIC(10,4) NOT NULL,
  min_price_eur_per_mwh NUMERIC(10,4),
  max_price_eur_per_mwh NUMERIC(10,4),
  total_volume_mwh NUMERIC(14,4),
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.okte_spot_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views OKTE spot" ON public.okte_spot_daily FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage OKTE" ON public.okte_spot_daily FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= PRICE PREDICTIONS =============
CREATE TABLE public.price_predictions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  horizon TEXT NOT NULL,
  trend TEXT NOT NULL,
  expected_change_pct NUMERIC(6,3),
  confidence NUMERIC(4,3),
  rationale TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.price_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views predictions" ON public.price_predictions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage predictions" ON public.price_predictions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= HOUSEHOLD QUOTES =============
CREATE TABLE public.quotes_household (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  distribution_area public.distribution_area NOT NULL,
  annual_consumption_kwh NUMERIC(10,2) NOT NULL,
  tariff_band TEXT,
  current_supplier TEXT,
  current_unit_price_eur_per_kwh NUMERIC(10,6),
  includes_gas BOOLEAN NOT NULL DEFAULT false,
  annual_gas_kwh NUMERIC(10,2),
  estimated_savings_eur NUMERIC(10,2),
  recommended_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  session_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quotes_household_user ON public.quotes_household (user_id);
CREATE INDEX quotes_household_token ON public.quotes_household (session_token);
ALTER TABLE public.quotes_household ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit household quote" ON public.quotes_household FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users view own household quotes" ON public.quotes_household FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all household quotes" ON public.quotes_household FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update household quotes" ON public.quotes_household FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= BUSINESS QUOTES =============
CREATE TABLE public.quotes_business (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  ico TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  annual_consumption_mwh NUMERIC(12,3) NOT NULL,
  current_supplier TEXT,
  consumption_type TEXT,
  preferred_product TEXT,
  notes TEXT,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quotes_business_user ON public.quotes_business (user_id);
ALTER TABLE public.quotes_business ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit business quote" ON public.quotes_business FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users view own business quotes" ON public.quotes_business FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all business quotes" ON public.quotes_business FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============= ORDERS =============
CREATE TABLE public.orders (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  quote_household_id UUID REFERENCES public.quotes_household(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status public.order_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  product_label TEXT NOT NULL DEFAULT 'Personalizovaný report úspory',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX orders_user ON public.orders (user_id);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============= REPORTS =============
CREATE TABLE public.reports (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  quote_household_id UUID REFERENCES public.quotes_household(id) ON DELETE SET NULL,
  email TEXT,
  top_recommendations JSONB NOT NULL,
  estimated_savings_eur NUMERIC(10,2) NOT NULL,
  instructions_md TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============= BLOG POSTS =============
CREATE TABLE public.blog_posts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT,
  excerpt TEXT,
  content_md TEXT NOT NULL,
  cover_image_url TEXT,
  keywords TEXT[],
  reading_minutes INTEGER,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX blog_posts_published ON public.blog_posts (published, published_at DESC);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views published posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins view all posts" ON public.blog_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
