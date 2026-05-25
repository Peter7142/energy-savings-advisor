import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

type Search = { session_id?: string };

export const Route = createFileRoute("/ucet")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  component: UcetPage,
});

function UcetPage() {
  const { session_id } = useSearch({ from: "/ucet" });
  const [orders, setOrders] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (!data.user) return;
      const [{ data: o }, { data: s }] = await Promise.all([
        supabase.from("orders").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }),
      ]);
      setOrders(o ?? []);
      setSubs(s ?? []);
    });
  }, [session_id]);

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">Môj účet</h1>

        {session_id && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Platba prijatá</p>
              <p className="text-sm text-muted-foreground">Tvoj report pripravujeme a pošleme na email.</p>
            </div>
          </div>
        )}

        {!user && (
          <p className="text-muted-foreground">
            Prihlás sa na zobrazenie histórie reportov. <Link to="/" className="underline">Domov</Link>
          </p>
        )}

        {user && (
          <>
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
                <ul className="space-y-2">
                  {subs.map((s) => (
                    <li key={s.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                      <div className="font-medium">{s.price_id}</div>
                      <div className="text-muted-foreground">
                        Stav: {s.status} · Platné do {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("sk-SK") : "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
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
          </>
        )}
      </div>
    </AppShell>
  );
}
