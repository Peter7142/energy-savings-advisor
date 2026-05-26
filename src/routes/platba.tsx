import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Search = { product?: "report" | "watch"; quoteId?: string };

const PRICES = {
  report: { id: "savings_report_onetime", label: "Personalizovaný report úspory", amount: "4,90 €" },
  watch: { id: "price_watch_yearly_sub", label: "Ročné sledovanie cien", amount: "9 € / rok" },
} as const;

export const Route = createFileRoute("/platba")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    product: s.product === "watch" ? "watch" : "report",
    quoteId: typeof s.quoteId === "string" ? s.quoteId : undefined,
  }),
  component: PlatbaPage,
});

function PlatbaPage() {
  const { product = "report", quoteId } = useSearch({ from: "/platba" });
  const cfg = PRICES[product as keyof typeof PRICES];
  const [email, setEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? undefined);
      setUserId(data.user?.id ?? undefined);
      setReady(true);
    });
  }, []);

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">← Späť</Link>
        <h1 className="mt-3 text-2xl font-bold">{cfg.label}</h1>
        <p className="text-muted-foreground mb-6">Cena: <strong>{cfg.amount}</strong></p>
        {ready ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <StripeEmbeddedCheckout
              priceId={cfg.id}
              customerEmail={email}
              userId={userId}
              quoteId={quoteId}
              returnUrl={`${window.location.origin}/ucet?session_id={CHECKOUT_SESSION_ID}`}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Načítavam…</p>
        )}
      </div>
    </AppShell>
  );
}
