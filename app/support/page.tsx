import type { Metadata } from "next";
import Link from "next/link";
import { Download, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { LegalPage, SUPPORT_EMAIL } from "@/components/legal-page";
import { LegalSection } from "@/components/legal-section";

export const metadata: Metadata = { title: "Support", description: "Get help with your Quote-Chaser account, quotes, data and password.", alternates: { canonical: "/support" } };

export default function SupportPage() {
  return <LegalPage eyebrow="Customer support" title="How can we help?" summary="Straightforward help with your account, customer records and quotations.">
    <div className="grid gap-4 sm:grid-cols-2">
      <Link className="rounded-2xl border border-teal-100 bg-teal-50 p-5" href="/forgot-password"><KeyRound className="text-teal-700"/><h2 className="mt-3 text-xl">Reset your password</h2><p className="mt-2 leading-7">Request a fresh, time-limited password reset email.</p></Link>
      <a className="rounded-2xl border border-amber-100 bg-amber-50 p-5" href="/api/account/export"><Download className="text-amber-700"/><h2 className="mt-3 text-xl">Export your data</h2><p className="mt-2 leading-7">Download a JSON copy of your account data after logging in.</p></a>
    </div>
    <LegalSection title="Common questions"><h3>Why did my reset link expire?</h3><p>Reset links are time limited and can be used only once. Request a new link and open the newest email.</p><h3>Where is my PDF quote?</h3><p>Open a saved quote and choose the PDF option. Allow the document a moment to generate on older phones.</p><h3>How do I remove my account?</h3><p>Visit the <Link href="/account-deletion">account deletion page</Link> for the permanent deletion process.</p></LegalSection>
    <LegalSection title="Contact support"><p>Include the email address on your account and a short description of what happened. Never send your password, authentication code or customer-sensitive information by email.</p><a className="btn btn-primary mt-5" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Quote-Chaser support request")}`}><Mail size={18}/> Email {SUPPORT_EMAIL}</a></LegalSection>
    <p className="flex items-start gap-3 rounded-xl bg-slate-100 p-4"><ShieldCheck className="mt-1 shrink-0 text-teal-700" size={20}/>We may ask you to confirm account ownership before discussing or changing account data.</p>
  </LegalPage>;
}
