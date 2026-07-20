# Quote-Chaser production analytics runbook

## Canonical funnel

Use the same ordered funnel in GA4 Explorations and PostHog Insights:

`page_view` / `$pageview` on the landing page â†’ `registration_completed` â†’ `first_customer_created` â†’ `first_quote_created` â†’ `first_follow_up_completed` â†’ `checkout_started` â†’ `subscription_activated`

Do not publish a conversion rate until all seven steps have real production events. Web Vitals are operational telemetry and must be excluded from this product funnel and default product reports.

## Required production configuration

- Vercel: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-00TVPH4PER`, `GA4_API_SECRET`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`, `POSTHOG_SERVER_ANALYTICS_ENABLED=true`, and the existing Sentry variables. Do not set these production values for Preview or Development.
- GA4: add the six milestone events as key events where required; create the ordered exploration above; add an internal-traffic rule only for stable office/developer IPs. Debug locally with `NEXT_PUBLIC_ANALYTICS_DEBUG=true`; this logs sanitized events and sends nothing.
- PostHog: create the ordered funnel above, filter host to `quote-chaser.com`, exclude Web Vitals from default insights, and keep session replay input masking enabled. Existing legacy/test events remain historical data and should be excluded with a date boundary or hostname filter.
- Clarity: sign in again and explicitly approve Google account access, then verify consent mode and mask all text/input content before enabling authenticated-page recordings. No Clarity code should be added until this manual privacy verification is complete.
- Sentry: keep `sendDefaultPii=false`, production-only SDK enablement, 10% traces, and source-map upload via `SENTRY_AUTH_TOKEN`. Alert on browser/server/API, authentication, Stripe webhook, and PDF failures; filter known browser-extension noise only after confirming its fingerprint.

## Exact production test plan

Use a brand-new test account and select **Allow analytics**. Do not use an internal/test browser cookie.

1. Open `https://quote-chaser.com` in a normal browser. Confirm one GA4 `page_view` in DebugView/Realtime and one PostHog `$pageview`; navigate client-side and confirm exactly one new page view.
2. Register and confirm one `registration_completed` in both tools.
3. Create the first customer, refresh, and navigate back. Confirm one `first_customer_created` only.
4. Create the first quote, refresh, and edit it. Confirm one `first_quote_created` only.
5. Complete a follow-up, refresh, and complete another. Confirm one `first_follow_up_completed` only.
6. Start a real Stripe Checkout and confirm `checkout_started` appears only after Stripe returns a session URL.
7. Complete Checkout. Confirm `subscription_activated` appears only after an active/trialing Stripe subscription webhook. Replay the webhook and confirm no duplicate event.
8. Confirm one consented PostHog recording exists and that all inputs, customer data, contact details, quote amounts, and sensitive account content are masked.
9. In GA4 and PostHog, search for `localhost`, `127.0.0.1`, `vercel.app`, `quotalign.com`, `www.quotalign.com`, and `www.quote-chaser.com`; confirm no events from this release.
10. Decline analytics in a fresh browser and repeat a page load. Confirm GA4, PostHog, and session replay send no analytics requests.
