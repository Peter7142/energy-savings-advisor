# Plán: AI agent + Stripe + plný rozsah LacnéEnergie

## 1. AI agent na denné prehliadanie webu

**Cron orchestrátor** (TanStack server route `/api/public/cron-daily`, volaný pg_cron každý deň 06:00):

1. **Scraping vrstva** — Firecrawl pre každého dodávateľa zo zoznamu `suppliers` (ZSE, SSE, VSE, SPP, MAGNA, ČEZ, Energie2, Pow-en, MET, RWE, Slovakia Energy, Energie pre Vás, atď. — ~30+). Pre každého: `firecrawl.scrape(pricing_page_url, { formats: ['markdown', { type: 'json', schema: priceSchema }] })`.
2. **AI extrakčný agent** (Lovable AI Gateway, `google/gemini-2.5-flash`) — dostane markdown cenníka + JSON schému tarify. Vráti normalizované záznamy: `product_name, unit_price_eur_per_kwh, monthly_fee_eur, fixation_months, tariff_band, distribution_area, segment, energy_type, valid_from`.
3. **Validačný AI agent** (`google/gemini-2.5-pro` pre anomálie) — porovná novú cenu s posledným záznamom v `tariff_audit`. Ak zmena > 15 % alebo cena mimo rozumného pásma (0.05–0.50 €/kWh), označí `status='needs_review'` a zaloguje rationale. Inak `status='validated'`.
4. **OKTE import** — scrape `okte.sk` denného report PDF/HTML → uloženie do `okte_spot_daily`.
5. **ÚRSO import** — scrape rozhodnutí ÚRSO (`urso.gov.sk`) → `urso_decisions` (tabuľku doplníme).
6. **Predikčný AI agent** (`openai/gpt-5-mini`) — analýza posledných 30 dní OKTE + tarify, vygeneruje `price_predictions` (horizon 7d/30d/90d, trend, confidence, rationale).
7. **Audit log** — každý krok do `tariff_audit` s `raw_payload`, `source_url`, `http_status`, `scraped_at`.
8. **Admin notifikácia** — ak akékoľvek `needs_review` záznamy, email na `peter.suraba@gmail.com` so zoznamom.

**Manuálny re-trigger** v Admin paneli — tlačidlo „Spustiť scraping teraz" volá rovnaký endpoint s admin tokenom.

**Tabuľka `urso_decisions`** (nová): `id, decision_number, title, summary, decision_date, source_url, raw_payload, created_at`.

## 2. Stripe integrácia (seamless Lovable Payments)

- `enable_stripe_payments` (Lovable-managed, bez API key od usera)
- 2 produkty: **„Personalizovaný report úspory"** — 2 € jednorazovo, **„Ročné sledovanie cien"** — 9 €/rok subscription
- Checkout flow: po vyplnení 5-step survey → `create-checkout` server function → Stripe Checkout (karta + Apple/Google Pay) → success redirect na `/ucet/report/[id]`
- Webhook `/api/public/stripe-webhook`: overí signature, na `checkout.session.completed` označí `orders.status='paid'`, `quotes_household.paid=true`, spustí `generate-report` (AI agent vygeneruje PDF s presným postupom prechodu + výpočet úspory), pošle email zákazníkovi + kópiu na peter.suraba@gmail.com
- Tax mód: **option 2 (automatic_tax)** — SK VAT 23 %, Stripe ho počíta a vyberá, Foton energy s.r.o. priznáva
- Pre B2B (priemysel survey) → bez platby, lead ide priamo na peter.suraba@gmail.com

## 3. Plný rozsah MVP — zoznam ostávajúcich obrazoviek

**Auth:**
- `/auth` — email/heslo + Google sign-in, signup/login tabs, reset hesla cez `/reset-password`
- Auto-vytvorenie profilu cez `handle_new_user` trigger (už existuje)

**Domov (`/`):**
- Hero s claim „Za 2 € ušetríš stovky € ročne", animovaný tumbler Domácnosť/Priemysel (už hotové)
- Live ticker OKTE spot ceny + 7-dňový trend (Recharts)
- Social proof / FAQ / CTA

**Kalkulačka (`/kalkulacka`):**
- 5-step survey (domácnosť): distribučná oblasť (ZSE/SSE/VSE) → ročná spotreba kWh → tarifa (DD1–DD8) → súčasný dodávateľ + cena → email
- Inštantný odhad úspory (`estimated_savings_eur`) → CTA „Odomkni presný postup za 2 €" → Stripe Checkout
- Pre Priemysel: 6-step business survey → odoslanie leadu (bez platby)

**Ceny (`/ceny`):**
- Tabuľka všetkých `validated` taríf s filtrami (distribúcia, segment, energy_type)
- OKTE spot graf (Recharts) — denný/týždenný/mesačný
- Predikčný widget (predictions z DB)
- Anomálie (verejne viditeľné len validated)

**Účet (`/ucet`):**
- Login required, zoznam `orders`, `reports` s download PDF, upsell na 9 €/rok subscription

**Blog (`/blog`, `/blog/$slug`):**
- 10 SEO článkov (AI-generated cez Lovable AI Gateway, jednorazovo seed)
- SEO meta tagy per route, JSON-LD Article schema

**Admin (`/admin`, len role `admin`):**
- Dashboard: počet leadov, objednávok, revenue, posledný scraping
- `/admin/suppliers` — CRUD dodávateľov
- `/admin/tariffs` — validation queue (needs_review), inline edit, manual entry
- `/admin/quotes` — všetky leads (household + business), export CSV
- Tlačidlo „Spustiť scraping teraz"

**Právne (`/gdpr`, `/obchodne-podmienky`, `/cookies`, `/kontakt`):**
- GDPR pre Foton energy s.r.o. ako prevádzkovateľa
- Obchodné podmienky vrátane §7 ods. 6 zák. 102/2014 (odstúpenie od digitálnej služby)
- Cookies banner s consent (essential vs analytics)
- Disclaimer „informatívne odporúčanie, nie finančné poradenstvo" na všetkých reportoch

## 4. Technické detaily

- **Server functions** (`src/lib/*.functions.ts`): `submitHouseholdQuote`, `submitBusinessQuote`, `createCheckout`, `getDashboardData`, `runScrapingAgent` (admin only), `getMyReports`
- **Server routes** (`src/routes/api/public/*`): `cron-daily.ts`, `stripe-webhook.ts`
- **Auth middleware**: `requireSupabaseAuth` + `requireAdmin` (kontrola `has_role`)
- **Connectors**: Firecrawl (scraping), Stripe (auto cez enable_stripe_payments), Lovable AI (built-in)
- **PDF generácia**: server-side cez `@react-pdf/renderer` v `generate-report` server function, upload do Supabase Storage bucket `reports`
- **Email**: Resend cez Lovable transactional email (`scaffold_transactional_email`) — vlastná doména `lacneenergie.sk`

## 5. Poradie implementácie

1. Auth (`/auth`, `/reset-password`) + presmerovanie na `/ucet` po loginu
2. 5-step survey kalkulačka (household) + odhad úspory
3. Stripe enable + checkout + webhook + generate-report (AI)
4. Ceny tab (OKTE graf + tarify list) + predikcie
5. AI scraping agent (Firecrawl + Lovable AI extraction + validation) + cron
6. Admin panel (suppliers, tariffs validation, quotes)
7. Business survey + email lead
8. Blog (AI seed 10 článkov)
9. Právne stránky + cookie banner
10. SEO meta per route + sitemap + robots.txt
11. Transactional email (vlastná doména)
12. Storage bucket `reports` + PDF upload

## 6. Otvorené body / upozornenia

- **Firecrawl kredity** — pri 30 dodávateľoch × denne = 900 scrapov/mesiac. Treba mať aspoň Standard plán.
- **Scraping a robots.txt** — niektorí dodávatelia môžu mať ToS proti scrapingu. Riešenie: fallback na manuálny admin entry + označenie zdroja v reporte.
- **Stripe 2 € marža** — po poplatkoch (~1.4 % + 0.25 €) zostane ~1.72 €. OK.
- **Vlastná doména `lacneenergie.sk`** — musí dokúpiť user, potom pripojiť v Lovable settings (mimo môjho rozsahu).
- **ÚRSO a OKTE bez oficiálneho API** — scraping HTML/PDF, môže byť krehké, AI agent s fallbackom.

Po schválení začnem krokom 1 (Auth) a postupne prejdem všetkými 12 krokmi.
