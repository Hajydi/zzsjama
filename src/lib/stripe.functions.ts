import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, {
    apiVersion: "2024-11-20.acacia" as any,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ origin: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const stripe = getStripe();
    const userId = context.userId;

    // Look up existing customer if any
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: sub?.paddle_customer_id ?? undefined,
      customer_email: sub?.paddle_customer_id ? undefined : (profile?.email ?? undefined),
      client_reference_id: userId,
      subscription_data: {
        metadata: { user_id: userId },
      },
      metadata: { user_id: userId },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "dkk",
            unit_amount: 3900,
            recurring: { interval: "month" },
            product_data: {
              name: "ZZS abonnement",
              description: "Månedligt abonnement til ZZS aktivitets-app",
            },
          },
        },
      ],
      success_url: `${data.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/subscribe`,
      allow_promotion_codes: true,
    });

    return { url: session.url };
  });

export const verifyCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ sessionId: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
      expand: ["subscription"],
    });
    if (session.client_reference_id !== context.userId) {
      throw new Error("Session does not belong to this user");
    }
    const subscription = session.subscription as any;
    if (!subscription) {
      return { ok: false, status: "no_subscription" as const };
    }
    const periodEnd: number | undefined =
      subscription.current_period_end ??
      subscription.items?.data?.[0]?.current_period_end;
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: subscription.status === "trialing" ? "trialing" : "active",
        paddle_subscription_id: subscription.id,
        paddle_customer_id:
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        plan: "monthly_39_dkk",
      } as any)
      .eq("user_id", context.userId);
    return { ok: true, status: subscription.status };
  });

export const getSubscriptionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("status, trial_ends_at, current_period_end")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!data) return { active: false, status: "none", trialEndsAt: null };
    const now = Date.now();
    const trialActive =
      data.status === "trialing" && data.trial_ends_at && new Date(data.trial_ends_at).getTime() > now;
    const subActive =
      data.status === "active" &&
      (!data.current_period_end || new Date(data.current_period_end).getTime() > now);
    return {
      active: Boolean(trialActive || subActive),
      status: data.status,
      trialEndsAt: data.trial_ends_at,
      currentPeriodEnd: data.current_period_end,
    };
  });