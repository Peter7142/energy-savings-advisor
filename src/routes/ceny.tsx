import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/ceny")({
  component: () => (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-3">Denné ceny energií</h1>
        <p className="text-muted-foreground">TOP 10 dodávateľov + graf OKTE — pridám po nasadení scraperu.</p>
      </div>
    </AppShell>
  ),
});
