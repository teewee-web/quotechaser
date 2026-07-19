import { createClient } from "@/lib/supabase/server";
import { STRIPE_TRIAL_DAYS, stripeRequest } from "@/lib/stripe";
import { NextResponse } from "next/server";

type CheckoutSession = { url: string | null };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.redirect(new URL("/login?next=/settings", request.url), 303);
  const price = process.env.STRIPE_PRICE_ID;
  if (!price) return NextResponse.redirect(new URL("/settings?billing=unavailable", request.url), 303);

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    customer_email: user.email,
    client_reference_id: user.id,
    "metadata[supabase_user_id]": user.id,
    "subscription_data[metadata][supabase_user_id]": user.id,
    "subscription_data[trial_period_days]": String(STRIPE_TRIAL_DAYS),
    success_url: `${origin}/settings?billing=success`,
    cancel_url: `${origin}/settings?billing=cancelled`,
    allow_promotion_codes: "true",
  });

  try {
    const session = await stripeRequest<CheckoutSession>("/checkout/sessions", form);
    if (!session.url) throw new Error("Stripe did not return a checkout address.");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Checkout creation failed", userId: user.id, error: error instanceof Error ? error.message : String(error) }));
    return NextResponse.redirect(new URL("/settings?billing=error", request.url), 303);
  }
}
