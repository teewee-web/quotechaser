"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); if (posthog.__loaded) posthog.captureException(error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-[#f3f5f3] p-5"><section className="card qc-card max-w-lg p-7 text-center sm:p-10"><p className="text-sm font-black uppercase tracking-[.14em] text-amber-700">Something went wrong</p><h1 className="mt-3 text-3xl font-black">We couldnâ€™t load that page</h1><p className="muted mt-3 leading-7">Your information is safe. Try again, or return to the dashboard if the problem continues.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button className="btn btn-primary" onClick={reset}>Try again</button><a className="btn btn-secondary" href="/dashboard">Dashboard</a></div></section></main>;
}

