"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/app/(auth)/actions";
export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "login" | "register" | "reset";
  action: (s: AuthState, f: FormData) => Promise<AuthState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={() => {
        if (
          mode === "register" &&
          process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
        )
          window.quoteChaserAnalytics?.("signup_started");
      }}
      className="mt-7 space-y-4"
    >
      {mode === "login" && <input type="hidden" name="next" value={next || ""} />}
      {mode === "register" && (
        <label>
          <span className="label">Your name</span>
          <input className="field" name="name" autoComplete="name" required />
        </label>
      )}
      <label>
        <span className="label">Email address</span>
        <input
          className="field"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      {mode !== "reset" && (
        <label>
          <span className="label">Password</span>
          <input
            className="field"
            name="password"
            type="password"
            minLength={mode === "register" ? 10 : 8}
            maxLength={128}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
          />
        </label>
      )}
      <input
        type="hidden"
        name="origin"
        value={typeof location !== "undefined" ? location.origin : ""}
      />
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm font-bold text-green-800"
        >
          {state.message}
        </p>
      )}
      <button disabled={pending} className="btn btn-primary w-full">
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : mode === "register"
              ? "Create account"
              : "Send reset link"}
      </button>
      {mode === "login" && (
        <div className="flex justify-between text-sm">
          <Link href="/register" className="font-bold text-teal-700">
            Create account
          </Link>
          <Link href="/forgot-password" className="font-bold text-teal-700">
            Forgot password?
          </Link>
        </div>
      )}
    </form>
  );
}
