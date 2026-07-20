"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { capturePageView, CONSENT_KEY, startAnalytics, stopAnalytics } from "@/lib/analytics-client";

type Consent = "granted" | "denied" | null;
export function AnalyticsConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY) as Consent;
    setConsent(saved); setChecked(true);
    if (saved === "granted") startAnalytics();
  }, []);
  function choose(value: Exclude<Consent, null>) {
    localStorage.setItem(CONSENT_KEY, value);
    document.cookie = `qc_analytics_consent=${value}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    void fetch("/api/analytics/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: value }), keepalive: true });
    setConsent(value);
    if (value === "granted" && startAnalytics()) capturePageView(`${location.pathname}${location.search}`);
    else stopAnalytics();
  }
  if (!checked || consent !== null) return null;
  return <aside aria-label="Analytics choices" className="fixed inset-x-3 bottom-24 z-[80] mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-[#102522] p-5 text-white shadow-2xl lg:bottom-3"><h2 className="text-lg font-black">Help us improve Quote-Chaser?</h2><p className="mt-2 text-sm leading-6 text-slate-200">We use optional, privacy-conscious analytics to understand which features help. Customer names, contact details, job descriptions and quote values are never included.</p><div className="mt-4 flex flex-wrap gap-3"><button className="btn bg-amber-300 text-[#102522]" onClick={() => choose("granted")}>Allow analytics</button><button className="btn border border-white/30 text-white" onClick={() => choose("denied")}>Essential only</button><Link className="self-center text-sm underline" href="/privacy#analytics">Learn more</Link></div></aside>;
}
