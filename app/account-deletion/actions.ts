"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deleteOwnAccount(form: FormData) {
  const confirmation = String(form.get("confirmation") || "");
  const password = String(form.get("password") || "");
  if (confirmation !== "DELETE") throw new Error("Type DELETE exactly to confirm.");
  if (!password) throw new Error("Enter your password to confirm your identity.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Please log in again before deleting your account.");
  const { error: authenticationError } = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (authenticationError) throw new Error("The password was not correct. Your account was not deleted.");
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw new Error("Your account could not be deleted. Please contact support.");
  await supabase.auth.signOut();
  redirect("/?account_deleted=1");
}
