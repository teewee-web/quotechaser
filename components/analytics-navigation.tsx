"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { capturePageView, hasAnalyticsConsent, startAnalytics } from "@/lib/analytics-client";

export function AnalyticsNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!hasAnalyticsConsent() || !startAnalytics()) return;
    const query = searchParams.toString();
    const path = `${pathname}${query ? `?${query}` : ""}`;
    if (previous.current === path) return;
    previous.current = path;
    capturePageView(path);
  }, [pathname, searchParams]);
  return null;
}
