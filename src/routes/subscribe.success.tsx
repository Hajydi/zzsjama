import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyCheckoutSession } from "@/lib/stripe.functions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/subscribe/success")({
  validateSearch: z.object({ session_id: z.string().optional() }),
  component: SuccessPage,
  head: () => ({ meta: [{ title: "Tak for din tilmelding – ZZS" }] }),
});

function SuccessPage() {
  const { session_id } = useSearch({ from: "/subscribe/success" });
  const navigate = useNavigate();
  const verify = useServerFn(verifyCheckoutSession);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!session_id) {
      setState("error");
      setMsg("Manglende session ID");
      return;
    }
    verify({ data: { sessionId: session_id } })
      .then((r) => {
        if (r.ok) setState("ok");
        else {
          setState("error");
          setMsg("Abonnementet kunne ikke bekræftes");
        }
      })
      .catch((e) => {
        setState("error");
        setMsg(e instanceof Error ? e.message : "Ukendt fejl");
      });
  }, [session_id, verify]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
        {state === "loading" && <p className="text-muted-foreground">Bekræfter betaling…</p>}
        {state === "ok" && (
          <>
            <CheckCircle2 className="mx-auto mb-3 size-14 text-primary" />
            <h1 className="text-2xl font-extrabold">Velkommen ombord!</h1>
            <p className="mt-2 text-muted-foreground">Dit abonnement er aktivt.</p>
            <Button className="mt-6 w-full" onClick={() => navigate({ to: "/" })}>
              Gå til app
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto mb-3 size-14 text-destructive" />
            <h1 className="text-2xl font-extrabold">Hov</h1>
            <p className="mt-2 text-muted-foreground">{msg}</p>
            <Button variant="outline" className="mt-6 w-full" onClick={() => navigate({ to: "/subscribe" })}>
              Prøv igen
            </Button>
          </>
        )}
      </div>
    </div>
  );
}