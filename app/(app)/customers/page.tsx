import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/nav";
import { Empty } from "@/components/empty";
import { CustomerSearch } from "@/components/customer-search";
import { ukDate } from "@/lib/format";
import { deleteCustomer } from "../actions";
import { ConfirmButton } from "@/components/confirm-button";
import { Pencil, Trash2, Phone, Mail, MapPin, UserRound } from "lucide-react";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("customers").select("*").order("name");
  if (q) { const safe = q.replace(/[%(),]/g, ""); query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,mobile.ilike.%${safe}%`); }
  const { data, error } = await query;
  if (error) throw new Error("Customers could not be loaded. Please refresh the page.");
  const customers = data || [];
  return <>
    <PageHeader title="Customers" description="The people behind every quote, all in one place." action={{ href: "/customers/new", label: "Add customer" }} />
    <CustomerSearch q={q} />
    {!customers.length ? <Empty title={q ? "No customers found" : "Build your customer list"} copy={q ? "Try a different name, email or mobile number." : "Add your first customer, then create and follow up their quote."} href={q ? undefined : "/customers/new"} label="Add customer" /> : <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <article className="card qc-card work-card" key={customer.id}>
      <div className="work-card-main"><div className="work-card-heading"><span className="work-avatar">{customer.name[0]?.toUpperCase() || <UserRound size={21} />}</span><div className="min-w-0 flex-1"><h3>{customer.name}</h3><p>Customer since {ukDate(customer.created_at)}</p></div></div><div className="mt-5 space-y-2 text-sm">{customer.mobile && <a href={`tel:${customer.mobile}`} className="contact-row"><Phone size={16} />{customer.mobile}</a>}{customer.email && <a href={`mailto:${customer.email}`} className="contact-row"><Mail size={16} />{customer.email}</a>}{customer.address && <p className="contact-row"><MapPin size={16} />{customer.address}</p>}{!customer.mobile && !customer.email && !customer.address && <p className="muted">No contact details added yet.</p>}</div></div>
      <div className="work-actions"><Link href={`/customers/${customer.id}/edit`} className="btn btn-secondary flex-1"><Pencil size={17} />Edit customer</Link><form action={deleteCustomer}><input type="hidden" name="id" value={customer.id} /><ConfirmButton message={`Delete ${customer.name}? Quotes for this customer must be deleted first.`}><Trash2 size={17} /><span className="sr-only">Delete</span></ConfirmButton></form></div>
    </article>)}</div>}
  </>;
}
