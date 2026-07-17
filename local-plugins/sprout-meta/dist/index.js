import { registerPlugin } from '@capacitor/core';

// Web/no-op implementation: every method resolves silently so the app runs
// unchanged in the browser build (and on any platform without the native side).
export const SproutMeta = registerPlugin('SproutMeta', {
  web: () => ({
    initialize: async () => undefined,
    setAdvertiserTrackingEnabled: async () => undefined,
    logEvent: async () => undefined,
  }),
});
