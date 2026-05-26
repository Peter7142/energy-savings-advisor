import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/kalkulacka")({
  component: KalkulackaPage,
});

const DIST = [
  { v: "zse", label: "Západoslovenská (ZSE)" },
  { v: "sse", label: "Stredoslovenská (SSE)" },
  { v: "vse", label: "Východoslovenská (VSE)" },
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
