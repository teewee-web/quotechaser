import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/nav";
import { gbp, todayISO, ukDate } from "@/lib/format";
import { ArrowRight, FileText, Trophy, TrendingUp, AlertTriangle, Plus, PhoneCall, Sparkles, CalendarCheck, CheckCircle2, Building2, Users, Star } from "lucide-react";
import "./dashboard.css";

export default async function Page() {
  const supabase = await createClient();
  const today = todayISO();
  const [{ data: metricsData, error: metricsError }, { data: recentData, error: recentError }, { data: settings }, { count: customerCount }] = await Promise.all([
    supabase.rpc("dashboard_metrics", { today_date: today }),
    supabase.from("quotes").select("*,customers(name)").order("created_at", { ascending: false }).limit(6),
    supabase.from("user_settings").select("business_name,telephone,logo_url,google_review_link").maybeSingle(),
    supabase.from("customers").select("id", { count: "exact", head: true }),
  ]);
  if (metricsError || recentError) throw new Error("The dashboard could not be loaded. Please refresh the page.");
  const metrics = (metricsData || {}) as { active_count?: number; due_count?: number; overdue_count?: number; pending_value?: number; won_month_value?: number; won_month_count?: number; won_count?: number; decided_count?: number };
  const quotes = recentData || [];
  const active = { length: Number(metrics.active_count || 0) };
  const due = { length: Number(metrics.due_count || 0) };
  const overdue = { length: Number(metrics.overdue_count || 0) };
  const pendingValue = Number(metrics.pending_value || 0);
  const wonThisMonth = Number(metrics.won_month_value || 0);
  const won = { length: Number(metrics.won_count || 0) };
  const decided = { length: Number(metrics.decided_count || 0) };
  const conversion = decided.length ? Math.round((won.length / decided.length) * 100) : 0;
  const wonCount = Number(metrics.won_month_count || 0);
  const onboarding = [
    { label: "Add business details", done: !!settings?.business_name && !!settings?.telephone, href: "/settings", icon: Building2 },
    { label: "Add your first customer", done: Number(customerCount || 0) > 0, href: "/quotes/new", icon: Users },
    { label: "Create your first quote", done: quotes.length > 0 || active.length > 0 || decided.length > 0, href: "/quotes/new", icon: FileText },
    { label: "Add your Google review link", done: !!settings?.google_review_link, href: "/settings", icon: Star },
  ];
  const onboardingDone = onboarding.filter((item) => item.done).length;
  const stats = [
    { label: "Pending pipeline", value: gbp(pendingValue), detail: `${active.length} active quote${active.length === 1 ? "" : "s"}`, icon: FileText },
    { label: "Won this month", value: gbp(wonThisMonth), detail: `${wonCount} job${wonCount === 1 ? "" : "s"} secured`, icon: Trophy },
    { label: "Conversion", value: `${conversion}%`, detail: decided.length ? `${won.length} of ${decided.length} decisions won` : "Build your first result", icon: TrendingUp },
  ];

  return <>
    <PageHeader title="Your work at a glance" description="A clear plan for today, with every quote and opportunity in one place." action={{ href: "/quotes/new", label: "Add quote" }} />
    <section className="dashboard-hero">
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[.13em] text-amber-300"><Sparkles size={17} /> Today&apos;s focus</div>
        <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-[-.035em] text-white sm:text-4xl">{overdue.length ? `${overdue.length} quote${overdue.length === 1 ? " needs" : "s need"} your attention` : due.length ? `${due.length} follow-up${due.length === 1 ? " is" : "s are"} ready today` : "You’re all caught up!"}</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-teal-100">{overdue.length ? "A quick call or WhatsApp message could turn outstanding quotations into booked work." : due.length ? "Keep the conversation moving while your quotation is still fresh." : "No overdue follow-ups. Add your next quote or review the pipeline."}</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/follow-ups" className="btn border border-amber-300 bg-amber-300 text-[#102522] hover:bg-amber-200"><PhoneCall size={19} /> Open follow-ups</Link><Link href="/quotes" className="btn border border-white/25 bg-white/10 text-white hover:bg-white/15">View pipeline <ArrowRight size={18} /></Link></div>
      </div>
      <div className="dashboard-focus-card"><div><span>Due today</span><strong>{due.length}</strong></div><div><span>Overdue</span><strong className={overdue.length ? "text-amber-300" : ""}>{overdue.length}</strong></div><div><span>Open value</span><strong>{gbp(pendingValue)}</strong></div></div>
    </section>
    {onboardingDone < onboarding.length && <section className="card qc-card mt-5 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-amber-50 p-5"><div><p className="text-xs font-black uppercase tracking-[.12em] text-amber-800">Quick setup</p><h2 className="mt-1 text-xl font-black">Get your account ready to win work</h2></div><strong className="rounded-full bg-white px-4 py-2 text-sm text-amber-900">{onboardingDone} of {onboarding.length} complete</strong></div><div className="grid gap-2 p-4 sm:grid-cols-2">{onboarding.map(({ label, done, href, icon: Icon }) => <Link key={label} href={href} className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-teal-200 hover:bg-teal-50"><span className={`grid h-10 w-10 place-items-center rounded-xl ${done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{done ? <CheckCircle2 size={21}/> : <Icon size={20}/>}</span><strong className={done ? "text-slate-500 line-through" : "text-[#102522]"}>{label}</strong>{done ? null : <ArrowRight className="ml-auto" size={18}/>}</Link>)}</div></section>}
    <div className="mt-5 grid gap-4 md:grid-cols-3">{stats.map((item) => <article className="card qc-card flex items-center gap-4 p-5" key={item.label}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700"><item.icon size={22} /></span><div><p className="muted text-xs font-black uppercase tracking-[.1em]">{item.label}</p><p className="mt-1 text-2xl font-black tracking-tight">{item.value}</p><p className="muted mt-0.5 text-xs">{item.detail}</p></div></article>)}</div>
    {overdue.length > 0 && <Link href="/follow-ups" className="mt-5 flex items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-600 text-white"><AlertTriangle size={21} /></span><div className="flex-1"><strong>{overdue.length} overdue follow-up{overdue.length === 1 ? "" : "s"}</strong><p className="mt-0.5 text-sm text-red-700">These customers are waiting for your next move.</p></div><ArrowRight /></Link>}
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
      <section><div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.12em] text-teal-700">Pipeline</p><h2 className="mt-1 text-2xl font-black tracking-tight">Latest opportunities</h2></div><Link href="/quotes" className="flex items-center gap-1 text-sm font-bold text-teal-700">View all <ArrowRight size={17} /></Link></div><div className="space-y-3">{quotes.slice(0, 6).map((q) => { const customer = Array.isArray(q.customers) ? q.customers[0]?.name : q.customers?.name; return <article className="quote-row" key={q.id}><span className="quote-avatar">{customer?.[0] || "Q"}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-base">{customer}</strong><span className={`badge ${q.status}`}>{q.status}</span></div><p className="muted mt-1 truncate text-sm">{q.job_description}</p><p className="muted mt-2 flex items-center gap-1 text-xs"><CalendarCheck size={14} /> Quoted {ukDate(q.quote_date)}</p></div><div className="text-right"><strong className="text-lg">{gbp(q.value_pence)}</strong><p className="mt-1 text-xs font-bold text-teal-700">Open quote</p></div></article>})}{!quotes.length && <div className="card qc-card p-10 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><FileText /></span><h3 className="mt-4 font-black">Your quotes will appear here</h3><p className="muted mt-1 text-sm">Add a customer, then create your first quote.</p><Link href="/quotes/new" className="btn btn-primary mt-5"><Plus size={18} />Add first quote</Link></div>}</div></section>
      <aside><div className="mb-3"><p className="text-xs font-black uppercase tracking-[.12em] text-teal-700">Shortcuts</p><h2 className="mt-1 text-2xl font-black tracking-tight">Keep moving</h2></div><div className="card qc-card shortcut-card overflow-hidden"><Link href="/customers/new" className="quick-action quick-teal"><span><Plus size={21} /></span><div><strong>Add a customer</strong><p>Save a new lead</p></div><ArrowRight className="ml-auto" size={18} /></Link><Link href="/quotes/new" className="quick-action quick-gold"><span><FileText size={21} /></span><div><strong>Create a quote</strong><p>Record the opportunity</p></div><ArrowRight className="ml-auto" size={18} /></Link><Link href="/follow-ups" className="quick-action quick-blue"><span><PhoneCall size={21} /></span><div><strong>Chase a quote</strong><p>Call or send WhatsApp</p></div><ArrowRight className="ml-auto" size={18} /></Link></div></aside>
    </div>
  </>;
}
