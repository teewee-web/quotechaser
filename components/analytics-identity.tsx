"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function AnalyticsIdentity({ userId }: { userId: string }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;
    posthog.identify(userId);
    return () => posthog.reset();
  }, [userId]);

  return null;
}
