import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Sparkles, LogOut } from "lucide-react";
import { createCheckoutSession, getSubscriptionStatus } from "@/lib/stripe.functions";
import zzsLogo from "@/assets/zzs-logo.png";
import jamaLogo from "@/assets/jama-consulting-logo.png";

export const Route = createFileRoute("/subscribe")({
  component: SubscribePage,
  head: () => ({
    meta: [
      { title: "Tegn abonnement – ZZS" },
      { name: "description", content: "Få fuld adgang til ZZS aktivitets-app for kun 39 kr/md. 3 dages gratis prøveperiode." },
    ],
  }),
});

function SubscribePage() {
  const navigate = useNavigate();
  const startCheckout = useServerFn(createCheckoutSession);
  const checkStatus = useServerFn(getSubscriptionStatus);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setAuthChecked(true);
        checkStatus().then((s) => {
          if (s.active && s.status === "active") {
            navigate({ to: "/" });
          }
        });
      }
    });
  }, [navigate, checkStatus]);

  const handleSubscribe = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await startCheckout({ data: { origin: window.location.origin } });
      if (res.url) window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunne ikke starte betaling");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Indlæser…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="mb-6 flex items-center justify-between">
          <img src={zzsLogo} alt="ZZS" className="h-14 w-auto" />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" /> Log ud
          </Button>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" /> Fuld adgang fra dag 1
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Få fuld adgang til ZZS
          </h1>
          <p className="mt-2 text-muted-foreground">
            For kun <span className="font-bold text-foreground">39 kr/md</span> får du:
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              "Ubegrænset antal børn",
              "Ubegrænsede mål og aktiviteter",
              "Belønningssystem med point",
              "Data følger din konto på alle enheder",
              "Hurra-animationer der motiverer børnene",
              "Ingen reklamer",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            variant="kid"
            size="kid"
            className="mt-6 w-full"
          >
            {loading ? "Sender dig til betaling…" : "Tegn abonnement – 39 kr/md"}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Du opsiger når som helst i Stripe-portalen.
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">← Tilbage</Link>
        </p>

        <div className="mt-auto flex flex-col items-center gap-2 pt-10">
          <img src={jamaLogo} alt="Jama Consulting" className="h-12 w-auto opacity-70" />
          <p className="text-xs text-muted-foreground">Udviklet af Jama Consulting</p>
        </div>
      </div>
    </div>
  );
}