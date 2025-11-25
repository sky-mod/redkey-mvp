// app/api/stripe/create-checkout-session/route.ts
import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireUser } from "@/lib/supabase/auth";
import { apiError, apiSuccess } from "@/app/api/helpers/error";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const priceId = process.env.STRIPE_PRICE_ID_MONTHLY_99;
    if (!priceId) {
      return apiError("Brak konfiguracji Stripe price ID", 500);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${origin}/dashboard/bug-bounty-pro?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/bug-bounty-pro`,
      metadata: {
        user_id: user.id,
        email: user.email
      },
      client_reference_id: user.id
    });

    return apiSuccess({ id: session.id, url: session.url });
  } catch (error: any) {
    return apiError(
      error.message || "Nie udało się utworzyć sesji Stripe",
      500,
      error
    );
  }
}
