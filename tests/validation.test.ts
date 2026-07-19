import { describe, expect, it } from "vitest";
import { customerSchema, parseQuoteItems, quoteSchema, settingsSchema } from "../lib/validation";

const validQuote = {
  customer_id: "4eebf843-3996-4fbd-9ba0-32498c575b21",
  job_description: "Paint room",
  value: 100,
  quote_date: "2026-07-14",
  expiry_date: "2026-08-13",
  status: "Sent",
  next_follow_up_date: "",
  notes: "",
  discount_type: "fixed",
  discount_value: 0,
  vat_rate: 20,
  payment_terms: "",
  terms_and_conditions: "",
};

describe("customer validation", () => {
  it("requires a useful name", () => expect(customerSchema.safeParse({ name: "A", mobile: "", email: "", address: "", notes: "" }).success).toBe(false));
  it("rejects oversized names", () => expect(customerSchema.safeParse({ name: "A".repeat(201), mobile: "", email: "", address: "", notes: "" }).success).toBe(false));
  it("accepts a minimal customer", () => expect(customerSchema.safeParse({ name: "Al Brown", mobile: "", email: "", address: "", notes: "" }).success).toBe(true));
});

describe("quote validation", () => {
  it("rejects zero value", () => expect(quoteSchema.safeParse({ ...validQuote, value: 0 }).success).toBe(false));
  it("rejects expiry before quote date", () => expect(quoteSchema.safeParse({ ...validQuote, expiry_date: "2026-07-13" }).success).toBe(false));
  it("rejects percentage discounts over 100", () => expect(quoteSchema.safeParse({ ...validQuote, discount_type: "percentage", discount_value: 101 }).success).toBe(false));
  it("accepts a complete quote", () => expect(quoteSchema.safeParse(validQuote).success).toBe(true));
});

describe("quote item validation", () => {
  it("rejects more than 100 items", () => expect(() => parseQuoteItems(JSON.stringify(Array.from({ length: 101 }, () => ({ description: "Work", quantity: 1, unitPricePence: 100 }))))).toThrow());
  it("rejects malformed JSON", () => expect(() => parseQuoteItems("{")) .toThrow("could not be read"));
});

describe("settings validation", () => {
  const settings = { business_name: "Business", user_name: "User", telephone: "", google_review_link: "", follow_up_message: "Hello", review_request_message: "Thanks", business_address: "", business_email: "", vat_number: "", default_vat_rate: 20, default_payment_terms: "", default_terms_and_conditions: "", default_quote_validity_days: 30 };
  it("rejects non-web review links", () => expect(settingsSchema.safeParse({ ...settings, google_review_link: "javascript:alert(1)" }).success).toBe(false));
  it("accepts safe settings", () => expect(settingsSchema.safeParse(settings).success).toBe(true));
});
