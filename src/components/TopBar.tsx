import { Link, useRouterState } from "@tanstack/react-router";
import appIcon from "@/assets/app-icon.png";

const links = [
  { to: "/", label: "Domov" },
  { to: "/kalkulacka", label: "Kalkulačka" },
  { to: "/ceny", label: "Ceny" },
  { to: "/ucet", label: "Účet" },
] as const;

export function TopBar() {
  const { location } = useRouterState();
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
        </nav>
      </div>
    </header>
  );
}
