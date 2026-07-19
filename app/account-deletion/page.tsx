import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Download, Mail, Trash2 } from "lucide-react";
import { LegalPage, SUPPORT_EMAIL } from "@/components/legal-page";
import { LegalSection } from "@/components/legal-section";
import { createClient } from "@/lib/supabase/server";
import { deleteOwnAccount } from "./actions";

export const metadata: Metadata = { title: "Delete Your Account", description: "Permanently delete a Quote-Chaser account and its stored customer and quote data.", alternates: { canonical: "/account-deletion" } };

export default async function AccountDeletion() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <LegalPage eyebrow="Account controls" title="Delete your Quote-Chaser account" summary="Permanently delete your account, customer records, quotes, follow-up history and settings.">
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6"><AlertTriangle className="text-rose-700" size={30}/><h2 className="mt-4 text-2xl text-rose-950">Deletion cannot be undone</h2><p className="mt-2 leading-7 text-rose-950">You will lose access to stored customers, quotations, follow-up history, reports and settings.</p></div>
    <LegalSection title="Download your information first"><p className="flex items-start gap-3"><Download className="mt-1 shrink-0 text-teal-700" size={22}/>Export the information you need to retain before deleting the account.</p>{user ? <a className="btn btn-secondary mt-4" href="/api/account/export"><Download size={18}/> Download my data</a> : <Link className="btn btn-secondary mt-4" href="/login?next=/account-deletion">Log in to export data</Link>}</LegalSection>
    {user ? <LegalSection title="Permanently delete this account"><form action={deleteOwnAccount} className="grid gap-4"><label className="field"><span>Current password</span><input type="password" name="password" autoComplete="current-password" required maxLength={128}/></label><label className="field"><span>Type DELETE to confirm</span><input name="confirmation" required pattern="DELETE" autoComplete="off"/></label><button className="btn btn-danger" type="submit"><Trash2 size={18}/> Permanently delete my account</button></form></LegalSection> : <LegalSection title="Ready to delete?"><p>Log in first so we can verify that the request belongs to you.</p><Link className="btn btn-danger mt-4" href="/login?next=/account-deletion"><Trash2 size={18}/> Log in to delete account</Link></LegalSection>}
    <LegalSection title="What is removed"><p>The authentication account, profile, settings, customers, quotes, quote items, follow-up history and uploaded business logo are removed from the live service. Copies you previously downloaded, emailed or printed are not affected.</p></LegalSection>
    <LegalSection title="Retention and backups"><p>Limited information may be retained where required for tax, fraud prevention, security or legal claims. Residual encrypted backup copies expire through the normal backup cycle and are not used for ordinary business purposes.</p></LegalSection>
    <p className="flex items-center gap-2 rounded-xl bg-slate-100 p-4"><Mail size={19}/><strong>Need help?</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
  </LegalPage>;
}
