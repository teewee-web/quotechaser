import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Log in to QuoteAlign or create your account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
