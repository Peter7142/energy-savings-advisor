# Plán: AI poradca ceny (analýza zadarmo, potom platené riešenie)

## Čo uvidí zákazník
1. Nahrá/odfotí faktúru alebo zadá údaje ručne (ako dnes).
2. **Zadarmo** dostane okamžitý verdikt od AI: „Vaša cena je dobrá / priemerná / predražená", koľko približne preplatí ročne a s akou istotou.
3. Konkrétny postup (ktorý dodávateľ, aký produkt, ako prejsť, presná úspora) je skrytý — odomkne sa po zaplatení.
4. Po zaplatení dostane plný report na stránke Účet.

## Pravidelné sledovanie cien
- Každú hodinu: kontrola cenníkov všetkých dodávateľov na internete + trhové ceny (OKTE) a rozhodnutia ÚRSO.
- AI každú zmenu porovná s predchádzajúcou cenou; podozrivé skoky (nad 15 %) si overí z druhého zdroja, inak ich neprijme.
- Raz denne celkové vyhodnotenie a odhad vývoja (len informatívne).
- Ak scan zlyhá alebo dôjdu kredity, sledovanie sa samo pozastaví a zobrazí sa to adminovi.

## Technické detaily
- Pripojenie Firecrawl (čítanie webov) cez konektor.
- Server route `/api/public/cron-scan` (overenie tajného kľúča), pg_cron hodinovo; zámok proti súbežnému behu, max N dodávateľov na beh.
- Server fn `analyzeQuote` (verejná, bez platby): porovná údaje s validovanými tarifami v DB, AI vráti verdikt; ukladá sa do `quotes_household` (verdict, overpay_eur, recommendation skrytá).
- Plné odporúčanie sa vracia len ak je objednávka zaplatená (kontrola na serveri).
