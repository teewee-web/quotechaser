export const ANALYTICS_EVENTS = [
  "registration_completed",
  "first_customer_created",
  "first_quote_created",
  "first_follow_up_completed",
  "checkout_started",
  "subscription_activated",
  "user_login",
  "pricing_view",
  "pdf_generated",
  "quote_marked_won",
  "review_request_started",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
export type AnalyticsProperties = Record<string, string | number | boolean>;

const allowedProperties = new Set([
  "source",
  "channel",
  "page_path",
  "page_title",
  "debug_mode",
]);

export function sanitizeAnalyticsProperties(properties: AnalyticsProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) => allowedProperties.has(key) && ["string", "number", "boolean"].includes(typeof value),
    ),
  ) as AnalyticsProperties;
}

export function isCanonicalAnalyticsHost(hostname: string) {
  return hostname.toLowerCase() === "quote-chaser.com";
}

export function isProductionAnalyticsEnvironment(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "test" && env.VERCEL_ENV === "production";
}

export function isAutomatedBrowser(userAgent: string) {
  return /bot|crawler|spider|headless|playwright|puppeteer|cypress|selenium/i.test(userAgent);
}
