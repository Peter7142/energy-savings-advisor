import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle, type Mode } from "@/components/ModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { parseInvoice } from "@/lib/invoice-parser.functions";
import { submitAndAnalyze, type FreeVerdict } from "@/lib/advisor.functions";
import { ArrowRight, Upload, Loader2, Sparkles, ShieldCheck, Camera } from "lucide-react";

export const Route = createFileRoute("/kalkulacka")({
  component: KalkulackaPage,
});

const DIST = [
  { v: "ZSD", label: "Západoslovenská (ZSD)" },
  { v: "SSD", label: "Stredoslovenská (SSD)" },
  { v: "VSD", label: "Východoslovenská (VSD)" },
] as const;
const TARIFFS = ["DD1", "DD2", "DD3", "DD4", "Neviem"];
const SUPPLIERS = ["ZSE", "SSE", "VSE", "Magna Energia", "Slovak Energy", "ČEZ", "Iný / neviem"];

function KalkulackaPage() {
  const navigate = useNavigate();
  const [distribution, setDistribution] = useState<string>("");
  const [annualKwh, setAnnualKwh] = useState<string>("");
  const [tariff, setTariff] = useState<string>("Neviem");
  const [supplier, setSupplier] = useState<string>("");
  const [includesGas, setIncludesGas] = useState<boolean>(false);
  const [annualGas, setAnnualGas] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanInfo, setScanInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("upload");
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const callParseInvoice = useServerFn(parseInvoice);
  const callAnalyze = useServerFn(submitAndAnalyze);
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [verdict, setVerdict] = useState<FreeVerdict | null>(null);

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Súbor sa nepodarilo načítať."));
      reader.readAsDataURL(file);
    });
  }

  async function handleInvoiceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setScanInfo(null);

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Podporujeme JPG, PNG, WEBP alebo PDF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Súbor je príliš veľký (max 8 MB).");
      return;
    }

    setScanning(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await callParseInvoice({ data: { dataUrl, mimeType: file.type } });
      if (res.error || !res.parsed) {
        setError(res.error || "AI nevedela prečítať faktúru.");
        return;
      }
      const p = res.parsed;
      const filled: string[] = [];
      if (p.distribution_area) { setDistribution(p.distribution_area); filled.push("distribúcia"); }
      if (p.annual_consumption_kwh) { setAnnualKwh(String(Math.round(p.annual_consumption_kwh))); filled.push("spotreba"); }
      if (p.tariff_band) { setTariff(p.tariff_band); filled.push("tarifa"); }
      if (p.current_supplier) { setSupplier(p.current_supplier); filled.push("dodávateľ"); }
      if (p.includes_gas !== null) setIncludesGas(p.includes_gas);
      if (p.includes_gas && p.annual_gas_kwh) { setAnnualGas(String(Math.round(p.annual_gas_kwh))); filled.push("plyn"); }
      setScanInfo(filled.length
        ? `Vyplnené: ${filled.join(", ")}. Skontroluj hodnoty.`
        : "AI nenašla žiadne údaje, vyplň ich ručne.");
      setMode("manual");
    } catch (err: any) {
      setError(err?.message || "Spracovanie zlyhalo.");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const kwh = Number(annualKwh);
      if (!distribution) throw new Error("Vyber distribučnú oblasť.");
      if (!kwh || kwh < 100 || kwh > 100000) throw new Error("Spotreba musí byť 100–100 000 kWh.");
      if (includesGas) {
        const g = Number(annualGas);
        if (!g || g < 100) throw new Error("Spotreba plynu musí byť aspoň 100 kWh.");
      }

      const { data: userData } = await supabase.auth.getUser();
      const price = unitPrice ? Number(unitPrice.replace(",", ".")) : null;
      if (price !== null && (!(price > 0.01) || price > 1)) throw new Error("Cena za kWh má byť napr. 0,16.");
      const res = await callAnalyze({ data: {
        distribution_area: distribution as "ZSD" | "SSD" | "VSD",
        annual_consumption_kwh: kwh,
        tariff_band: tariff === "Neviem" ? null : tariff,
        current_supplier: supplier || null,
        current_unit_price: price,
        current_monthly_fee: null,
        includes_gas: includesGas,
        annual_gas_kwh: includesGas ? Number(annualGas) : null,
        email: userData.user?.email ?? email,
        user_id: userData.user?.id ?? null,
      } });
      if (res.error || !res.result) throw new Error(res.error || "Vyhodnotenie zlyhalo.");
      setVerdict(res.result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Niečo sa nepodarilo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <h1 className="text-2xl font-bold mb-1">Kalkulačka úspory</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Zadarmo ti povieme, či máš dobrú cenu. Presný postup ako ušetriť odomkneš za 4,90 €.
        </p>

        {verdict && <VerdictCard v={verdict} onPay={() => navigate({ to: "/platba", search: { product: "report", quoteId: verdict.quoteId } })} onReset={() => setVerdict(null)} />}

        <form hidden={!!verdict} onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <ModeToggle value={mode} onChange={setMode} />

          {mode === "upload" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Nahraj faktúru a AI vyplní polia za teba</p>
                  <p className="text-xs text-muted-foreground">Vyber PDF alebo obrázok faktúry z tvojho zariadenia.</p>
                </div>
              </div>
              <input
                ref={uploadRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                className="hidden"
                onChange={handleInvoiceUpload}
              />
              <Button type="button" variant="outline" className="w-full" disabled={scanning}
                onClick={() => uploadRef.current?.click()}>
                {scanning ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Spracúvam faktúru…</>)
                  : (<><Upload className="w-4 h-4 mr-2" /> Vybrať súbor (PDF / obrázok)</>)}
              </Button>
              {scanInfo && <p className="text-xs text-primary">{scanInfo}</p>}
              <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Faktúra sa po spracovaní okamžite zahodí. Spracovanie v EÚ. Viac v <a href="/ochrana-udajov" className="underline">Ochrane údajov</a>.</span>
              </p>
            </div>
          )}

          {mode === "photo" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Camera className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Odfoť faktúru telefónom</p>
                  <p className="text-xs text-muted-foreground">Otvorí sa fotoaparát. Faktúru drž rovno a zaostrene.</p>
                </div>
              </div>
              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                capture="environment"
                className="hidden"
                onChange={handleInvoiceUpload}
              />
              <Button type="button" variant="outline" className="w-full" disabled={scanning}
                onClick={() => photoRef.current?.click()}>
                {scanning ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Spracúvam fotku…</>)
                  : (<><Camera className="w-4 h-4 mr-2" /> Otvoriť fotoaparát</>)}
              </Button>
              {scanInfo && <p className="text-xs text-primary">{scanInfo}</p>}
              <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Fotku po spracovaní okamžite zahodíme. Spracovanie v EÚ.</span>
              </p>
            </div>
          )}

          {mode === "manual" && (
            <div className="space-y-5">
              {scanInfo && (
                <p className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg p-2">{scanInfo}</p>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Distribučná oblasť</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DIST.map((d) => (
                    <button
                      type="button"
                      key={d.v}
                      onClick={() => setDistribution(d.v)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        distribution === d.v
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="kwh">Ročná spotreba elektriny (kWh)</label>
                <Input id="kwh" type="number" inputMode="numeric" min={100} max={100000}
                  value={annualKwh} onChange={(e) => setAnnualKwh(e.target.value)}
                  placeholder="napr. 2400" required />
                <p className="text-xs text-muted-foreground mt-1">Nájdeš na ročnom vyúčtovaní.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="tariff">Tarifa (sadzba)</label>
                <select id="tariff" value={tariff} onChange={(e) => setTariff(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {TARIFFS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="sup">Aktuálny dodávateľ</label>
                <select id="sup" value={supplier} onChange={(e) => setSupplier(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— vyber —</option>
                  {SUPPLIERS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="price">Tvoja cena za kWh s DPH (nepovinné)</label>
                <Input id="price" inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="napr. 0,16" />
                <p className="text-xs text-muted-foreground mt-1">Nájdeš na faktúre. Bez nej porovnáme s bežnou cenou na Slovensku.</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={includesGas}
                    onChange={(e) => setIncludesGas(e.target.checked)}
                    className="rounded border-input" />
                  Mám aj plyn
                </label>
                {includesGas && (
                  <Input className="mt-2" type="number" inputMode="numeric" min={100}
                    value={annualGas} onChange={(e) => setAnnualGas(e.target.value)}
                    placeholder="Ročná spotreba plynu (kWh)" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="email">Email (na doručenie reportu)</label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="vy@email.sk" required />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" size="lg" disabled={submitting} className="w-full min-h-12">
                {submitting ? "AI vyhodnocuje…" : <>Zistiť zadarmo, či mám dobrú cenu <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          )}

          {mode !== "manual" && error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </div>
    </AppShell>
  );
}

const LABEL = {
  good: { t: "Máš dobrú cenu 👍", c: "border-primary/40 bg-primary/5" },
  average: { t: "Tvoja cena je priemerná", c: "border-border bg-card" },
  overpriced: { t: "Preplácaš za energie", c: "border-destructive/40 bg-destructive/5" },
  unknown: { t: "Zatiaľ nevieme spoľahlivo porovnať", c: "border-border bg-card" },
} as const;

function VerdictCard({ v, onPay, onReset }: { v: FreeVerdict; onPay: () => void; onReset: () => void }) {
  const l = LABEL[v.verdict];
  return (
    <div className={`mb-6 rounded-2xl border p-5 space-y-3 ${l.c}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Bezplatné vyhodnotenie</p>
      <h2 className="text-xl font-bold">{l.t}</h2>
      {v.verdict !== "unknown" && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-background p-3"><p className="text-muted-foreground text-xs">Platíš ročne cca</p><p className="font-bold text-lg">{v.currentAnnual.toFixed(0)} €</p></div>
          <div className="rounded-lg bg-background p-3"><p className="text-muted-foreground text-xs">Môžeš ušetriť</p><p className="font-bold text-lg text-primary">{v.overpay.toFixed(0)} € / rok</p></div>
        </div>
      )}
      <p className="text-sm">{v.summary}</p>
      <p className="text-xs text-muted-foreground">
        Porovnané s {v.tariffsCompared} overenými cenníkmi.{!v.usedOwnPrice && " Nezadal si svoju cenu, počítali sme s bežnou cenou 0,18 €/kWh."} Informatívne odporúčanie.
      </p>
      {v.verdict !== "unknown" && v.overpay > 0 && (
        <Button size="lg" className="w-full min-h-12" onClick={onPay}>
          Odomknúť presný postup za 4,90&nbsp;€ <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      )}
      <Button variant="ghost" className="w-full" onClick={onReset}>Upraviť údaje</Button>
    </div>
  );
}
