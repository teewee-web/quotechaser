import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { LegalPage, SUPPORT_EMAIL } from "@/components/legal-page";
import { LegalSection } from "@/components/legal-section";

export const metadata: Metadata = { title: "Contact", description: "Contact Quote-Chaser for product, account, privacy or billing support.", alternates: { canonical: "/contact" } };

export default function Contact() { const subject = encodeURIComponent("Quote-Chaser support request"); return <LegalPage eyebrow="We are here to help" title="Contact Quote-Chaser" summary="Get help with your account, quotation workflow, billing, privacy or a technical problem.">
  <div className="grid gap-4 sm:grid-cols-2"><a className="rounded-2xl border border-teal-100 bg-teal-50 p-5 text-[#17211f] no-underline" href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`}><Mail className="text-teal-700" size={28}/><h2 className="mt-4 text-xl">Email support</h2><p className="mt-2 break-all text-teal-800">{SUPPORT_EMAIL}</p></a><div className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><Clock3 className="text-amber-700" size={28}/><h2 className="mt-4 text-xl">Response time</h2><p className="mt-2 text-amber-950">We aim to reply within two UK business days.</p></div></div>
  <LegalSection title="What to include"><p>Tell us the email address used for your account, what you were trying to do, the page affected and any error message you saw. Screenshots are helpful, but please remove customer details or other sensitive information first.</p></LegalSection>
  <LegalSection title="Account and privacy requests"><p>For access, correction, export or deletion requests, email us from the address registered to your Quote-Chaser account. We may ask for additional information to confirm your identity before acting.</p><p><Link href="/account-deletion">Read the account deletion process</Link> or review our <Link href="/privacy">Privacy Policy</Link>.</p></LegalSection>
  <LegalSection title="Security concerns"><p className="flex items-start gap-3"><ShieldCheck className="mt-1 shrink-0 text-teal-700" size={22}/>If you believe an account or customer record has been accessed without permission, put <strong>Urgent security issue</strong> in the email subject and do not include passwords or full customer records.</p></LegalSection>
  <LegalSection title="Product feedback"><p className="flex items-start gap-3"><MessageSquareText className="mt-1 shrink-0 text-teal-700" size={22}/>Suggestions from working tradespeople help shape Quote-Chaser. Send us the problem you want solved and how it affects your working day.</p></LegalSection>
</LegalPage>; }
