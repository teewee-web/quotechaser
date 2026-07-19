import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { STRIPE_TRIAL_DAYS, verifyStripeSignature } from "../lib/stripe";

describe("Stripe subscription settings", () => {
  it("uses a seven-day trial", () => {
    expect(STRIPE_TRIAL_DAYS).toBe(7);
  });
});

describe("Stripe webhook signatures", () => {
  it("accepts a current correctly signed payload", () => {
    vi.setSystemTime(new Date("2026-07-19T12:00:00Z"));
    const payload = JSON.stringify({ id: "evt_test" });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac("sha256", "whsec_test").update(`${timestamp}.${payload}`).digest("hex");
    expect(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, "whsec_test")).toBe(true);
    vi.useRealTimers();
  });

  it("rejects altered and expired payloads", () => {
    vi.setSystemTime(new Date("2026-07-19T12:00:00Z"));
    const old = Math.floor(Date.now() / 1000 - 600).toString();
    const signature = createHmac("sha256", "whsec_test").update(`${old}.original`).digest("hex");
    expect(verifyStripeSignature("changed", `t=${old},v1=${signature}`, "whsec_test")).toBe(false);
    vi.useRealTimers();
  });
});
