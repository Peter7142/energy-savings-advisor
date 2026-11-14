// Pure price-comparison math (no AI): AI only explains these numbers.
export type TariffLite = { supplier: string; product: string; unit: number; fee: number; source: string | null };

export const TYPICAL_SK_PRICE = 0.18; // fallback €/kWh when user's own price unknown

export function annualCost(kwh: number, unit: number, monthlyFee: number) {
  return Math.round((kwh * unit + 12 * monthlyFee) * 100) / 100;
}

export function compare(kwh: number, currentUnit: number | null, currentFee: number | null, tariffs: TariffLite[]) {
  const current = annualCost(kwh, currentUnit ?? TYPICAL_SK_PRICE, currentFee ?? 0);
  const ranked = tariffs
    .map((t) => ({ ...t, annual: annualCost(kwh, t.unit, t.fee) }))
    .sort((a, b) => a.annual - b.annual);
  const best = ranked[0] ?? null;
  const overpay = best ? Math.max(0, Math.round((current - best.annual) * 100) / 100) : 0;
  const pct = best && current > 0 ? overpay / current : 0;
  const verdict: "good" | "average" | "overpriced" | "unknown" =
    !best ? "unknown" : pct < 0.03 ? "good" : pct < 0.1 ? "average" : "overpriced";
  return { current, best, ranked: ranked.slice(0, 3), overpay, verdict };
}
