import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [state, setState] = useState<"checking" | "ok" | "out">("checking");
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setState("ok");
      else {
        const here = window.location.pathname + window.location.search;
        window.location.replace(`/prihlasenie?redirect=${encodeURIComponent(here)}`);
        setState("out");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        const here = window.location.pathname + window.location.search;
        window.location.replace(`/prihlasenie?redirect=${encodeURIComponent(here)}`);
      } else setState("ok");
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (state !== "ok") {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Načítavam…</div>;
  }
  return <Outlet />;
}
