import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const results = await Promise.all([
    supabase.from("profiles").select("id,email,created_at,updated_at").eq("id", user.id).maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("customers").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("quotes").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("quote_items").select("*").eq("user_id", user.id).order("sort_order"),
    supabase.from("follow_up_history").select("*").eq("user_id", user.id).order("created_at"),
  ]);
  if (results.some((result) => result.error)) return NextResponse.json({ error: "Your export could not be prepared. Please try again." }, { status: 500 });
  const [profile, settings, customers, quotes, items, history] = results;
  const payload = { exported_at: new Date().toISOString(), account: profile.data, settings: settings.data, customers: customers.data, quotes: quotes.data, quote_items: items.data, follow_up_history: history.data };
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="quote-chaser-export-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
}
