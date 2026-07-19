import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/nav";
import { gbp } from "@/lib/format";
import { FileText, PoundSterling, Trophy, Calculator, Percent, BarChart3 } from "lucide-react";

type ReportMetrics = { total_quotes: number; total_value: number; won_value: number; won_count: number; decided_count: number; months: { month: string; value_pence: number }[] };

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_metrics");
  if (error) throw new Error("Reports could not be loaded. Please refresh the page.");
  const metrics = (data || { total_quotes: 0, total_value: 0, won_value: 0, won_count: 0, decided_count: 0, months: [] }) as ReportMetrics;
  const months = (metrics.months || []).map(({ month, value_pence }) => [month, Number(value_pence)] as const);
  const max = Math.max(1, ...months.map(([, value]) => value));
  const conversion = metrics.decided_count ? Math.round(metrics.won_count / metrics.decided_count * 100) : 0;
  const cards = [
    { label: "Total quotes", value: String(metrics.total_quotes), icon: FileText },
    { label: "Total quoted", value: gbp(metrics.total_value), icon: PoundSterling },
    { label: "Total won", value: gbp(metrics.won_value), icon: Trophy },
    { label: "Average quote", value: gbp(metrics.total_quotes ? metrics.total_value / metrics.total_quotes : 0), icon: Calculator },
    { label: "Conversion", value: `${conversion}%`, icon: Percent },
  ];
  return <><PageHeader title="Business performance" description="See what you’re quoting, winning and turning into revenue."/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(({ label, value, icon: Icon }, index) => <article className={`card qc-card p-5 ${index === 2 ? "bg-[#102522] text-white" : index === 4 ? "bg-amber-50" : ""}`} key={label}><span className={`grid h-10 w-10 place-items-center rounded-xl ${index === 2 ? "bg-white/10 text-[#f4b942]" : "bg-teal-100 text-teal-800"}`}><Icon size={20}/></span><p className={`mt-5 text-sm font-bold ${index === 2 ? "text-slate-300" : "muted"}`}>{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p></article>)}</div><section className="card qc-card mt-7 overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 p-5 sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800"><BarChart3 size={20}/></span><div><h2 className="text-xl font-black tracking-tight">Quotes won by month</h2><p className="muted text-sm">Won value over the last 12 active months.</p></div></div>{months.length ? <div className="p-5 sm:p-7"><div className="flex h-72 items-end gap-3 overflow-x-auto border-b border-slate-200 pb-2">{months.map(([month, value]) => <div className="group flex min-w-20 flex-1 flex-col items-center" key={month}><span className="mb-2 rounded-lg bg-[#102522] px-2 py-1 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">{gbp(value)}</span><div className="w-full max-w-20 rounded-t-xl bg-gradient-to-t from-teal-700 to-teal-400" style={{ height: `${Math.max(10, value / max * 190)}px` }}/><span className="muted mt-2 text-xs font-bold">{new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" }).format(new Date(`${month}-01T12:00:00`))}</span></div>)}</div></div> : <div className="p-12 text-center"><BarChart3 className="mx-auto text-slate-300" size={42}/><h3 className="mt-4 font-black">No won quotes yet</h3><p className="muted mt-1 text-sm">Mark a quote as won and its value will appear here.</p></div>}</section></>;
}
