"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function AnalyticsIdentity({ userId }: { userId: string }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || localStorage.getItem("quote-chaser-analytics-consent") !== "granted" || !posthog.__loaded) return;
    posthog.identify(userId);
    return () => posthog.reset();
  }, [userId]);

  return null;
}
