import { aiToolCall } from "./ai.server";

const SUPPLIERS_PER_RUN = 3;
const LOCK_MINUTES = 15;
const MAX_CHANGE = 0.15; // 15 % jump needs second-source confirmation
const MIN_PRICE = 0.05;
const MAX_PRICE = 0.5;

type Extracted = {
  tariffs: Array<{
    product_name: string;
    energy_type: "electricity" | "gas";
    unit_price_eur_per_kwh: number;
    monthly_fee_eur: number | null;
    tariff_band: string | null;
    distribution_area: "ZSD" | "SSD" | "VSD" | null;
    fixation_months: number | null;
    includes_vat: boolean;
  }>;
};

async function firecrawlSearch(query: string) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw Object.assign(new Error("FIRECRAWL_API_KEY missing"), { status: 500 });
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      query,
      limit: 2,
      lang: "sk",
      country: "sk",
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  if (!res.ok) throw Object.assign(new Error(`Firecrawl ${res.status}: ${(await res.text()).slice(0, 200)}`), { status: res.status });
  const json = await res.json();
  return (json?.data?.web ?? []) as Array<{ url: string; markdown?: string }>;
}

const extractSchema = {
  type: "object",
  properties: {
    tariffs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          energy_type: { type: "string", enum: ["electricity", "gas"] },
          unit_price_eur_per_kwh: { type: "number" },
          monthly_fee_eur: { type: ["number", "null"] },
          tariff_band: { type: ["string", "null"] },
          distribution_area: { type: ["string", "null"], enum: ["ZSD", "SSD", "VSD", null] },
          fixation_months: { type: ["number", "null"] },
          includes_vat: { type: "boolean" },
        },
        required: ["product_name", "energy_type", "unit_price_eur_per_kwh", "monthly_fee_eur", "tariff_band", "distribution_area", "fixation_months", "includes_vat"],
      },
    },
  },
  required: ["tariffs"],
};

/** One bounded, locked scan run. Returns a summary; never throws for per-supplier errors. */
export async function runPriceScan(supabase: any) {
  const now = new Date();
  const { data: state } = await supabase.from("scan_state").select("*").eq("id", 1).single();
  if (state?.status === "paused") return { skipped: "paused", reason: state.pause_reason };
  if (state?.locked_until && new Date(state.locked_until) > now) return { skipped: "locked" };

  await supabase.from("scan_state").update({
    locked_until: new Date(now.getTime() + LOCK_MINUTES * 60000).toISOString(),
  }).eq("id", 1);

  const summary: any = { suppliers: [], validated: 0, needs_review: 0, errors: 0 };
  try {
    const { data: suppliers } = await supabase
      .from("suppliers").select("id, name, website_url")
      .eq("is_active", true)
      .order("last_scraped_at", { ascending: true, nullsFirst: true })
      .limit(SUPPLIERS_PER_RUN);

    for (const s of suppliers ?? []) {
      try {
        const domain = s.website_url ? new URL(s.website_url).hostname.replace(/^www\./, "") : "";
        const results = await firecrawlSearch(`${s.name} cenník elektrina domácnosti ${now.getFullYear()} ${domain ? "site:" + domain : ""}`.trim());
        const page = results.find((r) => r.markdown && r.markdown.length > 200);
        await supabase.from("suppliers").update({ last_scraped_at: now.toISOString() }).eq("id", s.id);
        if (!page) { summary.suppliers.push({ name: s.name, found: 0 }); continue; }

        const ai = await aiToolCall<Extracted>({
          system: "Si analytik slovenských cenníkov energií. Extrahuj IBA ceny, ktoré sú výslovne uvedené v texte pre domácnosti. Nič nevymýšľaj. Cenu za kWh uveď v EUR (ak je v €/MWh, vydeľ 1000). Ak nie sú ceny, vráť prázdne pole.",
          user: `Dodávateľ: ${s.name}\nZdroj: ${page.url}\n\n${page.markdown!.slice(0, 18000)}`,
          toolName: "submit_tariffs",
          parameters: extractSchema,
        });
        if (!ai.ok) {
          if (ai.status === 402 || ai.status === 403) throw Object.assign(new Error(ai.error), { status: ai.status, fatal: true });
          throw new Error(ai.error);
        }

        let found = 0;
        for (const t of ai.data.tariffs.slice(0, 10)) {
          if (!t.product_name || !(t.unit_price_eur_per_kwh > 0)) continue;
          found++;
          const { data: prev } = await supabase.from("tariffs").select("id, unit_price_eur_per_kwh")
            .eq("supplier_id", s.id).eq("product_name", t.product_name).eq("energy_type", t.energy_type)
            .eq("status", "validated").is("valid_to", null).maybeSingle();

          const outOfRange = t.unit_price_eur_per_kwh < MIN_PRICE || t.unit_price_eur_per_kwh > MAX_PRICE;
          const change = prev ? Math.abs(t.unit_price_eur_per_kwh - prev.unit_price_eur_per_kwh) / prev.unit_price_eur_per_kwh : 0;
          if (prev && change < 0.001) continue; // unchanged

          // Second-source check for big jumps: a different page must show the same price.
          let confirmed = !outOfRange && change <= MAX_CHANGE;
          if (!outOfRange && change > MAX_CHANGE) {
            const other = results.find((r) => r.url !== page.url && r.markdown);
            const needle = t.unit_price_eur_per_kwh.toFixed(4).replace(".", ",").replace(/0+$/, "");
            confirmed = !!other?.markdown && (other.markdown.includes(needle) || other.markdown.includes(needle.replace(",", ".")));
          }
          const status = confirmed ? "validated" : "needs_review";
          if (confirmed && prev) {
            await supabase.from("tariffs").update({ valid_to: now.toISOString().slice(0, 10) }).eq("id", prev.id);
          }
          const { data: ins } = await supabase.from("tariffs").insert({
            supplier_id: s.id,
            product_name: t.product_name,
            energy_type: t.energy_type,
            segment: "household",
            unit_price_eur_per_kwh: t.unit_price_eur_per_kwh,
            monthly_fee_eur: t.monthly_fee_eur,
            tariff_band: t.tariff_band,
            distribution_area: t.distribution_area,
            fixation_months: t.fixation_months,
            source_url: page.url,
            status,
            notes: t.includes_vat ? "s DPH" : "bez DPH",
            valid_from: now.toISOString().slice(0, 10),
          }).select("id").single();
          await supabase.from("tariff_audit").insert({
            supplier_id: s.id, tariff_id: ins?.id ?? null, source_url: page.url, http_status: 200,
            raw_payload: t, validation_diff: { previous: prev?.unit_price_eur_per_kwh ?? null, change, outOfRange, status },
          });
          if (status === "validated") summary.validated++; else summary.needs_review++;
        }
        summary.suppliers.push({ name: s.name, found });
      } catch (e: any) {
        if (e?.fatal || e?.status === 402) {
          await supabase.from("scan_state").update({ status: "paused", pause_reason: `Kredity/oprávnenie: ${e.message}` }).eq("id", 1);
          summary.paused = true;
          break;
        }
        summary.errors++;
        summary.suppliers.push({ name: s.name, error: String(e?.message ?? e).slice(0, 200) });
        if (e?.status === 429) break;
      }
    }
  } finally {
    await supabase.from("scan_state").update({
      locked_until: null, last_run_at: new Date().toISOString(), last_result: summary,
    }).eq("id", 1);
  }
  return summary;
}
