# Quote-Chaser

Quote-Chaser is a production-oriented, mobile-first quote follow-up application for UK tradespeople. It uses Next.js App Router, TypeScript, Tailwind CSS and Supabase, with installable PWA support and Vercel-compatible deployment.

## Features

- Email registration, login, confirmation and password reset
- Per-user customers, quotes, settings and follow-up history protected by Supabase Row Level Security
- Dashboard metrics, due/overdue/upcoming follow-ups, call and pre-filled `wa.me` links
- Quote win/loss, job completion and Google review request workflow
- Professional PDF quotations with line items, VAT, discounts, permanent quote numbers, preview, download, print and sharing
- Search, status filtering, reporting and UK-localised dates/currency
- Responsive navigation, accessible forms, loading/empty/error states and destructive-action confirmation

## Local setup

1. Install Node.js 20 or later.
2. Create a Supabase project.
3. In the Supabase SQL editor, run every SQL file in `supabase/migrations` in filename order. These include the initial schema, PDF quotes, launch security hardening, complete account deletion and scalable dashboard/report metrics.
4. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/**` as a redirect URL.
5. Copy `.env.example` to `.env.local` and enter the project URL and publishable/anon key from **Project Settings → API**. Never add the service-role key. To enable analytics, also add the PostHog project token and regional ingestion host from your PostHog project settings.
6. Run:

   ```bash
   npm install
   npm run dev
   ```

7. Open `http://localhost:3000`, create an account and confirm it from the email Supabase sends.

To add demo data, first create a user, copy their UUID from **Authentication → Users**, replace the all-zero UUID in `supabase/seed.sql`, then run that file in the SQL editor.

## Supabase setup details

The migrations create the application tables, quote items, numbering triggers, indexes, update triggers, a new-user profile/settings trigger, grants and RLS policies. They also create the private `business-logos` Storage bucket, restrict every logo path to its authenticated owner, add bounded database constraints, revoke unnecessary function permissions and provide tenant-safe reporting functions. Do not make the logo bucket public.

Existing quotes are preserved. The PDF migration assigns them a permanent quote number and expiry date, while the application treats their original total as a single line item until they are edited.

## Test the PDF quotation feature

1. Apply both migrations and restart the app.
2. Open **Settings**, add the business contact details and optionally upload a logo, then save.
3. Create or edit a quote, add several items, choose discount/VAT settings and save it.
4. Select **Create PDF Quote** from the Quotes page.
5. Check the preview, then test Download PDF, Print, Email, WhatsApp and Share on a phone.

No additional environment variables are required for PDF quotations or private logo uploads.

For production authentication, set **Authentication → URL Configuration → Site URL** to the final HTTPS domain and add `https://your-domain.example/**` to Redirect URLs. Configure a custom SMTP provider before launch so confirmation/reset delivery is dependable and branded. Keep email confirmation enabled.

The canonical production identity is **Quote-Chaser**, using `https://quote-chaser.com` and `support@quote-chaser.com`. Branded Supabase authentication templates are stored in `supabase/templates`. Hosted Supabase projects only allow template editing after custom SMTP is configured: open **Authentication → Emails → SMTP Settings**, connect the verified `quote-chaser.com` sender, then paste the matching template into **Authentication → Emails → Templates**. Use these subjects:

- Confirmation: `Confirm your Quote-Chaser account`
- Password recovery: `Reset your Quote-Chaser password`
- Email change: `Confirm your new Quote-Chaser email address`
- Password changed notification: `Your Quote-Chaser password was changed`

Do not use an unverified support address as the SMTP sender. Confirm that `support@quote-chaser.com` can receive replies before enabling it in production.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Authenticated users can download a JSON copy of their account information from `/api/account/export`. The `/account-deletion` page provides password-confirmed permanent deletion, including private logo storage. Public support is available at `/support`.

## Deploy to Vercel

1. Push the project to a Git repository and import it at Vercel.
2. Keep Framework Preset as **Next.js** and leave build command as `npm run build`.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` for Production, Preview and Development in **Project Settings → Environment Variables**.
4. Deploy and copy the assigned HTTPS URL.
5. Add that URL as the Supabase Site URL and add `<vercel-url>/**` to Authentication redirect URLs. Add the custom domain in both services if used.
6. Redeploy after changing environment variables, then verify registration, confirmation, login and password reset on the production domain.

No database or service-role secrets are required by the browser or Vercel build.

## PostHog analytics

Create a PostHog project in the EU region, then copy its project token and ingestion host into `.env.local` and Vercel. The integration records `signup_started`, `signup_completed`, `user_login`, `customer_created`, `quote_created` and `pdf_generated`. It identifies signed-in users by their Supabase UUID only. Customer details, quote contents and monetary values are never attached to analytics events. Autocapture, session recording and persistent analytics cookies are disabled.

## Project structure

```text
app/                    App Router pages, layouts, server actions and auth callback
components/             Shared navigation, forms, buttons and UI states
lib/                    Formatting, validation, types and Supabase clients
public/                 PWA manifest, service worker and application icon
supabase/migrations/    Versioned schema, triggers, grants and RLS policies
supabase/seed.sql       Opt-in demo records for a chosen test user
tests/                  Formatting, template and validation unit tests
```

## Current limitations

- Version one opens WhatsApp using `wa.me`; it does not send messages or confirm delivery.
- Follow-ups are in-app tasks. Push notifications, SMS and background emails are not included.
- Monthly reporting uses the dedicated `won_at` timestamp, so later quote edits do not move historic wins into another month.
- The PWA provides an installable shell and basic offline fallback; authenticated records require connectivity to Supabase.
- Stripe Checkout starts Quote-Chaser Pro with a 7-day free trial before the £9.99 monthly subscription begins. Webhooks keep subscription status in Supabase.
