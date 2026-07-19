"use client";

import dynamic from "next/dynamic";
import type { Customer, Quote, Settings } from "@/lib/types";

const QuotePdfActions = dynamic(() => import("@/components/quote-pdf"), {
  ssr: false,
  loading: () => <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">Preparing PDF options…</p>,
});

export function QuotePdfLoader({ data }: { data: { quote: Quote; customer: Customer; settings: Settings; logoUrl?: string | null } }) {
  return <QuotePdfActions data={data}/>;
}
