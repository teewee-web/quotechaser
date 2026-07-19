"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customerSchema, parseQuoteItems, quoteSchema, settingsSchema } from "@/lib/validation";
import { todayISO } from "@/lib/format";
import {
  calculateQuoteTotals,
  defaultExpiry,
  type QuoteItemInput,
} from "@/lib/quote-pdf";
import { captureServerEvent } from "@/lib/analytics";
async function owned() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) throw new Error("Please log in again.");
  return { s, user };
}
export async function saveCustomer(form: FormData) {
  const p = customerSchema.safeParse(Object.fromEntries(form));
  if (!p.success) throw new Error(p.error.issues[0].message);
  const { s, user } = await owned(),
    id = String(form.get("id") || "");
  const isNew = !id;
  const row = {
    ...p.data,
    email: p.data.email || null,
    mobile: p.data.mobile || null,
    address: p.data.address || null,
    notes: p.data.notes || null,
    user_id: user.id,
  };
  const q = id
    ? s.from("customers").update(row).eq("id", id)
    : s.from("customers").insert(row);
  const { error } = await q;
  if (error) throw new Error("The customer could not be saved. Please try again.");
  if (isNew)
    await captureServerEvent(user.id, "customer_created", {
      source: "customer_page",
    });
  revalidatePath("/customers");
  redirect("/customers");
}
export async function deleteCustomer(form: FormData) {
  const { s } = await owned();
  const { error } = await s
    .from("customers")
    .delete()
    .eq("id", String(form.get("id")));
  if (error) throw new Error("The customer could not be deleted. Remove any linked quotes first.");
  revalidatePath("/customers");
}
export async function saveQuote(form: FormData) {
  if (form.get("customer_mode") === "new" && !form.get("id")) form.set("customer_id", "00000000-0000-0000-0000-000000000000");
  const p = quoteSchema.safeParse(Object.fromEntries(form));
  if (!p.success) throw new Error(p.error.issues[0].message);
  const { s, user } = await owned();
  let id = String(form.get("id") || "");
  const isNew = !id;
  let items: QuoteItemInput[] = parseQuoteItems(form.get("items_json"));
  if (!items.length)
    items = [
      {
        description: p.data.job_description,
        quantity: 1,
        unitPricePence: Math.round(p.data.value * 100),
      },
    ];
  const totals = calculateQuoteTotals(
    items,
    p.data.discount_type,
    p.data.discount_value,
    !!p.data.vat_enabled,
    p.data.vat_rate,
  );
  let follow = p.data.next_follow_up_date || null;
  if (p.data.status === "Sent" && !follow) {
    const d = new Date(`${p.data.quote_date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 3);
    follow = d.toISOString().slice(0, 10);
  }
  const row = {
    customer_id: p.data.customer_id,
    job_description: p.data.job_description,
    value_pence: totals.finalTotalPence,
    quote_date: p.data.quote_date,
    expiry_date: p.data.expiry_date || defaultExpiry(p.data.quote_date),
    status: p.data.status,
    next_follow_up_date: follow,
    notes: p.data.notes || null,
    user_id: user.id,
    subtotal: totals.subtotalPence,
    discount_type: p.data.discount_type,
    discount_value: p.data.discount_value,
    vat_enabled: !!p.data.vat_enabled,
    vat_rate: p.data.vat_rate,
    vat_amount: totals.vatPence,
    final_total: totals.finalTotalPence,
    payment_terms: p.data.payment_terms || null,
    terms_and_conditions: p.data.terms_and_conditions || null,
  };
  let customer: Record<string, string> | null = null;
  if (form.get("customer_mode") === "new" && isNew) {
    const parsedCustomer = customerSchema.safeParse({ name: form.get("new_customer_name"), mobile: form.get("new_customer_mobile"), email: form.get("new_customer_email"), address: form.get("new_customer_address"), notes: "" });
    if (!parsedCustomer.success) throw new Error(parsedCustomer.error.issues[0].message);
    customer = parsedCustomer.data;
  }
  const rpcItems = items.map((item, index) => ({ description: item.description.trim(), quantity: item.quantity, unit_price: item.unitPricePence, line_total: Math.round(item.quantity * item.unitPricePence), sort_order: index }));
  const { data, error } = await s.rpc("save_quote_transaction", { p_quote: row, p_items: rpcItems, p_quote_id: id || null, p_customer: customer });
  if (error || !data) throw new Error("The quote could not be saved. Nothing was changed; please try again.");
  const result = data as { quote_id: string; customer_created?: boolean };
  id = result.quote_id;
  if (result.customer_created) await captureServerEvent(user.id, "customer_created", { source: "quote_flow" });
  if (isNew) await captureServerEvent(user.id, "quote_created");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/dashboard");
  redirect(`/quotes/${id}`);
}

export async function recordQuoteDelivery(form: FormData) {
  const { s, user } = await owned();
  const quoteId = String(form.get("quote_id") || "");
  const channel = String(form.get("channel") || "");
  if (!quoteId || !["download", "email", "whatsapp", "share", "print"].includes(channel)) return;
  const { error } = await s.from("quote_delivery_events").insert({ user_id: user.id, quote_id: quoteId, channel });
  if (error) console.error("Quote delivery event could not be recorded", { channel });
  const { data: quote } = await s.from("quotes").select("status,quote_date,next_follow_up_date").eq("id", quoteId).maybeSingle();
  if (quote?.status === "Draft" && ["email", "whatsapp", "share"].includes(channel)) {
    const date = new Date(`${quote.quote_date}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 3);
    await s.from("quotes").update({ status: "Sent", next_follow_up_date: quote.next_follow_up_date || date.toISOString().slice(0, 10) }).eq("id", quoteId);
  }
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}
export async function updateQuoteStatus(form: FormData) {
  const { s } = await owned();
  const id = String(form.get("id")),
    status = String(form.get("status"));
  if (!["Won", "Lost"].includes(status))
    throw new Error("Choose a valid quote status.");
  const patch: Record<string, string | null> = { status };
  if (status === "Won") patch.next_follow_up_date = null;
  const { error } = await s.from("quotes").update(patch).eq("id", id);
  if (error) throw new Error("The quote status could not be changed.");
  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}
export async function deleteQuote(form: FormData) {
  const { s } = await owned();
  const { error } = await s
    .from("quotes")
    .delete()
    .eq("id", String(form.get("id")));
  if (error) throw new Error("The quote could not be deleted. Please try again.");
  revalidatePath("/quotes");
}
export async function followUp(form: FormData) {
  const { s, user } = await owned(),
    quoteId = String(form.get("id")),
    action = String(form.get("action"));
  if (!["completed", "snooze"].includes(action))
    throw new Error("Choose a valid follow-up action.");
  let next: null | string = null;
  if (action === "snooze") {
    const days = Number(form.get("days") || 3);
    if (![1, 3, 7, 14].includes(days))
      throw new Error("Choose a valid snooze period.");
    const d = new Date(`${todayISO()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    next = d.toISOString().slice(0, 10);
  }
  const { error: historyError } = await s
    .from("follow_up_history")
    .insert({ user_id: user.id, quote_id: quoteId, action, notes: null });
  if (historyError) throw new Error("The follow-up could not be recorded.");
  const { error } = await s
    .from("quotes")
    .update({ next_follow_up_date: next, status: "Pending" })
    .eq("id", quoteId);
  if (error) throw new Error("The next follow-up date could not be updated.");
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}
export async function completeJob(form: FormData) {
  const { s } = await owned();
  const { error } = await s
    .from("quotes")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", String(form.get("id")))
    .eq("status", "Won");
  if (error) throw new Error("The job could not be marked as completed.");
  revalidatePath("/quotes");
}
export async function saveSettings(form: FormData) {
  const { s, user } = await owned();
  const schedule = String(form.get("follow_up_schedule"))
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (!schedule.length) throw new Error("Enter at least one follow-up day.");
  if (schedule.length > 10 || schedule.some((day) => day > 365))
    throw new Error("Use up to 10 follow-up days between 1 and 365.");
  const parsed = settingsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check your settings.");
  let logoUrl = String(form.get("existing_logo_url") || "") || null;
  const logo = form.get("logo");
  if (logo instanceof File && logo.size) {
    if (logo.size > 2097152)
      throw new Error("Your logo must be smaller than 2 MB.");
    if (!["image/png", "image/jpeg", "image/webp"].includes(logo.type))
      throw new Error("Use a PNG, JPG or WebP logo.");
    const bytes = new Uint8Array(await logo.arrayBuffer());
    const validPng = logo.type === "image/png" && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const validJpeg = logo.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const validWebp = logo.type === "image/webp" && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!validPng && !validJpeg && !validWebp) throw new Error("The selected file is not a valid image.");
    const ext = validPng ? "png" : validJpeg ? "jpg" : "webp";
    const path = `${user.id}/logo.${ext}`;
    const { error } = await s.storage
      .from("business-logos")
      .upload(path, logo, { upsert: true, contentType: logo.type });
    if (error) throw new Error("Your logo could not be uploaded.");
    logoUrl = path;
  }
  const row = {
    user_id: user.id,
    business_name: parsed.data.business_name,
    user_name: parsed.data.user_name,
    telephone: parsed.data.telephone,
    google_review_link: parsed.data.google_review_link,
    follow_up_message: parsed.data.follow_up_message,
    review_request_message: parsed.data.review_request_message,
    follow_up_schedule: schedule,
    logo_url: logoUrl,
    business_address: parsed.data.business_address,
    business_email: parsed.data.business_email,
    vat_registered: form.get("vat_registered") === "on",
    vat_number: parsed.data.vat_number,
    default_vat_rate: parsed.data.default_vat_rate,
    default_payment_terms: parsed.data.default_payment_terms,
    default_terms_and_conditions: parsed.data.default_terms_and_conditions,
    default_quote_validity_days: parsed.data.default_quote_validity_days,
  };
  const { error } = await s
    .from("user_settings")
    .upsert(row, { onConflict: "user_id" });
  if (error) throw new Error("Your settings could not be saved. Please try again.");
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
