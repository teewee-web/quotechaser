import * as Sentry from "@sentry/nextjs";
Sentry.init({ dsn: "https://a8216d5e1a38e5b7192826c43c4ff190@o4511768301010944.ingest.de.sentry.io/4511768307499088", enabled: process.env.VERCEL_ENV === "production", environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV, sendDefaultPii: false, tracesSampleRate: 0.1, enableLogs: true });
