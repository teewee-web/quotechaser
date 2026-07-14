"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, PhoneCall, BarChart3, Settings, LogOut, Plus, HelpCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { logout } from "@/app/(auth)/actions";

const links = [["Dashboard", "/dashboard", LayoutDashboard], ["Customers", "/customers", Users], ["Quotes", "/quotes", FileText], ["Follow-ups", "/follow-ups", PhoneCall], ["Reports", "/reports", BarChart3], ["Settings", "/settings", Settings]] as const;
const mobileLabels = ["Home", "Clients", "Quotes", "Chase", "Reports"];

export function Nav() {
  const path = usePathname();
  return <>
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:hidden"><Logo /><Link href="/settings" aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Settings size={20} /></Link></header>
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 bg-[#102522] p-5 text-white shadow-2xl lg:flex lg:flex-col"><Logo inverse /><p className="mt-2 pl-12 text-[10px] font-bold uppercase tracking-[.18em] text-teal-200/60">Win more work</p><nav className="mt-8 space-y-1.5">{links.map(([label, href, Icon]) => { const active = path === href || path.startsWith(`${href}/`); return <Link key={href} href={href} className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold transition ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/[.07] hover:text-white"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-[#f4b942] text-[#102522]" : "bg-white/[.06] text-teal-200"}`}><Icon size={18} /></span>{label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f4b942]" />}</Link>; })}</nav><div className="mt-auto rounded-2xl border border-white/10 bg-white/[.05] p-4"><HelpCircle className="text-[#f4b942]" size={20} /><p className="mt-2 text-sm font-extrabold">Need a hand?</p><p className="mt-1 text-xs leading-5 text-slate-400">Start with a customer, then add their quote.</p></div><form action={logout} className="mt-3"><button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-400 hover:bg-white/10 hover:text-white"><LogOut size={18} />Log out</button></form></aside>
    <nav aria-label="Mobile navigation" className="fixed inset-x-3 z-30 mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.35rem] border border-white/10 bg-[#102522]/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden" style={{ bottom: "max(.75rem, env(safe-area-inset-bottom))" }}>{links.slice(0, 5).map(([label, href, Icon], index) => { const active = path === href || path.startsWith(`${href}/`); return <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[9px] font-extrabold tracking-tight transition ${active ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:bg-white/[.06] hover:text-white"}`}><Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "text-[#f4b942]" : "text-teal-200"} /><span className="block w-full truncate text-center">{mobileLabels[index]}</span>{active && <span className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-[#f4b942]" />}</Link>; })}</nav>
  </>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: { href: string; label: string } }) {
  const path = usePathname();
  if (path === "/dashboard") return <header className="mb-7 flex items-start justify-between gap-4"><div><p className="mb-1 text-xs font-extrabold uppercase tracking-[.16em] text-teal-700">QuoteChaser</p><h1 className="text-3xl font-black tracking-[-.035em] text-[#102522] sm:text-4xl">{title}</h1>{description && <p className="muted mt-2 max-w-xl leading-6">{description}</p>}</div>{action && <Link href={action.href} className="btn btn-primary shrink-0"><Plus size={20} /><span className="hidden sm:inline">{action.label}</span></Link>}</header>;
  return <header className="page-banner"><div className="relative z-10"><p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-amber-300">QuoteChaser workspace</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <Link href={action.href} className="btn relative z-10 shrink-0 border border-amber-300 bg-amber-300 text-[#102522] shadow-lg hover:bg-amber-200"><Plus size={20} /><span>{action.label}</span></Link>}</header>;
}
