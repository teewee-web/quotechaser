"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";

const KEY = "quote-chaser-analytics-consent";

function startAnalytics() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (token && !posthog.__loaded) {
    posthog.init(token, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_exceptions: true,
      disable_session_recording: true,
      persistence: "memory",
    });
  }
  if (posthog.__loaded) {
    posthog.opt_in_capturing();
    window.quoteChaserAnalytics = (event, properties) => posthog.capture(event, properties);
  }
}

export function AnalyticsPreferences() {
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => setSaved(localStorage.getItem(KEY)), []);

  function update(value: "granted" | "denied") {
    localStorage.setItem(KEY, value);
    document.cookie = `qc_analytics_consent=${value}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    setSaved(value);
    if (value === "granted") {
      startAnalytics();
    } else {
      posthog.opt_out_capturing();
      posthog.reset();
      window.quoteChaserAnalytics = undefined;
    }
  }

  return <div className="mt-4 flex flex-wrap items-center gap-3"><button className="btn btn-primary" onClick={() => update("granted")}>Allow optional analytics</button><button className="btn btn-secondary" onClick={() => update("denied")}>Use essential storage only</button>{saved && <span className="text-sm font-bold">Current choice: {saved === "granted" ? "analytics allowed" : "essential only"}</span>}</div>;
}

