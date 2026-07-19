"use server";
import { saveQuote } from "@/app/(app)/actions";
import { customerSchema, parseQuoteItems, quoteSchema } from "@/lib/validation";

export async function saveCustomerAndQuote(form: FormData) {
  parseQuoteItems(form.get("items_json"));
  const quoteCandidate = Object.fromEntries(form);
  if (form.get("customer_mode") === "new") quoteCandidate.customer_id = "00000000-0000-0000-0000-000000000000";
  const quote = quoteSchema.safeParse(quoteCandidate);
  if (!quote.success) throw new Error(quote.error.issues[0]?.message || "Check the quote details.");
  if (form.get("customer_mode") === "new" && !form.get("id")) {
    const parsed = customerSchema.safeParse({
      name: form.get("new_customer_name"),
      mobile: form.get("new_customer_mobile"),
      email: form.get("new_customer_email"),
      address: form.get("new_customer_address"),
      notes: "",
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  }
  return saveQuote(form);
}
