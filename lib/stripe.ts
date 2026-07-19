import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";

function secretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  return key;
}

export async function stripeRequest<T>(path: string, body: URLSearchParams): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const result = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    console.error(JSON.stringify({ level: "error", message: "Stripe request failed", path, status: response.status }));
    throw new Error(result.error?.message || "Stripe could not complete the request.");
  }
  return result;
}

export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSeconds = 300) {
  if (!header || !secret) return false;
  const parts = header.split(",").map((part) => part.split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBytes = Buffer.from(expected);
  return signatures.some((signature) => {
    const received = Buffer.from(signature || "");
    return received.length === expectedBytes.length && timingSafeEqual(received, expectedBytes);
  });
}

export type StripeSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused";


