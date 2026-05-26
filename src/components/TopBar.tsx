import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import appIcon from "@/assets/app-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Domov" },
  { to: "/kalkulacka", label: "Kalkulačka" },
  { to: "/ceny", label: "Ceny" },
  { to: "/ucet", label: "Účet" },
] as const;

export function TopBar() {
  const { location } = useRouterState();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur safe-top">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={appIcon} alt="LacnéEnergie" width={32} height={32} className="rounded-lg w-8 h-8" />
          <span className="font-bold text-base">
            <span className="font-light">Lacné</span>Energie
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {email ? (
            <div className="flex items-center gap-2 pl-3 ml-2 border-l border-border">
              <span className="text-xs text-muted-foreground max-w-[160px] truncate" title={email}>
                <UserIcon className="w-3 h-3 inline mr-1" />{email}
              </span>
              <Button size="sm" variant="ghost" onClick={signOut} aria-label="Odhlásiť">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <a href="/prihlasenie" className="ml-2">
              <Button size="sm" variant="outline">Prihlásiť</Button>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
