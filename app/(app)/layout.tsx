import { Nav } from "@/components/nav";
import "./workspace.css";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <><Nav /><main className="mx-auto max-w-[1440px] px-4 pb-28 pt-7 sm:px-7 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-10">{children}</main></>;
}
