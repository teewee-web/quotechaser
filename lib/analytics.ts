import { PostHog } from "posthog-node";

export type AnalyticsEvent =
  | "signup_completed"
  | "user_login"
  | "customer_created"
  | "quote_created";

export async function captureServerEvent(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
) {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!projectToken || process.env.POSTHOG_SERVER_ANALYTICS_ENABLED !== "true") return;

  const client = new PostHog(projectToken, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({ distinctId, event, properties });
    await client.shutdown();
  } catch (error) {
    console.error("Analytics event could not be sent", { event, error });
  }
}
