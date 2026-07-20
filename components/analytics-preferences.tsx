"use client";

import { useEffect, useState } from "react";
import { capturePageView, CONSENT_KEY, startAnalytics, stopAnalytics } from "@/lib/analytics-client";

export function AnalyticsPreferences() {
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => setSaved(localStorage.getItem(CONSENT_KEY)), []);
  function update(value: "granted" | "denied") {
    localStorage.setItem(CONSENT_KEY, value);
    document.cookie = `qc_analytics_consent=${value}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    void fetch("/api/analytics/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: value }), keepalive: true });
    setSaved(value);
    if (value === "granted" && startAnalytics()) capturePageView(`${location.pathname}${location.search}`);
    else stopAnalytics();
  }
  return <div className="mt-4 flex flex-wrap items-center gap-3"><button className="btn btn-primary" onClick={() => update("granted")}>Allow optional analytics</button><button className="btn btn-secondary" onClick={() => update("denied")}>Use essential storage only</button>{saved && <span className="text-sm font-bold">Current choice: {saved === "granted" ? "analytics allowed" : "essential only"}</span>}</div>;
}
