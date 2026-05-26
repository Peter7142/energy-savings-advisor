import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, LogOut, ExternalLink } from "lucide-react";
import { createPortalSession } from "@/lib/payments.functions";
import { useServerFn } from "@tanstack/react-start";
import { getStripeEnvironment } from "@/lib/stripe";

type Search = { session_id?: string; report?: string };

export const Route = createFileRoute("/_authenticated/ucet")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    report: typeof s.report === "string" ? s.report : undefined,
  }),
  component: UcetPage,
});

function UcetPage() {
  const { session_id, report } = useSearch({ from: "/_authenticated/ucet" });
  const [orders, setOrders] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const openPortal = useServerFn(createPortalSession);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (!data.user) return;
      const [{ data: o }, { data: s }, { data: r }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
      ]);
      setOrders(o ?? []);
      setSubs(s ?? []);
      setReports(r ?? []);
    });
  }, [session_id]);

  async function handlePortal() {
    setBusy(true);
    try {
      const result = await openPortal({
        data: {
          returnUrl: `${window.location.origin}/ucet`,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in result) {
        alert(result.error);
        return;
      }
      window.open(result.url, "_blank");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Môj účet</h1>
            {user && <p className="text-sm text-muted-foreground">{user.email}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-1" /> Odhlásiť
          </Button>
        </div>

        {session_id && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Platba prijatá</p>
              <p className="text-sm text-muted-foreground">Report sme pripravili — pozri sekciu nižšie alebo email.</p>
            </div>
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Predplatné</h2>
          {subs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-3">Nemáš aktívne predplatné.</p>
              <Link to="/platba" search={{ product: "watch" }}>
                <Button size="sm">Aktivovať sledovanie cien (9 €/rok)</Button>
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-2 mb-3">
                {subs.map((s) => (
                  <li key={s.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                    <div className="font-medium">{s.price_id}</div>
                    <div className="text-muted-foreground">
                      Stav: {s.status} · Platné do {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("sk-SK") : "—"}
                      {s.cancel_at_period_end && " · Zrušené ku koncu obdobia"}
                    </div>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" onClick={handlePortal} disabled={busy}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Spravovať predplatné
              </Button>
            </>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Reporty a nákupy</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Zatiaľ žiadne nákupy.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-border bg-card p-4 text-sm flex justify-between">
                  <div>
                    <div className="font-medium">{o.product_label}</div>
                    <div className="text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("sk-SK")} · {(o.amount_cents / 100).toFixed(2)} €
                    </div>
                  </div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{o.status}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {reports.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Tvoje odporúčania</h2>
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className={`rounded-xl border p-4 ${report === r.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className="font-medium mb-1">
                    Odhad ročnej úspory: <span className="text-primary">{Number(r.estimated_savings_eur).toFixed(0)} €</span>
                  </div>
                  {Array.isArray(r.top_recommendations) && r.top_recommendations.length > 0 ? (
                    <table className="w-full text-xs mt-2">
                      <thead className="text-muted-foreground">
                        <tr><th className="text-left py-1">Dodávateľ</th><th className="text-left py-1">Produkt</th><th className="text-right py-1">€/kWh</th></tr>
                      </thead>
                      <tbody>
                        {r.top_recommendations.map((rec: any, i: number) => (
                          <tr key={i} className="border-t border-border">
                            <td className="py-1">{rec.supplier}</td>
                            <td className="py-1">{rec.product}</td>
                            <td className="py-1 text-right">{Number(rec.unit_price).toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Pripravujeme detailný zoznam dodávateľov. Pošleme aktualizáciu na email.
                    </p>
                  )}
                  {r.instructions_md && <p className="text-xs text-muted-foreground mt-2">{r.instructions_md}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
