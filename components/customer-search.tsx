"use client";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function CustomerSearch({ q }: { q: string }) {
  const router = useRouter();
  return <form className="collection-toolbar relative mb-6 max-w-2xl" onSubmit={(event) => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("q") || "").trim(); router.push(value ? `/customers?q=${encodeURIComponent(value)}` : "/customers"); }}>
    <Search className="absolute left-6 top-6.5 text-slate-400" size={20} />
    <input name="q" defaultValue={q} className="field border-0 bg-slate-50 pl-10" placeholder="Search by name, email or mobile" aria-label="Search customers" />
  </form>;
}
