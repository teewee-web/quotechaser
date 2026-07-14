import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/nav";
import QuotePdfActions from "@/components/quote-pdf";
import { gbp, ukDate } from "@/lib/format";
import { Pencil } from "lucide-react";

async function logoDataUrl(supabase:Awaited<ReturnType<typeof createClient>>,storedPath?:string|null){
 if(storedPath){const{data}=await supabase.storage.from("business-logos").createSignedUrl(storedPath,3600);if(data?.signedUrl){try{const response=await fetch(data.signedUrl,{cache:"no-store"});if(response.ok){const bytes=Buffer.from(await response.arrayBuffer());return `data:${response.headers.get("content-type")||"image/png"};base64,${bytes.toString("base64")}`}}catch{/* use the bundled logo below */}}}
 try{const bytes=await readFile(path.join(process.cwd(),"public","solid-finish-solutions-logo.png"));return `data:image/png;base64,${bytes.toString("base64")}`}catch{return null}
}

export default async function Page({params}:{params:Promise<{id:string}>}){
 const{id}=await params,s=await createClient();
 const[{data:quote},{data:settings}]=await Promise.all([s.from("quotes").select("*,customers(*),quote_items(*)").eq("id",id).order("sort_order",{referencedTable:"quote_items"}).single(),s.from("user_settings").select("*").maybeSingle()]);
 if(!quote)notFound();const customer=Array.isArray(quote.customers)?quote.customers[0]:quote.customers;if(!customer)notFound();
 const logoUrl=await logoDataUrl(s,settings?.logo_url);
 const completeSettings={business_name:"",user_name:"",telephone:"",google_review_link:"",follow_up_message:"",review_request_message:"",follow_up_schedule:[3,7,14,30],logo_url:null,business_address:"",business_email:"",vat_registered:false,vat_number:"",default_vat_rate:20,default_payment_terms:"Payment is due within 14 days of completion.",default_terms_and_conditions:"Any additional work will be agreed and quoted separately.",default_quote_validity_days:30,...settings};
 return <><PageHeader title={quote.quote_number||"Quote"} description={`${customer.name} · Valid until ${ukDate(quote.expiry_date)}`}/><div className="grid gap-5 lg:grid-cols-[1fr_auto]"><section className="card qc-card overflow-hidden"><div className="bg-[#102522] p-6 text-white"><p className="text-sm font-bold text-teal-200">QUOTATION TOTAL</p><p className="mt-2 text-4xl font-black text-amber-300">{gbp(quote.final_total||quote.value_pence)}</p></div><div className="grid gap-5 p-6 sm:grid-cols-2"><div><p className="label">Customer</p><p className="font-bold">{customer.name}</p><p className="muted whitespace-pre-line">{customer.address||"No address supplied"}</p></div><div><p className="label">Work</p><p>{quote.job_description}</p></div><div><p className="label">Quote date</p><p>{ukDate(quote.quote_date)}</p></div><div><p className="label">Status</p><span className={`badge ${quote.status}`}>{quote.status}</span></div></div></section><aside className="card qc-card flex min-w-64 flex-col gap-3 p-5"><QuotePdfActions data={{quote,customer,settings:completeSettings,logoUrl}}/><Link className="btn btn-secondary" href={`/quotes/${id}/edit`}><Pencil size={18}/>Edit quote</Link><Link className="btn btn-secondary" href="/quotes">Back to quotes</Link></aside></div></>;
}
