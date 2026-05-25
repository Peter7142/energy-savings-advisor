## Cieľ

**LacnéEnergie** — webová aplikácia s app-like UX (vyzerá a ovláda sa ako natívna mobilná appka aj na webe), prevádzkovateľ **Foton energy s.r.o.**, doména **lacneenergie.sk**. Užívateľ za **2 €** dostane personalizovaný návod, u ktorého dodávateľa ušetrí najviac, vrátane ročnej úspory v €. Firmy vyplnia dotazník a dostanú ponuku na mieru emailom na peter.suraba@gmail.com.

---

## 1. Brand & App identita

- **Názov:** LacnéEnergie
- **Wordmark:** "Lacné" v ľahkom písme + "Energie" tučne, s ikonou blesku (⚡) integrovanou do "E"
- **App ikona** (PNG 512×512, generovaná hyperrealisticky): štylizovaný blesk v jemne gradientovom čipe so zaoblenými rohmi (iOS-style)
- **Manifest** (`manifest.json`) s `display: "standalone"`, name "LacnéEnergie", short_name "Lacné", theme_color, ikony 192/512 → **installable** (Add to Home Screen) bez service workera (preview-safe podľa PWA pravidiel)
- **Apple touch icons** + favicon
- **Splash farba** + theme color v `<meta name="theme-color">`

---

## 2. App-like UX (mobile-first, ale skvelé aj na desktope)

**Hlavná navigácia — bottom tab bar (mobile) / top nav (desktop ≥1024px)**
4 taby: 🏠 Domov · 🧮 Kalkulačka · 📊 Ceny · 👤 Účet
- Bottom bar fixovaný, safe-area-inset (notch friendly), aktívny tab s pružinovou animáciou
- Na desktope to isté ako sidebar/top nav

**Hero — animovaný "tumbler" toggle Domácnosť / Priemysel**
- Fyzikálna pružinová animácia (Framer Motion), swipe gestom prepnutie
- Pulzujúca šípka "👉 potiahni" pri prvej návšteve
- Stav prepínača mení kontext celého taba (texty, ceny, CTA, dotazník)
- Haptic feedback (`navigator.vibrate(10)`) pri prepnutí na mobile

**App-like detaily**
- **Full-screen sekcie** so safe area paddingom
- **Pull-to-refresh** na "Ceny" tabe (denné ceny)
- **Bottom sheets** namiesto modálov (swipe down zatvára)
- **Skeleton loadery** namiesto spinnerov
- **Tap targets ≥ 44×44 px** (Apple HIG)
- **No text selection** na UI prvkoch, `touch-action: manipulation` (žiadny 300 ms delay)
- **Disable browser zoom** na UI ovládaní, povolený zoom v obsahu
- **Smooth scroll** + scroll snap medzi sekciami v hero
- **Animované prechody** medzi tabmi (slide / fade)
- **Toast notifikácie** namiesto alertov

**Jednoduché ovládanie pre používateľa**
- Max **3 kliky** k výsledku úspory: toggle → 5 otázok (jeden krok = jedna obrazovka) → výsledok
- **Veľké tlačidlá**, jasná hierarchia, minimum textu
- **Progress bar** v dotazníku ("Krok 2 z 5")
- **Auto-uloženie** rozrobeného dotazníka do localStorage
- **Onboarding tooltip** pri prvej návšteve (3 kartičky, swipe)

---

## 3. Sekcie / obrazovky

**🏠 Domov**
- Hero s toggle Domácnosť/Priemysel + claim *"Za 2 € ušetríš stovky eur ročne"*
- CTA "Zisti, kde ušetríš →"
- Mini-trust badges (počet odporúčaní, priemerná úspora)

**🧮 Kalkulačka** (jednokrokový dotazník v 5 krokoch)
- Domácnosť: región → distribučná oblasť → spotreba kWh → sadzba → aktuálny dodávateľ
- Priemysel: IČO → kontakt → ročná spotreba MWh → aktuálny dodávateľ → typ odberu → odoslanie
- Po posledný krok → **teaser výsledku** (rozmazaný TOP 3 + odhad úspory) → **"Odomkni za 2 €"** (Stripe Checkout)

**📊 Ceny** (real-time prehľad)
- Tabuľka/karty TOP 10 najlacnejších dodávateľov (validované ceny)
- Graf vývoja spotových cien OKTE (7/30/365 dní)
- Indikátor trendu ↗↘ s informatívnou predikciou
- Pull-to-refresh

**👤 Účet**
- Login (email/heslo + Google)
- História mojich reportov + PDF stiahnutie
- Upsell "Ročné sledovanie cien" 9 €/rok

**📚 Blog** (link z footera / účtu)
- 10 SEO článkov

**🔒 Admin** (skrytý, len pre rolu `admin`)
- CRUD dodávateľov, validácia cien, prehľad objednávok a dopytov

---

## 4. Flow používateľa (max 3 kliky)

**Domácnosť:**
1. Toggle "Domácnosť"
2. 5-krokový dotazník (krok = obrazovka)
3. Teaser → Stripe Checkout (Apple/Google Pay + karta) → personalizovaný PDF report s TOP 3 + presnou ročnou úsporou v € + postup na zmenu → email zákazníkovi + kópia **peter.suraba@gmail.com**

**Priemysel:**
1. Toggle "Priemysel"
2. Dotazník (IČO, spotreba, dodávateľ, kontakt)
3. Odoslanie → automatický email s dotazníkom na **peter.suraba@gmail.com** → klient vidí "ponuka do 24 h"

---

## 5. Zdroje dát — KOMPLETNÝ scraping všetkých SK predajcov

**Verejné dáta (bez prihlásenia):**
- **OKTE** — denné spotové ceny SK trhu (verejné CSV/XML)
- **ÚRSO** — verejné rozhodnutia, distribučné poplatky, TPS, OZE
- **SEPS** — prenosové poplatky

**Scraping cenníkov VŠETKÝCH SK dodávateľov elektriny a plynu** (Firecrawl, denný cron 06:00). Východiskový zoznam (rozšíriteľný v admin paneli):
ZSE Energia, SSE, VSE, SPP, MAGNA Energia, ČEZ Slovensko, Energie2, Slovakia Energy, Pow-en, RIGHT POWER, MET Slovakia, ZSE Energy Solutions, Greenlogy, Encare, ELGAS, Lumius Slovakia, A.En. Slovensko, ČEZ Predaj, Veolia Energia Slovensko, KOOR, EP ENERGY TRADING, RWE a ďalší.

Tabuľka `suppliers` v DB — admin pridáva/deaktivuje bez zásahu do kódu. Pre každého: `pricing_page_url`, `parsing_rules`, `is_active`, `last_scraped_at`.

**Architektúra:**
- Edge function `scrape-supplier` (per supplier)
- Master cron `scrape-all-suppliers` (pg_cron 06:00) → paralelizácia + rate limit
- Raw HTML snapshot do `tariff_audit` (dôkazová stopa) + parsované ceny do `tariffs`
- User-Agent `lacneenergie.sk bot (kontakt: peter.suraba@gmail.com)`, rešpekt robots.txt
- Pri zlyhaní → fallback na manuálny vstup v admin paneli + notifikácia

**Validácia anomálií:**
- Diff voči predošlému dňu; zmena > 15 % → flag `needs_review`
- Cena nie je zverejnená kým nie je `validated`
- Log zdroja + timestamp + raw payload

**Predikcia (informatívna):**
- 7/30-dňový kĺzavý priemer OKTE + lineárna projekcia + disclaimer

---

## 6. Admin panel

- Login + rola `admin` cez separátnu `user_roles` tabuľku (bezpečné, žiadne role na profile)
- CRUD `suppliers` (URL cenníka + parsing rules)
- Validácia cien (pending/validated/rejected/needs_review)
- Manuálne pridanie/oprava ceny
- Prehľad objednávok (Stripe), firemných dopytov, leadov
- Re-trigger scraperu
- Export CSV

---

## 7. Blog (SEO)

10 článkov generovaných cez Lovable AI Gateway na základe **Semrush keyword research** pre SK trh. Frázy ako:
"ako zmeniť dodávateľa elektriny", "najlacnejšia elektrina 2026", "porovnanie dodávateľov energií", "výpoveď zmluvy elektrina", "zmena dodávateľa plynu", "fixácia ceny elektriny", "spotová cena elektriny", "distribučné poplatky ZSE/SSE/VSD", "úspora na elektrine domácnosť", "elektrina pre firmy cena".

Každý článok: SEO title/meta, H1, hyperrealistický hero obrázok (premium imagegen), CTA na kalkulačku, JSON-LD Article.

---

## 8. Platby

**Stripe Checkout** (Lovable built-in):
- Produkt: "Personalizovaný report úspory" — **2 €** (1 € by Stripe fee zožral)
- Apple Pay + Google Pay + karta (jeden tap na mobile)
- Upsell po platbe: "Ročné sledovanie cien + alerty" — **9 €/rok**
- Webhook → vygeneruje PDF, pošle emaily, uloží do DB

---

## 9. Emaily

**Lovable Emails** (vlastná doména `notify.lacneenergie.sk`):
- Auth (verifikácia, reset)
- Transakčné: potvrdenie + PDF report zákazníkovi, firemný dopyt → **peter.suraba@gmail.com**, kópie objednávok
- NS delegácia subdomény pri kúpe domény

---

## 10. Právne — kompletná šablóna (na review právnikom)

- **Zásady ochrany osobných údajov (GDPR)** — prevádzkovateľ Foton energy s.r.o., účely, právny základ (zmluva + súhlas), doby uchovania, práva subjektu, kontakt zodpovednej osoby
- **Obchodné podmienky** — digitálna informačná služba, cena 2 €, platba Stripe, dodanie e-mailom okamžite, **odstúpenie do 14 dní + výslovný súhlas so začatím plnenia pred uplynutím lehoty** (§7 ods. 6 zák. 102/2014 Z. z.), reklamácie, SOI/ARS
- **Cookies banner** (consent mode v2)
- **Disclaimer** na každom reporte: *"Informačné poradenstvo. Foton energy s.r.o. nie je sprostredkovateľom zmluvy v energetike podľa § 14 zák. 251/2012 Z. z."*

---

## 11. SEO

- Title <60: "LacnéEnergie — porovnanie dodávateľov 2026 | lacneenergie.sk"
- Meta desc <160 s benefitom + CTA
- JSON-LD: Organization (Foton energy s.r.o.), WebSite, MobileApplication, FAQPage, Article, Product
- sitemap.xml, robots.txt, canonical
- OG + Twitter card s hyperrealistickým obrázkom

---

## 12. Tech detaily

- **Frontend:** React + Vite + Tailwind + shadcn/ui + Framer Motion + Recharts
- **Backend:** Lovable Cloud — DB, Auth, Edge Functions, Storage, pg_cron
- **Tabuľky:** `suppliers`, `tariffs`, `tariff_audit`, `quotes_household`, `quotes_business`, `orders`, `reports`, `blog_posts`, `user_roles`, `price_predictions`, `okte_spot_daily`, `urso_decisions`
- **RLS:** všetko zamknuté; public read len na validated cenníky + publikovaný blog
- **Edge functions:** `scrape-supplier`, `scrape-all-suppliers`, `okte-import`, `urso-import`, `validate-prices`, `create-checkout`, `stripe-webhook`, `generate-report` (PDF), `send-business-quote`, `predict-trend`
- **Konektory:** Firecrawl (scraping), Semrush (keyword research), Stripe (platby)
- **AI:** Lovable AI Gateway (blog + texty reportu), premium imagegen (hyperrealistické obrázky)
- **PWA-lite:** manifest + ikony pre "Add to Home Screen" (bez service workera — preview-safe)

---

## 13. Doména & deployment

- **lacneenergie.sk** kupuješ u SK registrátora (Lovable typicky nepredáva `.sk`)
- Po kúpe pripojím v Project Settings → Domains
- Email subdoména `notify.lacneenergie.sk` — NS delegácia na Lovable

---

## Poradie implementácie

1. Cloud + Auth + `user_roles` + DB schéma + RLS
2. App shell (bottom nav, manifest, ikony, theme color, safe areas)
3. Hero s toggle animáciou + 5-krokový dotazník Domácnosť
4. Dotazník Priemysel + odoslanie na peter.suraba@gmail.com
5. Stripe payments + checkout + webhook + PDF report
6. Tab "Ceny" + grafy + pull-to-refresh
7. Admin panel + `suppliers` CRUD + Firecrawl scraper všetkých dodávateľov + OKTE/ÚRSO import + validácia
8. Predikcia trendu
9. Semrush keyword research → blog (10 článkov + hyperrealistické obrázky)
10. GDPR / OP / Cookies / Disclaimer
11. SEO finalizácia

---

## Upozornenia

- **Marža:** pri 1 € Stripe fee ~0,28 € → nastavujem **2 €** (čistý ~1,42 €).
- **Scraping cenníkov** je v šedej zóne — transparentný User-Agent + rate-limit; pri sťažnosti prejdeme na manuálny vstup pre daného dodávateľa.
- **OKTE/ÚRSO** nemajú prihlasovacie API — verejné reporty.
- **Poradenstvo informatívne** — bez licencie ÚRSO; disclaimer všade.
- **Domain installability**: appka bude fungovať ako "Add to Home Screen" (manifest) bez service workera — žiadne offline, ale nainštalovateľná na iOS/Android s vlastnou ikonou a full-screen módom.
