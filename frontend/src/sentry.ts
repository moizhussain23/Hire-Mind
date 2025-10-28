import * as Sentry from "@sentry/react";

export const initSentry = () => {
  // Only initialize in production or if explicitly enabled
  const shouldInit = import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true';
  
  if (!shouldInit) {
    console.log('🔍 Sentry disabled in development');
    return;
  }

  Sentry.init({
    dsn: "https://12601a5b91e3dac0ac59520860d2137f@o4510135265656832.ingest.us.sentry.io/4510135285776384",
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  });

  console.log('🔍 Sentry error tracking enabled');
};

// Helper function to manually capture errors
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// Helper function to capture messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Helper function to set user context
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

// Helper function to clear user context
export const clearUser = () => {
  Sentry.setUser(null);
};
