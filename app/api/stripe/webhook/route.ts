import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStripeSignature } from "@/lib/stripe";
import { NextResponse } from "next/server";

type StripeObject = {
  id: string;
  customer?: string;
  subscription?: string;
  status?: string;
  client_reference_id?: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string>;
  items?: { data?: Array<{ current_period_end?: number }> };
};
type StripeEvent = { id: string; type: string; data: { object: StripeObject } };
const acceptedStatuses = new Set(["active", "trialing", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "paused"]);

export async function POST(request: Request) {
  const payload = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: StripeEvent;
  try { event = JSON.parse(payload) as StripeEvent; }
  catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }

  const object = event.data.object;
  const userId = object.metadata?.supabase_user_id || object.client_reference_id;
  const admin = createAdminClient();
  const { data: seen } = await admin.from("stripe_webhook_events").select("event_id").eq("event_id", event.id).maybeSingle();
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  if (event.type === "checkout.session.completed" && userId && object.customer) {
    await admin.from("billing_subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: object.customer,
      stripe_subscription_id: object.subscription || null,
    }, { onConflict: "user_id" });
  }

  if (event.type.startsWith("customer.subscription.") && userId && object.customer && acceptedStatuses.has(object.status || "")) {
    const periodEnd = object.current_period_end || object.items?.data?.[0]?.current_period_end;
    await admin.from("billing_subscriptions").upsert({
      user_id: userId,
      stripe_customer_id: object.customer,
      stripe_subscription_id: object.id,
      status: object.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: !!object.cancel_at_period_end,
    }, { onConflict: "user_id" });
  }

  const { error } = await admin.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type });
  if (error) console.error(JSON.stringify({ level: "error", message: "Stripe event audit failed", eventId: event.id }));
  return NextResponse.json({ received: true });
}

