import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = new Set(["/", "/privacy", "/terms", "/contact", "/support", "/account-deletion", "/open-app", "/sitemap.xml", "/robots.txt", "/api/account/export"]);

export async function middleware(request: NextRequest) {
  if (request.nextUrl.hostname === "www.quote-chaser.com") {
    const canonical = request.nextUrl.clone();
    canonical.protocol = "https:";
    canonical.host = "quote-chaser.com";
    return NextResponse.redirect(canonical, 308);
  }
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  if (publicRoutes.has(pathname)) return response;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(items) { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password");
  if (!user && !isAuth && !publicRoutes.has(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = "/login";
    target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  }
  if (user && isAuth) {
    const target = request.nextUrl.clone();
    target.pathname = "/dashboard";
    target.search = "";
    return NextResponse.redirect(target);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };
