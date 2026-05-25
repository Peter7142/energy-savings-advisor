import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/ceny")({
  component: CenyPage,
});

function CenyPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-xl">
        <h1 className="text-3xl font-bold mb-3 text-center">Denné ceny energií</h1>
        <p className="text-muted-foreground text-center mb-8">
          TOP 10 dodávateľov + graf OKTE — denne aktualizované.
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Bell className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Ročné sledovanie cien</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Notifikujeme ťa, keď sa objaví lacnejšia ponuka pre tvoj región a spotrebu.
            Štvrťročne dostaneš aktualizovaný report. <strong>9 € / rok.</strong>
          </p>
          <Link to="/platba" search={{ product: "watch" }}>
            <Button size="lg" className="w-full">Aktivovať sledovanie</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
