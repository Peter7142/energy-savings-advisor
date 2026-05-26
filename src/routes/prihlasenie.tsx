import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle2 } from "lucide-react";
import appIcon from "@/assets/app-icon.png";

type Search = { redirect?: string };

export const Route = createFileRoute("/prihlasenie")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: PrihlaseniePage,
});

function PrihlaseniePage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as Search;
  const redirect = search.redirect;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: (redirect as any) || "/ucet" });
    });
  }, [navigate, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}${redirect || "/ucet"}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-md">
        <div className="text-center mb-6">
          <img src={appIcon} alt="" width={56} height={56} className="mx-auto rounded-xl mb-3" />
          <h1 className="text-2xl font-bold">Prihláste sa do LacnéEnergie</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pošleme vám odkaz na prihlásenie. Žiadne heslo.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Skontrolujte váš email</p>
              <p className="text-sm text-muted-foreground">
                Odkaz na prihlásenie sme poslali na <strong>{email}</strong>. Kliknutím v emaile sa prihlásite.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <label className="block text-sm font-medium" htmlFor="email">Email adresa</label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vy@email.sk"
              autoComplete="email"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || !email} className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              {loading ? "Posielam…" : "Poslať prihlasovací odkaz"}
            </Button>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Prihlásením súhlasíte s{" "}
              <a href="/obchodne-podmienky" className="underline">obchodnými podmienkami</a> a{" "}
              <a href="/ochrana-udajov" className="underline">ochranou údajov</a>.
            </p>
          </form>
        )}
      </div>
    </AppShell>
  );
}
