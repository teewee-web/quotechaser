import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/nav";
import { Empty } from "@/components/empty";
import { daysBetween, fillTemplate, gbp, todayISO, ukDate, whatsappUrl } from "@/lib/format";
import { followUp } from "../actions";
import { Phone, MessageCircle, Check, AlarmClock, AlertTriangle, CalendarCheck2, CalendarDays, UserRound } from "lucide-react";

export default async function Page() {
  const supabase = await createClient();
  const today = todayISO();
  const [{ data, error }, { data: settings }] = await Promise.all([
    supabase.from("quotes").select("*,customers(name,mobile)").not("next_follow_up_date", "is", null).in("status", ["Sent", "Pending"]).order("next_follow_up_date"),
    supabase.from("user_settings").select("*").maybeSingle(),
  ]);
  if (error) throw new Error("Follow-ups could not be loaded. Please refresh the page.");
  const quotes = data || [];
  const groups = [
    { title: "Overdue", copy: "Contact these first", rows: quotes.filter((q) => q.next_follow_up_date < today), icon: AlertTriangle, tone: "red" },
    { title: "Due today", copy: "Your call list for today", rows: quotes.filter((q) => q.next_follow_up_date === today), icon: CalendarCheck2, tone: "teal" },
    { title: "Upcoming", copy: "What’s coming next", rows: quotes.filter((q) => q.next_follow_up_date > today), icon: CalendarDays, tone: "blue" },
  ];

  return <>
    <PageHeader title="Follow-up list" description="A focused call list so promising work never goes quiet." />
    <div className="mb-7 grid gap-4 sm:grid-cols-3">{groups.map((group) => <article className={`card qc-card summary-card summary-${group.tone} flex items-center gap-4 p-5`} key={group.title}><span className="summary-icon"><group.icon size={22} /></span><div><p className="text-3xl font-black tracking-tight">{group.rows.length}</p><p className="text-sm font-black">{group.title}</p><p className="muted mt-0.5 text-xs">{group.copy}</p></div></article>)}</div>
    {!quotes.length ? <Empty title="You’re all caught up!" copy="Sent and pending quotes with a follow-up date will appear here." href="/quotes/new" label="Add quote" /> : <div className="space-y-9">{groups.map((group) => group.rows.length > 0 && <section key={group.title}>
      <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.13em] text-teal-700">Follow-up queue</p><h2 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight"><group.icon size={21} />{group.title}</h2></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{group.rows.length} customer{group.rows.length === 1 ? "" : "s"}</span></div>
      <div className="grid items-stretch gap-4 xl:grid-cols-2">{group.rows.map((quote) => {
        const customer = Array.isArray(quote.customers) ? quote.customers[0] : quote.customers;
        const message = settings ? fillTemplate(settings.follow_up_message, { "customer name": customer?.name || "there", "job description": quote.job_description }) : "";
        return <article className={`card qc-card work-card followup-${group.tone}`} key={quote.id}>
          <div className="work-card-main">
            <div className="work-card-heading"><span className="work-avatar"><UserRound size={21} /></span><div className="min-w-0 flex-1"><h3>{customer?.name || "Customer"}</h3><p>{quote.job_description}</p></div><strong className="work-value">{gbp(quote.value_pence)}</strong></div>
            <div className="work-meta"><span>{daysBetween(quote.quote_date)} days since quote</span><span>Due {ukDate(quote.next_follow_up_date)}</span><span className={`badge ${quote.status}`}>{quote.status}</span></div>
          </div>
          <div className="work-actions">
            {customer?.mobile && <><a className="btn btn-secondary" href={`tel:${customer.mobile}`}><Phone size={17} />Call</a><a className="btn btn-secondary" target="_blank" rel="noreferrer" href={whatsappUrl(customer.mobile, message)}><MessageCircle size={17} />WhatsApp</a></>}
            <form action={followUp}><input type="hidden" name="id" value={quote.id} /><input type="hidden" name="action" value="completed" /><button className="btn btn-primary w-full"><Check size={17} />Followed up</button></form>
            <form action={followUp} className="snooze-control"><input type="hidden" name="id" value={quote.id} /><input type="hidden" name="action" value="snooze" /><select name="days" aria-label="Snooze days" className="field"><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option></select><button title="Snooze" className="btn btn-secondary"><AlarmClock size={17} /></button></form>
          </div>
        </article>;
      })}</div>
    </section>)}</div>}
  </>;
}
