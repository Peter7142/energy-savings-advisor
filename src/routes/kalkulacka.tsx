import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/kalkulacka")({
  component: () => (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-3">Kalkulačka úspory</h1>
        <p className="text-muted-foreground">5-krokový dotazník pre domácnosti a firmy dorobím v ďalšom kole.</p>
      </div>
    </AppShell>
  ),
});
