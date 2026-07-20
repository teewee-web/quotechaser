import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ saved: false }, { status: 401 });
  const body = await request.json().catch(() => null) as { consent?: string } | null;
  if (!body || !["granted", "denied"].includes(body.consent || "")) return NextResponse.json({ saved: false }, { status: 400 });
  const { error } = await supabase.from("analytics_preferences").upsert({ user_id: user.id, consent: body.consent }, { onConflict: "user_id" });
  return error ? NextResponse.json({ saved: false }, { status: 500 }) : NextResponse.json({ saved: true });
}
