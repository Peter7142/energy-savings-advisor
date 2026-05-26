import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { parseInvoice } from "@/lib/invoice-parser.functions";
import { ArrowRight, Upload, Loader2, Sparkles, ShieldCheck, Camera, Pencil } from "lucide-react";

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
  const [mode, setMode] = useState<"upload" | "photo" | "manual">("upload");
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const callParseInvoice = useServerFn(parseInvoice);

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
      const userId = userData.user?.id ?? null;
      const userEmail = userData.user?.email ?? email ?? null;

      // Estimate savings: simple heuristic — assume 10% saving vs typical SK price 0.18 €/kWh
      const estSavings = Math.round(kwh * 0.18 * 0.10);

      const { data, error } = await supabase
        .from("quotes_household")
        .insert({
          user_id: userId,
          email: userEmail,
          distribution_area: distribution as any,
          annual_consumption_kwh: kwh,
          tariff_band: tariff === "Neviem" ? null : tariff,
          current_supplier: supplier || null,
          includes_gas: includesGas,
          annual_gas_kwh: includesGas ? Number(annualGas) : null,
          estimated_savings_eur: estSavings,
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate({ to: "/platba", search: { product: "report", quoteId: data.id } });
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
          Vyplň 5 polí, my pripravíme personalizovaný report za 4,90 €.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-1" /> Nahrať</TabsTrigger>
              <TabsTrigger value="photo"><Camera className="w-4 h-4 mr-1" /> Odfotiť</TabsTrigger>
              <TabsTrigger value="manual"><Pencil className="w-4 h-4 mr-1" /> Ručne</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-3">
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
            </TabsContent>

            <TabsContent value="photo" className="mt-3">
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
            </TabsContent>

            <TabsContent value="manual" className="mt-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-2">
                  <Pencil className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Zadaj údaje ručne</p>
                    <p className="text-xs text-muted-foreground">Vyplň polia nižšie podľa tvojho posledného vyúčtovania.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div>
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
            {submitting ? "Pripravujem…" : <>Pokračovať na platbu 4,90&nbsp;€ <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
