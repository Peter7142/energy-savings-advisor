// Shared AI helper: calls Lovable AI with a forced tool call and returns parsed JSON args.
export async function aiToolCall<T>(opts: {
  system: string;
  user: string;
  toolName: string;
  parameters: Record<string, unknown>;
}): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false, status: 500, error: "AI nie je nakonfigurovaná" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      tools: [{ type: "function", function: { name: opts.toolName, description: opts.toolName, parameters: opts.parameters } }],
      tool_choice: { type: "function", function: { name: opts.toolName } },
    }),
  });
  if (!res.ok) return { ok: false, status: res.status, error: (await res.text()).slice(0, 300) };
  const json = await res.json();
  const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return { ok: false, status: 200, error: "AI nevrátila údaje" };
  try {
    return { ok: true, data: JSON.parse(args) as T };
  } catch {
    return { ok: false, status: 200, error: "Neplatná odpoveď AI" };
  }
}
