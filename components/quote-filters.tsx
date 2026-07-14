"use client";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function QuoteFilters({ q, status }: { q: string; status: string }) {
  const router = useRouter();
  function go(search = q, nextStatus = status) { const params = new URLSearchParams(); if (search) params.set("q", search); if (nextStatus) params.set("status", nextStatus); router.push(`/quotes?${params.toString()}`); }
  return <div className="collection-toolbar mb-6 grid gap-3 sm:grid-cols-[1fr_210px]">
    <form className="relative" onSubmit={(event) => { event.preventDefault(); go(new FormData(event.currentTarget).get("q") as string, status); }}><Search className="absolute left-3 top-3.5 text-slate-400" size={20} /><input className="field border-0 bg-slate-50 pl-10" name="q" defaultValue={q} placeholder="Search quotes or job descriptions" aria-label="Search quotes" /></form>
    <select className="field border-0 bg-slate-50 font-bold" value={status} onChange={(event) => go(q, event.target.value)} aria-label="Filter quotes by status"><option value="">All quote statuses</option>{["Draft", "Sent", "Pending", "Won", "Lost"].map((item) => <option key={item}>{item}</option>)}</select>
  </div>;
}
