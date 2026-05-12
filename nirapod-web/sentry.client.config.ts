import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Only initialize when DSN is set — no-ops gracefully if blank
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false })],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
