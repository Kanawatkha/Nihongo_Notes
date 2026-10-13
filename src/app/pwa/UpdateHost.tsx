import { useCallback, useEffect, useRef, useState } from 'react';
import { Toast } from '@/components/ui/Toast';
import { UI_TEXT } from '@/config/site';
import { registerServiceWorker, type RegisterServiceWorker } from './registerServiceWorker';
import {
  clearReadingPosition,
  peekReadingPosition,
  restoreScroll,
  saveReadingPosition,
} from './readingPosition';

/** How often an open tab asks the server whether a new version exists. */
export const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const TOAST_MS = 3500;

type UpdateHostProps = {
  /** Injection points for tests. */
  register?: RegisterServiceWorker;
  reload?: () => void;
};

const reloadPage = () => window.location.reload();

/**
 * Registers the service worker and keeps the site up to date with no button to press:
 * it checks for a new version every 30 minutes and whenever the tab becomes visible or the
 * network returns. When a new version takes over, the page reloads itself and goes back to the
 * same reading position, then a short toast says so.
 */
export function UpdateHost({
  register = registerServiceWorker,
  reload = reloadPage,
}: UpdateHostProps) {
  // Position saved just before an automatic update reload, if this load is the one after it
  const [afterUpdate] = useState(peekReadingPosition);
  const [message, setMessage] = useState<string | null>(
    afterUpdate === null ? null : UI_TEXT.updated,
  );
  const timer = useRef<number | undefined>(undefined);

  const showMessage = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), TOAST_MS);
  }, []);

  useEffect(() => {
    // Came back from an automatic update: put the reader back where they were; the toast is
    // already showing and hides itself
    if (afterUpdate !== null) {
      clearReadingPosition();
      restoreScroll(afterUpdate);
      timer.current = window.setTimeout(() => setMessage(null), TOAST_MS);
    }

    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => {
      if (registration && navigator.onLine) void registration.update().catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };

    register({
      onNeedReload: () => {
        saveReadingPosition();
        reload();
      },
      onOfflineReady: () => {
        showMessage(UI_TEXT.offlineReady);
      },
      onRegistered: (value) => {
        registration = value;
      },
    });

    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', checkForUpdate);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', checkForUpdate);
    };
  }, [afterUpdate, register, reload, showMessage]);

  return <Toast message={message} />;
}
