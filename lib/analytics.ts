import { PostHog } from "posthog-node";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import {
  type AnalyticsEvent,
  type AnalyticsProperties,
  isProductionAnalyticsEnvironment,
  sanitizeAnalyticsProperties,
} from "@/lib/analytics-core";

export type { AnalyticsEvent, AnalyticsProperties } from "@/lib/analytics-core";

async function claimOnce(distinctId: string, event: AnalyticsEvent) {
  const admin = createAdminClient();
  const { error } = await admin.from("analytics_event_claims").insert({ user_id: distinctId, event_name: event });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

async function hasConsent(distinctId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("analytics_preferences").select("consent").eq("user_id", distinctId).maybeSingle();
  if (data?.consent === "granted") return true;
  try {
    const store = await cookies();
    return store.get("qc_analytics_consent")?.value === "granted" && store.get("qc_internal_analytics")?.value !== "1";
  } catch {
    return false;
  }
}

async function sendPostHog(distinctId: string, event: AnalyticsEvent, properties: AnalyticsProperties) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token || process.env.POSTHOG_SERVER_ANALYTICS_ENABLED !== "true") return;
  const client = new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  client.capture({ distinctId, event, properties });
  await client.shutdown();
}

async function sendGa4(distinctId: string, event: AnalyticsEvent, properties: AnalyticsProperties) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (measurementId !== "G-00TVPH4PER" || !apiSecret) return;
  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: distinctId, user_id: distinctId, events: [{ name: event, params: properties }] }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`GA4 Measurement Protocol returned ${response.status}`);
}

export async function captureServerEvent(
  distinctId: string,
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
  options: { once?: boolean } = {},
) {
  if (!isProductionAnalyticsEnvironment()) return;
  try {
    if (!(await hasConsent(distinctId))) return;
    if (options.once && !(await claimOnce(distinctId, event))) return;
    const safeProperties = sanitizeAnalyticsProperties(properties);
    await Promise.allSettled([
      sendPostHog(distinctId, event, safeProperties),
      sendGa4(distinctId, event, safeProperties),
    ]).then((results) => {
      for (const result of results) if (result.status === "rejected") console.error("Analytics destination failed", { event, error: String(result.reason) });
    });
  } catch (error) {
    console.error("Analytics event could not be claimed or sent", { event, error });
  }
}
