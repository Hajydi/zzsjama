import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY;
        const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret || !whSecret) {
          return new Response("Missing Stripe configuration", { status: 500 });
        }
        const stripe = new Stripe(secret, {
          apiVersion: "2024-11-20.acacia" as any,
          httpClient: Stripe.createFetchHttpClient(),
        });

        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("Missing signature", { status: 400 });
        const body = await request.text();

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            sig,
            whSecret,
            undefined,
            Stripe.createSubtleCryptoProvider(),
          );
        } catch (err) {
          console.error("[stripe-webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              const userId =
                (session.metadata?.user_id as string | undefined) ??
                (session.client_reference_id ?? undefined);
              if (!userId) break;
              const subId =
                typeof session.subscription === "string"
                  ? session.subscription
                  : session.subscription?.id;
              const customerId =
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id ?? null;
              await supabaseAdmin
                .from("subscriptions")
                .update({
                  status: "active",
                  paddle_subscription_id: subId ?? null,
                  paddle_customer_id: customerId,
                  plan: "monthly_39_dkk",
                } as any)
                .eq("user_id", userId);
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              const userId =
                (sub.metadata?.user_id as string | undefined) ?? undefined;
              const periodEnd: number | undefined =
                (sub as any).current_period_end ??
                (sub as any).items?.data?.[0]?.current_period_end;
              const newStatus =
                event.type === "customer.subscription.deleted"
                  ? "canceled"
                  : sub.status;

              const update: any = {
                status: newStatus,
                paddle_subscription_id: sub.id,
                current_period_end: periodEnd
                  ? new Date(periodEnd * 1000).toISOString()
                  : null,
              };

              if (userId) {
                await supabaseAdmin
                  .from("subscriptions")
                  .update(update)
                  .eq("user_id", userId);
              } else {
                await supabaseAdmin
                  .from("subscriptions")
                  .update(update)
                  .eq("paddle_subscription_id", sub.id);
              }
              break;
            }
            case "invoice.payment_failed": {
              const inv = event.data.object as Stripe.Invoice;
              const subId =
                typeof (inv as any).subscription === "string"
                  ? (inv as any).subscription
                  : (inv as any).subscription?.id;
              if (subId) {
                await supabaseAdmin
                  .from("subscriptions")
                  .update({ status: "past_due" } as any)
                  .eq("paddle_subscription_id", subId);
              }
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error("[stripe-webhook] handler error", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});