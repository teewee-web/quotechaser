import { createClient } from "@/lib/supabase/server";
import { stripeRequest } from "@/lib/stripe";
import { NextResponse } from "next/server";

type PortalSession = { url: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/settings", request.url), 303);
  const { data: billing } = await supabase.from("billing_subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!billing?.stripe_customer_id) return NextResponse.redirect(new URL("/settings?billing=missing", request.url), 303);
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  try {
    const session = await stripeRequest<PortalSession>("/billing_portal/sessions", new URLSearchParams({
      customer: billing.stripe_customer_id,
      return_url: `${origin}/settings`,
    }));
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Billing portal creation failed", userId: user.id, error: error instanceof Error ? error.message : String(error) }));
    return NextResponse.redirect(new URL("/settings?billing=error", request.url), 303);
  }
}


