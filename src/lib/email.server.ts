// Server-only email helper.
// Uses Resend via the Lovable connector gateway when RESEND_API_KEY is set;
// otherwise logs to console (dev/preview without Resend).

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;

  if (!resendKey || !lovableKey) {
    console.log("[email:fallback]", { to: opts.to, subject: opts.subject });
    return { ok: false, reason: "Resend not configured (logged only)" };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: "LacnéEnergie <onboarding@resend.dev>",
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend error", res.status, text);
      return { ok: false, reason: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    console.error("[email] send failed", e?.message);
    return { ok: false, reason: e?.message };
  }
}

export function renderReportEmail(opts: {
  estimatedSavings: number;
  distribution: string;
  annualKwh: number;
  reportUrl: string;
}): string {
  const distLabel = ({ zse: "ZSE", sse: "SSE", vse: "VSE" } as any)[opts.distribution] || opts.distribution;
  return `
    <div style="font-family:system-ui,sans-serif;background:#ffffff;color:#0a0a0a;padding:24px;max-width:560px;margin:0 auto;">
      <h1 style="color:#0fa371;margin:0 0 12px 0;">Váš report úspory je pripravený</h1>
      <p>Ďakujeme za nákup. Na základe vašich údajov sme pripravili odhad ročnej úspory.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Distribučná oblasť</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${distLabel}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Ročná spotreba</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${opts.annualKwh.toLocaleString("sk-SK")} kWh</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#0fa371;color:#fff;"><strong>Odhad ročnej úspory</strong></td><td style="padding:8px;border:1px solid #e5e7eb;background:#0fa371;color:#fff;font-size:18px;"><strong>${opts.estimatedSavings} €</strong></td></tr>
      </table>
      <p>Detailný report s TOP 3 dodávateľmi a krok-za-krokom postupom nájdete v účte:</p>
      <p><a href="${opts.reportUrl}" style="display:inline-block;background:#0fa371;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Zobraziť report</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#6b7280;font-style:italic;">
        Foton energy s.r.o. — informačné poradenstvo. Nie sme sprostredkovateľom zmluvy v energetike podľa § 14 zák. 251/2012 Z. z.
      </p>
    </div>
  `;
}
