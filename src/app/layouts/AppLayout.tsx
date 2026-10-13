import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UpdateHost } from '@/app/pwa/UpdateHost';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/Skeleton';

/** True when a service worker already controls this page, so the site works offline. */
function alreadyOffline(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller);
}

/** Shell around every page: skip link, navbar, main, footer. Focus moves to main on navigation. */
export function AppLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [offlineReady, setOfflineReady] = useState(alreadyOffline);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* A button, not an anchor: a #fragment link would change the hash route */}
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="type-button sr-only z-50 rounded-sm bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        ข้ามไปยังเนื้อหา
      </button>
      <Navbar />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Suspense
          fallback={
            <PageContainer>
              <Skeleton />
            </PageContainer>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer offlineReady={offlineReady} />
      <UpdateHost onOfflineReadyChange={setOfflineReady} />
    </div>
  );
}
