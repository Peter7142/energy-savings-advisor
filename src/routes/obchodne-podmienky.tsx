import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/obchodne-podmienky")({
  head: () => ({ meta: [{ title: "Obchodné podmienky — LacnéEnergie" }] }),
  component: () => (
    <AppShell>
      <article className="container mx-auto px-4 py-10 max-w-2xl prose prose-sm">
        <h1 className="text-2xl font-bold mb-4">Obchodné podmienky</h1>
        <p><strong>Predávajúci:</strong> Foton energy s.r.o., Ľubochnianska 4, 831 04 Bratislava, IČO: 53366280.</p>
        <h2 className="font-semibold mt-4">1. Predmet</h2>
        <p>Informačné poradenstvo — porovnanie cien dodávateľov energií a vypracovanie personalizovaného reportu úspory. Nie sme sprostredkovateľom zmluvy v energetike podľa § 14 zák. 251/2012 Z. z.</p>
        <h2 className="font-semibold mt-4">2. Produkty a ceny</h2>
        <ul className="list-disc pl-5"><li>Personalizovaný report úspory — 4,90 € (jednorazovo)</li><li>Ročné sledovanie cien — 9 € / rok (predplatné)</li></ul>
        <h2 className="font-semibold mt-4">3. Platba</h2>
        <p>Platba prebieha cez Stripe. Akceptujeme karty Visa, Mastercard, Apple Pay a Google Pay.</p>
        <h2 className="font-semibold mt-4">4. Dodanie</h2>
        <p>Digitálna služba — výsledok dostupný okamžite po zaplatení v účte a emailom.</p>
        <h2 className="font-semibold mt-4">5. Odstúpenie od zmluvy</h2>
        <p>Digitálny obsah — po sprístupnení nie je možné odstúpiť od zmluvy podľa § 7 ods. 6 písm. l) zák. 102/2014 Z. z. Ak výsledok nebude doručený do 10 minút, kontaktujte podporu.</p>
        <h2 className="font-semibold mt-4">6. Záruka</h2>
        <p>Ak nedokážeme report vypracovať, vrátime peniaze v plnej výške.</p>
        <h2 className="font-semibold mt-4">7. Kontakt a reklamácie</h2>
        <p><a href="mailto:support@lacneenergie.sk">support@lacneenergie.sk</a> — odpoveď do 24 hodín v pracovné dni.</p>
        <h2 className="font-semibold mt-4">8. Rozhodné právo</h2>
        <p>Slovenská republika. Spory rieši príslušný slovenský súd.</p>
      </article>
    </AppShell>
  ),
});
