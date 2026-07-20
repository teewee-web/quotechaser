"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { canUseProductionAnalytics, hasAnalyticsConsent, startAnalytics } from "@/lib/analytics-client";

export function AnalyticsIdentity({ userId }: { userId: string }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || !hasAnalyticsConsent() || !canUseProductionAnalytics() || !startAnalytics() || !posthog.__loaded) return;
    posthog.identify(userId);
    void fetch("/api/analytics/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: "granted" }), keepalive: true });
    return () => posthog.reset();
  }, [userId]);

  return null;
}
