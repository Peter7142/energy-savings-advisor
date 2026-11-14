import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { compare, type TariffLite } from "./advisor";

const Input = z.object({
  distribution_area: z.enum(["ZSD", "SSD", "VSD"]),
  annual_consumption_kwh: z.number().min(100).max(100000),
  tariff_band: z.string().max(10).nullable(),
  current_supplier: z.string().max(100).nullable(),
  current_unit_price: z.number().min(0.01).max(1).nullable(),
  current_monthly_fee: z.number().min(0).max(100).nullable(),
  includes_gas: z.boolean(),
  annual_gas_kwh: z.number().min(0).max(500000).nullable(),
  email: z.string().email().max(255),
  user_id: z.string().uuid().nullable(),
});

export type FreeVerdict = {
  quoteId: string;
  verdict: "good" | "average" | "overpriced" | "unknown";
  currentAnnual: number;
  overpay: number;
  summary: string;
  tariffsCompared: number;
  usedOwnPrice: boolean;
};

const VERDICT_SK = { good: "dobrá", average: "priemerná", overpriced: "predražená", unknown: "zatiaľ neoveriteľná" };

export const submitAndAnalyze = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<{ result: FreeVerdict | null; error: string | null }> => {
    try {
      const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
      const { aiToolCall } = await import("./ai.server");

      const { data: rows } = await db.from("tariffs")
        .select("product_name, unit_price_eur_per_kwh, monthly_fee_eur, source_url, suppliers(name)")
        .eq("status", "validated").eq("segment", "household").eq("energy_type", "electricity")
        .is("valid_to", null)
        .or(`distribution_area.eq.${data.distribution_area},distribution_area.is.null`)
        .limit(200);
      const tariffs: TariffLite[] = (rows ?? []).filter((r: any) => !/adresn/i.test(r.product_name)).map((r: any) => ({
        supplier: r.suppliers?.name ?? "—", product: r.product_name,
        unit: Number(r.unit_price_eur_per_kwh), fee: Number(r.monthly_fee_eur ?? 0), source: r.source_url,
      }));
      const c = compare(data.annual_consumption_kwh, data.current_unit_price, data.current_monthly_fee, tariffs);

      const { data: quote, error } = await db.from("quotes_household").insert({
        user_id: data.user_id, email: data.email, distribution_area: data.distribution_area,
        annual_consumption_kwh: data.annual_consumption_kwh, tariff_band: data.tariff_band,
        current_supplier: data.current_supplier, current_unit_price_eur_per_kwh: data.current_unit_price,
        includes_gas: data.includes_gas, annual_gas_kwh: data.annual_gas_kwh,
        estimated_savings_eur: c.overpay,
      }).select("id").single();
      if (error || !quote) throw error ?? new Error("insert failed");

      // AI explains computed numbers only.
      const facts = {
        spotreba_kwh: data.annual_consumption_kwh, oblast: data.distribution_area,
        dodavatel: data.current_supplier, vlastna_cena_zadana: data.current_unit_price !== null,
        terajsie_rocne_naklady_eur: c.current, verdikt: VERDICT_SK[c.verdict], mozna_uspora_eur: c.overpay,
        pocet_porovnanych_taríf: tariffs.length, najlepsie: c.ranked,
      };
      let summary = c.verdict === "unknown"
        ? "Zatiaľ nemáme dosť overených cenníkov na spoľahlivé porovnanie. Ceny práve zbierame – skús to o pár hodín."
        : `Tvoja cena je ${VERDICT_SK[c.verdict]}. Odhadom môžeš ušetriť ${c.overpay.toFixed(0)} € ročne.`;
      let instructions = "";
      if (c.verdict !== "unknown") {
        const ai = await aiToolCall<{ summary: string; instructions_md: string }>({
          system: "Si nezávislý poradca LacnéEnergie. Píš jednoducho po slovensky. Používaj VÝHRADNE čísla z faktov, nič nevymýšľaj. summary: 2 vety bez mena odporúčaného dodávateľa (to je platená časť). instructions_md: presný postup krok za krokom ako prejsť k najlacnejšej ponuke (výpoveď, lehoty, čo si pripraviť), s menom dodávateľa, produktu, ročnou cenou a úsporou. Na konci upozornenie, že ide o informatívne odporúčanie.",
          user: JSON.stringify(facts),
          toolName: "advice",
          parameters: { type: "object", properties: { summary: { type: "string" }, instructions_md: { type: "string" } }, required: ["summary", "instructions_md"] },
        });
        if (ai.ok) { summary = ai.data.summary; instructions = ai.data.instructions_md; }
      }

      await db.from("quote_analyses").insert({
        quote_id: quote.id, verdict: c.verdict, current_annual_cost_eur: c.current,
        best_annual_cost_eur: c.best?.annual ?? null, overpay_eur: c.overpay, summary,
        instructions_md: instructions || null, recommendations: c.ranked as any, tariffs_compared: tariffs.length,
      });

      return { result: {
        quoteId: quote.id, verdict: c.verdict, currentAnnual: c.current, overpay: c.overpay,
        summary, tariffsCompared: tariffs.length, usedOwnPrice: data.current_unit_price !== null,
      }, error: null };
    } catch (e) {
      console.error("submitAndAnalyze", e);
      return { result: null, error: "Vyhodnotenie sa nepodarilo, skús znova." };
    }
  });
