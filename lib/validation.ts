import { z } from "zod";

const optionalEmail = z.union([
  z.literal(""),
  z.string().trim().email("Enter a valid email address").max(320),
]);

const optionalHttpUrl = z.union([
  z.literal(""),
  z.string().trim().url("Enter a full web address").max(2048).refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Use a web address beginning with https://",
  ),
]);

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name").max(200),
  mobile: z.string().trim().max(30),
  email: optionalEmail,
  address: z.string().trim().max(500),
  notes: z.string().trim().max(2000),
});

export const quoteItemSchema = z.object({
  description: z.string().trim().min(1, "Each item needs a description").max(1000),
  quantity: z.coerce.number().positive().max(100000),
  unitPricePence: z.coerce.number().int().min(0).max(1_000_000_000),
  sortOrder: z.coerce.number().int().min(0).max(99).optional(),
});

export const quoteItemsSchema = z.array(quoteItemSchema).max(100, "A quote can contain up to 100 items");

export const quoteSchema = z.object({
  customer_id: z.string().uuid("Choose a customer"),
  job_description: z.string().trim().max(5000).transform((value) => value || "Quoted work"),
  value: z.coerce.number().positive("Add at least one item with a value greater than £0").max(10_000_000),
  quote_date: z.string().date(),
  expiry_date: z.union([z.literal(""), z.string().date()]),
  status: z.enum(["Draft", "Sent", "Pending", "Won", "Lost"]),
  next_follow_up_date: z.union([z.literal(""), z.string().date()]),
  notes: z.string().trim().max(5000),
  discount_type: z.enum(["fixed", "percentage"]),
  discount_value: z.coerce.number().min(0).max(10_000_000),
  vat_enabled: z.string().optional(),
  vat_rate: z.coerce.number().min(0).max(100),
  payment_terms: z.string().trim().max(3000),
  terms_and_conditions: z.string().trim().max(10000),
}).superRefine((value, context) => {
  if (value.discount_type === "percentage" && value.discount_value > 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["discount_value"], message: "A percentage discount cannot exceed 100%" });
  }
  if (value.expiry_date && value.expiry_date < value.quote_date) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["expiry_date"], message: "The expiry date cannot be before the quote date" });
  }
});

export const settingsSchema = z.object({
  business_name: z.string().trim().max(200),
  user_name: z.string().trim().max(200),
  telephone: z.string().trim().max(30),
  google_review_link: optionalHttpUrl,
  follow_up_message: z.string().trim().min(1).max(3000),
  review_request_message: z.string().trim().min(1).max(3000),
  business_address: z.string().trim().max(1000),
  business_email: optionalEmail,
  vat_number: z.string().trim().max(30),
  default_vat_rate: z.coerce.number().min(0).max(100),
  default_payment_terms: z.string().trim().max(3000),
  default_terms_and_conditions: z.string().trim().max(10000),
  default_quote_validity_days: z.coerce.number().int().min(1).max(365),
});

export function parseQuoteItems(value: FormDataEntryValue | null) {
  let raw: unknown;
  try {
    raw = JSON.parse(String(value || "[]"));
  } catch {
    throw new Error("The quote items could not be read.");
  }
  const parsed = quoteItemsSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check the quote items.");
  return parsed.data;
}
