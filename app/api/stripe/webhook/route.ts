// app/api/stripe/webhook/route.ts
import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { getServerSupabase } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/app/api/helpers/error";

// Prosty idempotency check: Stripe event ID już przetworzony?
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return apiError("Brak Stripe signature", 401);
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return apiError("Brak STRIPE_WEBHOOK_SECRET", 500);
    }

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch (err: any) {
      return apiError(`Webhook Error: ${err.message}`, 400);
    }

    // Idempotency: pomijamy jeśli już przetworzyli
    if (processedEvents.has(event.id)) {
      return apiSuccess({ received: true });
    }
    processedEvents.add(event.id);

    const supabase = getServerSupabase();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.client_reference_id || session.metadata?.user_id;

        if (!userId) {
          console.warn("⚠️ Checkout session bez user_id");
          break;
        }

        await supabase.from("stripe_subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: "active"
          },
          { onConflict: "user_id" }
        );

        console.log(`✅ Subscription created for user ${userId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        await supabase
          .from("stripe_subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`✅ Subscription canceled: ${subscription.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        await supabase
          .from("stripe_subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", invoice.subscription);

        console.log(`⚠️ Payment failed: ${invoice.id}`);
        break;
      }
    }

    return apiSuccess({ received: true });
  } catch (error: any) {
    return apiError(error.message || "Webhook error", 500, error);
  }
}
