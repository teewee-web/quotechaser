import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ANALYTICS_EVENTS,
  isAutomatedBrowser,
  isCanonicalAnalyticsHost,
  isProductionAnalyticsEnvironment,
  sanitizeAnalyticsProperties,
} from "../lib/analytics-core";

describe("production analytics data quality", () => {
  it("uses the approved snake_case event taxonomy", () => {
    expect(ANALYTICS_EVENTS).toEqual([
      "registration_completed", "first_customer_created", "first_quote_created",
      "first_follow_up_completed", "checkout_started", "subscription_activated",
      "user_login", "pricing_view", "pdf_generated", "quote_marked_won", "review_request_started",
    ]);
    expect(ANALYTICS_EVENTS.every((event) => /^[a-z]+(?:_[a-z]+)*$/.test(event))).toBe(true);
  });

  it("only permits the canonical production domain", () => {
    expect(isCanonicalAnalyticsHost("quote-chaser.com")).toBe(true);
    for (const host of ["localhost", "127.0.0.1", "quote-chaser.vercel.app", "quotalign.com", "www.quotalign.com", "www.quote-chaser.com"])
      expect(isCanonicalAnalyticsHost(host)).toBe(false);
  });

  it("disables analytics in tests, development, and previews", () => {
    expect(isProductionAnalyticsEnvironment({ NODE_ENV: "test", VERCEL_ENV: "production" })).toBe(false);
    expect(isProductionAnalyticsEnvironment({ NODE_ENV: "development" })).toBe(false);
    expect(isProductionAnalyticsEnvironment({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(false);
    expect(isProductionAnalyticsEnvironment({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(true);
  });

  it("filters automated browsers", () => {
    expect(isAutomatedBrowser("Playwright/1.50 HeadlessChrome")).toBe(true);
    expect(isAutomatedBrowser("Mozilla/5.0 Chrome/140 Safari/537.36")).toBe(false);
  });

  it("drops PII and free text from every payload", () => {
    expect(sanitizeAnalyticsProperties({ source: "quote_flow", channel: "email", email: "person@example.com", phone: "07123", customer_name: "Jane", address: "1 Road", notes: "private", quote_description: "kitchen" } as never))
      .toEqual({ source: "quote_flow", channel: "email" });
  });

  it("uses database uniqueness for first-time and Stripe activation events", () => {
    const migration = readFileSync("supabase/migrations/202607200001_analytics_data_quality.sql", "utf8");
    const actions = readFileSync("app/(app)/actions.ts", "utf8");
    const webhook = readFileSync("app/api/stripe/webhook/route.ts", "utf8");
    expect(migration).toContain("primary key (user_id, event_name)");
    expect(actions).toMatch(/first_customer_created[\s\S]*once: true/);
    expect(actions).toMatch(/first_quote_created[\s\S]*once: true/);
    expect(actions).toMatch(/first_follow_up_completed[\s\S]*once: true/);
    expect(webhook).toMatch(/subscription_activated[\s\S]*once: true/);
    expect(webhook).toContain('includes(object.status || "")');
  });
});
