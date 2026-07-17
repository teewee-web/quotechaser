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
3. In the Supabase SQL editor, run `supabase/migrations/202607140001_initial_schema.sql` in full, followed by `supabase/migrations/202607140002_pdf_quotes.sql`.
4. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/**` as a redirect URL.
5. Copy `.env.example` to `.env.local` and enter the project URL and publishable/anon key from **Project Settings → API**. Never add the service-role key.
6. Run:

   ```bash
   npm install
   npm run dev
   ```

7. Open `http://localhost:3000`, create an account and confirm it from the email Supabase sends.

To add demo data, first create a user, copy their UUID from **Authentication → Users**, replace the all-zero UUID in `supabase/seed.sql`, then run that file in the SQL editor.

## Supabase setup details

The migrations create the application tables, quote items, numbering triggers, indexes, update triggers, a new-user profile/settings trigger, grants and RLS policies. The PDF migration also creates the private `business-logos` Storage bucket, limits uploads to 2 MB PNG/JPG/WebP files, and restricts every logo path to its authenticated owner. Do not make this bucket public.

Existing quotes are preserved. The PDF migration assigns them a permanent quote number and expiry date, while the application treats their original total as a single line item until they are edited.

## Test the PDF quotation feature

1. Apply both migrations and restart the app.
2. Open **Settings**, add the business contact details and optionally upload a logo, then save.
3. Create or edit a quote, add several items, choose discount/VAT settings and save it.
4. Select **Create PDF Quote** from the Quotes page.
5. Check the preview, then test Download PDF, Print, Email, WhatsApp and Share on a phone.

No additional environment variables are required for PDF quotations or private logo uploads.

For production authentication, set **Authentication → URL Configuration → Site URL** to the final HTTPS domain and add `https://your-domain.example/**` to Redirect URLs. Configure a custom SMTP provider before launch so confirmation/reset delivery is dependable and branded. Keep email confirmation enabled.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy to Vercel

1. Push the project to a Git repository and import it at Vercel.
2. Keep Framework Preset as **Next.js** and leave build command as `npm run build`.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, Preview and Development in **Project Settings → Environment Variables**.
4. Deploy and copy the assigned HTTPS URL.
5. Add that URL as the Supabase Site URL and add `<vercel-url>/**` to Authentication redirect URLs. Add the custom domain in both services if used.
6. Redeploy after changing environment variables, then verify registration, confirmation, login and password reset on the production domain.

No database or service-role secrets are required by the browser or Vercel build.

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
- The monthly report treats the quote's last update month as its won month. A dedicated status-event table would preserve the exact win date across later edits in a future version.
- The PWA provides an installable shell and basic offline fallback; authenticated records require connectivity to Supabase.
