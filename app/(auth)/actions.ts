"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { captureServerEvent } from "@/lib/analytics";
export type AuthState = { error?: string; message?: string };
export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const s = await createClient();
  const { data, error } = await s.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return { error: "Email or password not recognised." };
  await captureServerEvent(data.user.id, "user_login");
  redirect("/dashboard");
}
export async function register(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const password = String(form.get("password"));
  if (password.length < 8)
    return { error: "Use at least 8 characters for your password." };
  const s = await createClient();
  const { data, error } = await s.auth.signUp({
    email: String(form.get("email")),
    password,
    options: { data: { name: String(form.get("name")) } },
  });
  if (error) return { error: error.message };
  if (data.user) await captureServerEvent(data.user.id, "signup_completed");
  return {
    message: "Check your email to confirm your account, then log in.",
  };
}
export async function resetPassword(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const email = String(form.get("email") || "").trim();
  if (!email)
    return { error: "Enter the email address used for your account." };
  const s = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await s.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
  });
  if (error) {
    if (error.message.toLowerCase().includes("rate"))
      return {
        error:
          "Too many reset attempts. Wait a few minutes, then try once more.",
      };
    return {
      error: `Supabase could not send the reset email: ${error.message}`,
    };
  }
  return {
    message:
      "Reset email requested. Check your inbox and junk folder; the link may take a minute to arrive.",
  };
}
export async function logout() {
  const s = await createClient();
  await s.auth.signOut();
  redirect("/login");
}
