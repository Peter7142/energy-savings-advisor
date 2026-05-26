import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/ochrana-udajov")({
  head: () => ({ meta: [{ title: "Ochrana osobných údajov — LacnéEnergie" }] }),
  component: () => (
    <AppShell>
      <article className="container mx-auto px-4 py-10 max-w-2xl prose prose-sm">
        <h1 className="text-2xl font-bold mb-4">Ochrana osobných údajov</h1>
        <p><strong>Prevádzkovateľ:</strong> Foton energy s.r.o., Ľubochnianska 4, 831 04 Bratislava, IČO: 53366280.</p>

        <h2 className="font-semibold mt-4">1. Aké údaje spracúvame</h2>
        <ul className="list-disc pl-5">
          <li>Email a meno (na doručenie reportu)</li>
          <li>Vyčítané hodnoty z faktúry: dodávateľ, distribučná oblasť, ročná spotreba, tarifa</li>
          <li>Platobné údaje (spracúva Stripe — my ich nevidíme)</li>
          <li>IP adresa (bezpečnosť, ochrana pred zneužitím)</li>
        </ul>

        <h2 className="font-semibold mt-4">2. Nahrávanie faktúry (AI rozpoznanie)</h2>
        <p>
          Ak nahráš alebo odfotíš faktúru, súbor sa odošle len na okamžité spracovanie umelou
          inteligenciou (Google Gemini cez Lovable AI Gateway, dátové centrá v EÚ). Z faktúry
          extrahujeme výlučne tieto polia: dodávateľ, distribučná oblasť, ročná spotreba (kWh),
          tarifa a informácia o plyne.
        </p>
        <ul className="list-disc pl-5">
          <li><strong>Súbor faktúry sa po spracovaní okamžite zahodí</strong> — neukladáme ho ani na server, ani do databázy.</li>
          <li>Neukladáme adresu, číslo zákazníka, IBAN ani iné identifikátory z faktúry.</li>
          <li>Pred nahratím odporúčame začierniť všetko, čo nepotrebujeme (číslo zákazníka, IBAN, EIC).</li>
          <li>AI model sa na tvojich dátach <strong>netrénuje</strong> (zmluvný záväzok poskytovateľa).</li>
          <li>Nahranie faktúry je <strong>dobrovoľné</strong> — všetky polia môžeš vyplniť aj ručne.</li>
        </ul>

        <h2 className="font-semibold mt-4">3. Na aký účel</h2>
        <ul className="list-disc pl-5">
          <li>Poskytnutie zakúpenej služby (porovnanie cien, report úspory)</li>
          <li>Zasielanie výsledkov a notifikácií</li>
          <li>Ochrana pred zneužitím</li>
        </ul>

        <h2 className="font-semibold mt-4">4. Právny základ</h2>
        <p>
          Plnenie zmluvy (čl. 6 ods. 1 písm. b GDPR), oprávnený záujem — bezpečnosť
          (čl. 6 ods. 1 písm. f GDPR), a tvoj výslovný súhlas pri nahratí faktúry
          (čl. 6 ods. 1 písm. a GDPR), ktorý môžeš kedykoľvek odvolať.
        </p>

        <h2 className="font-semibold mt-4">5. Príjemcovia a sprostredkovatelia</h2>
        <ul className="list-disc pl-5">
          <li>Lovable Cloud / Supabase (hosting, databáza) — EÚ</li>
          <li>Lovable AI Gateway / Google Gemini (rozpoznávanie faktúry) — EÚ, bez tréningu na tvojich dátach</li>
          <li>Stripe (platby) — EÚ/USA, štandardné zmluvné doložky</li>
          <li>Resend (odosielanie emailov) — EÚ</li>
        </ul>

        <h2 className="font-semibold mt-4">6. Doba uchovávania</h2>
        <ul className="list-disc pl-5">
          <li>Súbor faktúry: <strong>0 sekúnd</strong> (neukladá sa)</li>
          <li>Extrahované údaje (spotreba, dodávateľ): 24 mesiacov</li>
          <li>Účtovné doklady: 10 rokov (zákonná povinnosť)</li>
          <li>Email: do odvolania súhlasu</li>
        </ul>

        <h2 className="font-semibold mt-4">7. Vaše práva</h2>
        <p>
          Máte právo na prístup, opravu, vymazanie, obmedzenie spracúvania, prenosnosť údajov,
          námietku a odvolanie súhlasu. Žiadosť pošlite na{" "}
          <a href="mailto:info@fotonenergy.sk">info@fotonenergy.sk</a>. Vybavíme do 30 dní.
        </p>

        <h2 className="font-semibold mt-4">8. Sťažnosť</h2>
        <p>Úrad na ochranu osobných údajov SR, Hraničná 12, 820 07 Bratislava.</p>
      </article>
    </AppShell>
  ),
});
