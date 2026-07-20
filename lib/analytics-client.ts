"use client";

import posthog from "posthog-js";
import {
  type AnalyticsEvent,
  type AnalyticsProperties,
  isAutomatedBrowser,
  isCanonicalAnalyticsHost,
  sanitizeAnalyticsProperties,
} from "@/lib/analytics-core";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    quoteChaserAnalytics?: (event: AnalyticsEvent, properties?: AnalyticsProperties) => void;
  }
}

const CONSENT_KEY = "quote-chaser-analytics-consent";
let active = false;

export function canUseProductionAnalytics() {
  return typeof window !== "undefined" &&
    isCanonicalAnalyticsHost(window.location.hostname) &&
    !isAutomatedBrowser(window.navigator.userAgent) &&
    !window.navigator.webdriver &&
    !document.cookie.includes("qc_internal_analytics=1");
}

function loadGa4() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-00TVPH4PER";
  if (measurementId !== "G-00TVPH4PER" || document.querySelector(`script[data-qc-ga4="${measurementId}"]`)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag("js", new Date());
  window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  window.gtag("config", measurementId, { send_page_view: false, anonymize_ip: true });
  const script = document.createElement("script");
  script.async = true;
  script.dataset.qcGa4 = measurementId;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function startAnalytics() {
  if (!canUseProductionAnalytics()) {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true") {
      window.quoteChaserAnalytics = (event, properties) => console.debug("[analytics debug]", event, sanitizeAnalyticsProperties(properties));
    }
    return false;
  }
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (token && !posthog.__loaded) {
    posthog.init(token, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_exceptions: true,
      disable_session_recording: false,
      session_recording: { maskAllInputs: true, maskTextSelector: "[data-private], [data-sensitive]" },
      persistence: "localStorage+cookie",
      opt_out_capturing_by_default: true,
    });
  }
  if (posthog.__loaded) {
    posthog.opt_in_capturing();
    posthog.startSessionRecording();
  }
  loadGa4();
  window.quoteChaserAnalytics = captureClientEvent;
  active = true;
  return true;
}

export function stopAnalytics() {
  active = false;
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  if (posthog.__loaded) {
    posthog.stopSessionRecording();
    posthog.opt_out_capturing();
    posthog.reset();
  }
  window.quoteChaserAnalytics = undefined;
}

export function captureClientEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (!active || !canUseProductionAnalytics()) return;
  const safe = sanitizeAnalyticsProperties(properties);
  if (posthog.__loaded) posthog.capture(event, safe);
  window.gtag?.("event", event, safe);
}

export function capturePageView(path: string, title = document.title) {
  if (!active || !canUseProductionAnalytics()) return;
  const safe = sanitizeAnalyticsProperties({ page_path: path, page_title: title });
  if (posthog.__loaded) posthog.capture("$pageview", { $current_url: `https://quote-chaser.com${path}`, ...safe });
  window.gtag?.("event", "page_view", { page_location: `https://quote-chaser.com${path}`, page_path: path, page_title: title });
}

export function hasAnalyticsConsent() {
  return typeof window !== "undefined" && localStorage.getItem(CONSENT_KEY) === "granted";
}

export { CONSENT_KEY };
