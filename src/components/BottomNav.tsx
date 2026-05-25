import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calculator, LineChart, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Domov", icon: Home },
  { to: "/kalkulacka", label: "Kalkulačka", icon: Calculator },
  { to: "/ceny", label: "Ceny", icon: LineChart },
  { to: "/ucet", label: "Účet", icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur safe-bottom">
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-2 min-h-12 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
