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
        <ul className="list-disc pl-5"><li>Email a meno (na doručenie reportu)</li><li>Vyčítané hodnoty z faktúry (dodávateľ, spotreba, cena)</li><li>Platobné údaje (spracúva Stripe — my ich nevidíme)</li><li>IP adresa (bezpečnosť, ochrana pred zneužitím)</li></ul>
        <h2 className="font-semibold mt-4">2. Na aký účel</h2>
        <ul className="list-disc pl-5"><li>Poskytnutie zakúpenej služby</li><li>Zasielanie výsledkov a notifikácií</li><li>Ochrana pred zneužitím</li></ul>
        <h2 className="font-semibold mt-4">3. Právny základ</h2>
        <p>Plnenie zmluvy (čl. 6 ods. 1 písm. b GDPR) a oprávnený záujem — bezpečnosť (čl. 6 ods. 1 písm. f GDPR).</p>
        <h2 className="font-semibold mt-4">4. Doba uchovávania</h2>
        <ul className="list-disc pl-5"><li>Výsledky analýz: 24 mesiacov</li><li>Účtovné doklady: 10 rokov (zákonná povinnosť)</li><li>Email: do odvolania súhlasu</li></ul>
        <h2 className="font-semibold mt-4">5. Vaše práva</h2>
        <p>Máte právo na prístup, opravu, vymazanie, prenosnosť a námietku. Žiadosť: <a href="mailto:info@fotonenergy.sk">info@fotonenergy.sk</a>.</p>
        <h2 className="font-semibold mt-4">6. Odvolanie súhlasu</h2>
        <p>Kedykoľvek na info@fotonenergy.sk alebo v nastaveniach účtu.</p>
        <h2 className="font-semibold mt-4">7. Sťažnosť</h2>
        <p>Úrad na ochranu osobných údajov SR.</p>
      </article>
    </AppShell>
  ),
});
