import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { SegmentToggle, type Segment } from "@/components/SegmentToggle";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [segment, setSegment] = useState<Segment>("household");

  return (
    <AppShell>
      <section className="container mx-auto px-4 pt-6 pb-12 lg:pt-16 lg:pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground mb-4">
            <Zap className="w-3 h-3 text-primary" /> Internetový poradca lacnejších energií
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            Za <span className="brand-text-gradient">2,21&nbsp;€</span> ušetríš ročne
            <br />
            <span className="brand-text-gradient">stovky eur</span> na energiách
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Denne porovnávame ceny <strong>všetkých</strong> dodávateľov elektriny a plynu na Slovensku. Povieme ti
            presne, kde a koľko ušetríš.
          </p>
        </div>

        <div className="mt-8">
          <SegmentToggle value={segment} onChange={setSegment} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={segment}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-8 max-w-xl mx-auto"
          >
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              {segment === "household" ? (
                <>
                  <h2 className="text-xl font-bold mb-2">Pre domácnosť</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Odpovedz na 5 otázok (región, spotreba, dodávateľ) a za 2 € dostaneš personalizovaný report: TOP 3
                    najlacnejší dodávatelia + presná ročná úspora v eurách + krok-za-krokom postup, ako prejsť.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-2">Pre firmy</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vyplň krátky dotazník (IČO, spotreba, aktuálny dodávateľ). Vypracujeme ti ponuku{" "}
                    <strong>na mieru</strong> a pošleme do 24 hodín na email.
                  </p>
                </>
              )}
              <Link to="/kalkulacka">
                <Button size="lg" className="w-full min-h-12 text-base font-semibold">
                  {segment === "household" ? "Zisti, kde ušetríš" : "Žiadam ponuku na mieru"}
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Zap, title: "Denné ceny", text: "Sledujeme všetkých SK dodávateľov elektriny a plynu denne." },
            { icon: Shield, title: "Overené zdroje", text: "OKTE, ÚRSO, cenníky dodávateľov. Anomálie validujeme." },
            { icon: Clock, title: "Výsledok do 1 minúty", text: "5 otázok → presný výpočet úspory za rok." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <f.icon className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground italic max-w-xl mx-auto">
          Informačné poradenstvo. Foton energy s.r.o. nie je sprostredkovateľom zmluvy v energetike podľa § 14 zák.
          251/2012 Z. z.
        </p>
      </section>
    </AppShell>
  );
}
