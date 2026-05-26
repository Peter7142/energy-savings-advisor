import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  // data URL (e.g. "data:image/jpeg;base64,...") or raw base64 with mimeType
  dataUrl: z.string().min(20).max(15_000_000), // ~10MB after base64
  mimeType: z.string().min(3).max(100),
});

const ResultSchema = z.object({
  distribution_area: z.enum(["ZSD", "SSD", "VSD"]).nullable(),
  annual_consumption_kwh: z.number().nullable(),
  tariff_band: z.string().nullable(),
  current_supplier: z.string().nullable(),
  includes_gas: z.boolean().nullable(),
  annual_gas_kwh: z.number().nullable(),
  notes: z.string().nullable(),
});

export type ParsedInvoice = z.infer<typeof ResultSchema>;

export const parseInvoice = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ parsed: ParsedInvoice | null; error: string | null }> => {
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) return { parsed: null, error: "AI služba nie je nakonfigurovaná." };

      const dataUrl = data.dataUrl.startsWith("data:")
        ? data.dataUrl
        : `data:${data.mimeType};base64,${data.dataUrl}`;

      const systemPrompt = `Si expert na slovenské faktúry za elektrinu a plyn. Z obrázku/PDF faktúry extrahuj presné údaje. Distribučná oblasť: ZSD (Západoslovenská), SSD (Stredoslovenská), VSD (Východoslovenská) — odvodiš podľa dodávateľa alebo regiónu. Ak údaj nie je viditeľný, vráť null. Neuhádni.`;

      const userPrompt = `Vyplň polia:
- distribution_area: ZSD/SSD/VSD alebo null
- annual_consumption_kwh: ročná spotreba elektriny v kWh (ak je len mesačná, vynásob 12)
- tariff_band: DD1/DD2/DD3/DD4 alebo null
- current_supplier: presný názov dodávateľa (napr. "ZSE", "SSE", "VSE", "Magna Energia", "Slovak Energy", "ČEZ")
- includes_gas: true ak faktúra obsahuje aj plyn
- annual_gas_kwh: ročná spotreba plynu v kWh alebo null
- notes: krátka poznámka (napr. obdobie faktúry) alebo null`;

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_invoice_data",
                description: "Odovzdaj extrahované údaje z faktúry",
                parameters: {
                  type: "object",
                  properties: {
                    distribution_area: { type: ["string", "null"], enum: ["ZSD", "SSD", "VSD", null] },
                    annual_consumption_kwh: { type: ["number", "null"] },
                    tariff_band: { type: ["string", "null"] },
                    current_supplier: { type: ["string", "null"] },
                    includes_gas: { type: ["boolean", "null"] },
                    annual_gas_kwh: { type: ["number", "null"] },
                    notes: { type: ["string", "null"] },
                  },
                  required: [
                    "distribution_area",
                    "annual_consumption_kwh",
                    "tariff_band",
                    "current_supplier",
                    "includes_gas",
                    "annual_gas_kwh",
                    "notes",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "submit_invoice_data" } },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return { parsed: null, error: "Príliš veľa požiadaviek, skús o chvíľu." };
        if (res.status === 402) return { parsed: null, error: "AI kredit vyčerpaný." };
        return { parsed: null, error: `AI služba zlyhala (${res.status}).` };
      }

      const json = await res.json();
      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      const argsStr = toolCall?.function?.arguments;
      if (!argsStr) return { parsed: null, error: "AI nevedela prečítať údaje. Skús ostrejšiu fotku." };

      const parsed = ResultSchema.parse(JSON.parse(argsStr));
      return { parsed, error: null };
    } catch (err) {
      console.error("parseInvoice failed", err);
      return { parsed: null, error: "Nepodarilo sa spracovať faktúru." };
    }
  });
