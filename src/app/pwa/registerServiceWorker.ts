import { registerSW } from 'virtual:pwa-register';

export type PwaHandlers = {
  /** A new version is active; the page should reload to use it. */
  onNeedReload: () => void;
  /** Everything is cached for the first time. */
  onOfflineReady: () => void;
  /** The registration, for later update checks. */
  onRegistered: (registration: ServiceWorkerRegistration | undefined) => void;
};

export type RegisterServiceWorker = (handlers: PwaHandlers) => void;

/** The only place that touches the generated service worker module. */
export const registerServiceWorker: RegisterServiceWorker = (handlers) => {
  registerSW({
    immediate: true,
    onNeedReload: handlers.onNeedReload,
    onOfflineReady: handlers.onOfflineReady,
    onRegisteredSW: (_url, registration) => handlers.onRegistered(registration),
  });
};
