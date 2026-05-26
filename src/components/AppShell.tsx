import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PaymentTestModeBanner />
      <TopBar />
      <main className="flex-1 pb-24 lg:pb-8">{children}</main>

      <footer className="hidden lg:block border-t border-border bg-background mt-12">
        <div className="container mx-auto px-4 py-8 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Foton energy s.r.o.</p>
          <p>Nezávislí internetový poradca lacnejších energií · lacneenergie.sk</p>
          <p className="mt-2 italic">
            Informačné poradenstvo. Foton energy s.r.o. nie je sprostredkovateľom zmluvy v energetike podľa § 14 zák. 251/2012 Z. z.
          </p>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
