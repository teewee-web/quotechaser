import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://quote-chaser.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/customers", "/quotes", "/follow-ups", "/reports", "/settings", "/api", "/auth"] }], sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl };
}
