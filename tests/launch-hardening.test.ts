import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/202607180004_atomic_quotes_and_delivery.sql", "utf8");

describe("launch hardening migration", () => {
  it("protects delivery records with RLS", () => {
    expect(sql).toContain("alter table public.quote_delivery_events enable row level security");
    expect(sql).toContain("(select auth.uid()) = user_id");
    expect(sql).toContain("revoke all on public.quote_delivery_events from anon");
  });

  it("uses one database function for customer, quote and item writes", () => {
    expect(sql).toContain("function public.save_quote_transaction");
    expect(sql).toContain("security invoker");
    expect(sql).toContain("delete from public.quote_items");
    expect(sql).toContain("insert into public.quote_items");
  });

  it("does not expose the transaction to anonymous visitors", () => {
    expect(sql).toContain("revoke all on function public.save_quote_transaction(jsonb,jsonb,uuid,jsonb) from public, anon");
    expect(sql).toContain("grant execute on function public.save_quote_transaction(jsonb,jsonb,uuid,jsonb) to authenticated");
  });
});
