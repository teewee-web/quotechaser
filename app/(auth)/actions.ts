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
  const requested = String(form.get("next") || "");
  const destination = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
  redirect(destination);
}
export async function register(
  _: AuthState,
  form: FormData,
): Promise<AuthState> {
  const password = String(form.get("password"));
  const email = String(form.get("email") || "").trim().toLowerCase();
  const name = String(form.get("name") || "").trim();
  if (name.length < 2 || name.length > 200) return { error: "Enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) return { error: "Enter a valid email address." };
  if (password.length < 10 || password.length > 128)
    return { error: "Use between 10 and 128 characters for your password." };
  const s = await createClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const { data, error } = await s.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard` },
  });
  if (error) return { error: "We could not create the account. Check the details or try again shortly." };
  if (data.user) await captureServerEvent(data.user.id, "registration_completed", {}, { once: true });
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
    return { error: "The reset email could not be sent. Please try again shortly." };
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
